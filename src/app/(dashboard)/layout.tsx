"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { LayoutGrid, Sparkles, LogOut, Folder, Compass, HelpCircle, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePathname } from "next/navigation";
import { workspaceService } from "@/services/workspace.service";
import { Workspace, Space } from "@/types";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, loadAuthFromStorage } = useAuthStore();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Active workspace state
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [spaces, setSpaces] = useState<Space[]>([]);

  // Create Space Modal state
  const [isCreateSpaceOpen, setIsCreateSpaceOpen] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState("");
  const [newSpaceStartDate, setNewSpaceStartDate] = useState("");
  const [newSpaceEndDate, setNewSpaceEndDate] = useState("");
  const [createSpaceLoading, setCreateSpaceLoading] = useState(false);
  const [createSpaceError, setCreateSpaceError] = useState("");

  // Extract active workspace ID from URL path (e.g. /workspaces/1)
  const match = pathname.match(/^\/workspaces\/([^\/]+)/);
  const activeWorkspaceId = match && match[1] !== "page" ? match[1] : null;
  const isNumberId = activeWorkspaceId && /^\d+$/.test(activeWorkspaceId);

  // Load spaces dynamically
  const loadSpaces = async () => {
    if (isNumberId && activeWorkspaceId) {
      try {
        const data = await workspaceService.getSpacesByWorkspace(parseInt(activeWorkspaceId, 10));
        setSpaces(data);
      } catch (err) {
        console.error("Error loading spaces for sidebar:", err);
      }
    } else {
      setSpaces([]);
    }
  };

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
      loadSpaces();
    } else {
      setActiveWorkspace(null);
      setSpaces([]);
    }

    const handleSpaceCreated = () => {
      loadSpaces();
    };
    window.addEventListener("space-created", handleSpaceCreated);
    return () => window.removeEventListener("space-created", handleSpaceCreated);
  }, [activeWorkspaceId, isNumberId]);

  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpaceName.trim() || !activeWorkspaceId) return;

    try {
      setCreateSpaceLoading(true);
      setCreateSpaceError("");
      await workspaceService.createSpace({
        workspaceId: parseInt(activeWorkspaceId, 10),
        name: newSpaceName.trim(),
        startDate: newSpaceStartDate ? `${newSpaceStartDate}T00:00:00` : undefined,
        endDate: newSpaceEndDate ? `${newSpaceEndDate}T23:59:59` : undefined,
      });
      setNewSpaceName("");
      setNewSpaceStartDate("");
      setNewSpaceEndDate("");
      setIsCreateSpaceOpen(false);
      await loadSpaces();
    } catch (err: any) {
      console.error("Error creating space:", err);
      setCreateSpaceError(err.response?.data?.message || "Không thể tạo space.");
    } finally {
      setCreateSpaceLoading(false);
    }
  };

  // Extract active space ID from URL path (e.g. /workspaces/1/spaces/2)
  const spaceMatch = pathname.match(/\/workspaces\/\d+\/spaces\/(\d+)/);
  const activeSpaceId = spaceMatch ? parseInt(spaceMatch[1], 10) : null;
  const activeSpace = spaces.find((s) => s.id === activeSpaceId);

  // Edit Space Modal state
  const [isEditSpaceOpen, setIsEditSpaceOpen] = useState(false);
  const [editSpaceName, setEditSpaceName] = useState("");
  const [editSpaceStartDate, setEditSpaceStartDate] = useState("");
  const [editSpaceEndDate, setEditSpaceEndDate] = useState("");
  const [editSpaceLoading, setEditSpaceLoading] = useState(false);
  const [editSpaceError, setEditSpaceError] = useState("");

  const handleOpenEditSpace = () => {
    if (activeSpace) {
      setEditSpaceName(activeSpace.name);
      setEditSpaceStartDate(activeSpace.startDate ? activeSpace.startDate.substring(0, 10) : "");
      setEditSpaceEndDate(activeSpace.endDate ? activeSpace.endDate.substring(0, 10) : "");
      setIsEditSpaceOpen(true);
    } else {
      alert("Vui lòng chọn một Space trước khi cài đặt.");
    }
  };

  const handleEditSpaceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSpaceName.trim() || !activeSpaceId) return;

    try {
      setEditSpaceLoading(true);
      setEditSpaceError("");
      const updated = await workspaceService.updateSpace(activeSpaceId, {
        workspaceId: parseInt(activeWorkspaceId!, 10),
        name: editSpaceName.trim(),
        startDate: editSpaceStartDate ? `${editSpaceStartDate}T00:00:00` : undefined,
        endDate: editSpaceEndDate ? `${editSpaceEndDate}T23:59:59` : undefined,
      });
      setIsEditSpaceOpen(false);
      setSpaces((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    } catch (err: any) {
      console.error("Error editing space:", err);
      setEditSpaceError(err.response?.data?.message || "Không thể cập nhật Space.");
    } finally {
      setEditSpaceLoading(false);
    }
  };

  const handleDeleteSpaceSubmit = async () => {
    if (!activeSpaceId) return;
    if (!window.confirm("Bạn có chắc chắn muốn xóa Space này không? Tất cả các task thuộc về Space này cũng sẽ bị ảnh hưởng.")) {
      return;
    }

    try {
      setEditSpaceLoading(true);
      setEditSpaceError("");
      await workspaceService.deleteSpace(activeSpaceId);
      setIsEditSpaceOpen(false);
      await loadSpaces();
      // Redirect to workspace details
      window.location.href = `/workspaces/${activeWorkspaceId}`;
    } catch (err: any) {
      console.error("Error deleting space:", err);
      setEditSpaceError(err.response?.data?.message || "Không thể xóa Space.");
    } finally {
      setEditSpaceLoading(false);
    }
  };

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
      <aside className={`border-r border-[#E5E7EB] bg-[#F6F5EF] transition-all duration-300 shrink-0 ${
        isSidebarCollapsed ? "hidden" : "w-64 p-5 flex flex-col justify-between hidden md:flex"
      }`}>
        <div className="space-y-6">
          {/* Logo & Brand & Toggle Button */}
          <div className="flex items-center justify-between px-1">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-center shadow-sm shrink-0">
                <Sparkles className="w-5 h-5 text-[#111827]" />
              </div>
              <span className="font-extrabold text-xl tracking-wider text-[#111827] font-sans">
                PROGA
              </span>
            </Link>

            <button
              onClick={() => setIsSidebarCollapsed(true)}
              className="p-1.5 rounded-xl border border-[#E5E7EB] bg-white hover:bg-gray-100 text-[#4B5563] transition-all shadow-2xs cursor-pointer"
              title="Ẩn Sidebar"
            >
              <PanelLeftClose className="w-4 h-4 text-[#111827]" />
            </button>
          </div>

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

                  {/* AI Co-Pilot Khởi Tạo Space */}
                  <Link
                    href={`/workspaces/${activeWorkspaceId}/ai-analysis`}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all shadow-sm ${
                      pathname === `/workspaces/${activeWorkspaceId}/ai-analysis`
                        ? "bg-white text-[#111827] border border-[#E5E7EB]"
                        : "text-[#4B5563] hover:bg-white/60 hover:text-[#111827]"
                    }`}
                  >
                    <Sparkles className="w-5 h-5 text-[#137333]" />
                    <span>🤖 AI Co-Pilot Khởi Tạo Space</span>
                  </Link>
                </nav>
              </div>

              {/* 2. SPACES SECTION (Replaces "Dự án", tasks removed) */}
              <div className="space-y-2 pt-2 border-t border-[#E5E7EB]">
                <div className="flex items-center justify-between px-3 text-[11px] font-mono font-bold uppercase tracking-wider text-[#6B7280]">
                  <span className="flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5" />
                    Spaces
                  </span>
                  {user?.id && activeWorkspace?.ownerId === user.id && (
                    <div className="flex items-center gap-2 text-xs">
                      <button
                        onClick={() => setIsCreateSpaceOpen(true)}
                        className="hover:text-[#111827] font-extrabold text-base px-1 flex items-center justify-center"
                        title="Tạo Space mới"
                      >
                        +
                      </button>
                      <button
                        onClick={handleOpenEditSpace}
                        className="hover:text-[#111827] text-sm font-bold flex items-center justify-center"
                        title="Cài đặt Space"
                      >
                        ···
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-1 font-sans">
                  {spaces.map((space) => {
                    const initials = space.name.substring(0, 2).toUpperCase();
                    const colors = [
                      { bg: "bg-[#E6F4EA]", text: "text-[#137333]" },
                      { bg: "bg-[#E8F0FE]", text: "text-[#1A73E8]" },
                      { bg: "bg-[#FCE8E6]", text: "text-[#C5221F]" },
                      { bg: "bg-[#FEF7E0]", text: "text-[#B06000]" },
                    ];
                    const color = colors[space.id % colors.length] || colors[0];
                    const isActive = pathname === `/workspaces/${activeWorkspaceId}/spaces/${space.id}`;

                    return (
                      <Link
                        key={space.id}
                        href={`/workspaces/${activeWorkspaceId}/spaces/${space.id}`}
                        className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                          isActive
                            ? "bg-white text-[#111827] border border-[#E5E7EB] shadow-sm scale-[1.01]"
                            : "text-[#4B5563] hover:bg-white/60 hover:text-[#111827]"
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-lg ${color.bg} flex items-center justify-center ${color.text} font-mono font-bold text-[10px]`}>
                          {initials}
                        </div>
                        <span className="truncate">{space.name}</span>
                      </Link>
                    );
                  })}

                  {spaces.length === 0 && (
                    <p className="px-4 py-2 text-xs text-[#6B7280] italic">
                      Chưa có Space nào.
                    </p>
                  )}

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
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Floating Sidebar Restore Button when Collapsed */}
        {isSidebarCollapsed && (
          <button
            onClick={() => setIsSidebarCollapsed(false)}
            className="fixed top-4 left-4 z-40 flex items-center gap-2 px-3.5 py-2 bg-[#111827] text-white hover:bg-black rounded-xl shadow-lg border border-gray-700 text-xs font-bold transition-all cursor-pointer animate-in zoom-in-95"
            title="Mở thanh Sidebar Menu"
          >
            <PanelLeftOpen className="w-4 h-4 text-[#10B981]" />
            <span>Mở Menu Sidebar</span>
          </button>
        )}
        <main className="flex-1 p-6 md:p-10 overflow-y-auto">{children}</main>
      </div>
      {/* Create Space Modal */}
      {isCreateSpaceOpen && (
        <div className="fixed inset-0 bg-[#111827]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#F6F5EF] border border-[#E5E7EB] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#111827] font-mono uppercase tracking-wider">
                Tạo Space mới
              </h3>
              <button
                onClick={() => {
                  setIsCreateSpaceOpen(false);
                  setCreateSpaceError("");
                }}
                className="text-[#6B7280] hover:text-[#111827] text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {createSpaceError && (
              <div className="bg-[#FDEDEC] border border-[#FADBD8] text-[#D93025] px-4 py-2.5 rounded-xl text-xs font-medium">
                {createSpaceError}
              </div>
            )}

            <form onSubmit={handleCreateSpace} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#4B5563] uppercase tracking-wider font-mono">
                  Tên Space
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nhập tên Space..."
                  value={newSpaceName}
                  onChange={(e) => setNewSpaceName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#111827] placeholder:text-[#9CA3AF] transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#4B5563] uppercase tracking-wider font-mono">
                    Ngày bắt đầu
                  </label>
                  <input
                    type="date"
                    value={newSpaceStartDate}
                    onChange={(e) => setNewSpaceStartDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#111827] transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#4B5563] uppercase tracking-wider font-mono">
                    Ngày kết thúc
                  </label>
                  <input
                    type="date"
                    value={newSpaceEndDate}
                    onChange={(e) => setNewSpaceEndDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#111827] transition-colors"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateSpaceOpen(false);
                    setCreateSpaceError("");
                  }}
                  className="flex-1 py-2.5 bg-white hover:bg-gray-100 border border-[#E5E7EB] text-[#4B5563] rounded-xl text-xs font-mono font-bold transition-colors"
                >
                  HỦY
                </button>
                <button
                  type="submit"
                  disabled={createSpaceLoading}
                  className="flex-1 py-2.5 bg-[#111827] hover:bg-black text-white rounded-xl text-xs font-mono font-bold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {createSpaceLoading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  TẠO MỚI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Space Modal */}
      {isEditSpaceOpen && (
        <div className="fixed inset-0 bg-[#111827]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#F6F5EF] border border-[#E5E7EB] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#111827] font-mono uppercase tracking-wider">
                Cài đặt Space
              </h3>
              <button
                onClick={() => {
                  setIsEditSpaceOpen(false);
                  setEditSpaceError("");
                }}
                className="text-[#6B7280] hover:text-[#111827] text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {editSpaceError && (
              <div className="bg-[#FDEDEC] border border-[#FADBD8] text-[#D93025] px-4 py-2.5 rounded-xl text-xs font-medium">
                {editSpaceError}
              </div>
            )}

            <form onSubmit={handleEditSpaceSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#4B5563] uppercase tracking-wider font-mono">
                  Tên Space
                </label>
                <input
                  type="text"
                  required
                  value={editSpaceName}
                  onChange={(e) => setEditSpaceName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#111827] transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#4B5563] uppercase tracking-wider font-mono">
                    Ngày bắt đầu
                  </label>
                  <input
                    type="date"
                    value={editSpaceStartDate}
                    onChange={(e) => setEditSpaceStartDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#111827] transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#4B5563] uppercase tracking-wider font-mono">
                    Ngày kết thúc
                  </label>
                  <input
                    type="date"
                    value={editSpaceEndDate}
                    onChange={(e) => setEditSpaceEndDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#111827] transition-colors"
                  />
                </div>
              </div>

              {/* Danger Zone */}
              <div className="pt-4 border-t border-[#E5E7EB] space-y-2">
                <p className="text-[11px] font-bold text-[#D93025] uppercase tracking-wider font-mono">Vùng nguy hiểm</p>
                <button
                  type="button"
                  onClick={handleDeleteSpaceSubmit}
                  disabled={editSpaceLoading}
                  className="w-full py-2.5 border border-[#FADBD8] hover:bg-[#FDEDEC] text-[#D93025] rounded-xl text-xs font-mono font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  XÓA SPACE NÀY
                </button>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditSpaceOpen(false);
                    setEditSpaceError("");
                  }}
                  className="flex-1 py-2.5 bg-white hover:bg-gray-100 border border-[#E5E7EB] text-[#4B5563] rounded-xl text-xs font-mono font-bold transition-colors"
                >
                  HỦY
                </button>
                <button
                  type="submit"
                  disabled={editSpaceLoading}
                  className="flex-1 py-2.5 bg-[#111827] hover:bg-black text-white rounded-xl text-xs font-mono font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  {editSpaceLoading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  LƯU THAY ĐỔI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
