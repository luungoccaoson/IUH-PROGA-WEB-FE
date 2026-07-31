"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, MoreHorizontal, Sparkles, Folder, Calendar, Lock, Globe, ShieldAlert } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { workspaceService } from "@/services/workspace.service";
import { Workspace, Space } from "@/types";

export default function WorkspaceDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const workspaceId = parseInt(params.id as string, 10);

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create Space Modal State
  const [showCreateSpaceModal, setShowCreateSpaceModal] = useState(false);
  const [spaceName, setSpaceName] = useState("");
  const [spaceStartDate, setSpaceStartDate] = useState("");
  const [spaceEndDate, setSpaceEndDate] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  const isOwner = user?.id && workspace?.ownerId === user.id;

  const fetchWorkspaceDetails = async () => {
    if (!workspaceId) return;
    try {
      setLoading(true);
      setError("");
      const wsData = await workspaceService.getWorkspaceById(workspaceId);
      setWorkspace(wsData);

      const spacesList = await workspaceService.getSpacesByWorkspace(workspaceId);
      setSpaces(spacesList);
    } catch (err: any) {
      console.error("Error fetching workspace details:", err);
      setError("Không thể tải thông tin workspace.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaceDetails();
  }, [workspaceId]);

  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spaceName.trim() || !isOwner) return;

    try {
      setCreateLoading(true);
      setCreateError("");
      const newSpace = await workspaceService.createSpace({
        workspaceId,
        name: spaceName.trim(),
        startDate: spaceStartDate ? `${spaceStartDate}T00:00:00` : undefined,
        endDate: spaceEndDate ? `${spaceEndDate}T23:59:59` : undefined,
        isPrivate,
      });

      setSpaces([...spaces, newSpace]);
      setShowCreateSpaceModal(false);
      setSpaceName("");
      setSpaceStartDate("");
      setSpaceEndDate("");
      setIsPrivate(false);

      // Force reload sidebar
      setTimeout(() => {
        window.location.reload();
      }, 300);
    } catch (err: any) {
      setCreateError(err.response?.data?.message || "Không thể tạo Space mới.");
    } finally {
      setCreateLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[#6B7280]">
        <Sparkles className="w-8 h-8 text-[#111827] animate-spin mb-3" />
        <p className="font-mono text-xs uppercase tracking-wider">Đang tải thông tin workspace...</p>
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="bg-[#FDEDEC] border border-[#FADBD8] text-[#D93025] p-6 rounded-2xl max-w-xl mx-auto text-center space-y-4 font-sans">
        <p className="font-bold">{error || "Không tìm thấy Workspace."}</p>
        <button
          onClick={() => router.push("/workspaces")}
          className="px-4 py-2 bg-[#111827] text-white rounded-xl text-sm font-bold"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-8 animate-in fade-in duration-300 font-sans">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-[#6B7280] font-mono font-bold flex items-center gap-1">
            Workspace Dashboard
            {!isOwner && (
              <span className="px-2 py-0.5 rounded-full bg-[#E8F0FE] text-[#1A73E8] font-mono text-[9px]">
                Thành viên
              </span>
            )}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] mt-1">
            {workspace.name}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Create Space Button - Only enabled for Workspace Owner */}
          {isOwner ? (
            <button
              onClick={() => {
                setSpaceName("");
                setSpaceStartDate("");
                setSpaceEndDate("");
                setIsPrivate(false);
                setShowCreateSpaceModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-[#111827] text-white hover:bg-[#1F2937] font-bold text-sm shadow-md transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Space mới</span>
            </button>
          ) : (
            <div
              title="Chỉ Chủ sở hữu Workspace mới có quyền tạo Space mới"
              className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-400 font-bold text-sm flex items-center gap-1.5 cursor-not-allowed border border-gray-200"
            >
              <ShieldAlert className="w-4 h-4 text-gray-400" />
              <span>Tạo Space mới</span>
            </div>
          )}
        </div>
      </div>

      {/* Description Panel */}
      {workspace.description && (
        <div className="bg-[#F6F5EF] p-6 rounded-2xl border border-[#E5E7EB] shadow-2xs">
          <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#6B7280] mb-2">
            Mô tả workspace
          </p>
          <p className="text-sm text-[#4B5563] leading-relaxed">
            {workspace.description}
          </p>
        </div>
      )}

      {/* Workspace metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#F6F5EF] p-5 rounded-2xl border border-[#E5E7EB] space-y-2 shadow-2xs">
          <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#6B7280]">
            TỔNG SPACES
          </p>
          <p className="text-3xl font-extrabold text-[#111827] font-sans">
            {spaces.length}
          </p>
          <p className="text-xs text-[#4B5563] font-medium">Không gian làm việc</p>
        </div>

        <div className="bg-[#F6F5EF] p-5 rounded-2xl border border-[#E5E7EB] space-y-2 shadow-2xs">
          <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#6B7280]">
            VAI TRÒ CỦA BẠN
          </p>
          <p className="text-xl font-extrabold text-[#137333] font-sans uppercase">
            {isOwner ? "Chủ sở hữu" : "Thành viên"}
          </p>
          <p className="text-xs text-[#4B5563] font-medium">Quyền hạn trong hệ thống</p>
        </div>

        <div className="bg-[#F6F5EF] p-5 rounded-2xl border border-[#E5E7EB] space-y-2 shadow-2xs">
          <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#6B7280]">
            SPACES CÔNG KHAI
          </p>
          <p className="text-3xl font-extrabold text-[#1A73E8] font-sans">
            {spaces.filter((s) => !s.isPrivate).length}
          </p>
          <p className="text-xs text-[#4B5563] font-medium">Public Spaces</p>
        </div>

        <div className="bg-[#F6F5EF] p-5 rounded-2xl border border-[#E5E7EB] space-y-2 shadow-2xs">
          <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#6B7280]">
            SPACES RIÊNG TƯ
          </p>
          <p className="text-3xl font-extrabold text-[#B06000] font-sans">
            {spaces.filter((s) => s.isPrivate).length}
          </p>
          <p className="text-xs text-[#4B5563] font-medium">Private Spaces</p>
        </div>
      </div>

      {/* List of Spaces in this Workspace */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-[#111827] uppercase tracking-wider font-mono">
            Danh sách Spaces trong Workspace
          </h2>
        </div>

        {spaces.length === 0 ? (
          <div className="bg-white border border-dashed border-[#E5E7EB] p-8 rounded-2xl text-center text-sm text-[#6B7280]">
            Chưa có Space nào trong Workspace này.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {spaces.map((s) => (
              <div
                key={s.id}
                onClick={() => router.push(`/workspaces/${workspaceId}/spaces/${s.id}`)}
                className="bg-white p-5 rounded-2xl border border-[#E5E7EB] hover:border-[#111827] cursor-pointer shadow-2xs hover:shadow-md transition-all group space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-[#E6F4EA] flex items-center justify-center text-[#137333] font-mono font-bold text-xs border border-[#D1E7DD]">
                      {s.name.substring(0, 2).toUpperCase()}
                    </div>

                    {/* Privacy Badge */}
                    {s.isPrivate ? (
                      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-mono font-bold">
                        <Lock className="w-3 h-3" /> Private
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold">
                        <Globe className="w-3 h-3" /> Public
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-extrabold text-[#111827] group-hover:text-[#137333] transition-colors">
                    {s.name}
                  </h3>
                </div>

                <div className="pt-3 border-t border-[#F6F5EF] flex items-center justify-between text-[10px] font-mono text-[#6B7280]">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {s.startDate ? new Date(s.startDate).toLocaleDateString("vi-VN") : "Chưa chọn"}
                  </span>
                  <span className="font-bold text-[#111827] group-hover:underline">Vào Space →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE SPACE MODAL */}
      {showCreateSpaceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200 font-sans">
          <div className="w-full max-w-md bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-[#111827]">Tạo Space mới</h3>

            {createError && (
              <div className="bg-[#FDEDEC] border border-[#FADBD8] text-[#D93025] p-3 rounded-xl text-xs font-bold">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateSpace} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[#111827] font-mono uppercase tracking-wider text-[11px]">
                  Tên Space <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Development Space"
                  value={spaceName}
                  onChange={(e) => setSpaceName(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#111827] bg-[#F6F5EF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#111827] font-mono uppercase tracking-wider text-[11px]">
                    Ngày bắt đầu
                  </label>
                  <input
                    type="date"
                    value={spaceStartDate}
                    onChange={(e) => setSpaceStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#111827] bg-[#F6F5EF]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-[#111827] font-mono uppercase tracking-wider text-[11px]">
                    Ngày kết thúc
                  </label>
                  <input
                    type="date"
                    value={spaceEndDate}
                    onChange={(e) => setSpaceEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#111827] bg-[#F6F5EF]"
                  />
                </div>
              </div>

              {/* Privacy Radio / Toggle */}
              <div className="space-y-2 pt-1 border-t border-[#E5E7EB]">
                <label className="font-bold text-[#111827] font-mono uppercase tracking-wider text-[11px]">
                  Quyền riêng tư của Space
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPrivate(false)}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between space-y-1 transition-all ${
                      !isPrivate
                        ? "border-[#137333] bg-[#E6F4EA]/40 text-[#137333] font-bold"
                        : "border-[#E5E7EB] hover:bg-gray-50 text-[#6B7280]"
                    }`}
                  >
                    <span className="flex items-center gap-1 font-bold text-xs">
                      <Globe className="w-3.5 h-3.5" /> Public
                    </span>
                    <span className="text-[10px] leading-tight opacity-80 font-normal">
                      Tất cả thành viên trong Workspace đều xem được
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPrivate(true)}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between space-y-1 transition-all ${
                      isPrivate
                        ? "border-amber-600 bg-amber-50 text-amber-800 font-bold"
                        : "border-[#E5E7EB] hover:bg-gray-50 text-[#6B7280]"
                    }`}
                  >
                    <span className="flex items-center gap-1 font-bold text-xs">
                      <Lock className="w-3.5 h-3.5" /> Private
                    </span>
                    <span className="text-[10px] leading-tight opacity-80 font-normal">
                      Chỉ những ai được đích danh mời mới truy cập được
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setShowCreateSpaceModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#E5E7EB] hover:bg-[#F6F5EF] text-xs font-semibold text-[#4B5563]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 rounded-xl bg-[#111827] hover:bg-[#1F2937] text-white text-xs font-bold shadow-md disabled:opacity-50"
                >
                  {createLoading ? "Đang tạo..." : "Tạo Space mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
