"use client";

import React, { useState } from "react";
import { Plus, Layers, Sparkles, AlertTriangle, Trash2, CheckSquare, X } from "lucide-react";
import { useSprints } from "@/hooks/useSprints";
import { useTasks } from "@/hooks/useTasks";
import { Sprint, TaskStatus, TaskPriority } from "@/types";
import { SprintAccordion } from "./sprint/SprintAccordion";
import { BacklogAccordion } from "./sprint/BacklogAccordion";
import { CreateSprintModal } from "./sprint/CreateSprintModal";
import { EditSprintModal } from "./sprint/EditSprintModal";
import { DeleteSprintModal } from "./sprint/DeleteSprintModal";
import { TaskDetailDrawer } from "./sprint/TaskDetailDrawer";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

interface SprintTaskListProps {
  spaceId: number;
  members?: any[];
  onDrawerStateChange?: (isOpen: boolean) => void;
}

export function SprintTaskList({
  spaceId,
  members = [],
  onDrawerStateChange,
}: SprintTaskListProps) {
  const {
    sprints,
    tasks,
    loading,
    error,
    reload,
    createSprint,
    updateSprint,
    deleteSprint,
    getNextSprintDefaultName,
    isTaskOverdue,
  } = useSprints(spaceId);

  const {
    selectedTask,
    setSelectedTask,
    handleSelectTask,
    createTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
    deleteTasksBatch,
  } = useTasks(spaceId, reload);

  React.useEffect(() => {
    if (onDrawerStateChange) {
      onDrawerStateChange(Boolean(selectedTask));
    }
  }, [selectedTask, onDrawerStateChange]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
  const [deletingSprintId, setDeletingSprintId] = useState<number | null>(null);

  // Multi-task selection state for batch delete
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);

  const handleToggleSelectTask = (taskId: number) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const handleToggleSelectAll = (taskIds: number[], select: boolean) => {
    if (select) {
      setSelectedTaskIds((prev) => Array.from(new Set([...prev, ...taskIds])));
    } else {
      setSelectedTaskIds((prev) => prev.filter((id) => !taskIds.includes(id)));
    }
  };

  const handleClearSelection = () => {
    setSelectedTaskIds([]);
  };

  const handleConfirmBatchDelete = async () => {
    if (selectedTaskIds.length === 0) return;
    try {
      setIsBatchDeleting(true);
      await deleteTasksBatch(selectedTaskIds);
      setSelectedTaskIds([]);
      setShowBatchDeleteConfirm(false);
    } catch (err) {
      alert("Không thể xóa các công việc đã chọn. Vui lòng thử lại!");
    } finally {
      setIsBatchDeleting(false);
    }
  };

  const handleDeleteSprintWithOptions = async (sprintId: number, deleteTasks: boolean) => {
    try {
      await deleteSprint(sprintId, deleteTasks);
      setDeletingSprintId(null);
    } catch (err) {
      alert("Không thể xóa Sprint. Vui lòng thử lại!");
    }
  };

  const handleUpdatePriority = async (
    taskId: number,
    priority: TaskPriority,
  ) => {
    try {
      await updateTask(taskId, { priority });
    } catch (err) {
      alert("Không thể cập nhật độ ưu tiên!");
    }
  };

  const handleUpdateOwner = async (taskId: number, ownerId?: number) => {
    try {
      await updateTask(taskId, { ownerId });
    } catch (err) {
      alert("Không thể gán người thực hiện!");
    }
  };

  const handleMoveTask = async (
    taskId: number,
    targetSprintId: number | null,
  ) => {
    if (targetSprintId !== null) {
      const targetSprint = sprints.find((s) => s.id === targetSprintId);
      if (targetSprint?.status === "CLOSED") {
        alert("Không thể di chuyển công việc vào Sprint đã đóng!");
        return;
      }
    }

    try {
      await updateTask(taskId, { sprintId: targetSprintId });
    } catch (err) {
      console.error("Failed to move task:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[#6B7280]">
        <Sparkles className="w-7 h-7 text-[#111827] animate-spin mb-2" />
        <p className="font-mono text-xs uppercase tracking-wider">
          Đang tải danh sách Sprints & Backlog...
        </p>
      </div>
    );
  }

  const sprintIds = new Set(sprints.map((s) => s.id));
  const backlogTasks = tasks.filter(
    (t) => !t.sprintId || !sprintIds.has(t.sprintId),
  );

  const isDrawerOpen = Boolean(selectedTask);

  return (
    <div className="relative font-sans">
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
                allSpaceTasks={tasks}
                members={members}
                isTaskOverdue={isTaskOverdue}
                selectedTaskIds={selectedTaskIds}
                onToggleSelectTask={handleToggleSelectTask}
                onToggleSelectAllSprint={handleToggleSelectAll}
                onEdit={setEditingSprint}
                onDelete={(id) => setDeletingSprintId(id)}
                onCreateTask={createTask}
                onSelectTask={handleSelectTask}
                onUpdateStatus={updateTaskStatus}
                onUpdatePriority={handleUpdatePriority}
                onUpdateOwner={handleUpdateOwner}
                onDeleteTask={deleteTask}
                onMoveTask={handleMoveTask}
              />
            );
          })}

          {/* Backlog Accordion */}
          <BacklogAccordion
            tasks={backlogTasks}
            allSpaceTasks={tasks}
            isTaskOverdue={isTaskOverdue}
            selectedTaskIds={selectedTaskIds}
            onToggleSelectTask={handleToggleSelectTask}
            onToggleSelectAllBacklog={handleToggleSelectAll}
            onCreateTask={createTask}
            onSelectTask={setSelectedTask}
            onUpdateStatus={updateTaskStatus}
            onUpdatePriority={handleUpdatePriority}
            onUpdateOwner={handleUpdateOwner}
            onDeleteTask={deleteTask}
            onMoveTask={handleMoveTask}
          />
        </div>
      </div>

      {/* Floating Batch Action Bar when tasks are selected */}
      {selectedTaskIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#111827] text-white px-5 py-3 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-4 animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <CheckSquare className="w-4 h-4 text-[#10B981]" />
            <span>
              Đã chọn <strong className="text-[#10B981] font-mono">{selectedTaskIds.length}</strong> công việc
            </span>
          </div>

          <div className="h-4 w-px bg-white/20" />

          <button
            onClick={handleClearSelection}
            className="text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            Bỏ chọn
          </button>

          <button
            onClick={() => setShowBatchDeleteConfirm(true)}
            disabled={isBatchDeleting}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            {isBatchDeleting ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            <span>Chuyển vào thùng rác ({selectedTaskIds.length})</span>
          </button>
        </div>
      )}

      {/* Confirmation Dialog for Batch Task Soft Delete */}
      <ConfirmDialog
        isOpen={showBatchDeleteConfirm}
        title="Chuyển nhiều công việc vào thùng rác"
        message={`Bạn có chắc chắn muốn chuyển ${selectedTaskIds.length} công việc đã chọn vào thùng rác không? Bạn có thể khôi phục lại bất cứ lúc nào.`}
        confirmText="Chuyển vào thùng rác"
        cancelText="Hủy"
        onConfirm={handleConfirmBatchDelete}
        onCancel={() => setShowBatchDeleteConfirm(false)}
      />

      {/* Sprint Modals */}
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

      {/* Delete Sprint Modal with 2 options (Move to Backlog or Delete All) */}
      <DeleteSprintModal
        isOpen={deletingSprintId !== null}
        sprint={sprints.find((s) => s.id === deletingSprintId) || null}
        taskCount={tasks.filter((t) => t.sprintId === deletingSprintId).length}
        onClose={() => setDeletingSprintId(null)}
        onConfirm={handleDeleteSprintWithOptions}
      />

      {/* Task Detail Drawer Side Panel (Non-blocking right layout!) */}
      <TaskDetailDrawer
        task={selectedTask}
        isClosedSprint={Boolean(
          selectedTask?.sprintId &&
          sprints.find((s) => s.id === selectedTask.sprintId)?.status ===
            "CLOSED",
        )}
        isActiveSprint={Boolean(
          selectedTask?.sprintId &&
          sprints.find((s) => s.id === selectedTask.sprintId)?.status ===
            "ACTIVE",
        )}
        onClose={() => setSelectedTask(null)}
        onUpdate={updateTask}
        onDelete={deleteTask}
      />
    </div>
  );
}
