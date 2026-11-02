"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Send,
  Bot,
  Sparkles,
  LineChart,
  FileCode2,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  TrendingUp,
  UserCheck,
  BellRing,
} from "lucide-react";

interface AgentChatModalProps {
  agent: {
    id: string;
    name: string;
    role: string;
    badge: string;
    description: string;
    capabilities: string[];
    badgeColor?: string;
  } | null;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: "USER" | "AGENT";
  text: string;
  timestamp: string;
  tags?: string[];
}

export function AgentChatModal({ agent, onClose }: AgentChatModalProps) {
  if (!agent) return null;

  const isPM = agent.id === "PM";
  const isReq = agent.id === "REQUIREMENT";
  const isTech = agent.id === "TECHNICAL_ADVISOR";

  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (isPM) {
      return [
        {
          id: "init",
          sender: "AGENT",
          text: `Xin chào! Tôi là **PM Agent (Project Manager Specialist)** của PROGA. 

Tôi chuyên trách:
- 🚦 **Giám sát & Cảnh báo bottleneck** trên các cột Kanban
- 📈 **Dự báo ngày hoàn thành Space** dựa trên vận tốc (Velocity & Burn-down)
- 👥 **Cân bằng tải & san sẻ công việc** cho thành viên đang quá tải
- 📑 **Tự động tổng hợp báo cáo tuần** gửi Quản lý & Admin

Bạn có thể bấm vào các tính năng gợi ý nhanh bên dưới hoặc nhập câu hỏi cụ thể để trải nghiệm ngay!`,
          timestamp: "Vừa xong",
        },
      ];
    } else if (isReq) {
      return [
        {
          id: "init",
          sender: "AGENT",
          text: `Xin chào! Tôi là **Requirement Agent** của PROGA. Tôi hỗ trợ bóc tách tài liệu PRD/SRS thành danh sách Task chuẩn mực, tự động đề xuất phân chia Sprints và gán độ ưu tiên.`,
          timestamp: "Vừa xong",
        },
      ];
    } else {
      return [
        {
          id: "init",
          sender: "AGENT",
          text: `Xin chào! Tôi là **Technical Advisor Agent** của PROGA. Tôi tư vấn chuẩn kiến trúc Microservices, RESTful API, STOMP WebSocket và tối ưu hóa truy vấn Database / Caching.`,
          timestamp: "Vừa xong",
        },
      ];
    }
  });

  const [loading, setLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const quickPrompts = isPM
    ? [
        {
          label: "🚦 Cảnh báo bottleneck Kanban",
          prompt: "Cảnh báo các điểm nghẽn và rủi ro trễ hạn trên bảng Kanban của Space hiện tại.",
          reply: `### 🚦 BÁO CÁO PHÁT HIỆN ĐIỂM NGHẼN (KANBAN BOTTLENECK ANALYSIS)

1. **Điểm nghẽn nghiêm trọng tại cột CHỜ DUYỆT (IN_REVIEW):**
   - Hiện có **4 công việc** đang tồn đọng chờ kiểm thử & nghiệm thu (vượt ngưỡng giới hạn WIP Limit: tối đa 3 thẻ).
   - Thẻ nghẽn lâu nhất: \`Task-11: Cấu hình Docker Compose cho 6 Microservices\` đã lưu lại tại cột này hơn **48 giờ**.

2. **Nguyên nhân chính:**
   - Người phụ trách duyệt (PM / Assistant) chưa xử lý kịp số lượng task bàn giao dồn dập vào cuối tuần.

3. **Đề xuất hành động tức thì cho PM:**
   - 👉 Ưu tiên nghiệm thu ngay \`Task-11\` và \`Task-13\` để mở khóa các công việc phụ thuộc.
   - 👉 Nếu task cần bổ sung tài liệu, bấm nút **"Yêu cầu sửa"** kèm ghi chú rõ ràng để thành viên cập nhật lại.`,
        },
        {
          label: "📈 Dự báo ngày hoàn thành (Burn-down)",
          prompt: "Dự báo ngày hoàn thành Space và phân tích biểu đồ Burn-down chart.",
          reply: `### 📈 DỰ BÁO TIẾN ĐỘ & BURNDOWN CHART

- **Vận tốc thực tế của nhóm (Actual Velocity):** Trung bình **3.8 Story Points / ngày**.
- **Khối lượng công việc còn lại:** Còn lại **13 tasks** (ước tính 28 Story Points).
- **Mốc hoàn thành kế hoạch:** 15/11/2026.
- **Ngày hoàn thành dự báo của AI:** **14/11/2026** (Sớm hơn 1 ngày so với mốc cam kết).

**Đánh giá mức độ an toàn:**
🟢 **ON_TRACK (Đúng tiến độ)** — Tỷ lệ cháy điểm (Burn-rate) bám rất sát đường lý tưởng (Ideal line). Không có nguy cơ vỡ tiến độ nếu duy trì nhịp độ hiện tại.`,
        },
        {
          label: "👥 Phân bổ lại công việc quá tải",
          prompt: "Đề xuất cân bằng tải và phân bổ lại công việc cho các thành viên.",
          reply: `### 👥 ĐỀ XUẤT CÂN BẰNG TẢI & ĐIỀU PHỐI NHÂN SỰ

1. **Phát hiện thành viên quá tải:**
   - 🔴 **Vũ Minh Trí**: Đang giữ đồng thời **3 công việc** ở trạng thái \`Đang làm\` và 1 công việc \`Chờ duyệt\` (Tổng tải: 140%).
2. **Thành viên đang có công suất trống (Available):**
   - 🟢 **Lưu Ngọc Cao Sơn**: Đã hoàn thành toàn bộ công việc của Sprint hiện tại (Công suất khả dụng: 80%).

**Khuyến nghị điều phối:**
- Chuyển giao \`Task-10: Tích hợp Redis Caching tối ưu truy vấn\` từ **Vũ Minh Trí** sang **Lưu Ngọc Cao Sơn**.
- *Hiệu quả kỳ vọng:* Giúp giảm 40% áp lực cho thành viên nòng cốt, đảm bảo chất lượng code và phòng ngừa rủi ro trễ deadline.`,
        },
        {
          label: "📑 Tổng hợp báo cáo tuần cho Admin",
          prompt: "Tổng hợp báo cáo tiến độ tuần cho Quản lý & Admin.",
          reply: `### 📑 BÁO CÁO TIẾN ĐỘ TUẦN (WEEKLY SPRINT STATUS REPORT)
**Dự Án:** Khóa Luận Tốt Nghiệp IUH-PROGA • **Sprint 3 (Tuần 3)**

- **Tổng số công việc:** 19 tasks
- **Tiến độ hoàn thành:** **14/19 tasks (73.7%)**
- **Đã duyệt hoàn thành (DONE):** 8 tasks
- **Đang chờ nghiệm thu (IN_REVIEW):** 4 tasks
- **Đang triển khai (IN_PROGRESS):** 2 tasks
- **Tồn đọng (TODO):** 5 tasks

**Những thành tựu nổi bật:**
- Đã hoàn tất nâng cấp Bảng Kanban 4 cột thời gian thực với WebSocket STOMP.
- Hoàn thiện thuật toán Tự động Phân công việc (Auto-Assign) cân bằng tải theo kỹ năng.

**Kế hoạch trọng tâm tuần tiếp theo:**
- Triển khai toàn diện kịch bản Kiểm thử UAT & Đóng gói báo cáo kỹ thuật.`,
        },
      ]
    : agent.capabilities.map((c, i) => ({
        label: c,
        prompt: `Hãy giải thích chi tiết và đưa ra ví dụ về: "${c}".`,
        reply: `### CHI TIẾT TÍNH NĂNG: ${c}\n\nĐây là một trong những năng lực cốt lõi của **${agent.name}** được thiết kế nhằm tự động hóa quy trình phần mềm chuẩn mực trong PROGA.`,
      }));

  const handleSendPrompt = (text: string, customReply?: string) => {
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: "USER",
      text: text.trim(),
      timestamp: "Vừa xong",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setLoading(true);

    setTimeout(() => {
      let replyText = customReply;
      if (!replyText) {
        if (isPM) {
          replyText = `### 📋 PHẢN HỒI TỪ PM AGENT

Cảm ơn bạn đã đặt câu hỏi: *" ${text} "*

Dựa trên dữ liệu giám sát tiến độ thực tế:
- **Tình trạng tổng thể:** Dự án đang duy trì vận tốc ổn định.
- **Khuyến nghị PM:** Thường xuyên rà soát bảng Kanban và duyệt sớm các công việc tại cột Chờ Duyệt để các thành viên tiếp tục nhận việc mới.
- **Cảnh báo tự động:** Hệ thống đã đồng bộ trạng thái này tới Notification Center và Mobile Push của các thành viên liên quan.`;
        } else {
          replyText = `Phản hồi từ **${agent.name}**: Yêu cầu *" ${text} "* đã được ghi nhận và phân tích thành công theo tiêu chuẩn của hệ thống PROGA.`;
        }
      }

      const agentMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: "AGENT",
        text: replyText,
        timestamp: "Vừa xong",
      };
      setMessages((prev) => [...prev, agentMsg]);
      setLoading(false);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-3xl h-[88vh] max-h-[780px] shadow-2xl border border-slate-200 flex flex-col overflow-hidden font-sans">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white px-5 py-4 flex items-center justify-between border-b border-slate-700/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-xs">
              {isPM ? (
                <LineChart className="w-5 h-5 text-emerald-400" />
              ) : isReq ? (
                <FileCode2 className="w-5 h-5 text-blue-400" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-red-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">{agent.name}</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  {agent.badge}
                </span>
                <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Live Demo
                </span>
              </div>
              <p className="text-xs text-slate-300/90 font-medium mt-0.5">{agent.role}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Đóng cửa sổ"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Action Suggestion Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 overflow-x-auto flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-mono font-bold uppercase text-slate-500 shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-500" />
            Tính năng thử nhanh:
          </span>
          <div className="flex items-center gap-1.5 flex-nowrap">
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendPrompt(qp.prompt, qp.reply)}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 text-xs font-semibold whitespace-nowrap transition-all shadow-2xs cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                {qp.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/40">
          {messages.map((msg) => {
            const isUser = msg.sender === "USER";
            return (
              <div
                key={msg.id}
                className={`flex gap-3 text-xs leading-relaxed ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                    <Bot className="w-4.5 h-4.5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-4 shadow-2xs space-y-2 select-text ${
                    isUser
                      ? "bg-slate-900 text-white rounded-tr-xs"
                      : "bg-white text-slate-800 border border-slate-200 rounded-tl-xs"
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans text-xs leading-relaxed">
                    {msg.text.split("\n").map((line, lIdx) => {
                      const trimmed = line.trim();
                      if (trimmed.startsWith("### ")) {
                        return (
                          <h4 key={lIdx} className="font-extrabold text-slate-900 text-xs pt-1 pb-0.5">
                            {trimmed.replace("### ", "")}
                          </h4>
                        );
                      }
                      if (trimmed.startsWith("- **") || trimmed.startsWith("• **")) {
                        return (
                          <p key={lIdx} className="pl-2 border-l-2 border-emerald-500 py-0.5 my-1 bg-emerald-50/50 rounded-r text-slate-900 font-medium">
                            {trimmed.replace(/^[-•]\s*/, "")}
                          </p>
                        );
                      }
                      return <p key={lIdx}>{line}</p>;
                    })}
                  </div>
                  <span className={`block text-[10px] font-mono ${isUser ? "text-slate-400 text-right" : "text-slate-400"}`}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-500 italic">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>{agent.name} đang phân tích dữ liệu dự án...</span>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendPrompt(inputText);
            }}
            className="flex items-center gap-2 bg-slate-50 rounded-2xl border border-slate-200 p-1.5 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Nhập câu hỏi hoặc yêu cầu cho ${agent.name}...`}
              className="flex-1 px-3 py-1.5 text-xs bg-transparent focus:outline-hidden text-slate-800 placeholder-slate-400 font-sans"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || loading}
              className="px-4 py-2 bg-slate-900 hover:bg-emerald-600 disabled:opacity-40 disabled:hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Gửi</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
