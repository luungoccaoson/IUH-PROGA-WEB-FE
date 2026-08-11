"use client";

import React, { useRef, useEffect } from "react";
import { Send, RefreshCw, AlertCircle } from "lucide-react";

interface AiRequirementInputProps {
  requirementText: string;
  setRequirementText: (text: string) => void;
  onSubmit: () => void;
  loading: boolean;
  disabled: boolean;
  error?: string;
}

export function AiRequirementInput({
  requirementText,
  setRequirementText,
  onSubmit,
  loading,
  disabled,
  error,
}: AiRequirementInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize chiều cao linh hoạt giữa min (130px) và max (300px), tự động hiện scrollbar nếu vượt quá 300px
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const calculatedHeight = Math.min(Math.max(130, textareaRef.current.scrollHeight), 300);
      textareaRef.current.style.height = `${calculatedHeight}px`;
    }
  }, [requirementText]);

  return (
    <div className="bg-white border border-[#E5E7EB] p-5 rounded-2xl shadow-2xs space-y-4 font-sans">
      <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#374151]">
        Mô tả bài toán / Yêu cầu tính năng cần phân rã:
      </label>
      <textarea
        ref={textareaRef}
        value={requirementText}
        onChange={(e) => setRequirementText(e.target.value)}
        placeholder="Nhập chi tiết yêu cầu bài toán hoặc chọn các mẫu gợi ý phía trên..."
        className="w-full p-4 border border-[#E5E7EB] rounded-xl text-sm leading-relaxed text-[#111827] focus:outline-hidden focus:ring-2 focus:ring-[#111827] focus:border-transparent placeholder-[#9CA3AF] resize-y min-h-[130px] max-h-[300px] overflow-y-auto transition-all"
      />

      {error && (
        <div className="flex items-center gap-2 p-3 bg-[#FDEDEC] text-[#D93025] rounded-xl text-xs font-bold border border-[#FADBD8]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <p className="text-xs text-[#6B7280]">
          💡 AI sẽ tự động phân tích ngữ nghĩa, truy xuất kho tri thức Vector RAG và phân chia Task theo Sprint.
        </p>
        <button
          onClick={onSubmit}
          disabled={disabled || loading || !requirementText.trim()}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#111827] text-white hover:bg-[#1F2937] active:scale-95 disabled:opacity-50 disabled:scale-100 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-[#FBBF24]" />
              Đang truy vấn AI RAG...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Phân Rã Bài Toán
            </>
          )}
        </button>
      </div>
    </div>
  );
}
