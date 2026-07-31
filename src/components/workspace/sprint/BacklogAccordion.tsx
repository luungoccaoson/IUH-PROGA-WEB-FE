"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Task } from "@/types";
import { TaskRowItem } from "./TaskRowItem";

interface BacklogAccordionProps {
  tasks: Task[];
  isTaskOverdue: (task: Task) => boolean;
}

export function BacklogAccordion({ tasks, isTaskOverdue }: BacklogAccordionProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-[#F9FAFB] border-b border-[#E5E7EB] flex items-center justify-between">
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
        <div className="p-4">
          {tasks.length === 0 ? (
            <div className="py-6 text-center text-xs text-[#9CA3AF] border-2 border-dashed border-[#E5E7EB] rounded-xl font-mono">
              Không có công việc nào ở Backlog.
            </div>
          ) : (
            <div className="divide-y divide-[#E5E7EB]/70 border border-[#E5E7EB] rounded-xl overflow-hidden">
              {tasks.map((task) => (
                <TaskRowItem key={task.id} task={task} isOverdue={isTaskOverdue(task)} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
