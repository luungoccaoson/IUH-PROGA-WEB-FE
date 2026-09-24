"use client";

import React, { useState } from "react";
import {
  Compass,
  GitBranch,
  FileText,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Clock,
  CircleDot,
  AlertTriangle,
  User as UserIcon,
  Layers,
  Database,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { Space, Task, Sprint } from "@/types";

interface SpaceMindmapOverviewProps {
  space?: Space | null;
  tasks: Task[];
  sprints?: Sprint[];
  members?: any[];
  currentUser?: any;
  onSelectTask?: (task: Task) => void;
  onViewTasks?: () => void;
}

type ViewMode = "journey" | "mindmap" | "srs";

export function SpaceMindmapOverview({
  space,
  tasks,
  sprints = [],
  members = [],
  currentUser,
  onSelectTask,
  onViewTasks,
}: SpaceMindmapOverviewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("journey");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [expandedSprints, setExpandedSprints] = useState<Record<number, boolean>>({});

  // Current user matching: by ID or email
  const currentUserId = currentUser?.id;
  const currentUserEmail = currentUser?.email?.toLowerCase();

  // My Tasks classification
  const myTasks = tasks.filter((t) => {
    if (t.assignee?.id && currentUserId && t.assignee.id === currentUserId) return true;
    if (t.ownerId && currentUserId && t.ownerId === currentUserId) return true;
    if (t.assignee?.email && currentUserEmail && t.assignee.email.toLowerCase() === currentUserEmail) return true;
    return false;
  });

  const myDoneTasks = myTasks.filter((t) => t.status === "DONE");
  const myInProgressTasks = myTasks.filter((t) => t.status === "IN_PROGRESS");
  const myTodoTasks = myTasks.filter((t) => t.status === "TODO");

  // Other members' current position (what are they doing right now)
  const otherMembersProgress = members
    .filter((m) => {
      const uId = m.id?.userId || m.userId || m.id;
      return uId !== currentUserId;
    })
    .map((m) => {
      const uId = m.id?.userId || m.userId || m.id;
      const uName = m.user?.fullName || m.fullName || m.user?.email || m.email || `Thành viên #${uId}`;
      const userTasks = tasks.filter((t) => t.ownerId === uId || t.assignee?.id === uId);
      const inProgress = userTasks.filter((t) => t.status === "IN_PROGRESS");
      const done = userTasks.filter((t) => t.status === "DONE");
      return {
        id: uId,
        name: uName,
        avatarUrl: m.avatarUrl || m.user?.avatarUrl,
        inProgressTasks: inProgress,
        doneCount: done.length,
        totalCount: userTasks.length,
      };
    });

  // Space risks and health calculation
  const totalTasks = tasks.length || 1;
  const doneTasks = tasks.filter((t) => t.status === "DONE").length;
  const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const overallProgressPercent = Math.round((doneTasks / totalTasks) * 100);

  // Overdue / High risk tasks
  const today = new Date().toISOString().split("T")[0];
  const riskyTasks = tasks.filter((t) => {
    const isOverdue = t.status !== "DONE" && t.dueDate && t.dueDate < today;
    const hasRisk = !!t.riskWarning;
    const isUrgentPending = t.priority === "URGENT" && t.status !== "DONE";
    return isOverdue || hasRisk || isUrgentPending;
  });

  // Group tasks by Sprint for the Mindmap view
  const tasksBySprint: { sprint: Sprint | null; sprintTasks: Task[] }[] = [];
  
  // Real sprints
  sprints.forEach((sp) => {
    tasksBySprint.push({
      sprint: sp,
      sprintTasks: tasks.filter((t) => t.sprintId === sp.id),
    });
  });

  // Backlog tasks (no sprintId or not in sprints)
  const backlogTasks = tasks.filter((t) => !t.sprintId || !sprints.some((sp) => sp.id === t.sprintId));
  if (backlogTasks.length > 0) {
    tasksBySprint.push({
      sprint: null,
      sprintTasks: backlogTasks,
    });
  }

  const toggleSprintExpand = (sprintId: number) => {
    setExpandedSprints((prev) => ({
      ...prev,
      [sprintId]: prev[sprintId] === undefined ? false : !prev[sprintId],
    }));
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#FCE8E6] text-[#C5221F]">Khẩn cấp</span>;
      case "HIGH":
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#FEF7E0] text-[#B06000]">Cao</span>;
      case "MEDIUM":
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#E8F0FE] text-[#1A73E8]">Trung bình</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#F1F3F4] text-[#5F6368]">Thấp</span>;
    }
  };

  const containerClasses = isFullscreen
    ? "fixed inset-4 z-50 bg-white border border-[#D1D5DB] rounded-2xl shadow-2xl overflow-y-auto p-6 flex flex-col"
    : "bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-2xs space-y-5";

  return (
    <div className={containerClasses}>
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#F3F4F6] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center border border-[#D2E3FC] shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#111827]">
                Bản đồ Không gian &amp; SRS Thu gọn
              </h2>
              <span className="px-2 py-0.5 bg-[#E6F4EA] text-[#137333] text-[11px] font-bold rounded-full border border-[#CEE7D4]">
                Theo đề cương Space
              </span>
            </div>
            <p className="text-xs text-[#6B7280]">
              Toàn cảnh dự án: Vị trí của bạn, nhịp độ đồng đội, cây phân rã chức năng và tài liệu đặc tả SRS.
            </p>
          </div>
        </div>

        {/* CONTROLS: VIEW SWITCHER + FULLSCREEN */}
        <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
          <div className="bg-[#F3F4F6] p-1 rounded-xl flex items-center gap-1 text-xs">
            <button
              onClick={() => setViewMode("journey")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                viewMode === "journey"
                  ? "bg-white text-[#1A73E8] shadow-2xs"
                  : "text-[#4B5563] hover:text-[#111827]"
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Vị trí của tôi &amp; Nhóm</span>
            </button>
            <button
              onClick={() => setViewMode("mindmap")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                viewMode === "mindmap"
                  ? "bg-white text-[#1A73E8] shadow-2xs"
                  : "text-[#4B5563] hover:text-[#111827]"
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Sơ đồ Mindmap</span>
            </button>
            <button
              onClick={() => setViewMode("srs")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                viewMode === "srs"
                  ? "bg-white text-[#1A73E8] shadow-2xs"
                  : "text-[#4B5563] hover:text-[#111827]"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Tài liệu SRS mini</span>
            </button>
          </div>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "Thu nhỏ" : "Phóng to toàn màn hình"}
            className="p-2 text-[#4B5563] hover:text-[#111827] hover:bg-[#F3F4F6] rounded-xl border border-[#E5E7EB] transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: VỊ TRÍ CỦA TÔI & ĐỒNG ĐỘI (MY JOURNEY & TEAM RADAR) */}
      {/* ========================================================================= */}
      {viewMode === "journey" && (
        <div className="space-y-6 pt-1">
          {/* SECTION A: VỊ TRÍ CỦA TÔI (MY POSITION) */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4.5 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#1A73E8] text-white flex items-center justify-center font-bold text-xs">
                  {currentUser?.fullName?.substring(0, 2).toUpperCase() || <UserIcon className="w-3.5 h-3.5" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1E293B] flex items-center gap-1.5">
                    Vị trí của bạn: <span className="text-[#1A73E8]">{currentUser?.fullName || currentUser?.email || "Bạn"}</span>
                  </h3>
                  <p className="text-[11px] text-[#64748B]">
                    Bạn có tổng cộng <span className="font-bold text-[#1E293B]">{myTasks.length}</span> công việc được giao trong Space này.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-medium">
                <span className="px-2 py-1 bg-white border border-[#E2E8F0] rounded-lg text-[#16A34A] font-bold">
                  {myDoneTasks.length} Đã xong
                </span>
                <span className="px-2 py-1 bg-white border border-[#E2E8F0] rounded-lg text-[#2563EB] font-bold">
                  {myInProgressTasks.length} Đang làm
                </span>
                <span className="px-2 py-1 bg-white border border-[#E2E8F0] rounded-lg text-[#9333EA] font-bold">
                  {myTodoTasks.length} Cần làm
                </span>
              </div>
            </div>

            {/* 3 STEPS CARDS: ĐÃ LÀM ➔ ĐANG LÀM ➔ SẼ LÀM */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* CỘT 1: ĐÃ HOÀN THÀNH */}
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#15803D] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                    Đã hoàn thành ({myDoneTasks.length})
                  </span>
                  <span className="text-[10px] text-[#94A3B8]">Trước đó</span>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {myDoneTasks.length === 0 ? (
                    <p className="text-xs text-[#94A3B8] italic py-2">Chưa hoàn thành công việc nào.</p>
                  ) : (
                    myDoneTasks.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => onSelectTask && onSelectTask(t)}
                        className="p-2 rounded-lg bg-[#F0FDF4] border border-[#DCFCE7] text-xs space-y-1 hover:border-[#86EFAC] cursor-pointer transition-colors"
                      >
                        <p className="font-semibold text-[#166534] line-clamp-1">{t.title}</p>
                        <p className="text-[10px] text-[#4ADE80] font-mono">#{t.id} • {t.sprintName || "Backlog"}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* CỘT 2: ĐANG THỰC HIỆN (HIGHLIGHTED) */}
              <div className="bg-white border-2 border-[#3B82F6] rounded-xl p-3.5 space-y-2 shadow-xs ring-2 ring-[#DBEAFE]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1D4ED8] flex items-center gap-1.5">
                    <CircleDot className="w-4 h-4 text-[#3B82F6] animate-pulse" />
                    Đang làm việc này ({myInProgressTasks.length})
                  </span>
                  <span className="px-1.5 py-0.5 bg-[#EFF6FF] text-[#1D4ED8] text-[10px] font-bold rounded">Hiện tại</span>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {myInProgressTasks.length === 0 ? (
                    <p className="text-xs text-[#94A3B8] italic py-2">Hiện không có công việc nào đang làm.</p>
                  ) : (
                    myInProgressTasks.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => onSelectTask && onSelectTask(t)}
                        className="p-2.5 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-xs space-y-1.5 hover:border-[#60A5FA] cursor-pointer transition-colors"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <p className="font-bold text-[#1E40AF] line-clamp-2">{t.title}</p>
                          {getPriorityBadge(t.priority)}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-[#60A5FA]">
                          <span>Sprint: {t.sprintName || "Backlog"}</span>
                          {t.dueDate && <span className="font-mono text-[#2563EB]">Hạn: {t.dueDate}</span>}
                        </div>
                        {t.riskWarning && (
                          <p className="text-[10px] text-[#DC2626] font-medium bg-[#FEF2F2] p-1 rounded border border-[#FEE2E2] flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            {t.riskWarning}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* CỘT 3: SẮP TỚI / CẦN LÀM */}
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#7E22CE] flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#A855F7]" />
                    Sẽ làm tiếp theo ({myTodoTasks.length})
                  </span>
                  <span className="text-[10px] text-[#94A3B8]">Kế tiếp</span>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {myTodoTasks.length === 0 ? (
                    <p className="text-xs text-[#94A3B8] italic py-2">Không có công việc tồn đọng.</p>
                  ) : (
                    myTodoTasks.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => onSelectTask && onSelectTask(t)}
                        className="p-2 rounded-lg bg-[#FAF5FF] border border-[#F3E8FF] text-xs space-y-1 hover:border-[#D8B4FE] cursor-pointer transition-colors"
                      >
                        <p className="font-semibold text-[#6B21A8] line-clamp-1">{t.title}</p>
                        <div className="flex items-center justify-between text-[10px] text-[#A855F7]">
                          <span>{t.sprintName || "Backlog"}</span>
                          {getPriorityBadge(t.priority)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION B: TIẾN ĐỘ DỰ ÁN & VỊ TRÍ ĐỒNG ĐỘI (TEAM RADAR & RISKS) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* VỊ TRÍ ĐỒNG ĐỘI (TEAM RADAR) */}
            <div className="border border-[#E5E7EB] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#1A73E8]" />
                  Đồng đội đang làm việc gì? ({otherMembersProgress.length} thành viên)
                </h4>
                <span className="text-[11px] text-[#6B7280]">Real-time Team Radar</span>
              </div>

              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {otherMembersProgress.length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-4 text-center">Chưa có thành viên nào khác trong Space.</p>
                ) : (
                  otherMembersProgress.map((m) => {
                    const activeTask = m.inProgressTasks[0];
                    return (
                      <div
                        key={m.id}
                        className="p-2.5 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] flex items-start gap-2.5 text-xs"
                      >
                        <div className="w-7 h-7 rounded-full bg-[#FEF3C7] text-[#D97706] font-bold text-[10px] flex items-center justify-center shrink-0 border border-[#FDE68A]">
                          {m.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#111827] truncate">{m.name}</span>
                            <span className="text-[10px] font-mono text-[#6B7280]">
                              {m.doneCount}/{m.totalCount} xong
                            </span>
                          </div>
                          {activeTask ? (
                            <div className="flex items-center gap-1.5 text-[#1A73E8] bg-[#EFF6FF] px-2 py-1 rounded border border-[#DBEAFE]">
                              <CircleDot className="w-3 h-3 text-[#3B82F6] shrink-0" />
                              <span className="font-medium truncate">{activeTask.title}</span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-[#9CA3AF] italic">
                              Đang không có task nào ở trạng thái "Đang làm"
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* DỰ ÁN ĐANG Ở ĐÂU & CẢNH BÁO RỦI RO */}
            <div className="border border-[#E5E7EB] rounded-xl p-4 space-y-3.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-[#D93025]" />
                  Tiến độ Space &amp; Cảnh báo rủi ro
                </h4>
                <span className="text-xs font-bold text-[#1A73E8]">{overallProgressPercent}% hoàn thành</span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-[#E5E7EB] h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#10B981] h-full transition-all duration-500 rounded-full"
                  style={{ width: `${overallProgressPercent}%` }}
                />
              </div>

              {/* Metrics row */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-[#F8FAFC] p-2 rounded-lg border border-[#E2E8F0]">
                  <p className="font-bold text-[#1E293B] text-base">{totalTasks}</p>
                  <p className="text-[10px] text-[#64748B]">Tổng tasks</p>
                </div>
                <div className="bg-[#F0FDF4] p-2 rounded-lg border border-[#DCFCE7]">
                  <p className="font-bold text-[#15803D] text-base">{doneTasks}</p>
                  <p className="text-[10px] text-[#166534]">Đã xong</p>
                </div>
                <div className="bg-[#EFF6FF] p-2 rounded-lg border border-[#DBEAFE]">
                  <p className="font-bold text-[#1D4ED8] text-base">{inProgressTasks}</p>
                  <p className="text-[10px] text-[#1E40AF]">Đang triển khai</p>
                </div>
              </div>

              {/* Risky Tasks Box */}
              <div className="space-y-1.5 pt-1">
                <p className="text-[11px] font-bold text-[#B91C1C] flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Các hạng mục cần chú ý rủi ro ({riskyTasks.length}):
                </p>
                <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                  {riskyTasks.length === 0 ? (
                    <p className="text-xs text-[#15803D] italic bg-[#F0FDF4] p-1.5 rounded border border-[#DCFCE7]">
                      ✓ Không có rủi ro nghiêm trọng (không có task trễ hạn hoặc cảnh báo tắc nghẽn).
                    </p>
                  ) : (
                    riskyTasks.slice(0, 3).map((rt) => (
                      <div
                        key={rt.id}
                        className="p-1.5 rounded bg-[#FEF2F2] border border-[#FEE2E2] text-[11px] flex items-center justify-between text-[#991B1B]"
                      >
                        <span className="font-medium truncate max-w-[240px]">{rt.title}</span>
                        <span className="font-mono text-[10px] font-bold">{rt.priority}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: SƠ ĐỒ MINDMAP CẤU TRÚC (FEATURE TREE MINDMAP) */}
      {/* ========================================================================= */}
      {viewMode === "mindmap" && (
        <div className="space-y-4 pt-1">
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-xl flex items-center justify-between text-xs">
            <span className="text-[#475569] font-medium">
              Sơ đồ phân rã WBS từ Không gian ➔ Sprints ➔ Nhiệm vụ &amp; Nhân sự phụ trách.
            </span>
            <span className="text-[11px] text-[#1A73E8] font-bold">
              {tasksBySprint.length} Nhóm Sprint/Backlog • {tasks.length} Hạng mục
            </span>
          </div>

          <div className="overflow-x-auto p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl">
            {/* ROOT NODE: SPACE */}
            <div className="flex flex-col items-center space-y-4 min-w-[700px]">
              <div className="px-5 py-3 rounded-2xl bg-[#1A73E8] text-white shadow-md flex items-center gap-2.5 font-bold text-sm">
                <Sparkles className="w-4 h-4 text-[#FDE047]" />
                <span>Space: {space?.name || "Không gian làm việc"}</span>
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-mono">
                  {tasks.length} tasks
                </span>
              </div>

              {/* CONNECTOR LINE */}
              <div className="w-0.5 h-6 bg-[#CBD5E1]" />

              {/* LEVEL 1 NODES: SPRINTS */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                {tasksBySprint.map((group, idx) => {
                  const spId = group.sprint?.id || 9999 + idx;
                  const isExpanded = expandedSprints[spId] !== false; // default expanded
                  const spName = group.sprint?.name || "Product Backlog";
                  const spTasks = group.sprintTasks;
                  const spDone = spTasks.filter((t) => t.status === "DONE").length;
                  const spPercent = spTasks.length > 0 ? Math.round((spDone / spTasks.length) * 100) : 0;

                  return (
                    <div
                      key={spId}
                      className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 shadow-2xs space-y-3 flex flex-col justify-between"
                    >
                      {/* Sprint Header Node */}
                      <div
                        onClick={() => toggleSprintExpand(spId)}
                        className="flex items-center justify-between cursor-pointer pb-2 border-b border-[#F1F5F9]"
                      >
                        <div className="flex items-center gap-1.5">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-[#64748B]" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-[#64748B]" />
                          )}
                          <span className="font-bold text-xs text-[#1E293B]">{spName}</span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-[#EFF6FF] text-[#1D4ED8] rounded-full font-bold">
                          {spDone}/{spTasks.length} ({spPercent}%)
                        </span>
                      </div>

                      {/* Tasks Children Nodes */}
                      {isExpanded && (
                        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                          {spTasks.length === 0 ? (
                            <p className="text-[11px] text-[#94A3B8] italic py-2 text-center">Chưa có công việc nào</p>
                          ) : (
                            spTasks.map((t) => {
                              const statusColor =
                                t.status === "DONE"
                                  ? "border-[#86EFAC] bg-[#F0FDF4] text-[#166534]"
                                  : t.status === "IN_PROGRESS"
                                  ? "border-[#93C5FD] bg-[#EFF6FF] text-[#1E40AF]"
                                  : "border-[#E2E8F0] bg-[#F8FAFC] text-[#334155]";

                              return (
                                <div
                                  key={t.id}
                                  onClick={() => onSelectTask && onSelectTask(t)}
                                  className={`p-2 rounded-lg border text-xs space-y-1 hover:shadow-xs transition-all cursor-pointer ${statusColor}`}
                                >
                                  <div className="flex items-start justify-between gap-1">
                                    <span className="font-semibold line-clamp-1">{t.title}</span>
                                    {getPriorityBadge(t.priority)}
                                  </div>
                                  <div className="flex items-center justify-between text-[10px] text-[#64748B]">
                                    <span className="font-mono">#{t.id}</span>
                                    <span className="truncate max-w-[120px]">
                                      {t.assignee?.fullName || t.suggestedMemberName || "Chưa giao"}
                                    </span>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: TÀI LIỆU SRS THU GỌN (MINI-SRS & MASTER DATA SPECIFICATION) */}
      {/* ========================================================================= */}
      {viewMode === "srs" && (
        <div className="space-y-5 pt-1">
          {/* MỤC 1: MỤC TIÊU & PHẠM VI (SCOPE & OBJECTIVES) */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 space-y-2">
            <h3 className="text-xs font-extrabold text-[#1E293B] uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#1A73E8]" />
              1. Mục tiêu &amp; Phạm vi Quản lý Không gian (Scope &amp; Objectives)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[#334155] pt-1">
              <div className="space-y-1">
                <p><span className="font-bold text-[#1E293B]">Tên Space:</span> {space?.name}</p>
                <p><span className="font-bold text-[#1E293B]">Chế độ riêng tư:</span> {space?.isPrivate ? "Không gian Nội bộ (Private)" : "Công khai trong Workspace"}</p>
                <p><span className="font-bold text-[#1E293B]">Chu kỳ triển khai:</span> {space?.startDate || "Chưa đặt"} ➔ {space?.endDate || "Chưa đặt"}</p>
              </div>
              <div className="space-y-1">
                <p><span className="font-bold text-[#1E293B]">Mô hình áp dụng:</span> Agile / Scrum với phân rã cấu trúc công việc (WBS) &amp; Sprint Backlog.</p>
                <p><span className="font-bold text-[#1E293B]">Mục tiêu cốt lõi:</span> Giúp mọi thành viên và GVHD nắm bắt tức thời tiến độ, giảm thiểu rủi ro quá hạn và minh bạch hóa trách nhiệm từng cá nhân.</p>
              </div>
            </div>
          </div>

          {/* MỤC 2: MASTER DATA & THỰC THỂ CỐT LÕI (CORE ENTITIES) */}
          <div className="border border-[#E5E7EB] rounded-xl p-4 space-y-2.5">
            <h3 className="text-xs font-extrabold text-[#1E293B] uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-4 h-4 text-[#10B981]" />
              2. Dữ liệu Danh mục Cốt lõi (Master Data Entities)
            </h3>
            <p className="text-xs text-[#6B7280]">
              Các thực thể dữ liệu nghiệp vụ chính được quản trị và kiểm soát trong Space:
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#4B5563]">
                    <th className="py-2 px-3 font-bold">Thực thể (Entity)</th>
                    <th className="py-2 px-3 font-bold">Mô tả nghiệp vụ</th>
                    <th className="py-2 px-3 font-bold">Số lượng hiện tại</th>
                    <th className="py-2 px-3 font-bold">Thuộc tính trọng yếu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB] text-[#374151]">
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-[#1A73E8]">Sprint (Giai đoạn)</td>
                    <td className="py-2.5 px-3">Chu kỳ bàn giao công việc theo khung thời gian xác định.</td>
                    <td className="py-2.5 px-3 font-mono font-bold">{sprints.length} Sprints</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-[#6B7280]">name, goal, status, startDate, endDate</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-[#10B981]">Task (Nhiệm vụ/WBS)</td>
                    <td className="py-2.5 px-3">Hạng mục công việc kỹ thuật cần hoàn thành.</td>
                    <td className="py-2.5 px-3 font-mono font-bold">{tasks.length} Tasks</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-[#6B7280]">title, status, priority, assignee, riskWarning, dueDate</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-[#F59E0B]">Member (Thành viên)</td>
                    <td className="py-2.5 px-3">Nhân sự thực hiện và chịu trách nhiệm đầu ra công việc.</td>
                    <td className="py-2.5 px-3 font-mono font-bold">{members.length} Members</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-[#6B7280]">fullName, role, email, workloadCapacity</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* MỤC 3: MA TRẬN CHỨC NĂNG CẦN LÀM (FUNCTIONAL REQUIREMENTS MATRIX) */}
          <div className="border border-[#E5E7EB] rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-[#1E293B] uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#8B5CF6]" />
                3. Ma trận Chức năng &amp; Hạng mục Kỹ thuật phải làm
              </h3>
              <button
                onClick={onViewTasks}
                className="text-xs text-[#1A73E8] hover:underline font-semibold flex items-center gap-1"
              >
                Xem chi tiết danh sách <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="overflow-x-auto max-h-64 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#4B5563] sticky top-0 bg-white">
                    <th className="py-2 px-3 font-bold">Mã FR</th>
                    <th className="py-2 px-3 font-bold">Tên chức năng / Task</th>
                    <th className="py-2 px-3 font-bold">Giai đoạn (Sprint)</th>
                    <th className="py-2 px-3 font-bold">Độ ưu tiên</th>
                    <th className="py-2 px-3 font-bold">Người làm</th>
                    <th className="py-2 px-3 font-bold">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB] text-[#374151]">
                  {tasks.slice(0, 10).map((t, index) => (
                    <tr key={t.id} className="hover:bg-[#F9FAFB]">
                      <td className="py-2 px-3 font-mono font-bold text-[#1A73E8]">FR-{index + 1}</td>
                      <td className="py-2 px-3 font-medium">{t.title}</td>
                      <td className="py-2 px-3 text-[#6B7280]">{t.sprintName || "Backlog"}</td>
                      <td className="py-2 px-3">{getPriorityBadge(t.priority)}</td>
                      <td className="py-2 px-3 font-semibold text-[#111827]">
                        {t.assignee?.fullName || t.suggestedMemberName || "Chưa giao"}
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            t.status === "DONE"
                              ? "bg-[#E6F4EA] text-[#137333]"
                              : t.status === "IN_PROGRESS"
                              ? "bg-[#E8F0FE] text-[#1A73E8]"
                              : "bg-[#F3E8FF] text-[#7E22CE]"
                          }`}
                        >
                          {t.status === "DONE" ? "Đã xong" : t.status === "IN_PROGRESS" ? "Đang làm" : "Cần làm"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {tasks.length > 10 && (
              <p className="text-[11px] text-[#6B7280] italic text-right pt-1">
                Hiển thị 10/{tasks.length} hạng mục chức năng. Bấm "Xem tất cả" để xem danh sách đầy đủ.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
