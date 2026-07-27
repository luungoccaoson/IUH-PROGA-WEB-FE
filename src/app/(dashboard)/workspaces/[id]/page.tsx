"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, MoreHorizontal, Sparkles, Folder, Calendar } from "lucide-react";
import { workspaceService } from "@/services/workspace.service";
import { Workspace } from "@/types";

export default function WorkspaceDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.id as string;
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!workspaceId) return;

    const fetchWorkspaceDetails = async () => {
      try {
        setLoading(true);
        const data = await workspaceService.getWorkspaceById(parseInt(workspaceId, 10));
        setWorkspace(data);
      } catch (err: any) {
        console.error("Error fetching workspace details:", err);
        setError("Không thể tải thông tin workspace.");
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspaceDetails();
  }, [workspaceId]);

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
      <div className="bg-[#FDEDEC] border border-[#FADBD8] text-[#D93025] p-6 rounded-2xl max-w-xl mx-auto text-center space-y-4">
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
    <div className="max-w-6xl space-y-8 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-[#6B7280] font-mono font-bold">
            Workspace Dashboard
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] font-sans mt-1">
            {workspace.name}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button className="p-2 text-[#6B7280] hover:text-[#111827]">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Description Panel */}
      {workspace.description && (
        <div className="bg-[#F6F5EF] p-6 rounded-2xl border border-[#E5E7EB] shadow-sm">
          <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#6B7280] mb-2">
            Mô tả workspace
          </p>
          <p className="text-sm text-[#4B5563] leading-relaxed">
            {workspace.description}
          </p>
        </div>
      )}

      {/* Workspace mock metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#F6F5EF] p-5 rounded-2xl border border-[#E5E7EB] space-y-2 shadow-sm">
          <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#6B7280]">
            TỔNG SPACES
          </p>
          <p className="text-3xl font-extrabold text-[#111827] font-sans">
            4
          </p>
          <p className="text-xs text-[#4B5563] font-medium">
            Phân khu dự án
          </p>
        </div>

        <div className="bg-[#F6F5EF] p-5 rounded-2xl border border-[#E5E7EB] space-y-2 shadow-sm">
          <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#6B7280]">
            THÀNH VIÊN
          </p>
          <p className="text-3xl font-extrabold text-[#137333] font-sans">
            5
          </p>
          <p className="text-xs text-[#4B5563] font-medium">
            Đang tham gia
          </p>
        </div>

        <div className="bg-[#F6F5EF] p-5 rounded-2xl border border-[#E5E7EB] space-y-2 shadow-sm">
          <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#6B7280]">
            CÔNG VIỆC AI
          </p>
          <p className="text-3xl font-extrabold text-[#D93025] font-sans">
            12
          </p>
          <p className="text-xs text-[#4B5563] font-medium">
            Đang xử lý
          </p>
        </div>

        <div className="bg-[#F6F5EF] p-5 rounded-2xl border border-[#E5E7EB] space-y-2 shadow-sm">
          <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#6B7280]">
            TIẾN ĐỘ CHUNG
          </p>
          <p className="text-3xl font-extrabold text-[#111827] font-sans">
            68%
          </p>
          <p className="text-xs text-[#4B5563] font-medium">
            Hoàn thành
          </p>
        </div>
      </div>

      {/* Main Workspace content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {/* Info panel */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-4">
            <h3 className="text-base font-bold text-[#111827]">Tổng quan hoạt động</h3>
            <p className="text-sm text-[#6B7280]">
              Chào mừng bạn đến với **{workspace.name}**. Hãy chọn các không gian làm việc (Spaces) trong Sidebar bên trái để quản lý và theo dõi các công việc chi tiết.
            </p>
            <div className="pt-4 border-t border-[#F6F5EF] flex items-center justify-between text-xs text-[#6B7280] font-mono">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                Ngày tạo: {new Date(workspace.createdAt).toLocaleDateString("vi-VN")}
              </span>
              <span className="px-2 py-0.5 rounded bg-[#F6F5EF] border border-[#E5E7EB] font-bold">
                ID: {workspace.id}
              </span>
            </div>
          </div>
        </div>

        {/* Sidebar list of spaces */}
        <div className="bg-[#F6F5EF] p-6 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-4 h-fit">
          <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider font-mono">Spaces của Workspace</h3>
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-[#E5E7EB] shadow-sm hover:scale-[1.02] transition-transform cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-[#E6F4EA] flex items-center justify-center text-[#137333]">
                <Folder className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#111827]">PROGA Core Development</p>
                <p className="text-[10px] text-[#6B7280]">Active space</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-[#E5E7EB] shadow-sm hover:scale-[1.02] transition-transform cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-[#E8F0FE] flex items-center justify-center text-[#1A73E8]">
                <Folder className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#111827]">Testing & Quality Assurance</p>
                <p className="text-[10px] text-[#6B7280]">Sprint 2</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-[#E5E7EB] shadow-sm hover:scale-[1.02] transition-transform cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-[#FEEFC3] flex items-center justify-center text-[#B06000]">
                <Folder className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#111827]">AI Integration Agent</p>
                <p className="text-[10px] text-[#6B7280]">Research phase</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
