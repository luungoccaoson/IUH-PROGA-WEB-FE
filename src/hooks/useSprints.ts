import { useState, useEffect, useCallback } from 'react';
import { Sprint, SprintStatus, Task } from '@/types';
import { sprintService } from '@/services/sprint.service';
import { taskService } from '@/services/task.service';

/**
 * Helper nhận biết task trễ hạn được chuyển từ sprint đã đóng sang sprint hiện tại
 */
export function getTaskTransferredOrigin(task?: Task | null): {
  isTransferred: boolean;
  originSprintName?: string;
} {
  if (!task) return { isTransferred: false };
  const desc = task.description || "";
  const match = desc.match(/\[(?:Chuyển từ|Tồn đọng từ):\s*([^\]\(\n]+)(?:\([^\)]+\))?\]/i);
  if (match && match[1]) {
    return {
      isTransferred: true,
      originSprintName: match[1].trim(),
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

        // 1. Tự động kích hoạt / đóng sprint dựa trên ngày
        for (const sprint of sortedSprints) {
          const startDate = sprint.startDate ? new Date(sprint.startDate) : null;
          const endDate = sprint.endDate ? new Date(sprint.endDate) : null;

          if (sprint.status === 'FUTURE' && startDate && startDate <= now && (!endDate || endDate > now)) {
            try {
              await sprintService.updateSprintStatus(sprint.id, 'ACTIVE');
              sprint.status = 'ACTIVE';
              sprintsUpdated = true;
            } catch (err) {
              console.error(`Failed to auto-activate sprint ${sprint.id}`, err);
            }
          }

          if (sprint.status !== 'CLOSED' && endDate && endDate <= now) {
            try {
              await sprintService.updateSprintStatus(sprint.id, 'CLOSED');
              sprint.status = 'CLOSED';
              sprintsUpdated = true;
            } catch (err) {
              console.error(`Failed to auto-close sprint ${sprint.id}`, err);
            }
          }
        }

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

          // Các task thuộc sprint đã đóng mà chưa xong (TODO hoặc IN_PROGRESS)
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

              try {
                await taskService.updateTask(t.id, {
                  spaceId: t.spaceId,
                  title: t.title,
                  sprintId: activeSprint.id,
                  description: newDesc,
                  status: t.status,
                  priority: t.priority,
                  dueDate: preservedDueDate,
                });

                t.sprintId = activeSprint.id;
                t.description = newDesc;
                t.dueDate = preservedDueDate;
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
    getNextSprintDefaultName,
    isTaskOverdue,
  };
}
