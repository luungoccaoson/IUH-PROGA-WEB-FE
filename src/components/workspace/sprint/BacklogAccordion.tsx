"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Task, TaskStatus, TaskPriority } from "@/types";
import { TaskRowItem } from "./TaskRowItem";
import { InlineCreateTask } from "./InlineCreateTask";

interface BacklogAccordionProps {
  tasks: Task[];
  isTaskOverdue: (task: Task) => boolean;
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
  isTaskOverdue,
  onCreateTask,
  onSelectTask,
  onUpdateStatus,
  onUpdatePriority,
  onUpdateOwner,
  onDeleteTask,
  onMoveTask,
}: BacklogAccordionProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const taskIdStr = e.dataTransfer.getData("taskId");
        if (taskIdStr && onMoveTask) {
          const taskId = parseInt(taskIdStr, 10);
          onMoveTask(taskId, null); // move to backlog
        }
      }}
      className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm hover:border-[#111827]/40 transition-all"
    >
      {/* Header */}
      <div className="p-4 bg-[#F9FAFB] border-b border-[#E5E7EB] flex items-center justify-between rounded-t-2xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 hover:bg-[#E5E7EB] rounded-lg text-[#6B7280] transition-colors"
          >
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>

          <h3 className="font-extrabold text-[#111827] text-sm font-sans">
            Công việc tồn đọng (Backlog)
          </h3>

          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#F6F5EF] text-[#4B5563] border border-[#E5E7EB]">
            {tasks.length} work items
          </span>
        </div>
      </div>

      {/* Body */}
      {isOpen && (
        <div className="p-4 space-y-3">
          {tasks.length > 0 && (
            <div className="divide-y divide-[#E5E7EB]/70 border border-[#E5E7EB] rounded-xl">
              {tasks.map((task) => (
                <TaskRowItem
                  key={task.id}
                  task={task}
                  isOverdue={isTaskOverdue(task)}
                  onSelect={onSelectTask}
                  onUpdateStatus={onUpdateStatus}
                  onUpdatePriority={onUpdatePriority}
                  onUpdateOwner={onUpdateOwner}
                  onDelete={onDeleteTask}
                />
              ))}
            </div>
          )}

          {/* Inline Task Creation Button/Form for Backlog */}
          <InlineCreateTask sprintId={null} onCreate={onCreateTask} />
        </div>
      )}
    </div>
  );
}
