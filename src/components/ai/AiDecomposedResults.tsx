"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle2, Clock, PlusCircle, RefreshCw, FolderPlus, ArrowRight } from "lucide-react";
import { TaskDecompositionResponse, DecomposedTaskItem } from "@/services/ai.service";
import { Space } from "@/types";
import { TargetMode } from "./AiHeaderBanner";

interface AiDecomposedResultsProps {
  result: TaskDecompositionResponse;
  targetMode: TargetMode;
  selectedSpace?: Space;
  newSpaceName: string;
  workspaceId: number;
  selectedSpaceId: number | null;
  createdSpaceId: number | null;
  onImportTasks: () => void;
  importing: boolean;
  importSuccess: boolean;
}

export function AiDecomposedResults({
  result,
  targetMode,
  selectedSpace,
  newSpaceName,
  workspaceId,
  selectedSpaceId,
  createdSpaceId,
  onImportTasks,
  importing,
  importSuccess,
}: AiDecomposedResultsProps) {
  // Group tasks by Sprint
  const groupedTasks: Record<string, DecomposedTaskItem[]> = {};
  if (result?.tasks) {
    result.tasks.forEach((t) => {
      const sprintName = t.sprint || "Sprint 1";
      if (!groupedTasks[sprintName]) groupedTasks[sprintName] = [];
      groupedTasks[sprintName].push(t);
    });
  }

  const getPriorityBadgeStyle = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-[#FCE8E6] text-[#D93025] border-[#FADBD8]";
      case "HIGH":
        return "bg-[#FEF7E0] text-[#B06000] border-[#FEEFC3]";
      case "MEDIUM":
        return "bg-[#E8F0FE] text-[#1A73E8] border-[#D2E3FC]";
      default:
        return "bg-[#E6F4EA] text-[#137333] border-[#CEEAD6]";
    }
  };

  const targetSpaceId = targetMode === "NEW_SPACE" ? createdSpaceId : selectedSpaceId;

  return (
    <div className="space-y-6 font-sans animate-in fade-in duration-300">
      {/* Summary Card */}
      <div className="bg-[#F0F7FF] border border-[#D2E3FC] p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#1A73E8]">
            <CheckCircle2 className="w-4 h-4" />
            Kết Quả Phân Rã Bài Toán Bằng RAG AI Agent
          </div>
          <h3 className="text-base font-extrabold text-[#111827]">{result.summary}</h3>
          <p className="text-xs text-[#4B5563]">
            Tổng số: <strong className="text-[#111827]">{result.tasks.length} tasks</strong> phân chia theo {Object.keys(groupedTasks).length} Sprint.
          </p>
        </div>

        {/* Action Import Button */}
        <div className="space-y-2 text-left md:text-right shrink-0">
          <button
            onClick={onImportTasks}
            disabled={importing || importSuccess}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-60 text-white ${
              targetMode === "NEW_SPACE"
                ? "bg-[#10B981] hover:bg-[#059669]"
                : "bg-[#137333] hover:bg-[#0D652D]"
            }`}
          >
            {importing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                {targetMode === "NEW_SPACE" ? "Đang khởi tạo Space Mới & Nạp Task..." : "Đang nạp Task vào Space..."}
              </>
            ) : importSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-[#A8DAB5]" />
                {targetMode === "NEW_SPACE" ? "Đã Khởi Tạo & Nạp Thành Công!" : "Đã nạp thành công!"}
              </>
            ) : targetMode === "NEW_SPACE" ? (
              <>
                <FolderPlus className="w-4 h-4" />
                🚀 Khởi Tạo Dự Án Mới & Nạp Tasks
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                Nạp Tasks Vào Space: {selectedSpace?.name}
              </>
            )}
          </button>

          {importSuccess && (
            <div className="space-y-1">
              <p className="text-[11px] text-[#137333] font-bold">
                {targetMode === "NEW_SPACE"
                  ? `Đã khởi tạo Dự Án "${newSpaceName}" thành công!`
                  : "Đã nạp tất cả Task vào Space!"}
              </p>
              {targetSpaceId && (
                <Link
                  href={`/workspaces/${workspaceId}/spaces/${targetSpaceId}`}
                  className="text-xs text-[#1A73E8] hover:underline font-bold flex items-center justify-end gap-1"
                >
                  👉 Chuyển Tới Bảng Kanban Của Dự Án <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Grouped Tasks By Sprint */}
      <div className="space-y-6">
        {Object.entries(groupedTasks).map(([sprintName, taskList], groupIdx) => (
          <div key={groupIdx} className="bg-white border border-[#E5E7EB] rounded-2xl p-5 space-y-4 shadow-2xs">
            {/* Sprint Group Title */}
            <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3">
              <div className="w-7 h-7 rounded-lg bg-[#111827] text-white flex items-center justify-center font-mono font-bold text-xs">
                S{groupIdx + 1}
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-[#111827]">{sprintName}</h4>
                <p className="text-[11px] text-[#6B7280]">Bao gồm {taskList.length} hạng mục công việc</p>
              </div>
            </div>

            {/* Tasks List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {taskList.map((task, taskIdx) => (
                <div
                  key={taskIdx}
                  className="p-4 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] hover:border-[#111827] transition-all space-y-2.5 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h5 className="font-extrabold text-sm text-[#111827] leading-snug">
                      {task.title}
                    </h5>
                    <span
                      className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md border shrink-0 ${getPriorityBadgeStyle(
                        task.priority
                      )}`}
                    >
                      {task.priority}
                    </span>
                  </div>

                  <p className="text-xs text-[#4B5563] leading-relaxed line-clamp-3">
                    {task.description}
                  </p>

                  <div className="flex items-center justify-between text-[11px] font-mono text-[#6B7280] pt-1 border-t border-[#E5E7EB]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#111827]" />
                      Ước tính: {task.estimatedDays || 2} ngày
                    </span>
                    <span className="text-[#137333] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Ready for Dev
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
