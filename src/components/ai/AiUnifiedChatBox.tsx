"use client";

import React, { useState } from "react";
import { Bot, X, Send, Loader2 } from "lucide-react";

export interface UnifiedChatMessage {
  sender: "USER" | "ASSISTANT";
  text: string;
  sprintScope: string;
  timestamp: string;
}

interface AiUnifiedChatBoxProps {
  isOpen: boolean;
  onClose: () => void;
  targetSprintScope: string;
  onScopeChange: (scope: string) => void;
  availableSprints: string[];
  messages: UnifiedChatMessage[];
  onSendMessage: (prompt: string) => Promise<void>;
  loading: boolean;
}

export function AiUnifiedChatBox({
  isOpen,
  onClose,
  targetSprintScope,
  onScopeChange,
  availableSprints,
  messages,
  onSendMessage,
  loading,
}: AiUnifiedChatBoxProps) {
  const [inputText, setInputText] = useState("");

  if (!isOpen) return null;

  const handleSend = () => {
    if (!inputText.trim() || loading) return;
    const text = inputText.trim();
    setInputText("");
    onSendMessage(text);
  };

  const handleQuickChip = (suggestion: string) => {
    onSendMessage(suggestion);
  };

  return (
    <div className="fixed bottom-6 right-6 w-[440px] md:w-[480px] max-w-[calc(100vw-2rem)] bg-white border border-[#E5E7EB] rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden font-sans animate-in fade-in slide-in-from-bottom-5 duration-200">
      {/* Chatbox Header */}
      <div className="bg-[#F9FAFB] border-b border-[#E5E7EB] px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center border border-[#D2E3FC] shrink-0">
            <Bot className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-extrabold text-[#111827] truncate">
              AI Requirement Chatbox
            </h4>
            {/* Target Sprint Selector Dropdown */}
            <div className="flex items-center gap-1.5 text-[11px] text-[#6B7280] font-mono mt-0.5">
              <span>Phạm vi:</span>
              <select
                value={targetSprintScope}
                onChange={(e) => onScopeChange(e.target.value)}
                className="bg-white border border-[#D1D5DB] rounded-md px-2 py-0.5 text-[11px] font-bold text-[#1A73E8] focus:outline-none cursor-pointer truncate max-w-[190px]"
              >
                <option value="ALL">🌐 Toàn bộ WBS (Tất cả)</option>
                {availableSprints.map((sp) => (
                  <option key={sp} value={sp}>
                    🎯 {sp.includes(":") ? sp.split(":")[0].trim() : sp}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 hover:bg-gray-200 rounded-xl text-gray-400 hover:text-gray-700 transition-colors cursor-pointer shrink-0 ml-2"
          title="Đóng Chatbox"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Feed Area */}
      <div className="h-[340px] overflow-y-auto p-4 space-y-3 bg-[#FAFAFA]">
        <div className="p-3 rounded-2xl bg-white text-[#374151] border border-[#E5E7EB] text-xs leading-relaxed shadow-2xs">
          🤖 Bạn đang đàm thoại trong phiên <strong>Requirement Agent</strong>. Mọi câu lệnh sẽ trực tiếp cập nhật các task thuộc <strong>{targetSprintScope === "ALL" ? "Toàn bộ bài toán" : targetSprintScope}</strong>!
        </div>

        {messages.map((msg, idx) => {
          const isUser = msg.sender === "USER";
          return (
            <div key={idx} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[88%] p-3 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                  isUser
                    ? "bg-[#1A73E8] text-white rounded-br-xs font-medium"
                    : "bg-white text-[#111827] border border-[#E5E7EB] rounded-bl-xs"
                }`}
              >
                <div className="flex items-center justify-between gap-3 pb-1.5 border-b border-black/10 dark:border-white/20">
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                      isUser
                        ? "bg-white/20 text-white"
                        : "bg-[#E8F0FE] text-[#1A73E8]"
                    }`}
                  >
                    {msg.sprintScope === "ALL" ? "Toàn bộ bài toán" : msg.sprintScope}
                  </span>
                  <span className="text-[10px] font-mono opacity-75">{msg.timestamp}</span>
                </div>
                <p className="pt-1.5 whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#E8F0FE] text-[#1A73E8] border border-[#D2E3FC] text-xs font-mono font-bold animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-[#1A73E8]" />
            <span>AI đang phân tích & cập nhật task cho {targetSprintScope === "ALL" ? "Toàn bộ bài toán" : targetSprintScope}...</span>
          </div>
        )}
      </div>

      {/* Quick Suggestion Chips (Concise) */}
      <div className="px-4 py-2 bg-white border-t border-[#E5E7EB] flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] font-mono text-[#6B7280] font-bold uppercase">Gợi ý:</span>
        <button
          type="button"
          onClick={() =>
            handleQuickChip(
              targetSprintScope === "ALL"
                ? "Bổ sung 1 Sprint kiểm thử QA & Audit"
                : `Thêm task kiểm thử QA cho ${targetSprintScope}`
            )
          }
          className="px-2.5 py-1 bg-white hover:bg-gray-50 text-[#374151] hover:text-[#1A73E8] border border-[#D1D5DB] hover:border-[#1A73E8] rounded-lg text-[11px] font-medium transition-all cursor-pointer shadow-2xs"
        >
          ➕ Thêm Task QA
        </button>
        <button
          type="button"
          onClick={() =>
            handleQuickChip(
              targetSprintScope === "ALL"
                ? "Tăng estimate tất cả task lên +1 ngày"
                : `Tăng +1 ngày làm cho tất cả task trong ${targetSprintScope}`
            )
          }
          className="px-2.5 py-1 bg-white hover:bg-gray-50 text-[#374151] hover:text-[#1A73E8] border border-[#D1D5DB] hover:border-[#1A73E8] rounded-lg text-[11px] font-medium transition-all cursor-pointer shadow-2xs"
        >
          ⏱️ +1 ngày làm
        </button>
        <button
          type="button"
          onClick={() =>
            handleQuickChip(
              targetSprintScope === "ALL"
                ? "Bổ sung ngày dự phòng rủi ro cho WBS"
                : `Đánh giá rủi ro & thêm ngày dự phòng cho ${targetSprintScope}`
            )
          }
          className="px-2.5 py-1 bg-white hover:bg-gray-50 text-[#374151] hover:text-[#1A73E8] border border-[#D1D5DB] hover:border-[#1A73E8] rounded-lg text-[11px] font-medium transition-all cursor-pointer shadow-2xs"
        >
          🛡️ Dự phòng rủi ro
        </button>
      </div>

      {/* Chatbox Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3.5 bg-white border-t border-[#E5E7EB] flex items-center gap-2"
      >
        <input
          type="text"
          placeholder={`Nhập yêu cầu AI chỉnh sửa (${targetSprintScope === "ALL" ? "Toàn bộ bài toán" : targetSprintScope})...`}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={loading}
          className="flex-1 bg-white border border-[#D1D5DB] focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] rounded-xl px-3.5 py-2.5 text-xs text-[#111827] placeholder-gray-400 outline-none transition-colors"
        />
        <button
          type="submit"
          disabled={loading || !inputText.trim()}
          className="px-4 py-2.5 bg-[#1A73E8] hover:bg-[#1557B0] disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          <span>Gửi</span>
        </button>
      </form>
    </div>
  );
}
