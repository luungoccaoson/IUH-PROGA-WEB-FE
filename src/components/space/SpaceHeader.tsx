"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  Calendar,
  Settings,
  History,
  ListTodo,
  KanbanSquare,
  UserPlus,
  Users,
  Trash2,
  ShieldCheck,
  UserCheck,
  Sparkles,
  Crown,
} from "lucide-react";
import { Space } from "@/types";
import { SpaceRoleType } from "@/utils/roleAssignment";

export type TabType = "overview" | "tasks" | "kanban" | "timeline" | "members";

interface SpaceHeaderProps {
  workspaceId: number;
  workspaceName?: string;
  space: Space;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenSettings: () => void;
  onOpenCopilot?: () => void;
  onOpenAddMember?: () => void;
  onOpenTrash?: () => void;
  isOwner?: boolean;
  isLeadPM?: boolean;
  spaceRole?: SpaceRoleType;
}

export function SpaceHeader({
  workspaceId,
  workspaceName,
  space,
  activeTab,
  setActiveTab,
  onOpenSettings,
  onOpenAddMember,
  onOpenTrash,
  isOwner = true,
  isLeadPM = false,
  spaceRole = "PM",
}: SpaceHeaderProps) {
  const router = useRouter();

  const renderRoleBadge = () => {
    if (isLeadPM) {
      return (
        <span
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-300 font-mono text-[10px] font-extrabold uppercase tracking-wider"
          title="Người tạo Space (Lead PM): Toàn quyền quản trị Space, phân quyền và duyệt hoàn thành (DONE) mọi công việc"
        >
          <Crown className="w-3 h-3 text-amber-600" />
          Lead PM
        </span>
      );
    }
    if (spaceRole === "PM") {
      return (
        <span
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-mono text-[10px] font-extrabold uppercase tracking-wider"
          title="PM Phụ trách chuyên môn: Hỗ trợ quản lý và có quyền bấm Duyệt hoàn thành (DONE) công việc"
        >
          <ShieldCheck className="w-3 h-3 text-amber-600" />
          Role: PM Phụ trách
        </span>
      );
    }
    if (spaceRole === "ASSISTANT") {
      return (
        <span
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200 font-mono text-[10px] font-extrabold uppercase tracking-wider"
          title="Trợ lý điều phối (ASSISTANT): Hỗ trợ AI phân rã nháp, chỉnh sửa deadline, sắp xếp Kanban (Không có quyền chốt DONE hoặc xóa dữ liệu)"
        >
          <Sparkles className="w-3 h-3 text-purple-600" />
          Role: ASSISTANT (Trợ lý điều phối)
        </span>
      );
    }
    return (
      <span
        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-mono text-[10px] font-extrabold uppercase tracking-wider"
        title="Thành viên (MEMBER): Tự nhận việc trống, tạo task cá nhân, cập nhật tiến độ (TODO -> IN_PROGRESS) và chờ PM duyệt DONE"
      >
        <UserCheck className="w-3 h-3 text-blue-600" />
        Role: MEMBER (Thực thi)
      </span>
    );
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Path Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-xs text-[#6B7280] font-mono">
        <span
          className="hover:underline cursor-pointer"
          onClick={() => router.push("/workspaces")}
        >
          workspaces
        </span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span
          className="hover:underline cursor-pointer"
          onClick={() => router.push(`/workspaces/${workspaceId}`)}
        >
          {workspaceName || "Workspace"}
        </span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-[#111827] font-bold">Space: {space.name}</span>
      </div>

      {/* Title Header bar */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-8 h-8 rounded-xl bg-[#E6F4EA] flex items-center justify-center text-[#137333] font-mono font-bold text-xs border border-[#D1E7DD]">
              {space.name.substring(0, 2).toUpperCase()}
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#111827]">
              {space.name}
            </h1>
            {renderRoleBadge()}
          </div>
          {space.startDate && (
            <p className="text-xs text-[#6B7280] flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Thời gian: {new Date(space.startDate).toLocaleDateString(
                "vi-VN",
              )}{" "}
              -{" "}
              {space.endDate
                ? new Date(space.endDate).toLocaleDateString("vi-VN")
                : "Không xác định"}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Add Space Member Button - Chỉ dành cho PM */}
          {isOwner && onOpenAddMember && (
            <button
              onClick={onOpenAddMember}
              className="flex items-center gap-1.5 px-3 py-2 border border-[#E5E7EB] bg-white hover:bg-gray-50 rounded-xl text-xs font-bold text-[#111827] transition-colors shadow-2xs cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-[#1A73E8]" />
              <span>Thêm thành viên</span>
            </button>
          )}

          {/* Trash Button (Soft-Deleted Tasks) - Chỉ dành cho PM */}
          {isOwner && onOpenTrash && (
            <button
              onClick={onOpenTrash}
              className="flex items-center gap-1.5 px-3 py-2 border border-[#E5E7EB] bg-white hover:bg-red-50 hover:border-red-200 rounded-xl text-xs font-bold text-[#4B5563] hover:text-[#DC2626] transition-colors shadow-2xs cursor-pointer"
              title="Thùng rác công việc"
            >
              <Trash2 className="w-4 h-4 text-[#EF4444]" />
              <span>Thùng rác</span>
            </button>
          )}

          {isOwner && (
            <button
              onClick={onOpenSettings}
              className="p-2 border border-[#E5E7EB] bg-white hover:bg-gray-50 rounded-xl text-[#4B5563] transition-colors shadow-2xs cursor-pointer"
              title="Cài đặt Space"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Horizontal Tabs */}
      <div className="flex items-center gap-1 border-b border-[#E5E7EB] font-mono text-xs font-bold uppercase tracking-wider text-[#6B7280]">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 -mb-px transition-all ${
            activeTab === "overview"
              ? "border-[#111827] text-[#111827]"
              : "border-transparent hover:text-[#111827]"
          }`}
        >
          <History className="w-4 h-4" />
          Tổng quan
        </button>
        <button
          onClick={() => setActiveTab("tasks")}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 -mb-px transition-all ${
            activeTab === "tasks"
              ? "border-[#111827] text-[#111827]"
              : "border-transparent hover:text-[#111827]"
          }`}
        >
          <ListTodo className="w-4 h-4" />
          Danh sách task
        </button>
        <button
          onClick={() => setActiveTab("kanban")}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 -mb-px transition-all ${
            activeTab === "kanban"
              ? "border-[#111827] text-[#111827]"
              : "border-transparent hover:text-[#111827]"
          }`}
        >
          <KanbanSquare className="w-4 h-4" />
          Bảng kanban
        </button>
        <button
          onClick={() => setActiveTab("timeline")}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 -mb-px transition-all ${
            activeTab === "timeline"
              ? "border-[#111827] text-[#111827]"
              : "border-transparent hover:text-[#111827]"
          }`}
        >
          <Calendar className="w-4 h-4" />
          Lộ trình thời gian
        </button>
        <button
          onClick={() => setActiveTab("members")}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 -mb-px transition-all ${
            activeTab === "members"
              ? "border-[#111827] text-[#111827]"
              : "border-transparent hover:text-[#111827]"
          }`}
        >
          <Users className="w-4 h-4" />
          Thành viên Space
        </button>
      </div>
    </div>
  );
}
