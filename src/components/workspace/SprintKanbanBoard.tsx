"use client";

import React, { useState, useEffect } from "react";
import {
  KanbanSquare,
  Sparkles,
  AlertTriangle,
  ListTodo,
  Clock,
  CheckCircle2,
  ChevronUp,
  User,
  Calendar,
  Plus,
  Eye,
  Check,
  RotateCcw,
  X,
} from "lucide-react";
import { useSprints, getTaskTransferredOrigin } from "@/hooks/useSprints";
import { useTasks } from "@/hooks/useTasks";
import { Sprint, Task, TaskStatus, TaskPriority } from "@/types";
import { TaskDetailDrawer } from "./sprint/TaskDetailDrawer";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  parseTaskDescriptionWithChecklist,
  serializeTaskDescriptionWithChecklist,
} from "@/utils/aiTaskAssistant";

interface SprintKanbanBoardProps {
  spaceId: number;
  isPM?: boolean;
  isAssistant?: boolean;
  currentUserId?: number;
  members?: any[];
  onDrawerStateChange?: (isOpen: boolean) => void;
}

const statusColumns: {
  key: TaskStatus;
  title: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
}[] = [
  {
    key: "TODO",
    title: "CẦN LÀM",
    icon: ListTodo,
    color: "text-gray-700",
    bg: "bg-gray-100/60",
    border: "border-t-gray-400",
  },
  {
    key: "IN_PROGRESS",
    title: "ĐANG LÀM",
    icon: Clock,
    color: "text-[#1A73E8]",
    bg: "bg-[#E8F0FE]/40",
    border: "border-t-[#1A73E8]",
  },
  {
    key: "IN_REVIEW",
    title: "CHỜ DUYỆT",
    icon: Eye,
    color: "text-[#B45309]",
    bg: "bg-[#FEF3C7]/40",
    border: "border-t-[#F59E0B]",
  },
  {
    key: "DONE",
    title: "ĐÃ XONG",
    icon: CheckCircle2,
    color: "text-[#137333]",
    bg: "bg-[#E6F4EA]/40",
    border: "border-t-[#10B981]",
  },
];

export function SprintKanbanBoard({
  spaceId,
  isPM = true,
  isAssistant = false,
  currentUserId,
  members = [],
  onDrawerStateChange,
}: SprintKanbanBoardProps) {
  const isCoordinator = isPM || isAssistant;
  const { sprints, tasks, loading, error, reload, isTaskOverdue } =
    useSprints(spaceId);

  const {
    selectedTask,
    setSelectedTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
  } = useTasks(spaceId, reload);

  // Dialog yêu cầu chỉnh sửa khi PM hoặc Assistant trả task từ IN_REVIEW về IN_PROGRESS
  const [revertModalTask, setRevertModalTask] = useState<Task | null>(null);
  const [revertReason, setRevertReason] = useState("");
  const [reverting, setReverting] = useState(false);

  // Undo Toast state khi đã xác nhận hoàn tác
  const [revertUndoToast, setRevertUndoToast] = useState<{
    taskId: number;
    taskTitle: string;
  } | null>(null);
  const revertUndoTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (revertUndoTimerRef.current) clearTimeout(revertUndoTimerRef.current);
    };
  }, []);

  const openRevertModal = (taskToRevert: Task) => {
    setRevertModalTask(taskToRevert);
    setRevertReason("");
  };

  const handleConfirmRevert = async () => {
    if (!revertModalTask) return;
    setReverting(true);
    try {
      const parsed = parseTaskDescriptionWithChecklist(revertModalTask.description);
      let newBase = parsed.baseDescription || "";
      if (revertReason.trim()) {
        const note = `\n\n> ⚠️ **Yêu cầu chỉnh sửa (${isPM ? "Trưởng dự án (PM)" : "Trợ lý (Assistant)"} - ${new Date().toLocaleDateString("vi-VN")}):** ${revertReason.trim()}`;
        newBase = newBase ? `${newBase}${note}` : note.trim();
      }
      const updatedDescription = serializeTaskDescriptionWithChecklist(
        newBase,
        parsed.checklist,
        parsed.aiRationale,
        { assistantVerified: false, createdByUserId: parsed.createdByUserId }
      );

      await updateTask(revertModalTask.id, {
        status: "IN_PROGRESS",
        description: updatedDescription,
      });

      if (revertUndoTimerRef.current) {
        clearTimeout(revertUndoTimerRef.current);
      }
      revertUndoTimerRef.current = setTimeout(() => {
        setRevertUndoToast(null);
      }, 8000);
      setRevertUndoToast({
        taskId: revertModalTask.id,
        taskTitle: revertModalTask.title,
      });

      setRevertModalTask(null);
      setRevertReason("");
    } catch (err) {
      alert("Không thể chuyển trạng thái công việc. Vui lòng thử lại!");
    } finally {
      setReverting(false);
    }
  };

  const handleAssistantVerifyTask = async (task: Task) => {
    try {
      const parsed = parseTaskDescriptionWithChecklist(task.description);
      const updatedDescription = serializeTaskDescriptionWithChecklist(
        parsed.baseDescription,
        parsed.checklist,
        parsed.aiRationale,
        { assistantVerified: true, createdByUserId: parsed.createdByUserId }
      );
      await updateTask(task.id, { description: updatedDescription });
    } catch (err) {
      alert("Không thể cập nhật xác nhận đạt. Vui lòng thử lại!");
    }
  };

  const handleUndoRevert = () => {
    if (!revertUndoToast) return;
    if (revertUndoTimerRef.current) {
      clearTimeout(revertUndoTimerRef.current);
    }
    updateTaskStatus(revertUndoToast.taskId, "IN_REVIEW");
    setRevertUndoToast(null);
  };

  const getAssigneeInfo = (task: Task) => {
    const taskOwnerId = task.ownerId || task.assignee?.id;
    if (!taskOwnerId) return null;
    const member = members.find((m: any) => {
      const mId = m.id?.userId || m.userId || m.id;
      return mId === taskOwnerId;
    });
    const name =
      member?.user?.fullName ||
      member?.user?.email ||
      member?.fullName ||
      member?.email ||
      task.ownerName ||
      task.assignee?.fullName ||
      task.suggestedMemberName;

    if (!name) return null;
    const parts = name.trim().split(" ");
    const lastPart = parts[parts.length - 1];
    const initials = lastPart
      ? lastPart.substring(0, 2).toUpperCase()
      : name.substring(0, 2).toUpperCase();

    return { name, initials, shortName: lastPart || name };
  };

  useEffect(() => {
    if (onDrawerStateChange) {
      onDrawerStateChange(Boolean(selectedTask));
    }
  }, [selectedTask, onDrawerStateChange]);

  // Selected Sprint for Kanban filter (defaults to active sprint or first sprint)
  const [selectedSprintId, setSelectedSprintId] = useState<number | "backlog">(
    0,
  );

  useEffect(() => {
    if (sprints.length > 0 && selectedSprintId === 0) {
      const active = sprints.find((s) => s.status === "ACTIVE") || sprints[0];
      if (active) setSelectedSprintId(active.id);
    }
  }, [sprints, selectedSprintId]);

  const currentSprint = sprints.find((s) => s.id === selectedSprintId);
  const isClosedSprint = currentSprint?.status === "CLOSED";

  const sprintIds = React.useMemo(
    () => new Set(sprints.map((s) => s.id)),
    [sprints],
  );

  const orderedSpaceTasks = React.useMemo(() => {
    const list: Task[] = [];
    sprints.forEach((sprint) => {
      const sTasks = tasks.filter(
        (t) => t.sprintId === sprint.id && !t.isDeleted,
      );
      list.push(...sTasks);
    });
    const bTasks = tasks.filter(
      (t) => !t.isDeleted && (!t.sprintId || !sprintIds.has(t.sprintId)),
    );
    list.push(...bTasks);
    return list;
  }, [sprints, tasks, sprintIds]);

  const taskNumberMap = React.useMemo(() => {
    const map = new Map<number, number>();
    orderedSpaceTasks.forEach((t, idx) => {
      map.set(t.id, idx + 1);
    });
    return map;
  }, [orderedSpaceTasks]);

  // Filter tasks belonging to selected sprint or backlog
  const sprintTasks = tasks.filter((t) => {
    if (selectedSprintId === "backlog") {
      return !t.sprintId || !sprintIds.has(t.sprintId);
    }
    if (t.sprintId === selectedSprintId) return true;
    if (isClosedSprint && currentSprint) {
      const transferred = getTaskTransferredOrigin(t);
      return (
        transferred.isTransferred &&
        transferred.originSprintName?.toLowerCase().trim() ===
          currentSprint.name.toLowerCase().trim()
      );
    }
    return false;
  });

  const renderPriorityIcon = (priority: TaskPriority) => {
    switch (priority) {
      case "LOW":
        return (
          <div
            title="Mức độ ưu tiên: Thấp"
            className="w-4 h-4 rounded flex items-center justify-center bg-[#E6F4EA] shrink-0"
          >
            <span className="w-2 h-1 bg-[#10B981] rounded-xs" />
          </div>
        );
      case "MEDIUM":
        return (
          <div
            title="Mức độ ưu tiên: Trung bình"
            className="w-4 h-4 rounded flex items-center justify-center bg-[#E8F0FE] shrink-0"
          >
            <div className="flex flex-col gap-[1px]">
              <span className="w-2 h-[1.5px] bg-[#3B82F6] rounded-xs" />
              <span className="w-2 h-[1.5px] bg-[#3B82F6] rounded-xs" />
            </div>
          </div>
        );
      case "HIGH":
        return (
          <div
            title="Mức độ ưu tiên: Cao"
            className="w-4 h-4 rounded flex items-center justify-center bg-[#FFEDD5] text-[#F97316] shrink-0"
          >
            <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
        );
      case "URGENT":
        return (
          <div
            title="Mức độ ưu tiên: Khẩn cấp"
            className="w-4 h-4 rounded flex items-center justify-center bg-[#FEE2E2] text-[#EF4444] shrink-0"
          >
            <AlertTriangle className="w-3 h-3 stroke-[2.5]" />
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[#6B7280]">
        <Sparkles className="w-7 h-7 text-[#111827] animate-spin mb-2" />
        <p className="font-mono text-xs uppercase tracking-wider">
          Đang tải Bảng Kanban...
        </p>
      </div>
    );
  }

  const isDrawerOpen = Boolean(selectedTask);

  return (
    <>
      <div className="space-y-6 font-sans">
        {/* Top Controls & Sprint Selector Bar */}
        <div className="bg-white border border-[#E5E7EB] p-4 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#111827] text-white flex items-center justify-center shadow-2xs">
              <KanbanSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#111827]">
                Bảng Kanban Sprint
              </h2>
              <p className="text-xs text-[#6B7280]">
                Theo dõi tiến độ các công việc theo cột trạng thái trực quan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* AI Co-Pilot Drawer Button on Kanban */}
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("toggle_space_ai_copilot"));
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 border border-[#E5E7EB] bg-white hover:bg-gray-100 rounded-xl text-xs font-bold text-[#4B5563] hover:text-[#111827] transition-all shadow-2xs cursor-pointer shrink-0"
              title="Mở bảng Trợ lý AI (Phân tích tiến độ, gợi ý việc làm & tổng hợp duyệt)"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#111827]" />
              <span>{isPM ? "Trợ lý AI Dự án" : "Trợ lý AI Cá nhân"}</span>
            </button>

            {/* Sprint Filter Dropdown */}
            <div className="flex items-center gap-2 bg-[#F9FAFB] border border-[#E5E7EB] p-1.5 rounded-xl">
              <span className="text-xs font-mono font-bold text-[#6B7280] uppercase tracking-wider pl-1">
                Sprint:
              </span>
              <select
                value={selectedSprintId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedSprintId(
                    val === "backlog" ? "backlog" : parseInt(val, 10),
                  );
                }}
                className="bg-white border border-[#E5E7EB] rounded-lg px-3 py-1.5 font-bold text-xs text-[#111827] focus:outline-none cursor-pointer"
              >
                {sprints.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (
                    {s.status === "ACTIVE"
                      ? "Đang diễn ra"
                      : s.status === "CLOSED"
                        ? "Đã đóng"
                        : "Sắp tới"}
                    )
                  </option>
                ))}
                <option value="backlog">Công việc tồn đọng (Backlog)</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-[#FDEDEC] border border-[#FADBD8] text-[#D93025] p-4 rounded-xl text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Kanban Board Grid (4 Columns: TODO, IN_PROGRESS, IN_REVIEW, DONE) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statusColumns.map((col) => {
            const Icon = col.icon;
            const columnTasks = sprintTasks.filter((t) => t.status === col.key);

            return (
              <div
                key={col.key}
                onDragOver={(e) => {
                  if (!isClosedSprint) e.preventDefault();
                }}
                onDrop={(e) => {
                  if (isClosedSprint) return;
                  e.preventDefault();
                  const taskIdStr = e.dataTransfer.getData("taskId");
                  if (!taskIdStr) return;
                  const taskId = parseInt(taskIdStr, 10);
                  const draggedTask = tasks.find((t) => t.id === taskId);
                  if (!draggedTask) return;

                  const draggedOwnerId =
                    draggedTask.ownerId || draggedTask.assignee?.id;
                  const isMyDraggedTask = Boolean(
                    currentUserId && draggedOwnerId === currentUserId,
                  );

                  // 1. Task đã duyệt DONE: Chỉ PM mới có quyền di chuyển (Thành viên & Assistant bị khóa hoàn toàn)
                  if (draggedTask.status === "DONE" && !isPM) {
                    alert(
                      "⚠️ Công việc đã được PM duyệt hoàn thành (DONE) và không thể chuyển trạng thái!",
                    );
                    return;
                  }

                  // 2. Nghiệp vụ Thành viên (MEMBER): chỉ được kéo task của mình ở Cần làm và Đang làm
                  if (!isCoordinator) {
                    if (!isMyDraggedTask) {
                      alert(
                        "⚠️ Bạn chỉ có quyền chuyển trạng thái công việc của chính mình!",
                      );
                      return;
                    }
                    // Thành viên kéo sang cột DONE sẽ tự động chuyển sang CHỜ DUYỆT (IN_REVIEW)
                    if (col.key === "DONE") {
                      updateTaskStatus(taskId, "IN_REVIEW");
                      return;
                    }
                    updateTaskStatus(taskId, col.key);
                    return;
                  }

                  // 3. Nghiệp vụ Trợ lý (ASSISTANT):
                  if (isAssistant && !isPM) {
                    if (isMyDraggedTask) {
                      if (col.key === "DONE") {
                        updateTaskStatus(taskId, "IN_REVIEW");
                        return;
                      }
                      updateTaskStatus(taskId, col.key);
                      return;
                    }
                    // Đối với task của thành viên khác: Assistant CHỈ ĐƯỢC PHÉP kéo trả lại từ IN_REVIEW về IN_PROGRESS
                    if (
                      draggedTask.status === "IN_REVIEW" &&
                      col.key === "IN_PROGRESS"
                    ) {
                      openRevertModal(draggedTask);
                      return;
                    }
                    if (col.key === "DONE") {
                      alert(
                        "⚠️ Chỉ Trưởng dự án (PM) mới có quyền duyệt hoàn thành công việc (DONE)!",
                      );
                      return;
                    }
                    alert(
                      "⚠️ Trợ lý chỉ có quyền duyệt trả lại công việc từ 'CHỜ DUYỆT' về 'ĐANG LÀM', hoặc thao tác trên công việc của chính mình!",
                    );
                    return;
                  }

                  // 4. Nghiệp vụ Trưởng dự án (PM):
                  if (isPM) {
                    if (col.key === "DONE") {
                      const isAssignedToOther = Boolean(
                        draggedOwnerId && draggedOwnerId !== currentUserId,
                      );
                      if (
                        isAssignedToOther &&
                        draggedTask.status !== "IN_REVIEW" &&
                        draggedTask.status !== "DONE"
                      ) {
                        alert(
                          "⚠️ Quy trình nghiệm thu: Thành viên phụ trách chưa báo cáo hoàn thành công việc này (chưa qua cột 'CHỜ DUYỆT / IN REVIEW'). PM chỉ duyệt sang 'ĐÃ XONG' đối với các công việc đang nằm ở cột 'CHỜ DUYỆT'!",
                        );
                        return;
                      }
                    }
                    if (
                      draggedTask.status === "IN_REVIEW" &&
                      col.key === "IN_PROGRESS"
                    ) {
                      openRevertModal(draggedTask);
                      return;
                    }
                    updateTaskStatus(taskId, col.key);
                  }
                }}
                className={`bg-white border border-[#E5E7EB] hover:border-[#111827]/40 rounded-2xl p-3.5 space-y-3.5 border-t-4 ${col.border} shadow-sm min-h-[480px] flex flex-col transition-all`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${col.color}`} />
                    <span className="font-mono text-[11px] font-bold text-[#111827] tracking-wider truncate">
                      {col.title}
                    </span>
                    {col.key === "DONE" && (
                      <span className="text-[9px] font-mono font-bold text-[#137333] bg-[#E6F4EA] border border-[#D1E7DD] px-1.5 py-0.5 rounded shrink-0">
                        PM duyệt
                      </span>
                    )}
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#F6F5EF] border border-[#E5E7EB] text-xs font-mono font-extrabold text-[#4B5563] shrink-0">
                    {columnTasks.length}
                  </span>
                </div>

                {/* Task Cards Container */}
                <div className="space-y-3 flex-1 overflow-y-auto pr-0.5">
                  {columnTasks.map((task, tIdx) => {
                    const overdue = isTaskOverdue(task);
                    const isGhost =
                      typeof selectedSprintId === "number" &&
                      task.sprintId !== selectedSprintId;
                    const taskOwnerId = task.ownerId || task.assignee?.id;
                    const isMyTask = Boolean(
                      currentUserId && taskOwnerId === currentUserId,
                    );
                    const isUnassigned = !taskOwnerId;

                    // 1. Task đã duyệt DONE: Thành viên & Trợ lý bị khóa, không được kéo
                    const isDoneLocked = !isPM && task.status === "DONE";

                    // 2. Assistant: chỉ kéo task của mình; riêng task ở Chờ duyệt (IN_REVIEW) thì được kéo trả lại
                    const canAssistantDrag =
                      isAssistant &&
                      !isDoneLocked &&
                      (isMyTask || task.status === "IN_REVIEW");

                    // 3. Member: chỉ kéo task của mình (khi chưa DONE)
                    const canMemberDrag =
                      !isCoordinator && isMyTask && !isDoneLocked;

                    // 4. PM: có quyền kéo (trừ closed sprint hoặc ghost)
                    const canPMDrag = isPM;

                    const canDragCard =
                      !isClosedSprint &&
                      !isGhost &&
                      (canPMDrag || canAssistantDrag || canMemberDrag);

                    const isReadOnly =
                      isClosedSprint ||
                      isGhost ||
                      (!isCoordinator && !isMyTask);

                    return (
                      <div
                        key={task.id}
                        draggable={canDragCard}
                        onDragStart={(e) => {
                          if (!canDragCard) return;
                          e.dataTransfer.setData("taskId", task.id.toString());
                          e.dataTransfer.setData("sourceStatus", task.status);
                        }}
                        onClick={() =>
                          setSelectedTask(
                            selectedTask?.id === task.id ? null : task,
                          )
                        }
                        className={`p-3.5 bg-white border rounded-xl shadow-2xs space-y-3 transition-all hover:scale-[1.01] group ${
                          isGhost
                            ? "bg-amber-50/25 opacity-60 hover:opacity-95 border-dashed border-amber-300 cursor-pointer"
                            : isDoneLocked
                              ? "bg-white border-[#E5E7EB] opacity-90 cursor-pointer"
                              : isMyTask
                                ? "border-[#E5E7EB] border-l-[3px] border-l-[#1A73E8] hover:border-[#1A73E8] cursor-grab active:cursor-grabbing"
                                : isReadOnly
                                  ? "bg-white border-[#E5E7EB] cursor-pointer"
                                  : "border-[#E5E7EB] hover:border-[#111827] cursor-grab active:cursor-grabbing"
                        }`}
                      >
                        {/* Header: Code & Status Action */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] font-bold text-[#6B7280] bg-[#F6F5EF] px-2 py-0.5 rounded border border-[#E5E7EB] group-hover:border-[#111827] transition-colors">
                              Task-
                              {taskNumberMap.get(task.id) ??
                                (tasks.findIndex((t) => t.id === task.id) !== -1
                                  ? tasks.findIndex((t) => t.id === task.id) + 1
                                  : tIdx + 1)}
                            </span>
                            {isMyTask && (
                              <span className="px-1.5 py-0.5 rounded bg-[#E8F0FE] text-[#1A73E8] border border-[#D2E3FC] font-mono text-[9px] font-extrabold">
                                Của tôi
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            {overdue && task.status !== "DONE" && (
                              <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-mono text-[9px] font-extrabold border border-red-200">
                                TRỄ HẠN
                              </span>
                            )}
                            {isGhost && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-mono text-[9px] font-extrabold border border-amber-300">
                                LƯU VẾT
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Title */}
                        <h4
                          className={`text-xs font-bold leading-relaxed ${task.status === "DONE" ? "line-through text-gray-400" : isGhost ? "text-gray-700 italic" : "text-[#111827]"}`}
                        >
                          {task.title}
                        </h4>

                        {/* IN_REVIEW Action Bar: Quick Submit for Member on IN_PROGRESS or Quick Approve for PM on IN_REVIEW */}
                        {!isClosedSprint &&
                          !isGhost &&
                          task.status === "IN_PROGRESS" &&
                          isMyTask &&
                          !isPM && (
                            <div className="pt-0.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateTaskStatus(task.id, "IN_REVIEW");
                                }}
                                className="w-full py-1 px-2 rounded-lg bg-amber-50 hover:bg-amber-500 text-amber-800 hover:text-white border border-amber-200 font-mono text-[10px] font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                title="Báo cáo đã làm xong công việc để chuyển sang cột Chờ PM duyệt (IN REVIEW)"
                              >
                                <Check className="w-3 h-3" />
                                <span>Hoàn thành (Gửi PM duyệt)</span>
                              </button>
                            </div>
                          )}

                        {!isClosedSprint &&
                          !isGhost &&
                          task.status === "IN_REVIEW" &&
                          (isPM ? (
                            <div className="flex items-center gap-1.5 pt-0.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateTaskStatus(task.id, "DONE");
                                }}
                                className="flex-1 py-1 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-[10px] font-extrabold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs hover:shadow"
                                title="Nghiệm thu đạt yêu cầu và chuyển sang ĐÃ XONG (DONE)"
                              >
                                <Check className="w-3 h-3 stroke-[3]" />
                                <span>Duyệt Done</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openRevertModal(task);
                                }}
                                className="py-1 px-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-mono text-[10px] font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                title="Yêu cầu thành viên chỉnh sửa lại (Chuyển về ĐANG LÀM)"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Sửa lại</span>
                              </button>
                            </div>
                          ) : isAssistant ? (
                            (() => {
                              const parsedDesc = parseTaskDescriptionWithChecklist(task.description);
                              return (
                                <div className="flex items-center gap-1.5 pt-0.5">
                                  {parsedDesc.assistantVerified ? (
                                    <span
                                      className="flex-1 py-1 px-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-300 font-mono text-[10px] font-extrabold flex items-center justify-center gap-1"
                                      title="Trợ lý đã kiểm tra & xác nhận đạt"
                                    >
                                      <Check className="w-3 h-3 stroke-[3]" />
                                      <span>Đã xác nhận đạt</span>
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAssistantVerifyTask(task);
                                      }}
                                      className="flex-1 py-1 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-[10px] font-extrabold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs hover:shadow"
                                      title="Trợ lý xác nhận công việc đạt tiêu chuẩn trước khi PM nghiệm thu"
                                    >
                                      <Check className="w-3 h-3 stroke-[3]" />
                                      <span>Xác nhận đạt</span>
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openRevertModal(task);
                                    }}
                                    className="py-1 px-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-mono text-[10px] font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                    title="Duyệt trả lại cho thành viên chỉnh sửa (Chuyển về ĐANG LÀM)"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                    <span>Sửa lại</span>
                                  </button>
                                </div>
                              );
                            })()
                          ) : (
                            <div className="px-2 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-mono text-[10px] font-bold flex items-center justify-center gap-1">
                              <Eye className="w-3 h-3 text-amber-600" />
                              <span>Đang chờ PM kiểm tra &amp; duyệt</span>
                            </div>
                          ))}

                        {/* Transferred origin badge */}
                        {(() => {
                          const transferred = getTaskTransferredOrigin(task);
                          if (!transferred.isTransferred) return null;
                          return (
                            <div className="relative group/origin inline-flex items-center px-2 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-900 font-mono text-[9px] font-bold border border-amber-300 transition-colors">
                              <span>
                                {isGhost ? "Lưu vết: " : "Tồn đọng: "}
                                {transferred.shortSprintName ||
                                  transferred.originSprintName}
                              </span>
                              <span className="pointer-events-none opacity-0 translate-y-1 group-hover/origin:opacity-100 group-hover/origin:translate-y-0 transition-all duration-150 absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 px-2.5 py-1.5 rounded-lg bg-[#111827] text-white font-sans text-[10px] font-semibold whitespace-nowrap shadow-xl border border-gray-700">
                                <span className="block font-mono text-[8px] text-amber-300 uppercase tracking-wider mb-0.5">
                                  Chuyển từ Sprint trước
                                </span>
                                <span>{transferred.originSprintName}</span>
                                <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-[#111827]" />
                              </span>
                            </div>
                          );
                        })()}

                        {/* Footer: Priority & Assignee */}
                        <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                          <div className="flex items-center gap-1.5">
                            {renderPriorityIcon(task.priority)}
                            <span className="text-[10px] font-mono font-semibold text-[#6B7280]">
                              {task.priority === "URGENT"
                                ? "Khẩn cấp"
                                : task.priority === "HIGH"
                                ? "Cao"
                                : task.priority === "MEDIUM"
                                ? "Trung bình"
                                : "Thấp"}
                            </span>
                          </div>

                          {/* Avatar Circle or Quick Self-Assign for Unassigned Task */}
                          <div className="flex items-center gap-1.5">
                            {/* Member can unassign their own task only when in TODO (CẦN LÀM) */}
                            {isMyTask &&
                              !isClosedSprint &&
                              !isGhost &&
                              task.status === "TODO" && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (
                                      confirm(
                                        "Bạn có chắc muốn bỏ nhận công việc này để chuyển lại cho thành viên khác?"
                                      )
                                    ) {
                                      updateTask(task.id, { ownerId: null });
                                    }
                                  }}
                                  className="text-[9px] font-mono text-gray-400 hover:text-red-600 underline cursor-pointer"
                                  title="Bỏ nhận công việc này"
                                >
                                  Bỏ nhận
                                </button>
                              )}
                            {!isPM &&
                              isUnassigned &&
                              !isClosedSprint &&
                              !isGhost &&
                              currentUserId && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateTask(task.id, {
                                      ownerId: currentUserId,
                                    });
                                  }}
                                  className="px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 font-mono text-[9px] font-bold transition-colors cursor-pointer"
                                  title="Tự nhận công việc này về cho bạn"
                                >
                                  + Nhận việc
                                </button>
                              )}
                            {(() => {
                              const assigneeInfo = getAssigneeInfo(task);
                              if (assigneeInfo) {
                                return (
                                  <div
                                    className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-700 shadow-2xs group/avatar"
                                    title={`Người thực hiện: ${assigneeInfo.name}`}
                                  >
                                    <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 font-mono font-bold text-[8px] flex items-center justify-center shrink-0">
                                      {assigneeInfo.initials}
                                    </div>
                                    <span className="text-[10px] font-medium max-w-[70px] truncate text-slate-800">
                                      {assigneeInfo.shortName}
                                    </span>
                                  </div>
                                );
                              }
                              return (
                                <div
                                  className="w-5 h-5 rounded-full bg-[#E5E7EB] flex items-center justify-center text-[#6B7280]"
                                  title="Chưa gán người thực hiện"
                                >
                                  <User className="w-3 h-3" />
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {columnTasks.length === 0 && (
                    <div className="py-12 text-center text-xs text-[#9CA3AF] border-2 border-dashed border-[#E5E7EB] rounded-xl font-mono">
                      Chưa có công việc ở cột này
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Yêu cầu Chỉnh sửa (Revert with Reason) */}
      {revertModalTask && (
        <div className="fixed inset-0 z-[10001] bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md p-5 space-y-4 font-sans animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#111827]">
                    Yêu cầu Chỉnh sửa Công việc
                  </h3>
                  <p className="text-[11px] text-[#6B7280]">
                    Chuyển từ &quot;Chờ duyệt&quot; về &quot;Đang làm&quot;
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRevertModalTask(null)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 space-y-1">
              <span className="font-mono text-[10px] font-bold text-gray-600">
                Task-{taskNumberMap.get(revertModalTask.id) ?? revertModalTask.id}
              </span>
              <p className="text-xs font-bold text-gray-900 line-clamp-2">
                {revertModalTask.title}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 flex items-center justify-between">
                <span>Lý do / Hạng mục cần chỉnh sửa:</span>
                <span className="text-[10px] text-gray-400 font-normal">
                  (Sẽ gửi đến thành viên phụ trách)
                </span>
              </label>
              <textarea
                value={revertReason}
                onChange={(e) => setRevertReason(e.target.value)}
                placeholder="VD: Cần bổ sung thêm test case cho API, giao diện chưa khớp theo thiết kế, v.v..."
                rows={3}
                className="w-full text-xs p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-transparent resize-none placeholder:text-gray-400 text-gray-800"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setRevertModalTask(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={reverting}
                onClick={handleConfirmRevert}
                className="px-4 py-2 rounded-xl text-xs font-extrabold bg-amber-600 hover:bg-amber-700 text-white shadow-xs hover:shadow transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{reverting ? "Đang xử lý..." : "Xác nhận yêu cầu sửa"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Undo Toast when PM or Assistant Reverts a Task from IN_REVIEW to IN_PROGRESS */}
      {revertUndoToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[10000] bg-[#111827] text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-gray-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>
              Đã trả{" "}
              <strong>
                Task-
                {taskNumberMap.get(revertUndoToast.taskId) ??
                  revertUndoToast.taskId}
              </strong>{" "}
              (
              {revertUndoToast.taskTitle.length > 25
                ? `${revertUndoToast.taskTitle.slice(0, 25)}...`
                : revertUndoToast.taskTitle}
              ) về <strong>Đang làm</strong>.
            </span>
          </div>
          <button
            type="button"
            onClick={handleUndoRevert}
            className="px-3 py-1 rounded-xl bg-[#1A73E8] hover:bg-blue-600 text-white font-mono text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Hoàn tác (Khôi phục Chờ duyệt)</span>
          </button>
          <button
            type="button"
            onClick={() => setRevertUndoToast(null)}
            className="p-1 text-gray-400 hover:text-white rounded cursor-pointer"
            title="Đóng thông báo"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Task Detail Drawer Side Panel (Non-blocking right layout) */}
      <TaskDetailDrawer
        task={selectedTask}
        taskNumber={
          selectedTask ? taskNumberMap.get(selectedTask.id) : undefined
        }
        isPM={isPM}
        isAssistant={isAssistant}
        currentUserId={currentUserId}
        members={members}
        isClosedSprint={Boolean(
          isClosedSprint ||
          (selectedTask &&
            typeof selectedSprintId === "number" &&
            selectedTask.sprintId !== selectedSprintId),
        )}
        onClose={() => setSelectedTask(null)}
        onUpdate={updateTask}
        onDelete={deleteTask}
      />
    </>
  );
}
