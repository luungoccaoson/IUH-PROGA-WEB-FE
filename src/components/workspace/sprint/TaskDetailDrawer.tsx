"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Trash2,
  Calendar,
  AlignLeft,
  Check,
  AlertTriangle,
  UserCheck,
  Sparkles,
  ListChecks,
  Plus,
  RotateCcw,
} from "lucide-react";
import { Task, TaskStatus, TaskPriority } from "@/types";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { getTaskTransferredOrigin } from "@/hooks/useSprints";
import {
  TaskChecklistItem,
  parseTaskDescriptionWithChecklist,
  serializeTaskDescriptionWithChecklist,
  generateAiSubstepsForTask,
  evaluateTaskForAcceptance,
  canUserDeleteTaskItem,
} from "@/utils/aiTaskAssistant";

interface TaskDetailDrawerProps {
  task: Task | null;
  taskNumber?: number;
  isClosedSprint?: boolean;
  isActiveSprint?: boolean;
  isPM?: boolean;
  isAssistant?: boolean;
  currentUserId?: number;
  members?: any[];
  onClose: () => void;
  onUpdate: (
    taskId: number,
    data: {
      title?: string;
      description?: string;
      status?: TaskStatus;
      priority?: TaskPriority;
      ownerId?: number | null;
      startDate?: string;
      dueDate?: string;
    },
  ) => Promise<any>;
  onDelete: (taskId: number) => Promise<any>;
}

const DEFAULT_MEMBERS = [
  { id: 2, name: "Son Luu" },
  { id: 4, name: "Duy Dev" },
  { id: 5, name: "Hoa Tester" },
];

export function TaskDetailDrawer({
  task,
  taskNumber,
  isClosedSprint = false,
  isActiveSprint = false,
  isPM = true,
  isAssistant = false,
  currentUserId,
  members,
  onClose,
  onUpdate,
  onDelete,
}: TaskDetailDrawerProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [checklist, setChecklist] = useState<TaskChecklistItem[]>([]);
  const [checklistHistory, setChecklistHistory] = useState<
    { steps: TaskChecklistItem[]; rationale?: string }[]
  >([]);
  const [aiRationale, setAiRationale] = useState<string | undefined>(undefined);
  const [assistantVerified, setAssistantVerified] = useState(false);
  const [createdByUserId, setCreatedByUserId] = useState<number | undefined>(
    undefined,
  );
  const [newStepText, setNewStepText] = useState("");
  const [status, setStatus] = useState<TaskStatus>("TODO");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [ownerId, setOwnerId] = useState<number | undefined>(undefined);
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const resetFormToTask = React.useCallback((targetTask: Task) => {
    const parsed = parseTaskDescriptionWithChecklist(targetTask.description);
    setTitle(targetTask.title);
    setDescription(parsed.baseDescription);
    setChecklist(parsed.checklist);
    setChecklistHistory([]);
    setAiRationale(parsed.aiRationale);
    setAssistantVerified(parsed.assistantVerified);
    setCreatedByUserId(parsed.createdByUserId);
    setNewStepText("");
    setStatus(targetTask.status);
    setPriority(targetTask.priority);
    setOwnerId(targetTask.ownerId || targetTask.assignee?.id);
    setStartDate(
      targetTask.startDate ? targetTask.startDate.substring(0, 10) : "",
    );
    setDueDate(targetTask.dueDate ? targetTask.dueDate.substring(0, 10) : "");
  }, []);

  useEffect(() => {
    if (task) {
      resetFormToTask(task);
    }
  }, [task, resetFormToTask]);

  if (!task) return null;

  const isCoordinator = isPM || isAssistant;
  const taskOwnerId = task.ownerId || task.assignee?.id;
  const isMyTask = Boolean(currentUserId && taskOwnerId === currentUserId);
  const isUnassigned = !taskOwnerId;
  const isOtherMemberTask = !isCoordinator && !isUnassigned && !isMyTask;

  const isReadOnly = isClosedSprint || isOtherMemberTask;
  // Chỉ chính thành viên phụ trách công việc đó (hoặc khi task chưa giao cho ai) mới được tạo/sửa/xóa/tích bước làm cá nhân.
  // Khi task đã giao cho thành viên khác, PM và Assistant chỉ xem tiến độ bước làm chứ không xóa hay tích thay thành viên.
  const canManageChecklist =
    !isClosedSprint && (isMyTask || (isUnassigned && !isReadOnly));

  const pushChecklistSnapshot = () => {
    setChecklistHistory((prev) => [
      ...prev.slice(-9),
      { steps: checklist.map((c) => ({ ...c })), rationale: aiRationale },
    ]);
  };

  const handleUndoChecklist = () => {
    setChecklistHistory((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setChecklist(last.steps);
      setAiRationale(last.rationale);
      return prev.slice(0, -1);
    });
  };
  const canDelete = canUserDeleteTaskItem(
    task,
    currentUserId,
    isPM,
    isClosedSprint,
    isActiveSprint,
    false,
  );

  const handleSelfAssign = async () => {
    if (!currentUserId || isClosedSprint) return;
    try {
      setIsSubmitting(true);
      await onUpdate(task.id, {
        title: title.trim() || task.title,
        description: description.trim() || task.description,
        status: task.status,
        priority: task.priority,
        ownerId: currentUserId,
        startDate: startDate || undefined,
        dueDate: dueDate || undefined,
      });
      setOwnerId(currentUserId);
    } catch (err) {
      alert("Không thể nhận công việc này!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let finalStatus: TaskStatus = status;

    // Nghiệp vụ 1: Nếu MEMBER hoặc ASSISTANT chọn "Đã xong (DONE)",
    // hệ thống tự động đưa qua cột "Chờ PM duyệt (IN_REVIEW)" để PM biết họ đã làm xong
    if (status === "DONE" && !isPM) {
      finalStatus = "IN_REVIEW";
    }

    // Nghiệp vụ 2: PM không đơn phương bấm DONE đối với task của thành viên khác khi chưa qua cột IN_REVIEW
    if (finalStatus === "DONE" && isPM) {
      const isAssignedToOther = Boolean(
        taskOwnerId && taskOwnerId !== currentUserId,
      );
      if (
        isAssignedToOther &&
        task.status !== "IN_REVIEW" &&
        task.status !== "DONE"
      ) {
        alert(
          "⚠️ Quy trình nghiệm thu: Thành viên phụ trách chưa báo cáo hoàn thành công việc này (chưa qua cột 'Chờ duyệt / IN REVIEW'). PM chỉ duyệt sang 'Đã xong' đối với các công việc đang ở trạng thái 'Chờ duyệt'!",
        );
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const fullDescription = serializeTaskDescriptionWithChecklist(
        description,
        checklist,
        aiRationale,
        { assistantVerified, createdByUserId },
      );
      await onUpdate(task.id, {
        title: title.trim(),
        description: fullDescription || undefined,
        status: finalStatus,
        priority,
        ownerId: ownerId ? Number(ownerId) : null,
        startDate: startDate || undefined,
        dueDate: dueDate || undefined,
      });
      onClose();
    } catch (err) {
      alert("Không thể lưu chi tiết task. Vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setIsSubmitting(true);
      await onDelete(task.id);
      setShowDeleteConfirm(false);
      onClose();
    } catch (err) {
      alert("Không thể xóa task!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed right-0 top-0 bottom-0 z-40 w-[400px] max-w-full bg-white shadow-xl border-l border-[#E5E7EB] flex flex-col font-sans animate-in slide-in-from-right duration-200">
        {/* Header bar */}
        <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F9FAFB]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-bold text-[#6B7280] bg-[#F6F5EF] px-2 py-0.5 rounded border border-[#E5E7EB]">
              Task-{taskNumber !== undefined ? taskNumber : task.id}
            </span>

            {/* Hiển thị đúng trạng thái thực tế của Task (không ghi nhầm ĐÃ XONG khi xem task của người khác) */}
            {status === "DONE" ? (
              <span className="text-[10px] font-mono font-bold text-[#137333] bg-[#E6F4EA] border border-[#CEE7D4] px-2 py-0.5 rounded">
                ĐÃ XONG
              </span>
            ) : status === "IN_REVIEW" ? (
              <span className="text-[10px] font-mono font-bold text-[#B45309] bg-[#FEF3C7] border border-amber-300 px-2 py-0.5 rounded">
                CHỜ DUYỆT
              </span>
            ) : status === "IN_PROGRESS" ? (
              <span className="text-[10px] font-mono font-bold text-[#1A73E8] bg-[#E8F0FE] border border-[#D2E3FC] px-2 py-0.5 rounded">
                ĐANG LÀM
              </span>
            ) : (
              <span className="text-[10px] font-mono font-bold text-gray-700 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded">
                CẦN LÀM
              </span>
            )}

            {isMyTask && (
              <span className="text-[10px] font-mono font-bold text-[#1A73E8] bg-[#E8F0FE] border border-[#D2E3FC] px-2 py-0.5 rounded">
                Của tôi
              </span>
            )}

            {isOtherMemberTask && (
              <span className="text-[10px] font-mono font-bold text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded">
                CHỈ XEM
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {canDelete && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                title="Chuyển vào thùng rác"
                className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onClose}
              title="Đóng bảng chi tiết"
              className="p-1.5 hover:bg-[#E5E7EB] text-[#6B7280] rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content body */}
        <form
          onSubmit={handleSave}
          className="flex-1 overflow-y-auto p-5 space-y-5 text-xs"
        >
          {/* IN_REVIEW Approval Banner: Compact & Practical for PM, Assistant, and Member */}
          {!isClosedSprint &&
            task.status === "IN_REVIEW" &&
            (() => {
              const liveTaskForEval: Task = {
                ...task,
                description: serializeTaskDescriptionWithChecklist(
                  description,
                  checklist,
                  aiRationale,
                  { assistantVerified, createdByUserId },
                ),
                dueDate: dueDate || task.dueDate,
                ownerId: ownerId ?? task.ownerId,
              };
              const acceptance = evaluateTaskForAcceptance(liveTaskForEval);

              if (isPM) {
                return (
                  <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 space-y-2.5 text-xs text-amber-950 shadow-2xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-[11px] uppercase tracking-wide text-amber-900">
                        📋 Chờ PM nghiệm thu
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold border ${
                          acceptance.readyForApproval
                            ? "bg-[#E6F4EA] text-[#137333] border-[#CEE7D4]"
                            : "bg-white text-amber-800 border-amber-300"
                        }`}
                      >
                        {acceptance.statusSummary}
                      </span>
                    </div>

                    {/* 3 Short Status Pills */}
                    <div className="flex flex-wrap gap-1.5 text-[10px] font-mono font-bold">
                      <span className="px-2 py-0.5 rounded bg-white border border-amber-200 text-[#111827]">
                        {acceptance.checklistLabel}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded border ${
                          acceptance.isOverdue
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-white text-[#137333] border-amber-200"
                        }`}
                      >
                        {acceptance.timelineLabel}
                      </span>
                      {acceptance.assistantVerified && (
                        <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200">
                          ✓ Assistant đã kiểm tra
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={async () => {
                          try {
                            setIsSubmitting(true);
                            await onUpdate(task.id, { status: "DONE" });
                            onClose();
                          } finally {
                            setIsSubmitting(false);
                          }
                        }}
                        className="flex-1 py-1.5 px-3 bg-[#137333] hover:bg-[#0d5324] text-white font-bold text-[11px] rounded-xl transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                      >
                        ✓ Duyệt Done
                      </button>
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={async () => {
                          try {
                            setIsSubmitting(true);
                            await onUpdate(task.id, { status: "IN_PROGRESS" });
                            onClose();
                          } finally {
                            setIsSubmitting(false);
                          }
                        }}
                        className="py-1.5 px-3 bg-white hover:bg-gray-100 text-gray-800 border border-amber-300 font-bold text-[11px] rounded-xl transition-all cursor-pointer disabled:opacity-50"
                      >
                        ↩ Yêu cầu sửa lại
                      </button>
                    </div>
                  </div>
                );
              }

              if (isAssistant) {
                return (
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 space-y-2 text-xs text-purple-950 shadow-2xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-[11px] uppercase">
                        Kiểm tra bàn giao
                      </span>
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-white border border-purple-200">
                        {acceptance.checklistLabel} • {acceptance.timelineLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isSubmitting || assistantVerified}
                        onClick={async () => {
                          try {
                            setIsSubmitting(true);
                            const newDesc =
                              serializeTaskDescriptionWithChecklist(
                                description,
                                checklist,
                                aiRationale,
                                { assistantVerified: true, createdByUserId },
                              );
                            await onUpdate(task.id, { description: newDesc });
                            setAssistantVerified(true);
                          } finally {
                            setIsSubmitting(false);
                          }
                        }}
                        className="flex-1 py-1.5 px-3 bg-purple-700 hover:bg-purple-800 text-white font-bold text-[11px] rounded-xl cursor-pointer disabled:opacity-60"
                      >
                        {assistantVerified
                          ? "✓ Đã xác nhận đề xuất PM duyệt"
                          : "✓ Xác nhận đạt – Đề xuất PM duyệt"}
                      </button>
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={async () => {
                          try {
                            setIsSubmitting(true);
                            await onUpdate(task.id, { status: "IN_PROGRESS" });
                            onClose();
                          } finally {
                            setIsSubmitting(false);
                          }
                        }}
                        className="py-1.5 px-2.5 bg-white hover:bg-gray-100 text-gray-700 border border-purple-200 font-bold text-[11px] rounded-xl cursor-pointer"
                      >
                        ↩ Trả lại
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
                  <p className="font-extrabold text-[11px]">
                    ⏳ Đang chờ kiểm tra &amp; duyệt
                  </p>
                </div>
              );
            })()}

          {/* RBAC Self-Assign Banner for Unassigned Tasks */}
          {!isClosedSprint && !isPM && isUnassigned && currentUserId && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between gap-2 text-xs text-blue-900 shadow-2xs">
              <div className="space-y-0.5">
                <p className="font-extrabold text-[11px] text-blue-950 uppercase tracking-wide flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  Công việc chưa có người phụ trách
                </p>
                <p className="text-[11px] text-blue-800">
                  Bạn có thể tự nhận (Self-assign) công việc này để bắt đầu thực
                  hiện.
                </p>
              </div>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSelfAssign}
                className="px-3 py-1.5 bg-[#1A73E8] hover:bg-[#1557B0] text-white font-bold text-[11px] rounded-xl shrink-0 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
              >
                ✋ Nhận việc ngay
              </button>
            </div>
          )}

          {/* RBAC Read-Only Notice for Another Member's Task */}
          {!isClosedSprint && isOtherMemberTask && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between gap-2 text-xs text-gray-700">
              <p className="font-bold text-[11px] text-gray-800">
                Công việc này đang do thành viên khác phụ trách (Chế độ xem).
              </p>
            </div>
          )}

          {/* Overdue Rollover Notice */}
          {(() => {
            const transferred = getTaskTransferredOrigin(task);
            if (!transferred.isTransferred) return null;
            return (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-900 shadow-2xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-[11px] text-amber-950 uppercase tracking-wide">
                    Nhiệm vụ tồn đọng trễ hạn
                  </p>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Công việc này trễ hạn từ{" "}
                    <strong>{transferred.originSprintName}</strong> (Sprint đã
                    đóng) và đã được chuyển sang Sprint hiện tại để tiếp tục
                    thực hiện.
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Task Title Edit — Multi-line auto-wrapping so long titles are never cut off */}
          <div className="space-y-1">
            <label className="font-bold text-[#6B7280] uppercase tracking-wider font-mono text-[10px]">
              Tên công việc <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={title.length > 52 ? 3 : 2}
              disabled={isReadOnly}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-sm font-extrabold text-[#111827] leading-snug break-words resize-none border border-transparent hover:border-[#E5E7EB] focus:border-[#111827] rounded-xl px-2.5 py-1.5 -mx-1 bg-transparent focus:bg-white focus:outline-none transition-colors disabled:bg-transparent"
            />
          </div>

          {/* Quick Settings Grid (Status, Priority, Assignee) */}
          <div className="grid grid-cols-2 gap-3 bg-[#F9FAFB] p-3.5 rounded-2xl border border-[#E5E7EB]">
            {/* Status Selector (3 Selectable Options: Cần làm, Đang làm, Hoàn thành; Chờ duyệt is only a displayed state) */}
            <div className="space-y-1">
              <label className="font-bold text-[#6B7280] uppercase tracking-wider font-mono text-[10px]">
                Trạng thái
              </label>
              <select
                disabled={isReadOnly || (!isPM && task.status === "DONE")}
                value={status}
                title={
                  !isPM && task.status === "DONE"
                    ? "Công việc đã được PM duyệt hoàn thành (DONE) và không thể chuyển trạng thái"
                    : undefined
                }
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-2 py-1.5 bg-white border border-[#E5E7EB] rounded-xl font-bold text-xs focus:outline-none disabled:bg-gray-100"
              >
                <option value="TODO">Cần làm</option>
                <option value="IN_PROGRESS">Đang làm</option>
                {isPM ? (
                  <>
                    <option value="IN_REVIEW">Chờ duyệt</option>
                    <option value="DONE">Đã xong (Nghiệm thu)</option>
                  </>
                ) : (
                  <option value="IN_REVIEW">Hoàn thành (Nộp chờ duyệt)</option>
                )}
              </select>
            </div>

            {/* Priority Selector */}
            <div className="space-y-1">
              <label className="font-bold text-[#6B7280] uppercase tracking-wider font-mono text-[10px]">
                Độ ưu tiên
              </label>
              <select
                disabled={isReadOnly}
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-2 py-1.5 bg-white border border-[#E5E7EB] rounded-xl font-bold text-xs focus:outline-none disabled:bg-gray-100"
              >
                <option value="LOW">Thấp</option>
                <option value="MEDIUM">Trung bình</option>
                <option value="HIGH">Cao</option>
                <option value="URGENT">Khẩn cấp</option>
              </select>
            </div>

            {/* Assignee / Owner */}
            <div className="col-span-2 space-y-1">
              <label className="font-bold text-[#6B7280] uppercase tracking-wider font-mono text-[10px]">
                Người thực hiện (Assignee)
              </label>
              <select
                disabled={
                  isReadOnly ||
                  (!isCoordinator &&
                    !isUnassigned &&
                    (!isMyTask || task.status !== "TODO"))
                }
                value={ownerId || ""}
                onChange={(e) =>
                  setOwnerId(
                    e.target.value ? parseInt(e.target.value, 10) : undefined,
                  )
                }
                className="w-full px-2 py-1.5 bg-white border border-[#E5E7EB] rounded-xl font-bold text-xs focus:outline-none disabled:bg-gray-100"
              >
                <option value="">-- Chưa gán người thực hiện --</option>
                {members && members.length > 0
                  ? members
                      .filter((m) => {
                        if (isCoordinator) return true;
                        const uId = m.id?.userId || m.userId || m.id;
                        return uId === currentUserId || uId === ownerId;
                      })
                      .map((m) => {
                        const uId = m.id?.userId || m.userId || m.id;
                        const uName =
                          m.user?.fullName ||
                          m.user?.email ||
                          m.fullName ||
                          m.name ||
                          `Thành viên #${uId}`;
                        return (
                          <option key={uId} value={uId}>
                            {uName} {uId === currentUserId ? "(Tôi)" : ""}
                          </option>
                        );
                      })
                  : DEFAULT_MEMBERS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
              </select>
            </div>
          </div>

          {/* Dates Section */}
          {(() => {
            const transferred = getTaskTransferredOrigin(task);
            const isDateLocked = isReadOnly || transferred.isTransferred;
            return (
              <div className="space-y-1.5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-[#6B7280] uppercase tracking-wider font-mono text-[10px] flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Ngày bắt đầu
                    </label>
                    <input
                      type="date"
                      disabled={isDateLocked}
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-[#E5E7EB] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#111827] disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-[#6B7280] uppercase tracking-wider font-mono text-[10px] flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Ngày kết thúc (Due Date)
                    </label>
                    <input
                      type="date"
                      disabled={isDateLocked}
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-[#E5E7EB] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#111827] disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                {transferred.isTransferred && !isReadOnly && (
                  <p className="text-[10px] font-mono text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200 leading-normal">
                    🔒 <strong>Khóa chỉnh ngày:</strong> Không được phép chỉnh
                    sửa ngày vì công việc đã trễ hạn từ sprint trước (bạn vẫn có
                    thể chỉnh sửa tiêu đề, người phụ trách và trạng thái).
                  </p>
                )}
              </div>
            );
          })()}

          {/* Description Editor */}
          <div className="space-y-1 pt-1">
            <label className="font-bold text-[#6B7280] uppercase tracking-wider font-mono text-[10px] flex items-center gap-1">
              <AlignLeft className="w-3 h-3" />
              Mô tả chi tiết (Description)
            </label>
            <textarea
              rows={4}
              disabled={isReadOnly}
              placeholder="Thêm mô tả chi tiết cho công việc tại đây..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 border border-[#E5E7EB] rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-[#111827] text-xs font-medium text-[#111827] leading-relaxed disabled:bg-gray-50"
            />
          </div>

          {/* STEP 1 AI FOR MEMBERS: Micro-Subtask Checklist Breakdown */}
          <div className="space-y-2.5 pt-2 border-t border-[#E5E7EB]">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <ListChecks className="w-3.5 h-3.5 text-[#1A73E8]" />
                <span className="font-bold text-[#111827] uppercase tracking-wider font-mono text-[10px]">
                  Các bước thực hiện (
                  {checklist.filter((c) => c.completed).length}/
                  {checklist.length})
                </span>
                {!canManageChecklist && checklist.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-mono text-[9px] font-bold">
                    Chỉ xem tiến độ
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {canManageChecklist && checklistHistory.length > 0 && (
                  <button
                    type="button"
                    onClick={handleUndoChecklist}
                    className="px-2 py-1 rounded-lg bg-white hover:bg-gray-100 text-[#4B5563] border border-[#E5E7EB] font-mono text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    title="Hoàn tác thao tác vừa thực hiện trên danh sách bước làm"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Hoàn tác</span>
                  </button>
                )}

                {canManageChecklist && (
                  <button
                    type="button"
                    onClick={() => {
                      pushChecklistSnapshot();
                      const generated = generateAiSubstepsForTask(
                        { ...task, priority },
                        title,
                        description,
                      );
                      setChecklist(generated.steps);
                      setAiRationale(generated.rationale);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#F6F5EF] hover:bg-[#E8F0FE] text-[#111827] hover:text-[#1A73E8] border border-[#E5E7EB] font-mono text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    title="AI phân tích tên công việc, độ ưu tiên và thời gian ước tính để gợi ý các bước làm nhỏ cho bạn"
                  >
                    <Sparkles className="w-3 h-3 text-[#1A73E8]" />
                    <span>
                      {checklist.length > 0
                        ? "AI Gợi ý lại"
                        : "AI Gợi ý bước làm"}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Explainable AI Rationale Box */}
            {aiRationale && (
              <div className="p-2.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-[11px] text-[#4B5563] leading-relaxed">
                <span className="font-bold text-[#111827]">
                  Cơ sở gợi ý:{" "}
                </span>
                <span>{aiRationale}</span>
              </div>
            )}

            {/* Progress bar if checklist exists */}
            {checklist.length > 0 && (
              <div className="w-full bg-[#E5E7EB] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#137333] h-full transition-all duration-300"
                  style={{
                    width: `${Math.round(
                      (checklist.filter((c) => c.completed).length /
                        checklist.length) *
                        100,
                    )}%`,
                  }}
                />
              </div>
            )}

            {/* Checklist Items */}
            {checklist.length === 0 ? (
              <p className="text-[11px] text-[#9CA3AF] italic py-1">
                {canManageChecklist
                  ? "Chưa có bước thực hiện nhỏ nào. Nhấn “AI Gợi ý bước làm” hoặc tự thêm bước bên dưới để theo dõi tiến độ cá nhân."
                  : "Thành viên phụ trách chưa tạo các bước thực hiện chi tiết cho công việc này."}
              </p>
            ) : (
              <div className="space-y-1.5">
                {checklist.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`flex items-start justify-between gap-2 p-2.5 rounded-xl border text-xs transition-colors ${
                      item.completed
                        ? "bg-[#E6F4EA]/35 border-[#CEE7D4]"
                        : "bg-white border-[#E5E7EB]"
                    }`}
                  >
                    <label
                      className={`flex items-start gap-2 flex-1 select-none ${
                        canManageChecklist ? "cursor-pointer" : "cursor-default"
                      }`}
                    >
                      <input
                        type="checkbox"
                        disabled={!canManageChecklist}
                        checked={item.completed}
                        onChange={() => {
                          if (!canManageChecklist) return;
                          pushChecklistSnapshot();
                          setChecklist((prev) =>
                            prev.map((c, i) =>
                              i === idx ? { ...c, completed: !c.completed } : c,
                            ),
                          );
                        }}
                        className={`mt-0.5 w-3.5 h-3.5 rounded border-gray-300 text-[#137333] focus:ring-[#137333] ${
                          canManageChecklist
                            ? "cursor-pointer"
                            : "cursor-not-allowed opacity-70"
                        }`}
                      />
                      {/* Chỉ làm mờ chữ khi đã tích, KHÔNG gạch ngang chữ (no line-through) */}
                      <span
                        className={
                          item.completed
                            ? "text-[#6B7280] opacity-75 font-normal"
                            : "text-[#111827] font-medium"
                        }
                      >
                        {item.text}
                      </span>
                    </label>
                    {canManageChecklist && (
                      <button
                        type="button"
                        onClick={() => {
                          pushChecklistSnapshot();
                          setChecklist((prev) =>
                            prev.filter((_, i) => i !== idx),
                          );
                        }}
                        className="text-gray-400 hover:text-red-500 px-1 text-[11px] cursor-pointer"
                        title="Xóa bước này"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Add manual step input (Only for task owner) */}
            {canManageChecklist && (
              <div className="flex items-center gap-1.5 pt-1">
                <input
                  type="text"
                  value={newStepText}
                  onChange={(e) => setNewStepText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (!newStepText.trim()) return;
                      pushChecklistSnapshot();
                      setChecklist((prev) => [
                        ...prev,
                        {
                          id: `manual-${Date.now()}`,
                          text: newStepText.trim(),
                          completed: false,
                        },
                      ]);
                      setNewStepText("");
                    }
                  }}
                  placeholder="Thêm bước thực hiện mới..."
                  className="flex-1 px-2.5 py-1.5 bg-white border border-[#E5E7EB] rounded-xl text-xs focus:outline-none focus:border-[#111827]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newStepText.trim()) return;
                    pushChecklistSnapshot();
                    setChecklist((prev) => [
                      ...prev,
                      {
                        id: `manual-${Date.now()}`,
                        text: newStepText.trim(),
                        completed: false,
                      },
                    ]);
                    setNewStepText("");
                  }}
                  className="px-2.5 py-1.5 bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#111827] rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm</span>
                </button>
              </div>
            )}
          </div>

          {/* Footer Bar: Nút Hoàn tác (khôi phục về dữ liệu gốc mà KHÔNG đóng cửa sổ) + Nút Lưu */}
          {!isReadOnly && (
            <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => resetFormToTask(task)}
                className="px-3 py-2 border border-[#E5E7EB] bg-white hover:bg-gray-100 rounded-xl text-xs font-bold text-[#4B5563] flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Khôi phục lại toàn bộ thông tin ban đầu mà không đóng bảng chi tiết"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Hoàn tác</span>
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-[#111827] hover:bg-[#1f2937] text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Confirmation Dialog for Task Soft Delete */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Chuyển vào thùng rác"
        message={`Bạn có chắc chắn muốn chuyển công việc "Task-${taskNumber !== undefined ? taskNumber : task.id}: ${task.title}" vào thùng rác không? Bạn có thể khôi phục lại bất cứ lúc nào.`}
        confirmText="Chuyển vào thùng rác"
        cancelText="Hủy"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
