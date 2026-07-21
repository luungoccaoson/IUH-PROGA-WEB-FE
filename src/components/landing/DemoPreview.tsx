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
    <section id="demo" className="py-24 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-indigo-900/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-panel border border-indigo-500/30 text-xs font-semibold text-indigo-300">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Trải Nghiệm Giao Diện Trực Quan</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-100">
            Xem Trực Quan <span className="gradient-text">Giao Diện Hệ Thống</span>
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            Chọn các chế độ dưới đây để trải nghiệm trước giao diện làm việc của PROGA Web &amp; Mobile.
          </p>
        </div>

        {/* Tab Switcher Buttons */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex p-1.5 rounded-2xl glass-panel border border-white/10 gap-2">
            <button
              onClick={() => setActiveTab("kanban")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "kanban"
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Kanban className="w-4 h-4" />
              Bảng Kanban 4 Cột
            </button>
            <button
              onClick={() => setActiveTab("ai")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "ai"
                  ? "bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-lg shadow-cyan-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Bot className="w-4 h-4" />
              AI Chat Assistant
            </button>
            <button
              onClick={() => setActiveTab("mobile")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "mobile"
                  ? "bg-gradient-to-r from-violet-600 to-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Smartphone className="w-4 h-4" />
              Mobile App Sync
            </button>
          </div>
        </div>

        {/* Tab Content Display */}
        <div className="glass-panel rounded-3xl p-6 md:p-8 border border-white/10 shadow-2xl bg-[#090d16]/90">
          {/* TAB 1: KANBAN BOARD PREVIEW */}
          {activeTab === "kanban" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-400" />
                    Space: Sprint 1 — System Authentication &amp; Microservices
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Cập nhật thời gian thực bằng TanStack Query v5 + STOMP Optimistic UI
                  </p>
                </div>
                <button className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/30">
                  <Plus className="w-4 h-4" />
                  Thêm Task Mới
                </button>
              </div>

              {/* Kanban 4 Columns Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* COLUMN 1: TODO */}
                <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between font-mono text-xs font-bold text-amber-400 pb-2 border-b border-slate-800">
                    <span>TODO (2)</span>
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 hover:border-amber-500/40 cursor-grab">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono">
                        URGENT
                      </span>
                      <span className="text-slate-500 font-mono">TASK-101</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-200">
                      Cấu hình Eureka Server &amp; API Gateway Port 8080
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-900">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" /> Admin
                      </span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <Clock className="w-3 h-3" /> 21/07
                      </span>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 hover:border-amber-500/40 cursor-grab">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
                        MEDIUM
                      </span>
                      <span className="text-slate-500 font-mono">TASK-102</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-200">
                      Tạo Database Schema PostgreSql &amp; JPA Entities
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-900">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" /> Dev Lead
                      </span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <Clock className="w-3 h-3" /> 22/07
                      </span>
                    </div>
                  </div>
                </div>

                {/* COLUMN 2: IN_PROGRESS */}
                <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between font-mono text-xs font-bold text-cyan-400 pb-2 border-b border-slate-800">
                    <span>IN_PROGRESS (1)</span>
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-cyan-500/30 space-y-2 cursor-grab shadow-lg shadow-cyan-500/10">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                        HIGH
                      </span>
                      <span className="text-slate-500 font-mono">TASK-103</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-100">
                      Viết AuthController /login &amp; /register Endpoints
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-900">
                      <span className="flex items-center gap-1 text-cyan-300">
                        <User className="w-3 h-3" /> Son Luu (You)
                      </span>
                      <span className="flex items-center gap-1 text-cyan-400">
                        <Clock className="w-3 h-3" /> Đang làm
                      </span>
                    </div>
                  </div>
                </div>

                {/* COLUMN 3: REVIEW */}
                <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between font-mono text-xs font-bold text-violet-400 pb-2 border-b border-slate-800">
                    <span>REVIEW (1)</span>
                    <span className="w-2 h-2 rounded-full bg-violet-400" />
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 hover:border-violet-500/40 cursor-grab">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                        HIGH
                      </span>
                      <span className="text-slate-500 font-mono">TASK-104</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-200">
                      Cấu hình STOMP WebSocket Notification Endpoints
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-900">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" /> PM Agent
                      </span>
                      <span className="flex items-center gap-1 text-violet-400">
                        Chờ Review
                      </span>
                    </div>
                  </div>
                </div>

                {/* COLUMN 4: DONE */}
                <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between font-mono text-xs font-bold text-emerald-400 pb-2 border-b border-slate-800">
                    <span>DONE (2)</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 opacity-75">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                        NORMAL
                      </span>
                      <span className="text-slate-500 font-mono">TASK-100</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-300 line-through">
                      Khởi tạo dự án Next.js 14 App Router &amp; Tailwind
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-900">
                      <span className="flex items-center gap-1 text-emerald-400">
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
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-100">
                      Requirement Agent Drawer
                    </h3>
                    <p className="text-xs text-slate-400">
                      Tự động bóc tách yêu cầu PRD thành Task công việc có thể thực thi.
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-mono">
                  Agent Status: Online ⚡
                </span>
              </div>

              {/* Chat Conversation Area */}
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
                {/* User Message */}
                <div className="flex items-start gap-3 max-w-2xl ml-auto justify-end">
                  <div className="glass-card p-4 rounded-2xl bg-indigo-600/30 border border-indigo-500/30 text-sm text-slate-200">
                    Phân rã tính năng &quot;Quản lý Không Gian Làm Việc (Space Management) với CRUD API&quot; thành các công việc cụ thể cho Team nhé.
                  </div>
                </div>

                {/* AI Assistant Reply */}
                <div className="flex items-start gap-3 max-w-3xl">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="glass-card p-4 rounded-2xl border border-white/10 text-sm space-y-3">
                    <p className="text-slate-200">
                      Tôi đã nghiên cứu yêu cầu của bạn và phân rã thành 3 Tasks chi tiết cho Space <span className="text-cyan-400 font-semibold">&quot;Workspace Service&quot;</span>:
                    </p>
                    <div className="space-y-2 font-mono text-xs text-slate-300 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between text-cyan-400">
                        <span>1. SpaceController CRUD REST Endpoints</span>
                        <span>[HIGH]</span>
                      </div>
                      <div className="flex items-center justify-between text-cyan-400">
                        <span>2. SpaceRepository &amp; JPA Entity Relation</span>
                        <span>[MEDIUM]</span>
                      </div>
                      <div className="flex items-center justify-between text-cyan-400">
                        <span>3. Unit tests cho SpaceServiceImpl</span>
                        <span>[LOW]</span>
                      </div>
                    </div>
                    <div className="pt-2 flex items-center gap-2">
                      <button className="px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1 hover:bg-cyan-400 transition-colors">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Đồng ý chèn 3 Tasks
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat Input Bar */}
              <div className="pt-2 border-t border-slate-800 flex items-center gap-3">
                <input
                  type="text"
                  readOnly
                  value="Nhập yêu cầu phân rã hoặc câu hỏi về kiến trúc tại đây..."
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-400 cursor-not-allowed focus:outline-none"
                />
                <button className="px-5 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/30">
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
              <div className="w-[300px] h-[550px] bg-slate-950 rounded-[40px] p-4 border-[6px] border-slate-800 shadow-2xl relative flex flex-col justify-between overflow-hidden">
                {/* Notch */}
                <div className="w-32 h-4 bg-slate-800 rounded-b-xl mx-auto mb-3" />

                {/* Mobile App Screen */}
                <div className="flex-1 space-y-4 overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="font-extrabold text-sm gradient-text">PROGA Mobile</span>
                    <Bell className="w-4 h-4 text-emerald-400 animate-bounce" />
                  </div>

                  {/* Push Alert Card */}
                  <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-emerald-400 font-mono">
                      <span>STOMP WEBSOCKET</span>
                      <span>Just now</span>
                    </div>
                    <p className="text-xs font-bold text-slate-100">
                      PM Agent vừa gán Task mới cho bạn
                    </p>
                    <p className="text-[11px] text-slate-300">
                      &quot;Review Pull Request Auth Microservice&quot;
                    </p>
                  </div>

                  {/* Task List Preview */}
                  <div className="space-y-2">
                    <p className="text-[11px] font-mono font-semibold text-slate-400">
                      TODAY TASKS (3)
                    </p>
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs flex items-center justify-between">
                      <span className="text-slate-200">Kéo thả Kanban Task</span>
                      <span className="text-emerald-400 text-[10px]">DONE</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs flex items-center justify-between">
                      <span className="text-slate-200">Chat AI Technical Agent</span>
                      <span className="text-cyan-400 text-[10px]">DOING</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs flex items-center justify-between">
                      <span className="text-slate-200">Review Code BE Gateway</span>
                      <span className="text-amber-400 text-[10px]">TODO</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Home Indicator */}
                <div className="w-24 h-1 bg-slate-700 rounded-full mx-auto mt-2" />
              </div>

              {/* Mobile Specs Description */}
              <div className="max-w-md space-y-4 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 font-mono">
                  React Native Expo SDK 50+
                </div>
                <h3 className="text-2xl font-bold text-slate-100">
                  Đồng Bộ Đa Nền Tảng Thời Gian Thực
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Ứng dụng Mobile cho phép các nhà phát triển và PM nhận Push Notification trực tiếp khi có sự thay đổi trên bảng Kanban Web. Dữ liệu được mã hóa an toàn với expo-secure-store.
                </p>
                <div className="pt-2">
                  <a
                    href="#mobile-download"
                    className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
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
