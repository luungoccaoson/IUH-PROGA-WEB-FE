"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Task, TaskStatus, TaskPriority } from "@/types";
import { TaskRowItem } from "./TaskRowItem";
import { InlineCreateTask } from "./InlineCreateTask";

interface BacklogAccordionProps {
  tasks: Task[];
  allSpaceTasks?: Task[];
  isTaskOverdue: (task: Task) => boolean;
  selectedTaskIds?: number[];
  onToggleSelectTask?: (taskId: number) => void;
  onToggleSelectAllBacklog?: (taskIds: number[], select: boolean) => void;
  onCreateTask: (data: { title: string; sprintId?: number | null }) => Promise<any>;
  onSelectTask: (task: Task) => void;
  onUpdateStatus: (taskId: number, status: TaskStatus) => void;
  onUpdatePriority: (taskId: number, priority: TaskPriority) => void;
  onUpdateOwner: (taskId: number, ownerId?: number) => void;
  onDeleteTask: (taskId: number) => void;
  onMoveTask?: (taskId: number, targetSprintId: number | null) => void;
}

export function BacklogAccordion({
  tasks,
  allSpaceTasks,
  isTaskOverdue,
  selectedTaskIds = [],
  onToggleSelectTask,
  onToggleSelectAllBacklog,
  onCreateTask,
  onSelectTask,
  onUpdateStatus,
  onUpdatePriority,
  onUpdateOwner,
  onDeleteTask,
  onMoveTask,
}: BacklogAccordionProps) {
  const [isOpen, setIsOpen] = useState(true);

  const backlogTaskIds = tasks.map((t) => t.id);
  const isAllSelected = tasks.length > 0 && tasks.every((t) => selectedTaskIds.includes(t.id));
  const isSomeSelected = tasks.some((t) => selectedTaskIds.includes(t.id));

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const taskIdStr = e.dataTransfer.getData("taskId");
        if (taskIdStr && onMoveTask) {
          onMoveTask(parseInt(taskIdStr, 10), null);
        }
      }}
      className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-sm font-sans"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-[#FAF9F6] border-b border-[#E5E7EB]">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 hover:bg-[#E5E7EB] rounded-lg text-[#6B7280] transition-colors cursor-pointer"
          >
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>

          {onToggleSelectAllBacklog && tasks.length > 0 && (
            <input
              type="checkbox"
              checked={isAllSelected}
              ref={(el) => {
                if (el) el.indeterminate = !isAllSelected && isSomeSelected;
              }}
              onChange={(e) => onToggleSelectAllBacklog(backlogTaskIds, e.target.checked)}
              className="w-4 h-4 rounded text-[#1A73E8] border-gray-300 focus:ring-[#1A73E8] cursor-pointer shrink-0"
              title={isAllSelected ? "Bỏ chọn tất cả công việc trong Backlog" : "Chọn tất cả công việc trong Backlog"}
            />
          )}

          <h3 className="font-extrabold text-sm text-[#111827] uppercase tracking-wider">
            Công việc tồn đọng (Backlog)
          </h3>
          <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-[#E5E7EB] text-[#374151]">
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Body */}
      {isOpen && (
        <div className="p-4 space-y-3">
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
                    isOverdue={isTaskOverdue(task)}
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

          {/* Inline Task Creation Button/Form for Backlog */}
          <InlineCreateTask sprintId={null} onCreate={onCreateTask} />
        </div>
      )}
    </div>
  );
}
