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
    <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-4xl mx-auto space-y-6">
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F6F5EF] border border-[#E5E7EB] text-xs font-mono font-bold text-[#111827] shadow-sm">
            <Sparkles className="w-4 h-4 text-[#137333] animate-pulse" />
            <span>PROGA — AI Multi-Agent Technical Project Ecosystem</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#137333]" />
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.15] text-[#111827] font-sans">
            Quản Lý Dự Án Thông Minh Với{" "}
            <span className="text-[#111827] underline decoration-2 underline-offset-8 decoration-[#137333]">
              Bộ Ba AI Agents
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-[#4B5563] max-w-3xl mx-auto leading-relaxed font-sans">
            PROGA tự động phân rã yêu cầu dự án thành các thẻ công việc (Tasks), điều phối tiến độ thời gian thực trên bảng Kanban và đồng bộ tức thì lên ứng dụng di động.
          </p>

          {/* Action CTAs */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/workspaces"
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-bold text-white bg-[#111827] hover:bg-[#1F2937] shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              <span>Vào Workspace Ngay</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#demo"
              className="w-full sm:w-auto px-7 py-4 rounded-xl text-base font-semibold text-[#111827] bg-[#F6F5EF] hover:bg-[#EAE8DE] border border-[#E5E7EB] transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-[#137333] text-[#137333]" />
              <span>Xem AI Deconstruct Demo</span>
            </a>
          </div>

          {/* Feature Highlights Pills */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-[#6B7280] font-mono font-semibold">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#137333]" />
              <span>JWT &amp; Access Control</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#D93025]" />
              <span>STOMP Realtime Sync</span>
            </div>
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#111827]" />
              <span>Requirement, PM &amp; Tech Agents</span>
            </div>
          </div>
        </div>

        {/* Hero Interactive Visual Mockup 100% Light Mode */}
        <div className="mt-14 relative max-w-5xl mx-auto">
          <div className="p-1 rounded-3xl bg-[#E5E7EB] shadow-xl">
            <div className="bg-white rounded-[22px] overflow-hidden border border-[#E5E7EB]">
              {/* Window Header Bar */}
              <div className="bg-[#F6F5EF] px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#D93025]" />
                  <div className="w-3 h-3 rounded-full bg-[#D97706]" />
                  <div className="w-3 h-3 rounded-full bg-[#137333]" />
                  <span className="ml-3 text-xs font-mono text-[#6B7280] font-semibold">
                    proga://workspace/space-sprint-1/ai-deconstruction
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#E6F4EA] text-[#137333] border border-[#E6F4EA] text-xs font-mono font-bold">
                    <span className="w-2 h-2 rounded-full bg-[#137333] animate-ping" />
                    STOMP Active
                  </span>
                </div>
              </div>

              {/* Window Body */}
              <div className="p-6 md:p-8 bg-white space-y-6">
                {/* User Input Mockup */}
                <div className="flex items-start gap-4 max-w-3xl">
                  <div className="w-9 h-9 rounded-xl bg-[#F6F5EF] border border-[#E5E7EB] flex items-center justify-center shrink-0">
                    <span className="font-bold text-xs font-mono text-[#111827]">PM</span>
                  </div>
                  <div className="bg-[#F6F5EF] p-4 rounded-2xl border border-[#E5E7EB] text-sm text-[#111827]">
                    <p className="font-mono text-xs text-[#6B7280] mb-1 font-bold">
                      Requirement Prompt:
                    </p>
                    <p className="text-[#111827] font-sans font-medium">
                      &quot;Tạo tính năng Xác thực JWT &amp; Refresh Token cho Backend Microservice, hỗ trợ phân rã Task công việc tự động vào bảng Kanban.&quot;
                    </p>
                  </div>
                </div>

                {/* AI Agent Response */}
                <div className="flex items-start gap-4 max-w-4xl ml-auto justify-end">
                  <div className="space-y-4 text-right">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F6F5EF] border border-[#E5E7EB] text-xs text-[#111827] font-mono font-bold">
                      <Bot className="w-3.5 h-3.5 text-[#137333]" />
                      Requirement Agent (AI) Response Payload
                    </div>

                    {/* Preview Task Grid created by AI */}
                    <div className="bg-[#F6F5EF] p-5 rounded-2xl border border-[#E5E7EB] text-left space-y-3">
                      <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-[#111827]" />
                          <span className="text-xs font-bold text-[#111827] font-sans">
                            Tự động tạo 4 Tasks vào Space &quot;Auth Service&quot;
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-[#E6F4EA] text-[#137333] text-[11px] font-mono font-bold">
                          STATUS: READY
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {/* Task Item 1 */}
                        <div className="p-3.5 rounded-xl bg-white border border-[#E5E7EB] flex flex-col justify-between hover:border-[#111827] transition-colors shadow-sm">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-semibold text-[#111827] font-sans">
                              Thiết kế AuthController &amp; JwtTokenProvider
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#FDEDEC] text-[#D93025] font-mono font-bold">
                              URGENT
                            </span>
                          </div>
                          <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-[#6B7280]">
                            <span className="inline-flex items-center gap-1 text-[#D93025] font-bold">
                              <Clock className="w-3 h-3" /> TODO
                            </span>
                            <span className="text-slate-500">Backend Team</span>
                          </div>
                        </div>

                        {/* Task Item 2 */}
                        <div className="p-3.5 rounded-xl bg-white border border-[#E5E7EB] flex flex-col justify-between hover:border-[#111827] transition-colors shadow-sm">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-semibold text-[#111827] font-sans">
                              Cấu hình CustomUserDetailsService &amp; BCrypt
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#FEF3C7] text-[#D97706] font-mono font-bold">
                              HIGH
                            </span>
                          </div>
                          <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-[#6B7280]">
                            <span className="inline-flex items-center gap-1 text-[#111827] font-bold">
                              <Zap className="w-3 h-3" /> IN_PROGRESS
                            </span>
                            <span className="text-slate-500">Security Lead</span>
                          </div>
                        </div>

                        {/* Task Item 3 */}
                        <div className="p-3.5 rounded-xl bg-white border border-[#E5E7EB] flex flex-col justify-between hover:border-[#111827] transition-colors shadow-sm">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-semibold text-[#111827] font-sans">
                              Viết Integration Test cho Refresh Token
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#E0F2FE] text-[#0284C7] font-mono font-bold">
                              MEDIUM
                            </span>
                          </div>
                          <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-[#6B7280]">
                            <span className="inline-flex items-center gap-1 text-[#D97706] font-bold">
                              <Clock className="w-3 h-3" /> TODO
                            </span>
                            <span className="text-slate-500">Tester</span>
                          </div>
                        </div>

                        {/* Task Item 4 */}
                        <div className="p-3.5 rounded-xl bg-white border border-[#E5E7EB] flex flex-col justify-between hover:border-[#111827] transition-colors shadow-sm">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-semibold text-[#111827] font-sans">
                              Đồng bộ STOMP WebSocket push alert về Mobile
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#E6F4EA] text-[#137333] font-mono font-bold">
                              NORMAL
                            </span>
                          </div>
                          <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-[#6B7280]">
                            <span className="inline-flex items-center gap-1 text-[#137333] font-bold">
                              <CheckCircle2 className="w-3 h-3" /> DONE
                            </span>
                            <span className="text-slate-500">Mobile Dev</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-end gap-3">
                        <button className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-[#111827] hover:bg-[#1F2937] transition-colors shadow-md flex items-center gap-1.5 font-mono">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Chấp Nhận Đồng Bộ Vô Space
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-[#F6F5EF] border border-[#E5E7EB] flex items-center justify-center shrink-0">
                    <Bot className="w-5 h-5 text-[#137333]" />
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
