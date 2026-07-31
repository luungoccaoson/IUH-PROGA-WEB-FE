"use client";

import React from "react";
import { AlertTriangle, ChevronUp, User, Trash2 } from "lucide-react";
import { Task, TaskStatus, TaskPriority } from "@/types";

interface TaskRowItemProps {
  task: Task;
  isOverdue: boolean;
  onSelect?: (task: Task) => void;
  onUpdateStatus?: (taskId: number, status: TaskStatus) => void;
  onUpdatePriority?: (taskId: number, priority: TaskPriority) => void;
  onUpdateOwner?: (taskId: number, ownerId?: number) => void;
  onDelete?: (taskId: number) => void;
}

const taskStatusMap: Record<TaskStatus, { label: string; bg: string; text: string }> = {
  TODO: { label: "Cần làm", bg: "bg-gray-100", text: "text-gray-700" },
  IN_PROGRESS: { label: "Đang làm", bg: "bg-[#E8F0FE]", text: "text-[#1A73E8]" },
  REVIEW: { label: "Đang duyệt", bg: "bg-amber-100", text: "text-amber-800" },
  DONE: { label: "Đã xong", bg: "bg-[#E6F4EA]", text: "text-[#137333]" },
};

const PROJECT_MEMBERS = [
  { id: 2, name: "Son Luu" },
  { id: 4, name: "Duy Dev" },
  { id: 5, name: "Hoa Tester" },
];

export function TaskRowItem({
  task,
  isOverdue,
  onSelect,
  onUpdateStatus,
  onUpdatePriority,
  onUpdateOwner,
  onDelete,
}: TaskRowItemProps) {
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
    <div className="p-3 bg-white hover:bg-[#F9FAFB] transition-colors flex items-center justify-between gap-4 font-sans text-xs group">
      {/* Left side: Task Code & Title (clickable to open detail drawer) */}
      <div
        onClick={() => onSelect && onSelect(task)}
        className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
      >
        <span className="font-mono text-[11px] font-bold text-[#6B7280] bg-[#F6F5EF] px-2 py-0.5 rounded border border-[#E5E7EB] shrink-0 group-hover:border-[#111827] transition-colors">
          Task-{task.id}
        </span>
        <span className="font-semibold text-[#111827] hover:underline truncate">
          {task.title}
        </span>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Overdue Badge */}
        {isOverdue && (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FDEDEC] border border-[#FADBD8] text-[#D93025] font-mono font-extrabold text-[10px] animate-pulse">
            <AlertTriangle className="w-3 h-3" />
            TRỄ HẠN
          </span>
        )}

        {/* Priority Selector dropdown */}
        <select
          value={task.priority}
          onChange={(e) => onUpdatePriority && onUpdatePriority(task.id, e.target.value as TaskPriority)}
          onClick={(e) => e.stopPropagation()}
          className="bg-transparent border-none focus:outline-none cursor-pointer p-0 text-xs font-bold"
          title="Thay đổi độ ưu tiên"
        >
          <option value="LOW">Low (Thấp)</option>
          <option value="MEDIUM">Medium (Trung bình)</option>
          <option value="HIGH">High (Cao)</option>
          <option value="URGENT">Urgent (Khẩn cấp)</option>
        </select>
        {renderPriorityIcon(task.priority)}

        {/* Status Dropdown selector */}
        <select
          value={task.status}
          onChange={(e) => onUpdateStatus && onUpdateStatus(task.id, e.target.value as TaskStatus)}
          onClick={(e) => e.stopPropagation()}
          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border-none focus:outline-none cursor-pointer ${statusObj.bg} ${statusObj.text}`}
        >
          <option value="TODO">Cần làm</option>
          <option value="IN_PROGRESS">Đang làm</option>
          <option value="REVIEW">Đang duyệt</option>
          <option value="DONE">Đã xong</option>
        </select>

        {/* Assignee / Owner Dropdown */}
        <div className="flex items-center gap-1.5 text-xs text-[#4B5563]" onClick={(e) => e.stopPropagation()}>
          <div className="w-5 h-5 rounded-full bg-[#E5E7EB] flex items-center justify-center text-[10px] font-bold shrink-0">
            <User className="w-3 h-3" />
          </div>
          <select
            value={task.ownerId || ""}
            onChange={(e) =>
              onUpdateOwner && onUpdateOwner(task.id, e.target.value ? parseInt(e.target.value, 10) : undefined)
            }
            className="bg-transparent border-none focus:outline-none text-[11px] font-medium text-[#4B5563] cursor-pointer max-w-[100px] truncate"
          >
            <option value="">Chưa gán</option>
            {PROJECT_MEMBERS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Quick Delete icon */}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
            title="Xóa công việc"
            className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded transition-colors opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
