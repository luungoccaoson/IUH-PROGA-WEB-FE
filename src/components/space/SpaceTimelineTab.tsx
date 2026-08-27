"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronRight, ChevronDown, CheckSquare, Search, Filter, Calendar } from "lucide-react";
import { Task, Sprint } from "@/types";

interface SpaceTimelineTabProps {
  sprints?: Sprint[];
  tasks: Task[];
  members?: any[];
  spaceName?: string;
  onSelectTask?: (task: Task) => void;
}

type ViewMode = "Weeks" | "Months";

interface RealWeekBlock {
  monthLabel: string;
  days: number[];
  startDate: Date;
  endDate: Date;
}

export function SpaceTimelineTab({
  sprints = [],
  tasks = [],
  members = [],
  spaceName = "",
  onSelectTask,
}: SpaceTimelineTabProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("Weeks");
  const [searchTerm, setSearchTerm] = useState("");
  // COLLAPSED BY DEFAULT: User clicks to expand each Sprint!
  const [openSprints, setOpenSprints] = useState<Record<string, boolean>>({});

  const timelineContainerRef = useRef<HTMLDivElement>(null);

  // Group tasks by Sprint
  const sprintTaskMap: Record<string, { sprintObj?: Sprint; name: string; tasks: Task[] }> = {};

  sprints.forEach((s) => {
    sprintTaskMap[s.id.toString()] = {
      sprintObj: s,
      name: s.name,
      tasks: [],
    };
  });

  const backlogKey = "backlog";
  sprintTaskMap[backlogKey] = {
    name: "Công việc tồn đọng (Backlog)",
    tasks: [],
  };

  tasks.forEach((t) => {
    if (t.sprintId && sprintTaskMap[t.sprintId.toString()]) {
      sprintTaskMap[t.sprintId.toString()].tasks.push(t);
    } else if (t.sprintName) {
      const foundEntry = Object.values(sprintTaskMap).find(
        (entry) => entry.name.toLowerCase() === t.sprintName?.toLowerCase()
      );
      if (foundEntry) {
        foundEntry.tasks.push(t);
      } else {
        sprintTaskMap[t.sprintName] = {
          name: t.sprintName,
          tasks: [t],
        };
      }
    } else {
      sprintTaskMap[backlogKey].tasks.push(t);
    }
  });

  // Map task IDs to 1-based sequential indices in the Space (Task-1, Task-2, ..., Task-22)
  const taskSeqMap = new Map<number | string, number>();
  tasks.forEach((t, index) => {
    if (t.id) {
      taskSeqMap.set(t.id, index + 1);
    }
  });

  const activeSprintEntries = Object.entries(sprintTaskMap).filter(
    ([key, entry]) => entry.tasks.length > 0 || (key !== backlogKey && sprints.some((s) => s.id.toString() === key))
  );

  const toggleSprint = (key: string) => {
    setOpenSprints((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const getShortSprint = (fullSprintName: string) => {
    const match = fullSprintName.match(/^(Sprint\s*\d+)/i);
    return match ? match[1] : fullSprintName;
  };

  const renderStatusBadge = (status: string) => {
    if (status === "DONE") {
      return (
        <span className="px-2 py-0.5 bg-[#E6F4EA] text-[#137333] border border-[#CEE7D4] text-[11px] font-bold rounded-md flex items-center gap-1 shrink-0">
          Đã xong <ChevronDown className="w-3 h-3 text-[#137333]" />
        </span>
      );
    }
    if (status === "IN_PROGRESS") {
      return (
        <span className="px-2 py-0.5 bg-[#E8F0FE] text-[#1A73E8] border border-[#D2E3FC] text-[11px] font-bold rounded-md flex items-center gap-1 shrink-0">
          Đang làm <ChevronDown className="w-3 h-3 text-[#1A73E8]" />
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 bg-[#F1F3F4] text-[#5F6368] border border-[#DADCE0] text-[11px] font-bold rounded-md flex items-center gap-1 shrink-0">
        Cần làm <ChevronDown className="w-3 h-3 text-[#5F6368]" />
      </span>
    );
  };

  const getTaskBarColor = (status: string) => {
    if (status === "DONE") return "bg-[#70B500] hover:bg-[#5C9400]";
    if (status === "IN_PROGRESS") return "bg-[#1A73E8] hover:bg-[#1557B0]";
    return "bg-[#6B7280] hover:bg-[#4B5563]";
  };

  // Generate 52 REAL CALENDAR WEEKS (Monday -> Sunday) for 2026 in Vietnamese
  const generateRealCalendarWeeks = (): RealWeekBlock[] => {
    const weeks: RealWeekBlock[] = [];
    // Start Monday Jan 5, 2026
    let currentMonday = new Date(2026, 0, 5);

    for (let i = 0; i < 52; i++) {
      const mon = new Date(currentMonday);
      const sun = new Date(currentMonday.getTime() + 6 * 24 * 60 * 60 * 1000);

      const days: number[] = [];
      for (let d = 0; d < 7; d++) {
        const dateObj = new Date(mon.getTime() + d * 24 * 60 * 60 * 1000);
        days.push(dateObj.getDate());
      }

      const monMonth = mon.getMonth() + 1;
      const sunMonth = sun.getMonth() + 1;

      let monthLabel = `Thg ${monMonth}`;
      if (monMonth !== sunMonth) {
        monthLabel = `Thg ${monMonth} / Thg ${sunMonth}`;
      }

      weeks.push({
        monthLabel,
        days,
        startDate: mon,
        endDate: sun,
      });

      // Next Monday
      currentMonday = new Date(currentMonday.getTime() + 7 * 24 * 60 * 60 * 1000);
    }

    return weeks;
  };

  const realCalendarWeeks = generateRealCalendarWeeks();
  const yearStartMonday = realCalendarWeeks[0].startDate;

  // Position calculation for 52 Real Calendar Weeks (Monday -> Sunday)
  const calculateRealWeekPosition = (task: Task, sprintObj?: Sprint) => {
    let dateStr = task.startDate || sprintObj?.startDate || task.createdAt;
    if (!dateStr) return null;

    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;

    let endDateObj: Date;
    let durationDays: number;

    if (task.dueDate) {
      const dueD = new Date(task.dueDate);
      if (!isNaN(dueD.getTime()) && dueD >= d) {
        endDateObj = dueD;
        const diffMs = dueD.getTime() - d.getTime();
        durationDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
        if (durationDays === 0) durationDays = 1;
      } else {
        durationDays = task.estimatedDays || 3;
        endDateObj = new Date(d.getTime() + (durationDays - 1) * 24 * 60 * 60 * 1000);
      }
    } else {
      durationDays = task.estimatedDays || 3;
      endDateObj = new Date(d.getTime() + (durationDays - 1) * 24 * 60 * 60 * 1000);
    }

    const diffMs = d.getTime() - yearStartMonday.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    const dayColWidth = 30; // 30px per day, 210px per 7-day week
    const leftPx = Math.max(0, diffDays * dayColWidth);
    const barWidthPx = Math.max(35, durationDays * dayColWidth);

    const startDateFormatted = d.toLocaleDateString("vi-VN");
    const endDateFormatted = endDateObj.toLocaleDateString("vi-VN");

    return { leftPx, barWidthPx, startDateFormatted, endDateFormatted, durationDays };
  };

  // 12 Months Data
  const monthsData = [
    { name: "Thg 1", daysCount: 31 },
    { name: "Thg 2", daysCount: 28 },
    { name: "Thg 3", daysCount: 31 },
    { name: "Thg 4", daysCount: 30 },
    { name: "Thg 5", daysCount: 31 },
    { name: "Thg 6", daysCount: 30 },
    { name: "Thg 7", daysCount: 31 },
    { name: "Thg 8", daysCount: 31 },
    { name: "Thg 9", daysCount: 30 },
    { name: "Thg 10", daysCount: 31 },
    { name: "Thg 11", daysCount: 30 },
    { name: "Thg 12", daysCount: 31 },
  ];

  const calculateMonthPosition = (task: Task, sprintObj?: Sprint) => {
    let dateStr = task.startDate || sprintObj?.startDate || task.createdAt;
    if (!dateStr) return null;

    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;

    let endDateObj: Date;
    let durationDays: number;

    if (task.dueDate) {
      const dueD = new Date(task.dueDate);
      if (!isNaN(dueD.getTime()) && dueD >= d) {
        endDateObj = dueD;
        const diffMs = dueD.getTime() - d.getTime();
        durationDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
        if (durationDays === 0) durationDays = 1;
      } else {
        durationDays = task.estimatedDays || 3;
        endDateObj = new Date(d.getTime() + (durationDays - 1) * 24 * 60 * 60 * 1000);
      }
    } else {
      durationDays = task.estimatedDays || 3;
      endDateObj = new Date(d.getTime() + (durationDays - 1) * 24 * 60 * 60 * 1000);
    }

    const monthIndex = d.getMonth();
    const day = d.getDate();

    const colWidth = 200;
    const leftPx = monthIndex * colWidth + Math.round(((day - 1) / 31) * colWidth);
    const barWidthPx = Math.max(40, Math.min(300, durationDays * 14));

    const startDateFormatted = d.toLocaleDateString("vi-VN");
    const endDateFormatted = endDateObj.toLocaleDateString("vi-VN");

    return { leftPx, barWidthPx, startDateFormatted, endDateFormatted, durationDays };
  };

  // AUTO-FOCUS / AUTO-SCROLL to the position of the first active timeline bar on mount!
  useEffect(() => {
    if (!timelineContainerRef.current) return;

    let minLeftPx = Infinity;
    tasks.forEach((t) => {
      const pos = viewMode === "Weeks" ? calculateRealWeekPosition(t) : calculateMonthPosition(t);
      if (pos && pos.leftPx < minLeftPx) {
        minLeftPx = pos.leftPx;
      }
    });

    if (minLeftPx !== Infinity && minLeftPx > 100) {
      timelineContainerRef.current.scrollLeft = minLeftPx - 100;
    }
  }, [tasks, viewMode]);

  return (
    <div className="space-y-4 font-sans animate-in fade-in duration-200">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-1">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#6B7280]" />
            <input
              type="text"
              placeholder="Tìm kiếm công việc..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-1.5 bg-white border border-[#D1D5DB] rounded-lg text-xs font-medium text-[#111827] focus:outline-none focus:border-[#1A73E8] w-64 shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-1 bg-white border border-[#D1D5DB] p-1 rounded-xl shadow-2xs text-xs font-bold font-sans">
            <button
              onClick={() => setViewMode("Weeks")}
              className={`px-3 py-1 rounded-lg transition-all ${viewMode === "Weeks" ? "bg-[#111827] text-white" : "text-[#4B5563] hover:bg-gray-100"
                }`}
            >
              Lọc theo Tuần
            </button>
            <button
              onClick={() => setViewMode("Months")}
              className={`px-3 py-1 rounded-lg transition-all ${viewMode === "Months" ? "bg-[#111827] text-white" : "text-[#4B5563] hover:bg-gray-100"
                }`}
            >
              Lọc theo Tháng
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-[#6B7280]">
          <Calendar className="w-4 h-4 text-[#1A73E8]" />
          <span>Tổng số: <strong className="text-[#111827]">{tasks.length} tasks</strong></span>
        </div>
      </div>

      {/* Main Scrollable Gantt Timeline Container */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-2xs overflow-hidden relative">
        <div ref={timelineContainerRef} className="flex overflow-x-auto">

          {/* LEFT SIDE: Task Details Table (Fixed Width: 440px) */}
          <div className="w-[440px] shrink-0 border-r border-[#E5E7EB] bg-white z-20 select-none sticky left-0 shadow-xs">
            {/* Header 1 */}
            <div className="h-16 border-b border-[#E5E7EB] px-4 flex items-center justify-between text-xs font-bold text-[#5F6368] bg-[#FAFAFA]">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-[#6B7280]" />
                <span className="uppercase tracking-wider font-mono">Công việc / Sprints</span>
              </div>
              <div className="flex items-center gap-10 pr-4 font-mono uppercase text-[11px]">
                <span>Trạng thái</span>
                <span>Người phụ trách</span>
              </div>
            </div>

            {/* Sprint Accordions List (COLLAPSED BY DEFAULT - Click to expand!) */}
            <div className="divide-y divide-[#E5E7EB]">
              {activeSprintEntries.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#9CA3AF] italic">Chưa có dữ liệu Sprint trong Space.</div>
              ) : (
                activeSprintEntries.map(([sKey, sEntry]) => {
                  const isExpanded = openSprints[sKey] === true;
                  const sTasks = sEntry.tasks;

                  return (
                    <div key={sKey} className="divide-y divide-[#E5E7EB]">
                      {/* Sprint Header Row */}
                      <div
                        onClick={() => toggleSprint(sKey)}
                        className="px-4 py-2.5 bg-[#F9FAFB] hover:bg-[#F3F4F6] border-b border-[#E5E7EB] flex items-center justify-between text-xs font-bold text-[#111827] cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-[#6B7280] shrink-0" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-[#6B7280] shrink-0" />
                          )}
                          <span className="text-[#1A73E8] font-mono text-[11px] font-bold shrink-0">
                            {getShortSprint(sEntry.name)}
                          </span>
                          <span className="truncate font-semibold">{sEntry.name}</span>
                        </div>
                        <span className="text-[10px] font-mono text-[#6B7280] bg-white px-2 py-0.5 rounded border border-[#E5E7EB] shrink-0">
                          {sTasks.length} tasks
                        </span>
                      </div>

                      {/* Tasks under this Sprint (Hidden until expanded) */}
                      {isExpanded &&
                        sTasks.map((t, idx) => {
                          const assignedMember = members.find((m) => {
                            const mId = m.id?.userId || m.userId || m.id;
                            return mId === t.ownerId || mId === t.assignee?.id;
                          });

                          const assigneeName = assignedMember
                            ? (assignedMember.user?.fullName || assignedMember.user?.email || assignedMember.fullName || assignedMember.email)
                            : t.ownerName || t.assignee?.fullName || t.suggestedMemberName || "Chưa gán";

                          const assigneeAvatar = assignedMember?.avatarUrl || assignedMember?.user?.avatarUrl;
                          const initials = assigneeName.trim().substring(0, 2).toUpperCase();
                          const seqNum = (t.id ? taskSeqMap.get(t.id) : null) || idx + 1;
                          const taskKey = `Task-${seqNum}`;
                          const isDone = t.status === "DONE";

                          return (
                            <div
                              key={t.id || idx}
                              onClick={() => onSelectTask && onSelectTask(t)}
                              className="h-10 px-4 pl-7 flex items-center justify-between hover:bg-[#F3F4F6] text-xs transition-colors cursor-pointer"
                            >
                              <div className="flex items-center gap-2 truncate pr-2">
                                <input
                                  type="checkbox"
                                  checked={isDone}
                                  readOnly
                                  className="rounded border-gray-300 text-[#1A73E8] shrink-0"
                                />
                                <span className="text-[#1A73E8] font-mono text-[11px] font-bold hover:underline shrink-0">
                                  {taskKey}
                                </span>
                                <span className={`truncate font-medium ${isDone ? "line-through text-[#9CA3AF]" : "text-[#111827]"}`}>
                                  {t.title}
                                </span>
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                {renderStatusBadge(t.status)}

                                <div className="w-28 flex items-center gap-1.5 text-[11px] text-[#374151] truncate">
                                  {assigneeName !== "Chưa gán" ? (
                                    <div className="w-5 h-5 rounded-full bg-[#E8F0FE] text-[#1A73E8] font-mono font-bold text-[9px] flex items-center justify-center shrink-0 border border-[#D2E3FC]">
                                      {initials}
                                    </div>
                                  ) : (
                                    <div className="w-5 h-5 rounded-full bg-gray-100 text-gray-400 font-mono font-bold text-[9px] flex items-center justify-center shrink-0 border border-gray-200">
                                      ?
                                    </div>
                                  )}
                                  <span className="truncate font-medium">{assigneeName}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT SIDE: Horizontally Scrollable Timeline Grid */}
          <div className="shrink-0 bg-white relative select-none">
            {viewMode === "Months" ? (
              /* MONTHS MODE (Width: 2400px - 200px/Month) */
              <div className="w-[2400px] relative">
                {/* Header 12 Months */}
                <div className="h-16 border-b border-[#E5E7EB] bg-[#FAFAFA] flex items-center text-[11px] font-bold text-[#5F6368] font-mono divide-x divide-[#E5E7EB]">
                  {monthsData.map((m, mIdx) => (
                    <div key={m.name} className={`flex-1 text-center py-5 ${mIdx % 2 === 1 ? "bg-[#F9FAFB]" : ""}`}>
                      {m.name}
                    </div>
                  ))}
                </div>

                {/* Vertical Continuous Border Lines Overlay for Months */}
                <div className="absolute top-16 bottom-0 left-0 right-0 flex pointer-events-none divide-x divide-[#E5E7EB]">
                  {monthsData.map((m) => (
                    <div key={m.name} className="flex-1 h-full" />
                  ))}
                </div>

                {/* Timeline Grid Bars Grouped by Sprint */}
                <div className="divide-y divide-[#E5E7EB] relative">
                  {activeSprintEntries.map(([sKey, sEntry]) => {
                    const sTasks = sEntry.tasks;
                    const isExpanded = openSprints[sKey] === true;

                    return (
                      <div key={sKey} className="divide-y divide-[#E5E7EB]">
                        {/* Sprint Placeholder Row */}
                        <div className="h-9 bg-[#F9FAFB] px-4 flex items-center">
                          <div className="w-full h-2 bg-[#D1D5DB] rounded-full opacity-40" />
                        </div>

                        {/* Tasks Bars */}
                        {isExpanded &&
                          sTasks.map((t, idx) => {
                            const pos = calculateMonthPosition(t, sEntry.sprintObj);
                            const barColor = getTaskBarColor(t.status);

                            return (
                              <div key={t.id || idx} className="h-10 relative flex items-center px-4">
                                {pos ? (
                                  <div
                                    className={`h-5 rounded-md ${barColor} transition-all shadow-2xs relative cursor-pointer group z-10`}
                                    style={{
                                      marginLeft: `${pos.leftPx}px`,
                                      width: `${pos.barWidthPx}px`,
                                    }}
                                    onClick={() => onSelectTask && onSelectTask(t)}
                                  >
                                    <div className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 hidden group-hover:block bg-[#111827] text-white text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg shadow-xl whitespace-nowrap z-30">
                                      🔄 {pos.startDateFormatted} - 🔄 {pos.endDateFormatted} ({pos.durationDays} ngày)
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-[10px] font-mono text-[#9CA3AF] italic ml-4">
                                    Chưa chọn mốc ngày bắt đầu
                                  </span>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* REAL CALENDAR WEEKS MODE (Monday -> Sunday) (Width: 10920px - 210px / 7-Day Week) */
              <div className="w-[10920px] relative">
                {/* Header 1 & 2: 52 Real Calendar Weeks (Monday -> Sunday) matching Screenshot */}
                <div className="flex divide-x divide-[#D1D5DB]">
                  {realCalendarWeeks.map((wb, wbIdx) => (
                    <div key={wbIdx} className="w-[210px] shrink-0 font-mono text-center">
                      {/* Top Month / Transition Month Label (e.g. "Thg 4 / Thg 5") */}
                      <div className="h-8 border-b border-[#E5E7EB] bg-[#FAFAFA] text-[11px] font-bold text-[#5F6368] py-1 truncate px-1">
                        {wb.monthLabel}
                      </div>
                      {/* Day Numbers Row for Mon -> Sun (e.g. 27 28 29 30 1 2 3) */}
                      <div className="h-8 border-b border-[#E5E7EB] bg-[#F9FAFB] flex divide-x divide-[#E5E7EB]/40 text-[10px] font-semibold text-[#6B7280]">
                        {wb.days.map((d, dIdx) => (
                          <div key={dIdx} className="w-[30px] py-1 text-center">
                            {d}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* CONTINUOUS VERTICAL BORDER LINES EXTENDING ALL THE WAY DOWN THE GRID */}
                <div className="absolute top-16 bottom-0 left-0 right-0 flex divide-x divide-[#D1D5DB] pointer-events-none">
                  {realCalendarWeeks.map((wb, wbIdx) => (
                    <div key={wbIdx} className="w-[210px] shrink-0 h-full" />
                  ))}
                </div>

                {/* Timeline Grid Bars Grouped by Sprint */}
                <div className="divide-y divide-[#E5E7EB] relative">
                  {activeSprintEntries.map(([sKey, sEntry]) => {
                    const sTasks = sEntry.tasks;
                    const isExpanded = openSprints[sKey] === true;

                    return (
                      <div key={sKey} className="divide-y divide-[#E5E7EB]">
                        {/* Sprint Placeholder Row */}
                        <div className="h-9 bg-[#F9FAFB] px-4 flex items-center">
                          <div className="w-full h-2 bg-[#D1D5DB] rounded-full opacity-40" />
                        </div>

                        {/* Tasks Bars */}
                        {isExpanded &&
                          sTasks.map((t, idx) => {
                            const pos = calculateRealWeekPosition(t, sEntry.sprintObj);
                            const barColor = getTaskBarColor(t.status);

                            return (
                              <div key={t.id || idx} className="h-10 relative flex items-center px-4">
                                {pos ? (
                                  <div
                                    className={`h-5 rounded-md ${barColor} transition-all shadow-2xs relative cursor-pointer group z-10`}
                                    style={{
                                      marginLeft: `${pos.leftPx}px`,
                                      width: `${pos.barWidthPx}px`,
                                    }}
                                    onClick={() => onSelectTask && onSelectTask(t)}
                                  >
                                    {/* Hover Tooltip */}
                                    <div className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 hidden group-hover:block bg-[#111827] text-white text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg shadow-xl whitespace-nowrap z-30">
                                      🔄 {pos.startDateFormatted} - 🔄 {pos.endDateFormatted} ({pos.durationDays} ngày)
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-[10px] font-mono text-[#9CA3AF] italic ml-4">
                                    Chưa chọn mốc ngày bắt đầu
                                  </span>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
