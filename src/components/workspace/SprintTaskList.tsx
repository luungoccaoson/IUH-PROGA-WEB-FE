"use client";

import React, { useState } from "react";
import { Plus, Layers, Sparkles, AlertTriangle } from "lucide-react";
import { useSprints } from "@/hooks/useSprints";
import { Sprint } from "@/types";
import { SprintAccordion } from "./sprint/SprintAccordion";
import { BacklogAccordion } from "./sprint/BacklogAccordion";
import { CreateSprintModal } from "./sprint/CreateSprintModal";
import { EditSprintModal } from "./sprint/EditSprintModal";

interface SprintTaskListProps {
  spaceId: number;
}

export function SprintTaskList({ spaceId }: SprintTaskListProps) {
  const {
    sprints,
    tasks,
    loading,
    error,
    createSprint,
    updateSprint,
    deleteSprint,
    getNextSprintDefaultName,
    isTaskOverdue,
  } = useSprints(spaceId);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);

  const handleDeleteSprint = async (sprintId: number) => {
    if (!window.confirm("Bạn có chắc muốn xóa Sprint này không? Các task trong Sprint sẽ được chuyển về Backlog.")) {
      return;
    }
    try {
      await deleteSprint(sprintId);
    } catch (err) {
      alert("Không thể xóa Sprint!");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[#6B7280]">
        <Sparkles className="w-7 h-7 text-[#111827] animate-spin mb-2" />
        <p className="font-mono text-xs uppercase tracking-wider">Đang tải danh sách Sprints & Backlog...</p>
      </div>
    );
  }

  const sprintIds = new Set(sprints.map((s) => s.id));
  const backlogTasks = tasks.filter((t) => !t.sprintId || !sprintIds.has(t.sprintId));

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between bg-white border border-[#E5E7EB] p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#F6F5EF] flex items-center justify-center text-[#111827] border border-[#E5E7EB]">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-[#111827] font-sans">
              Quản lý Sprints & Công việc tồn đọng (Backlog)
            </h2>
            <p className="text-xs text-[#6B7280]">
              Tự động bắt đầu và hoàn thành Sprint theo mốc thời gian quy định
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#111827] hover:bg-[#1f2937] text-white rounded-xl text-xs font-mono font-bold transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          TẠO SPRINT MỚI
        </button>
      </div>

      {error && (
        <div className="bg-[#FDEDEC] border border-[#FADBD8] text-[#D93025] p-4 rounded-xl text-xs font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Sprints Accordions */}
      <div className="space-y-4">
        {sprints.map((sprint) => {
          const sprintTasks = tasks.filter((t) => t.sprintId === sprint.id);
          return (
            <SprintAccordion
              key={sprint.id}
              sprint={sprint}
              tasks={sprintTasks}
              isTaskOverdue={isTaskOverdue}
              onEdit={setEditingSprint}
              onDelete={handleDeleteSprint}
            />
          );
        })}

        {/* Backlog Accordion */}
        <BacklogAccordion tasks={backlogTasks} isTaskOverdue={isTaskOverdue} />
      </div>

      {/* Modals */}
      <CreateSprintModal
        isOpen={isCreateModalOpen}
        defaultName={getNextSprintDefaultName()}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={createSprint}
      />

      <EditSprintModal
        sprint={editingSprint}
        onClose={() => setEditingSprint(null)}
        onSubmit={updateSprint}
      />
    </div>
  );
}
