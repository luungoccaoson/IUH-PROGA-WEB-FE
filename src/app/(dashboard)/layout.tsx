"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { LayoutGrid, Sparkles, LogOut, Folder, Compass, HelpCircle } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePathname } from "next/navigation";
import { workspaceService } from "@/services/workspace.service";
import { Workspace } from "@/types";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, loadAuthFromStorage } = useAuthStore();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  
  // Active workspace state
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);

  // Extract active workspace ID from URL path (e.g. /workspaces/1)
  const match = pathname.match(/^\/workspaces\/([^\/]+)/);
  const activeWorkspaceId = match && match[1] !== "page" ? match[1] : null;
  const isNumberId = activeWorkspaceId && /^\d+$/.test(activeWorkspaceId);

  useEffect(() => {
    loadAuthFromStorage();
    setMounted(true);
    const token = localStorage.getItem('accessToken');
    if (!token) {
      window.location.href = '/login';
    }
  }, [loadAuthFromStorage]);

  // Load workspace details dynamically when path parameter changes
  useEffect(() => {
    if (isNumberId && activeWorkspaceId) {
      workspaceService.getWorkspaceById(parseInt(activeWorkspaceId, 10))
        .then((data) => setActiveWorkspace(data))
        .catch((err) => console.error("Error loading workspace for sidebar:", err));
    } else {
      setActiveWorkspace(null);
    }
  }, [activeWorkspaceId, isNumberId]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#F6F5EF] flex flex-col items-center justify-center font-sans text-sm text-[#6B7280]">
        <div className="w-10 h-10 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-center shadow-sm animate-bounce mb-3">
          <Sparkles className="w-5 h-5 text-[#111827]" />
        </div>
        <p className="font-bold text-[#111827] font-mono text-xs uppercase tracking-widest animate-pulse">
          Loading dashboard...
        </p>
      </div>
    );
  }

  if (typeof window !== 'undefined' && !localStorage.getItem('accessToken')) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-white text-[#111827]">
      {/* Left Sidebar - Warm Beige #F6F5EF */}
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

          {/* SIDEBAR NAVIGATION STRUCTURE */}
          {isNumberId && activeWorkspace ? (
            // Workspace-specific sidebar (Dashboard, Spaces, AI)
            <div className="space-y-6">
              {/* Back to Workspaces */}
              <Link
                href="/workspaces"
                className="flex items-center gap-2 px-3 py-1.5 text-xs text-[#6B7280] hover:text-[#111827] transition-colors font-mono font-bold"
              >
                <span>← Chọn Workspace khác</span>
              </Link>

              {/* 1. Navigation */}
              <div className="space-y-2">
                <p className="px-3 text-[11px] font-mono font-bold uppercase tracking-wider text-[#6B7280] truncate">
                  🎯 WS: {activeWorkspace.name}
                </p>

                <nav className="space-y-1 font-sans">
                  {/* Dashboard */}
                  <Link
                    href={`/workspaces/${activeWorkspaceId}`}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all shadow-sm ${
                      pathname === `/workspaces/${activeWorkspaceId}`
                        ? "bg-white text-[#111827] border border-[#E5E7EB]"
                        : "text-[#4B5563] hover:bg-white/60 hover:text-[#111827]"
                    }`}
                  >
                    <LayoutGrid className="w-5 h-5 text-[#111827]" />
                    <span>Dashboard</span>
                  </Link>

                  {/* Phân tích AI */}
                  <a
                    href={`/workspaces/${activeWorkspaceId}#ai-analysis`}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-[#4B5563] hover:bg-white/60 hover:text-[#111827] transition-colors"
                  >
                    <Sparkles className="w-5 h-5 text-[#137333]" />
                    <span>Phân tích AI</span>
                  </a>
                </nav>
              </div>

              {/* 2. SPACES SECTION (Replaces "Dự án", tasks removed) */}
              <div className="space-y-2 pt-2 border-t border-[#E5E7EB]">
                <div className="flex items-center justify-between px-3 text-[11px] font-mono font-bold uppercase tracking-wider text-[#6B7280]">
                  <span className="flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5" />
                    Spaces
                  </span>
                  <div className="flex items-center gap-1.5 text-xs">
                    <button className="hover:text-[#111827] font-extrabold">+</button>
                    <button className="hover:text-[#111827]">···</button>
                  </div>
                </div>

                <div className="space-y-1 font-sans">
                  <div className="px-3 text-[9px] font-bold text-[#9CA3AF] uppercase font-mono tracking-wider">
                    Gần đây
                  </div>
                  
                  {/* Mock spaces */}
                  <a
                    href="#"
                    className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-sm font-semibold text-[#111827] bg-white border border-[#E5E7EB] shadow-sm hover:scale-[1.01] transition-transform"
                  >
                    <div className="w-5 h-5 rounded-lg bg-[#E6F4EA] flex items-center justify-center text-[#137333] font-mono font-bold text-[10px]">
                      PR
                    </div>
                    <span className="truncate">PROGA Core</span>
                  </a>

                  <a
                    href="#"
                    className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-sm font-semibold text-[#4B5563] hover:bg-white/60 hover:text-[#111827] transition-colors"
                  >
                    <div className="w-5 h-5 rounded-lg bg-[#E8F0FE] flex items-center justify-center text-[#1A73E8] font-mono font-bold text-[10px]">
                      TE
                    </div>
                    <span className="truncate">Test Space</span>
                  </a>

                  <a
                    href="#"
                    className="flex items-center gap-2 px-4 py-1.5 text-[11px] font-semibold text-[#6B7280] hover:text-[#111827]"
                  >
                    <span>More spaces</span>
                  </a>

                  <a
                    href="#"
                    className="flex items-center gap-2 px-4 py-1.5 text-[11px] font-semibold text-[#6B7280] hover:text-[#111827]"
                  >
                    <span>Browse templates</span>
                  </a>

                  <div className="pt-2 border-t border-[#E5E7EB]/50 mt-1">
                    <a
                      href="#"
                      className="flex items-center gap-2 px-4 py-1.5 text-[11px] font-bold text-[#4B5563] hover:text-[#111827]"
                    >
                      <span>🔍 Bộ lọc</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Simplified main selector sidebar (Workspaces List view)
            <div className="space-y-3">
              <p className="px-3 text-[11px] font-mono font-bold uppercase tracking-wider text-[#6B7280]">
                Hệ Thống
              </p>

              <nav className="space-y-1 font-sans">
                <Link
                  href="/workspaces"
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all shadow-sm ${
                    pathname === "/workspaces"
                      ? "bg-white text-[#111827] border border-[#E5E7EB]"
                      : "text-[#4B5563] hover:bg-white/60 hover:text-[#111827]"
                  }`}
                >
                  <LayoutGrid className="w-5 h-5 text-[#111827]" />
                  <span>Danh sách Workspaces</span>
                </Link>
              </nav>
            </div>
          )}
        </div>

        {/* Footer User Info & Logout */}
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
              window.location.href = "/";
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
