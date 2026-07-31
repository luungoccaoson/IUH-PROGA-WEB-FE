"use client";

import React from "react";
import { CheckCircle2, History, Plus, Clock } from "lucide-react";
import { Task } from "@/types";

interface SpaceOverviewTabProps {
  tasks: Task[];
  onViewTasks: () => void;
}

export function SpaceOverviewTab({ tasks, onViewTasks }: SpaceOverviewTabProps) {
  const todoCount = tasks.filter((t) => t.status === "TODO").length;
  const inProgressCount = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const doneCount = tasks.filter((t) => t.status === "DONE").length;
  const totalCount = tasks.length || 1;

  const todoPercent = (todoCount / totalCount) * 100;
  const inProgressPercent = (inProgressCount / totalCount) * 100;
  const donePercent = (doneCount / totalCount) * 100;

  const mockActivities = [
    { id: 1, user: "Son Luu", action: "đã cập nhật trường", target: "status", on: "Task-31: Sửa đổi kiểu dữ liệu Entity", val: "IN_PROGRESS", time: "36 phút trước", type: "UPDATE" },
    { id: 2, user: "Son Luu", action: "đã tạo mới task", target: "Task-32: Tích hợp API Gateway", on: "Sprint 2", val: "TODO", time: "1 giờ trước", type: "CREATE" },
    { id: 3, user: "Duy Dev", action: "đã chuyển trạng thái", target: "status", on: "Task-25: Thiết kế sơ đồ quan hệ DB", val: "DONE", time: "3 giờ trước", type: "STATUS" },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* 4 Metrics cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#F6F5EF] p-5 rounded-2xl border border-[#E5E7EB] space-y-2 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#6B7280]">
              ĐÃ HOÀN THÀNH
            </p>
            <p className="text-3xl font-extrabold text-[#111827] font-sans">
              {doneCount}
            </p>
            <p className="text-[10px] text-[#6B7280]">Tổng số task đã xong</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center border border-[#E5E7EB] text-[#137333]">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#F6F5EF] p-5 rounded-2xl border border-[#E5E7EB] space-y-2 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#6B7280]">
              ĐANG THỰC HIỆN
            </p>
            <p className="text-3xl font-extrabold text-[#111827] font-sans">
              {inProgressCount}
            </p>
            <p className="text-[10px] text-[#6B7280]">Task đang diễn ra</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center border border-[#E5E7EB] text-[#1A73E8]">
            <History className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#F6F5EF] p-5 rounded-2xl border border-[#E5E7EB] space-y-2 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#6B7280]">
              CẦN LÀM
            </p>
            <p className="text-3xl font-extrabold text-[#111827] font-sans">
              {todoCount}
            </p>
            <p className="text-[10px] text-[#6B7280]">Task chờ xử lý</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center border border-[#E5E7EB] text-[#B06000]">
            <Plus className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#F6F5EF] p-5 rounded-2xl border border-[#E5E7EB] space-y-2 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#6B7280]">
              TỔNG SỐ TASK
            </p>
            <p className="text-3xl font-extrabold text-[#111827] font-sans">
              {tasks.length}
            </p>
            <p className="text-[10px] text-[#6B7280]">Trong Space này</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center border border-[#E5E7EB] text-[#D93025]">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Donut Chart & Activity Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Donut representation */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-2xs space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider font-mono">
              Tổng quan trạng thái
            </h3>
            <button
              onClick={onViewTasks}
              className="text-xs font-mono text-[#1A73E8] hover:underline font-bold"
            >
              Xem tất cả công việc
            </button>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-around gap-6 py-4">
            <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#E5E7EB" strokeWidth="4" />
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="4"
                  strokeDasharray={`${donePercent} ${100 - donePercent}`}
                  strokeDashoffset="0"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="4"
                  strokeDasharray={`${inProgressPercent} ${100 - inProgressPercent}`}
                  strokeDashoffset={-donePercent}
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="none"
                  stroke="#6B7280"
                  strokeWidth="4"
                  strokeDasharray={`${todoPercent} ${100 - todoPercent}`}
                  strokeDashoffset={-(donePercent + inProgressPercent)}
                />
              </svg>
              <div className="absolute text-center">
                <p className="text-3xl font-extrabold text-[#111827] font-sans leading-none">
                  {tasks.length}
                </p>
                <p className="text-[10px] text-[#6B7280] font-mono uppercase tracking-wider font-bold mt-1">
                  Tổng cộng
                </p>
              </div>
            </div>

            <div className="space-y-3 font-sans w-full max-w-[200px]">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-semibold text-[#4B5563]">
                  <span className="w-3 h-3 rounded-full bg-[#10B981]" />
                  Đã xong (Done)
                </span>
                <span className="text-xs font-bold text-[#111827]">{doneCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-semibold text-[#4B5563]">
                  <span className="w-3 h-3 rounded-full bg-[#3B82F6]" />
                  Đang làm (In Progress)
                </span>
                <span className="text-xs font-bold text-[#111827]">{inProgressCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-semibold text-[#4B5563]">
                  <span className="w-3 h-3 rounded-full bg-[#6B7280]" />
                  Cần làm (To Do)
                </span>
                <span className="text-xs font-bold text-[#111827]">{todoCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent activity log */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider font-mono">
            Hoạt động gần đây
          </h3>
          <div className="divide-y divide-[#E5E7EB]">
            {mockActivities.map((act) => (
              <div key={act.id} className="py-3 flex items-start gap-3 text-xs">
                <div className="w-7 h-7 rounded-full bg-[#F6F5EF] flex items-center justify-center text-[10px] font-bold text-[#111827] shrink-0 border border-[#E5E7EB]">
                  {act.user.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 space-y-0.5">
                  <p className="text-[#111827]">
                    <span className="font-bold">{act.user}</span> {act.action}{" "}
                    <span className="font-semibold text-[#1A73E8]">{act.on}</span>
                  </p>
                  <p className="text-[10px] text-[#9CA3AF] font-mono">{act.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
