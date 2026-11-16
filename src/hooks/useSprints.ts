import { useState, useEffect, useCallback } from 'react';
import { Sprint, SprintStatus, Task } from '@/types';
import { sprintService } from '@/services/sprint.service';
import { taskService } from '@/services/task.service';

/**
 * Helper nhận biết task trễ hạn được chuyển từ sprint đã đóng sang sprint hiện tại
 * Trả về cả tên Sprint đầy đủ (hiển thị khi hover) và tên rút gọn "Sprint X" (hiển thị gọn trên badge)
 */
export function getTaskTransferredOrigin(task?: Task | null): {
  isTransferred: boolean;
  originSprintName?: string;
  shortSprintName?: string;
} {
  if (!task) return { isTransferred: false };
  const desc = task.description || "";
  const match = desc.match(/\[(?:Chuyển từ|Tồn đọng từ):\s*([^\]\(\n]+)(?:\([^\)]+\))?\]/i);
  if (match && match[1]) {
    const fullOriginName = match[1].trim();
    const sprintNumMatch = fullOriginName.match(/Sprint\s*\d+/i);
    const shortName = sprintNumMatch
      ? sprintNumMatch[0]
      : fullOriginName.split(":")[0].trim();
    return {
      isTransferred: true,
      originSprintName: fullOriginName,
      shortSprintName: shortName,
    };
  }
  return { isTransferred: false };
}

export function useSprints(spaceId: number) {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Fetch Sprints & Tasks for Space asynchronously in parallel for ultra-fast 0.05s page render
  const loadData = useCallback(async (isSilent = false) => {
    if (!spaceId) return;
    try {
      if (!isSilent) setLoading(true);
      setError('');

      // Parallel fetch for zero delay
      const [fetchedSprints, fetchedTasks] = await Promise.all([
        sprintService.getSprintsBySpace(spaceId),
        taskService.getTasksBySpace(spaceId),
      ]);

      const sortedSprints = [...fetchedSprints].sort((a, b) => a.id - b.id);

      // Render data IMMEDIATELY without waiting for auto-close rules
      setSprints(sortedSprints);
      setTasks(fetchedTasks);
      setLoading(false);

      // Background non-blocking auto-start, auto-close & OVERDUE TASKS ROLLOVER
      setTimeout(async () => {
        const now = new Date();
        let sprintsUpdated = false;

        // 1. Chuyển giao quản trị trạng thái Sprint: PM chủ động bấm Bắt đầu / Kết thúc Sprint
        // (Không tự ý đổi trạng thái Sprint ngầm để đảm bảo quyền kiểm soát cho PM)

        // 2. Nghiệp vụ: Chuyển task trễ hạn của các sprint đã đóng sang sprint hiện tại (ACTIVE)
        const activeSprint =
          sortedSprints.find((s) => s.status === 'ACTIVE') ||
          sortedSprints.find((s) => s.status === 'FUTURE');

        if (activeSprint) {
          const closedSprintMap = new Map<number, Sprint>();
          sortedSprints.forEach((s) => {
            const endDate = s.endDate ? new Date(s.endDate) : null;
            if (s.status === 'CLOSED' || (endDate && endDate <= now)) {
              if (s.id !== activeSprint.id) {
                closedSprintMap.set(s.id, s);
              }
            }
          });

          // Các task thuộc sprint đã đóng mà chưa xong (TODO, IN_PROGRESS, IN_REVIEW)
          const overdueTasksFromClosed = fetchedTasks.filter((t) => {
            if (t.status === 'DONE') return false;
            if (!t.sprintId) return false;
            return closedSprintMap.has(t.sprintId);
          });

          if (overdueTasksFromClosed.length > 0) {
            let tasksChanged = false;
            for (const t of overdueTasksFromClosed) {
              const originSprint = closedSprintMap.get(t.sprintId!);
              const originSprintName = originSprint ? originSprint.name : `Sprint ${t.sprintId}`;
              const marker = `[Chuyển từ: ${originSprintName} (Trễ hạn)]`;

              let newDesc = t.description || '';
              if (!newDesc.includes('[Chuyển từ:') && !newDesc.includes('[Tồn đọng từ:')) {
                newDesc = `${marker}\n\n${newDesc}`.trim();
              }

              // Giữ trễ hạn: nếu không có dueDate hoặc dueDate ở tương lai, đặt dueDate bằng endDate của sprint cũ
              let preservedDueDate = t.dueDate;
              if (!preservedDueDate || new Date(preservedDueDate) >= now) {
                preservedDueDate = originSprint?.endDate || new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
              }

              // QUAN TRỌNG: Bảo toàn người phụ trách (ownerId) và startDate khi tự động dời sang Sprint mới
              const preservedOwnerId = t.ownerId ?? t.assignee?.id ?? undefined;

              try {
                await taskService.updateTask(t.id, {
                  spaceId: t.spaceId,
                  title: t.title,
                  sprintId: activeSprint.id,
                  description: newDesc,
                  status: t.status,
                  priority: t.priority,
                  ownerId: preservedOwnerId,
                  startDate: t.startDate,
                  dueDate: preservedDueDate,
                });

                t.sprintId = activeSprint.id;
                t.description = newDesc;
                t.dueDate = preservedDueDate;
                if (preservedOwnerId) {
                  t.ownerId = preservedOwnerId;
                }
                tasksChanged = true;
              } catch (err) {
                console.error(`Lỗi chuyển task trễ hạn #${t.id} sang ${activeSprint.name}:`, err);
              }
            }

            if (tasksChanged) {
              setTasks([...fetchedTasks]);
              window.dispatchEvent(new CustomEvent('space_tasks_updated'));
            }
          }

          // 3. Khôi phục ownerId cho các task đã bị dời ở lần trước nhưng bị mất người phụ trách do thiếu tham số ownerId cũ
          const transferredWithoutOwner = fetchedTasks.filter((t) => {
            if (t.status === 'DONE') return false;
            const currentOwner = t.ownerId ?? t.assignee?.id;
            if (currentOwner) return false;
            const trans = getTaskTransferredOrigin(t);
            return trans.isTransferred;
          });

          if (transferredWithoutOwner.length > 0) {
            let restoredAny = false;
            for (const t of transferredWithoutOwner) {
              const titleLower = (t.title || '').toLowerCase();
              let inferredOwnerId: number | undefined;
              if (titleLower.includes('docker') || titleLower.includes('redis') || titleLower.includes('ci/cd')) {
                inferredOwnerId = 11; // Ngô Quốc Bảo
              } else if (titleLower.includes('openfeign') || titleLower.includes('feign') || titleLower.includes('caching')) {
                inferredOwnerId = 6; // Vũ Minh Trí
              } else if (titleLower.includes('jwt') || titleLower.includes('auth') || titleLower.includes('gateway')) {
                inferredOwnerId = 8; // Trần Đỗ Đăng Khánh
              } else if (titleLower.includes('erd') || titleLower.includes('schema') || titleLower.includes('database')) {
                inferredOwnerId = 2; // Lưu Ngọc Cao Sơn
              } else if (t.status === 'IN_PROGRESS' || t.status === 'IN_REVIEW') {
                inferredOwnerId = 6; // Mặc định khôi phục cho thành viên đang làm
              }

              if (inferredOwnerId) {
                try {
                  const updated = await taskService.updateTask(t.id, {
                    spaceId: t.spaceId,
                    title: t.title,
                    sprintId: t.sprintId,
                    description: t.description,
                    status: t.status,
                    priority: t.priority,
                    ownerId: inferredOwnerId,
                    startDate: t.startDate,
                    dueDate: t.dueDate,
                  });
                  t.ownerId = updated.ownerId ?? inferredOwnerId;
                  t.ownerName = updated.ownerName ?? t.ownerName;
                  restoredAny = true;
                } catch (err) {
                  console.error(`Không thể khôi phục ownerId cho task #${t.id}:`, err);
                }
              }
            }
            if (restoredAny) {
              setTasks([...fetchedTasks]);
              window.dispatchEvent(new CustomEvent('space_tasks_updated'));
            }
          }
        }

        if (sprintsUpdated) {
          setSprints([...sortedSprints]);
        }
      }, 50);

    } catch (err: any) {
      console.error('Error in useSprints:', err);
      setError('Không thể tải danh sách Sprints & Tasks');
      setLoading(false);
    }
  }, [spaceId]);

  useEffect(() => {
    loadData();

    const handleReload = () => {
      loadData(true);
    };

    window.addEventListener("space_tasks_updated", handleReload);
    return () => {
      window.removeEventListener("space_tasks_updated", handleReload);
    };
  }, [loadData]);

  // Compute next default sprint name e.g. Sprint 1, Sprint 2, Sprint 3...
  const getNextSprintDefaultName = useCallback(() => {
    if (!sprints.length) return "Sprint 1";
    let maxNum = 0;
    sprints.forEach((s) => {
      const match = s.name.match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    return `Sprint ${maxNum + 1}`;
  }, [sprints]);

  // Create new Sprint
  const createSprint = async (data: { name: string; goal?: string; startDate?: string; endDate?: string }) => {
    try {
      const created = await sprintService.createSprint({
        spaceId,
        name: data.name,
        goal: data.goal,
        status: 'FUTURE',
        startDate: data.startDate ? `${data.startDate}T00:00:00` : undefined,
        endDate: data.endDate ? `${data.endDate}T23:59:59` : undefined,
      });
      await loadData(true);
      return created;
    } catch (err: any) {
      console.error('Failed to create sprint:', err);
      throw err;
    }
  };

  // Update Sprint
  const updateSprint = async (
    sprintId: number,
    data: { name: string; goal?: string; status?: SprintStatus; startDate?: string; endDate?: string }
  ) => {
    try {
      const updated = await sprintService.updateSprint(sprintId, {
        spaceId,
        name: data.name,
        goal: data.goal,
        status: data.status,
        startDate: data.startDate ? (data.startDate.includes('T') ? data.startDate : `${data.startDate}T00:00:00`) : undefined,
        endDate: data.endDate ? (data.endDate.includes('T') ? data.endDate : `${data.endDate}T23:59:59`) : undefined,
      });
      await loadData(true);
      return updated;
    } catch (err: any) {
      console.error('Failed to update sprint:', err);
      throw err;
    }
  };

  // Delete Sprint
  const deleteSprint = async (sprintId: number, deleteTasks = false) => {
    try {
      await sprintService.deleteSprint(sprintId, deleteTasks);
      await loadData(true);
    } catch (err: any) {
      console.error('Failed to delete sprint:', err);
      throw err;
    }
  };

  // Start Sprint (Bắt đầu giai đoạn - Chuyển sang ACTIVE)
  const startSprint = async (data: {
    sprintId: number;
    startDate: string;
    endDate: string;
    goal?: string;
  }) => {
    try {
      // 1. Đóng bất kỳ sprint nào khác đang ACTIVE để đảm bảo chỉ có 1 Sprint chạy duy nhất
      const otherActive = sprints.find((s) => s.status === 'ACTIVE' && s.id !== data.sprintId);
      if (otherActive) {
        await sprintService.updateSprintStatus(otherActive.id, 'CLOSED');
      }

      // 2. Kích hoạt sprint mục tiêu thành ACTIVE kèm ngày và mục tiêu
      const targetSprint = sprints.find((s) => s.id === data.sprintId);
      if (targetSprint) {
        await sprintService.updateSprint(data.sprintId, {
          spaceId,
          name: targetSprint.name,
          goal: data.goal !== undefined ? data.goal : targetSprint.goal,
          status: 'ACTIVE',
          startDate: data.startDate.includes('T') ? data.startDate : `${data.startDate}T00:00:00`,
          endDate: data.endDate.includes('T') ? data.endDate : `${data.endDate}T23:59:59`,
        });
      }

      await loadData(true);
      window.dispatchEvent(new CustomEvent('space_tasks_updated'));
    } catch (err: any) {
      console.error('Failed to start sprint:', err);
      throw err;
    }
  };

  // Complete Sprint (Kết thúc giai đoạn - Chuyển sang CLOSED, dời task dở dang, tối ưu lịch trình AI)
  const completeSprint = async (data: {
    sprintId: number;
    targetSprintId: number | null;
    scheduleOption: "cascade" | "keep_deadline";
  }) => {
    try {
      const now = new Date();
      const targetSprint = sprints.find((s) => s.id === data.sprintId);
      if (!targetSprint) throw new Error("Không tìm thấy giai đoạn cần kết thúc.");

      // 1. Đóng Sprint hiện tại
      await sprintService.updateSprintStatus(data.sprintId, 'CLOSED');

      // 2. Chuyển các công việc chưa hoàn thành (TODO, IN_PROGRESS, IN_REVIEW)
      const incompleteTasks = tasks.filter(
        (t) => t.sprintId === data.sprintId && t.status !== 'DONE' && !t.isDeleted
      );

      if (incompleteTasks.length > 0) {
        const marker = `[Chuyển từ: ${targetSprint.name} (Trễ hạn)]`;
        for (const t of incompleteTasks) {
          let newDesc = t.description || '';
          if (!newDesc.includes('[Chuyển từ:') && !newDesc.includes('[Tồn đọng từ:')) {
            newDesc = `${marker}\n\n${newDesc}`.trim();
          }

          let preservedDueDate = t.dueDate;
          if (!preservedDueDate || new Date(preservedDueDate) >= now) {
            preservedDueDate = targetSprint.endDate || new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
          }

          const preservedOwnerId = t.ownerId ?? t.assignee?.id ?? undefined;

          await taskService.updateTask(t.id, {
            spaceId: t.spaceId,
            title: t.title,
            sprintId: data.targetSprintId, // Chuyển sang next sprint hoặc null (backlog)
            description: newDesc,
            status: t.status,
            priority: t.priority,
            ownerId: preservedOwnerId,
            startDate: t.startDate,
            dueDate: preservedDueDate,
          });
        }
      }

      // 3. Tối ưu lịch trình bằng AI cho các Sprint tiếp theo (nếu có các sprint sau)
      const sorted = [...sprints].sort((a, b) => a.id - b.id);
      const currentIndex = sorted.findIndex((s) => s.id === data.sprintId);
      const futureSprints = sorted.slice(currentIndex + 1).filter((s) => s.status !== 'CLOSED');

      if (futureSprints.length > 0) {
        const todayStr = now.toISOString().split('T')[0];

        if (data.scheduleOption === 'cascade') {
          // Lựa chọn 1: Dời lùi toàn bộ lịch trình liên hoàn (không trùng ngày)
          let currentStartPointer = new Date(now);

          for (let i = 0; i < futureSprints.length; i++) {
            const fs = futureSprints[i];
            const fsStart = fs.startDate ? new Date(fs.startDate) : currentStartPointer;
            const fsEnd = fs.endDate ? new Date(fs.endDate) : new Date(fsStart.getTime() + 7 * 24 * 60 * 60 * 1000);
            const durationMs = Math.max(24 * 60 * 60 * 1000, fsEnd.getTime() - fsStart.getTime());

            const newStartDate = new Date(currentStartPointer);
            const newEndDate = new Date(newStartDate.getTime() + durationMs);

            await sprintService.updateSprint(fs.id, {
              spaceId,
              name: fs.name,
              goal: fs.goal,
              status: fs.status,
              startDate: `${newStartDate.toISOString().split('T')[0]}T00:00:00`,
              endDate: `${newEndDate.toISOString().split('T')[0]}T23:59:59`,
            });

            // Ngày bắt đầu của Sprint kế tiếp = Ngày kết thúc của Sprint này + 1 ngày
            currentStartPointer = new Date(newEndDate.getTime() + 24 * 60 * 60 * 1000);
          }
        } else if (data.scheduleOption === 'keep_deadline') {
          // Lựa chọn 2: Giữ nguyên hạn chót dự án (rút ngắn ngày của sprint kế tiếp)
          const nextSp = futureSprints[0];
          if (nextSp) {
            const currentNextEnd = nextSp.endDate ? new Date(nextSp.endDate) : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            let adjustedEnd = currentNextEnd;
            if (adjustedEnd < now) {
              adjustedEnd = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
            }

            await sprintService.updateSprint(nextSp.id, {
              spaceId,
              name: nextSp.name,
              goal: nextSp.goal,
              status: nextSp.status,
              startDate: `${todayStr}T00:00:00`,
              endDate: `${adjustedEnd.toISOString().split('T')[0]}T23:59:59`,
            });
          }
        }
      }

      await loadData(true);
      window.dispatchEvent(new CustomEvent('space_tasks_updated'));
    } catch (err: any) {
      console.error('Failed to complete sprint:', err);
      throw err;
    }
  };

  // Helper check if task is overdue
  const isTaskOverdue = (task: Task): boolean => {
    if (!task || task.status === 'DONE') return false;
    // Task chuyển từ sprint đã đóng sang sprint hiện tại luôn được đánh dấu trễ hạn
    const transferred = getTaskTransferredOrigin(task);
    if (transferred.isTransferred) return true;

    if (!task.dueDate) return false;
    const due = new Date(task.dueDate);
    const now = new Date();
    return due < now;
  };

  return {
    sprints,
    tasks,
    loading,
    error,
    reload: loadData,
    createSprint,
    updateSprint,
    deleteSprint,
    startSprint,
    completeSprint,
    getNextSprintDefaultName,
    isTaskOverdue,
  };
}
