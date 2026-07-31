"use client";

import React, { useState, useEffect } from "react";
import { X, Trash2, Calendar, AlignLeft, Check, Lock } from "lucide-react";
import { Task, TaskStatus, TaskPriority } from "@/types";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

interface TaskDetailDrawerProps {
  task: Task | null;
  isClosedSprint?: boolean;
  onClose: () => void;
  onUpdate: (
    taskId: number,
    data: {
      title?: string;
      description?: string;
      status?: TaskStatus;
      priority?: TaskPriority;
      ownerId?: number;
      startDate?: string;
      dueDate?: string;
    }
  ) => Promise<any>;
  onDelete: (taskId: number) => Promise<any>;
}

const PROJECT_MEMBERS = [
  { id: 2, name: "Son Luu (PM)", role: "PM" },
  { id: 4, name: "Duy Dev (Developer)", role: "Developer" },
  { id: 5, name: "Hoa Tester (QA)", role: "QA" },
];

export function TaskDetailDrawer({ task, isClosedSprint = false, onClose, onUpdate, onDelete }: TaskDetailDrawerProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("TODO");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [ownerId, setOwnerId] = useState<number | undefined>(undefined);
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setStatus(task.status);
      setPriority(task.priority);
      setOwnerId(task.ownerId);
      setStartDate(task.startDate ? task.startDate.substring(0, 10) : "");
      setDueDate(task.dueDate ? task.dueDate.substring(0, 10) : "");
    }
  }, [task]);

  if (!task) return null;

  const isReadOnly = isClosedSprint;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setIsSubmitting(true);
      await onUpdate(task.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        ownerId: ownerId || undefined,
        startDate: startDate || undefined,
        dueDate: dueDate || undefined,
      });
      onClose();
    } catch (err) {
      alert("Không thể lưu chi tiết task. Vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setIsSubmitting(true);
      await onDelete(task.id);
      setShowDeleteConfirm(false);
      onClose();
    } catch (err) {
      alert("Không thể xóa task!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Non-blocking Side-by-side Layout Panel (No dark overlay backdrop!) */}
      <div className="fixed right-0 top-0 bottom-0 z-40 w-[350px] max-w-full bg-white shadow-2xl border-l border-[#E5E7EB] flex flex-col font-sans animate-in slide-in-from-right duration-200">
        {/* Header bar */}
        <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F9FAFB]">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#6B7280] bg-[#F6F5EF] px-2 py-0.5 rounded border border-[#E5E7EB]">
              Task-{task.id}
            </span>
            {isReadOnly && (
              <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                <Lock className="w-3 h-3" /> ĐÃ XONG
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isReadOnly && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                title="Xóa công việc"
                className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onClose}
              title="Đóng bảng chi tiết"
              className="p-1.5 hover:bg-[#E5E7EB] text-[#6B7280] rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {/* Task Title Edit */}
          <div className="space-y-1">
            <label className="font-bold text-[#6B7280] uppercase tracking-wider font-mono text-[10px]">
              Tên công việc <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              disabled={isReadOnly}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-base font-extrabold text-[#111827] border-b border-transparent hover:border-[#E5E7EB] focus:border-[#111827] focus:outline-none py-1 transition-colors disabled:bg-transparent"
            />
          </div>

          {/* Quick Settings Grid (Status, Priority, Assignee) */}
          <div className="grid grid-cols-2 gap-3 bg-[#F9FAFB] p-3.5 rounded-2xl border border-[#E5E7EB]">
            {/* Status Selector (3 States) */}
            <div className="space-y-1">
              <label className="font-bold text-[#6B7280] uppercase tracking-wider font-mono text-[10px]">
                Trạng thái
              </label>
              <select
                disabled={isReadOnly}
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-2 py-1.5 bg-white border border-[#E5E7EB] rounded-xl font-bold text-xs focus:outline-none disabled:bg-gray-100"
              >
                <option value="TODO">Cần làm</option>
                <option value="IN_PROGRESS">Đang làm</option>
                <option value="DONE">Đã xong</option>
              </select>
            </div>

            {/* Priority Selector */}
            <div className="space-y-1">
              <label className="font-bold text-[#6B7280] uppercase tracking-wider font-mono text-[10px]">
                Độ ưu tiên
              </label>
              <select
                disabled={isReadOnly}
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-2 py-1.5 bg-white border border-[#E5E7EB] rounded-xl font-bold text-xs focus:outline-none disabled:bg-gray-100"
              >
                <option value="LOW">Thấp</option>
                <option value="MEDIUM">Trung bình</option>
                <option value="HIGH">Cao</option>
                <option value="URGENT">Khẩn cấp</option>
              </select>
            </div>

            {/* Assignee / Owner */}
            <div className="col-span-2 space-y-1">
              <label className="font-bold text-[#6B7280] uppercase tracking-wider font-mono text-[10px]">
                Người thực hiện (Assignee)
              </label>
              <select
                disabled={isReadOnly}
                value={ownerId || ""}
                onChange={(e) => setOwnerId(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                className="w-full px-2 py-1.5 bg-white border border-[#E5E7EB] rounded-xl font-bold text-xs focus:outline-none disabled:bg-gray-100"
              >
                <option value="">-- Chưa gán người thực hiện --</option>
                {PROJECT_MEMBERS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dates Section */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-[#6B7280] uppercase tracking-wider font-mono text-[10px] flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Ngày bắt đầu
              </label>
              <input
                type="date"
                disabled={isReadOnly}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-[#E5E7EB] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#111827] disabled:bg-gray-100"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#6B7280] uppercase tracking-wider font-mono text-[10px] flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Ngày kết thúc (Due Date)
              </label>
              <input
                type="date"
                disabled={isReadOnly}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-[#E5E7EB] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#111827] disabled:bg-gray-100"
              />
            </div>
          </div>

          {/* Description Editor */}
          <div className="space-y-1 pt-1">
            <label className="font-bold text-[#6B7280] uppercase tracking-wider font-mono text-[10px] flex items-center gap-1">
              <AlignLeft className="w-3 h-3" />
              Mô tả chi tiết (Description)
            </label>
            <textarea
              rows={5}
              disabled={isReadOnly}
              placeholder="Thêm mô tả chi tiết cho công việc tại đây..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 border border-[#E5E7EB] rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-[#111827] text-xs font-medium text-[#111827] leading-relaxed disabled:bg-gray-50"
            />
          </div>

          {/* Footer Bar */}
          {!isReadOnly && (
            <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 border border-[#E5E7EB] bg-white hover:bg-gray-50 rounded-xl text-xs font-bold text-[#4B5563]"
              >
                Hủy
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-[#111827] hover:bg-[#1f2937] text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Confirmation Dialog for Task Delete */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Xóa công việc"
        message={`Bạn có chắc chắn muốn xóa công việc "Task-${task.id}: ${task.title}" không?`}
        confirmText="Xóa công việc"
        cancelText="Hủy"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
