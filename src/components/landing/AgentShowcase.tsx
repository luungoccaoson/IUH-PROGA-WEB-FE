"use client";

import React from "react";
import { FileCode2, LineChart, ShieldAlert, Cpu, Sparkles, Check } from "lucide-react";

const AGENTS = [
  {
    id: "REQUIREMENT",
    name: "Requirement Agent",
    role: "Phân Tích & Tự Động Phân Rã Task",
    badge: "Requirement Specialist",
    borderColor: "hover:border-[#111827]",
    badgeColor: "text-[#111827] border-[#E5E7EB] bg-[#F6F5EF]",
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
    borderColor: "hover:border-[#111827]",
    badgeColor: "text-[#137333] border-[#E6F4EA] bg-[#E6F4EA]",
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
    borderColor: "hover:border-[#111827]",
    badgeColor: "text-[#D93025] border-[#FDEDEC] bg-[#FDEDEC]",
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
    <section id="ai-agents" className="py-24 relative overflow-hidden bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F6F5EF] border border-[#E5E7EB] text-xs font-mono font-bold text-[#111827]">
            <Cpu className="w-4 h-4 text-[#137333]" />
            <span>AI Multi-Agent Ecosystem</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#111827] font-sans">
            Sức Mạnh Từ <span className="underline decoration-2 decoration-[#137333]">Bộ Ba AI Agents</span>
          </h2>
          <p className="text-[#6B7280] text-base sm:text-lg font-sans">
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
                className={`bg-[#F6F5EF] rounded-2xl p-8 border border-[#E5E7EB] flex flex-col justify-between ${agent.borderColor} group transition-all duration-300 shadow-sm`}
              >
                <div>
                  {/* Top Badge & Icon */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-[#E5E7EB] flex items-center justify-center shadow-sm">
                      <IconComponent className="w-6 h-6 text-[#111827] group-hover:scale-110 transition-transform" />
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[11px] font-mono font-bold border ${agent.badgeColor}`}>
                      {agent.badge}
                    </span>
                  </div>

                  {/* Title & Role */}
                  <h3 className="text-xl font-bold text-[#111827] group-hover:text-[#137333] transition-colors font-sans">
                    {agent.name}
                  </h3>
                  <p className="text-xs font-mono font-bold text-[#6B7280] mt-1 mb-4">
                    {agent.role}
                  </p>
                  <p className="text-[#4B5563] text-sm leading-relaxed mb-6 font-sans">
                    {agent.description}
                  </p>

                  {/* Capabilities List */}
                  <div className="space-y-2.5 pt-4 border-t border-[#E5E7EB]">
                    <p className="text-xs font-mono font-bold uppercase text-[#6B7280] tracking-wider">
                      Tính Năng Nổi Bật:
                    </p>
                    {agent.capabilities.map((cap, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-[#111827] font-sans font-medium">
                        <div className="w-4 h-4 rounded-full bg-[#E6F4EA] flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-2.5 h-2.5 text-[#137333]" />
                        </div>
                        <span>{cap}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Agent Status Badge */}
                <div className="mt-8 pt-4 border-t border-[#E5E7EB] flex items-center justify-between text-xs font-mono text-[#6B7280] font-bold">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
                    LLM Integrated
                  </span>
                  <span className="text-[#111827] font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
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
