"use client";

import React, { useState, useEffect } from "react";
import { Pencil, X, Save } from "lucide-react";
import { DecomposedTaskItem } from "@/services/ai.service";

interface AiTaskEditModalProps {
  isOpen: boolean;
  task: DecomposedTaskItem | null;
  taskIndex: number | null;
  availableSprints: string[];
  onSave: (index: number, updatedTask: DecomposedTaskItem) => void;
  onClose: () => void;
}

export function AiTaskEditModal({
  isOpen,
  task,
  taskIndex,
  availableSprints,
  onSave,
  onClose,
}: AiTaskEditModalProps) {
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("HIGH");
  const [editEstimatedDays, setEditEstimatedDays] = useState<number>(2);
  const [editBufferDays, setEditBufferDays] = useState<number>(0);
  const [editAssignedRole, setEditAssignedRole] = useState<string>("Backend Developer");
  const [editSprint, setEditSprint] = useState<string>("Sprint 1");

  useEffect(() => {
    if (task) {
      setEditTitle(task.title || "");
      setEditDescription(task.description || "");
      setEditPriority(task.priority || "HIGH");
      setEditEstimatedDays(task.estimatedDays || 2);
      setEditBufferDays(task.bufferDays || 0);
      setEditAssignedRole(task.assignedRole || "Backend Developer");
      setEditSprint(task.sprint || "Sprint 1");
    }
  }, [task]);

  if (!isOpen || taskIndex === null || !task) return null;

  const handleSave = () => {
    if (!editTitle.trim()) return;

    onSave(taskIndex, {
      ...task,
      title: editTitle.trim(),
      description: editDescription.trim(),
      priority: editPriority,
      estimatedDays: editEstimatedDays,
      bufferDays: editBufferDays,
      assignedRole: editAssignedRole,
      sprint: editSprint,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#111827]/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-[#E5E7EB] rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 font-sans">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
          <h3 className="text-base font-extrabold text-[#111827] flex items-center gap-2">
            <Pencil className="w-4 h-4 text-[#1A73E8]" /> Chỉnh Sửa Task AI Phân Rã
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-[#374151] font-mono uppercase">Tiêu đề Task:</label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-3.5 py-2 border border-[#E5E7EB] rounded-xl text-sm font-bold text-[#111827] mt-1 outline-none focus:border-[#1A73E8]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#374151] font-mono uppercase">Mô tả công việc:</label>
            <textarea
              rows={3}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full px-3.5 py-2 border border-[#E5E7EB] rounded-xl text-xs text-[#111827] mt-1 outline-none focus:border-[#1A73E8]"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-[#374151] font-mono uppercase">Sprint:</label>
              <select
                value={editSprint}
                onChange={(e) => setEditSprint(e.target.value)}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl text-xs font-bold text-[#111827] mt-1 cursor-pointer outline-none focus:border-[#1A73E8]"
              >
                {availableSprints.map((sp) => (
                  <option key={sp} value={sp}>
                    {sp}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-[#374151] font-mono uppercase">Mức ưu tiên:</label>
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value as any)}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl text-xs font-bold text-[#111827] mt-1 cursor-pointer outline-none focus:border-[#1A73E8]"
              >
                <option value="URGENT">URGENT</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-[#374151] font-mono uppercase">Số ngày làm:</label>
              <input
                type="number"
                min={1}
                max={30}
                value={editEstimatedDays}
                onChange={(e) => setEditEstimatedDays(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl text-xs font-bold text-[#111827] mt-1 outline-none focus:border-[#1A73E8]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[#374151] font-mono uppercase">Ngày dự phòng rủi ro:</label>
              <select
                value={editBufferDays}
                onChange={(e) => setEditBufferDays(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl text-xs font-bold text-[#111827] mt-1 cursor-pointer outline-none focus:border-[#1A73E8]"
              >
                <option value={0}>0 ngày (Không có rủi ro)</option>
                <option value={1}>+1 ngày dự phòng</option>
                <option value={2}>+2 ngày dự phòng (Rủi ro cao)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-[#374151] font-mono uppercase">Vai trò đảm nhiệm (Role):</label>
              <select
                value={editAssignedRole}
                onChange={(e) => setEditAssignedRole(e.target.value)}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl text-xs font-bold text-[#111827] mt-1 cursor-pointer outline-none focus:border-[#1A73E8]"
              >
                <option value="Tech Lead / System Architect">Tech Lead / System Architect</option>
                <option value="Senior Backend Developer">Senior Backend Developer</option>
                <option value="Backend Developer">Backend Developer</option>
                <option value="Frontend Developer">Frontend Developer</option>
                <option value="DevOps / SRE Engineer">DevOps / SRE Engineer</option>
                <option value="QA / QC Lead">QA / QC Lead</option>
                <option value="Business Analyst (BA)">Business Analyst (BA)</option>
              </select>
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
            className="px-4 py-2 bg-[#111827] hover:bg-black text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
          >
            <Save className="w-3.5 h-3.5" /> Lưu Thay Đổi
          </button>
        </div>
      </div>
    </div>
  );
}
