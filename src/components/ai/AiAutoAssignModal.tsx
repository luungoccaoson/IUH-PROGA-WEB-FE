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
  UserCheck,
  UserPlus,
  Search,
  Trash2,
  Briefcase,
  AlertCircle,
} from "lucide-react";
import { DecomposedTaskItem } from "@/services/ai.service";
import { User } from "@/types";
import { getMemberCapabilities, RoleCategory } from "@/utils/roleAssignment";
import { useAuthStore } from "@/stores/useAuthStore";

interface AiAutoAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: DecomposedTaskItem[];
  onApplyAssignments: (updatedTasks: DecomposedTaskItem[]) => void;
  workspaceUsers: User[];
  currentSpaceUsers: User[];
  onUpdateSpaceUsers: (users: User[]) => void;
  availableSprints?: string[];
}

export function AiAutoAssignModal({
  isOpen,
  onClose,
  tasks,
  onApplyAssignments,
  workspaceUsers = [],
  currentSpaceUsers = [],
  onUpdateSpaceUsers,
  availableSprints = [],
}: AiAutoAssignModalProps) {
  // Search & filter states
  const [searchMemberQuery, setSearchMemberQuery] = useState("");
  const [unassignedOnly, setUnassignedOnly] = useState(false);
  const [selectedSprint, setSelectedSprint] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"BY_MEMBER" | "BY_TASK">("BY_MEMBER");
  const [expandedMemberId, setExpandedMemberId] = useState<number | null>(null);
  const [manualOverrides, setManualOverrides] = useState<Record<number, number>>({});
  const [assignSuccess, setAssignSuccess] = useState(false);

  // Current logged in user (creator)
  const currentUser = useAuthStore((s) => s.user);

  // Make sure current user is in spaceUsers if spaceUsers is empty or doesn't have them
  useEffect(() => {
    if (isOpen && currentUser && !currentSpaceUsers.some((u) => u.id === currentUser.id)) {
      const matchInWorkspace = workspaceUsers.find((wu) => wu.id === currentUser.id) || currentUser;
      onUpdateSpaceUsers([matchInWorkspace, ...currentSpaceUsers]);
    }
  }, [isOpen, currentUser, currentSpaceUsers, workspaceUsers, onUpdateSpaceUsers]);

  // Expand first member by default
  useEffect(() => {
    if (isOpen && expandedMemberId === null && currentSpaceUsers.length > 0) {
      setExpandedMemberId(currentSpaceUsers[0].id);
    }
  }, [isOpen, currentSpaceUsers]);

  // Reset manual overrides when changing sprint filter
  useEffect(() => {
    setManualOverrides({});
  }, [selectedSprint, unassignedOnly]);

  // Sprints list derived from tasks if not passed
  const sprintOptions = useMemo(() => {
    if (availableSprints.length > 0) return availableSprints;
    const sSet = new Set<string>();
    tasks.forEach((t) => {
      if (t.sprint) sSet.add(t.sprint);
    });
    return Array.from(sSet);
  }, [availableSprints, tasks]);

  // Filter tasks based on selected sprint and unassigned filter
  const filteredTasksWithIndex = useMemo(() => {
    return tasks
      .map((t, idx) => ({ task: t, originalIndex: idx }))
      .filter(({ task }) => {
        if (selectedSprint !== "ALL" && task.sprint !== selectedSprint) {
          return false;
        }
        if (unassignedOnly && task.suggestedMemberName && task.suggestedMemberName.trim() !== "") {
          return false;
        }
        return true;
      });
  }, [tasks, selectedSprint, unassignedOnly]);

  // Calculate Auto Assignment Preview based on role matching & load balancing
  const autoAssignedPlan = useMemo(() => {
    if (currentSpaceUsers.length === 0 || filteredTasksWithIndex.length === 0) {
      return {
        assignments: [] as { taskIndex: number; assignedUser: User; category: RoleCategory; reason: string }[],
      };
    }

    const categorized = currentSpaceUsers.map((u) => ({
      user: u,
      caps: getMemberCapabilities(u),
    }));

    const feList = categorized.filter((c) => c.caps.isFrontend);
    const beList = categorized.filter((c) => c.caps.isBackend);
    const qaList = categorized.filter((c) => c.caps.isQA);
    const fsList = categorized.filter((c) => c.caps.isFullstack);
    const mgmtList = categorized.filter((c) => c.caps.isManagement);
    const devopsList = categorized.filter((c) => c.caps.isDevOps);

    let feIdx = 0;
    let beIdx = 0;
    let qaIdx = 0;
    let fsIdx = 0;
    let mgmtIdx = 0;
    let devopsIdx = 0;
    let genIdx = 0;

    const assignments = filteredTasksWithIndex.map(({ task, originalIndex }) => {
      // Check manual override first
      const overrideId = manualOverrides[originalIndex];
      if (overrideId) {
        const found = currentSpaceUsers.find((u) => u.id === overrideId);
        if (found) {
          return {
            taskIndex: originalIndex,
            assignedUser: found,
            category: "GENERAL" as RoleCategory,
            reason: `Đã chỉnh sửa thủ công: ${found.fullName || found.username}`,
          };
        }
      }

      const roleStr = (task.assignedRole || "").toLowerCase();
      const titleStr = (task.title || "").toLowerCase();
      const descStr = (task.description || "").toLowerCase();

      let assigned: User | null = null;
      let cat: RoleCategory = "GENERAL";
      let reason = "";

      // 1. QA / Tester
      if (
        roleStr.includes("qa") ||
        roleStr.includes("tester") ||
        roleStr.includes("qc") ||
        titleStr.includes("kiểm thử") ||
        titleStr.includes("test")
      ) {
        cat = "QA";
        if (qaList.length > 0) {
          assigned = qaList[qaIdx % qaList.length].user;
          qaIdx++;
          reason = `Phù hợp kỹ năng QA / Tester (${assigned.jobTitle || "QA"})`;
        }
      }
      // 2. Management / BA / PO
      else if (
        roleStr.includes("pm") ||
        roleStr.includes("ba") ||
        roleStr.includes("quản lý") ||
        roleStr.includes("business") ||
        titleStr.includes("phân tích") ||
        titleStr.includes("nghiệp vụ") ||
        titleStr.includes("yêu cầu")
      ) {
        cat = "MANAGEMENT";
        if (mgmtList.length > 0) {
          assigned = mgmtList[mgmtIdx % mgmtList.length].user;
          mgmtIdx++;
          reason = `Phù hợp kỹ năng Quản lý / BA (${assigned.jobTitle || "BA/PM"})`;
        }
      }
      // 3. DevOps / System / Cloud
      else if (
        roleStr.includes("devops") ||
        roleStr.includes("system") ||
        roleStr.includes("hạ tầng") ||
        titleStr.includes("docker") ||
        titleStr.includes("deploy") ||
        titleStr.includes("ci/cd")
      ) {
        cat = "DEVOPS";
        if (devopsList.length > 0) {
          assigned = devopsList[devopsIdx % devopsList.length].user;
          devopsIdx++;
          reason = `Phù hợp kỹ năng DevOps / Hạ tầng (${assigned.jobTitle || "DevOps"})`;
        }
      }
      // 4. Frontend / UI
      else if (
        roleStr.includes("frontend") ||
        roleStr.includes("ui") ||
        titleStr.includes("giao diện") ||
        titleStr.includes("màn hình") ||
        titleStr.includes("component") ||
        descStr.includes("react")
      ) {
        cat = "FRONTEND";
        if (feList.length > 0) {
          assigned = feList[feIdx % feList.length].user;
          feIdx++;
          reason = `Phù hợp chuyên môn Frontend UI (${assigned.jobTitle || "FE"})`;
        } else if (fsList.length > 0) {
          assigned = fsList[fsIdx % fsList.length].user;
          fsIdx++;
          reason = `Hỗ trợ Frontend bởi Fullstack Developer (${assigned.jobTitle || "Fullstack"})`;
        }
      }
      // 5. Backend / Database / API
      else if (
        roleStr.includes("backend") ||
        roleStr.includes("database") ||
        roleStr.includes("api") ||
        titleStr.includes("api") ||
        titleStr.includes("csdl") ||
        titleStr.includes("schema") ||
        titleStr.includes("service")
      ) {
        cat = "BACKEND";
        if (beList.length > 0) {
          assigned = beList[beIdx % beList.length].user;
          beIdx++;
          reason = `Phù hợp chuyên môn Backend & API (${assigned.jobTitle || "BE"})`;
        } else if (fsList.length > 0) {
          assigned = fsList[fsIdx % fsList.length].user;
          fsIdx++;
          reason = `Hỗ trợ Backend bởi Fullstack Developer (${assigned.jobTitle || "Fullstack"})`;
        }
      }

      // Fallback: round-robin across all available space members
      if (!assigned) {
        assigned = currentSpaceUsers[genIdx % currentSpaceUsers.length];
        genIdx++;
        reason = `Phân bổ cân bằng tải trong Space (${assigned.jobTitle || "Thành viên"})`;
      }

      return {
        taskIndex: originalIndex,
        assignedUser: assigned,
        category: cat,
        reason,
      };
    });

    return { assignments };
  }, [filteredTasksWithIndex, currentSpaceUsers, manualOverrides]);

  // Group assigned tasks by member
  const memberStats = useMemo(() => {
    return currentSpaceUsers.map((m) => {
      const assigned = autoAssignedPlan.assignments.filter((a) => a.assignedUser.id === m.id);
      return {
        member: m,
        count: assigned.length,
        items: assigned,
      };
    });
  }, [currentSpaceUsers, autoAssignedPlan]);

  // Apply assignments
  const handleApply = () => {
    if (autoAssignedPlan.assignments.length === 0) {
      alert("Không có công việc nào cần phân công trong phạm vi đã chọn.");
      return;
    }

    const updatedTasks = [...tasks];
    autoAssignedPlan.assignments.forEach(({ taskIndex, assignedUser }) => {
      if (updatedTasks[taskIndex]) {
        updatedTasks[taskIndex] = {
          ...updatedTasks[taskIndex],
          suggestedMemberName:
            assignedUser.fullName || assignedUser.username || assignedUser.email?.split("@")[0],
        };
      }
    });

    onApplyAssignments(updatedTasks);
    setAssignSuccess(true);
    setTimeout(() => {
      setAssignSuccess(false);
      onClose();
    }, 700);
  };

  // Add / remove space members
  const handleToggleMember = (u: User) => {
    const isAlready = currentSpaceUsers.some((su) => su.id === u.id);
    if (isAlready) {
      // Don't remove if they are the current user
      if (currentUser && u.id === currentUser.id) {
        alert("Bạn là người tạo Space nên mặc định luôn ở trong Space này!");
        return;
      }
      onUpdateSpaceUsers(currentSpaceUsers.filter((su) => su.id !== u.id));
    } else {
      onUpdateSpaceUsers([...currentSpaceUsers, u]);
    }
  };

  // Initials generator
  const getInitials = (name?: string) => {
    if (!name || !name.trim()) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Category badge
  const getCategoryBadge = (cat: RoleCategory) => {
    switch (cat) {
      case "FRONTEND":
        return { label: "Frontend / UI", style: "bg-blue-50 text-blue-700 border-blue-200" };
      case "BACKEND":
        return { label: "Backend / API", style: "bg-amber-50 text-amber-700 border-amber-200" };
      case "FULLSTACK":
        return { label: "Fullstack", style: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      case "QA":
        return { label: "Kiểm Thử / QA", style: "bg-rose-50 text-rose-700 border-rose-200" };
      case "DEVOPS":
        return { label: "DevOps / Hạ Tầng", style: "bg-purple-50 text-purple-700 border-purple-200" };
      case "MANAGEMENT":
        return { label: "Quản Lý / BA", style: "bg-slate-100 text-slate-700 border-slate-200" };
      default:
        return { label: "Tổng Hợp", style: "bg-gray-50 text-gray-700 border-gray-200" };
    }
  };

  // Filtered workspace users for the Add Member search bar
  const filteredWorkspaceUsers = useMemo(() => {
    if (!searchMemberQuery.trim()) return workspaceUsers;
    const q = searchMemberQuery.toLowerCase();
    return workspaceUsers.filter(
      (u) =>
        (u.fullName || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.username || "").toLowerCase().includes(q)
    );
  }, [workspaceUsers, searchMemberQuery]);

  const hasManualChanges = Object.keys(manualOverrides).length > 0;
  const totalAssignedTasks = autoAssignedPlan.assignments.length;

  if (!isOpen) return null;

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
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ==================================================================================== */}
        {/* PHẦN 1: THÊM & QUẢN LÝ THÀNH VIÊN VÀO SPACE (HIỂN THỊ TRỰC TIẾP TRONG MODAL NÀY LUÔN) */}
        {/* ==================================================================================== */}
        <div className="bg-slate-50/90 border border-slate-200 rounded-2xl p-4 space-y-3 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-blue-600" />
              <h4 className="font-extrabold text-slate-900 text-xs">
                Thêm Thành Viên Từ Workspace Vào Space:
              </h4>
              <span className="text-[11px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full">
                {currentSpaceUsers.length} người đang tham gia
              </span>
            </div>

            {/* Search Input Box */}
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchMemberQuery}
                onChange={(e) => setSearchMemberQuery(e.target.value)}
                placeholder="Tìm theo tên hoặc email..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 shadow-2xs transition-all"
              />
            </div>
          </div>

          {/* Members List Scrollable Container (Giống hệt Ảnh 1) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
            {filteredWorkspaceUsers.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4 italic col-span-2">
                Không tìm thấy nhân viên nào trong Workspace phù hợp với từ khóa tìm kiếm.
              </p>
            ) : (
              filteredWorkspaceUsers.map((u) => {
                const isAdded = currentSpaceUsers.some((su) => su.id === u.id);
                const isCreator = currentUser && u.id === currentUser.id;

                return (
                  <div
                    key={u.id}
                    className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-2 hover:border-slate-300 transition-all shadow-2xs"
                  >
                    {/* Left: Avatar + Details */}
                    <div className="flex items-center gap-2.5 truncate min-w-0">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-extrabold text-xs flex items-center justify-center shrink-0">
                        {getInitials(u.fullName || u.username)}
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-slate-900 truncate">
                            {u.fullName || u.username}
                          </span>
                          {u.jobTitle && (
                            <span className="text-[10px] text-slate-500 font-medium truncate">
                              • {u.jobTitle}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 truncate">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                          <span className="truncate">{u.email}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Action Button */}
                    <div className="shrink-0">
                      {isAdded ? (
                        <button
                          type="button"
                          onClick={() => handleToggleMember(u)}
                          className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 font-bold text-[11px] rounded-lg flex items-center gap-1 transition-all cursor-pointer group"
                          title={isCreator ? "Người tạo Space" : "Bấm để loại bỏ khỏi Space"}
                        >
                          <Check className="w-3 h-3 group-hover:hidden" />
                          <Trash2 className="w-3 h-3 hidden group-hover:inline" />
                          <span className="group-hover:hidden">Đã ở trong Space</span>
                          <span className="hidden group-hover:inline">Loại bỏ</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleMember(u)}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded-lg flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                        >
                          <span>+ Thêm vào Space</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ==================================================================================== */}
        {/* PHẦN 2: BẢNG KẾT QUẢ PHÂN CÔNG THEO VAI TRÒ CHUYÊN MÔN (ROLE ENGINE - CHÍNH XÁC ẢNH 3) */}
        {/* ==================================================================================== */}

        {/* Filter Controls Bar */}
        <div className="bg-[#F9FAFB] border border-[#E5E7EB] p-3 rounded-xl space-y-2 shrink-0 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Scope Selector */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-700 font-mono text-[11px] uppercase tracking-wider flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                Phạm vi:
              </span>
              <select
                value={selectedSprint}
                onChange={(e) => setSelectedSprint(e.target.value)}
                className="bg-white border border-gray-300 rounded-lg px-2.5 py-1 font-medium text-gray-800 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
              >
                <option value="ALL">Toàn bộ Space (Tất cả Sprints & Backlog)</option>
                {sprintOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* View Toggle */}
            <div className="flex items-center bg-gray-200/80 p-0.5 rounded-lg border border-gray-300/80">
              <button
                type="button"
                onClick={() => setViewMode("BY_MEMBER")}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${viewMode === "BY_MEMBER"
                  ? "bg-white text-gray-900 shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
                  }`}
              >
                Theo thành viên ({currentSpaceUsers.length})
              </button>
              <button
                type="button"
                onClick={() => setViewMode("BY_TASK")}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${viewMode === "BY_TASK"
                  ? "bg-white text-gray-900 shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
                  }`}
              >
                Theo công việc ({filteredTasksWithIndex.length})
              </button>
            </div>
          </div>

          {/* Checkbox Unassigned Only */}
          <div className="flex items-center justify-between pt-1 border-t border-gray-200/60">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={unassignedOnly}
                onChange={(e) => setUnassignedOnly(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="font-semibold text-gray-700 text-xs">
                Chỉ phân công các công việc chưa có người làm (Unassigned)
              </span>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-mono font-bold border border-emerald-200">
                Khuyên dùng
              </span>
            </label>

            {hasManualChanges && (
              <button
                type="button"
                onClick={() => setManualOverrides({})}
                className="text-blue-600 hover:text-blue-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
              >
                Khôi phục thuật toán ban đầu
              </button>
            )}
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
          {/* Card 1: Assigned Tasks */}
          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center font-mono text-sm shrink-0">
              {totalAssignedTasks}
            </div>
            <div>
              <span className="text-[11px] text-gray-500 font-mono block">Công việc được gán</span>
              <span className="text-xs font-bold text-gray-900">{totalAssignedTasks} Tasks</span>
            </div>
          </div>

          {/* Card 2: Space Members */}
          <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 font-extrabold flex items-center justify-center font-mono text-sm shrink-0">
              {currentSpaceUsers.length}
            </div>
            <div>
              <span className="text-[11px] text-gray-500 font-mono block">Thành viên tham gia</span>
              <span className="text-xs font-bold text-gray-900">{currentSpaceUsers.length} Người</span>
            </div>
          </div>

          {/* Card 3: Strategy */}
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-gray-500 font-mono block">Chiến lược</span>
              <span className="text-xs font-bold text-gray-900">Cân bằng tải theo vai trò</span>
            </div>
          </div>
        </div>

        {/* Main List Content */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {currentSpaceUsers.length === 0 ? (
            <div className="py-8 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50 space-y-2">
              <AlertCircle className="w-7 h-7 text-amber-500 mx-auto" />
              <h4 className="text-xs font-bold text-gray-800">
                Chưa có thành viên nào tham gia Space này!
              </h4>
              <p className="text-[11px] text-gray-500 max-w-md mx-auto">
                Vui lòng bấm "+ Thêm vào Space" tại danh sách thành viên ở phần trên để AI phân chia công việc theo vai trò.
              </p>
            </div>
          ) : viewMode === "BY_MEMBER" ? (
            /* VIEW BY MEMBER (ACCORDION) */
            memberStats.map(({ member, count, items }) => {
              const isExpanded = expandedMemberId === member.id;
              const loadPercent = totalAssignedTasks > 0 ? (count / totalAssignedTasks) * 100 : 0;

              return (
                <div
                  key={member.id}
                  className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-2xs hover:border-gray-300 transition-all"
                >
                  {/* Member Accordion Header */}
                  <div
                    onClick={() => setExpandedMemberId(isExpanded ? null : member.id)}
                    className="p-3.5 flex items-center justify-between bg-white hover:bg-gray-50/80 cursor-pointer select-none transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                        {getInitials(member.fullName || member.username)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-gray-900">
                            {member.fullName || member.username}
                          </span>
                          <span className="text-[11px] font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                            {member.jobTitle || "Thành viên"}
                          </span>
                          {currentUser && member.id === currentUser.id && (
                            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                              Người tạo
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 font-mono block">
                          {member.email}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-xs font-bold text-blue-700 font-mono block">
                          +{count} tasks
                        </span>
                        <div className="w-24 h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full transition-all duration-300"
                            style={{ width: `${loadPercent}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-gray-400">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Member Tasks List */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-[#FAFAFA] p-3 space-y-2">
                      {items.length === 0 ? (
                        <p className="text-xs text-gray-500 italic p-2 text-center">
                          Chưa có công việc nào khớp với vai trò này trong phạm vi đã chọn.
                        </p>
                      ) : (
                        items.map(({ taskIndex, category }) => {
                          const t = tasks[taskIndex];
                          if (!t) return null;
                          const badge = getCategoryBadge(category);

                          return (
                            <div
                              key={taskIndex}
                              className="bg-white border border-gray-200 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2 shadow-2xs"
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200 shrink-0">
                                  Task-{taskIndex + 1}
                                </span>
                                <span className="text-xs font-bold text-gray-900 truncate" title={t.title}>
                                  {t.title}
                                </span>
                                <span
                                  className={`text-[10px] font-semibold px-2 py-0.5 rounded border shrink-0 ${badge.style}`}
                                >
                                  {badge.label}
                                </span>
                              </div>

                              {/* Reassign dropdown */}
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-[10px] font-mono uppercase text-gray-400 font-bold">
                                  Gán cho:
                                </span>
                                <select
                                  value={manualOverrides[taskIndex] || member.id}
                                  onChange={(e) =>
                                    setManualOverrides((prev) => ({
                                      ...prev,
                                      [taskIndex]: Number(e.target.value),
                                    }))
                                  }
                                  className="bg-white border border-gray-300 rounded-lg px-2 py-1 text-xs font-semibold text-gray-800 outline-none focus:border-blue-500 cursor-pointer"
                                >
                                  {currentSpaceUsers.map((su) => (
                                    <option key={su.id} value={su.id}>
                                      {su.fullName || su.username} ({su.jobTitle || "Thành viên"})
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            /* VIEW BY TASK */
            <div className="space-y-2">
              {filteredTasksWithIndex.map(({ task, originalIndex }) => {
                const assigned = autoAssignedPlan.assignments.find((a) => a.taskIndex === originalIndex);
                const currentAssignedUser = assigned?.assignedUser;
                const badge = getCategoryBadge(assigned?.category || "GENERAL");

                return (
                  <div
                    key={originalIndex}
                    className="bg-white border border-gray-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs hover:border-gray-300 transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200 shrink-0">
                        Task-{originalIndex + 1}
                      </span>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-gray-900 block truncate" title={task.title}>
                          {task.title}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono block">
                          {task.sprint || "Sprint 1"} • Yêu cầu: {task.assignedRole || "Chưa xác định"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded border shrink-0 ${badge.style}`}
                      >
                        {badge.label}
                      </span>

                      <select
                        value={currentAssignedUser ? currentAssignedUser.id : ""}
                        onChange={(e) =>
                          setManualOverrides((prev) => ({
                            ...prev,
                            [originalIndex]: Number(e.target.value),
                          }))
                        }
                        className="bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-gray-800 outline-none focus:border-blue-500 cursor-pointer"
                      >
                        {currentSpaceUsers.map((su) => (
                          <option key={su.id} value={su.id}>
                            {su.fullName || su.username} ({su.jobTitle || "Thành viên"})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4 shrink-0">
          <span className="text-xs text-gray-500 font-medium">
            Bạn có thể đổi người trực tiếp tại các ô chọn trên, hoặc tinh chỉnh sau tại từng thẻ Task.
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Hủy
            </button>

            <button
              type="button"
              onClick={handleApply}
              disabled={assignSuccess || totalAssignedTasks === 0}
              className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {assignSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Đã áp dụng!</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Áp dụng phân công ({totalAssignedTasks})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
