"use client";

import React, { useState, useRef, useEffect } from "react";
import { AlertTriangle, ChevronUp, User, Trash2, Check, Lock } from "lucide-react";
import { Task, TaskStatus, TaskPriority } from "@/types";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

interface TaskRowItemProps {
  task: Task;
  taskIndex?: number;
  members?: any[];
  isOverdue?: boolean;
  isClosedSprint?: boolean;
  onSelect?: (task: Task) => void;
  onUpdateStatus?: (taskId: number, status: TaskStatus) => void;
  onUpdatePriority?: (taskId: number, priority: TaskPriority) => void;
  onUpdateOwner?: (taskId: number, ownerId?: number) => void;
  onDelete?: (taskId: number) => void;
}

const taskStatusMap: Record<TaskStatus, { label: string; bg: string; text: string }> = {
  TODO: { label: "Cần làm", bg: "bg-gray-100", text: "text-gray-700" },
  IN_PROGRESS: { label: "Đang làm", bg: "bg-[#E8F0FE]", text: "text-[#1A73E8]" },
  DONE: { label: "Đã xong", bg: "bg-[#E6F4EA]", text: "text-[#137333]" },
};

export function TaskRowItem({
  task,
  taskIndex,
  members = [],
  isOverdue = false,
  isClosedSprint = false,
  onSelect,
  onUpdateStatus,
  onUpdatePriority,
  onUpdateOwner,
  onDelete,
}: TaskRowItemProps) {
  const isReadOnly = isClosedSprint;
  const statusObj = taskStatusMap[task.status] || taskStatusMap.TODO;

  // Popover States
  const [showPriorityPopover, setShowPriorityPopover] = useState(false);
  const [showAssigneePopover, setShowAssigneePopover] = useState(false);
  const [showStatusPopover, setShowStatusPopover] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const priorityRef = useRef<HTMLDivElement>(null);
  const assigneeRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (priorityRef.current && !priorityRef.current.contains(event.target as Node)) {
        setShowPriorityPopover(false);
      }
      if (assigneeRef.current && !assigneeRef.current.contains(event.target as Node)) {
        setShowAssigneePopover(false);
      }
      if (statusRef.current && !statusRef.current.contains(event.target as Node)) {
        setShowStatusPopover(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const renderPriorityIcon = (priority: TaskPriority) => {
    switch (priority) {
      case "LOW":
        return (
          <div className="w-5 h-5 rounded flex items-center justify-center bg-[#E6F4EA] shrink-0">
            <span className="w-2.5 h-1.5 bg-[#10B981] rounded-xs" />
          </div>
        );
      case "MEDIUM":
        return (
          <div className="w-5 h-5 rounded flex items-center justify-center bg-[#E8F0FE] shrink-0">
            <div className="flex flex-col gap-[1.5px]">
              <span className="w-2.5 h-[2px] bg-[#3B82F6] rounded-xs" />
              <span className="w-2.5 h-[2px] bg-[#3B82F6] rounded-xs" />
            </div>
          </div>
        );
      case "HIGH":
        return (
          <div className="w-5 h-5 rounded flex items-center justify-center bg-[#FFEDD5] text-[#F97316] shrink-0">
            <ChevronUp className="w-4 h-4 stroke-[2.5]" />
          </div>
        );
      case "URGENT":
        return (
          <div className="w-5 h-5 rounded flex items-center justify-center bg-[#FEE2E2] text-[#EF4444] shrink-0">
            <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div
        draggable={!isReadOnly}
        onDragStart={(e) => {
          if (isReadOnly) return;
          e.dataTransfer.setData("taskId", task.id.toString());
          e.dataTransfer.setData("sourceSprintId", (task.sprintId || "backlog").toString());
        }}
        className={`p-3 transition-colors flex items-center justify-between gap-4 font-sans text-xs group ${
          isReadOnly ? "bg-gray-50/70 cursor-default" : "bg-white hover:bg-[#F9FAFB] cursor-grab active:cursor-grabbing"
        }`}
      >
        {/* Left side: Task Code & Title (Click to open right detail drawer) */}
        <div
          onClick={() => onSelect && onSelect(task)}
          className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
        >
          <span className="font-mono text-[11px] font-bold text-[#6B7280] bg-[#F6F5EF] px-2 py-0.5 rounded border border-[#E5E7EB] shrink-0 group-hover:border-[#111827] transition-colors">
            Task-{taskIndex !== undefined ? taskIndex + 1 : task.id}
          </span>
          <span className={`font-semibold truncate ${task.status === "DONE" ? "line-through text-gray-500" : "text-[#111827] hover:underline"}`}>
            {task.title}
          </span>

          {isReadOnly && (
            <span title="Công việc đã hoàn thành hoặc nằm trong Sprint đã đóng">
              <Lock className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
            </span>
          )}
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Overdue Badge */}
          {isOverdue && task.status !== "DONE" && (
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FDEDEC] border border-[#FADBD8] text-[#D93025] font-mono font-extrabold text-[10px] animate-pulse">
              <AlertTriangle className="w-3 h-3" />
              TRỄ HẠN
            </span>
          )}

          {/* PRIORITY POPOVER SELECTOR */}
          <div className="relative" ref={priorityRef}>
            <button
              disabled={isReadOnly}
              onClick={(e) => {
                e.stopPropagation();
                if (!isReadOnly) setShowPriorityPopover(!showPriorityPopover);
              }}
              className={`flex items-center gap-1 rounded p-1 hover:bg-[#E5E7EB] transition-colors ${
                isReadOnly ? "cursor-not-allowed opacity-80" : "cursor-pointer"
              }`}
              title={`Độ ưu tiên: ${task.priority}`}
            >
              {renderPriorityIcon(task.priority)}
            </button>

            {/* Custom Priority Dropdown Card */}
            {showPriorityPopover && (
              <div className="absolute right-0 bottom-full mb-1.5 z-50 w-36 bg-white rounded-xl shadow-2xl border border-[#E5E7EB] p-1.5 space-y-0.5 animate-in fade-in duration-100 font-sans text-xs">
                {(["LOW", "MEDIUM", "HIGH", "URGENT"] as TaskPriority[]).map((p) => {
                  const pLabels: Record<TaskPriority, string> = {
                    LOW: "Thấp",
                    MEDIUM: "Trung bình",
                    HIGH: "Cao",
                    URGENT: "Khẩn cấp",
                  };
                  const isSelected = task.priority === p;
                  return (
                    <button
                      key={p}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onUpdatePriority) onUpdatePriority(task.id, p);
                        setShowPriorityPopover(false);
                      }}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors font-medium ${
                        isSelected ? "bg-gray-100 text-[#111827] font-bold" : "hover:bg-gray-50 text-[#4B5563]"
                      }`}
                    >
                      {renderPriorityIcon(p)}
                      <span className="flex-1">{pLabels[p]}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#111827]" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* STATUS POPOVER SELECTOR (3 States: TODO, IN_PROGRESS, DONE) */}
          <div className="relative" ref={statusRef}>
            <button
              disabled={isReadOnly}
              onClick={(e) => {
                e.stopPropagation();
                if (!isReadOnly) setShowStatusPopover(!showStatusPopover);
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${statusObj.bg} ${statusObj.text} ${
                isReadOnly ? "cursor-not-allowed opacity-80" : "cursor-pointer hover:opacity-80"
              }`}
            >
              {statusObj.label}
            </button>

            {showStatusPopover && (
              <div className="absolute right-0 bottom-full mb-1.5 z-50 w-32 bg-white rounded-xl shadow-2xl border border-[#E5E7EB] p-1.5 space-y-0.5 animate-in fade-in duration-100 font-sans text-xs">
                {(["TODO", "IN_PROGRESS", "DONE"] as TaskStatus[]).map((st) => {
                  const isSelected = task.status === st;
                  const stInfo = taskStatusMap[st];
                  return (
                    <button
                      key={st}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onUpdateStatus) onUpdateStatus(task.id, st);
                        setShowStatusPopover(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors font-mono text-[10px] font-bold ${stInfo.bg} ${stInfo.text}`}
                    >
                      <span>{stInfo.label}</span>
                      {isSelected && <Check className="w-3 h-3" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ASSIGNEE POPOVER SELECTOR */}
          <div className="relative" ref={assigneeRef}>
            {(() => {
              const isAssignDisabled = isReadOnly || task.status === "DONE";
              const assignedMember = members.find((m) => {
                const mId = m.id?.userId || m.userId || m.id;
                return mId === task.ownerId || mId === task.assignee?.id;
              });

              const assignedName = assignedMember
                ? (assignedMember.user?.fullName || assignedMember.user?.email || assignedMember.fullName || assignedMember.email)
                : task.ownerName || task.assignee?.fullName || task.suggestedMemberName;

              const assignedAvatar = assignedMember?.avatarUrl || assignedMember?.user?.avatarUrl;

              const getInitials = (text?: string) => {
                if (!text) return "U";
                return text.trim().substring(0, 2).toUpperCase();
              };

              return (
                <>
                  <button
                    disabled={isAssignDisabled}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isAssignDisabled) setShowAssigneePopover(!showAssigneePopover);
                    }}
                    className={`p-0.5 rounded-full transition-transform ${
                      isAssignDisabled ? "cursor-not-allowed opacity-80" : "cursor-pointer hover:scale-105"
                    }`}
                    title={
                      task.status === "DONE"
                        ? "Công việc đã hoàn thành, không thể thay đổi người phụ trách"
                        : assignedName
                        ? `Người thực hiện: ${assignedName}`
                        : "Chưa gán người thực hiện"
                    }
                  >
                    {assignedName ? (
                      <div className="w-6 h-6 rounded-full bg-[#E8F0FE] text-[#1A73E8] font-mono font-bold text-[10px] flex items-center justify-center shrink-0 border border-[#D2E3FC] shadow-2xs">
                        {getInitials(assignedName)}
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-[#E5E7EB] hover:bg-[#D1D5DB] flex items-center justify-center text-[#6B7280] shrink-0 border border-white shadow-2xs">
                        <User className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </button>

                  {showAssigneePopover && !isAssignDisabled && (
                    <div className="absolute right-0 bottom-full mb-1.5 z-50 w-52 bg-white rounded-xl shadow-2xl border border-[#E5E7EB] p-1.5 space-y-0.5 animate-in fade-in duration-100 font-sans text-xs">
                      {/* Unassigned Choice */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onUpdateOwner) onUpdateOwner(task.id, undefined);
                          setShowAssigneePopover(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors font-medium ${
                          !task.ownerId && !task.assignee?.id ? "bg-gray-100 font-bold text-[#111827]" : "hover:bg-gray-50 text-[#6B7280]"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <div className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center shrink-0 border border-gray-200">
                            <User className="w-3 h-3" />
                          </div>
                          <span className="truncate">Chưa gán</span>
                        </div>
                        {!task.ownerId && !task.assignee?.id && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>

                      {/* Member List Choices */}
                      {members.map((m) => {
                        const mId = m.id?.userId || m.userId || m.id;
                        const mName = m.user?.fullName || m.user?.email || m.fullName || m.email || `Thành viên #${mId}`;
                        const isSelected = task.ownerId === mId || task.assignee?.id === mId;

                        return (
                          <button
                            key={mId}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onUpdateOwner) onUpdateOwner(task.id, mId);
                              setShowAssigneePopover(false);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors font-medium ${
                              isSelected ? "bg-gray-100 font-bold text-[#111827]" : "hover:bg-gray-50 text-[#4B5563]"
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate pr-2">
                              <div className="w-5 h-5 rounded-full bg-[#E8F0FE] text-[#1A73E8] font-mono font-bold text-[9px] flex items-center justify-center shrink-0 border border-[#D2E3FC]">
                                {getInitials(mName)}
                              </div>
                              <span className="truncate">{mName}</span>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-[#111827] shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          {/* Quick Delete icon */}
          {!isReadOnly && onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteConfirm(true);
              }}
              title="Xóa công việc"
              className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Dialog for Task Delete */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Xóa công việc"
        message={`Bạn có chắc chắn muốn xóa công việc "Task-${task.id}: ${task.title}" không? Hành động này không thể hoàn tác.`}
        confirmText="Xóa công việc"
        cancelText="Hủy"
        onConfirm={() => {
          if (onDelete) onDelete(task.id);
          setShowDeleteConfirm(false);
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
