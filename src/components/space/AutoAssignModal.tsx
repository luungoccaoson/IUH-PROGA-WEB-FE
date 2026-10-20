"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  Sparkles,
  Users,
  X,
  Check,
  CheckCircle2,
  Layers,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  UserCheck,
  Search,
  Calendar,
  Terminal,
  Monitor,
  ShieldCheck,
  Cloud,
  FileText,
  Clock,
} from "lucide-react";
import { Task, Sprint, User } from "@/types";
import {
  autoAssignTasks,
  AutoAssignSummary,
  RoleCategory,
  TaskAssignmentResult,
  getTaskComplexity,
} from "@/utils/roleAssignment";
import {
  optimizeScheduleForAssignments,
  ScheduledTaskDate,
} from "@/utils/taskScheduleOptimizer";
import { taskService } from "@/services/task.service";

// Reusable Searchable Member Picker Popover
interface TaskMemberPickerProps {
  currentUserId?: number;
  users: User[];
  onSelect: (userId: number) => void;
  align?: "left" | "right";
}

function TaskMemberPicker({
  currentUserId,
  users,
  onSelect,
  align = "right",
}: TaskMemberPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedUser = users.find((u) => u.id === currentUserId);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        (u.fullName || "").toLowerCase().includes(q) ||
        (u.displayName || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q)
    );
  }, [users, search]);

  const getInitials = (name?: string) => {
    if (!name || !name.trim()) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-400 rounded-xl text-xs font-semibold text-slate-800 shadow-2xs transition-all cursor-pointer min-w-[145px] max-w-[180px] justify-between"
        title="Bấm để chọn hoặc tìm kiếm thành viên gán task"
      >
        <div className="flex items-center gap-1.5 truncate">
          <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0">
            {selectedUser ? getInitials(selectedUser.fullName || selectedUser.displayName) : "?"}
          </div>
          <span className="truncate text-xs font-semibold text-slate-800">
            {selectedUser ? selectedUser.fullName || selectedUser.displayName : "Chọn người"}
          </span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      </button>

      {isOpen && (
        <div
          className={`absolute ${align === "right" ? "right-0" : "left-0"
            } top-full mt-1 w-64 bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-2 space-y-1.5 animate-in fade-in zoom-in-95 duration-150`}
        >
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên..."
              autoFocus
              className="w-full pl-8 pr-2 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-slate-50/70"
            />
          </div>

          <div className="max-h-48 overflow-y-auto space-y-0.5 pr-0.5">
            {filtered.length === 0 ? (
              <div className="p-3 text-center text-[11px] text-slate-400">
                Không tìm thấy thành viên phù hợp
              </div>
            ) : (
              filtered.map((u) => {
                const isSelected = u.id === currentUserId;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      onSelect(u.id);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className={`w-full flex items-center justify-between p-1.5 rounded-lg text-left text-xs transition-colors cursor-pointer ${isSelected
                      ? "bg-blue-50 text-blue-800 font-bold"
                      : "hover:bg-slate-100 text-slate-700"
                      }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                        {getInitials(u.fullName || u.displayName)}
                      </div>
                      <div className="truncate">
                        <span className="block truncate text-xs font-semibold">
                          {u.fullName || u.displayName}
                        </span>
                        <span className="block truncate text-[10px] text-slate-400 font-mono">
                          {u.jobTitle || "Thành viên"}
                        </span>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

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

  // Bản đồ thứ tự Sprint từ thấp đến cao (Sprint 1 < Sprint 2 < ... < Backlog)
  const sprintOrderMap = useMemo(() => {
    const map = new Map<number, number>();
    const sorted = [...sprints].sort((a, b) => {
      const matchA = a.name.match(/\d+/);
      const matchB = b.name.match(/\d+/);
      const numA = matchA ? parseInt(matchA[0], 10) : null;
      const numB = matchB ? parseInt(matchB[0], 10) : null;
      if (numA !== null && numB !== null) return numA - numB;
      if (a.startDate && b.startDate) {
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      }
      return (a.id || 0) - (b.id || 0);
    });
    sorted.forEach((sp, idx) => {
      map.set(sp.id, idx);
    });
    return map;
  }, [sprints]);

  const compareTasksBySprint = useCallback(
    (
      a: { taskId: number; sprintId?: number | null },
      b: { taskId: number; sprintId?: number | null }
    ) => {
      const rankA = a.sprintId ? (sprintOrderMap.get(a.sprintId) ?? 9999) : 99999;
      const rankB = b.sprintId ? (sprintOrderMap.get(b.sprintId) ?? 9999) : 99999;
      if (rankA !== rankB) return rankA - rankB;
      return a.taskId - b.taskId;
    },
    [sprintOrderMap]
  );

  // Hợp nhất phân công tự động của thuật toán với các chỉnh sửa thủ công của người dùng
  const finalSummary = useMemo(() => {
    const rawPreview: TaskAssignmentResult[] = baseSummary.preview.map((p) => {
      const overrideMemberId = manualOverrides[p.taskId];
      if (overrideMemberId) {
        const newMember = members.find((m) => m.id === overrideMemberId) || p.assignedMember;
        return {
          ...p,
          assignedMember: newMember,
          roleReason: `Chỉnh sửa thủ công: ${newMember.fullName || newMember.displayName}`,
        };
      }
      return p;
    });

    // Sắp xếp danh sách theo Sprint từ thấp đến cao
    const sortedPreview = [...rawPreview].sort(compareTasksBySprint);

    const updatedAssignments = sortedPreview.map((p) => ({
      taskId: p.taskId,
      ownerId: p.assignedMember.id,
    }));

    const updatedMemberStats = members.map((m) => {
      const memberTasks = sortedPreview.filter((p) => p.assignedMember.id === m.id);
      memberTasks.sort(compareTasksBySprint);
      return {
        member: m,
        count: memberTasks.length,
        assignedTasks: memberTasks,
      };
    });

    return {
      assignments: updatedAssignments,
      preview: sortedPreview,
      memberStats: updatedMemberStats,
      totalAssigned: updatedAssignments.length,
    };
  }, [baseSummary, manualOverrides, members, compareTasksBySprint]);

  // Lập lịch ngày làm việc thông minh tự động hoàn toàn độc lập cho từng người
  const scheduledDatesMap = useMemo(() => {
    return optimizeScheduleForAssignments(
      finalSummary.assignments,
      tasks,
      sprints
    );
  }, [finalSummary.assignments, tasks, sprints]);

  // Gom nhóm công việc theo VAI TRÒ CHUYÊN MÔN cho tab "Theo công việc" (View BY_TASK)
  const roleGroups = useMemo(() => {
    const order: {
      cat: RoleCategory;
      title: string;
      badgeClass: string;
      icon: React.ReactNode;
    }[] = [
        {
          cat: "BACKEND",
          title: "Backend & Cơ sở dữ liệu",
          badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
          icon: <Terminal className="w-4 h-4 text-amber-600" />,
        },
        {
          cat: "FRONTEND",
          title: "Frontend & Giao diện người dùng",
          badgeClass: "bg-blue-100 text-blue-800 border-blue-200",
          icon: <Monitor className="w-4 h-4 text-blue-600" />,
        },
        {
          cat: "QA",
          title: "Kiểm thử & Đảm bảo chất lượng (QA)",
          badgeClass: "bg-rose-100 text-rose-800 border-rose-200",
          icon: <ShieldCheck className="w-4 h-4 text-rose-600" />,
        },
        {
          cat: "DEVOPS",
          title: "DevOps & Hạ tầng triển khai",
          badgeClass: "bg-purple-100 text-purple-800 border-purple-200",
          icon: <Cloud className="w-4 h-4 text-purple-600" />,
        },
        {
          cat: "MANAGEMENT",
          title: "Quản lý & Nghiệp vụ (BA / PM / Scrum)",
          badgeClass: "bg-slate-200 text-slate-800 border-slate-300",
          icon: <FileText className="w-4 h-4 text-slate-600" />,
        },
        {
          cat: "GENERAL",
          title: "Nhiệm vụ chung & Khác",
          badgeClass: "bg-gray-100 text-gray-800 border-gray-200",
          icon: <Layers className="w-4 h-4 text-gray-600" />,
        },
      ];

    return order
      .map((g) => {
        const groupTasks = finalSummary.preview.filter((p) => p.category === g.cat);
        // Sắp xếp các task trong từng nhóm chuyên môn theo thứ tự Sprint từ thấp đến cao
        groupTasks.sort(compareTasksBySprint);
        const totalDays = groupTasks.reduce((sum, p) => {
          const originalTask = tasks.find((t) => t.id === p.taskId);
          return sum + (originalTask ? getTaskComplexity(originalTask).days : 2);
        }, 0);

        return {
          ...g,
          items: groupTasks,
          totalDays,
        };
      })
      .filter((g) => g.items.length > 0);
  }, [finalSummary.preview, tasks, compareTasksBySprint]);

  // Helper format Sprint badge hiển thị tên Sprint gọn gàng (rê chuột vào xem đầy đủ)
  const getSprintShortBadge = (sprintId?: number | null) => {
    if (!sprintId) return { shortName: "Backlog", fullName: "Chưa thuộc Sprint nào (Backlog)" };
    const sprint = sprints.find((s) => s.id === sprintId);
    if (!sprint) return { shortName: `Sprint ${sprintId}`, fullName: `Sprint ${sprintId}` };

    const fullName = sprint.name;
    // Bỏ phần "(Tuần X)" ở cuối nếu có để tên gọn gàng hơn mà vẫn giữ tên sprint
    const cleanName = fullName.replace(/\s*\(Tuần\s*\d+\)\s*$/i, "").trim();
    let shortName = cleanName;
    if (shortName.length > 28) {
      shortName = shortName.slice(0, 26).trim() + "...";
    }

    return {
      shortName,
      fullName,
    };
  };

  // Helper hiển thị số ngày làm việc thực tế do AI tính từ trước (không chữ "Độ phức tạp", không số lẻ)
  const getWorkDaysBadge = (task?: Task) => {
    if (!task) {
      return {
        label: "2 ngày",
        style: "bg-blue-50 text-blue-800 border-blue-200",
      };
    }
    const comp = getTaskComplexity(task);
    if (comp.days >= 3) {
      return {
        label: `${comp.days} ngày`,
        style: "bg-amber-50 text-amber-800 border-amber-200",
      };
    }
    if (comp.days === 2) {
      return {
        label: `${comp.days} ngày`,
        style: "bg-blue-50 text-blue-800 border-blue-200",
      };
    }
    return {
      label: `${comp.days} ngày`,
      style: "bg-emerald-50 text-emerald-800 border-emerald-200",
    };
  };

  const getInitials = (name?: string) => {
    if (!name || !name.trim()) return "U";
    const parts = name.trim().split(" ");
    return parts[parts.length - 1].substring(0, 2).toUpperCase();
  };

  const hasManualChanges = Object.keys(manualOverrides).length > 0;

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
      // Gắn kèm ngày bắt đầu và ngày kết thúc đã được tính toán thông minh theo từng thành viên
      const assignmentsWithDates = finalSummary.assignments.map((a) => {
        const scheduled = scheduledDatesMap.get(a.taskId);
        return {
          taskId: a.taskId,
          ownerId: a.ownerId,
          startDate: scheduled ? `${scheduled.startDate}T08:00:00` : undefined,
          dueDate: scheduled ? `${scheduled.dueDate}T18:00:00` : undefined,
        };
      });

      await taskService.assignTasksBatch(assignmentsWithDates);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Lỗi khi áp dụng phân công:", err);
      alert(err.response?.data?.message || "Không thể áp dụng phân công. Vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

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
                AI tự động phân bổ cân đối theo độ phức tạp công việc và chuyên môn giữa tất cả các thành viên trong Space.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
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
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${viewMode === "BY_MEMBER"
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                    }`}
                >
                  Theo thành viên ({finalSummary.memberStats.length})
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("BY_TASK")}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${viewMode === "BY_TASK"
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                    }`}
                >
                  Theo công việc ({finalSummary.totalAssigned})
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-200/60">
            {/* Unassigned Only Checkbox */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={unassignedOnly}
                onChange={(e) => setUnassignedOnly(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer"
              />
              <span className="font-semibold text-gray-800">
                Chỉ phân công các công việc chưa có người làm (Unassigned)
              </span>
              <span className="text-[10px] bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.2 rounded font-mono font-bold">
                Khuyên dùng
              </span>
            </label>
          </div>
        </div>

        {/* 2 Metric Cards (Đã bỏ Card 3 "Chiến lược cân bằng tải" theo góp ý của thầy) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0 text-xs">
          <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 font-bold font-mono">
              {finalSummary.totalAssigned}
            </div>
            <div>
              <p className="text-[11px] text-gray-500 font-medium">Tổng công việc cần phân bổ</p>
              <p className="font-extrabold text-gray-900 font-mono text-xs">
                {finalSummary.totalAssigned} Tasks
              </p>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold font-mono">
              {members.length}
            </div>
            <div>
              <p className="text-[11px] text-gray-500 font-medium">Thành viên tham gia Space</p>
              <p className="font-extrabold text-gray-900 font-mono text-xs">
                {members.length} Người
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
                            className="p-1 text-gray-400 hover:text-gray-600 rounded cursor-pointer"
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
                          const originalTask = tasks.find((item) => item.id === t.taskId);
                          const daysBadge = getWorkDaysBadge(originalTask);
                          const sprintBadge = getSprintShortBadge(t.sprintId);

                          return (
                            <div
                              key={t.taskId}
                              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 bg-white rounded-xl border border-gray-200 text-xs shadow-2xs hover:border-gray-300 transition-colors"
                            >
                              {/* Left: Task ID, Title & Badges */}
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <span className="font-mono font-bold text-gray-700 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded text-[11px] shrink-0">
                                  Task-{taskNumberMap?.get(t.taskId) ?? t.taskId}
                                </span>
                                <div className="min-w-0 flex-1 space-y-1">
                                  <span
                                    title={t.taskTitle}
                                    className="font-semibold text-gray-900 block truncate"
                                  >
                                    {t.taskTitle}
                                  </span>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <div className="relative group/sprint shrink-0">
                                      <span
                                        className="inline-flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 cursor-pointer max-w-[200px] sm:max-w-[240px]"
                                      >
                                        <Calendar className="w-3 h-3 text-blue-500 shrink-0" />
                                        <span className="truncate">{sprintBadge.shortName}</span>
                                      </span>
                                      {/* Popup chi tiết Sprint ngay khi di chuột - cùng màu xanh trang nhã */}
                                      <div className="absolute bottom-full left-0 mb-1.5 hidden group-hover/sprint:flex flex-col gap-0.5 z-50 min-w-[220px] max-w-[320px] p-2.5 bg-blue-50/95 text-blue-950 border border-blue-300 rounded-xl shadow-xl pointer-events-none animate-in fade-in zoom-in-95 text-xs">
                                        {/* <div className="flex items-center gap-1 text-[10px] font-bold font-mono text-blue-700 uppercase pb-1 border-b border-blue-200">
                                          <Calendar className="w-3 h-3 text-blue-600" /> Chi tiết Sprint
                                        </div> */}
                                        <p className="font-extrabold text-[11px] leading-snug text-blue-600 pt-0.5">
                                          {sprintBadge.fullName}
                                        </p>
                                      </div>
                                    </div>
                                    <span
                                      className={`inline-flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded-md border ${daysBadge.style}`}
                                      title={`Thời gian làm việc ước tính: ${daysBadge.label}`}
                                    >
                                      <Clock className="w-3 h-3 text-slate-500" />
                                      {daysBadge.label}
                                    </span>

                                    {/* Smart Scheduled Dates Badge (Chỉ hiển thị ngày tháng gọn gàng) */}
                                    {(() => {
                                      const scheduled = scheduledDatesMap.get(t.taskId);
                                      if (!scheduled) return null;
                                      return (
                                        <span
                                          className="inline-flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded-md border bg-emerald-50 text-emerald-800 border-emerald-200 shrink-0"
                                          title={`Thời gian thực hiện dự kiến: ${new Date(scheduled.startDate).toLocaleDateString("vi-VN")} - ${new Date(scheduled.dueDate).toLocaleDateString("vi-VN")}`}
                                        >
                                          <Calendar className="w-3 h-3 text-emerald-600 shrink-0" />
                                          <span>
                                            {new Date(scheduled.startDate).toLocaleDateString("vi-VN", {
                                              day: "2-digit",
                                              month: "2-digit",
                                            })}{" "}
                                            ➔{" "}
                                            {new Date(scheduled.dueDate).toLocaleDateString("vi-VN", {
                                              day: "2-digit",
                                              month: "2-digit",
                                            })}
                                          </span>
                                        </span>
                                      );
                                    })()}
                                  </div>
                                </div>
                              </div>

                              {/* Right: Searchable Member Picker */}
                              <div className="shrink-0 flex items-center gap-1.5">
                                <span className="text-[10px] text-gray-400 font-bold uppercase font-mono">
                                  Gán cho:
                                </span>
                                <TaskMemberPicker
                                  currentUserId={t.assignedMember.id}
                                  users={members}
                                  onSelect={(newOwnerId) =>
                                    handleManualReassign(t.taskId, newOwnerId)
                                  }
                                />
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
            /* VIEW 2: BY TASK (Phân nhóm trực quan theo VAI TRÒ CỦA CÔNG VIỆC) */
            <div className="space-y-4">
              {roleGroups.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-500 italic bg-gray-50 rounded-xl border border-gray-200">
                  Không tìm thấy công việc nào phù hợp với bộ lọc hiện tại.
                </div>
              ) : (
                roleGroups.map((group) => (
                  <div
                    key={group.cat}
                    className="border border-slate-200/90 rounded-2xl bg-slate-50/50 p-3 space-y-2.5 shadow-2xs"
                  >
                    {/* Role Group Header */}
                    <div className="flex items-center justify-between pb-1 px-1">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-lg bg-white border border-slate-200 shadow-2xs">
                          {group.icon}
                        </div>
                        <h4 className="font-extrabold text-xs text-slate-900 tracking-wide uppercase">
                          {group.title}
                        </h4>
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${group.badgeClass}`}
                        >
                          {group.items.length} công việc
                        </span>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-slate-500">
                        Tổng: {group.totalDays} ngày
                      </span>
                    </div>

                    {/* Task items in this role group */}
                    <div className="space-y-2">
                      {group.items.map((item) => {
                        const originalTask = tasks.find((t) => t.id === item.taskId);
                        const daysBadge = getWorkDaysBadge(originalTask);
                        const sprintBadge = getSprintShortBadge(item.sprintId);

                        return (
                          <div
                            key={item.taskId}
                            className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs hover:border-blue-400 hover:shadow-xs transition-all"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <span className="text-[11px] font-mono font-extrabold px-2 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                                Task-{taskNumberMap?.get(item.taskId) ?? item.taskId}
                              </span>

                              <div className="min-w-0 flex-1 space-y-1">
                                <span
                                  className="text-xs font-bold text-slate-900 block truncate"
                                  title={item.taskTitle}
                                >
                                  {item.taskTitle}
                                </span>

                                <div className="flex flex-wrap items-center gap-2">
                                  {/* Sprint badge với popup chi tiết ngay khi di chuột */}
                                  <div className="relative group/sprint shrink-0">
                                    <span
                                      className="inline-flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 cursor-pointer max-w-[200px] sm:max-w-[260px]"
                                    >
                                      <Calendar className="w-3 h-3 text-blue-500 shrink-0" />
                                      <span className="truncate">{sprintBadge.shortName}</span>
                                    </span>
                                    {/* Popup chi tiết Sprint ngay khi di chuột - cùng màu xanh trang nhã */}
                                    <div className="absolute bottom-full left-0 mb-1.5 hidden group-hover/sprint:flex flex-col gap-0.5 z-50 min-w-[220px] max-w-[320px] p-2.5 bg-blue-50/95 text-blue-950 border border-blue-300 rounded-xl shadow-xl pointer-events-none animate-in fade-in zoom-in-95 text-xs">
                                      {/* <div className="flex items-center gap-1 text-[10px] font-bold font-mono text-blue-700 uppercase pb-1 border-b border-blue-200">
                                        <Calendar className="w-3 h-3 text-blue-600" /> Chi tiết Sprint
                                      </div> */}
                                      <p className="font-extrabold text-[11px] leading-snug text-blue-600 pt-0.5">
                                        {sprintBadge.fullName}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Số ngày làm việc thực tế do AI tính (không chữ Độ phức tạp, không số lẻ) */}
                                  <span
                                    className={`inline-flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded-md border ${daysBadge.style}`}
                                    title={`Thời gian làm việc ước tính: ${daysBadge.label}`}
                                  >
                                    <Clock className="w-3 h-3 text-slate-500" />
                                    {daysBadge.label}
                                  </span>

                                  {/* Smart Scheduled Dates Badge (Chỉ hiển thị ngày tháng gọn gàng) */}
                                  {(() => {
                                    const scheduled = scheduledDatesMap.get(item.taskId);
                                    if (!scheduled) return null;
                                    return (
                                      <span
                                        className="inline-flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded-md border bg-emerald-50 text-emerald-800 border-emerald-200 shrink-0"
                                        title={`Thời gian thực hiện dự kiến: ${new Date(scheduled.startDate).toLocaleDateString("vi-VN")} - ${new Date(scheduled.dueDate).toLocaleDateString("vi-VN")}`}
                                      >
                                        <Calendar className="w-3 h-3 text-emerald-600 shrink-0" />
                                        <span>
                                          {new Date(scheduled.startDate).toLocaleDateString("vi-VN", {
                                            day: "2-digit",
                                            month: "2-digit",
                                          })}{" "}
                                          ➔{" "}
                                          {new Date(scheduled.dueDate).toLocaleDateString("vi-VN", {
                                            day: "2-digit",
                                            month: "2-digit",
                                          })}
                                        </span>
                                      </span>
                                    );
                                  })()}
                                </div>
                              </div>
                            </div>

                            {/* Searchable Member Picker (Gọn gàng, tìm kiếm bằng tên) */}
                            <div className="shrink-0 flex items-center gap-2">
                              <TaskMemberPicker
                                currentUserId={item.assignedMember.id}
                                users={members}
                                onSelect={(newOwnerId) =>
                                  handleManualReassign(item.taskId, newOwnerId)
                                }
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
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
