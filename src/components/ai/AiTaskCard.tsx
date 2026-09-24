"use client";

import React, { useState } from "react";
import {
  Clock,
  Pencil,
  Trash2,
  ArrowRightLeft,
  GripVertical,
  UserCheck,
  AlertTriangle,
} from "lucide-react";
import { DecomposedTaskItem } from "@/services/ai.service";

interface AiTaskCardProps {
  task: DecomposedTaskItem;
  originalIndex: number;
  taskDisplayNumber: number;
  availableSprints: string[];
  onOpenEdit: (index: number) => void;
  onDelete: (index: number) => void;
  onMoveSprint: (index: number, newSprint: string) => void;
}

export function AiTaskCard({
  task,
  originalIndex,
  taskDisplayNumber,
  availableSprints,
  onOpenEdit,
  onDelete,
  onMoveSprint,
}: AiTaskCardProps) {
  const [hoveredRisk, setHoveredRisk] = useState(false);
  const [openRisk, setOpenRisk] = useState(false);

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

  const cleanTitle = (task.title || "").replace(/^Task-\d+\s*:\s*/i, "").trim();

  return (
    <div
      draggable={true}
      onDragStart={(e) => {
        e.dataTransfer.setData("aiTaskIndex", originalIndex.toString());
        e.dataTransfer.effectAllowed = "move";
      }}
      className="p-3.5 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] hover:border-[#111827] transition-all space-y-2.5 shadow-2xs group relative cursor-grab active:cursor-grabbing hover:bg-white font-sans"
    >
      {/* Task Header: Order Number, Title & Priority Badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <GripVertical className="w-4 h-4 text-gray-400 shrink-0 cursor-grab active:cursor-grabbing hover:text-[#111827]" />
          <span className="font-mono text-[10px] font-bold text-[#6B7280] bg-[#F6F5EF] px-2 py-0.5 rounded border border-[#E5E7EB] shrink-0">
            Task-{taskDisplayNumber}
          </span>
          <h5 className="font-extrabold text-xs text-[#111827] leading-snug truncate">
            {cleanTitle}
          </h5>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <span
            className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-md border ${getPriorityBadgeStyle(
              task.priority
            )}`}
          >
            {task.priority}
          </span>
        </div>
      </div>

      {/* Task Description */}
      <p className="text-xs text-[#4B5563] leading-relaxed line-clamp-2 pl-6">
        {task.description}
      </p>

      {/* Role & Time Estimates */}
      <div className="flex flex-wrap items-center gap-1.5 pl-6 font-mono text-[10px]">
        {task.assignedRole && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#E8F0FE] text-[#1A73E8] font-bold border border-[#D2E3FC]">
            <UserCheck className="w-3 h-3" />
            {task.assignedRole}
          </span>
        )}

        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F3F4F6] text-[#374151] font-bold border border-[#E5E7EB]">
          <Clock className="w-3 h-3 text-[#6B7280]" />
          Ước tính: {task.estimatedDays || 2} ngày
        </span>

        {task.bufferDays ? (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FEF7E0] text-[#B06000] font-bold border border-[#FEEFC3]">
            🛡️ +{task.bufferDays} ngày dự phòng
          </span>
        ) : null}
      </div>

      {/* Compact Risk Warning Badge with Hover / Click Popover */}
      {(task.priority === "URGENT" || task.riskWarning) && (
        <div className="relative inline-block ml-6">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpenRisk(!openRisk);
            }}
            onMouseEnter={() => setHoveredRisk(true)}
            onMouseLeave={() => setHoveredRisk(false)}
            className="px-2 py-0.5 rounded-md bg-[#FFF0F0] text-[#D93025] border border-[#FADBD8] text-[10px] font-bold font-mono flex items-center gap-1 hover:bg-[#FCE8E6] transition-all cursor-pointer shadow-2xs"
          >
            <AlertTriangle className="w-3 h-3 text-[#D93025]" />
            <span>⚠️ Cảnh báo rủi ro</span>
          </button>

          {/* Risk Detail Popover */}
          {(hoveredRisk || openRisk) && (
            <div className="absolute left-0 bottom-full mb-2 w-72 p-3 bg-[#111827] text-white text-[11px] rounded-2xl shadow-xl z-30 space-y-1.5 animate-in fade-in zoom-in-95 duration-150 border border-gray-700 pointer-events-auto">
              <div className="flex items-center justify-between text-[#F87171] font-mono font-bold text-[10px] uppercase border-b border-gray-800 pb-1">
                <span className="flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Nguyên nhân & Căn cứ Rủi ro
                </span>
              </div>
              <p className="text-gray-200 text-xs leading-relaxed font-sans font-medium">
                {task.riskWarning ||
                  "Task có độ phức tạp kỹ thuật cao, cần chú ý kiểm soát mã hóa dữ liệu & kiểm thử kỹ lưỡng."}
              </p>
              <div className="text-[10px] text-[#60A5FA] font-mono font-semibold pt-1 border-t border-gray-800 flex items-center gap-1">
                <span>🛡️ Tiêu chuẩn kiểm soát: OWASP & IEEE 12207</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Card Footer Controls (Move Sprint, Edit, Delete) */}
      <div className="flex items-center justify-between text-[11px] font-mono text-[#6B7280] pt-2 border-t border-[#E5E7EB]">
        <span className="flex items-center gap-1 pl-6 text-[10px]">
          <Clock className="w-3 h-3 text-[#111827]" />
          {task.estimatedDays || 2} ngày
        </span>

        <div className="flex items-center gap-2">
          {/* Move Sprint Selector */}
          <div className="flex items-center gap-1 text-[10px] text-[#4B5563]">
            <ArrowRightLeft className="w-3 h-3 text-[#6B7280]" />
            <select
              value={task.sprint || ""}
              onChange={(e) => onMoveSprint(originalIndex, e.target.value)}
              className="bg-white border border-[#E5E7EB] rounded-lg px-1.5 py-0.5 font-bold text-[#111827] cursor-pointer max-w-[130px] truncate outline-none"
            >
              {availableSprints.map((sp) => {
                const shortSpLabel = sp.includes(":") ? sp.split(":")[0].trim() : sp;
                return (
                  <option key={sp} value={sp}>
                    {shortSpLabel}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Edit Button */}
          <button
            type="button"
            onClick={() => onOpenEdit(originalIndex)}
            className="p-1 hover:bg-gray-200 rounded-md text-[#1A73E8] transition-colors cursor-pointer"
            title="Sửa Task"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={() => onDelete(originalIndex)}
            className="p-1 hover:bg-red-100 rounded-md text-[#D93025] transition-colors cursor-pointer"
            title="Xóa Task"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
