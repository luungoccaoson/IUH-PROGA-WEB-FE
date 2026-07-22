"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { LayoutGrid, Briefcase, CheckSquare, Sparkles, LogOut } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuthStore();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen flex bg-white text-[#111827]">
      {/* Left Sidebar - Warm Beige #F6F5EF matching uploaded image 100% */}
      <aside className="w-64 border-r border-[#E5E7EB] bg-[#F6F5EF] flex flex-col justify-between p-5 hidden md:flex shrink-0">
        <div className="space-y-6">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2.5 px-2">
            <div className="w-9 h-9 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5 text-[#111827]" />
            </div>
            <span className="font-extrabold text-xl tracking-wider text-[#111827] font-sans">
              PROGA
            </span>
          </Link>

          {/* Section Header: QUẢN LÝ */}
          <div className="space-y-2">
            <p className="px-3 text-[11px] font-mono font-bold uppercase tracking-wider text-[#6B7280]">
              QUẢN LÝ
            </p>

            <nav className="space-y-1 font-sans">
              {/* Dashboard Pill */}
              <Link
                href="/workspaces"
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all shadow-sm ${
                  pathname === "/workspaces" || pathname === "/"
                    ? "bg-white text-[#111827] border border-[#E5E7EB]"
                    : "text-[#4B5563] hover:bg-white/60 hover:text-[#111827]"
                }`}
              >
                <LayoutGrid className="w-5 h-5 text-[#111827]" />
                <span>Dashboard</span>
              </Link>

              {/* Dự án (Workspaces) */}
              <Link
                href="/workspaces"
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-[#4B5563] hover:bg-white/60 hover:text-[#111827] transition-colors"
              >
                <Briefcase className="w-5 h-5 text-[#6B7280]" />
                <span>Dự án</span>
              </Link>

              {/* Công việc (Tasks) */}
              <a
                href="#kanban"
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-[#4B5563] hover:bg-white/60 hover:text-[#111827] transition-colors"
              >
                <CheckSquare className="w-5 h-5 text-[#6B7280]" />
                <span>Công việc</span>
              </a>

              {/* Phân tích AI */}
              <a
                href="#ai-analysis"
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-[#4B5563] hover:bg-white/60 hover:text-[#111827] transition-colors"
              >
                <Sparkles className="w-5 h-5 text-[#137333]" />
                <span>Phân tích AI</span>
              </a>
            </nav>
          </div>
        </div>

        {/* Footer User Info & Logout (No Theme Toggle) */}
        <div className="pt-4 border-t border-[#E5E7EB] space-y-3 font-sans">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-[#111827] text-white font-bold font-mono text-xs flex items-center justify-center shrink-0">
                {mounted && user?.username ? user.username.substring(0, 2).toUpperCase() : "SL"}
              </div>
              <div className="truncate text-xs">
                <p className="font-bold text-[#111827] truncate">
                  {mounted && user?.username ? user.username : "Son Luu"}
                </p>
                <p className="text-[10px] text-[#6B7280] font-mono truncate">
                  {mounted && user?.email ? user.email : "developer@proga.vn"}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              logout();
              window.location.href = "/login";
            }}
            className="w-full py-2 rounded-xl border border-[#E5E7EB] hover:bg-[#FDEDEC] text-[#D93025] text-xs font-mono font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Dashboard Workspace Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-6 md:p-10 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
