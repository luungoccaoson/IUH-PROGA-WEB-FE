"use client";

import React from "react";
import {
  Clock,
  Pencil,
  Trash2,
  ArrowRightLeft,
  GripVertical,
  UserCheck,
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

      {/* Complexity Rationale Badge (Scrum & IEEE 12207 Estimation Basis) */}
      <div className="pl-6 pt-0.5">
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-medium border ${
            (task.estimatedDays || 2) <= 1
              ? "bg-slate-50 text-slate-700 border-slate-200"
              : (task.estimatedDays || 2) <= 2
              ? "bg-blue-50 text-blue-700 border-blue-200"
              : "bg-amber-50 text-amber-800 border-amber-200"
          }`}
          title={`Căn cứ định lượng Scrum & IEEE 12207:\n• Ước tính: ${task.estimatedDays || 2} ngày làm việc\n• Độ phức tạp: ${(task.estimatedDays || 2) <= 1 ? "Cơ bản (Cấu hình / DTO / Migrations / Docs)" : (task.estimatedDays || 2) <= 2 ? "Trung bình (Nghiệp vụ CRUD / Form UI / RESTful API)" : "Cao (Kiến trúc hệ thống / Bảo mật OAuth2 / Tích hợp WebSocket)"}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          <span>
            {(task.estimatedDays || 2) <= 1
              ? "Độ phức tạp: Cơ bản (Cấu hình / DTO: ~1 ngày)"
              : (task.estimatedDays || 2) <= 2
              ? "Độ phức tạp: Trung bình (CRUD Service / UI: ~2 ngày)"
              : `Độ phức tạp: Nòng cốt (${task.estimatedDays || 3} ngày)`}
          </span>
        </span>
      </div>

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
