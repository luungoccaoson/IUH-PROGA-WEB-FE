"use client";

import React from "react";
import { Plus, Sparkles } from "lucide-react";
import { DecomposedTaskItem } from "@/services/ai.service";
import { AiTaskCard } from "./AiTaskCard";

interface AiSprintGroupProps {
  sprintName: string;
  groupIdx: number;
  taskList: { task: DecomposedTaskItem; originalIndex: number }[];
  isChatBoxOpen: boolean;
  targetSprintScope: string;
  isDragOver: boolean;
  existingTaskCount: number;
  availableSprints: string[];
  dateRangeStr?: string;
  sprintDays?: number;
  onChangeDays?: (days: number) => void;
  onOpenChatBox: (sprint: string) => void;
  onOpenAddTask: (sprint: string) => void;
  onOpenEditTask: (index: number) => void;
  onDeleteTask: (index: number) => void;
  onMoveSprint: (index: number, newSprint: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
}

export function AiSprintGroup({
  sprintName,
  groupIdx,
  taskList,
  isChatBoxOpen,
  targetSprintScope,
  isDragOver,
  existingTaskCount,
  availableSprints,
  dateRangeStr,
  sprintDays = 7,
  onChangeDays,
  onOpenChatBox,
  onOpenAddTask,
  onOpenEditTask,
  onDeleteTask,
  onMoveSprint,
  onDragOver,
  onDragLeave,
  onDrop,
}: AiSprintGroupProps) {
  const shortSprintTitle = sprintName.includes(":") ? sprintName.split(":")[0].trim() : sprintName;
  const sprintSubtitle = sprintName.includes(":") ? sprintName.split(":").slice(1).join(":").trim() : "";
  const isSelectedForChat = isChatBoxOpen && targetSprintScope === sprintName;

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs ${
        isDragOver
          ? "border-[#1A73E8] ring-2 ring-[#1A73E8]/20 bg-[#F8FAFC]"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      {/* Sprint Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-gray-50/70 border-b border-gray-100">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#1A73E8]/10 text-[#1A73E8] shrink-0 font-bold text-xs">
            {groupIdx + 1}
          </span>
          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-sm text-[#111827] truncate">
              {shortSprintTitle}
            </h4>
            <p className="text-[11px] text-[#6B7280] truncate">
              {sprintSubtitle}
            </p>
          </div>
          <span className="text-[11px] font-mono text-[#6B7280] bg-gray-100 px-2 py-0.5 rounded-md font-bold shrink-0">
            {taskList.length} tasks
          </span>

          {dateRangeStr && (
            <span className="text-[11px] font-mono text-[#1E40AF] bg-[#EFF6FF] border border-[#BFDBFE] px-2.5 py-0.5 rounded-md font-bold shrink-0">
              📅 {dateRangeStr}
            </span>
          )}

          {onChangeDays && (
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-600 shrink-0">
              <span className="text-gray-400">Thời lượng:</span>
              <select
                value={sprintDays || 7}
                onChange={(e) => onChangeDays(Number(e.target.value))}
                className="px-2 py-0.5 rounded-md border border-gray-300 text-[11px] font-mono font-bold bg-white text-gray-800 shadow-2xs hover:border-[#1A73E8] focus:outline-none"
              >
                <option value={7}>1 tuần (7 ngày) - Chuẩn</option>
                <option value={10}>10 ngày</option>
                <option value={14}>2 tuần (14 ngày)</option>
                <option value={21}>3 tuần (21 ngày)</option>
                <option value={28}>4 tuần (28 ngày)</option>
              </select>
            </div>
          )}
        </div>

        {/* Action buttons: AI Chat & Add Task */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => onOpenChatBox(sprintName)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs ${
              isSelectedForChat
                ? "bg-[#1A73E8] text-white"
                : "bg-[#E8F0FE] hover:bg-[#D2E3FC] text-[#1A73E8] border border-[#D2E3FC]"
            }`}
            title="Đàm thoại với AI để thêm/sửa task trong Sprint này"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Chat AI</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenAddTask(sprintName)}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-[#111827] rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
            title="Thêm Task mới vào Sprint này"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm Task</span>
          </button>
        </div>
      </div>

      {/* Task Cards Grid Layout (2 columns side-by-side) */}
      {taskList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 min-h-[50px]">
          {taskList.map(({ task, originalIndex }) => (
            <AiTaskCard
              key={originalIndex}
              task={task}
              originalIndex={originalIndex}
              taskDisplayNumber={(existingTaskCount || 0) + originalIndex + 1}
              availableSprints={availableSprints}
              onOpenEdit={onOpenEditTask}
              onDelete={onDeleteTask}
              onMoveSprint={onMoveSprint}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-6 border-2 border-dashed border-[#E5E7EB] rounded-xl text-xs text-gray-400 font-mono">
          Kéo thả task vào đây hoặc bấm "Thêm Task"
        </div>
      )}
    </div>
  );
}
