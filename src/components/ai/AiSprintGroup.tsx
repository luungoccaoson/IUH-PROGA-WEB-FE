"use client";

import React, { useState } from "react";
import { Plus, Sparkles, ChevronDown, ChevronUp, Layers, Clock } from "lucide-react";
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
  const [isCollapsed, setIsCollapsed] = useState(false);

  const shortSprintTitle = sprintName.includes(":") ? sprintName.split(":")[0].trim() : sprintName;
  const sprintSubtitle = sprintName.includes(":") ? sprintName.split(":").slice(1).join(":").trim() : "";
  const isSelectedForChat = isChatBoxOpen && targetSprintScope === sprintName;

  const totalSprintEstimatedDays = taskList.reduce(
    (sum, item) => sum + (item.task.estimatedDays || 1.5),
    0
  );

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs ${
        isDragOver
          ? "border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/20"
          : "border-slate-200 hover:border-slate-300"
      }`}
    >
      {/* Sprint Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50/80 border-b border-slate-200/80">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Collapse/Expand Toggle Button */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
            title={isCollapsed ? "Mở rộng Sprint" : "Thu gọn Sprint"}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>

          <span className="flex items-center justify-center px-2 py-0.5 rounded-lg bg-indigo-100 text-indigo-700 shrink-0 font-extrabold text-xs font-mono">
            {groupIdx + 1}
          </span>

          <div className="min-w-0 flex-1 cursor-pointer" onClick={() => setIsCollapsed(!isCollapsed)}>
            <div className="flex items-center gap-2">
              <h4 className="font-extrabold text-sm text-slate-900 truncate">
                {shortSprintTitle}
              </h4>
              <span className="text-[11px] font-mono text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md font-bold shrink-0">
                {taskList.length} tasks
              </span>
            </div>
            {sprintSubtitle && (
              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                {sprintSubtitle}
              </p>
            )}
          </div>

          {dateRangeStr && (
            <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-mono text-indigo-800 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-md font-bold shrink-0">
              📅 {dateRangeStr}
            </span>
          )}

          {onChangeDays && (
            <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 shrink-0">
              <span className="text-slate-400">Thời lượng:</span>
              <select
                value={sprintDays || 7}
                onChange={(e) => onChangeDays(Number(e.target.value))}
                className="px-2 py-0.5 rounded-md border border-slate-300 text-[11px] font-mono font-bold bg-white text-slate-800 shadow-2xs hover:border-indigo-600 focus:outline-none cursor-pointer"
              >
                <option value={7}>1 tuần (7 ngày)</option>
                <option value={10}>10 ngày</option>
                <option value={14}>2 tuần (14 ngày)</option>
                <option value={21}>3 tuần (21 ngày)</option>
                <option value={28}>4 tuần (28 ngày)</option>
              </select>
            </div>
          )}
        </div>

        {/* Action buttons: AI Chat & Add Task */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onOpenChatBox(sprintName)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs ${
              isSelectedForChat
                ? "bg-indigo-600 text-white"
                : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200"
            }`}
            title="Đàm thoại với AI để thêm/sửa task trong Sprint này"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Chat AI</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenAddTask(sprintName)}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs border border-slate-200"
            title="Thêm Task mới vào Sprint này"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm Task</span>
          </button>
        </div>
      </div>

      {/* Task Cards Grid Layout (Collapsible) */}
      {!isCollapsed && (
        <div className="p-4 bg-slate-50/30">
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
            <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl text-xs text-slate-400 font-mono">
              Kéo thả task vào đây hoặc bấm "Thêm Task"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
