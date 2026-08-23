"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, RefreshCw, Sparkles, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
import { AiChatMessageResponse } from "@/services/ai.service";

interface AiChatWindowProps {
  messages: AiChatMessageResponse[];
  onSendMessage: (text: string) => void;
  loading: boolean;
}

export function AiChatWindow({
  messages,
  onSendMessage,
  loading,
}: AiChatWindowProps) {
  const [inputText, setInputText] = useState("");
  const [expandedMessages, setExpandedMessages] = useState<Record<number | string, boolean>>({});
  const [copiedId, setCopiedId] = useState<number | string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = () => {
    if (!inputText.trim() || loading) return;
    onSendMessage(inputText.trim());
    setInputText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleCopy = (id: number | string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleExpand = (id: number | string) => {
    setExpandedMessages((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const quickChips = [
    "Gợi ý phân rã WBS cho ứng dụng Y tế Telehealth & Bệnh án điện tử",
    "Phân rã hệ thống Quản lý Nhà hàng QR Code & Màn hình Bếp WebSocket",
    "Ước tính số Sprint và phân bổ vai trò Backend, Frontend, QA cho team 4 người",
    "Chốt Bảng Task WBS cho dự án",
  ];

  return (
    <div className="flex flex-col bg-white border border-[#E5E7EB] rounded-2xl shadow-sm h-[520px] font-sans overflow-hidden">
      {/* Chat Window Header */}
      <div className="bg-[#F9FAFB] border-b border-[#E5E7EB] px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center border border-[#D2E3FC]">
            <Bot className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-[#111827]">Requirement AI Agent (Đàm Thoại Chat)</h3>
            <p className="text-[11px] text-[#6B7280]">Khung trao đổi 2 chiều bằng văn bản giữa Người Dùng và AI Agent</p>
          </div>
        </div>

        <span className="text-[10px] font-mono bg-[#E6F4EA] text-[#137333] px-2.5 py-1 rounded-full font-bold border border-[#CEEAD6]">
          🟢 Online & Đàm Thoại Văn Bản
        </span>
      </div>

      {/* Messages Feed Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#FAFAFA]">
        {messages.length === 0 ? (
          <div className="text-center py-10 space-y-3 max-w-md mx-auto">
            <div className="w-12 h-12 bg-[#F0F7FF] text-[#1A73E8] rounded-2xl flex items-center justify-center mx-auto border border-[#D2E3FC] shadow-2xs">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-sm text-[#111827]">Khung Trao Đổi Đàm Thoại 2 Chiều</h4>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                Nhập yêu cầu bài toán hoặc trao đổi với AI tại đây. Bảng Task sẽ được cập nhật riêng biệt ở khu vực phía dưới!
              </p>
            </div>

            {/* Quick Suggestion Chips */}
            <div className="pt-2 space-y-1.5 text-left">
              <span className="text-[10px] font-mono uppercase font-bold text-[#6B7280] block">Gợi ý mẫu câu hỏi:</span>
              {quickChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(chip)}
                  className="w-full text-left p-2 bg-white border border-[#E5E7EB] hover:border-[#111827] rounded-xl text-xs text-[#374151] font-medium transition-all shadow-2xs cursor-pointer hover:bg-gray-50 truncate"
                >
                  💬 "{chip}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isUser = msg.senderType === "USER";
            const msgId = msg.id || `msg-${index}`;
            const isExpanded = !!expandedMessages[msgId];
            const content = msg.messageContent || "";
            // ONLY user messages get Expand/Collapse toggle if > 250 chars! AI messages show 100% full text!
            const isLong = isUser && content.length > 250;
            const displayContent = isLong && !isExpanded ? content.slice(0, 250) + "..." : content;

            return (
              <div key={msgId} className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 ${
                    isUser
                      ? "bg-[#4F46E5] text-white border-[#4338CA]"
                      : "bg-[#F0F7FF] text-[#1A73E8] border-[#D2E3FC]"
                  }`}
                >
                  {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                {/* Bubble Container */}
                <div className={`group relative space-y-1 max-w-2xl ${isUser ? "items-end text-left" : "items-start text-left"}`}>
                  <div
                    className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-2xs relative select-text ${
                      isUser
                        ? "bg-[#EEF2FF] text-[#1E1B4B] border border-[#C7D2FE] rounded-tr-none font-medium"
                        : "bg-white text-[#111827] border border-[#E5E7EB] rounded-tl-none font-sans"
                    }`}
                  >
                    <p className="whitespace-pre-wrap select-text text-justify">{displayContent}</p>

                    {/* Expand / Collapse Button for Long Messages */}
                    {isLong && (
                      <button
                        onClick={() => toggleExpand(msgId)}
                        className={`mt-2 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors ${
                          isUser ? "text-[#4338CA] hover:text-[#312E81]" : "text-[#1A73E8] hover:text-[#1557B0]"
                        }`}
                      >
                        {isExpanded ? (
                          <>
                            <span>Thu gọn</span>
                            <ChevronUp className="w-3 h-3" />
                          </>
                        ) : (
                          <>
                            <span>Xem thêm</span>
                            <ChevronDown className="w-3 h-3" />
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Discreet Copy Button (Appears Below / Beside Text) */}
                  <div className={`flex items-center gap-1 mt-1 ${isUser ? "justify-end" : "justify-start"}`}>
                    <button
                      onClick={() => handleCopy(msgId, content)}
                      className="text-[10px] font-medium text-[#6B7280] hover:text-[#111827] flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-gray-200/60 transition-all cursor-pointer opacity-80 group-hover:opacity-100"
                      title="Sao chép tin nhắn"
                    >
                      {copiedId === msgId ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600 font-bold">Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Sao chép</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Loading Bubble */}
        {loading && (
          <div className="flex gap-3 items-center">
            <div className="w-8 h-8 rounded-xl bg-[#F0F7FF] text-[#1A73E8] flex items-center justify-center border border-[#D2E3FC] animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-[#E5E7EB] p-3.5 rounded-2xl rounded-tl-none text-xs text-[#6B7280] flex items-center gap-2 shadow-2xs">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#1A73E8]" />
              <span>Requirement AI Agent đang phân tích đàm thoại & bóc tách WBS tasks...</span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Sticky Bottom Chat Input Bar */}
      <div className="p-3.5 bg-white border-t border-[#E5E7EB] space-y-2">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              // Dynamic auto-resizing height from 40px to max 140px
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={1}
            placeholder="Nhập câu hỏi, mô tả bài toán (Shift+Enter để xuống dòng, Enter để gửi)..."
            className="flex-1 px-3.5 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] focus:bg-white focus:border-[#111827] rounded-xl text-xs text-[#111827] outline-none transition-all placeholder-[#9CA3AF] resize-none min-h-[40px] max-h-[140px] overflow-y-auto leading-relaxed"
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || loading}
            className="px-4 py-2.5 bg-[#111827] hover:bg-black text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50 cursor-pointer h-[40px] shrink-0"
          >
            <span>Gửi</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
