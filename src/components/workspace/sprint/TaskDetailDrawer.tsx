"use client";

import React, { useState, useEffect } from "react";
import { X, Trash2, Calendar, User, AlignLeft, AlertTriangle, ChevronUp, Check } from "lucide-react";
import { Task, TaskStatus, TaskPriority } from "@/types";

interface TaskDetailDrawerProps {
  task: Task | null;
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

// Project Members list for Assignee selection
const PROJECT_MEMBERS = [
  { id: 2, name: "Son Luu (PM)", role: "PM" },
  { id: 4, name: "Duy Dev (Developer)", role: "Developer" },
  { id: 5, name: "Hoa Tester (QA)", role: "QA" },
];

export function TaskDetailDrawer({ task, onClose, onUpdate, onDelete }: TaskDetailDrawerProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("TODO");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [ownerId, setOwnerId] = useState<number | undefined>(undefined);
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleDelete = async () => {
    if (!window.confirm(`Bạn có chắc muốn xóa công việc "Task-${task.id}: ${task.title}" không?`)) {
      return;
    }
    try {
      setIsSubmitting(true);
      await onDelete(task.id);
      onClose();
    } catch (err) {
      alert("Không thể xóa task!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/30 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col border-l border-[#E5E7EB] font-sans">
        {/* Header bar */}
        <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F9FAFB]">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#6B7280] bg-[#F6F5EF] px-2 py-0.5 rounded border border-[#E5E7EB]">
              Task-{task.id}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              title="Xóa công việc"
              className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              title="Đóng"
              className="p-1.5 hover:bg-[#E5E7EB] text-[#6B7280] rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Task Title Edit */}
          <div className="space-y-1">
            <label className="font-bold text-[#6B7280] uppercase tracking-wider font-mono text-[10px]">
              Tên công việc <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-base font-extrabold text-[#111827] border-b border-transparent hover:border-[#E5E7EB] focus:border-[#111827] focus:outline-none py-1 transition-colors"
            />
          </div>

          {/* Quick Settings Grid (Status, Priority, Assignee) */}
          <div className="grid grid-cols-2 gap-4 bg-[#F9FAFB] p-4 rounded-2xl border border-[#E5E7EB]">
            {/* Status Selector */}
            <div className="space-y-1">
              <label className="font-bold text-[#6B7280] uppercase tracking-wider font-mono text-[10px]">
                Trạng thái
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-2.5 py-1.5 bg-white border border-[#E5E7EB] rounded-xl font-bold text-xs focus:outline-none"
              >
                <option value="TODO">Cần làm (TODO)</option>
                <option value="IN_PROGRESS">Đang làm (IN_PROGRESS)</option>
                <option value="REVIEW">Đang duyệt (REVIEW)</option>
                <option value="DONE">Đã xong (DONE)</option>
              </select>
            </div>

            {/* Priority Selector */}
            <div className="space-y-1">
              <label className="font-bold text-[#6B7280] uppercase tracking-wider font-mono text-[10px]">
                Độ ưu tiên
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-2.5 py-1.5 bg-white border border-[#E5E7EB] rounded-xl font-bold text-xs focus:outline-none"
              >
                <option value="LOW">Thấp (Low)</option>
                <option value="MEDIUM">Trung bình (Medium)</option>
                <option value="HIGH">Cao (High)</option>
                <option value="URGENT">Khẩn cấp (Urgent)</option>
              </select>
            </div>

            {/* Assignee / Owner */}
            <div className="col-span-2 space-y-1">
              <label className="font-bold text-[#6B7280] uppercase tracking-wider font-mono text-[10px]">
                Người thực hiện (Assignee)
              </label>
              <select
                value={ownerId || ""}
                onChange={(e) => setOwnerId(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                className="w-full px-2.5 py-1.5 bg-white border border-[#E5E7EB] rounded-xl font-bold text-xs focus:outline-none"
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-[#6B7280] uppercase tracking-wider font-mono text-[10px] flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Ngày bắt đầu
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#E5E7EB] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#111827]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#6B7280] uppercase tracking-wider font-mono text-[10px] flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Ngày kết thúc (Due Date)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#E5E7EB] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#111827]"
              />
            </div>
          </div>

          {/* Description Editor */}
          <div className="space-y-1 pt-2">
            <label className="font-bold text-[#6B7280] uppercase tracking-wider font-mono text-[10px] flex items-center gap-1">
              <AlignLeft className="w-3 h-3" />
              Mô tả chi tiết (Description)
            </label>
            <textarea
              rows={6}
              placeholder="Thêm mô tả chi tiết cho công việc tại đây..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 border border-[#E5E7EB] rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-[#111827] text-xs font-medium text-[#111827] leading-relaxed"
            />
          </div>

          {/* Footer Bar */}
          <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#E5E7EB] bg-white hover:bg-gray-50 rounded-xl text-xs font-bold text-[#4B5563]"
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
        </form>
      </div>
    </div>
  );
}
