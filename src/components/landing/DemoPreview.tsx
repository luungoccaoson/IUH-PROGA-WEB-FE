"use client";

import React, { useState } from "react";
import {
  Kanban,
  Bot,
  Smartphone,
  Plus,
  Clock,
  User,
  CheckCircle2,
  Send,
  Sparkles,
  Bell,
  Layers,
  ArrowRight,
} from "lucide-react";

export function DemoPreview() {
  const [activeTab, setActiveTab] = useState<"kanban" | "ai" | "mobile">("kanban");

  return (
    <section id="demo" className="py-24 relative overflow-hidden bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F6F5EF] border border-[#E5E7EB] text-xs font-mono font-bold text-[#111827] shadow-sm">
            <Sparkles className="w-4 h-4 text-[#137333]" />
            <span>Trải Nghiệm Giao Diện Trực Quan</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#111827] font-sans">
            Xem Trực Quan <span className="underline decoration-2 decoration-[#137333]">Giao Diện Hệ Thống</span>
          </h2>
          <p className="text-[#6B7280] text-base sm:text-lg font-sans">
            Chọn các chế độ dưới đây để trải nghiệm trước giao diện làm việc của PROGA Web &amp; Mobile.
          </p>
        </div>

        {/* Tab Switcher Buttons */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex p-1.5 rounded-2xl bg-[#F6F5EF] border border-[#E5E7EB] gap-2 shadow-sm">
            <button
              onClick={() => setActiveTab("kanban")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all font-sans ${
                activeTab === "kanban"
                  ? "bg-[#111827] text-white shadow-md"
                  : "text-[#6B7280] hover:text-[#111827]"
              }`}
            >
              <Kanban className="w-4 h-4" />
              Bảng Kanban 4 Cột
            </button>
            <button
              onClick={() => setActiveTab("ai")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all font-sans ${
                activeTab === "ai"
                  ? "bg-[#111827] text-white shadow-md"
                  : "text-[#6B7280] hover:text-[#111827]"
              }`}
            >
              <Bot className="w-4 h-4" />
              AI Chat Assistant
            </button>
            <button
              onClick={() => setActiveTab("mobile")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all font-sans ${
                activeTab === "mobile"
                  ? "bg-[#137333] text-white shadow-md"
                  : "text-[#6B7280] hover:text-[#111827]"
              }`}
            >
              <Smartphone className="w-4 h-4" />
              Mobile App Sync
            </button>
          </div>
        </div>

        {/* Tab Content Display */}
        <div className="bg-[#F6F5EF] rounded-3xl p-6 md:p-8 border border-[#E5E7EB] shadow-lg">
          {/* TAB 1: KANBAN BOARD PREVIEW */}
          {activeTab === "kanban" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-4">
                <div>
                  <h3 className="text-xl font-bold text-[#111827] flex items-center gap-2 font-sans">
                    <Layers className="w-5 h-5 text-[#111827]" />
                    Space: Sprint 1 — System Authentication &amp; Microservices
                  </h3>
                  <p className="text-xs text-[#6B7280] font-mono mt-1 font-semibold">
                    Cập nhật thời gian thực bằng TanStack Query v5 + STOMP Optimistic UI
                  </p>
                </div>
                <button className="px-4 py-2 rounded-xl bg-[#111827] text-white text-xs font-bold font-mono flex items-center gap-1.5 shadow-md">
                  <Plus className="w-4 h-4" />
                  Thêm Task Mới
                </button>
              </div>

              {/* Kanban 4 Columns Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* COLUMN 1: TODO */}
                <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] space-y-3 shadow-sm">
                  <div className="flex items-center justify-between font-mono text-xs font-bold text-[#D97706] pb-2 border-b border-[#E5E7EB]">
                    <span>TODO (2)</span>
                    <span className="w-2 h-2 rounded-full bg-[#D97706]" />
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#F6F5EF] border border-[#E5E7EB] space-y-2 cursor-grab shadow-sm">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="px-2 py-0.5 rounded bg-[#FDEDEC] text-[#D93025] font-bold">
                        URGENT
                      </span>
                      <span className="text-[#6B7280]">TASK-101</span>
                    </div>
                    <p className="text-xs font-semibold text-[#111827] font-sans">
                      Cấu hình Eureka Server &amp; API Gateway Port 8080
                    </p>
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#6B7280] pt-2 border-t border-[#E5E7EB]">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-[#6B7280]" /> Admin
                      </span>
                      <span className="flex items-center gap-1 text-[#6B7280]">
                        <Clock className="w-3 h-3" /> 21/07
                      </span>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#F6F5EF] border border-[#E5E7EB] space-y-2 cursor-grab shadow-sm">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="px-2 py-0.5 rounded bg-[#E0F2FE] text-[#0284C7] font-bold">
                        MEDIUM
                      </span>
                      <span className="text-[#6B7280]">TASK-102</span>
                    </div>
                    <p className="text-xs font-semibold text-[#111827] font-sans">
                      Tạo Database Schema PostgreSql &amp; JPA Entities
                    </p>
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#6B7280] pt-2 border-t border-[#E5E7EB]">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-[#6B7280]" /> Dev Lead
                      </span>
                      <span className="flex items-center gap-1 text-[#6B7280]">
                        <Clock className="w-3 h-3" /> 22/07
                      </span>
                    </div>
                  </div>
                </div>

                {/* COLUMN 2: IN_PROGRESS */}
                <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] space-y-3 shadow-sm">
                  <div className="flex items-center justify-between font-mono text-xs font-bold text-[#111827] pb-2 border-b border-[#E5E7EB]">
                    <span>IN_PROGRESS (1)</span>
                    <span className="w-2 h-2 rounded-full bg-[#111827] animate-pulse" />
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#F6F5EF] border border-[#111827] space-y-2 cursor-grab shadow-md">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="px-2 py-0.5 rounded bg-[#FEF3C7] text-[#D97706] font-bold">
                        HIGH
                      </span>
                      <span className="text-[#6B7280]">TASK-103</span>
                    </div>
                    <p className="text-xs font-semibold text-[#111827] font-sans">
                      Viết AuthController /login &amp; /register Endpoints
                    </p>
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#6B7280] pt-2 border-t border-[#E5E7EB]">
                      <span className="flex items-center gap-1 text-[#111827] font-bold">
                        <User className="w-3 h-3" /> Son Luu (You)
                      </span>
                      <span className="flex items-center gap-1 text-[#137333] font-bold">
                        <Clock className="w-3 h-3" /> Đang làm
                      </span>
                    </div>
                  </div>
                </div>

                {/* COLUMN 3: REVIEW */}
                <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] space-y-3 shadow-sm">
                  <div className="flex items-center justify-between font-mono text-xs font-bold text-[#6B7280] pb-2 border-b border-[#E5E7EB]">
                    <span>REVIEW (1)</span>
                    <span className="w-2 h-2 rounded-full bg-[#6B7280]" />
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#F6F5EF] border border-[#E5E7EB] space-y-2 cursor-grab shadow-sm">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="px-2 py-0.5 rounded bg-[#FEF3C7] text-[#D97706] font-bold">
                        HIGH
                      </span>
                      <span className="text-[#6B7280]">TASK-104</span>
                    </div>
                    <p className="text-xs font-semibold text-[#111827] font-sans">
                      Cấu hình STOMP WebSocket Notification Endpoints
                    </p>
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#6B7280] pt-2 border-t border-[#E5E7EB]">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-[#6B7280]" /> PM Agent
                      </span>
                      <span className="flex items-center gap-1 text-[#6B7280] font-bold">
                        Chờ Review
                      </span>
                    </div>
                  </div>
                </div>

                {/* COLUMN 4: DONE */}
                <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] space-y-3 shadow-sm">
                  <div className="flex items-center justify-between font-mono text-xs font-bold text-[#137333] pb-2 border-b border-[#E5E7EB]">
                    <span>DONE (2)</span>
                    <span className="w-2 h-2 rounded-full bg-[#137333]" />
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#F6F5EF] border border-[#E5E7EB] space-y-2 opacity-80 shadow-sm">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="px-2 py-0.5 rounded bg-[#E6F4EA] text-[#137333] font-bold">
                        NORMAL
                      </span>
                      <span className="text-[#6B7280]">TASK-100</span>
                    </div>
                    <p className="text-xs font-semibold text-[#6B7280] line-through font-sans">
                      Khởi tạo dự án Next.js 14 App Router &amp; Tailwind
                    </p>
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#6B7280] pt-2 border-t border-[#E5E7EB]">
                      <span className="flex items-center gap-1 text-[#137333] font-bold">
                        <CheckCircle2 className="w-3 h-3" /> Hoàn thành
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AI CHAT ASSISTANT PREVIEW */}
          {activeTab === "ai" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-center shadow-sm">
                    <Bot className="w-5 h-5 text-[#137333]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#111827] font-sans">
                      Requirement Agent Drawer
                    </h3>
                    <p className="text-xs text-[#6B7280] font-mono font-semibold">
                      Tự động bóc tách yêu cầu PRD thành Task công việc có thể thực thi.
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-[#E6F4EA] text-[#137333] border border-[#E6F4EA] text-xs font-mono font-bold">
                  Agent Status: Online ⚡
                </span>
              </div>

              {/* Chat Conversation Area */}
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
                {/* User Message */}
                <div className="flex items-start gap-3 max-w-2xl ml-auto justify-end">
                  <div className="p-4 rounded-2xl bg-[#111827] text-white text-sm font-sans font-semibold shadow-sm">
                    Phân rã tính năng &quot;Quản lý Không Gian Làm Việc (Space Management) với CRUD API&quot; thành các công việc cụ thể cho Team nhé.
                  </div>
                </div>

                {/* AI Assistant Reply */}
                <div className="flex items-start gap-3 max-w-3xl">
                  <div className="w-8 h-8 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-center shrink-0 shadow-sm">
                    <Bot className="w-4 h-4 text-[#137333]" />
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] text-sm space-y-3 shadow-sm">
                    <p className="text-[#111827] font-sans font-medium">
                      Tôi đã nghiên cứu yêu cầu của bạn và phân rã thành 3 Tasks chi tiết cho Space <span className="text-[#137333] font-bold">&quot;Workspace Service&quot;</span>:
                    </p>
                    <div className="space-y-2 font-mono text-xs text-[#111827] bg-[#F6F5EF] p-3 rounded-xl border border-[#E5E7EB]">
                      <div className="flex items-center justify-between text-[#111827] font-bold">
                        <span>1. SpaceController CRUD REST Endpoints</span>
                        <span>[HIGH]</span>
                      </div>
                      <div className="flex items-center justify-between text-[#111827] font-bold">
                        <span>2. SpaceRepository &amp; JPA Entity Relation</span>
                        <span>[MEDIUM]</span>
                      </div>
                      <div className="flex items-center justify-between text-[#111827] font-bold">
                        <span>3. Unit tests cho SpaceServiceImpl</span>
                        <span>[LOW]</span>
                      </div>
                    </div>
                    <div className="pt-2 flex items-center gap-2">
                      <button className="px-3.5 py-1.5 rounded-lg bg-[#111827] text-white font-bold font-mono text-xs flex items-center gap-1 shadow-md">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Đồng ý chèn 3 Tasks
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat Input Bar */}
              <div className="pt-2 border-t border-[#E5E7EB] flex items-center gap-3">
                <input
                  type="text"
                  readOnly
                  value="Nhập yêu cầu phân rã hoặc câu hỏi về kiến trúc tại đây..."
                  className="flex-1 bg-white border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm font-sans text-[#6B7280] cursor-not-allowed focus:outline-none shadow-sm"
                />
                <button className="px-5 py-3 rounded-xl bg-[#111827] text-white font-bold font-mono text-sm flex items-center gap-2 shadow-md">
                  <Send className="w-4 h-4" />
                  Gửi
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: MOBILE APP PREVIEW */}
          {activeTab === "mobile" && (
            <div className="flex flex-col md:flex-row items-center justify-center gap-12 py-4 animate-in fade-in duration-300">
              {/* Phone Frame */}
              <div className="w-[300px] h-[550px] bg-white rounded-[40px] p-4 border-[6px] border-[#E5E7EB] shadow-2xl relative flex flex-col justify-between overflow-hidden">
                {/* Notch */}
                <div className="w-32 h-4 bg-[#E5E7EB] rounded-b-xl mx-auto mb-3" />

                {/* Mobile App Screen */}
                <div className="flex-1 space-y-4 overflow-hidden">
                  <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                    <span className="font-extrabold text-sm text-[#111827]">PROGA Mobile</span>
                    <Bell className="w-4 h-4 text-[#137333] animate-bounce" />
                  </div>

                  {/* Push Alert Card */}
                  <div className="p-3 rounded-xl bg-[#E6F4EA] border border-[#E6F4EA] space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-[#137333] font-mono font-bold">
                      <span>STOMP WEBSOCKET</span>
                      <span>Just now</span>
                    </div>
                    <p className="text-xs font-bold text-[#111827] font-sans">
                      PM Agent vừa gán Task mới cho bạn
                    </p>
                    <p className="text-[11px] text-[#4B5563] font-sans">
                      &quot;Review Pull Request Auth Microservice&quot;
                    </p>
                  </div>

                  {/* Task List Preview */}
                  <div className="space-y-2">
                    <p className="text-[11px] font-mono font-bold text-[#6B7280]">
                      TODAY TASKS (3)
                    </p>
                    <div className="p-2.5 rounded-lg bg-[#F6F5EF] border border-[#E5E7EB] text-xs flex items-center justify-between">
                      <span className="text-[#111827] font-sans font-semibold">Kéo thả Kanban Task</span>
                      <span className="text-[#137333] font-mono text-[10px] font-bold">DONE</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#F6F5EF] border border-[#E5E7EB] text-xs flex items-center justify-between">
                      <span className="text-[#111827] font-sans font-semibold">Chat AI Technical Agent</span>
                      <span className="text-[#111827] font-mono text-[10px] font-bold">DOING</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#F6F5EF] border border-[#E5E7EB] text-xs flex items-center justify-between">
                      <span className="text-[#111827] font-sans font-semibold">Review Code BE Gateway</span>
                      <span className="text-[#D97706] font-mono text-[10px] font-bold">TODO</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Home Indicator */}
                <div className="w-24 h-1 bg-[#E5E7EB] rounded-full mx-auto mt-2" />
              </div>

              {/* Mobile Specs Description */}
              <div className="max-w-md space-y-4 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E6F4EA] border border-[#E6F4EA] text-xs text-[#137333] font-mono font-bold">
                  React Native Expo SDK 50+
                </div>
                <h3 className="text-2xl font-bold text-[#111827] font-sans">
                  Đồng Bộ Đa Nền Tảng Thời Gian Thực
                </h3>
                <p className="text-[#4B5563] text-sm leading-relaxed font-sans">
                  Ứng dụng Mobile cho phép các nhà phát triển và PM nhận Push Notification trực tiếp khi có sự thay đổi trên bảng Kanban Web. Dữ liệu được mã hóa an toàn với expo-secure-store.
                </p>
                <div className="pt-2">
                  <a
                    href="#mobile-download"
                    className="inline-flex items-center gap-2 text-xs font-bold text-[#111827] hover:underline font-mono"
                  >
                    <span>Khám phá phiên bản Expo Mobile App</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
