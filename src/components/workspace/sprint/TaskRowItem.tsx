"use client";

import React from "react";
import { AlertTriangle, ChevronUp, User } from "lucide-react";
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

export function TaskRowItem({ task, isOverdue }: TaskRowItemProps) {
  const statusObj = taskStatusMap[task.status] || taskStatusMap.TODO;

  const renderPriorityIcon = (priority: TaskPriority) => {
    switch (priority) {
      case "LOW":
        return (
          <div
            title="Mức độ ưu tiên: Thấp (Low)"
            className="w-5 h-5 rounded flex items-center justify-center bg-[#E6F4EA] cursor-pointer hover:scale-110 transition-transform"
          >
            <span className="w-2.5 h-1.5 bg-[#10B981] rounded-xs" />
          </div>
        );
      case "MEDIUM":
        return (
          <div
            title="Mức độ ưu tiên: Trung bình (Medium)"
            className="w-5 h-5 rounded flex items-center justify-center bg-[#E8F0FE] cursor-pointer hover:scale-110 transition-transform"
          >
            <div className="flex flex-col gap-[1.5px]">
              <span className="w-2.5 h-[2px] bg-[#3B82F6] rounded-xs" />
              <span className="w-2.5 h-[2px] bg-[#3B82F6] rounded-xs" />
            </div>
          </div>
        );
      case "HIGH":
        return (
          <div
            title="Mức độ ưu tiên: Cao (High)"
            className="w-5 h-5 rounded flex items-center justify-center bg-[#FFEDD5] text-[#F97316] cursor-pointer hover:scale-110 transition-transform"
          >
            <ChevronUp className="w-4 h-4 stroke-[2.5]" />
          </div>
        );
      case "URGENT":
        return (
          <div
            title="Mức độ ưu tiên: Khẩn cấp (Urgent)"
            className="w-5 h-5 rounded flex items-center justify-center bg-[#FEE2E2] text-[#EF4444] cursor-pointer hover:scale-110 transition-transform"
          >
            <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-3 bg-white hover:bg-[#F9FAFB] transition-colors flex items-center justify-between gap-4 font-sans text-xs">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span className="font-mono text-[11px] font-bold text-[#6B7280] bg-[#F6F5EF] px-2 py-0.5 rounded border border-[#E5E7EB] shrink-0">
          Task-{task.id}
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

        {/* Priority Icon with Hover Tooltip */}
        {renderPriorityIcon(task.priority)}

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
      </div>
    </div>
  );
}
