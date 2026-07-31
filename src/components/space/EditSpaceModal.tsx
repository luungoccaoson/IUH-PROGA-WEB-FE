"use client";

import React, { useState, useEffect } from "react";
import { Settings, X, Trash2, Calendar } from "lucide-react";
import { Space } from "@/types";

interface EditSpaceModalProps {
  isOpen: boolean;
  space: Space | null;
  onClose: () => void;
  onUpdate: (data: { name: string; startDate?: string; endDate?: string }) => Promise<any>;
  onDelete: () => Promise<any>;
}

export function EditSpaceModal({
  isOpen,
  space,
  onClose,
  onUpdate,
  onDelete,
}: EditSpaceModalProps) {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (space && isOpen) {
      setName(space.name);
      setStartDate(space.startDate ? space.startDate.substring(0, 10) : "");
      setEndDate(space.endDate ? space.endDate.substring(0, 10) : "");
      setError("");
    }
  }, [space, isOpen]);

  if (!isOpen || !space) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSubmitting(true);
      setError("");
      await onUpdate({
        name: name.trim(),
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Không thể cập nhật Space!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsSubmitting(true);
      setError("");
      await onDelete();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Không thể xóa Space!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#E5E7EB] font-sans">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
          <h3 className="font-extrabold text-[#111827] text-sm flex items-center gap-2">
            <Settings className="w-4 h-4 text-[#111827]" />
            Cài đặt Space
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#E5E7EB] rounded-lg text-[#6B7280]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="bg-[#FDEDEC] border border-[#FADBD8] text-[#D93025] p-3 rounded-xl text-xs font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-[#111827] uppercase tracking-wider font-mono text-[11px]">
              Tên Space <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#111827]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-[#111827] uppercase tracking-wider font-mono text-[11px] flex items-center gap-1">
                <Calendar className="w-3 h-3" />
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
              <label className="font-bold text-[#111827] uppercase tracking-wider font-mono text-[11px] flex items-center gap-1">
                <Calendar className="w-3 h-3" />
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

          <div className="flex items-center justify-between pt-3 border-t border-[#E5E7EB]">
            <button
              type="button"
              onClick={handleDelete}
              className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Xóa Space
            </button>

            <div className="flex items-center gap-2">
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
                className="px-4 py-2 bg-[#111827] hover:bg-[#1f2937] text-white rounded-xl text-xs font-mono font-bold disabled:opacity-50"
              >
                {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
