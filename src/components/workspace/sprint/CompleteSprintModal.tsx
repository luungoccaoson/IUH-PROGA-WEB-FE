"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, X, AlertTriangle, ArrowRight, Clock, Calendar, ShieldCheck } from "lucide-react";
import { Sprint, Task } from "@/types";

interface CompleteSprintModalProps {
  isOpen: boolean;
  sprint: Sprint | null;
  tasks: Task[];
  nextSprint: Sprint | null;
  onClose: () => void;
  onConfirm: (data: {
    sprintId: number;
    targetSprintId: number | null;
    scheduleOption: "cascade" | "keep_deadline";
  }) => Promise<void>;
}

export function CompleteSprintModal({
  isOpen,
  sprint,
  tasks,
  nextSprint,
  onClose,
  onConfirm,
}: CompleteSprintModalProps) {
  const [targetSprintId, setTargetSprintId] = useState<number | null>(nextSprint?.id || null);
  const [scheduleOption, setScheduleOption] = useState<"cascade" | "keep_deadline">("cascade");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      setTargetSprintId(nextSprint?.id || null);
      setScheduleOption("cascade");
      setErrorMsg("");
    }
  }, [isOpen, nextSprint]);

  if (!isOpen || !sprint) return null;

  // Filter tasks belonging to this sprint (including unfinished tasks)
  const sprintTasks = tasks.filter((t) => t.sprintId === sprint.id && !t.isDeleted);
  const completedTasks = sprintTasks.filter((t) => t.status === "DONE");
  const incompleteTasks = sprintTasks.filter((t) => t.status !== "DONE");

  // Check if sprint is ending late compared to planned endDate
  const isOverdue = Boolean(
    sprint.endDate && new Date(sprint.endDate).setHours(23, 59, 59, 999) < Date.now()
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setErrorMsg("");
      await onConfirm({
        sprintId: sprint.id,
        targetSprintId: incompleteTasks.length > 0 ? targetSprintId : null,
        scheduleOption,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || "Không thể kết thúc giai đoạn này. Vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-[#E5E7EB]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#111827] text-base font-sans">
                Kết thúc {sprint.name}
              </h3>
              <p className="text-[11px] text-[#6B7280]">
                Tổng kết kết quả và chuyển giao các công việc còn lại
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

        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
            {errorMsg}
          </div>
        )}

        {/* Task Summary Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 font-mono">
              Đã hoàn thành
            </span>
            <p className="text-xl font-extrabold text-emerald-700 mt-0.5">
              {completedTasks.length}{" "}
              <span className="text-xs font-normal text-emerald-600">công việc</span>
            </p>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 font-mono">
              Chưa hoàn thành
            </span>
            <p className="text-xl font-extrabold text-amber-700 mt-0.5">
              {incompleteTasks.length}{" "}
              <span className="text-xs font-normal text-amber-600">công việc</span>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 font-sans text-xs">
          {/* Section: Handing incomplete tasks */}
          {incompleteTasks.length > 0 && (
            <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <label className="font-bold text-slate-800 text-[11px] block">
                Chuyển {incompleteTasks.length} công việc chưa hoàn thành đến:
              </label>

              <div className="space-y-1.5 pl-1">
                {nextSprint && (
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="targetSprint"
                      checked={targetSprintId === nextSprint.id}
                      onChange={() => setTargetSprintId(nextSprint.id)}
                      className="text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                    />
                    <span className="text-slate-800 font-medium">
                      Giai đoạn kế tiếp: <strong>{nextSprint.name}</strong> (Khuyên dùng)
                    </span>
                  </label>
                )}

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="targetSprint"
                    checked={targetSprintId === null}
                    onChange={() => setTargetSprintId(null)}
                    className="text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                  />
                  <span className="text-slate-800 font-medium">
                    Hàng chờ công việc chung của dự án (Backlog)
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Section: AI Schedule Adjustment (If ending after planned date or next sprint exists) */}
          {nextSprint && (
            <div className="space-y-2 p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl">
              <div className="flex items-center gap-1.5 text-indigo-900 font-bold text-[11px]">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span>Đề xuất điều chỉnh lịch trình từ Trợ lý quản lý dự án:</span>
              </div>

              {isOverdue && (
                <p className="text-[11px] text-amber-800 bg-amber-100/60 p-1.5 rounded-lg border border-amber-200">
                  Giai đoạn này kết thúc trễ hơn kế hoạch dự kiến ban đầu.
                </p>
              )}

              <div className="space-y-2 pl-1 pt-1">
                <label className="flex items-start gap-2 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="scheduleOption"
                    value="cascade"
                    checked={scheduleOption === "cascade"}
                    onChange={() => setScheduleOption("cascade")}
                    className="text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 mt-0.5"
                  />
                  <div>
                    <span className="text-slate-900 font-bold block">
                      Lựa chọn 1: Dời lùi toàn bộ lịch trình (Khuyên dùng)
                    </span>
                    <span className="text-[11px] text-slate-600 leading-normal block">
                      Giữ nguyên số ngày làm việc của từng giai đoạn. Các giai đoạn sau sẽ tự động lùi ngày bắt đầu và kết thúc, đảm bảo các giai đoạn không bị trùng ngày nhau.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="scheduleOption"
                    value="keep_deadline"
                    checked={scheduleOption === "keep_deadline"}
                    onChange={() => setScheduleOption("keep_deadline")}
                    className="text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 mt-0.5"
                  />
                  <div>
                    <span className="text-slate-900 font-bold block">
                      Lựa chọn 2: Giữ nguyên hạn chót dự án
                    </span>
                    <span className="text-[11px] text-slate-600 leading-normal block">
                      Giữ nguyên ngày kết thúc cuối cùng của dự án. Giai đoạn kế tiếp sẽ bắt đầu từ hôm nay và rút ngắn số ngày lại cho kịp tiến độ.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Footer buttons */}
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
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Đang xử lý..." : "Xác nhận kết thúc"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
