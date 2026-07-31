"use client";

import React, { useState } from "react";
import { Plus, Check, X } from "lucide-react";

interface InlineCreateTaskProps {
  sprintId?: number | null;
  onCreate: (data: { title: string; sprintId?: number | null }) => Promise<any>;
}

export function InlineCreateTask({ sprintId, onCreate }: InlineCreateTaskProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setIsSubmitting(true);
      await onCreate({ title: title.trim(), sprintId });
      setTitle("");
      setIsCreating(false);
    } catch (err) {
      alert("Không thể tạo task. Vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isCreating) {
    return (
      <button
        onClick={() => setIsCreating(true)}
        className="w-full py-2.5 px-3 border border-dashed border-[#E5E7EB] hover:border-[#111827] bg-white hover:bg-gray-50 rounded-xl text-xs font-mono font-bold text-[#6B7280] hover:text-[#111827] transition-all flex items-center justify-center gap-1.5 shadow-2xs"
      >
        <Plus className="w-3.5 h-3.5" />
        TẠO CÔNG VIỆC MỚI
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="p-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl flex items-center gap-3 animate-in fade-in duration-150 font-sans text-xs"
    >
      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-gray-100 text-gray-700 shrink-0">
        Cần làm (TODO)
      </span>

      <input
        type="text"
        autoFocus
        required
        placeholder="Nhập tên task mới (bắt buộc)..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="flex-1 px-3 py-1.5 border border-[#E5E7EB] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#111827] text-xs font-medium text-[#111827]"
      />

      <div className="flex items-center gap-1 shrink-0">
        <button
          type="submit"
          disabled={isSubmitting || !title.trim()}
          className="p-1.5 bg-[#111827] hover:bg-[#1f2937] text-white rounded-lg transition-colors disabled:opacity-50"
          title="Lưu công việc"
        >
          <Check className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => {
            setTitle("");
            setIsCreating(false);
          }}
          className="p-1.5 hover:bg-[#E5E7EB] text-[#6B7280] rounded-lg transition-colors"
          title="Hủy"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </form>
  );
}
