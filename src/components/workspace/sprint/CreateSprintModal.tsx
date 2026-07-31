"use client";

import React, { useState } from "react";
import { Plus, X } from "lucide-react";

interface CreateSprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; goal?: string; startDate?: string; endDate?: string }) => Promise<any>;
}

export function CreateSprintModal({ isOpen, onClose, onSubmit }: CreateSprintModalProps) {
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSubmitting(true);
      await onSubmit({
        name: name.trim(),
        goal: goal.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setName("");
      setGoal("");
      setStartDate("");
      setEndDate("");
      onClose();
    } catch (err) {
      alert("Không thể tạo Sprint. Vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-[#E5E7EB]">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
          <h3 className="font-extrabold text-[#111827] text-base font-sans flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#111827]" />
            Tạo Sprint mới
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#E5E7EB] rounded-lg text-[#6B7280]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 font-sans text-xs">
          <div className="space-y-1">
            <label className="font-bold text-[#111827] uppercase tracking-wider font-mono text-[11px]">
              Tên Sprint <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ví dụ: PROGA Sprint 1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#111827]"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-[#111827] uppercase tracking-wider font-mono text-[11px]">
              Mục tiêu Sprint (Goal)
            </label>
            <textarea
              rows={2}
              placeholder="Ví dụ: Hoàn thành thiết kế DB và API Auth"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#111827]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-[#111827] uppercase tracking-wider font-mono text-[11px]">
                Ngày bắt đầu
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#111827]"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-[#111827] uppercase tracking-wider font-mono text-[11px]">
                Ngày kết thúc
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#111827]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E7EB]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#E5E7EB] bg-white hover:bg-gray-50 rounded-xl text-xs font-bold text-[#4B5563]"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-[#111827] hover:bg-[#1f2937] text-white rounded-xl text-xs font-mono font-bold disabled:opacity-50"
            >
              {isSubmitting ? "Đang tạo..." : "Xác nhận tạo Sprint"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
