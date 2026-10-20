"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
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
  Clock,
  Calendar,
  Terminal,
  Monitor,
  ShieldCheck,
  Cloud,
  FileText,
  Flame,
} from "lucide-react";
import { DecomposedTaskItem } from "@/services/ai.service";
import { User } from "@/types";
import { getMemberCapabilities, RoleCategory } from "@/utils/roleAssignment";
import { useAuthStore } from "@/stores/useAuthStore";

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
        (u.username || "").toLowerCase().includes(q) ||
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
            {selectedUser ? getInitials(selectedUser.fullName || selectedUser.username) : "?"}
          </div>
          <span className="truncate text-xs font-semibold text-slate-800">
            {selectedUser ? selectedUser.fullName || selectedUser.username : "Chọn người"}
          </span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      </button>

      {isOpen && (
        <div
          className={`absolute ${
            align === "right" ? "right-0" : "left-0"
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
                    className={`w-full flex items-center justify-between p-1.5 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-blue-50 text-blue-800 font-bold"
                        : "hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                        {getInitials(u.fullName || u.username)}
                      </div>
                      <div className="truncate">
                        <span className="block truncate text-xs font-semibold">
                          {u.fullName || u.username}
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

  // Workload and completion progress of members (Thầy yêu cầu: Phân chia dựa trên mức độ hoàn thành & số ngày còn lại của việc cũ)
  const [memberWorkloads, setMemberWorkloads] = useState<
    Record<number, { pendingTasks: number; pendingDays: number; finishDay: string }>
  >({});

  // Preset default workloads when space members change
  useEffect(() => {
    if (currentSpaceUsers.length > 0) {
      setMemberWorkloads((prev) => {
        const next = { ...prev };
        currentSpaceUsers.forEach((u, idx) => {
          if (!next[u.id]) {
            // Preset realistic scenario per user request:
            // Member 1: Finishes Friday (1 pending task, only 1.5 busy days remaining, frees up early)
            // Member 2: Finishes Saturday (2 pending tasks, 2.5 busy days remaining)
            // Member 3: Finishes Sunday (3 pending tasks, 4.0 busy days remaining)
            if (idx === 0) {
              next[u.id] = { pendingTasks: 1, pendingDays: 1.5, finishDay: "Thứ Sáu" };
            } else if (idx === 1) {
              next[u.id] = { pendingTasks: 2, pendingDays: 2.5, finishDay: "Thứ Bảy" };
            } else if (idx === 2) {
              next[u.id] = { pendingTasks: 3, pendingDays: 4.0, finishDay: "Chủ Nhật" };
            } else {
              next[u.id] = {
                pendingTasks: idx % 2 === 0 ? 1 : 2,
                pendingDays: idx % 2 === 0 ? 1.5 : 2.5,
                finishDay: idx % 2 === 0 ? "Thứ Sáu" : "Thứ Bảy",
              };
            }
          }
        });
        return next;
      });
    }
  }, [currentSpaceUsers]);

  // Quick preset helper for changing member's completion day
  const handleChangeMemberWorkload = (
    userId: number,
    preset: "FRIDAY" | "SATURDAY" | "SUNDAY" | "WEDNESDAY" | "FREE"
  ) => {
    setMemberWorkloads((prev) => {
      const next = { ...prev };
      if (preset === "FRIDAY") {
        next[userId] = { pendingTasks: 1, pendingDays: 1.5, finishDay: "Thứ Sáu" };
      } else if (preset === "SATURDAY") {
        next[userId] = { pendingTasks: 2, pendingDays: 2.5, finishDay: "Thứ Bảy" };
      } else if (preset === "SUNDAY") {
        next[userId] = { pendingTasks: 3, pendingDays: 4.0, finishDay: "Chủ Nhật" };
      } else if (preset === "WEDNESDAY") {
        next[userId] = { pendingTasks: 1, pendingDays: 0.5, finishDay: "Thứ Tư" };
      } else {
        next[userId] = { pendingTasks: 0, pendingDays: 0.0, finishDay: "Đã rảnh" };
      }
      return next;
    });
  };

  // Sprints list derived from tasks if not passed
  const sprintOptions = useMemo(() => {
    if (availableSprints.length > 0) return availableSprints;
    const sSet = new Set<string>();
    tasks.forEach((t) => {
      if (t.sprint) sSet.add(t.sprint);
    });
    return Array.from(sSet);
  }, [availableSprints, tasks]);

  // Helper to categorize task role
  const getTaskRoleCategory = (task: DecomposedTaskItem): RoleCategory => {
    const roleStr = (task.assignedRole || "").toLowerCase();
    const titleStr = (task.title || "").toLowerCase();
    const descStr = (task.description || "").toLowerCase();

    if (
      roleStr.includes("qa") ||
      roleStr.includes("tester") ||
      roleStr.includes("qc") ||
      titleStr.includes("kiểm thử") ||
      titleStr.includes("test")
    ) {
      return "QA";
    }
    if (
      roleStr.includes("pm") ||
      roleStr.includes("ba") ||
      roleStr.includes("quản lý") ||
      roleStr.includes("business") ||
      titleStr.includes("phân tích") ||
      titleStr.includes("nghiệp vụ") ||
      titleStr.includes("yêu cầu")
    ) {
      return "MANAGEMENT";
    }
    if (
      roleStr.includes("devops") ||
      roleStr.includes("system") ||
      roleStr.includes("hạ tầng") ||
      titleStr.includes("docker") ||
      titleStr.includes("deploy") ||
      titleStr.includes("ci/cd")
    ) {
      return "DEVOPS";
    }
    if (
      roleStr.includes("frontend") ||
      roleStr.includes("ui") ||
      titleStr.includes("giao diện") ||
      titleStr.includes("màn hình") ||
      titleStr.includes("component") ||
      descStr.includes("react")
    ) {
      return "FRONTEND";
    }
    if (
      roleStr.includes("backend") ||
      roleStr.includes("database") ||
      roleStr.includes("api") ||
      titleStr.includes("api") ||
      titleStr.includes("csdl") ||
      titleStr.includes("schema") ||
      titleStr.includes("service")
    ) {
      return "BACKEND";
    }
    return "GENERAL";
  };

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

  // Calculate Auto Assignment Preview based on:
  // 1. Role capability matching (Backend, Frontend, QA, DevOps, BA)
  // 2. Task Complexity (LPT - Longest Processing Time First: High complexity tasks 3d+ assigned first)
  // 3. Workload of previous tasks: Members finishing earlier (e.g. Friday 1.5d vs Saturday 2.5d vs Sunday 4.0d)
  const autoAssignedPlan = useMemo(() => {
    if (currentSpaceUsers.length === 0 || filteredTasksWithIndex.length === 0) {
      return {
        assignments: [] as {
          taskIndex: number;
          assignedUser: User;
          category: RoleCategory;
          reason: string;
        }[],
      };
    }

    const categorized = currentSpaceUsers.map((u) => ({
      user: u,
      caps: getMemberCapabilities(u),
    }));

    const feList = categorized.filter((c) => c.caps.isFrontend).map((c) => c.user);
    const beList = categorized.filter((c) => c.caps.isBackend).map((c) => c.user);
    const qaList = categorized.filter((c) => c.caps.isQA).map((c) => c.user);
    const fsList = categorized.filter((c) => c.caps.isFullstack).map((c) => c.user);
    const mgmtList = categorized.filter((c) => c.caps.isManagement).map((c) => c.user);
    const devopsList = categorized.filter((c) => c.caps.isDevOps).map((c) => c.user);

    // Track accumulated load (pending days + newly assigned estimated days)
    const currentAccumulatedDays: Record<number, number> = {};
    const currentAssignedCounts: Record<number, number> = {};

    currentSpaceUsers.forEach((u) => {
      const w = memberWorkloads[u.id] || { pendingDays: 1.5, pendingTasks: 1, finishDay: "Thứ Sáu" };
      currentAccumulatedDays[u.id] = w.pendingDays;
      currentAssignedCounts[u.id] = 0;
    });

    // Helper: Pick candidate with lowest accumulated load
    const pickLeastLoaded = (candidates: User[]): User => {
      const pool = candidates.length > 0 ? candidates : currentSpaceUsers;
      let chosen = pool[0];
      let minLoad = currentAccumulatedDays[chosen.id] ?? 999;

      for (let i = 1; i < pool.length; i++) {
        const u = pool[i];
        const load = currentAccumulatedDays[u.id] ?? 999;
        if (load < minLoad) {
          minLoad = load;
          chosen = u;
        } else if (load === minLoad) {
          if ((currentAssignedCounts[u.id] || 0) < (currentAssignedCounts[chosen.id] || 0)) {
            chosen = u;
          }
        }
      }
      return chosen;
    };

    // Sort tasks by estimatedDays descending (LPT)
    // Tasks with more working days are scheduled first so members with earlier finish times take on larger tasks
    const sortedTasks = [...filteredTasksWithIndex].sort((a, b) => {
      const daysA = Math.max(1, Math.round(a.task.estimatedDays || 2));
      const daysB = Math.max(1, Math.round(b.task.estimatedDays || 2));
      return daysB - daysA;
    });

    const assignmentMap: Record<
      number,
      { assignedUser: User; category: RoleCategory; reason: string }
    > = {};

    sortedTasks.forEach(({ task, originalIndex }) => {
      // Check manual override first
      const overrideId = manualOverrides[originalIndex];
      if (overrideId) {
        const found = currentSpaceUsers.find((u) => u.id === overrideId);
        if (found) {
          const taskDays = Math.max(1, Math.round(task.estimatedDays || 2));
          currentAccumulatedDays[found.id] = (currentAccumulatedDays[found.id] || 0) + taskDays;
          currentAssignedCounts[found.id] = (currentAssignedCounts[found.id] || 0) + 1;
          assignmentMap[originalIndex] = {
            assignedUser: found,
            category: getTaskRoleCategory(task),
            reason: `Chỉnh sửa thủ công: ${found.fullName || found.username}`,
          };
          return;
        }
      }

      const cat = getTaskRoleCategory(task);
      const taskDays = Math.max(1, Math.round(task.estimatedDays || 2));

      let assigned: User | null = null;
      let matchedSkill = "";

      if (cat === "QA") {
        matchedSkill = "QA / Kiểm thử";
        if (qaList.length > 0) assigned = pickLeastLoaded(qaList);
      } else if (cat === "MANAGEMENT") {
        matchedSkill = "Quản lý / BA";
        if (mgmtList.length > 0) assigned = pickLeastLoaded(mgmtList);
      } else if (cat === "DEVOPS") {
        matchedSkill = "DevOps / Hạ tầng";
        if (devopsList.length > 0) assigned = pickLeastLoaded(devopsList);
      } else if (cat === "FRONTEND") {
        matchedSkill = "Frontend UI";
        const fePool = feList.length > 0 ? feList : fsList;
        assigned = pickLeastLoaded(fePool);
      } else if (cat === "BACKEND") {
        matchedSkill = "Backend / API";
        const bePool = beList.length > 0 ? beList : fsList;
        assigned = pickLeastLoaded(bePool);
      }

      // Fallback: pick the least loaded space member
      if (!assigned) {
        assigned = pickLeastLoaded(currentSpaceUsers);
      }

      // Accumulate workload for chosen member
      currentAccumulatedDays[assigned.id] = (currentAccumulatedDays[assigned.id] || 0) + taskDays;
      currentAssignedCounts[assigned.id] = (currentAssignedCounts[assigned.id] || 0) + 1;

      assignmentMap[originalIndex] = {
        assignedUser: assigned,
        category: cat,
        reason: `${matchedSkill || "Tối ưu năng lực"}`,
      };
    });

    // Retain original order for consistent mapping
    const assignments = filteredTasksWithIndex.map(({ originalIndex }) => ({
      taskIndex: originalIndex,
      assignedUser: assignmentMap[originalIndex]?.assignedUser || currentSpaceUsers[0],
      category: assignmentMap[originalIndex]?.category || "GENERAL",
      reason: assignmentMap[originalIndex]?.reason || "",
    }));

    return { assignments };
  }, [filteredTasksWithIndex, currentSpaceUsers, manualOverrides, memberWorkloads]);

  // Group assigned tasks by member and compute workload analytics
  const memberStats = useMemo(() => {
    return currentSpaceUsers.map((m) => {
      const assigned = autoAssignedPlan.assignments.filter((a) => a.assignedUser.id === m.id);
      let totalAssignedDays = 0;
      let highComplexityCount = 0;
      let mediumComplexityCount = 0;
      let lowComplexityCount = 0;

      assigned.forEach((item) => {
        const t = tasks[item.taskIndex];
        const days = Math.max(1, Math.round(t?.estimatedDays || 2));
        totalAssignedDays += days;
        if (days >= 3) highComplexityCount++;
        else if (days === 2) mediumComplexityCount++;
        else lowComplexityCount++;
      });

      const workload = memberWorkloads[m.id] || {
        pendingTasks: 1,
        pendingDays: 1.5,
        finishDay: "Thứ Sáu",
      };
      return {
        member: m,
        count: assigned.length,
        items: assigned,
        totalAssignedDays,
        workload,
        totalSprintLoadDays: workload.pendingDays + totalAssignedDays,
        highComplexityCount,
        mediumComplexityCount,
        lowComplexityCount,
      };
    });
  }, [currentSpaceUsers, autoAssignedPlan, tasks, memberWorkloads]);

  // Helper format Sprint badge hiển thị tên Sprint gọn gàng (rê chuột vào xem đầy đủ)
  const getSprintShortBadge = (sprintName?: string) => {
    if (!sprintName) return { shortName: "Sprint 1", fullName: "Sprint 1" };
    const fullName = sprintName.trim();
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

  // Helper hiển thị số ngày làm việc thực tế do AI tính trước đó (không chữ "Độ phức tạp", không số lẻ)
  const getWorkDaysBadge = (days?: number) => {
    const actualDays = Math.max(1, Math.round(days || 2));
    if (actualDays >= 3) {
      return {
        label: `${actualDays} ngày`,
        style: "bg-amber-50 text-amber-800 border-amber-200",
      };
    }
    if (actualDays === 2) {
      return {
        label: `${actualDays} ngày`,
        style: "bg-blue-50 text-blue-800 border-blue-200",
      };
    }
    return {
      label: `${actualDays} ngày`,
      style: "bg-emerald-50 text-emerald-800 border-emerald-200",
    };
  };

  // Group tasks by role category for View BY_TASK
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
        title: "Quản lý & Phân tích nghiệp vụ (BA)",
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
        const groupTasks = filteredTasksWithIndex.filter(({ task, originalIndex }) => {
          const assigned = autoAssignedPlan.assignments.find((a) => a.taskIndex === originalIndex);
          const cat = assigned?.category || getTaskRoleCategory(task);
          return cat === g.cat;
        });
        const totalDays = groupTasks.reduce(
          (sum, { task }) => sum + Math.max(1, Math.round(task.estimatedDays || 2)),
          0
        );
        return {
          ...g,
          tasks: groupTasks,
          totalDays,
        };
      })
      .filter((g) => g.tasks.length > 0);
  }, [filteredTasksWithIndex, autoAssignedPlan]);

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

        {/* 2 Metric Cards (Đã bỏ Card 3 "Chiến lược cân bằng tải" theo góp ý của thầy) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0">
          {/* Card 1: Assigned Tasks */}
          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center font-mono text-sm shrink-0">
              {totalAssignedTasks}
            </div>
            <div>
              <span className="text-[11px] text-gray-500 font-mono block">Tổng công việc cần phân bổ</span>
              <span className="text-xs font-bold text-gray-900">{totalAssignedTasks} Tasks</span>
            </div>
          </div>

          {/* Card 2: Space Members */}
          <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 font-extrabold flex items-center justify-center font-mono text-sm shrink-0">
              {currentSpaceUsers.length}
            </div>
            <div>
              <span className="text-[11px] text-gray-500 font-mono block">Thành viên tham gia Space</span>
              <span className="text-xs font-bold text-gray-900">{currentSpaceUsers.length} Người</span>
            </div>
          </div>
        </div>

        {/* WORKLOAD & COMPLETION STATUS CONTROLLER PANEL (Thầy yêu cầu: Phân chia theo mức độ hoàn thành & số ngày còn lại của từng thành viên) */}
        {currentSpaceUsers.length > 0 && (
          <div className="bg-indigo-50/40 border border-indigo-200/80 rounded-2xl p-3.5 space-y-2.5 shrink-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">⚖️</span>
                <h5 className="font-bold text-xs text-indigo-950">
                  Năng Lực Khả Dụng & Mức Độ Hoàn Thành Việc Cũ Của Thành Viên:
                </h5>
              </div>
              <span className="text-[10px] text-indigo-700 font-mono bg-indigo-100/70 px-2 py-0.5 rounded-full font-bold">
                Tự động ưu tiên người rảnh sớm & cân đối độ phức tạp
              </span>
            </div>

            <p className="text-[11px] text-indigo-900/80 leading-relaxed">
              💡 <strong>Nguyên lý điều phối:</strong> Ưu tiên thành viên có ngày hoàn thành việc cũ sớm hơn (ví dụ: Thứ Sáu chỉ còn 1.5d dở dang) nhận các việc có độ phức tạp cao hoặc nhận nhiều việc hơn. Thành viên bận đến Thứ Bảy (2.5d) hoặc Chủ Nhật (4.0d) sẽ nhận ít việc hoặc nhận việc có độ phức tạp thấp hơn để tổng tải công việc trong tuần được cân bằng đều.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-0.5">
              {currentSpaceUsers.map((u) => {
                const w = memberWorkloads[u.id] || { finishDay: "Thứ Sáu", pendingDays: 1.5, pendingTasks: 1 };
                const stat = memberStats.find((s) => s.member.id === u.id);

                return (
                  <div
                    key={u.id}
                    className="p-2.5 bg-white border border-indigo-100 rounded-xl flex flex-col justify-between gap-2 shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {getInitials(u.fullName || u.username)}
                        </div>
                        <div className="truncate">
                          <span className="text-xs font-bold text-slate-900 truncate block">
                            {u.fullName || u.username}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono block">
                            {u.jobTitle || "Thành viên"}
                          </span>
                        </div>
                      </div>

                      {/* Summary of Assigned vs Pending */}
                      <div className="text-right shrink-0">
                        <span className="text-[11px] font-bold text-blue-700 font-mono block">
                          Nhận: {stat?.count || 0} tasks ({stat?.totalAssignedDays || 0}d)
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono block">
                          Tải cũ: {w.pendingDays}d ({w.finishDay})
                        </span>
                        {stat && stat.count > 0 && (
                          <div className="flex items-center gap-1 justify-end mt-0.5 text-[9px] font-bold font-mono">
                            {stat.highComplexityCount > 0 && (
                              <span className="text-rose-700 bg-rose-50 px-1 py-0.2 rounded border border-rose-200" title="Độ phức tạp cao (>= 3 ngày)">
                                {stat.highComplexityCount} Cao
                              </span>
                            )}
                            {stat.mediumComplexityCount > 0 && (
                              <span className="text-amber-800 bg-amber-50 px-1 py-0.2 rounded border border-amber-200" title="Độ phức tạp vừa (2 ngày)">
                                {stat.mediumComplexityCount} Vừa
                              </span>
                            )}
                            {stat.lowComplexityCount > 0 && (
                              <span className="text-emerald-800 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200" title="Độ phức tạp thấp (1 ngày)">
                                {stat.lowComplexityCount} Thấp
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick Preset Selector Buttons for Completion Day */}
                    <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
                      <span className="text-[10px] text-slate-500 font-mono font-semibold shrink-0">
                        Xong việc cũ:
                      </span>
                      <div className="flex flex-wrap items-center gap-1 flex-1">
                        <button
                          type="button"
                          onClick={() => handleChangeMemberWorkload(u.id, "FRIDAY")}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono transition-all cursor-pointer ${
                            w.finishDay === "Thứ Sáu"
                              ? "bg-emerald-600 text-white shadow-2xs"
                              : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
                          }`}
                          title="Xong vào Thứ 6 (còn 1.5 ngày bận) -> Rảnh sớm, nhận task phức tạp hoặc nhiều task hơn"
                        >
                          Thứ Sáu (1.5d)
                        </button>

                        <button
                          type="button"
                          onClick={() => handleChangeMemberWorkload(u.id, "SATURDAY")}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono transition-all cursor-pointer ${
                            w.finishDay === "Thứ Bảy"
                              ? "bg-amber-600 text-white shadow-2xs"
                              : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
                          }`}
                          title="Xong vào Thứ 7 (còn 2.5 ngày bận) -> Tải vừa phải"
                        >
                          Thứ Bảy (2.5d)
                        </button>

                        <button
                          type="button"
                          onClick={() => handleChangeMemberWorkload(u.id, "SUNDAY")}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono transition-all cursor-pointer ${
                            w.finishDay === "Chủ Nhật"
                              ? "bg-rose-600 text-white shadow-2xs"
                              : "bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200"
                          }`}
                          title="Bận đến Chủ Nhật (còn 4 ngày bận) -> Nhận ít việc hơn"
                        >
                          Chủ Nhật (4.0d)
                        </button>

                        <button
                          type="button"
                          onClick={() => handleChangeMemberWorkload(u.id, "WEDNESDAY")}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono transition-all cursor-pointer ${
                            w.finishDay === "Thứ Tư"
                              ? "bg-blue-600 text-white shadow-2xs"
                              : "bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200"
                          }`}
                          title="Xong vào Thứ 4 (còn 0.5 ngày bận)"
                        >
                          Thứ Tư (0.5d)
                        </button>

                        <button
                          type="button"
                          onClick={() => handleChangeMemberWorkload(u.id, "FREE")}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono transition-all cursor-pointer ${
                            w.finishDay === "Đã rảnh"
                              ? "bg-purple-600 text-white shadow-2xs"
                              : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
                          }`}
                          title="Đã rảnh 100% (0 ngày bận)"
                        >
                          Đã rảnh
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
            memberStats.map(({ member, count, items, totalAssignedDays, workload, totalSprintLoadDays }) => {
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
                        {/* Member Completion Progress Badge */}
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                              workload.pendingDays <= 2
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : "bg-amber-50 text-amber-800 border-amber-200"
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            Xong việc cũ: {workload.finishDay} (còn {workload.pendingDays}d dở dang)
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono">
                            {member.email}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-xs font-bold text-blue-700 font-mono block">
                          +{count} tasks (~{totalAssignedDays}d)
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono block">
                          Tổng tải: {totalSprintLoadDays.toFixed(1)} ngày
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
                          const sprintInfo = getSprintShortBadge(t.sprint);
                          const workDaysBadge = getWorkDaysBadge(t.estimatedDays);

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
                                <div className="relative group/sprint shrink-0">
                                  <span
                                    className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 cursor-pointer max-w-[200px] sm:max-w-[240px]"
                                  >
                                    <Calendar className="w-3 h-3 text-blue-500 shrink-0" />
                                    <span className="truncate">{sprintInfo.shortName}</span>
                                  </span>
                                  {/* Popup chi tiết Sprint ngay khi di chuột - cùng màu xanh trang nhã */}
                                  <div className="absolute bottom-full left-0 mb-1.5 hidden group-hover/sprint:flex flex-col gap-0.5 z-50 min-w-[220px] max-w-[320px] p-2.5 bg-blue-50/95 text-blue-950 border border-blue-300 rounded-xl shadow-xl pointer-events-none animate-in fade-in zoom-in-95 text-xs">
                                    <div className="flex items-center gap-1 text-[10px] font-bold font-mono text-blue-700 uppercase pb-1 border-b border-blue-200">
                                      <Calendar className="w-3 h-3 text-blue-600" /> Chi tiết Sprint
                                    </div>
                                    <p className="font-extrabold text-[11px] leading-snug text-blue-950 pt-0.5">
                                      {sprintInfo.fullName}
                                    </p>
                                  </div>
                                </div>
                                <span
                                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border shrink-0 ${workDaysBadge.style}`}
                                  title="Số ngày làm việc ước tính theo kế hoạch AI"
                                >
                                  ⏱️ {workDaysBadge.label}
                                </span>
                              </div>

                              {/* Reassign dropdown */}
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-[10px] font-mono uppercase text-gray-400 font-bold">
                                  Gán cho:
                                </span>
                                <TaskMemberPicker
                                  currentUserId={manualOverrides[taskIndex] || member.id}
                                  users={currentSpaceUsers}
                                  onSelect={(userId) =>
                                    setManualOverrides((prev) => ({
                                      ...prev,
                                      [taskIndex]: userId,
                                    }))
                                  }
                                />
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
            /* VIEW BY TASK (Phân nhóm trực quan theo VAI TRÒ CỦA CÔNG VIỆC theo góp ý của thầy) */
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
                          {group.tasks.length} công việc
                        </span>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-slate-500">
                        Tổng: {group.totalDays} ngày
                      </span>
                    </div>

                    {/* Task items in this role group */}
                    <div className="space-y-2">
                      {group.tasks.map(({ task, originalIndex }) => {
                        const assigned = autoAssignedPlan.assignments.find(
                          (a) => a.taskIndex === originalIndex
                        );
                        const currentAssignedUser = assigned?.assignedUser;
                        const sprintInfo = getSprintShortBadge(task.sprint);
                        const workDaysBadge = getWorkDaysBadge(task.estimatedDays);

                        return (
                          <div
                            key={originalIndex}
                            className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs hover:border-blue-400 hover:shadow-xs transition-all"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <span className="text-[11px] font-mono font-extrabold px-2 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                                Task-{originalIndex + 1}
                              </span>

                              <div className="min-w-0 flex-1 space-y-1">
                                <span
                                  className="text-xs font-bold text-slate-900 block truncate"
                                  title={task.title}
                                >
                                  {task.title}
                                </span>

                                <div className="flex flex-wrap items-center gap-2">
                                  {/* Sprint Badge với popup chi tiết ngay khi di chuột */}
                                  <div className="relative group/sprint shrink-0">
                                    <span
                                      className="inline-flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 cursor-pointer max-w-[200px] sm:max-w-[260px]"
                                    >
                                      <Calendar className="w-3 h-3 text-blue-500 shrink-0" />
                                      <span className="truncate">{sprintInfo.shortName}</span>
                                    </span>
                                    {/* Popup chi tiết Sprint ngay khi di chuột - cùng màu xanh trang nhã */}
                                    <div className="absolute bottom-full left-0 mb-1.5 hidden group-hover/sprint:flex flex-col gap-0.5 z-50 min-w-[220px] max-w-[320px] p-2.5 bg-blue-50/95 text-blue-950 border border-blue-300 rounded-xl shadow-xl pointer-events-none animate-in fade-in zoom-in-95 text-xs">
                                      <div className="flex items-center gap-1 text-[10px] font-bold font-mono text-blue-700 uppercase pb-1 border-b border-blue-200">
                                        <Calendar className="w-3 h-3 text-blue-600" /> Chi tiết Sprint
                                      </div>
                                      <p className="font-extrabold text-[11px] leading-snug text-blue-950 pt-0.5">
                                        {sprintInfo.fullName}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Số ngày làm việc thực tế do AI tính trước đó (không chữ 'Độ phức tạp', không số lẻ) */}
                                  <span
                                    className={`inline-flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded-md border ${workDaysBadge.style}`}
                                    title="Số ngày làm việc ước tính theo kế hoạch AI"
                                  >
                                    <Clock className="w-3 h-3" />
                                    {workDaysBadge.label}
                                  </span>

                                  {task.assignedRole && (
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      Yêu cầu: {task.assignedRole}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Searchable Member Picker (Gọn gàng, tìm kiếm bằng tên) */}
                            <div className="shrink-0 flex items-center gap-2">
                              <TaskMemberPicker
                                currentUserId={
                                  currentAssignedUser ? currentAssignedUser.id : undefined
                                }
                                users={currentSpaceUsers}
                                onSelect={(userId) =>
                                  setManualOverrides((prev) => ({
                                    ...prev,
                                    [originalIndex]: userId,
                                  }))
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
