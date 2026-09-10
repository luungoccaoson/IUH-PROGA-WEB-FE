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
  onOpenChatBox,
  onOpenAddTask,
  onOpenEditTask,
  onDeleteTask,
  onMoveSprint,
  onDragOver,
  onDragLeave,
  onDrop,
}: AiSprintGroupProps) {
  const isSelectedForChat = isChatBoxOpen && targetSprintScope === sprintName;

  const shortSprintTitle = sprintName.includes(":") ? sprintName.split(":")[0].trim() : sprintName;
  const sprintSubtitle = sprintName.includes(":") ? sprintName.split(":")[1].trim() : "Giai đoạn phát triển";

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`bg-white border rounded-2xl p-4 space-y-3 shadow-2xs transition-all font-sans ${
        isDragOver
          ? "border-[#1A73E8] bg-[#F0F7FF] ring-2 ring-[#1A73E8]/30"
          : isSelectedForChat
          ? "border-[#1A73E8] ring-1 ring-[#1A73E8]/40 shadow-xs"
          : "border-[#E5E7EB]"
      }`}
    >
      {/* Sprint Group Title Header */}
      <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3 gap-2 flex-wrap">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-7 h-7 rounded-lg bg-[#111827] text-white flex items-center justify-center font-mono font-bold text-xs shrink-0">
            S{groupIdx + 1}
          </div>
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
