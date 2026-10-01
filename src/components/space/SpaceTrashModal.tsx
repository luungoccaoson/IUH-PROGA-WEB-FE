"use client";

import React, { useState, useEffect } from "react";
import { Trash2, RotateCcw, X, Layers, Clock } from "lucide-react";
import { Task, Sprint } from "@/types";
import { taskService } from "@/services/task.service";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

interface SpaceTrashModalProps {
  isOpen: boolean;
  spaceId: number;
  sprints?: Sprint[];
  onClose: () => void;
  onTasksRestored: () => void;
}

export function SpaceTrashModal({
  isOpen,
  spaceId,
  sprints = [],
  onClose,
  onTasksRestored,
}: SpaceTrashModalProps) {
  const [deletedTasks, setDeletedTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoringTaskId, setRestoringTaskId] = useState<number | null>(null);
  const [permanentDeleteTaskId, setPermanentDeleteTaskId] = useState<number | null>(null);

  const fetchTrash = async () => {
    if (!spaceId) return;
    try {
      setLoading(true);
      const data = await taskService.getDeletedTasksBySpace(spaceId);
      setDeletedTasks(data || []);
    } catch (err) {
      console.error("Failed to load trash tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTrash();
    }
  }, [isOpen, spaceId]);

  if (!isOpen) return null;

  const handleRestore = async (taskId: number) => {
    try {
      setRestoringTaskId(taskId);
      await taskService.restoreTask(taskId);
      setDeletedTasks((prev) => prev.filter((t) => t.id !== taskId));
      onTasksRestored();
    } catch (err: any) {
      alert(err.response?.data?.message || "Không thể khôi phục công việc. Vui lòng thử lại!");
    } finally {
      setRestoringTaskId(null);
    }
  };

  const handlePermanentDelete = async (taskId: number) => {
    try {
      await taskService.permanentDeleteTask(taskId);
      setDeletedTasks((prev) => prev.filter((t) => t.id !== taskId));
      setPermanentDeleteTaskId(null);
      onTasksRestored();
    } catch (err: any) {
      alert("Không thể xóa vĩnh viễn công việc. Vui lòng thử lại!");
    }
  };

  const getSprintName = (sprintId?: number | null) => {
    if (!sprintId) return "Backlog";
    const found = sprints.find((s) => s.id === sprintId);
    return found ? found.name : `Sprint #${sprintId}`;
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-gray-200 flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-[#111827] text-base font-sans flex items-center gap-2">
                  <span>Thùng rác công việc</span>
                  <span className="text-xs font-mono font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                    {deletedTasks.length}
                  </span>
                </h3>
                <p className="text-xs text-gray-500 font-medium">
                  Các công việc đã xóa mềm. Hệ thống sẽ tự động dọn dẹp sau 15 ngày.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 15 Days Policy Notice */}
          <div className="bg-[#FFF9C4]/60 border border-[#FFF176] text-[#795548] text-xs px-3.5 py-2 rounded-xl flex items-center gap-2 shrink-0">
            <Clock className="w-3.5 h-3.5 text-[#F57F17] shrink-0" />
            <span>
              Các công việc trong thùng rác sẽ được lưu trữ và <strong>tự động xóa vĩnh viễn sau 15 ngày</strong>.
            </span>
          </div>

          {/* Body list */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {loading ? (
              <div className="py-12 text-center space-y-2">
                <div className="w-6 h-6 border-2 border-[#1A73E8] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-gray-400 font-medium font-sans">Đang tải thùng rác...</p>
              </div>
            ) : deletedTasks.length === 0 ? (
              <div className="py-12 text-center space-y-2 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                <Trash2 className="w-8 h-8 text-gray-300 mx-auto" />
                <p className="text-xs font-bold text-gray-600">Thùng rác trống</p>
                <p className="text-[11px] text-gray-400">Chưa có công việc nào bị xóa mềm trong Space này.</p>
              </div>
            ) : (
              deletedTasks.map((t) => {
                const isRestoring = restoringTaskId === t.id;
                const spName = getSprintName(t.sprintId);
                const deletedDateStr = t.deletedAt ? new Date(t.deletedAt).toLocaleString("vi-VN") : "Gần đây";

                return (
                  <div
                    key={t.id}
                    className="p-3.5 bg-white border border-[#E5E7EB] hover:border-gray-300 rounded-xl shadow-2xs flex items-center justify-between gap-4 transition-all"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 shrink-0">
                          Task-{t.id}
                        </span>
                        <h4 className="text-xs font-bold text-gray-800 truncate" title={t.title}>
                          {t.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-gray-500 font-mono">
                        <span className="flex items-center gap-1 text-gray-600 font-sans">
                          <Layers className="w-3 h-3 text-[#1A73E8]" />
                          {spName}
                        </span>
                        <span className="flex items-center gap-1 text-gray-400">
                          <Clock className="w-3 h-3" />
                          Đã xóa: {deletedDateStr}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleRestore(t.id)}
                        disabled={isRestoring}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E8F0FE] hover:bg-[#D2E3FC] text-[#1A73E8] rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                        title="Khôi phục công việc này về lại Sprint/Backlog"
                      >
                        {isRestoring ? (
                          <div className="w-3.5 h-3.5 border-2 border-[#1A73E8] border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <RotateCcw className="w-3.5 h-3.5" />
                        )}
                        <span>Khôi phục</span>
                      </button>

                      <button
                        onClick={() => setPermanentDeleteTaskId(t.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                        title="Xóa vĩnh viễn khỏi cơ sở dữ liệu"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400 font-medium shrink-0">
            <span>💡 Các công việc xóa mềm vẫn được bảo toàn dữ liệu và lịch sử.</span>
            <button
              onClick={onClose}
              className="px-4 py-2 font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog for Permanent Delete */}
      <ConfirmDialog
        isOpen={permanentDeleteTaskId !== null}
        title="Xóa vĩnh viễn công việc"
        message="Hành động này sẽ xóa dữ liệu công việc này hoàn toàn khỏi Database và KHÔNG THỂ khôi phục được nữa. Bạn có chắc chắn muốn xóa vĩnh viễn không?"
        confirmText="Xóa vĩnh viễn"
        cancelText="Hủy"
        onConfirm={() => {
          if (permanentDeleteTaskId) handlePermanentDelete(permanentDeleteTaskId);
        }}
        onCancel={() => setPermanentDeleteTaskId(null)}
      />
    </>
  );
}
