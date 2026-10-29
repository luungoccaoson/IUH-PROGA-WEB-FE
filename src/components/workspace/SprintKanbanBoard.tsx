"use client";

import React, { useState, useEffect } from "react";
import {
  KanbanSquare, Sparkles, AlertTriangle, ListTodo, Clock,
  CheckCircle2, ChevronUp, User, Lock, Calendar, Plus, Eye, Check, RotateCcw
} from "lucide-react";
import { useSprints, getTaskTransferredOrigin } from "@/hooks/useSprints";
import { useTasks } from "@/hooks/useTasks";
import { Sprint, Task, TaskStatus, TaskPriority } from "@/types";
import { TaskDetailDrawer } from "./sprint/TaskDetailDrawer";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

interface SprintKanbanBoardProps {
  spaceId: number;
  isPM?: boolean;
  isAssistant?: boolean;
  currentUserId?: number;
  members?: any[];
  onDrawerStateChange?: (isOpen: boolean) => void;
}

const statusColumns: { key: TaskStatus; title: string; icon: React.ElementType; color: string; bg: string; border: string }[] = [
  { key: "TODO", title: "CẦN LÀM", icon: ListTodo, color: "text-gray-700", bg: "bg-gray-100/60", border: "border-t-gray-400" },
  { key: "IN_PROGRESS", title: "ĐANG LÀM", icon: Clock, color: "text-[#1A73E8]", bg: "bg-[#E8F0FE]/40", border: "border-t-[#1A73E8]" },
  { key: "IN_REVIEW", title: "CHỜ DUYỆT (IN REVIEW)", icon: Eye, color: "text-[#B45309]", bg: "bg-[#FEF3C7]/40", border: "border-t-[#F59E0B]" },
  { key: "DONE", title: "ĐÃ XONG", icon: CheckCircle2, color: "text-[#137333]", bg: "bg-[#E6F4EA]/40", border: "border-t-[#10B981]" },
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
  const {
    sprints,
    tasks,
    loading,
    error,
    reload,
    isTaskOverdue,
  } = useSprints(spaceId);

  const {
    selectedTask,
    setSelectedTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
  } = useTasks(spaceId, reload);

  useEffect(() => {
    if (onDrawerStateChange) {
      onDrawerStateChange(Boolean(selectedTask));
    }
  }, [selectedTask, onDrawerStateChange]);

  // Selected Sprint for Kanban filter (defaults to active sprint or first sprint)
  const [selectedSprintId, setSelectedSprintId] = useState<number | "backlog">(0);

  useEffect(() => {
    if (sprints.length > 0 && selectedSprintId === 0) {
      const active = sprints.find((s) => s.status === "ACTIVE") || sprints[0];
      if (active) setSelectedSprintId(active.id);
    }
  }, [sprints, selectedSprintId]);

  const currentSprint = sprints.find((s) => s.id === selectedSprintId);
  const isClosedSprint = currentSprint?.status === "CLOSED";

  const sprintIds = React.useMemo(() => new Set(sprints.map((s) => s.id)), [sprints]);

  const orderedSpaceTasks = React.useMemo(() => {
    const list: Task[] = [];
    sprints.forEach((sprint) => {
      const sTasks = tasks.filter((t) => t.sprintId === sprint.id && !t.isDeleted);
      list.push(...sTasks);
    });
    const bTasks = tasks.filter(
      (t) => !t.isDeleted && (!t.sprintId || !sprintIds.has(t.sprintId))
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
          <div title="Mức độ ưu tiên: Thấp" className="w-4 h-4 rounded flex items-center justify-center bg-[#E6F4EA] shrink-0">
            <span className="w-2 h-1 bg-[#10B981] rounded-xs" />
          </div>
        );
      case "MEDIUM":
        return (
          <div title="Mức độ ưu tiên: Trung bình" className="w-4 h-4 rounded flex items-center justify-center bg-[#E8F0FE] shrink-0">
            <div className="flex flex-col gap-[1px]">
              <span className="w-2 h-[1.5px] bg-[#3B82F6] rounded-xs" />
              <span className="w-2 h-[1.5px] bg-[#3B82F6] rounded-xs" />
            </div>
          </div>
        );
      case "HIGH":
        return (
          <div title="Mức độ ưu tiên: Cao" className="w-4 h-4 rounded flex items-center justify-center bg-[#FFEDD5] text-[#F97316] shrink-0">
            <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
        );
      case "URGENT":
        return (
          <div title="Mức độ ưu tiên: Khẩn cấp" className="w-4 h-4 rounded flex items-center justify-center bg-[#FEE2E2] text-[#EF4444] shrink-0">
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
        <p className="font-mono text-xs uppercase tracking-wider">Đang tải Bảng Kanban...</p>
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

          <div className="flex items-center gap-3">
            {/* AI Co-Pilot Drawer Button */}
            {/* <button
              onClick={() => setIsCopilotOpen(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-[#111827] to-[#1F2937] hover:from-black hover:to-[#111827] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer border border-gray-700"
            >
              <Sparkles className="w-4 h-4 text-[#A7F3D0] animate-pulse" />
              <span>🤖 AI Co-Pilot Phân Rã & Đánh Giá Rủi Ro</span>
            </button> */}

            {/* Sprint Filter Dropdown */}
            <div className="flex items-center gap-2 bg-[#F9FAFB] border border-[#E5E7EB] p-1.5 rounded-xl">
              <span className="text-xs font-mono font-bold text-[#6B7280] uppercase tracking-wider pl-1">
                Sprint:
              </span>
              <select
                value={selectedSprintId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedSprintId(val === "backlog" ? "backlog" : parseInt(val, 10));
                }}
                className="bg-white border border-[#E5E7EB] rounded-lg px-3 py-1.5 font-bold text-xs text-[#111827] focus:outline-none cursor-pointer"
              >
                {sprints.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.status === "ACTIVE" ? "Đang diễn ra" : s.status === "CLOSED" ? "Đã đóng" : "Sắp tới"})
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

                  // Nghiệp vụ 1: Khi MEMBER / ASSISTANT kéo sang cột ĐÃ XONG (DONE),
                  // hệ thống tự động đưa vào cột CHỜ DUYỆT (IN_REVIEW) để PM biết họ đã làm xong và chờ PM duyệt!
                  if (col.key === "DONE" && !isPM) {
                    updateTaskStatus(taskId, "IN_REVIEW");
                    return;
                  }

                  // Nghiệp vụ 2: PM không đơn phương bấm/kéo DONE đối với task của thành viên khác khi họ chưa nộp vào CHỜ DUYỆT (IN_REVIEW)
                  if (col.key === "DONE" && isPM && draggedTask) {
                    const draggedOwnerId = draggedTask.ownerId || draggedTask.assignee?.id;
                    const isAssignedToOther = Boolean(draggedOwnerId && draggedOwnerId !== currentUserId);
                    if (isAssignedToOther && draggedTask.status !== "IN_REVIEW" && draggedTask.status !== "DONE") {
                      alert("⚠️ Quy trình nghiệm thu: Thành viên phụ trách chưa báo cáo hoàn thành công việc này (chưa qua cột 'CHỜ DUYỆT / IN REVIEW'). PM chỉ duyệt sang 'ĐÃ XONG' đối với các công việc đang nằm ở cột 'CHỜ DUYỆT'!");
                      return;
                    }
                  }

                  updateTaskStatus(taskId, col.key);
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
                    const isMyTask = Boolean(currentUserId && taskOwnerId === currentUserId);
                    const isUnassigned = !taskOwnerId;
                    const canDragCard = !isClosedSprint && !isGhost && (isCoordinator || isMyTask);
                    const isReadOnly = isClosedSprint || isGhost || (!isCoordinator && !isMyTask);

                    return (
                      <div
                        key={task.id}
                        draggable={canDragCard}
                        onDragStart={(e) => {
                          if (!canDragCard) return;
                          e.dataTransfer.setData("taskId", task.id.toString());
                          e.dataTransfer.setData("sourceStatus", task.status);
                        }}
                        onClick={() => setSelectedTask(selectedTask?.id === task.id ? null : task)}
                        className={`p-3.5 bg-white border rounded-xl shadow-2xs space-y-3 transition-all hover:scale-[1.01] group ${
                          isGhost
                            ? "bg-amber-50/25 opacity-60 hover:opacity-95 border-dashed border-amber-300 cursor-pointer"
                            : isReadOnly
                            ? "bg-gray-50/70 border-[#E5E7EB] cursor-pointer"
                            : "border-[#E5E7EB] hover:border-[#111827] cursor-grab active:cursor-grabbing"
                        }`}
                      >
                        {/* Header: Code & Status Action */}
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] font-bold text-[#6B7280] bg-[#F6F5EF] px-2 py-0.5 rounded border border-[#E5E7EB] group-hover:border-[#111827] transition-colors">
                            Task-{taskNumberMap.get(task.id) ?? (tasks.findIndex((t) => t.id === task.id) !== -1 ? tasks.findIndex((t) => t.id === task.id) + 1 : tIdx + 1)}
                          </span>

                          <div className="flex items-center gap-1.5">
                            {overdue && task.status !== "DONE" && (
                              <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-600 font-mono text-[9px] font-extrabold border border-red-100 flex items-center gap-0.5">
                                <AlertTriangle className="w-2.5 h-2.5" /> TRỄ
                              </span>
                            )}
                            {isGhost && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-mono text-[9px] font-extrabold border border-amber-300">
                                LƯU VẾT
                              </span>
                            )}
                            {isReadOnly && (
                              <span title="Nằm trong Sprint đã đóng hoặc là bản ghi lưu vết">
                                <Lock className="w-3 h-3 text-[#9CA3AF]" />
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Title */}
                        <h4 className={`text-xs font-bold leading-relaxed ${task.status === "DONE" ? "line-through text-gray-400" : isGhost ? "text-gray-700 italic" : "text-[#111827]"}`}>
                          {task.title}
                        </h4>

                        {/* IN_REVIEW Action Bar: Quick Submit for Member on IN_PROGRESS or Quick Approve for PM on IN_REVIEW */}
                        {!isClosedSprint && !isGhost && task.status === "IN_PROGRESS" && isMyTask && !isPM && (
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

                        {!isClosedSprint && !isGhost && task.status === "IN_REVIEW" && (
                          isPM ? (
                            <div className="flex items-center gap-1.5 pt-0.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateTaskStatus(task.id, "DONE");
                                }}
                                className="flex-1 py-1 px-2 rounded-lg bg-[#137333] hover:bg-[#0d5324] text-white font-mono text-[10px] font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                                title="Nghiệm thu đạt yêu cầu và chuyển sang ĐÃ XONG (DONE)"
                              >
                                <Check className="w-3 h-3" />
                                <span>Duyệt Done</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateTaskStatus(task.id, "IN_PROGRESS");
                                }}
                                className="py-1 px-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-mono text-[10px] font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                title="Yêu cầu thành viên chỉnh sửa lại (Chuyển về ĐANG LÀM)"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Sửa lại</span>
                              </button>
                            </div>
                          ) : (
                            <div className="px-2 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-mono text-[10px] font-bold flex items-center justify-center gap-1">
                              <Eye className="w-3 h-3 text-amber-600" />
                              <span>Đang chờ PM kiểm tra &amp; duyệt</span>
                            </div>
                          )
                        )}

                        {/* Transferred origin badge */}
                        {(() => {
                          const transferred = getTaskTransferredOrigin(task);
                          if (!transferred.isTransferred) return null;
                          return (
                            <div
                              className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 font-mono text-[9px] font-bold border border-amber-200"
                              title={`Nhiệm vụ trễ hạn từ sprint đã đóng: ${transferred.originSprintName}`}
                            >
                              <span>⚠️</span>
                              <span className="truncate">
                                {isGhost ? "Lưu vết: " : "Tồn đọng: "}
                                {transferred.originSprintName}
                              </span>
                            </div>
                          );
                        })()}

                        {/* Footer: Priority & Assignee */}
                        <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                          <div className="flex items-center gap-1.5">
                            {renderPriorityIcon(task.priority)}
                            <span className="text-[10px] font-mono font-semibold text-[#6B7280]">
                              {task.priority}
                            </span>
                          </div>

                           {/* Avatar Circle or Quick Self-Assign for Unassigned Task */}
                          <div className="flex items-center gap-1.5">
                            {!isPM && isUnassigned && !isClosedSprint && !isGhost && currentUserId && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateTask(task.id, { ownerId: currentUserId });
                                }}
                                className="px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 font-mono text-[9px] font-bold transition-colors cursor-pointer"
                                title="Tự nhận công việc này về cho bạn"
                              >
                                + Nhận việc
                              </button>
                            )}
                            <div title={task.ownerName ? `Người thực hiện: ${task.ownerName}` : "Chưa gán"}>
                              {task.ownerId && task.ownerName ? (
                                <div
                                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-extrabold font-mono border border-white shadow-2xs ${task.ownerId % 2 === 0
                                    ? "bg-purple-600 text-white"
                                    : "bg-amber-500 text-white"
                                    }`}
                                >
                                  {task.ownerName
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .substring(0, 2)
                                    .toUpperCase()}
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-[#E5E7EB] flex items-center justify-center text-[#6B7280]">
                                  <User className="w-3 h-3" />
                                </div>
                              )}
                            </div>
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

      {/* Task Detail Drawer Side Panel (Non-blocking right layout) */}
      <TaskDetailDrawer
        task={selectedTask}
        taskNumber={selectedTask ? taskNumberMap.get(selectedTask.id) : undefined}
        isPM={isPM}
        isAssistant={isAssistant}
        currentUserId={currentUserId}
        members={members}
        isClosedSprint={Boolean(
          isClosedSprint ||
          (selectedTask &&
            typeof selectedSprintId === "number" &&
            selectedTask.sprintId !== selectedSprintId)
        )}
        onClose={() => setSelectedTask(null)}
        onUpdate={updateTask}
        onDelete={deleteTask}
      />
    </>
  );
}
