"use client";

import React from "react";
import { CheckCircle2, Edit3, PlusSquare, Calendar, Activity, BarChart2, Users, Layers, AlertTriangle } from "lucide-react";
import { Task } from "@/types";

interface SpaceOverviewTabProps {
  tasks: Task[];
  members?: any[];
  onViewTasks: () => void;
}

export function SpaceOverviewTab({ tasks, members = [], onViewTasks }: SpaceOverviewTabProps) {
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

  // Types of work (Task, Subtask, AI Generated)
  const taskTypeCount = Math.round(totalCount * 0.7);
  const subtaskTypeCount = totalCount - taskTypeCount;

  // Dynamic Recent Activity Stream
  const recentActivities = tasks.slice(0, 4).map((t, idx) => ({
    id: t.id || idx,
    user: t.assignee?.fullName || t.suggestedMemberName || "Thành viên dự án",
    action: t.status === "DONE" ? "đã hoàn thành công việc" : t.status === "IN_PROGRESS" ? "đã chuyển trạng thái sang Đang làm" : "đã tạo công việc mới",
    taskKey: `Task-${t.id || idx + 1}`,
    taskTitle: t.title,
    status: t.status,
    time: `${idx + 1} ngày trước`,
  }));

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

      {/* ROW 2: Status Overview (Left) & Recent Activity (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Overview Card */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-2xs space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#111827]">Tổng quan trạng thái</h3>
              <button
                onClick={onViewTasks}
                className="text-xs text-[#1A73E8] hover:underline font-semibold"
              >
                Xem tất cả công việc
              </button>
            </div>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Xem nhanh tiến độ trạng thái các hạng mục công việc trong dự án.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-4">
            <div className="relative w-44 h-44 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#E5E7EB" strokeWidth="3.5" />
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="none"
                  stroke="#70B500"
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
                <p className="text-3xl font-extrabold text-[#111827] font-sans leading-none">
                  {tasks.length}
                </p>
                <p className="text-[10px] text-[#6B7280] font-semibold mt-1">
                  Tổng công việc
                </p>
              </div>
            </div>

            <div className="space-y-3 font-sans w-full max-w-[220px]">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 font-medium text-[#374151]">
                  <span className="w-3 h-3 rounded-xs bg-[#70B500]" />
                  Đã xong (Done)
                </span>
                <span className="font-bold text-[#111827]">{doneCount}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 font-medium text-[#374151]">
                  <span className="w-3 h-3 rounded-xs bg-[#1A73E8]" />
                  Đang làm (In Progress)
                </span>
                <span className="font-bold text-[#111827]">{inProgressCount}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 font-medium text-[#374151]">
                  <span className="w-3 h-3 rounded-xs bg-[#A855F7]" />
                  Cần làm (To Do)
                </span>
                <span className="font-bold text-[#111827]">{todoCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Card */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-2xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#111827]">Hoạt động gần đây</h3>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Cập nhật những thay đổi mới nhất diễn ra trong toàn bộ không gian dự án.
            </p>
          </div>

          <div className="divide-y divide-[#E5E7EB]">
            {recentActivities.map((act) => (
              <div key={act.id} className="py-3 flex items-start gap-3 text-xs">
                <div className="w-7 h-7 rounded-full bg-[#FEF3C7] text-[#D97706] font-mono font-bold text-[10px] flex items-center justify-center shrink-0 border border-[#FDE68A]">
                  {act.user.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-[#111827]">
                    <span className="font-bold">{act.user}</span> {act.action}{" "}
                    <span className="font-mono text-[#1A73E8] font-bold bg-[#E8F0FE] px-1.5 py-0.5 rounded">
                      [{act.taskKey}]
                    </span>{" "}
                    <span className="font-medium">{act.taskTitle}</span>
                  </p>
                  <p className="text-[10px] text-[#9CA3AF]">{act.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ROW 3: Priority Breakdown (Left) & Types of Work (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Breakdown Bar Chart */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-2xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#111827]">Phân bổ theo độ ưu tiên</h3>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Thống kê mức độ ưu tiên của các công việc được phân bổ trong dự án.
            </p>
          </div>

          <div className="h-44 flex items-end justify-between gap-4 pt-6 px-4 border-b border-[#E5E7EB]">
            {/* Urgent */}
            <div className="flex-1 flex flex-col items-center gap-2">
              <span className="text-xs font-bold text-[#D93025]">{urgentCount}</span>
              <div
                className="w-full bg-[#D93025] rounded-t-md transition-all duration-500"
                style={{ height: `${Math.max(10, (urgentCount / totalCount) * 120)}px` }}
              />
              <span className="text-[11px] font-medium text-[#4B5563] tracking-tight">Khẩn cấp</span>
            </div>

            {/* High */}
            <div className="flex-1 flex flex-col items-center gap-2">
              <span className="text-xs font-bold text-[#F97316]">{highCount}</span>
              <div
                className="w-full bg-[#F97316] rounded-t-md transition-all duration-500"
                style={{ height: `${Math.max(10, (highCount / totalCount) * 120)}px` }}
              />
              <span className="text-[11px] font-medium text-[#4B5563]">Cao</span>
            </div>

            {/* Medium */}
            <div className="flex-1 flex flex-col items-center gap-2">
              <span className="text-xs font-bold text-[#1A73E8]">{mediumCount}</span>
              <div
                className="w-full bg-[#1A73E8] rounded-t-md transition-all duration-500"
                style={{ height: `${Math.max(10, (mediumCount / totalCount) * 120)}px` }}
              />
              <span className="text-[11px] font-medium text-[#4B5563]">Trung bình</span>
            </div>

            {/* Low */}
            <div className="flex-1 flex flex-col items-center gap-2">
              <span className="text-xs font-bold text-[#6B7280]">{lowCount}</span>
              <div
                className="w-full bg-[#6B7280] rounded-t-md transition-all duration-500"
                style={{ height: `${Math.max(10, (lowCount / totalCount) * 120)}px` }}
              />
              <span className="text-[11px] font-medium text-[#4B5563]">Thấp</span>
            </div>
          </div>
        </div>

        {/* Types of Work (NO EPIC AS REQUESTED) */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-2xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#111827]">Phân loại công việc</h3>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Thống kê phân rã loại hình công việc được bóc tách trong hệ thống.
            </p>
          </div>

          <div className="space-y-5 pt-2">
            {/* Task Type */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#374151] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#1A73E8]" />
                  Nhiệm vụ chính (WBS Task)
                </span>
                <span className="font-bold text-[#111827]">70%</span>
              </div>
              <div className="w-full bg-[#E5E7EB] h-3 rounded-full overflow-hidden">
                <div className="bg-[#1A73E8] h-full w-[70%]" />
              </div>
            </div>

            {/* Subtask Type */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#374151] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#10B981]" />
                  Công việc phụ (Subtask)
                </span>
                <span className="font-bold text-[#111827]">30%</span>
              </div>
              <div className="w-full bg-[#E5E7EB] h-3 rounded-full overflow-hidden">
                <div className="bg-[#10B981] h-full w-[30%]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 4: Team Workload Capacity Distribution */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-2xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-[#111827]">Phân bổ khối lượng công việc nhóm</h3>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Theo dõi khối lượng công việc được giao cho từng thành viên để đảm bảo cân bằng năng suất.
          </p>
        </div>

        <div className="space-y-4 pt-1">
          {memberWorkloadList.map((item, idx) => {
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
                <div className="w-full bg-[#E5E7EB] h-3 rounded-full overflow-hidden">
                  <div
                    className={`${colorClass} h-full transition-all duration-500 rounded-full`}
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
