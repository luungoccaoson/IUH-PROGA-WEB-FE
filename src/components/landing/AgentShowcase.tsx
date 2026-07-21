"use client";

import React from "react";
import { FileCode2, LineChart, ShieldAlert, Cpu, Sparkles, Check } from "lucide-react";

const AGENTS = [
  {
    id: "REQUIREMENT",
    name: "Requirement Agent",
    role: "Phân Phân tích & Tự Động Phân Rã Task",
    badge: "Requirement Specialist",
    color: "from-cyan-500 to-blue-600",
    shadowColor: "shadow-cyan-500/20",
    borderColor: "hover:border-cyan-500/40",
    icon: FileCode2,
    description:
      "Tự động chuyển đổi tài liệu thiết kế (PRD/SRS) và câu lệnh ngôn ngữ tự nhiên thành danh sách Task chuẩn mực, xác định sẵn Priority, Assignee và thời gian ước tính.",
    capabilities: [
      "Bóc tách yêu cầu phức tạp thành Sub-tasks",
      "Xuất JSON payload preview trước khi lưu",
      "Gợi ý nhãn ưu tiên (LOW, MEDIUM, HIGH, URGENT)",
      "Đồng bộ trực tiếp 1-click vào Space",
    ],
  },
  {
    id: "PM",
    name: "PM Agent",
    role: "Điều Phối & Giám Sát Tiến Độ Dự Án",
    badge: "Project Manager Specialist",
    color: "from-violet-500 to-purple-600",
    shadowColor: "shadow-violet-500/20",
    borderColor: "hover:border-violet-500/40",
    icon: LineChart,
    description:
      "Chủ động cảnh báo tiến độ các thẻ công việc có nguy cơ trễ hạn (Overdue), đề xuất phân bổ lại công việc cho các thành viên và tóm tắt Activity Logs hàng ngày.",
    capabilities: [
      "Cảnh báo bottleneck trên bảng Kanban",
      "Dự báo ngày hoàn thành Space (Burn-down chart)",
      "Tự động nhắc nhở thành viên qua Mobile Push",
      "Tổng hợp báo cáo tiến độ tuần cho Admin",
    ],
  },
  {
    id: "TECHNICAL_ADVISOR",
    name: "Technical Advisor Agent",
    role: "Cố Vấn Kiến Trúc & Giải Pháp Kỹ Thuật",
    badge: "Tech Lead Specialist",
    color: "from-pink-500 to-rose-600",
    shadowColor: "shadow-pink-500/20",
    borderColor: "hover:border-pink-500/40",
    icon: ShieldAlert,
    description:
      "Hỗ trợ các lập trình viên giải quyết vướng mắc về kiến trúc Microservices, tư vấn chuẩn API Gateway, Spring Boot Security và chuẩn mã hóa dữ liệu.",
    capabilities: [
      "Tư vấn cấu trúc folder & Spring / React code pattern",
      "Kiểm tra chuẩn RESTful API & STOMP WebSocket",
      "Gợi ý tối ưu hóa SQL / JPA & Redis Caching",
      "Giải đáp thắc mắc tài liệu kỹ thuật 24/7",
    ],
  },
];

export function AgentShowcase() {
  return (
    <section id="ai-agents" className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-panel border border-violet-500/30 text-xs font-semibold text-violet-300">
            <Cpu className="w-4 h-4 text-violet-400" />
            <span>AI Multi-Agent Ecosystem</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-100">
            Sức Mạnh Từ <span className="gradient-text">Bộ Ba AI Agents</span>
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            Mỗi AI Agent đóng vai trò như một chuyên gia tận tụy trong đội ngũ phát triển software của bạn.
          </p>
        </div>

        {/* Agents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {AGENTS.map((agent) => {
            const IconComponent = agent.icon;
            return (
              <div
                key={agent.id}
                className={`glass-card rounded-2xl p-8 border border-white/10 flex flex-col justify-between ${agent.borderColor} ${agent.shadowColor} group transition-all duration-300`}
              >
                <div>
                  {/* Top Badge & Icon */}
                  <div className="flex items-center justify-between mb-6">
                    <div
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${agent.color} p-[1px] shadow-lg`}
                    >
                      <div className="w-full h-full bg-[#0b0f19] rounded-[15px] flex items-center justify-center">
                        <IconComponent className="w-6 h-6 text-slate-100 group-hover:scale-110 transition-transform" />
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-[11px] font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700">
                      {agent.badge}
                    </span>
                  </div>

                  {/* Title & Role */}
                  <h3 className="text-xl font-bold text-slate-100 group-hover:text-white transition-colors">
                    {agent.name}
                  </h3>
                  <p className="text-xs font-medium text-cyan-400 mt-1 mb-4">
                    {agent.role}
                  </p>
                  <p className="text-slate-300 text-sm leading-relaxed mb-6">
                    {agent.description}
                  </p>

                  {/* Capabilities List */}
                  <div className="space-y-2.5 pt-4 border-t border-slate-800/80">
                    <p className="text-xs font-mono font-semibold uppercase text-slate-400 tracking-wider">
                      Tính Năng Nổi Bật:
                    </p>
                    {agent.capabilities.map((cap, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                        <div className="w-4 h-4 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-2.5 h-2.5 text-cyan-400" />
                        </div>
                        <span>{cap}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Agent Status Badge */}
                <div className="mt-8 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    LLM Integrated
                  </span>
                  <span className="text-indigo-400 font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    Trò chuyện ngay &rarr;
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
