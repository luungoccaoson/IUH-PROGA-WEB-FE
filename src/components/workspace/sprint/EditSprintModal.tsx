"use client";

import React, { useState, useEffect } from "react";
import { Edit3, X } from "lucide-react";
import { Sprint, SprintStatus } from "@/types";

interface EditSprintModalProps {
  sprint: Sprint | null;
  onClose: () => void;
  onSubmit: (
    sprintId: number,
    data: { name: string; goal?: string; status?: SprintStatus; startDate?: string; endDate?: string }
  ) => Promise<any>;
}

export function EditSprintModal({ sprint, onClose, onSubmit }: EditSprintModalProps) {
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (sprint) {
      setName(sprint.name);
      setGoal(sprint.goal || "");
      setStartDate(sprint.startDate ? sprint.startDate.substring(0, 10) : "");
      setEndDate(sprint.endDate ? sprint.endDate.substring(0, 10) : "");
    }
  }, [sprint]);

  if (!sprint) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSubmitting(true);
      await onSubmit(sprint.id, {
        name: name.trim(),
        goal: goal.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      onClose();
    } catch (err) {
      alert("Không thể cập nhật Sprint. Vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-[#E5E7EB]">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
          <h3 className="font-extrabold text-[#111827] text-base font-sans flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-[#111827]" />
            Cập nhật thông tin Sprint
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
              Tên Sprint
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#111827]"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-[#111827] uppercase tracking-wider font-mono text-[11px]">
              Mục tiêu Sprint
            </label>
            <textarea
              rows={2}
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
              {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
