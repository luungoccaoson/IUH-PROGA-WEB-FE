"use client";

import React, { useState } from "react";
import { AlertTriangle, Trash2, Layers, X } from "lucide-react";
import { Sprint } from "@/types";

interface DeleteSprintModalProps {
  isOpen: boolean;
  sprint: Sprint | null;
  taskCount?: number;
  onClose: () => void;
  onConfirm: (sprintId: number, deleteTasks: boolean) => Promise<void>;
}

export function DeleteSprintModal({
  isOpen,
  sprint,
  taskCount = 0,
  onClose,
  onConfirm,
}: DeleteSprintModalProps) {
  const [deleteTasks, setDeleteTasks] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !sprint) return null;

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      await onConfirm(sprint.id, deleteTasks);
      onClose();
    } catch (err) {
      alert("Không thể xóa Sprint. Vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2.5 text-red-600">
            <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#111827] text-base font-sans">
                Xác nhận xóa Sprint
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                {sprint.name} ({taskCount} công việc)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Question & 2 Options */}
        <div className="space-y-3">
          <p className="text-sm text-gray-700 font-medium">
            Sprint này đang có <strong className="text-gray-900">{taskCount} công việc</strong>. Bạn muốn xử lý các công việc này như thế nào khi xóa Sprint?
          </p>

          <div className="space-y-2.5 pt-1">
            {/* Option 1: Move to Backlog (Recommended) */}
            <label
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                !deleteTasks
                  ? "border-[#1A73E8] bg-[#E8F0FE]/30 ring-1 ring-[#1A73E8]"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              }`}
            >
              <input
                type="radio"
                name="deleteTasksOption"
                checked={!deleteTasks}
                onChange={() => setDeleteTasks(false)}
                className="mt-1 w-4 h-4 text-[#1A73E8] focus:ring-[#1A73E8]"
              />
              <div className="flex-1">
                <div className="flex items-center gap-1.5 font-bold text-sm text-gray-900">
                  <Layers className="w-4 h-4 text-[#1A73E8]" />
                  <span>Chuyển tất cả công việc về Backlog</span>
                  <span className="text-[10px] font-mono font-bold bg-[#E6F4EA] text-[#137333] px-1.5 py-0.5 rounded-md">
                    Khuyên dùng
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Xóa Sprint nhưng giữ nguyên {taskCount} công việc và chuyển xuống danh sách chờ (Backlog) để phân bổ sau.
                </p>
              </div>
            </label>

            {/* Option 2: Delete All Tasks */}
            <label
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                deleteTasks
                  ? "border-red-500 bg-red-50/40 ring-1 ring-red-500"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              }`}
            >
              <input
                type="radio"
                name="deleteTasksOption"
                checked={deleteTasks}
                onChange={() => setDeleteTasks(true)}
                className="mt-1 w-4 h-4 text-red-600 focus:ring-red-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-1.5 font-bold text-sm text-red-600">
                  <Trash2 className="w-4 h-4 text-red-600" />
                  <span>Xóa vĩnh viễn cả Sprint và tất cả {taskCount} công việc</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Tất cả các công việc trong Sprint này sẽ bị xóa vĩnh viễn và không thể khôi phục.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className={`px-4 py-2 text-xs font-bold text-white rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1.5 ${
              deleteTasks
                ? "bg-red-600 hover:bg-red-700"
                : "bg-[#111827] hover:bg-black"
            }`}
          >
            {isSubmitting && (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {deleteTasks ? "Xác nhận xóa vĩnh viễn" : "Xác nhận xóa Sprint"}
          </button>
        </div>
      </div>
    </div>
  );
}
