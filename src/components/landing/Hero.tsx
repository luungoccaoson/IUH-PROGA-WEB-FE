"use client";

import React from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock,
  Layers,
  Zap,
  Play,
  ShieldCheck,
  Cpu,
} from "lucide-react";

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden">
      {/* Background Decorative Glow Shapes */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-cyan-500/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-4xl mx-auto space-y-6">
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel border border-indigo-500/30 text-xs font-semibold text-indigo-300 shadow-inner">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>PROGA Platform — AI Multi-Agent Project & Task Management</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.15] text-slate-100">
            Quản Lý Dự Án Thông Minh Với{" "}
            <span className="gradient-text">Bộ Ba AI Agents</span> Trợ Lý Kỹ Thuật
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
            PROGA tự động phân rã yêu cầu dự án thành các thẻ công việc (Tasks), điều phối tiến độ thời gian thực trên bảng Kanban và đồng bộ tức thì lên ứng dụng Mobile Expo.
          </p>

          {/* Action CTAs */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/workspaces"
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-bold text-white bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              <span>Vào Workspace Ngay</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#demo"
              className="w-full sm:w-auto px-7 py-4 rounded-xl text-base font-medium text-slate-300 glass-panel hover:bg-slate-800/80 hover:text-white border border-white/10 transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-cyan-400 text-cyan-400" />
              <span>Xem AI Deconstruct Demo</span>
            </a>
          </div>

          {/* Feature Highlights Pills */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Phân quyền JWT & Access Control</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span>WebSocket Realtime Updates</span>
            </div>
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Requirement, PM & Tech Agents</span>
            </div>
          </div>
        </div>

        {/* Hero Interactive Visual Mockup */}
        <div className="mt-14 relative max-w-5xl mx-auto">
          {/* Card Outer Glow Frame */}
          <div className="p-1 rounded-3xl bg-gradient-to-b from-indigo-500/30 via-violet-500/20 to-transparent shadow-2xl">
            <div className="glass-panel rounded-[22px] overflow-hidden border border-white/10">
              {/* Window Header Bar */}
              <div className="bg-slate-950/80 px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-3 text-xs font-mono text-slate-400">
                    proga://workspace/space-sprint-1/ai-deconstruction
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    STOMP Active
                  </span>
                </div>
              </div>

              {/* Window Body: Prompt & Task Deconstruction Stream */}
              <div className="p-6 md:p-8 bg-[#0b0f19]/90 space-y-6">
                {/* User Input Mockup */}
                <div className="flex items-start gap-4 max-w-3xl">
                  <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                    <span className="font-bold text-xs text-slate-300">PM</span>
                  </div>
                  <div className="glass-card p-4 rounded-2xl border border-indigo-500/20 text-sm text-slate-200">
                    <p className="font-mono text-xs text-indigo-400 mb-1">
                      Requirement Prompt:
                    </p>
                    <p className="text-slate-100">
                      &quot;Tạo tính năng Xác thực JWT &amp; Refresh Token cho Backend Microservice, hỗ trợ phân rã Task công việc tự động vào bảng Kanban.&quot;
                    </p>
                  </div>
                </div>

                {/* AI Agent Response */}
                <div className="flex items-start gap-4 max-w-4xl ml-auto justify-end">
                  <div className="space-y-4 text-right">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-300 font-mono">
                      <Bot className="w-3.5 h-3.5 text-cyan-400" />
                      Requirement Agent (AI) Response Payload
                    </div>

                    {/* Preview Task Grid created by AI */}
                    <div className="glass-panel p-5 rounded-2xl border border-white/10 text-left space-y-3">
                      <div className="flex items-center justify-between border-b border-white/10 pb-3">
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-cyan-400" />
                          <span className="text-xs font-bold text-slate-200">
                            Tự động tạo 4 Tasks vào Space &quot;Auth Service &quot;
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[11px] font-mono">
                          STATUS: READY
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {/* Task Item 1 */}
                        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between hover:border-indigo-500/40 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-semibold text-slate-200">
                              Thiết kế AuthController & JwtTokenProvider
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 font-mono">
                              URGENT
                            </span>
                          </div>
                          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                            <span className="inline-flex items-center gap-1 text-yellow-400">
                              <Clock className="w-3 h-3" /> TODO
                            </span>
                            <span className="text-slate-500">Backend Team</span>
                          </div>
                        </div>

                        {/* Task Item 2 */}
                        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between hover:border-indigo-500/40 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-semibold text-slate-200">
                              Cấu hình CustomUserDetailsService &amp; BCrypt
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-mono">
                              HIGH
                            </span>
                          </div>
                          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                            <span className="inline-flex items-center gap-1 text-cyan-400">
                              <Zap className="w-3 h-3" /> IN_PROGRESS
                            </span>
                            <span className="text-slate-500">Security Lead</span>
                          </div>
                        </div>

                        {/* Task Item 3 */}
                        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between hover:border-indigo-500/40 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-semibold text-slate-200">
                              Viết Integration Test cho Refresh Token
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-300 font-mono">
                              MEDIUM
                            </span>
                          </div>
                          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                            <span className="inline-flex items-center gap-1 text-yellow-400">
                              <Clock className="w-3 h-3" /> TODO
                            </span>
                            <span className="text-slate-500">Tester</span>
                          </div>
                        </div>

                        {/* Task Item 4 */}
                        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between hover:border-indigo-500/40 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-semibold text-slate-200">
                              Đồng bộ STOMP WebSocket push alert về Mobile
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-mono">
                              NORMAL
                            </span>
                          </div>
                          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                            <span className="inline-flex items-center gap-1 text-emerald-400">
                              <CheckCircle2 className="w-3 h-3" /> DONE
                            </span>
                            <span className="text-slate-500">Mobile Dev</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-end gap-3">
                        <button className="px-4 py-2 rounded-lg text-xs font-bold text-slate-900 bg-cyan-400 hover:bg-cyan-300 transition-colors shadow-md shadow-cyan-500/20 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Chấp Nhận Đồng Bộ Vô Space
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center shrink-0">
                    <Bot className="w-5 h-5 text-cyan-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
