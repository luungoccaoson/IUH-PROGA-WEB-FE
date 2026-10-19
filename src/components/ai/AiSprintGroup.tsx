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
  // Yêu cầu: Bảng kết quả chỉ hiện 3 sprint đầu tiên, còn lại ẩn các task để người dùng tới đâu tự bấm mở tới đó
  const [isCollapsed, setIsCollapsed] = useState(groupIdx >= 3);

  const shortSprintTitle = sprintName.includes(":") ? sprintName.split(":")[0].trim() : sprintName;
  const sprintSubtitle = sprintName.includes(":") ? sprintName.split(":").slice(1).join(":").trim() : "";

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
            {isCollapsed ? <ChevronDown className="w-4 h-4 text-indigo-600" /> : <ChevronUp className="w-4 h-4" />}
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
              {isCollapsed && (
                <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md font-semibold shrink-0">
                  Thu gọn (Bấm để xem)
                </span>
              )}
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

          {/* Yêu cầu: Nhập số ngày tùy chọn tự do, mặc định 1 tuần (7 ngày) hoặc chọn nhanh 1w/2w */}
          {onChangeDays && (
            <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 px-2.5 py-1 rounded-xl shadow-2xs shrink-0">
              <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="text-slate-400 font-mono text-[10px]">Thời lượng:</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={sprintDays || 7}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val) && val > 0) {
                      onChangeDays(val);
                    }
                  }}
                  className="w-12 px-1 py-0.5 text-center text-xs font-extrabold font-mono text-slate-900 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:border-indigo-600 focus:outline-none"
                  title="Nhập số ngày tùy ý cho Sprint này"
                />
                <span className="text-[11px] font-mono font-bold text-slate-600">ngày</span>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1 pl-1 border-l border-slate-200">
                <button
                  type="button"
                  onClick={() => onChangeDays(7)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                    sprintDays === 7
                      ? "bg-indigo-600 text-white shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                  title="Đặt 1 tuần (7 ngày)"
                >
                  1w
                </button>
                <button
                  type="button"
                  onClick={() => onChangeDays(14)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                    sprintDays === 14
                      ? "bg-indigo-600 text-white shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                  title="Đặt 2 tuần (14 ngày)"
                >
                  2w
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action button: Add Task Only (Nút Chat AI được chuyển ra 1 vị trí cố định duy nhất) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onOpenAddTask(sprintName)}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs border border-slate-200"
            title="Thêm Task mới vào Sprint này"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-600" />
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
