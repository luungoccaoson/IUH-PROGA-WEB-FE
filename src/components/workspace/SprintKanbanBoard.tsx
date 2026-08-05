"use client";

import React, { useState, useEffect } from "react";
import {
  KanbanSquare, Sparkles, AlertTriangle, ListTodo, Clock,
  CheckCircle2, ChevronUp, User, Lock, Calendar, Plus
} from "lucide-react";
import { useSprints } from "@/hooks/useSprints";
import { useTasks } from "@/hooks/useTasks";
import { Sprint, Task, TaskStatus, TaskPriority } from "@/types";
import { TaskDetailDrawer } from "./sprint/TaskDetailDrawer";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

interface SprintKanbanBoardProps {
  spaceId: number;
  onDrawerStateChange?: (isOpen: boolean) => void;
}

const statusColumns: { key: TaskStatus; title: string; icon: React.ElementType; color: string; bg: string; border: string }[] = [
  { key: "TODO", title: "CẦN LÀM", icon: ListTodo, color: "text-gray-700", bg: "bg-gray-100/60", border: "border-t-gray-400" },
  { key: "IN_PROGRESS", title: "ĐANG LÀM", icon: Clock, color: "text-[#1A73E8]", bg: "bg-[#E8F0FE]/40", border: "border-t-[#1A73E8]" },
  { key: "DONE", title: "ĐÃ XONG", icon: CheckCircle2, color: "text-[#137333]", bg: "bg-[#E6F4EA]/40", border: "border-t-[#10B981]" },
];

export function SprintKanbanBoard({ spaceId, onDrawerStateChange }: SprintKanbanBoardProps) {
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

  // Filter tasks belonging to selected sprint or backlog
  const sprintTasks = tasks.filter((t) => {
    if (selectedSprintId === "backlog") {
      const sprintIds = new Set(sprints.map((s) => s.id));
      return !t.sprintId || !sprintIds.has(t.sprintId);
    }
    return t.sprintId === selectedSprintId;
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
    <div className="relative font-sans space-y-6">
      {/* Push layout container */}
      <div className={`space-y-6 transition-all duration-300 ease-in-out ${isDrawerOpen ? "mr-0 lg:mr-[315px]" : "mr-0"}`}>
        {/* Top Controls & Sprint Selector Bar */}
        <div className="bg-white border border-[#E5E7EB] p-4 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F6F5EF] flex items-center justify-center text-[#111827] border border-[#E5E7EB]">
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

          {/* Sprint Filter Dropdown */}
          <div className="flex items-center gap-2 bg-[#F9FAFB] border border-[#E5E7EB] p-2 rounded-xl">
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

        {error && (
          <div className="bg-[#FDEDEC] border border-[#FADBD8] text-[#D93025] p-4 rounded-xl text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Kanban Board Grid (3 Columns) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
                  if (taskIdStr) {
                    const taskId = parseInt(taskIdStr, 10);
                    updateTaskStatus(taskId, col.key);
                  }
                }}
                className={`bg-white border border-[#E5E7EB] hover:border-[#111827]/40 rounded-2xl p-4 space-y-4 border-t-4 ${col.border} shadow-sm min-h-[480px] flex flex-col transition-all`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${col.color}`} />
                    <span className="font-mono text-xs font-bold text-[#111827] tracking-wider">
                      {col.title}
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#F6F5EF] border border-[#E5E7EB] text-xs font-mono font-extrabold text-[#4B5563]">
                    {columnTasks.length}
                  </span>
                </div>

                {/* Task Cards Container */}
                <div className="space-y-3 flex-1 overflow-y-auto pr-0.5">
                  {columnTasks.map((task) => {
                    const overdue = isTaskOverdue(task);
                    const isReadOnly = isClosedSprint;

                    return (
                      <div
                        key={task.id}
                        draggable={!isReadOnly}
                        onDragStart={(e) => {
                          if (isReadOnly) return;
                          e.dataTransfer.setData("taskId", task.id.toString());
                          e.dataTransfer.setData("sourceStatus", task.status);
                        }}
                        onClick={() => setSelectedTask(task)}
                        className={`p-3.5 bg-white border border-[#E5E7EB] hover:border-[#111827] rounded-xl shadow-2xs space-y-3 transition-all hover:scale-[1.01] group ${
                          isReadOnly ? "bg-gray-50/70 cursor-default" : "cursor-grab active:cursor-grabbing"
                        }`}
                      >
                        {/* Header: Code & Status Action */}
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] font-bold text-[#6B7280] bg-[#F6F5EF] px-2 py-0.5 rounded border border-[#E5E7EB] group-hover:border-[#111827] transition-colors">
                            Task-{task.id}
                          </span>

                          <div className="flex items-center gap-1.5">
                            {overdue && task.status !== "DONE" && (
                              <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-600 font-mono text-[9px] font-extrabold border border-red-100 flex items-center gap-0.5">
                                <AlertTriangle className="w-2.5 h-2.5" /> TRỄ
                              </span>
                            )}
                            {isReadOnly && (
                              <span title="Nằm trong Sprint đã đóng">
                                <Lock className="w-3 h-3 text-[#9CA3AF]" />
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Title */}
                        <h4 className={`text-xs font-bold text-[#111827] line-clamp-2 leading-relaxed ${task.status === "DONE" ? "line-through text-gray-400" : ""}`}>
                          {task.title}
                        </h4>

                        {/* Footer: Priority & Assignee */}
                        <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                          <div className="flex items-center gap-1.5">
                            {renderPriorityIcon(task.priority)}
                            <span className="text-[10px] font-mono font-semibold text-[#6B7280]">
                              {task.priority}
                            </span>
                          </div>

                          {/* Avatar Circle */}
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
        isClosedSprint={isClosedSprint}
        onClose={() => setSelectedTask(null)}
        onUpdate={updateTask}
        onDelete={deleteTask}
      />
    </div>
  );
}
