"use client";

import React, { useState, useEffect, useRef } from "react";
import { CheckCircle2, Edit3, PlusSquare, Calendar, BarChart2, Users, AlertTriangle, X, Check } from "lucide-react";
import { Task, Space, Sprint } from "@/types";
import { SpaceMindmapAndSummaryContainer } from "./SpaceMindmapAndSummaryContainer";

interface SpaceOverviewTabProps {
  space?: Space | null;
  tasks: Task[];
  sprints?: Sprint[];
  members?: any[];
  currentUser?: any;
  onViewTasks: () => void;
  onSelectTask?: (task: Task) => void;
}

export function SpaceOverviewTab({
  space,
  tasks,
  sprints = [],
  members = [],
  currentUser,
  onViewTasks,
  onSelectTask,
}: SpaceOverviewTabProps) {
  // Counts by status
  const todoCount = tasks.filter((t) => t.status === "TODO").length;
  const inProgressCount = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const doneCount = tasks.filter((t) => t.status === "DONE").length;
  const totalCount = tasks.length || 1;

  const todoPercent = Math.round((todoCount / totalCount) * 100);
  const inProgressPercent = Math.round((inProgressCount / totalCount) * 100);
  const donePercent = Math.round((doneCount / totalCount) * 100);

  // Counts by Priority
  const urgentCount = tasks.filter((t) => t.priority === "URGENT").length;
  const highCount = tasks.filter((t) => t.priority === "HIGH").length;
  const mediumCount = tasks.filter((t) => t.priority === "MEDIUM").length;
  const lowCount = tasks.filter((t) => t.priority === "LOW").length;

  // Calculate Member Workload Distribution dynamically based on real members and tasks
  const memberWorkloadMap: Record<string, number> = {};
  tasks.forEach((t) => {
    const memberName = t.assignee?.fullName || t.assignee?.email || t.suggestedMemberName || "Chưa phân công";
    memberWorkloadMap[memberName] = (memberWorkloadMap[memberName] || 0) + 1;
  });

  const memberWorkloadList = (members && members.length > 0)
    ? members.map((m) => {
      const uId = m.id?.userId || m.userId || m.id;
      const uName = m.user?.fullName || m.user?.email || m.fullName || m.email || `Thành viên #${uId}`;
      const count = tasks.filter((t) => t.ownerId === uId || t.assignee?.id === uId || t.ownerName === uName).length;
      return {
        id: uId,
        name: uName,
        avatarUrl: m.avatarUrl || m.user?.avatarUrl,
        count,
        percent: Math.round((count / totalCount) * 100),
      };
    })
    : Object.entries(memberWorkloadMap).map(([name, count]) => ({
      id: name,
      name,
      avatarUrl: undefined,
      count,
      percent: Math.round((count / totalCount) * 100),
    }));

  // Calculate Space Health and Risky Tasks
  const today = new Date().toISOString().split("T")[0];
  const riskyTasks = tasks.filter((t) => {
    const isOverdue = t.status !== "DONE" && t.dueDate && t.dueDate < today;
    const hasRisk = !!t.riskWarning;
    const isUrgentPending = t.priority === "URGENT" && t.status !== "DONE";
    return isOverdue || hasRisk || isUrgentPending;
  });

  // State for Risky Task Tooltip & Auto 30s timer
  const [activeRiskTask, setActiveRiskTask] = useState<Task | null>(null);
  const riskTimerRef = useRef<NodeJS.Timeout | null>(null);
  const riskRef = useRef<HTMLDivElement>(null);

  // State for Priority Breakdown Popup & Auto 30s timer
  const [activePriority, setActivePriority] = useState<"URGENT" | "HIGH" | "MEDIUM" | "LOW" | null>(null);
  const priorityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const priorityRef = useRef<HTMLDivElement>(null);

  // Global click outside listener to dismiss popovers
  useEffect(() => {
    const handleDocClick = (e: MouseEvent) => {
      if (riskRef.current && !riskRef.current.contains(e.target as Node)) {
        if (riskTimerRef.current) clearTimeout(riskTimerRef.current);
        setActiveRiskTask(null);
      }
      if (priorityRef.current && !priorityRef.current.contains(e.target as Node)) {
        if (priorityTimerRef.current) clearTimeout(priorityTimerRef.current);
        setActivePriority(null);
      }
    };

    // Cross-component coordination: close when other sections open a popover
    const handlePopoverChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ source: string }>;
      if (customEvent.detail?.source !== "risk") {
        if (riskTimerRef.current) clearTimeout(riskTimerRef.current);
        setActiveRiskTask(null);
      }
      if (customEvent.detail?.source !== "priority") {
        if (priorityTimerRef.current) clearTimeout(priorityTimerRef.current);
        setActivePriority(null);
      }
    };

    document.addEventListener("mousedown", handleDocClick);
    window.addEventListener("space-popover-change", handlePopoverChange);
    return () => {
      document.removeEventListener("mousedown", handleDocClick);
      window.removeEventListener("space-popover-change", handlePopoverChange);
      if (riskTimerRef.current) clearTimeout(riskTimerRef.current);
      if (priorityTimerRef.current) clearTimeout(priorityTimerRef.current);
    };
  }, []);

  // Handle Risk Task Chip Hover (Auto-holds 30s, switches and closes others)
  const handleRiskChipHover = (task: Task) => {
    if (activeRiskTask?.id === task.id) return;
    if (riskTimerRef.current) clearTimeout(riskTimerRef.current);
    if (priorityTimerRef.current) clearTimeout(priorityTimerRef.current);
    setActivePriority(null);
    setActiveRiskTask(task);

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("space-popover-change", { detail: { source: "risk" } })
      );
    }

    riskTimerRef.current = setTimeout(() => {
      setActiveRiskTask(null);
    }, 30000);
  };

  // Handle Risk Task Chip Click (Click active to hide, click another to switch)
  const handleRiskChipClick = (task: Task) => {
    if (activeRiskTask?.id === task.id) {
      if (riskTimerRef.current) clearTimeout(riskTimerRef.current);
      setActiveRiskTask(null);
    } else {
      handleRiskChipHover(task);
    }
  };

  // Handle Priority Column Hover (Auto-holds 30s, switches and closes others)
  const handlePriorityHover = (priority: "URGENT" | "HIGH" | "MEDIUM" | "LOW") => {
    if (activePriority === priority) return;
    if (priorityTimerRef.current) clearTimeout(priorityTimerRef.current);
    if (riskTimerRef.current) clearTimeout(riskTimerRef.current);
    setActiveRiskTask(null);
    setActivePriority(priority);

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("space-popover-change", { detail: { source: "priority" } })
      );
    }

    priorityTimerRef.current = setTimeout(() => {
      setActivePriority(null);
    }, 30000);
  };

  // Handle Priority Column Click (Click active to hide, click another to switch)
  const handlePriorityClick = (priority: "URGENT" | "HIGH" | "MEDIUM" | "LOW") => {
    if (activePriority === priority) {
      if (priorityTimerRef.current) clearTimeout(priorityTimerRef.current);
      setActivePriority(null);
    } else {
      handlePriorityHover(priority);
    }
  };

  // Filter tasks for active priority popover
  const priorityTasks = activePriority ? tasks.filter((t) => t.priority === activePriority) : [];

  const getPriorityInfo = (p: "URGENT" | "HIGH" | "MEDIUM" | "LOW") => {
    switch (p) {
      case "URGENT":
        return { label: "Khẩn cấp", color: "text-[#D93025]", bg: "bg-[#FDEDEC]", border: "border-[#FADBD8]" };
      case "HIGH":
        return { label: "Cao", color: "text-[#F97316]", bg: "bg-[#FFF7ED]", border: "border-[#FFEDD5]" };
      case "MEDIUM":
        return { label: "Trung bình", color: "text-[#1A73E8]", bg: "bg-[#EFF6FF]", border: "border-[#DBEAFE]" };
      case "LOW":
        return { label: "Thấp", color: "text-[#4B5563]", bg: "bg-[#F3F4F6]", border: "border-[#E5E7EB]" };
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* ROW 1: 4 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Completed */}
        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-2xl font-extrabold text-[#111827] flex items-center gap-1.5">
              {doneCount} <span className="text-xs font-semibold text-[#4B5563]">hoàn thành</span>
            </p>
            <p className="text-[11px] text-[#6B7280]">trong 7 ngày qua</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#E6F4EA] flex items-center justify-center text-[#10B981] border border-[#CEE7D4]">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Updated */}
        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-2xl font-extrabold text-[#111827] flex items-center gap-1.5">
              {inProgressCount + doneCount} <span className="text-xs font-semibold text-[#4B5563]">đã cập nhật</span>
            </p>
            <p className="text-[11px] text-[#6B7280]">trong 7 ngày qua</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#F3F4F6] flex items-center justify-center text-[#4B5563] border border-[#E5E7EB]">
            <Edit3 className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Created */}
        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-2xl font-extrabold text-[#111827] flex items-center gap-1.5">
              {tasks.length} <span className="text-xs font-semibold text-[#4B5563]">đã tạo mới</span>
            </p>
            <p className="text-[11px] text-[#6B7280]">trong 7 ngày qua</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#F3F4F6] flex items-center justify-center text-[#4B5563] border border-[#E5E7EB]">
            <PlusSquare className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Due soon */}
        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-2xl font-extrabold text-[#111827] flex items-center gap-1.5">
              {urgentCount} <span className="text-xs font-semibold text-[#4B5563]">sắp tới hạn</span>
            </p>
            <p className="text-[11px] text-[#6B7280]">trong 7 ngày tới</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#FDEDEC] flex items-center justify-center text-[#D93025] border border-[#FADBD8]">
            <Calendar className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ROW 2: Status Overview with Space Progress & Risks (Left) & Team Workload (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Overview & Space Progress & Risk Alert Card */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-2xs space-y-4 relative">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#111827]">Tổng quan trạng thái &amp; Tiến độ</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-[#10B981] bg-[#E6F4EA] px-2 py-0.5 rounded-full border border-[#CEE7D4]">
                  {donePercent}% hoàn thành
                </span>
                <button
                  onClick={onViewTasks}
                  className="text-xs text-[#1A73E8] hover:underline font-semibold"
                >
                  Xem tất cả
                </button>
              </div>
            </div>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Theo dõi tiến độ bàn giao và cảnh báo rủi ro các hạng mục công việc.
            </p>
          </div>

          {/* Progress Bar & Status Donut */}
          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
            <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#E5E7EB" strokeWidth="3.5" />
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="3.5"
                  strokeDasharray={`${donePercent} ${100 - donePercent}`}
                  strokeDashoffset="0"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="none"
                  stroke="#1A73E8"
                  strokeWidth="3.5"
                  strokeDasharray={`${inProgressPercent} ${100 - inProgressPercent}`}
                  strokeDashoffset={-donePercent}
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="none"
                  stroke="#A855F7"
                  strokeWidth="3.5"
                  strokeDasharray={`${todoPercent} ${100 - todoPercent}`}
                  strokeDashoffset={-(donePercent + inProgressPercent)}
                />
              </svg>
              <div className="absolute text-center">
                <p className="text-2xl font-extrabold text-[#111827] font-sans leading-none">
                  {tasks.length}
                </p>
                <p className="text-[10px] text-[#6B7280] font-semibold mt-0.5">
                  Tổng tasks
                </p>
              </div>
            </div>

            <div className="space-y-2.5 font-sans w-full max-w-[200px]">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 font-medium text-[#374151]">
                  <span className="w-3 h-3 rounded-xs bg-[#10B981]" />
                  Đã xong
                </span>
                <span className="font-bold text-[#111827]">{doneCount}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 font-medium text-[#374151]">
                  <span className="w-3 h-3 rounded-xs bg-[#1A73E8]" />
                  Đang làm
                </span>
                <span className="font-bold text-[#111827]">{inProgressCount}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 font-medium text-[#374151]">
                  <span className="w-3 h-3 rounded-xs bg-[#A855F7]" />
                  Cần làm
                </span>
                <span className="font-bold text-[#111827]">{todoCount}</span>
              </div>
            </div>
          </div>

          {/* Cảnh báo rủi ro với Tooltip Sáng, Không bị che khuất / Scroll, Hỗ trợ Ghim 30s */}
          <div className="pt-2 border-t border-[#F3F4F6] space-y-2 relative" ref={riskRef}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#B91C1C] flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-[#DC2626]" />
                Cảnh báo rủi ro ({riskyTasks.length} hạng mục)
              </span>

            </div>

            {riskyTasks.length === 0 ? (
              <p className="text-xs text-[#15803D] italic bg-[#F0FDF4] p-2 rounded-lg border border-[#DCFCE7]">
                ✓ Tiến độ ổn định, không có rủi ro trễ hạn hay tắc nghẽn.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1.5 bg-gray-50/70 rounded-xl border border-gray-100">
                {riskyTasks.map((rt) => {
                  const isSelected = activeRiskTask?.id === rt.id;

                  return (
                    <button
                      key={rt.id}
                      type="button"
                      onClick={() => handleRiskChipClick(rt)}
                      onMouseEnter={() => handleRiskChipHover(rt)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${isSelected
                        ? "bg-red-600 text-white shadow-xs ring-2 ring-red-300 scale-105"
                        : "bg-red-50 text-red-800 border border-red-200 hover:bg-red-100 hover:border-red-300"
                        }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSelected ? "bg-white" : "bg-red-500"}`} />
                      <span className="max-w-[150px] truncate">{rt.title}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* POPUP CHI TIẾT RỦI RO (MÀU SÁNG, NỔI BẬT, KHÔNG BỊ KHUẤT / SCROLL) */}
            {activeRiskTask && (
              <div className="absolute top-full left-0 right-0 mt-2 z-50 p-4 bg-white border-2 border-red-300 rounded-2xl shadow-[0_20px_45px_rgba(0,0,0,0.18)] ring-4 ring-red-100 animate-in fade-in zoom-in-95 space-y-3">
                <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-red-700 bg-red-50 px-2.5 py-0.5 rounded-md border border-red-200">
                        #{activeRiskTask.id}
                      </span>
                      <span className="text-[11px] font-bold text-gray-500 uppercase">
                        Độ ưu tiên: {activeRiskTask.priority}
                      </span>
                    </div>
                    <h5 className="font-bold text-sm text-[#0F172A] mt-1 leading-snug">
                      {activeRiskTask.title}
                    </h5>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (riskTimerRef.current) clearTimeout(riskTimerRef.current);
                      setActiveRiskTask(null);
                    }}
                    className="text-gray-400 hover:text-gray-700 p-1 rounded-md text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-[#F8FAFC] p-2.5 rounded-xl border border-gray-100">
                  <p>
                    <span className="text-gray-500">Người phụ trách:</span>{" "}
                    <strong className="text-[#1E293B]">
                      {activeRiskTask.assignee?.fullName || activeRiskTask.ownerName || activeRiskTask.suggestedMemberName || "Chưa giao"}
                    </strong>
                  </p>
                  <p>
                    <span className="text-gray-500">Hạn chót:</span>{" "}
                    <strong className="text-[#1E293B] font-mono">
                      {activeRiskTask.dueDate || "Chưa đặt"}
                    </strong>
                  </p>
                </div>

                {/* Risk Description box in bright styling */}
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-900 font-medium">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Chi tiết cảnh báo: </span>
                    <span>
                      {activeRiskTask.status !== "DONE" && activeRiskTask.dueDate && activeRiskTask.dueDate < today
                        ? `Công việc đã quá hạn hoàn thành (Hạn chót là ${activeRiskTask.dueDate}). Cần đẩy nhanh tiến độ xử lý.`
                        : activeRiskTask.riskWarning || "Mức độ khẩn cấp (URGENT) chưa được hoàn thành."}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-1 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      if (onSelectTask) onSelectTask(activeRiskTask);
                      if (riskTimerRef.current) clearTimeout(riskTimerRef.current);
                      setActiveRiskTask(null);
                    }}
                    className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors"
                  >
                    Mở chi tiết task
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Team Workload Capacity Distribution - THANH MÀU ĐỒNG BỘ FULL 1 MÀU DUY NHẤT */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-2xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#111827]">Phân bổ khối lượng công việc nhóm</h3>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Theo dõi khối lượng công việc được giao cho từng thành viên để đảm bảo cân bằng năng suất.
            </p>
          </div>

          <div className="space-y-4 pt-1 max-h-[220px] overflow-y-auto pr-1">
            {memberWorkloadList.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-4 text-center">Chưa có thành viên nào được phân công việc.</p>
            ) : (
              memberWorkloadList.map((item) => {
                const getInitials = (text?: string) => {
                  if (!text) return "U";
                  return text.trim().substring(0, 2).toUpperCase();
                };

                return (
                  <div key={item.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#111827] flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#EFF6FF] text-[#2563EB] font-mono font-bold text-[10px] flex items-center justify-center border border-[#BFDBFE]">
                          {getInitials(item.name)}
                        </div>
                        {item.name}
                      </span>
                      <span className="font-mono text-[#6B7280]">
                        {item.count} tasks ({item.percent}%)
                      </span>
                    </div>
                    {/* Unified single-color bar: Modern Blue */}
                    <div className="w-full bg-[#E2E8F0] h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#3B82F6] to-[#2563EB] h-full transition-all duration-500 rounded-full"
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ROW 3: Priority Breakdown with Hover/Click Task List Popover */}
      <div className="grid grid-cols-1 gap-6">
        {/* Priority Breakdown Bar Chart */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-2xs space-y-4 relative" ref={priorityRef}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#111827]">Phân bổ theo độ ưu tiên</h3>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Thống kê mức độ ưu tiên công việc trong không gian.
              </p>
            </div>
          </div>

          {/* Render Popover immediately next to the hovered/clicked column */}
          {(() => {
            const renderPriorityPopover = (placement: "left" | "right") => {
              if (!activePriority) return null;
              const pInfo = getPriorityInfo(activePriority);

              return (
                <div
                  className={`absolute ${
                    placement === "left" ? "right-full mr-3" : "left-full ml-3"
                  } bottom-0 z-50 w-72 sm:w-80 max-h-64 bg-white/95 backdrop-blur-xs border-2 border-gray-200 rounded-2xl shadow-2xl p-3 animate-in fade-in zoom-in-95 space-y-2 cursor-default text-left`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Arrow notch pointing directly to the bar */}
                  <div
                    className={`absolute bottom-6 ${
                      placement === "left"
                        ? "-right-2 border-t-2 border-r-2 border-gray-200 bg-white"
                        : "-left-2 border-b-2 border-l-2 border-gray-200 bg-white"
                    } w-3.5 h-3.5 rotate-45`}
                  />

                  <div className="flex items-center justify-between border-b border-gray-100 pb-1.5 relative z-10">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${pInfo.bg} ${pInfo.color} ${pInfo.border}`}
                      >
                        {pInfo.label}
                      </span>
                      <span className="text-[11px] text-gray-500 font-semibold">
                        ({priorityTasks.length} tasks)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (priorityTimerRef.current) clearTimeout(priorityTimerRef.current);
                        setActivePriority(null);
                      }}
                      className="text-gray-400 hover:text-gray-700 p-1 text-xs font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  {priorityTasks.length === 0 ? (
                    <p className="text-xs text-gray-400 italic py-3 text-center relative z-10">
                      Không có công việc nào ở mức ưu tiên này.
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 relative z-10">
                      {priorityTasks.map((t) => (
                        <div
                          key={t.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onSelectTask) onSelectTask(t);
                            if (priorityTimerRef.current) clearTimeout(priorityTimerRef.current);
                            setActivePriority(null);
                          }}
                          className="p-2 rounded-xl bg-[#F8FAFC] border border-gray-200 hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer transition-all space-y-0.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] font-bold text-gray-500">#{t.id}</span>
                            <span
                              className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                                t.status === "DONE"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : t.status === "IN_PROGRESS"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-200 text-gray-700"
                              }`}
                            >
                              {t.status === "DONE" ? "Đã xong" : t.status === "IN_PROGRESS" ? "Đang làm" : "Cần làm"}
                            </span>
                          </div>
                          <p className="font-bold text-xs text-[#0F172A] truncate">{t.title}</p>
                          <div className="flex items-center justify-between text-[10px] text-gray-500">
                            <span className="truncate max-w-[120px]">
                              {t.assignee?.fullName || t.ownerName || "Chưa giao"}
                            </span>
                            <span>{t.dueDate || ""}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            };

            return (
              <div className="h-44 flex items-end justify-between gap-6 pt-6 px-6 border-b border-[#E5E7EB] relative overflow-visible">
                {/* Urgent */}
                <div
                  onClick={() => handlePriorityClick("URGENT")}
                  onMouseEnter={() => handlePriorityHover("URGENT")}
                  className={`relative flex-1 flex flex-col items-center gap-2 cursor-pointer transition-transform duration-200 hover:-translate-y-1 p-2 ${
                    activePriority === "URGENT" ? "z-50" : "z-10"
                  }`}
                >
                  <span className="text-xs font-bold text-[#D93025]">{urgentCount}</span>
                  <div
                    className="w-full max-w-[80px] bg-[#D93025] rounded-t-md transition-all duration-500"
                    style={{ height: `${Math.max(10, (urgentCount / totalCount) * 120)}px` }}
                  />
                  <span className="text-[11px] font-bold text-[#4B5563] tracking-tight">Khẩn cấp</span>
                  {activePriority === "URGENT" && renderPriorityPopover("right")}
                </div>

                {/* High */}
                <div
                  onClick={() => handlePriorityClick("HIGH")}
                  onMouseEnter={() => handlePriorityHover("HIGH")}
                  className={`relative flex-1 flex flex-col items-center gap-2 cursor-pointer transition-transform duration-200 hover:-translate-y-1 p-2 ${
                    activePriority === "HIGH" ? "z-50" : "z-10"
                  }`}
                >
                  <span className="text-xs font-bold text-[#F97316]">{highCount}</span>
                  <div
                    className="w-full max-w-[80px] bg-[#F97316] rounded-t-md transition-all duration-500"
                    style={{ height: `${Math.max(10, (highCount / totalCount) * 120)}px` }}
                  />
                  <span className="text-[11px] font-bold text-[#4B5563]">Cao</span>
                  {activePriority === "HIGH" && renderPriorityPopover("right")}
                </div>

                {/* Medium */}
                <div
                  onClick={() => handlePriorityClick("MEDIUM")}
                  onMouseEnter={() => handlePriorityHover("MEDIUM")}
                  className={`relative flex-1 flex flex-col items-center gap-2 cursor-pointer transition-transform duration-200 hover:-translate-y-1 p-2 ${
                    activePriority === "MEDIUM" ? "z-50" : "z-10"
                  }`}
                >
                  <span className="text-xs font-bold text-[#1A73E8]">{mediumCount}</span>
                  <div
                    className="w-full max-w-[80px] bg-[#1A73E8] rounded-t-md transition-all duration-500"
                    style={{ height: `${Math.max(10, (mediumCount / totalCount) * 120)}px` }}
                  />
                  <span className="text-[11px] font-bold text-[#4B5563]">Trung bình</span>
                  {activePriority === "MEDIUM" && renderPriorityPopover("left")}
                </div>

                {/* Low */}
                <div
                  onClick={() => handlePriorityClick("LOW")}
                  onMouseEnter={() => handlePriorityHover("LOW")}
                  className={`relative flex-1 flex flex-col items-center gap-2 cursor-pointer transition-transform duration-200 hover:-translate-y-1 p-2 ${
                    activePriority === "LOW" ? "z-50" : "z-10"
                  }`}
                >
                  <span className="text-xs font-bold text-[#6B7280]">{lowCount}</span>
                  <div
                    className="w-full max-w-[80px] bg-[#6B7280] rounded-t-md transition-all duration-500"
                    style={{ height: `${Math.max(10, (lowCount / totalCount) * 120)}px` }}
                  />
                  <span className="text-[11px] font-bold text-[#4B5563]">Thấp</span>
                  {activePriority === "LOW" && renderPriorityPopover("left")}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* ROW 4: CÂY MINDMAP TIẾN ĐỘ */}
      <SpaceMindmapAndSummaryContainer
        space={space}
        tasks={tasks}
        sprints={sprints}
        members={members}
        currentUser={currentUser}
        onSelectTask={onSelectTask}
      />
    </div>
  );
}
