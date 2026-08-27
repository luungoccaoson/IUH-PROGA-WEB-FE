"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Calendar, Settings, History, ListTodo, KanbanSquare, UserPlus } from "lucide-react";
import { Space, Workspace } from "@/types";

export type TabType = "overview" | "tasks" | "kanban" | "timeline";

interface SpaceHeaderProps {
  workspaceId: number;
  workspaceName?: string;
  space: Space;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenSettings: () => void;
  onOpenCopilot?: () => void;
  onOpenAddMember?: () => void;
  isOwner?: boolean;
}

export function SpaceHeader({
  workspaceId,
  workspaceName,
  space,
  activeTab,
  setActiveTab,
  onOpenSettings,
  onOpenCopilot,
  onOpenAddMember,
  isOwner = true,
}: SpaceHeaderProps) {
  const router = useRouter();

  return (
    <div className="space-y-6 font-sans">
      {/* Path Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-xs text-[#6B7280] font-mono">
        <span className="hover:underline cursor-pointer" onClick={() => router.push("/workspaces")}>
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
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E6F4EA] flex items-center justify-center text-[#137333] font-mono font-bold text-xs border border-[#D1E7DD]">
              {space.name.substring(0, 2).toUpperCase()}
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#111827]">
              {space.name}
            </h1>
          </div>
          {space.startDate && (
            <p className="text-xs text-[#6B7280] flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Thời gian: {new Date(space.startDate).toLocaleDateString("vi-VN")} -{" "}
              {space.endDate ? new Date(space.endDate).toLocaleDateString("vi-VN") : "Không xác định"}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Add Space Member Button */}
          {onOpenAddMember && (
            <button
              onClick={onOpenAddMember}
              className="flex items-center gap-1.5 px-3.5 py-2 border border-[#E5E7EB] bg-white hover:bg-gray-50 rounded-xl text-xs font-bold text-[#111827] transition-colors shadow-2xs cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-[#1A73E8]" />
              <span>Thêm thành viên</span>
            </button>
          )}

          {/* AI Project Co-Pilot Button */}
          <button
            onClick={() => {
              if (onOpenCopilot) onOpenCopilot();
              else router.push(`/workspaces/${workspaceId}/ai-analysis`);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-[#111827] to-[#1F2937] hover:from-black hover:to-[#111827] text-white border border-gray-700 rounded-xl text-xs font-extrabold transition-all shadow-xs cursor-pointer"
          >
            <span>🤖 AI phân rã task</span>
          </button>

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
          className={`flex items-center gap-2 px-4 py-3 border-b-2 -mb-px transition-all ${activeTab === "overview"
            ? "border-[#111827] text-[#111827]"
            : "border-transparent hover:text-[#111827]"
            }`}
        >
          <History className="w-4 h-4" />
          Tổng quan
        </button>
        <button
          onClick={() => setActiveTab("tasks")}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 -mb-px transition-all ${activeTab === "tasks"
            ? "border-[#111827] text-[#111827]"
            : "border-transparent hover:text-[#111827]"
            }`}
        >
          <ListTodo className="w-4 h-4" />
          Danh sách task
        </button>
        <button
          onClick={() => setActiveTab("kanban")}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 -mb-px transition-all ${activeTab === "kanban"
            ? "border-[#111827] text-[#111827]"
            : "border-transparent hover:text-[#111827]"
            }`}
        >
          <KanbanSquare className="w-4 h-4" />
          Bảng kanban
        </button>
        <button
          onClick={() => setActiveTab("timeline")}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 -mb-px transition-all ${activeTab === "timeline"
            ? "border-[#111827] text-[#111827]"
            : "border-transparent hover:text-[#111827]"
            }`}
        >
          <Calendar className="w-4 h-4" />
          Lộ trình thời gian
        </button>
      </div>
    </div>
  );
}
