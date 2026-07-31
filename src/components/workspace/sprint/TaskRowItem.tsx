"use client";

import React from "react";
import { AlertTriangle, User } from "lucide-react";
import { Task, TaskStatus, TaskPriority } from "@/types";

interface TaskRowItemProps {
  task: Task;
  isOverdue: boolean;
}

const taskStatusMap: Record<TaskStatus, { label: string; bg: string; text: string }> = {
  TODO: { label: "Cần làm", bg: "bg-gray-100", text: "text-gray-700" },
  IN_PROGRESS: { label: "Đang làm", bg: "bg-[#E8F0FE]", text: "text-[#1A73E8]" },
  REVIEW: { label: "Đang duyệt", bg: "bg-amber-100", text: "text-amber-800" },
  DONE: { label: "Đã xong", bg: "bg-[#E6F4EA]", text: "text-[#137333]" },
};

const taskPriorityMap: Record<TaskPriority, { label: string; bg: string; text: string }> = {
  LOW: { label: "Thấp", bg: "bg-gray-100", text: "text-gray-600" },
  MEDIUM: { label: "Trung bình", bg: "bg-blue-50", text: "text-blue-700" },
  HIGH: { label: "Cao", bg: "bg-orange-50", text: "text-orange-700" },
  URGENT: { label: "Khẩn cấp", bg: "bg-red-50", text: "text-red-700" },
};

export function TaskRowItem({ task, isOverdue }: TaskRowItemProps) {
  const statusObj = taskStatusMap[task.status] || taskStatusMap.TODO;
  const priorityObj = taskPriorityMap[task.priority] || taskPriorityMap.MEDIUM;

  return (
    <div className="p-3 bg-white hover:bg-[#F9FAFB] transition-colors flex items-center justify-between gap-4 font-sans text-xs">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span className="font-mono text-[11px] font-bold text-[#6B7280] bg-[#F6F5EF] px-2 py-0.5 rounded border border-[#E5E7EB] shrink-0">
          PROGA-{task.id}
        </span>
        <span className="font-semibold text-[#111827] truncate">
          {task.title}
        </span>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {/* Overdue Badge */}
        {isOverdue && (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FDEDEC] border border-[#FADBD8] text-[#D93025] font-mono font-extrabold text-[10px] animate-pulse">
            <AlertTriangle className="w-3 h-3" />
            TRỄ HẠN
          </span>
        )}

        {/* Priority Badge */}
        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${priorityObj.bg} ${priorityObj.text}`}>
          {priorityObj.label}
        </span>

        {/* Status Badge */}
        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${statusObj.bg} ${statusObj.text}`}>
          {statusObj.label}
        </span>

        {/* Assignee */}
        <div className="flex items-center gap-1.5 text-xs text-[#4B5563]">
          <div className="w-5 h-5 rounded-full bg-[#E5E7EB] flex items-center justify-center text-[10px] font-bold">
            <User className="w-3 h-3" />
          </div>
          <span className="hidden md:inline text-[11px] font-medium">
            {task.ownerName || "Chưa gán"}
          </span>
        </div>

        {/* Due Date */}
        <div className="text-[11px] font-mono text-[#6B7280]">
          {task.dueDate ? new Date(task.dueDate).toLocaleDateString("vi-VN") : "—"}
        </div>
      </div>
    </div>
  );
}
