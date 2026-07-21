"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, GitBranch, Code2, Globe } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-[#060911] pt-16 pb-12 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800/80">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-500 p-[1px]">
                <div className="w-full h-full bg-[#090d16] rounded-[11px] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                </div>
              </div>
              <span className="font-extrabold text-xl tracking-wider gradient-text font-sans">
                PROGA
              </span>
            </Link>
            <p className="text-slate-400 text-xs leading-relaxed">
              Hệ sinh thái Quản lý Dự án &amp; Workspace thông minh tích hợp Bộ ba AI Agents, Bảng Kanban thời gian thực và Đồng bộ di động.
            </p>
            <div className="flex items-center gap-3 pt-2 text-slate-400">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center hover:text-white hover:border-slate-700 transition-all"
              >
                <GitBranch className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center hover:text-cyan-400 hover:border-slate-700 transition-all"
              >
                <Code2 className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center hover:text-indigo-400 hover:border-slate-700 transition-all"
              >
                <Globe className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-3">
            <p className="text-xs font-mono font-bold uppercase text-slate-200 tracking-wider">
              Hệ Sinh Thái Web
            </p>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link href="/workspaces" className="hover:text-cyan-400 transition-colors">
                  Danh sách Workspace
                </Link>
              </li>
              <li>
                <a href="#kanban" className="hover:text-indigo-400 transition-colors">
                  Bảng Kanban Drag &amp; Drop
                </a>
              </li>
              <li>
                <a href="#ai-agents" className="hover:text-violet-400 transition-colors">
                  AI Chat Assistant Drawer
                </a>
              </li>
              <li>
                <Link href="/login" className="hover:text-emerald-400 transition-colors">
                  Đăng nhập Hệ thống
                </Link>
              </li>
            </ul>
          </div>

          {/* Tech Stack Links */}
          <div className="space-y-3">
            <p className="text-xs font-mono font-bold uppercase text-slate-200 tracking-wider">
              Công Nghệ Nền Tảng
            </p>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                Next.js 14 (App Router)
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                Spring Boot Microservices Gateway
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                TanStack Query &amp; Zustand
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                STOMP WebSocket Realtime
              </li>
            </ul>
          </div>

          {/* Project Metadata */}
          <div className="space-y-3">
            <p className="text-xs font-mono font-bold uppercase text-slate-200 tracking-wider">
              Khóa Luận Tốt Nghiệp (KLTN)
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Trường Đại học Công nghiệp TP.HCM (IUH) — Khoa Công nghệ Thông tin.
            </p>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-slate-300">
              <span className="text-indigo-400 font-bold">Project:</span> PROGA Ecosystem
              <br />
              <span className="text-cyan-400 font-bold">Target:</span> Web &amp; Mobile App
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-mono">
          <p>© {new Date().getFullYear()} PROGA Ecosystem. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with <span className="text-rose-500">♥</span> for Agile Teams &amp; AI Developers
          </p>
        </div>
      </div>
    </footer>
  );
}
