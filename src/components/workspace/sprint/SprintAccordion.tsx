"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronRight, Calendar, Edit3, Trash2 } from "lucide-react";
import { Sprint, Task, TaskStatus, TaskPriority } from "@/types";
import { TaskRowItem } from "./TaskRowItem";
import { InlineCreateTask } from "./InlineCreateTask";

interface SprintAccordionProps {
  sprint: Sprint;
  tasks: Task[];
  allSpaceTasks?: Task[];
  members?: any[];
  isTaskOverdue: (task: Task) => boolean;
  selectedTaskIds?: number[];
  onToggleSelectTask?: (taskId: number) => void;
  onToggleSelectAllSprint?: (taskIds: number[], select: boolean) => void;
  onEdit: (sprint: Sprint) => void;
  onDelete: (sprintId: number) => void;
  onCreateTask: (data: { title: string; sprintId?: number | null }) => Promise<any>;
  onSelectTask: (task: Task) => void;
  onUpdateStatus: (taskId: number, status: TaskStatus) => void;
  onUpdatePriority: (taskId: number, priority: TaskPriority) => void;
  onUpdateOwner: (taskId: number, ownerId?: number) => void;
  onDeleteTask: (taskId: number) => void;
  onMoveTask?: (taskId: number, targetSprintId: number | null) => void;
}

const statusBadges: Record<Sprint['status'], { label: string; bg: string; text: string; border: string }> = {
  ACTIVE: { label: "ĐANG DIỄN RA", bg: "bg-[#E6F4EA]", text: "text-[#137333]", border: "border-[#D1E7DD]" },
  FUTURE: { label: "SẮP TỚI", bg: "bg-[#E8F0FE]", text: "text-[#1A73E8]", border: "border-[#D2E3FC]" },
  CLOSED: { label: "ĐÃ ĐÓNG", bg: "bg-[#F1F3F4]", text: "text-[#5F6368]", border: "border-[#E0E0E0]" },
};

export function SprintAccordion({
  sprint,
  tasks,
  allSpaceTasks,
  members = [],
  isTaskOverdue,
  selectedTaskIds = [],
  onToggleSelectTask,
  onToggleSelectAllSprint,
  onEdit,
  onDelete,
  onCreateTask,
  onSelectTask,
  onUpdateStatus,
  onUpdatePriority,
  onUpdateOwner,
  onDeleteTask,
  onMoveTask,
}: SprintAccordionProps) {
  const [isOpen, setIsOpen] = useState(sprint.status !== "CLOSED");

  const badge = statusBadges[sprint.status] || statusBadges.FUTURE;
  const isClosed = sprint.status === "CLOSED";
  const isActive = sprint.status === "ACTIVE";
  const isFuture = sprint.status === "FUTURE";

  // Only tasks that are allowed to be deleted (CLOSED: none, ACTIVE: only TODO, FUTURE: all)
  const deletableTasks = tasks.filter((t) => {
    if (isClosed) return false;
    if (isActive) return t.status === "TODO";
    return true;
  });
  const deletableTaskIds = deletableTasks.map((t) => t.id);
  const isAllSelected = deletableTaskIds.length > 0 && deletableTaskIds.every((id) => selectedTaskIds.includes(id));
  const isSomeSelected = deletableTaskIds.some((id) => selectedTaskIds.includes(id));

  return (
    <div
      onDragOver={(e) => {
        if (!isClosed) e.preventDefault();
      }}
      onDrop={(e) => {
        if (isClosed) return;
        e.preventDefault();
        const taskIdStr = e.dataTransfer.getData("taskId");
        if (taskIdStr && onMoveTask) {
          const taskId = parseInt(taskIdStr, 10);
          onMoveTask(taskId, sprint.id);
        }
      }}
      className={`bg-white border border-[#E5E7EB] rounded-2xl shadow-sm transition-all ${
        isClosed ? "" : "hover:border-[#111827]/40"
      }`}
    >
      {/* Header */}
      <div className="p-4 bg-[#F9FAFB] border-b border-[#E5E7EB] flex items-center justify-between gap-4 rounded-t-2xl">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 hover:bg-[#E5E7EB] rounded-lg text-[#6B7280] transition-colors cursor-pointer"
          >
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>

          {onToggleSelectAllSprint && deletableTasks.length > 0 && (
            <input
              type="checkbox"
              checked={isAllSelected}
              ref={(el) => {
                if (el) el.indeterminate = !isAllSelected && isSomeSelected;
              }}
              onChange={(e) => onToggleSelectAllSprint(deletableTaskIds, e.target.checked)}
              className="w-4 h-4 rounded text-[#1A73E8] border-gray-300 focus:ring-[#1A73E8] cursor-pointer shrink-0"
              title={isAllSelected ? "Bỏ chọn tất cả công việc trong Sprint" : "Chọn tất cả công việc có thể xóa trong Sprint"}
            />
          )}

          <h3 className="font-extrabold text-[#111827] text-sm font-sans truncate">
            {sprint.name}
          </h3>

          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
            {badge.label}
          </span>

          <div className="flex items-center gap-1.5 text-xs text-[#6B7280] font-mono bg-white px-2.5 py-1 rounded-lg border border-[#E5E7EB]">
            <Calendar className="w-3.5 h-3.5 text-[#9CA3AF]" />
            {sprint.startDate ? (
              <span>
                {new Date(sprint.startDate).toLocaleDateString("vi-VN")} - {sprint.endDate ? new Date(sprint.endDate).toLocaleDateString("vi-VN") : "Chưa đặt"}
              </span>
            ) : (
              <span className="italic text-[#9CA3AF]">Chưa chọn ngày</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!isClosed && (
            <button
              onClick={() => onEdit(sprint)}
              title="Chỉnh sửa ngày / tên Sprint"
              className="p-1.5 hover:bg-[#E5E7EB] rounded-lg text-[#4B5563] transition-colors cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}

          {isFuture && (
            <button
              onClick={() => onDelete(sprint.id)}
              title="Xóa Sprint (Chỉ áp dụng cho Sprint sắp tới)"
              className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      {isOpen && (
        <div className="p-4 space-y-3">
          {sprint.goal && (
            <p className="text-xs text-[#6B7280] bg-[#F6F5EF] p-2.5 rounded-xl border border-[#E5E7EB] italic">
              <span className="font-bold not-italic text-[#111827]">Mục tiêu:</span> {sprint.goal}
            </p>
          )}

          {tasks.length > 0 && (
            <div className="divide-y divide-[#E5E7EB]/70 border border-[#E5E7EB] rounded-xl">
              {tasks.map((task, taskIdx) => {
                const globalIdx = allSpaceTasks && allSpaceTasks.length > 0
                  ? allSpaceTasks.findIndex((t) => t.id === task.id)
                  : taskIdx;
                return (
                  <TaskRowItem
                    key={task.id}
                    task={task}
                    taskIndex={globalIdx !== -1 ? globalIdx : taskIdx}
                    members={members}
                    isOverdue={isTaskOverdue(task)}
                    isClosedSprint={isClosed}
                    isActiveSprint={isActive}
                    isSelected={selectedTaskIds.includes(task.id)}
                    onToggleSelect={onToggleSelectTask}
                    onSelect={onSelectTask}
                    onUpdateStatus={onUpdateStatus}
                    onUpdatePriority={onUpdatePriority}
                    onUpdateOwner={onUpdateOwner}
                    onDelete={onDeleteTask}
                  />
                );
              })}
            </div>
          )}

          {/* Inline Task Creation Button/Form at bottom of Sprint */}
          {!isClosed && (
            <InlineCreateTask sprintId={sprint.id} onCreate={onCreateTask} />
          )}
        </div>
      )}
    </div>
  );
}
