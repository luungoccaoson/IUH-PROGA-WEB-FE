"use client";

import React from "react";
import { Sparkles, Compass, PlusCircle, FolderPlus } from "lucide-react";
import { Space } from "@/types";

export const SAMPLE_REQUIREMENTS = [
  {
    label: "🛒 Sàn Thương Mại Điện Tử Microservices",
    text: "Phát triển sàn thương mại điện tử quy mô lớn hỗ trợ danh mục sản phẩm ElasticSearch, giỏ hàng Redis, thanh toán VNPAY/MoMo, theo dõi đơn hàng và email hóa đơn.",
  },
  {
    label: "📱 App Ngân Hàng Số & Sinh Trắc Học",
    text: "Xây dựng ứng dụng ngân hàng số bảo mật cao với xác thực sinh trắc học FaceID, chuyển tiền liên ngân hàng 24/7 Napas, quét mã VietQR và phát hiện giao dịch bất thường.",
  },
  {
    label: "🚗 Đặt Xe Công Nghệ & Giao Hàng GPS",
    text: "Xây dựng ứng dụng đặt xe công nghệ real-time với định vị GPS, thuật toán ghép tài xế tối ưu gần nhất, tính cước phí động surge pricing và bản đồ lộ trình.",
  },
  {
    label: "🤖 Chatbot AI CSKH Doanh Nghiệp (RAG)",
    text: "Phát triển nền tảng Chatbot AI tự động trả lời thắc mắc của khách hàng dựa trên kho tài liệu doanh nghiệp RAG, hỗ trợ nhúng SDK vào Website và chuyển giao tư vấn viên.",
  },
];

export type TargetMode = "EXISTING_SPACE" | "NEW_SPACE";

interface AiHeaderBannerProps {
  spaces: Space[];
  targetMode: TargetMode;
  setTargetMode: (mode: TargetMode) => void;
  selectedSpaceId: number | null;
  onSelectSpace: (spaceId: number) => void;
  newSpaceName: string;
  setNewSpaceName: (name: string) => void;
  onSelectSamplePrompt: (text: string) => void;
  onNewChatSession?: () => void;
}

export function AiHeaderBanner({
  spaces,
  targetMode,
  setTargetMode,
  selectedSpaceId,
  onSelectSpace,
  newSpaceName,
  setNewSpaceName,
  onSelectSamplePrompt,
  onNewChatSession,
}: AiHeaderBannerProps) {
  return (
    <div className="bg-gradient-to-r from-[#111827] to-[#1F2937] text-white p-6 rounded-2xl shadow-sm space-y-5 font-sans">
      {/* Mode Selector Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#9CA3AF] mr-2 hidden sm:inline">
            Mục tiêu phân rã:
          </span>

          <button
            onClick={() => setTargetMode("EXISTING_SPACE")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              targetMode === "EXISTING_SPACE"
                ? "bg-white text-[#111827] shadow-sm"
                : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
            }`}
          >
            <Compass className="w-4 h-4" />
            1. Chọn Space Có Sẵn
          </button>

          <button
            onClick={() => setTargetMode("NEW_SPACE")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              targetMode === "NEW_SPACE"
                ? "bg-[#10B981] text-white shadow-sm"
                : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
            }`}
          >
            <FolderPlus className="w-4 h-4" />
            2. ➕ Tạo Dự Án (Space) Mới Tự Động
          </button>
        </div>

        {onNewChatSession && (
          <button
            onClick={onNewChatSession}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold text-white transition-all cursor-pointer"
            title="Xóa đàm thoại hiện tại và bắt đầu phân rã dự án mới"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#FBBF24]" />
            <span>➕ Tạo Phiên Đàm Thoại Mới</span>
          </button>
        )}
      </div>

      {/* Target Mode Inputs */}
      {targetMode === "EXISTING_SPACE" ? (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white/5 p-3.5 rounded-xl border border-white/10">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-[#FBBF24]" />
            <span className="text-xs font-bold text-white">Chọn Space có sẵn trong Workspace:</span>
          </div>

          <div className="w-full sm:w-auto">
            {spaces.length > 0 ? (
              <select
                value={selectedSpaceId || ""}
                onChange={(e) => onSelectSpace(parseInt(e.target.value, 10))}
                className="w-full sm:w-64 px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold text-white focus:outline-hidden focus:ring-2 focus:ring-white"
              >
                {spaces.map((s) => (
                  <option key={s.id} value={s.id} className="text-[#111827] bg-white">
                    {s.name} {s.isPrivate ? "(Private)" : ""}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-xs text-[#EF4444] font-bold">Chưa có Space nào trong Workspace.</span>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2 bg-white/5 p-3.5 rounded-xl border border-[#10B981]/30">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#A7F3D0] flex items-center gap-1.5">
              <FolderPlus className="w-4 h-4" />
              Tên Dự Án (Space) Mới Cần Khởi Tạo:
            </label>
            <span className="text-[11px] text-[#9CA3AF]">
              Hệ thống sẽ tự động tạo Space mới và nạp Task
            </span>
          </div>
          <input
            type="text"
            value={newSpaceName}
            onChange={(e) => setNewSpaceName(e.target.value)}
            placeholder="Nhập tên Space hoặc để trống (AI sẽ tự động gợi ý tên phù hợp)..."
            className="w-full px-3.5 py-2.5 bg-white/10 border border-white/20 rounded-xl text-sm font-semibold text-white placeholder:text-white/40 focus:outline-hidden focus:ring-2 focus:ring-[#10B981]"
          />
        </div>
      )}

      {/* Preset Prompt Chips */}
      <div className="space-y-2 pt-1">
        <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#9CA3AF]">
          Mẫu yêu cầu bài toán gợi ý (Bấm để thử nghiệm ngay):
        </p>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_REQUIREMENTS.map((req, idx) => (
            <button
              key={idx}
              onClick={() => onSelectSamplePrompt(req.text)}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-medium border border-white/15 transition-all text-left cursor-pointer"
            >
              {req.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
