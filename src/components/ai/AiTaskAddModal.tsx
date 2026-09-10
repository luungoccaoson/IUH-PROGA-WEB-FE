"use client";

import React, { useState } from "react";
import { PlusCircle, Plus, X } from "lucide-react";
import { DecomposedTaskItem } from "@/services/ai.service";

interface AiTaskAddModalProps {
  isOpen: boolean;
  sprintName: string | null;
  onSave: (newTask: DecomposedTaskItem) => void;
  onClose: () => void;
}

export function AiTaskAddModal({
  isOpen,
  sprintName,
  onSave,
  onClose,
}: AiTaskAddModalProps) {
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPriority, setNewPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("HIGH");
  const [newEstimatedDays, setNewEstimatedDays] = useState<number>(2);

  if (!isOpen || !sprintName) return null;

  const handleSave = () => {
    if (!newTitle.trim()) return;

    const newTask: DecomposedTaskItem = {
      sprint: sprintName,
      title: newTitle.trim(),
      description: newDescription.trim() || "Công việc được bổ sung thủ công",
      priority: newPriority,
      estimatedDays: newEstimatedDays,
    };

    onSave(newTask);
    setNewTitle("");
    setNewDescription("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#111827]/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-[#E5E7EB] rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 font-sans">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
          <h3 className="text-base font-extrabold text-[#111827] flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-[#137333]" /> Thêm Task Mới Vào {sprintName}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 font-sans">
          <div>
            <label className="text-xs font-bold text-[#374151] font-mono uppercase">Tiêu đề Task mới:</label>
            <input
              type="text"
              placeholder="Nhập tên công việc cần làm..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-3.5 py-2 border border-[#E5E7EB] rounded-xl text-sm font-bold text-[#111827] mt-1 outline-none focus:border-[#1A73E8]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#374151] font-mono uppercase">Mô tả công việc:</label>
            <textarea
              rows={3}
              placeholder="Mô tả công việc chi tiết..."
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="w-full px-3.5 py-2 border border-[#E5E7EB] rounded-xl text-xs text-[#111827] mt-1 outline-none focus:border-[#1A73E8]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[#374151] font-mono uppercase">Mức ưu tiên:</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as any)}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl text-xs font-bold text-[#111827] mt-1 cursor-pointer outline-none focus:border-[#1A73E8]"
              >
                <option value="URGENT">URGENT</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-[#374151] font-mono uppercase">Số ngày ước tính:</label>
              <input
                type="number"
                min={1}
                max={30}
                value={newEstimatedDays}
                onChange={(e) => setNewEstimatedDays(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl text-xs font-bold text-[#111827] mt-1 outline-none focus:border-[#1A73E8]"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E7EB]">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-bold rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={!newTitle.trim()}
            className="px-4 py-2 bg-[#137333] hover:bg-[#0D652D] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Thêm Task
          </button>
        </div>
      </div>
    </div>
  );
}
