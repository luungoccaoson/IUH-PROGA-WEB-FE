"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  RefreshCw,
  Sparkles,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Paperclip,
  FileText,
  Loader2,
  Stethoscope,
  ShoppingBag,
  Car,
  Lightbulb,
} from "lucide-react";
import { AiChatMessageResponse, aiService } from "@/services/ai.service";
import { AiMessageContent } from "./AiMessageContent";

interface AiChatWindowProps {
  messages: AiChatMessageResponse[];
  onSendMessage: (text: string) => void;
  loading: boolean;
  onScrollToWbs?: () => void;
}

export function AiChatWindow({
  messages,
  onSendMessage,
  loading,
  onScrollToWbs,
}: AiChatWindowProps) {
  const [inputText, setInputText] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string; text: string } | null>(null);
  const [expandedMessages, setExpandedMessages] = useState<Record<number | string, boolean>>({});
  const [copiedId, setCopiedId] = useState<number | string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check 15MB client-side limit
    if (file.size > 15 * 1024 * 1024) {
      alert("Dung lượng file vượt quá giới hạn 15MB. Vui lòng nén hoặc chọn tài liệu dưới 15MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploadingFile(true);
    try {
      const result = await aiService.uploadAndParseDocument(file);
      setAttachedFile({
        name: result.fileName,
        text: result.extractedText,
      });
      // Append file text to prompt
      const documentPrompt = `[NẠP TÀI LIỆU KẾ HOẠCH FILE ${result.fileName} (${result.chunkCount} chunks)]:\n${result.extractedText}`;
      setInputText((prev) => (prev ? `${prev}\n\n${documentPrompt}` : documentPrompt));
    } catch (err: any) {
      alert("Lỗi khi đọc file tài liệu: " + (err.message || "Không thể bóc tách file."));
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSend = () => {
    if ((!inputText.trim() && !attachedFile) || loading || uploadingFile) return;
    onSendMessage(inputText.trim());
    setInputText("");
    setAttachedFile(null);
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

  const sampleTemplates = [
    {
      icon: Stethoscope,
      title: "Hệ thống Bệnh viện Telehealth",
      desc: "Quản lý đặt lịch khám, hồ sơ bệnh án điện tử EMR và gọi video tư vấn bác sĩ.",
      color: "text-blue-600 bg-blue-50 border-blue-200",
      prompt: "Tôi cần xây dựng hệ thống Y tế Telehealth gồm đặt khám bệnh từ xa, quản lý hồ sơ bệnh án điện tử EMR và thanh toán viện phí trực tuyến.",
    },
    {
      icon: ShoppingBag,
      title: "Sàn Thương Mại Điện Tử & Đấu Giá",
      desc: "Giỏ hàng, thanh toán VNPAY, phiên đấu giá realtime và xuất hóa đơn.",
      color: "text-purple-600 bg-purple-50 border-purple-200",
      prompt: "Phân rã kế hoạch hệ thống Sàn thương mại điện tử kết hợp sàn đấu giá trực tuyến, tích hợp thanh toán VNPAY IPN và thông báo WebSocket.",
    },
    {
      icon: Car,
      title: "Nền tảng Quản Lý Nhà Hàng & Bếp",
      desc: "Menu QR Code tại bàn, màn hình KDS cho nhà bếp và quản lý tồn kho nguyên liệu.",
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
      prompt: "Xây dựng hệ thống Quản lý Nhà hàng với tính năng quét mã QR gọi món tại bàn, màn hình hiển thị bếp KDS realtime và thống kê doanh thu.",
    },
  ];

  return (
    <div className="flex flex-col bg-white border border-[#E5E7EB] rounded-2xl shadow-sm h-[800px] font-sans overflow-hidden">
      {/* Chat Window Header */}
      <div className="bg-[#F9FAFB] border-b border-[#E5E7EB] px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center shadow-xs">
            <Bot className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#111827]">Requirement AI Co-Pilot</h3>
              <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                Online
              </span>
            </div>
            <p className="text-[11px] text-[#6B7280]">
              Trao đổi yêu cầu, duyệt kế hoạch Sprints và sinh Bảng Task WBS tự động
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex text-[11px] text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 font-medium">
            📎 Upload tài liệu tối đa 15MB
          </span>
        </div>
      </div>

      {/* Messages Feed Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#FAFAFA]">
        {messages.length === 0 ? (
          <div className="py-6 space-y-4 max-w-xl mx-auto text-center">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto border border-indigo-100 shadow-2xs">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>

            <div className="space-y-1">
              <h4 className="font-bold text-base text-slate-900">
                Chào mừng bạn đến với Requirement AI Agent!
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
                Hãy nhập bài toán dự án của bạn hoặc chọn nhanh 1 đề bài mẫu bên dưới. AI sẽ tự động phân tích lộ trình các Sprints và gợi ý kế hoạch cho bạn duyệt.
              </p>
            </div>

            {/* Quick 1-Click Starter Templates */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 text-left">
              {sampleTemplates.map((item, idx) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => onSendMessage(item.prompt)}
                    className="p-3 bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-xs rounded-xl transition-all cursor-pointer group flex flex-col justify-between text-left space-y-2"
                  >
                    <div className="space-y-1.5">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${item.color}`}>
                        <IconComponent className="w-3.5 h-3.5" />
                      </div>
                      <h5 className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors leading-tight">
                        {item.title}
                      </h5>
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold text-indigo-600 flex items-center gap-1 pt-1">
                      Thử ngay <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-2">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>
                Bạn cũng có thể bấm nút <strong>📎 Đính kèm</strong> để tải lên file tài liệu đặc tả (SRS/BRD) tối đa <strong>15MB</strong>.
              </span>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isUser = msg.senderType === "USER";
            const msgId = msg.id || `msg-${index}`;
            const isExpanded = !!expandedMessages[msgId];
            const content = msg.messageContent || "";
            const isLong = isUser && content.length > 250;
            const displayContent = isLong && !isExpanded ? content.slice(0, 250) + "..." : content;

            return (
              <div key={msgId} className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-2xs ${isUser
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-indigo-600 border border-slate-200"
                    }`}
                >
                  {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                {/* Bubble Container - 70% AI / 30% User width ratio */}
                <div
                  className={`group relative space-y-1.5 ${isUser
                      ? "items-end text-left ml-auto max-w-[30%] w-fit"
                      : "items-start text-left max-w-[70%] w-full"
                    }`}
                >
                  <div
                    className={`p-4 rounded-2xl text-xs leading-relaxed shadow-2xs relative select-text ${isUser
                        ? "bg-indigo-50/80 text-indigo-950 border border-indigo-200 rounded-tr-none font-medium ml-auto"
                        : "bg-white text-slate-800 border border-slate-200/90 rounded-tl-none w-full"
                      }`}
                  >
                    {isUser ? (
                      <div>
                        <p className="whitespace-pre-wrap select-text text-left leading-relaxed">
                          {displayContent}
                        </p>
                        {isLong && (
                          <button
                            onClick={() => toggleExpand(msgId)}
                            className="mt-2 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer text-indigo-600 hover:text-indigo-800"
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
                    ) : (
                      <AiMessageContent
                        content={content}
                        isUser={false}
                        onSendMessage={onSendMessage}
                        onFillInput={(text) => {
                          setInputText(text);
                          textareaRef.current?.focus();
                        }}
                        onScrollToWbs={onScrollToWbs}
                      />
                    )}
                  </div>

                  {/* Discreet Timestamp & Copy Button */}
                  <div className={`flex items-center gap-2 px-1 ${isUser ? "justify-end" : "justify-start"}`}>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {msg.createdAt
                        ? new Date(msg.createdAt).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                        : new Date().toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                    </span>
                    <button
                      onClick={() => handleCopy(msgId, content)}
                      className="text-[10px] font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-slate-200/60 transition-all cursor-pointer opacity-70 group-hover:opacity-100"
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
            <div className="w-7 h-7 rounded-xl bg-white text-indigo-600 flex items-center justify-center border border-indigo-200 animate-pulse">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-white border border-slate-200 p-3.5 rounded-2xl rounded-tl-none text-xs text-slate-600 flex items-center gap-2.5 shadow-2xs">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
              <span>Requirement AI Agent đang phân tích đề bài & thiết lập lộ trình...</span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Sticky Bottom Chat Input Bar */}
      <div className="p-3 bg-white border-t border-[#E5E7EB] space-y-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".pdf,.docx,.doc,.txt,.md"
          className="hidden"
        />

        {attachedFile && (
          <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl text-xs text-indigo-800">
            <span className="flex items-center gap-1.5 font-medium truncate">
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              <span>Đã đính kèm tài liệu: <strong>{attachedFile.name}</strong></span>
            </span>
            <button
              onClick={() => setAttachedFile(null)}
              className="text-slate-500 hover:text-slate-800 text-xs font-bold px-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingFile || loading}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-slate-700 transition-all cursor-pointer h-[40px] shrink-0 flex items-center justify-center"
            title="Đính kèm file tài liệu kế hoạch (PDF, DOCX, TXT - Tối đa 15MB)"
          >
            {uploadingFile ? (
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
            ) : (
              <Paperclip className="w-4 h-4 text-slate-600" />
            )}
          </button>

          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);

              e.target.style.height = "40px";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={1}
            placeholder="Mô tả bài toán của bạn, hoặc bấm 📎 để nạp file đặc tả (PDF/Word tối đa 15MB)..."
            className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 rounded-xl text-xs text-slate-900 outline-none transition-all placeholder-slate-400 resize-none min-h-[40px] max-h-[140px] overflow-y-auto leading-relaxed"
          />

          <button
            onClick={handleSend}
            disabled={(!inputText.trim() && !attachedFile) || loading || uploadingFile}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50 cursor-pointer h-[40px] shrink-0"
          >
            <span>Gửi</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
