"use client";

import React, { useState, useEffect } from "react";
import { Play, X, Calendar, AlertTriangle } from "lucide-react";
import { Sprint } from "@/types";

interface StartSprintModalProps {
  isOpen: boolean;
  sprint: Sprint | null;
  activeSprint?: Sprint | null;
  onClose: () => void;
  onConfirm: (data: {
    sprintId: number;
    startDate: string;
    endDate: string;
    goal?: string;
  }) => Promise<void>;
}

export function StartSprintModal({
  isOpen,
  sprint,
  activeSprint,
  onClose,
  onConfirm,
}: StartSprintModalProps) {
  const [goal, setGoal] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen && sprint) {
      setGoal(sprint.goal || "");
      setErrorMsg("");

      // Mặc định ngày bắt đầu là hôm nay nếu chưa có hoặc đã quá hạn
      const todayStr = new Date().toISOString().split("T")[0];
      const initialStart = sprint.startDate ? sprint.startDate.split("T")[0] : todayStr;
      setStartDate(initialStart);

      // Nếu có sẵn ngày kết thúc thì lấy, ngược lại tính +7 ngày
      if (sprint.endDate) {
        setEndDate(sprint.endDate.split("T")[0]);
      } else {
        const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        setEndDate(nextWeek);
      }
    }
  }, [isOpen, sprint]);

  if (!isOpen || !sprint) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      setErrorMsg("Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc.");
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setErrorMsg("Ngày kết thúc không được trước ngày bắt đầu.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg("");
      await onConfirm({
        sprintId: sprint.id,
        startDate,
        endDate,
        goal: goal.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || "Không thể bắt đầu giai đoạn này. Vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-[#E5E7EB]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Play className="w-4 h-4 fill-emerald-800" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#111827] text-base font-sans">
                Bắt đầu {sprint.name}
              </h3>
              <p className="text-[11px] text-[#6B7280]">
                Kích hoạt công việc của giai đoạn này lên bảng theo dõi
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-[#E5E7EB] rounded-lg text-[#6B7280] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning if another sprint is currently active */}
        {activeSprint && activeSprint.id !== sprint.id && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Đang có giai đoạn khác đang chạy:</p>
              <p className="text-[11px] mt-0.5">
                <strong>{activeSprint.name}</strong> sẽ tự động được đóng lại để chuyển quyền ưu tiên sang giai đoạn mới này.
              </p>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 font-sans text-xs">
          {/* Goal input */}
          <div className="space-y-1">
            <label className="font-bold text-[#111827] uppercase tracking-wider font-mono text-[10px]">
              Mục tiêu giai đoạn (Tùy chọn)
            </label>
            <textarea
              rows={2}
              placeholder="Ví dụ: Hoàn thiện chức năng đăng nhập và quản lý thành viên..."
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#111827] text-xs resize-none"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-[#111827] uppercase tracking-wider font-mono text-[10px] flex items-center gap-1">
                <Calendar className="w-3 h-3 text-gray-500" />
                Ngày bắt đầu
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#111827] text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#111827] uppercase tracking-wider font-mono text-[10px] flex items-center gap-1">
                <Calendar className="w-3 h-3 text-gray-500" />
                Ngày kết thúc
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#111827] text-xs font-mono"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#E5E7EB]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-[#E5E7EB] hover:bg-[#F3F4F6] text-[#4B5563] font-bold rounded-xl cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>{isSubmitting ? "Đang xử lý..." : "Bắt đầu"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
