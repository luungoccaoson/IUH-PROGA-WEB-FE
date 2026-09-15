"use client";

import React from "react";
import { CheckCircle2, Edit3, PlusSquare, Calendar, BarChart2, Users, AlertTriangle } from "lucide-react";
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

  return (
    <div className="space-y-6 font-sans">
      {/* ROW 1: 4 Metric Summary Cards (Đưa lên đầu tiên) */}
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
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-2xs space-y-4">
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

          {/* Cảnh báo rủi ro với Tooltip Hover chi tiết */}
          <div className="pt-2 border-t border-[#F3F4F6] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#B91C1C] flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-[#DC2626]" />
                Cảnh báo rủi ro ({riskyTasks.length} hạng mục)
              </span>
              <span className="text-[10px] text-[#9CA3AF] italic">Rê chuột vào để xem chi tiết</span>
            </div>

            {riskyTasks.length === 0 ? (
              <p className="text-xs text-[#15803D] italic bg-[#F0FDF4] p-2 rounded-lg border border-[#DCFCE7]">
                ✓ Tiến độ ổn định, không có rủi ro trễ hạn hay tắc nghẽn.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-0.5">
                {riskyTasks.map((rt) => {
                  const isOverdue = rt.status !== "DONE" && rt.dueDate && rt.dueDate < today;
                  const riskReason = isOverdue
                    ? `Quá hạn (Hạn: ${rt.dueDate})`
                    : rt.riskWarning
                    ? rt.riskWarning
                    : "Mức độ khẩn cấp chưa giải quyết";

                  return (
                    <div
                      key={rt.id}
                      onClick={() => onSelectTask && onSelectTask(rt)}
                      className="group relative inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#FEF2F2] border border-[#FEE2E2] hover:border-[#FCA5A5] cursor-pointer text-xs transition-all"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626] shrink-0" />
                      <span className="font-medium text-[#991B1B] max-w-[140px] truncate">
                        {rt.title}
                      </span>

                      {/* TOOLTIP HIỂN THỊ KHI HOVER */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-30 w-64 p-3 bg-[#1F2937] text-white text-xs rounded-xl shadow-xl border border-gray-700 pointer-events-none">
                        <p className="font-bold text-white text-xs line-clamp-2">{rt.title}</p>
                        <div className="mt-2 space-y-1 text-[11px] text-gray-300">
                          <p><span className="text-gray-400">Mã task:</span> #{rt.id}</p>
                          <p><span className="text-gray-400">Người phụ trách:</span> {rt.assignee?.fullName || rt.suggestedMemberName || "Chưa giao"}</p>
                          <p><span className="text-gray-400">Hạn chót:</span> {rt.dueDate || "Chưa đặt"}</p>
                          <p><span className="text-gray-400">Độ ưu tiên:</span> {rt.priority}</p>
                          <p className="text-[#FCA5A5] font-semibold pt-1 border-t border-gray-700">
                            ⚠ Rủi ro: {riskReason}
                          </p>
                        </div>
                        {/* Mũi tên tooltip */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1F2937]" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Team Workload Capacity Distribution (Replaces Recent Activity) */}
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
              memberWorkloadList.map((item, idx) => {
                const colorClass = [
                  "bg-[#1A73E8]",
                  "bg-[#10B981]",
                  "bg-[#F59E0B]",
                  "bg-[#8B5CF6]",
                  "bg-[#06B6D4]",
                  "bg-[#EC4899]",
                ][idx % 6];

                const getInitials = (text?: string) => {
                  if (!text) return "U";
                  return text.trim().substring(0, 2).toUpperCase();
                };

                return (
                  <div key={item.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#111827] flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#E8F0FE] text-[#1A73E8] font-mono font-bold text-[10px] flex items-center justify-center border border-[#D2E3FC]">
                          {getInitials(item.name)}
                        </div>
                        {item.name}
                      </span>
                      <span className="font-mono text-[#6B7280]">
                        {item.count} tasks ({item.percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-[#E5E7EB] h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`${colorClass} h-full transition-all duration-500 rounded-full`}
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

      {/* ROW 3: Priority Breakdown */}
      <div className="grid grid-cols-1 gap-6">
        {/* Priority Breakdown Bar Chart */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-2xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#111827]">Phân bổ theo độ ưu tiên</h3>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Thống kê mức độ ưu tiên của các công việc được phân bổ trong dự án.
            </p>
          </div>

          <div className="h-44 flex items-end justify-between gap-6 pt-6 px-6 border-b border-[#E5E7EB]">
            {/* Urgent */}
            <div className="flex-1 flex flex-col items-center gap-2">
              <span className="text-xs font-bold text-[#D93025]">{urgentCount}</span>
              <div
                className="w-full max-w-[80px] bg-[#D93025] rounded-t-md transition-all duration-500"
                style={{ height: `${Math.max(10, (urgentCount / totalCount) * 120)}px` }}
              />
              <span className="text-[11px] font-medium text-[#4B5563] tracking-tight">Khẩn cấp</span>
            </div>

            {/* High */}
            <div className="flex-1 flex flex-col items-center gap-2">
              <span className="text-xs font-bold text-[#F97316]">{highCount}</span>
              <div
                className="w-full max-w-[80px] bg-[#F97316] rounded-t-md transition-all duration-500"
                style={{ height: `${Math.max(10, (highCount / totalCount) * 120)}px` }}
              />
              <span className="text-[11px] font-medium text-[#4B5563]">Cao</span>
            </div>

            {/* Medium */}
            <div className="flex-1 flex flex-col items-center gap-2">
              <span className="text-xs font-bold text-[#1A73E8]">{mediumCount}</span>
              <div
                className="w-full max-w-[80px] bg-[#1A73E8] rounded-t-md transition-all duration-500"
                style={{ height: `${Math.max(10, (mediumCount / totalCount) * 120)}px` }}
              />
              <span className="text-[11px] font-medium text-[#4B5563]">Trung bình</span>
            </div>

            {/* Low */}
            <div className="flex-1 flex flex-col items-center gap-2">
              <span className="text-xs font-bold text-[#6B7280]">{lowCount}</span>
              <div
                className="w-full max-w-[80px] bg-[#6B7280] rounded-t-md transition-all duration-500"
                style={{ height: `${Math.max(10, (lowCount / totalCount) * 120)}px` }}
              />
              <span className="text-[11px] font-medium text-[#4B5563]">Thấp</span>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 4: KHUNG TỔNG HỢP (TAB SWITCH: CÂY MINDMAP TIẾN ĐỘ | TÀI LIỆU TÓM TẮT SPACE) */}
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
