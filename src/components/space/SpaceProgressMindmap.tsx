"use client";

import React, { useState, useMemo } from "react";
import {
  Maximize2,
  Minimize2,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronRight,
  Sparkles,
  AlertTriangle
} from "lucide-react";
import { Space, Task, Sprint } from "@/types";

interface SpaceProgressMindmapProps {
  space?: Space | null;
  tasks: Task[];
  sprints?: Sprint[];
  members?: any[];
  currentUser?: any;
  onSelectTask?: (task: Task) => void;
}

export function SpaceProgressMindmap({
  space,
  tasks,
  sprints = [],
  members = [],
  currentUser,
  onSelectTask,
}: SpaceProgressMindmapProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoveredTaskId, setHoveredTaskId] = useState<number | null>(null);
  const [hoveredSprintId, setHoveredSprintId] = useState<number | null>(null);
  const [sprintTooltipPos, setSprintTooltipPos] = useState<"top" | "bottom">("bottom");
  const [taskTooltipPos, setTaskTooltipPos] = useState<"top" | "bottom">("top");
  const [hoveredSpace, setHoveredSpace] = useState(false);
  const [spaceTooltipPos, setSpaceTooltipPos] = useState<"top" | "bottom">("bottom");

  // Viewport-aware mouse enter for space root node (avoids clipping at edges)
  const handleSpaceMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.top < 260) {
      setSpaceTooltipPos("bottom");
    } else if (window.innerHeight - rect.bottom < 260) {
      setSpaceTooltipPos("top");
    } else {
      setSpaceTooltipPos("bottom");
    }
    setHoveredSpace(true);
  };

  // Viewport-aware mouse enter for sprint node (flips down if close to top of canvas/screen)
  const handleSprintMouseEnter = (e: React.MouseEvent<HTMLDivElement>, sprintId: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.top < 240) {
      setSprintTooltipPos("bottom");
    } else if (window.innerHeight - rect.bottom < 210) {
      setSprintTooltipPos("top");
    } else {
      setSprintTooltipPos("bottom");
    }
    setHoveredSprintId(sprintId);
  };

  // Viewport-aware mouse enter for task node (prevents clipping when rect.top < 260)
  const handleTaskMouseEnter = (e: React.MouseEvent<HTMLDivElement>, taskId: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.top < 260) {
      setTaskTooltipPos("bottom");
    } else if (window.innerHeight - rect.bottom < 260) {
      setTaskTooltipPos("top");
    } else {
      setTaskTooltipPos(rect.top < window.innerHeight / 2 ? "bottom" : "top");
    }
    setHoveredTaskId(taskId);
  };

  const currentUserId = currentUser?.id;
  const currentUserEmail = currentUser?.email?.toLowerCase();
  const today = new Date().toISOString().split("T")[0];

  // Robust Assignee Finder
  const getAssigneeInfo = (task: Task) => {
    const targetId = task.ownerId || task.assignee?.id;
    const targetName = task.ownerName || task.assignee?.fullName || task.suggestedMemberName;

    if (targetId && members && members.length > 0) {
      const found = members.find((m: any) => {
        const mId = m.id?.userId || m.userId || m.id;
        return String(mId) === String(targetId);
      });
      if (found) {
        return {
          name: found.fullName || found.user?.fullName || found.email || `Thành viên #${targetId}`,
          email: found.email || found.user?.email || "",
          avatarUrl: found.avatarUrl || found.user?.avatarUrl,
        };
      }
    }
    return {
      name: targetName || "Chưa phân công",
      email: task.assignee?.email || "",
      avatarUrl: undefined,
    };
  };

  // User Task Identifier: matches ID, email, name or member list
  const isMyTask = (t: Task) => {
    if (!currentUser) return false;
    const myId = String(currentUser.id || "");
    const myEmail = (currentUser.email || "").toLowerCase().trim();
    const myName = (currentUser.fullName || currentUser.username || currentUser.name || "").toLowerCase().trim();

    if (t.ownerId && myId && String(t.ownerId) === myId) return true;
    if (t.assignee?.id && myId && String(t.assignee.id) === myId) return true;
    if (t.assignee?.email && myEmail && t.assignee.email.toLowerCase().trim() === myEmail) return true;
    if (t.ownerName && myName && t.ownerName.toLowerCase().trim() === myName) return true;
    if (t.assignee?.fullName && myName && t.assignee.fullName.toLowerCase().trim() === myName) return true;
    if (t.suggestedMemberName && myName && t.suggestedMemberName.toLowerCase().trim() === myName) return true;

    // Check through space members list
    if (members && members.length > 0 && myId) {
      const myMember = members.find((m: any) => {
        const mId = String(m.id?.userId || m.userId || m.id || "");
        return mId === myId;
      });
      if (myMember) {
        const memberUserId = String(myMember.id?.userId || myMember.userId || myMember.id || "");
        const memberEmail = (myMember.email || myMember.user?.email || "").toLowerCase().trim();
        if (t.ownerId && String(t.ownerId) === memberUserId) return true;
        if (t.assignee?.email && memberEmail && t.assignee.email.toLowerCase().trim() === memberEmail) return true;
      }
    }
    return false;
  };

  // Determine which sprint is ACTIVE (Default only active sprint is expanded)
  const activeSprintId = useMemo(() => {
    const active = sprints.find((s) => s.status?.toUpperCase() === "ACTIVE");
    if (active) return active.id;
    return -1;
  }, [sprints]);

  // Expanded sprints state: initially ONLY the active sprint is expanded
  const [expandedSprints, setExpandedSprints] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    if (activeSprintId !== -1) {
      initial[`sprint-${activeSprintId}`] = true;
    }
    return initial;
  });

  const toggleSprint = (sprintKey: string) => {
    setExpandedSprints((prev) => ({
      ...prev,
      [sprintKey]: !prev[sprintKey],
    }));
  };

  // Group tasks by Sprint
  const sprintGroups = useMemo(() => {
    const list: {
      key: string;
      sprint: Sprint | null;
      title: string;
      isActive: boolean;
      isClosed: boolean;
      isDone: boolean;
      isClosedIncomplete: boolean;
      isFuture: boolean;
      percent: number;
      tasks: Task[];
      leftTasks: Task[];
      rightTasks: Task[];
    }[] = [];

    // Sắp xếp Sprint theo thứ tự chuẩn: theo số thứ tự Sprint (Sprint 1, 2, 3...) hoặc startDate/id
    const sortedSprints = [...sprints].sort((a, b) => {
      const numA = parseInt(a.name?.match(/\d+/)?.[0] || "", 10);
      const numB = parseInt(b.name?.match(/\d+/)?.[0] || "", 10);
      if (!isNaN(numA) && !isNaN(numB) && numA !== numB) {
        return numA - numB;
      }
      if (a.startDate && b.startDate) {
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      }
      return (a.id || 0) - (b.id || 0);
    });

    // Process real sprints in correct sequential order
    sortedSprints.forEach((sp) => {
      const spTasks = tasks.filter((t) => t.sprintId === sp.id);
      const doneCount = spTasks.filter((t) => t.status === "DONE").length;
      const pct = spTasks.length > 0 ? Math.round((doneCount / spTasks.length) * 100) : 0;

      const spStatus = (sp.status || "").toUpperCase();
      const isClosed = spStatus === "CLOSED";
      const isActive = !isClosed && (spStatus === "ACTIVE" || sp.id === activeSprintId);
      const is100Done = pct === 100 && spTasks.length > 0;
      const isClosedIncomplete = isClosed && !is100Done;
      const isFuture = !isClosed && !isActive;

      // Distribute tasks evenly: even index left, odd index right
      const left: Task[] = [];
      const right: Task[] = [];
      spTasks.forEach((t, i) => {
        if (i % 2 === 0) left.push(t);
        else right.push(t);
      });

      list.push({
        key: `sprint-${sp.id}`,
        sprint: sp,
        title: sp.name,
        isActive,
        isClosed,
        isDone: is100Done,
        isClosedIncomplete,
        isFuture,
        percent: pct,
        tasks: spTasks,
        leftTasks: left,
        rightTasks: right,
      });
    });

    // Backlog tasks
    const backlogTasks = tasks.filter((t) => !t.sprintId || !sprints.some((sp) => sp.id === t.sprintId));
    if (backlogTasks.length > 0) {
      const doneCount = backlogTasks.filter((t) => t.status === "DONE").length;
      const pct = Math.round((doneCount / backlogTasks.length) * 100);
      const left: Task[] = [];
      const right: Task[] = [];
      backlogTasks.forEach((t, i) => {
        if (i % 2 === 0) left.push(t);
        else right.push(t);
      });

      list.push({
        key: "sprint-backlog",
        sprint: null,
        title: "Backlog (Công việc tồn đọng)",
        isActive: false,
        isClosed: false,
        isDone: pct === 100,
        isClosedIncomplete: false,
        isFuture: true,
        percent: pct,
        tasks: backlogTasks,
        leftTasks: left,
        rightTasks: right,
      });
    }

    return list;
  }, [sprints, tasks, activeSprintId]);

  // Overall Space Progress
  const totalTasksCount = tasks.length || 1;
  const doneTasksCount = tasks.filter((t) => t.status === "DONE").length;
  const overallPercent = Math.round((doneTasksCount / totalTasksCount) * 100);

  // Status helper for roadmap card
  const getTaskVisualProps = (task: Task, isSprintActive: boolean) => {
    const isOverdue = task.status !== "DONE" && task.dueDate && task.dueDate < today;
    const isBlocked = !!task.riskWarning;
    const isMine = isMyTask(task);

    // Status corner badge
    let badge = <div className="w-3.5 h-3.5 rounded-full bg-[#94A3B8] border border-white shrink-0" title="Cần làm" />;
    let statusLabel = "Cần làm";
    let statusBadgeColor = "bg-gray-100 text-gray-700 border-gray-300";

    if (isOverdue || isBlocked) {
      badge = (
        <div className="w-4 h-4 rounded-full bg-[#EF4444] text-white flex items-center justify-center text-[9px] font-bold shadow-xs shrink-0" title="Trễ hạn/Nghẽn">
          !
        </div>
      );
      statusLabel = isOverdue ? "Trễ hạn" : "Bị nghẽn";
      statusBadgeColor = "bg-red-100 text-red-700 border-red-300";
    } else if (task.status === "DONE") {
      badge = (
        <div className="w-4 h-4 rounded-full bg-[#10B981] text-white flex items-center justify-center text-[9px] font-bold shadow-xs shrink-0" title="Đã xong">
          ✓
        </div>
      );
      statusLabel = "Đã xong";
      statusBadgeColor = "bg-emerald-100 text-emerald-700 border-emerald-300";
    } else if (task.status === "IN_PROGRESS") {
      badge = (
        <div className="w-4 h-4 rounded-full bg-[#2563EB] text-white flex items-center justify-center shadow-xs shrink-0" title="Đang làm">
          <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
        </div>
      );
      statusLabel = "Đang làm";
      statusBadgeColor = "bg-blue-100 text-blue-700 border-blue-300";
    }

    // Border & Background for user's task
    // YÊU CẦU: Task của mình trong sprint đang làm HOẶC đang làm thì NHẤP NHÁY VIỀN XANH
    let borderClass = "border-2 border-black/70 hover:border-black";
    let bgClass = "bg-[#FFFDF0] hover:bg-[#FEF9C3]";

    if (isMine) {
      if (isSprintActive || task.status === "IN_PROGRESS") {
        borderClass = "border-2 border-[#2563EB] ring-2 ring-[#60A5FA] shadow-md animate-pulse";
        bgClass = "bg-[#EFF6FF]";
      } else {
        borderClass = "border-2 border-[#3B82F6] ring-1 ring-[#93C5FD]";
        bgClass = "bg-[#F8FAFC]";
      }
    }

    return {
      badge,
      borderClass,
      bgClass,
      statusLabel,
      statusBadgeColor,
      isMine,
    };
  };

  const containerClasses = isFullscreen
    ? "fixed inset-3 z-50 bg-white border border-[#CBD5E1] rounded-2xl shadow-2xl overflow-y-auto p-6 flex flex-col space-y-4"
    : "space-y-4";

  return (
    <div className={containerClasses}>
      {/* TOP CONTROLS & FULLSCREEN */}
      <div className="flex items-center justify-between border-b border-[#F3F4F6] pb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#374151]">Sơ đồ lộ trình phát triển (Roadmap Style)</span>
          <span className="text-[10px] font-mono text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded-full border border-blue-200 font-bold">
            Tiến độ tổng: {overallPercent}%
          </span>
        </div>

        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          title={isFullscreen ? "Thu nhỏ" : "Phóng to toàn màn hình"}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#374151] hover:text-[#111827] hover:bg-[#F3F4F6] rounded-xl border border-[#E5E7EB] transition-colors"
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="w-3.5 h-3.5" /> Thu nhỏ
            </>
          ) : (
            <>
              <Maximize2 className="w-3.5 h-3.5" /> Toàn màn hình
            </>
          )}
        </button>
      </div>

      {/* ROADMAP CANVAS: 2-COLUMN LAYOUT (LEGEND ON LEFT, TREE AT TOP RIGHT) */}
      <div className="relative overflow-x-auto overflow-y-visible py-6 px-4 sm:px-6 bg-[#FAFAFA] border border-[#E5E7EB] rounded-2xl min-h-[550px]">
        <div className="flex flex-col xl:flex-row items-start gap-8 relative w-full">
          {/* ========================================================================= */}
          {/* 1. BẢNG CHÚ THÍCH (LEGEND BOX): NẰM 1 CHỖ BÊN TRÁI, STICKY */}
          {/* ========================================================================= */}
          <div className="w-full xl:w-64 shrink-0 bg-white border-2 border-black/80 rounded-2xl p-4 shadow-sm space-y-3 text-xs xl:sticky xl:top-4 z-20 self-start">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <span className="font-extrabold text-[#111827] uppercase tracking-wider text-[11px]">
                Chú thích lộ trình
              </span>
              <span className="text-[10px] text-gray-400 font-mono">Legend</span>
            </div>

            {/* SPRINT STATUS SECTION */}
            <div className="space-y-2 text-[11px] text-[#374151]">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Trạng thái Sprint
              </div>
              <div className="flex items-center gap-2.5 font-bold text-emerald-800">
                <div className="w-4 h-4 rounded-md bg-[#DCFCE7] border border-emerald-500 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                </div>
                <span>Hoàn thành</span>
              </div>
              <div className="flex items-center gap-2.5 font-bold text-amber-800">
                <div className="w-4 h-4 rounded-md bg-[#FEF3C7] border border-amber-500 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                </div>
                <span>Chưa hoàn thành</span>
              </div>
              <div className="flex items-center gap-2.5 font-bold text-[#1D4ED8]">
                <div className="w-4 h-4 rounded-md bg-[#EFF6FF] border border-[#2563EB] ring-1 ring-blue-300 flex items-center justify-center shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                </div>
                <span>Đang làm</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-600">
                <div className="w-4 h-4 rounded-md bg-[#F8FAFC] border border-slate-300 flex items-center justify-center shrink-0">
                  <Clock className="w-2.5 h-2.5 text-slate-400" />
                </div>
                <span>Chưa bắt đầu</span>
              </div>
            </div>

            {/* TASK STATUS SECTION */}
            <div className="space-y-2 text-[11px] text-[#374151] pt-2.5 border-t border-gray-100">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Trạng thái Công việc
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full bg-[#10B981] text-white flex items-center justify-center text-[9px] font-bold shrink-0">
                  ✓
                </div>
                <span>Đã xong</span>
              </div>
              <div className="flex items-center gap-2.5 font-semibold text-[#1D4ED8]">
                <div className="w-4 h-4 rounded-full bg-[#2563EB] flex items-center justify-center shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                </div>
                <span>Đang thực hiện</span>
              </div>
              <div className="flex items-center gap-2.5 text-gray-500">
                <div className="w-4 h-4 rounded-full bg-[#94A3B8] shrink-0" />
                <span>Cần làm</span>
              </div>
              <div className="flex items-center gap-2.5 text-red-600 font-medium">
                <div className="w-4 h-4 rounded-full bg-[#EF4444] text-white flex items-center justify-center text-[9px] font-bold shrink-0">
                  !
                </div>
                <span>Trễ hạn / Cảnh báo rủi ro</span>
              </div>
              <div className="pt-2 border-t border-gray-100 flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-md border-2 border-[#3B82F6] bg-blue-50 shrink-0" />
                <span>Công việc của bạn</span>
              </div>
              <div className="flex items-center gap-2.5 text-[#2563EB] font-bold">
                <div className="w-4 h-4 rounded-md border-2 border-[#2563EB] ring-2 ring-blue-300 animate-pulse bg-blue-100 shrink-0" />
                <span>Công việc đang làm của bạn</span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 2. CÂY SƠ ĐỒ ROADMAP: ĐẨY LÊN TRÊN CÙNG ĐỒNG BỘ VỚI BẢNG CHÚ THÍCH */}
          {/* ========================================================================= */}
          <div className="flex-1 flex flex-col items-center w-full min-w-0 relative">
            {/* ROOT NODE: TÊN ĐỀ TÀI SPACE (Ở TRÊN CÙNG) */}
            <div className="group relative z-30">
              <div
                onMouseEnter={handleSpaceMouseEnter}
                onMouseLeave={() => setHoveredSpace(false)}
                className="px-7 py-3.5 rounded-2xl bg-[#FEF08A] border-2 border-black text-[#111827] shadow-md flex items-center gap-3 font-extrabold text-sm sm:text-base max-w-xl text-center cursor-pointer transition-transform hover:scale-105"
              >
                <Sparkles className="w-5 h-5 text-[#B45309] shrink-0" />
                <span className="truncate">{space?.name || "Đề tài Space"}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-black text-white text-[11px] font-mono font-bold shrink-0">
                  {overallPercent}%
                </span>
              </div>

              {/* SPACE DETAIL HOVER POPOVER */}
              {hoveredSpace && (
                <div
                  className={`absolute ${spaceTooltipPos === "top" ? "bottom-full mb-3" : "top-full mt-3"
                    } left-1/2 -translate-x-1/2 z-[100] w-80 sm:w-96 p-4 bg-white border-2 border-black rounded-2xl shadow-[0_20px_45px_rgba(0,0,0,0.25)] text-xs space-y-3 pointer-events-none animate-in fade-in zoom-in-95`}
                >
                  <div className="flex items-start justify-between gap-2 border-b border-gray-200 pb-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400">Không gian làm việc</span>
                      <h4 className="font-extrabold text-sm text-[#111827] leading-tight mt-0.5">
                        {space?.name || "Đề tài Space"}
                      </h4>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-black text-yellow-300 shrink-0">
                      {overallPercent}% xong
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-gray-600 font-medium">
                      <span>Tiến độ tổng thể</span>
                      <span className="font-mono font-bold text-[#111827]">
                        {doneTasksCount}/{totalTasksCount} công việc
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden border border-gray-200">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${overallPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200">
                      <span className="text-[10px] text-emerald-700 font-semibold block">Đã xong</span>
                      <span className="font-mono font-bold text-sm text-emerald-900">{doneTasksCount}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-blue-50 border border-blue-200">
                      <span className="text-[10px] text-blue-700 font-semibold block">Đang làm</span>
                      <span className="font-mono font-bold text-sm text-blue-900">
                        {tasks.filter((t) => t.status === "IN_PROGRESS").length}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-amber-50 border border-amber-200">
                      <span className="text-[10px] text-amber-700 font-semibold block">Cần làm</span>
                      <span className="font-mono font-bold text-sm text-amber-900">
                        {tasks.filter((t) => t.status === "TODO").length}
                      </span>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="pt-2 border-t border-gray-100 text-[11px] text-gray-600 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Số lượng Sprint:</span>
                      <span className="font-bold text-[#111827]">{sprints.length} sprints</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Thành viên:</span>
                      <span className="font-bold text-[#111827]">{members.length || 1} người</span>
                    </div>
                    {space?.startDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Thời gian:</span>
                        <span className="font-mono text-[10px] font-semibold text-[#111827]">
                          {space.startDate.substring(0, 10)} ➔ {space.endDate?.substring(0, 10) || "Đang mở"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Pointer Arrow */}
                  <div
                    className={`absolute left-1/2 -translate-x-1/2 border-4 border-transparent ${spaceTooltipPos === "top" ? "top-full border-t-black" : "bottom-full border-b-black"
                      }`}
                  />
                </div>
              )}
            </div>

            {/* SPRINT NODES & BRANCHING TASKS */}
            {sprintGroups.map((group) => {
              const isExpanded = !!expandedSprints[group.key];
              const hasTasks = group.tasks.length > 0;

              return (
                <div
                  key={group.key}
                  className={`w-full flex flex-col items-center relative transition-all ${hoveredSprintId === (group.sprint?.id || 9999)
                    ? "z-50"
                    : hoveredTaskId && group.tasks.some((t) => t.id === hoveredTaskId)
                      ? "z-40"
                      : "z-10"
                    }`}
                >
                  {/* VERTICAL CONNECTING SPINE LINE */}
                  <div className="w-0.5 h-10 bg-[#3B82F6]" />

                  {/* SPRINT CENTRAL NODE (High z-index when hovered so tooltip displays ABOVE task cards) */}
                  <div
                    className={`relative transition-all ${hoveredSprintId === (group.sprint?.id || 9999) ? "z-50" : "z-20"
                      }`}
                  >
                    <div
                      onClick={() => toggleSprint(group.key)}
                      onMouseEnter={(e) => handleSprintMouseEnter(e, group.sprint?.id || 9999)}
                      onMouseLeave={() => setHoveredSprintId(null)}
                      className={`px-6 py-2.5 rounded-xl border-2 text-xs font-bold shadow-xs cursor-pointer transition-all flex items-center gap-2.5 ${group.isDone
                        ? "bg-[#DCFCE7] border-2 border-emerald-600 text-[#14532D]"
                        : group.isClosedIncomplete
                          ? "bg-[#FEF3C7] border-2 border-amber-500 text-[#92400E]"
                          : group.isActive
                            ? "bg-[#EFF6FF] border-2 border-[#2563EB] text-[#1D4ED8] ring-2 ring-blue-400 ring-offset-2 scale-105 shadow-md"
                            : "bg-[#F8FAFC] border-2 border-slate-300 text-[#475569]"
                        }`}
                    >
                      {group.isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : group.isClosedIncomplete ? (
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      ) : group.isActive ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping shrink-0" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}

                      <span className="text-sm font-extrabold">{group.title}</span>

                      {/* Percentage Badge */}
                      <span
                        className={`px-2 py-0.5 rounded-full font-mono text-[11px] font-bold ${group.isDone
                          ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                          : group.isClosedIncomplete
                            ? "bg-amber-100 text-amber-900 border border-amber-300"
                            : group.isActive
                              ? "bg-blue-600 text-white"
                              : "bg-slate-200 text-slate-700"
                          }`}
                      >
                        {group.percent}%
                      </span>

                      {/* Expand / Collapse icon */}
                      {hasTasks && (
                        <ChevronRight
                          className={`w-4 h-4 transition-transform duration-200 text-gray-700 ${isExpanded ? "rotate-90" : ""
                            }`}
                        />
                      )}
                    </div>

                    {/* SPRINT HOVER TOOLTIP (FLIPS UP/DOWN BASED ON VIEWPORT AND HAS z-[100]) */}
                    {hoveredSprintId === (group.sprint?.id || 9999) && (
                      <div
                        className={`absolute ${sprintTooltipPos === "top" ? "bottom-full mb-3" : "top-full mt-3"
                          } left-1/2 -translate-x-1/2 z-[100] w-72 p-3.5 bg-white border-2 border-black rounded-2xl shadow-[0_16px_36px_rgba(0,0,0,0.2)] text-xs space-y-2 pointer-events-none animate-in fade-in zoom-in-95`}
                      >
                        <div className="flex items-center justify-between border-b border-gray-200 pb-1.5">
                          <p className="font-extrabold text-xs text-[#111827] truncate">{group.title}</p>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border shrink-0 ${group.isDone
                              ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                              : group.isClosedIncomplete
                                ? "bg-amber-100 text-amber-900 border-amber-300"
                                : group.isActive
                                  ? "bg-blue-100 text-blue-900 border-blue-300"
                                  : "bg-slate-100 text-slate-700 border-slate-300"
                              }`}
                          >
                            {group.isDone
                              ? "Đã đóng (100%)"
                              : group.isClosedIncomplete
                                ? "Đã đóng (Chưa xong)"
                                : group.isActive
                                  ? "Đang diễn ra"
                                  : "Chưa bắt đầu"}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-600 space-y-1 bg-[#F9FAFB] p-2 rounded-xl border border-gray-100">
                          <p className="flex items-center justify-between">
                            <span>Tiến độ:</span>
                            <span className="font-bold text-black font-mono">
                              {group.percent}% ({group.tasks.filter((t) => t.status === "DONE").length}/{group.tasks.length} task)
                            </span>
                          </p>
                          {group.sprint?.startDate && (
                            <p className="flex items-center justify-between text-[10px]">
                              <span>Thời gian:</span>
                              <span className="font-mono font-semibold">
                                {group.sprint.startDate.substring(0, 10)} ➔ {group.sprint.endDate?.substring(0, 10) || "Hiện tại"}
                              </span>
                            </p>
                          )}
                        </div>
                        <p className="text-[10px] text-blue-600 font-semibold text-center italic pt-0.5">
                          💡 Bấm để {isExpanded ? "thu gọn" : "mở rộng"} nhánh công việc
                        </p>

                        {/* Pointer arrow */}
                        <div
                          className={`absolute left-1/2 -translate-x-1/2 border-4 border-transparent ${sprintTooltipPos === "top" ? "top-full border-t-black" : "bottom-full border-b-black"
                            }`}
                        />
                      </div>
                    )}
                  </div>

                  {/* ========================================================================= */}
                  {/* BRANCHING TASKS TO LEFT AND RIGHT (TO HƠN, DÀI HƠN & HOVER TRÊN/DƯỚI) */}
                  {/* ========================================================================= */}
                  {isExpanded && hasTasks && (
                    <div
                      className={`w-full flex items-start justify-center gap-14 pt-4 pb-8 relative ${hoveredTaskId && group.tasks.some((t) => t.id === hoveredTaskId) ? "z-30" : "z-10"
                        }`}
                    >
                      {/* LEFT TASKS COLUMN */}
                      <div className="flex-1 flex flex-col items-end space-y-4">
                        {group.leftTasks.map((t, i) => {
                          const visual = getTaskVisualProps(t, group.isActive);
                          const assignee = getAssigneeInfo(t);
                          const isHovered = hoveredTaskId === t.id;

                          return (
                            <div
                              key={t.id}
                              className={`relative flex items-center gap-2 group cursor-pointer ${isHovered ? "z-50" : "z-10"
                                }`}
                              onClick={() => onSelectTask && onSelectTask(t)}
                              onMouseEnter={(e) => handleTaskMouseEnter(e, t.id)}
                              onMouseLeave={() => setHoveredTaskId(null)}
                            >
                              {/* Task Card (Wider, longer, rich layout) */}
                              <div
                                className={`w-80 sm:w-96 min-h-[64px] px-5 py-3.5 rounded-2xl border-2 text-xs font-medium transition-all hover:scale-105 hover:bg-yellow-50/80 shadow-xs flex items-center justify-between gap-3 ${visual.bgClass} ${visual.borderClass}`}
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-[#111827] text-xs sm:text-sm line-clamp-1">{t.title}</p>
                                  <div className="flex items-center gap-2 mt-1.5 text-[11px] text-[#6B7280]">
                                    <span className="font-mono font-semibold">#{t.id}</span>
                                    <span>•</span>
                                    <span className="truncate max-w-[140px] font-semibold text-[#374151]">
                                      {assignee.name}
                                    </span>
                                  </div>
                                </div>
                                <div className="shrink-0">{visual.badge}</div>
                              </div>

                              {/* Connecting Dotted Line to Spine */}
                              <div className="w-10 border-b-2 border-dotted border-[#3B82F6]" />

                              {/* HOVER TOOLTIP POPOVER (FLIPS UP/DOWN BASED ON VIEWPORT AND HAS z-[100]) */}
                              {isHovered && (
                                <div
                                  className={`absolute ${taskTooltipPos === "top" ? "bottom-full mb-3" : "top-full mt-3"
                                    } right-12 z-[100] w-80 p-4 bg-white text-[#111827] text-xs rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.2)] border-2 border-black ring-4 ring-yellow-400/30 pointer-events-none animate-in fade-in zoom-in-95`}
                                >
                                  <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-2">
                                    <span className="font-mono text-[11px] text-[#1E293B] font-extrabold bg-[#FEF08A] px-2.5 py-0.5 rounded-md border border-black/30">
                                      Mã #{t.id}
                                    </span>
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${visual.statusBadgeColor}`}>
                                      {visual.statusLabel}
                                    </span>
                                  </div>

                                  <p className="font-extrabold text-sm text-[#0F172A] mb-2.5 leading-snug">{t.title}</p>

                                  <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-gray-200 space-y-1.5 mb-2.5">
                                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Người thực hiện:</p>
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                                        {assignee.name.substring(0, 2).toUpperCase()}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="font-bold text-[#111827] text-xs truncate">{assignee.name}</p>
                                        {assignee.email && <p className="text-[10px] text-gray-500 truncate">{assignee.email}</p>}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2 text-[11px] text-[#4B5563] pt-1.5 border-t border-gray-100">
                                    <p><span className="text-gray-500">Độ ưu tiên:</span> <span className="font-bold text-[#111827]">{t.priority}</span></p>
                                    <p><span className="text-gray-500">Hạn chót:</span> <span className="font-mono font-semibold text-[#111827]">{t.dueDate || "Chưa đặt"}</span></p>
                                  </div>

                                  {t.riskWarning && (
                                    <p className="p-2 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[10px] font-semibold flex items-center gap-1.5 mt-2">
                                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                                      {t.riskWarning}
                                    </p>
                                  )}

                                  {/* Arrow indicator */}
                                  <div
                                    className={`absolute right-10 border-4 border-transparent ${taskTooltipPos === "top" ? "top-full border-t-black" : "bottom-full border-b-black"
                                      }`}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* SPRINT CENTER CONNECTOR STUB */}
                      <div className="w-4 flex items-center justify-center shrink-0" />

                      {/* RIGHT TASKS COLUMN */}
                      <div className="flex-1 flex flex-col items-start space-y-4">
                        {group.rightTasks.map((t, i) => {
                          const visual = getTaskVisualProps(t, group.isActive);
                          const assignee = getAssigneeInfo(t);
                          const isHovered = hoveredTaskId === t.id;

                          return (
                            <div
                              key={t.id}
                              className={`relative flex items-center gap-2 group cursor-pointer ${isHovered ? "z-50" : "z-10"
                                }`}
                              onClick={() => onSelectTask && onSelectTask(t)}
                              onMouseEnter={(e) => handleTaskMouseEnter(e, t.id)}
                              onMouseLeave={() => setHoveredTaskId(null)}
                            >
                              {/* Connecting Dotted Line to Spine */}
                              <div className="w-10 border-b-2 border-dotted border-[#3B82F6]" />

                              {/* Task Card (Wider, longer, rich layout) */}
                              <div
                                className={`w-80 sm:w-96 min-h-[64px] px-5 py-3.5 rounded-2xl border-2 text-xs font-medium transition-all hover:scale-105 hover:bg-yellow-50/80 shadow-xs flex items-center justify-between gap-3 ${visual.bgClass} ${visual.borderClass}`}
                              >
                                <div className="shrink-0">{visual.badge}</div>
                                <div className="min-w-0 flex-1 text-right">
                                  <p className="font-bold text-[#111827] text-xs sm:text-sm line-clamp-1">{t.title}</p>
                                  <div className="flex items-center justify-end gap-2 mt-1.5 text-[11px] text-[#6B7280]">
                                    <span className="truncate max-w-[140px] font-semibold text-[#374151]">
                                      {assignee.name}
                                    </span>
                                    <span>•</span>
                                    <span className="font-mono font-semibold">#{t.id}</span>
                                  </div>
                                </div>
                              </div>

                              {/* HOVER TOOLTIP POPOVER (FLIPS UP/DOWN BASED ON VIEWPORT AND HAS z-[100]) */}
                              {isHovered && (
                                <div
                                  className={`absolute ${taskTooltipPos === "top" ? "bottom-full mb-3" : "top-full mt-3"
                                    } left-12 z-[100] w-80 p-4 bg-white text-[#111827] text-xs rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.2)] border-2 border-black ring-4 ring-yellow-400/30 pointer-events-none animate-in fade-in zoom-in-95`}
                                >
                                  <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-2">
                                    <span className="font-mono text-[11px] text-[#1E293B] font-extrabold bg-[#FEF08A] px-2.5 py-0.5 rounded-md border border-black/30">
                                      Mã #{t.id}
                                    </span>
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${visual.statusBadgeColor}`}>
                                      {visual.statusLabel}
                                    </span>
                                  </div>

                                  <p className="font-extrabold text-sm text-[#0F172A] mb-2.5 leading-snug">{t.title}</p>

                                  <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-gray-200 space-y-1.5 mb-2.5">
                                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Người thực hiện:</p>
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                                        {assignee.name.substring(0, 2).toUpperCase()}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="font-bold text-[#111827] text-xs truncate">{assignee.name}</p>
                                        {assignee.email && <p className="text-[10px] text-gray-500 truncate">{assignee.email}</p>}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2 text-[11px] text-[#4B5563] pt-1.5 border-t border-gray-100">
                                    <p><span className="text-gray-500">Độ ưu tiên:</span> <span className="font-bold text-[#111827]">{t.priority}</span></p>
                                    <p><span className="text-gray-500">Hạn chót:</span> <span className="font-mono font-semibold text-[#111827]">{t.dueDate || "Chưa đặt"}</span></p>
                                  </div>

                                  {t.riskWarning && (
                                    <p className="p-2 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[10px] font-semibold flex items-center gap-1.5 mt-2">
                                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                                      {t.riskWarning}
                                    </p>
                                  )}

                                  {/* Arrow indicator */}
                                  <div
                                    className={`absolute left-10 border-4 border-transparent ${taskTooltipPos === "top" ? "top-full border-t-black" : "bottom-full border-b-black"
                                      }`}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}


