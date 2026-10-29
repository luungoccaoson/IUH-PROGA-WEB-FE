"use client";

import React, { useState, useEffect } from "react";
import { X, Trash2, Calendar, AlignLeft, Check, Lock, AlertTriangle, UserCheck } from "lucide-react";
import { Task, TaskStatus, TaskPriority } from "@/types";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { getTaskTransferredOrigin } from "@/hooks/useSprints";

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
    }
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
  const [status, setStatus] = useState<TaskStatus>("TODO");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [ownerId, setOwnerId] = useState<number | undefined>(undefined);
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setStatus(task.status);
      setPriority(task.priority);
      setOwnerId(task.ownerId);
      setStartDate(task.startDate ? task.startDate.substring(0, 10) : "");
      setDueDate(task.dueDate ? task.dueDate.substring(0, 10) : "");
    }
  }, [task]);

  if (!task) return null;

  const isCoordinator = isPM || isAssistant;
  const taskOwnerId = task.ownerId || task.assignee?.id;
  const isMyTask = Boolean(currentUserId && taskOwnerId === currentUserId);
  const isUnassigned = !taskOwnerId;
  const isOtherMemberTask = !isCoordinator && !isUnassigned && !isMyTask;

  const isReadOnly = isClosedSprint || isOtherMemberTask;
  const canDelete = isPM && !isClosedSprint && (!isActiveSprint || task.status === "TODO");

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
      const isAssignedToOther = Boolean(taskOwnerId && taskOwnerId !== currentUserId);
      if (isAssignedToOther && task.status !== "IN_REVIEW" && task.status !== "DONE") {
        alert("⚠️ Quy trình nghiệm thu: Thành viên phụ trách chưa báo cáo hoàn thành công việc này (chưa qua cột 'Chờ duyệt / IN REVIEW'). PM chỉ duyệt sang 'Đã xong' đối với các công việc đang ở trạng thái 'Chờ duyệt'!");
        return;
      }
    }

    try {
      setIsSubmitting(true);
      await onUpdate(task.id, {
        title: title.trim(),
        description: description.trim() || undefined,
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
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#6B7280] bg-[#F6F5EF] px-2 py-0.5 rounded border border-[#E5E7EB]">
              Task-{taskNumber !== undefined ? taskNumber : task.id}
            </span>
            {isReadOnly && (
              <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                <Lock className="w-3 h-3" /> ĐÃ XONG
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
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {/* IN_REVIEW Approval Banner for PM or Pending Notice for Member */}
          {!isClosedSprint && task.status === "IN_REVIEW" && (
            isPM ? (
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 space-y-2.5 text-xs text-amber-950 shadow-2xs">
                <div className="space-y-0.5">
                  <p className="font-extrabold text-[11px] uppercase tracking-wide flex items-center gap-1.5 text-amber-900">
                    <span>📋 Công việc đang chờ PM nghiệm thu (IN REVIEW)</span>
                  </p>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Thành viên phụ trách đã báo cáo hoàn thành công việc này. Vui lòng kiểm tra chất lượng và bấm duyệt:
                  </p>
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
                    ✓ Duyệt hoàn thành (DONE)
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
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-900 shadow-2xs">
                <div className="space-y-0.5">
                  <p className="font-extrabold text-[11px] text-amber-950 uppercase tracking-wide">
                    ⏳ Đang chờ PM kiểm tra &amp; duyệt (IN REVIEW)
                  </p>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Bạn đã báo cáo hoàn thành công việc này. Công việc sẽ tự động chuyển sang <strong>Đã xong (DONE)</strong> ngay khi PM nghiệm thu đạt yêu cầu.
                  </p>
                </div>
              </div>
            )
          )}

          {/* RBAC Self-Assign Banner for Unassigned Tasks */}
          {!isClosedSprint && !isPM && isUnassigned && currentUserId && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between gap-2 text-xs text-blue-900 shadow-2xs">
              <div className="space-y-0.5">
                <p className="font-extrabold text-[11px] text-blue-950 uppercase tracking-wide flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  Công việc chưa có người phụ trách
                </p>
                <p className="text-[11px] text-blue-800">
                  Bạn có thể tự nhận (Self-assign) công việc này để bắt đầu thực hiện.
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
            <div className="bg-gray-100 border border-gray-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-gray-700">
              <Lock className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold text-[11px] text-gray-900 uppercase tracking-wide">
                  Chế độ chỉ xem (Phân quyền MEMBER)
                </p>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  Công việc này đang thuộc về thành viên khác. Bạn chỉ được chỉnh sửa các công việc do chính mình phụ trách hoặc tự nhận các công việc chưa có người làm.
                </p>
              </div>
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
                    Công việc này trễ hạn từ <strong>{transferred.originSprintName}</strong> (Sprint đã đóng) và đã được chuyển sang Sprint hiện tại để tiếp tục thực hiện.
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Task Title Edit */}
          <div className="space-y-1">
            <label className="font-bold text-[#6B7280] uppercase tracking-wider font-mono text-[10px]">
              Tên công việc <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              disabled={isReadOnly}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-base font-extrabold text-[#111827] border-b border-transparent hover:border-[#E5E7EB] focus:border-[#111827] focus:outline-none py-1 transition-colors disabled:bg-transparent"
            />
          </div>

          {/* Quick Settings Grid (Status, Priority, Assignee) */}
          <div className="grid grid-cols-2 gap-3 bg-[#F9FAFB] p-3.5 rounded-2xl border border-[#E5E7EB]">
            {/* Status Selector (4 States: TODO, IN_PROGRESS, IN_REVIEW, DONE) */}
            <div className="space-y-1">
              <label className="font-bold text-[#6B7280] uppercase tracking-wider font-mono text-[10px]">
                Trạng thái
              </label>
              <select
                disabled={isReadOnly}
                value={status}
                onChange={(e) => {
                  const chosen = e.target.value as TaskStatus;
                  if (chosen === "DONE" && !isPM) {
                    setStatus("IN_REVIEW");
                    return;
                  }
                  setStatus(chosen);
                }}
                className="w-full px-2 py-1.5 bg-white border border-[#E5E7EB] rounded-xl font-bold text-xs focus:outline-none disabled:bg-gray-100"
              >
                <option value="TODO">Cần làm</option>
                <option value="IN_PROGRESS">Đang làm</option>
                <option value="IN_REVIEW">Chờ PM duyệt (In Review)</option>
                <option value="DONE">
                  {!isPM ? "Đã xong (→ Chờ PM duyệt)" : "Đã xong (PM duyệt)"}
                </option>
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
                disabled={isReadOnly || (!isCoordinator && !isUnassigned && !isMyTask)}
                value={ownerId || ""}
                onChange={(e) => setOwnerId(e.target.value ? parseInt(e.target.value, 10) : undefined)}
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
                        const uName = m.user?.fullName || m.user?.email || m.fullName || m.name || `Thành viên #${uId}`;
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
                    🔒 <strong>Khóa chỉnh ngày:</strong> Không được phép chỉnh sửa ngày vì công việc đã trễ hạn từ sprint trước (bạn vẫn có thể chỉnh sửa tiêu đề, người phụ trách và trạng thái).
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
              rows={5}
              disabled={isReadOnly}
              placeholder="Thêm mô tả chi tiết cho công việc tại đây..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 border border-[#E5E7EB] rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-[#111827] text-xs font-medium text-[#111827] leading-relaxed disabled:bg-gray-50"
            />
          </div>

          {/* Footer Bar */}
          {!isReadOnly && (
            <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 border border-[#E5E7EB] bg-white hover:bg-gray-50 rounded-xl text-xs font-bold text-[#4B5563]"
              >
                Hủy
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-[#111827] hover:bg-[#1f2937] text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 disabled:opacity-50"
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
