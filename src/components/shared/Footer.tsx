"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, GitBranch, Code2, Globe } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-[#E5E7EB] bg-[#F6F5EF] pt-16 pb-12 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-[#E5E7EB]">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-center shadow-sm">
                <Sparkles className="w-4 h-4 text-[#111827]" />
              </div>
              <span className="font-extrabold text-xl tracking-wider text-[#111827] font-sans">
                PROGA
              </span>
            </Link>
            <p className="text-[#6B7280] text-xs leading-relaxed font-sans font-medium">
              Hệ sinh thái Quản lý Dự án &amp; Workspace thông minh tích hợp Bộ ba AI Agents, Bảng Kanban thời gian thực và Đồng bộ di động.
            </p>
            <div className="flex items-center gap-3 pt-2 text-[#6B7280]">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-white border border-[#E5E7EB] flex items-center justify-center hover:text-[#111827] transition-all shadow-sm"
              >
                <GitBranch className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-8 h-8 rounded-lg bg-white border border-[#E5E7EB] flex items-center justify-center hover:text-[#137333] transition-all shadow-sm"
              >
                <Code2 className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-8 h-8 rounded-lg bg-white border border-[#E5E7EB] flex items-center justify-center hover:text-[#111827] transition-all shadow-sm"
              >
                <Globe className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-3">
            <p className="text-xs font-mono font-bold uppercase text-[#111827] tracking-wider">
              Hệ Sinh Thái Web
            </p>
            <ul className="space-y-2 text-xs text-[#6B7280] font-sans font-semibold">
              <li>
                <Link href="/workspaces" className="hover:text-[#111827] transition-colors">
                  Danh sách Workspace
                </Link>
              </li>
              <li>
                <a href="#kanban" className="hover:text-[#137333] transition-colors">
                  Bảng Kanban Drag &amp; Drop
                </a>
              </li>
              <li>
                <a href="#ai-agents" className="hover:text-[#111827] transition-colors">
                  AI Chat Assistant Drawer
                </a>
              </li>
              <li>
                <Link href="/login" className="hover:text-[#137333] transition-colors">
                  Đăng nhập Hệ thống
                </Link>
              </li>
            </ul>
          </div>

          {/* Tech Stack Links */}
          <div className="space-y-3">
            <p className="text-xs font-mono font-bold uppercase text-[#111827] tracking-wider">
              Công Nghệ Nền Tảng
            </p>
            <ul className="space-y-2 text-xs text-[#6B7280] font-sans font-semibold">
              <li className="flex items-center gap-1.5 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-[#111827]" />
                Next.js 14 (App Router)
              </li>
              <li className="flex items-center gap-1.5 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-[#137333]" />
                Spring Boot Microservices Gateway
              </li>
              <li className="flex items-center gap-1.5 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                TanStack Query &amp; Zustand
              </li>
              <li className="flex items-center gap-1.5 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
                STOMP WebSocket Realtime
              </li>
            </ul>
          </div>

          {/* Project Metadata */}
          <div className="space-y-3">
            <p className="text-xs font-mono font-bold uppercase text-[#111827] tracking-wider">
              Khóa Luận Tốt Nghiệp (KLTN)
            </p>
            <p className="text-xs text-[#6B7280] leading-relaxed font-sans font-medium">
              Trường Đại học Công nghiệp TP.HCM (IUH) — Khoa Công nghệ Thông tin.
            </p>
            <div className="p-3 rounded-xl bg-white border border-[#E5E7EB] text-[11px] font-mono text-[#111827] shadow-sm">
              <span className="text-[#111827] font-bold">Project:</span> PROGA Ecosystem
              <br />
              <span className="text-[#137333] font-bold">Target:</span> Web &amp; Mobile App
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6B7280] font-mono font-semibold">
          <p>© {new Date().getFullYear()} PROGA Ecosystem. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with <span className="text-[#D93025]">♥</span> for Agile Teams &amp; AI Developers
          </p>
        </div>
      </div>
    </footer>
  );
}
