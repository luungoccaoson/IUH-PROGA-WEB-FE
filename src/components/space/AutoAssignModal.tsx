"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Sparkles,
  Users,
  X,
  Check,
  CheckCircle2,
  Layers,
  ChevronDown,
  ChevronUp,
  Cpu,
  RotateCcw,
  UserCheck,
} from "lucide-react";
import { Task, Sprint, User } from "@/types";
import { autoAssignTasks, AutoAssignSummary, RoleCategory, TaskAssignmentResult } from "@/utils/roleAssignment";
import { taskService } from "@/services/task.service";

interface AutoAssignModalProps {
  isOpen: boolean;
  tasks: Task[];
  sprints: Sprint[];
  members: User[];
  currentSprintId?: number | null;
  taskNumberMap?: Map<number, number>;
  onClose: () => void;
  onSuccess: () => void;
}

export function AutoAssignModal({
  isOpen,
  tasks,
  sprints,
  members,
  currentSprintId,
  taskNumberMap,
  onClose,
  onSuccess,
}: AutoAssignModalProps) {
  const [unassignedOnly, setUnassignedOnly] = useState(true);
  const [selectedSprintId, setSelectedSprintId] = useState<number | "ALL">(
    currentSprintId !== undefined && currentSprintId !== null ? currentSprintId : "ALL"
  );
  const [viewMode, setViewMode] = useState<"BY_MEMBER" | "BY_TASK">("BY_MEMBER");
  const [expandedMemberId, setExpandedMemberId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lưu trữ các phân công người dùng chủ động chỉnh sửa thủ công trong modal: { [taskId]: memberId }
  const [manualOverrides, setManualOverrides] = useState<Record<number, number>>({});

  // Reset manual overrides khi đổi phạm vi lọc
  useEffect(() => {
    setManualOverrides({});
  }, [unassignedOnly, selectedSprintId]);

  // Tự động mở rộng thành viên đầu tiên có task khi modal mở
  useEffect(() => {
    if (isOpen && expandedMemberId === null && members.length > 0) {
      setExpandedMemberId(members[0].id);
    }
  }, [isOpen, members]);

  // Tính toán kết quả phân công xem trước (Real-time Preview)
  const baseSummary: AutoAssignSummary = useMemo(() => {
    return autoAssignTasks(tasks, members, {
      unassignedOnly,
      sprintId: selectedSprintId === "ALL" ? undefined : selectedSprintId,
    });
  }, [tasks, members, unassignedOnly, selectedSprintId]);

  // Hợp nhất phân công tự động của thuật toán với các chỉnh sửa thủ công của người dùng
  const finalSummary = useMemo(() => {
    if (Object.keys(manualOverrides).length === 0) {
      return baseSummary;
    }

    const updatedPreview: TaskAssignmentResult[] = baseSummary.preview.map((p) => {
      const overrideMemberId = manualOverrides[p.taskId];
      if (overrideMemberId) {
        const newMember = members.find((m) => m.id === overrideMemberId) || p.assignedMember;
        return {
          ...p,
          assignedMember: newMember,
          roleReason: `Đã chỉnh sửa thủ công: ${newMember.fullName || newMember.displayName} (${newMember.jobTitle || "Thành viên"})`,
        };
      }
      return p;
    });

    const updatedAssignments = updatedPreview.map((p) => ({
      taskId: p.taskId,
      ownerId: p.assignedMember.id,
    }));

    const updatedMemberStats = members.map((m) => {
      const memberTasks = updatedPreview.filter((p) => p.assignedMember.id === m.id);
      return {
        member: m,
        count: memberTasks.length,
        assignedTasks: memberTasks,
      };
    });

    return {
      assignments: updatedAssignments,
      preview: updatedPreview,
      memberStats: updatedMemberStats,
      totalAssigned: updatedAssignments.length,
    };
  }, [baseSummary, manualOverrides, members]);

  if (!isOpen) return null;

  const handleManualReassign = (taskId: number, newOwnerId: number) => {
    setManualOverrides((prev) => ({
      ...prev,
      [taskId]: newOwnerId,
    }));
  };

  const handleResetToAuto = () => {
    setManualOverrides({});
  };

  const handleApply = async () => {
    if (finalSummary.assignments.length === 0) {
      alert("Không có công việc nào cần phân công trong phạm vi đã chọn.");
      return;
    }

    try {
      setIsSubmitting(true);
      await taskService.assignTasksBatch(finalSummary.assignments);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Lỗi khi áp dụng phân công:", err);
      alert(err.response?.data?.message || "Không thể áp dụng phân công. Vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryBadge = (category: RoleCategory) => {
    switch (category) {
      case "FRONTEND":
        return {
          label: "Frontend UI",
          style: "bg-[#E8F0FE] text-[#1A73E8] border-[#D2E3FC]",
        };
      case "BACKEND":
        return {
          label: "Backend Service",
          style: "bg-[#FEF7E0] text-[#B06000] border-[#FCE8B2]",
        };
      case "FULLSTACK":
        return {
          label: "Fullstack",
          style: "bg-[#E6F4EA] text-[#137333] border-[#CEEAD6]",
        };
      case "QA":
        return {
          label: "Kiểm thử (QA)",
          style: "bg-[#FCE8E6] text-[#C5221F] border-[#FAD2CF]",
        };
      case "DEVOPS":
        return {
          label: "DevOps / Infra",
          style: "bg-[#F3E8FD] text-[#8430CE] border-[#E9D2FD]",
        };
      case "MANAGEMENT":
        return {
          label: "Quản lý / BA",
          style: "bg-gray-100 text-gray-700 border-gray-200",
        };
      default:
        return {
          label: "Tổng hợp",
          style: "bg-gray-50 text-gray-600 border-gray-200",
        };
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    return parts[parts.length - 1].substring(0, 2).toUpperCase();
  };

  const hasManualChanges = Object.keys(manualOverrides).length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200 font-sans">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 space-y-4 shadow-2xl border border-gray-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-[#111827] text-base font-sans">
                  Tự động phân công theo vai trò chuyên môn
                </h3>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Role Engine
                </span>
                {hasManualChanges && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                    <UserCheck className="w-3 h-3" /> Có chỉnh sửa thủ công ({Object.keys(manualOverrides).length})
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Khớp công việc với vai trò chuyên môn (FE, BE, Fullstack, QA, DevOps). Bạn có thể xem chi tiết và chủ động đổi người cho từng task ngay tại đây.
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

        {/* Filter Controls Bar */}
        <div className="bg-[#F9FAFB] border border-[#E5E7EB] p-3 rounded-xl space-y-2.5 shrink-0 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Scope Selector */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-700 font-mono text-[11px] uppercase tracking-wider flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                Phạm vi:
              </span>
              <select
                value={selectedSprintId}
                onChange={(e) =>
                  setSelectedSprintId(e.target.value === "ALL" ? "ALL" : Number(e.target.value))
                }
                className="bg-white border border-gray-300 rounded-lg px-2.5 py-1 font-medium text-gray-800 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
              >
                <option value="ALL">Toàn bộ Space (Tất cả Sprints & Backlog)</option>
                {sprints.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.status})
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode Toggle & Reset Button */}
            <div className="flex items-center gap-2">
              {hasManualChanges && (
                <button
                  type="button"
                  onClick={handleResetToAuto}
                  className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  title="Hủy bỏ các chỉnh sửa thủ công và hoàn tác lại phân công ban đầu của thuật toán"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Hoàn tác tự động</span>
                </button>
              )}

              <div className="flex items-center bg-gray-200/80 p-0.5 rounded-lg font-mono text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setViewMode("BY_MEMBER")}
                  className={`px-3 py-1 rounded-md transition-all ${
                    viewMode === "BY_MEMBER"
                      ? "bg-white text-gray-900 shadow-xs"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Theo thành viên ({finalSummary.memberStats.length})
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("BY_TASK")}
                  className={`px-3 py-1 rounded-md transition-all ${
                    viewMode === "BY_TASK"
                      ? "bg-white text-gray-900 shadow-xs"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Theo công việc ({finalSummary.totalAssigned})
                </button>
              </div>
            </div>
          </div>

          {/* Unassigned Only Checkbox */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={unassignedOnly}
              onChange={(e) => setUnassignedOnly(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span className="font-semibold text-gray-800">
              Chỉ phân công các công việc chưa có người làm (Unassigned)
            </span>
            <span className="text-[10px] bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.2 rounded font-mono font-bold">
              Khuyên dùng
            </span>
          </label>
        </div>

        {/* Real-time Summary Metrics */}
        <div className="grid grid-cols-3 gap-3 shrink-0 text-xs">
          <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 font-bold font-mono">
              {finalSummary.totalAssigned}
            </div>
            <div>
              <p className="text-[11px] text-gray-500 font-medium">Công việc được gán</p>
              <p className="font-extrabold text-gray-900 font-mono">
                {finalSummary.totalAssigned} Tasks
              </p>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold font-mono">
              {members.length}
            </div>
            <div>
              <p className="text-[11px] text-gray-500 font-medium">Thành viên tham gia</p>
              <p className="font-extrabold text-gray-900 font-mono">
                {members.length} Người
              </p>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 font-bold">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-gray-500 font-medium">Chiến lược</p>
              <p className="font-extrabold text-gray-900 font-mono text-[11px] truncate">
                Cân bằng tải theo vai trò
              </p>
            </div>
          </div>
        </div>

        {/* Content Body: Preview distribution */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3">
          {finalSummary.totalAssigned === 0 ? (
            <div className="py-12 text-center space-y-2 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
              <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto" />
              <p className="font-bold text-gray-700 text-sm">
                Không có công việc nào cần phân công!
              </p>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Tất cả các công việc trong phạm vi đã chọn đều đã có người phụ trách, hoặc danh sách công việc đang trống.
              </p>
            </div>
          ) : viewMode === "BY_MEMBER" ? (
            /* VIEW 1: BY MEMBER */
            <div className="space-y-2.5">
              {finalSummary.memberStats.map(({ member, count, assignedTasks }) => {
                const isExpanded = expandedMemberId === member.id;
                const percentage =
                  finalSummary.totalAssigned > 0
                    ? Math.round((count / finalSummary.totalAssigned) * 100)
                    : 0;

                return (
                  <div
                    key={member.id}
                    className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-2xs hover:border-gray-300 transition-colors"
                  >
                    <div
                      onClick={() => setExpandedMemberId(isExpanded ? null : member.id)}
                      className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-gray-50/60 transition-colors"
                    >
                      {/* Member Info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-100 to-indigo-100 text-blue-700 border border-blue-200 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                          {getInitials(member.fullName || member.displayName)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 text-xs">
                              {member.fullName || member.displayName}
                            </span>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 border border-gray-200 shrink-0">
                              {member.jobTitle || "Thành viên"}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500">{member.email}</p>
                        </div>
                      </div>

                      {/* Workload metric + bar */}
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <span className="font-mono font-extrabold text-xs text-blue-700">
                            +{count} tasks
                          </span>
                          <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1">
                            <div
                              className="h-full bg-blue-600 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>

                        {count > 0 && (
                          <button
                            type="button"
                            className="p-1 text-gray-400 hover:text-gray-600 rounded"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Expandable Task List assigned to this member */}
                    {isExpanded && count > 0 && (
                      <div className="border-t border-gray-100 bg-gray-50/70 p-3 space-y-2">
                        {assignedTasks.map((t) => {
                          const badge = getCategoryBadge(t.category);
                          const isManuallyChanged = Boolean(manualOverrides[t.taskId]);

                          return (
                            <div
                              key={t.taskId}
                              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 bg-white rounded-xl border border-gray-200 text-xs shadow-2xs hover:border-gray-300 transition-colors"
                            >
                              {/* Left: Task ID & Full Title */}
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <span className="font-mono font-bold text-gray-700 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded text-[11px] shrink-0">
                                  Task-{taskNumberMap?.get(t.taskId) ?? t.taskId}
                                </span>
                                <span
                                  title={t.taskTitle}
                                  className="font-semibold text-gray-900 leading-snug break-words"
                                >
                                  {t.taskTitle}
                                </span>
                              </div>

                              {/* Right: Role Tag & Reassign Selector */}
                              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                                <span
                                  title={t.roleReason}
                                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border shrink-0 ${badge.style}`}
                                >
                                  {badge.label}
                                </span>

                                {/* Member Selector to allow reassigning inside modal */}
                                <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1">
                                  <span className="text-[10px] text-gray-400 font-bold uppercase font-mono">
                                    Gán cho:
                                  </span>
                                  <select
                                    value={t.assignedMember.id}
                                    onChange={(e) =>
                                      handleManualReassign(t.taskId, Number(e.target.value))
                                    }
                                    className={`bg-transparent text-xs font-bold focus:outline-none cursor-pointer ${
                                      isManuallyChanged ? "text-amber-700" : "text-gray-800"
                                    }`}
                                  >
                                    {members.map((m) => (
                                      <option key={m.id} value={m.id}>
                                        {m.fullName || m.displayName} ({m.jobTitle || "Thành viên"})
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* VIEW 2: BY TASK TABLE */
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 font-mono text-[10px] uppercase text-gray-500 font-bold">
                  <tr>
                    <th className="p-3 w-1/2">Công việc</th>
                    <th className="p-3">Thành viên được gán</th>
                    <th className="p-3">Phân loại & Lý do</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {finalSummary.preview.map((item) => {
                    const badge = getCategoryBadge(item.category);
                    const isManuallyChanged = Boolean(manualOverrides[item.taskId]);

                    return (
                      <tr key={item.taskId} className="hover:bg-gray-50/60">
                        <td className="p-3 font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-gray-700 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded text-[11px] shrink-0">
                              Task-{taskNumberMap?.get(item.taskId) ?? item.taskId}
                            </span>
                            <span title={item.taskTitle} className="font-semibold text-gray-900">
                              {item.taskTitle}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          {/* Member Dropdown Selector in Table */}
                          <select
                            value={item.assignedMember.id}
                            onChange={(e) =>
                              handleManualReassign(item.taskId, Number(e.target.value))
                            }
                            className={`border rounded-lg px-2 py-1 text-xs font-bold focus:outline-none cursor-pointer ${
                              isManuallyChanged
                                ? "border-amber-300 bg-amber-50 text-amber-900"
                                : "border-gray-300 bg-white text-gray-800"
                            }`}
                          >
                            {members.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.fullName || m.displayName} ({m.jobTitle || "Thành viên"})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span
                              title={item.roleReason}
                              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border shrink-0 ${badge.style}`}
                            >
                              {badge.label}
                            </span>
                            <span
                              title={item.roleReason}
                              className="text-[11px] text-gray-500"
                            >
                              {item.roleReason}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 shrink-0">
          <p className="text-xs text-gray-500">
            Bạn có thể đổi người trực tiếp tại các ô chọn trên, hoặc tinh chỉnh sau tại từng thẻ Task.
          </p>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Hủy
            </button>

            <button
              type="button"
              onClick={handleApply}
              disabled={isSubmitting || finalSummary.totalAssigned === 0}
              className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-mono font-bold transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang áp dụng...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Áp dụng phân công ({finalSummary.totalAssigned})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
