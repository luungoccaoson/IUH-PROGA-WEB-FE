"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  UserPlus,
  ShieldCheck,
  CheckCircle2,
  ListTodo,
  Search,
  Trash2,
  Mail,
  Briefcase,
  Lock,
  Crown,
  Sparkles,
  UserCircle,
} from "lucide-react";
import { Task, User } from "@/types";
import { userService } from "@/services/user.service";
import { workspaceService } from "@/services/workspace.service";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  SpaceRoleType,
  roleIdToSpaceRole,
  spaceRoleToRoleId,
  recommendSpaceRoleForMember,
  standardizeMemberProfile,
  getSpacePermissionsByRole,
} from "@/utils/roleAssignment";

interface SpaceMembersTabProps {
  workspaceId: number;
  spaceId: number;
  tasks: Task[];
  isPM?: boolean;
  workspaceOwnerId?: number;
  currentUserId?: number;
  onOpenAddMember: () => void;
  onSelectTask?: (task: Task) => void;
  onRoleUpdated?: () => void;
}

const PERMISSION_LABELS: {
  key: keyof ReturnType<typeof getSpacePermissionsByRole>;
  label: string;
  desc: string;
}[] = [
  {
    key: "can_manage_space_and_members",
    label: "Quản trị Space, Nhân sự & Phân quyền (RBAC)",
    desc: "Chỉnh sửa/xóa Space, thêm/xóa thành viên, cấp quyền và quản lý Thùng rác (Chỉ PM)",
  },
  {
    key: "can_approve_tasks_to_done",
    label: "Duyệt chốt hoàn thành công việc (Review → Done)",
    desc: "Kiểm tra chất lượng và duyệt công việc sang trạng thái 'Đã xong' (Chỉ PM giữ quyền này)",
  },
  {
    key: "can_coordinate_and_ai_draft",
    label: "Điều phối tiến độ, Hạn chót & AI Phân rã Nháp",
    desc: "Nạp tài liệu cho AI phân rã nháp, chỉnh sửa deadline, sắp xếp Kanban & tạo/sửa Sprint (PM & ASSISTANT)",
  },
  {
    key: "can_create_and_self_assign",
    label: "Tạo công việc mới & Tự nhận việc (Self-assign)",
    desc: "Tạo Task mới trong Sprint/Backlog và tự nhận các Task chưa có người phụ trách",
  },
  {
    key: "can_execute_own_tasks",
    label: "Thực thi & Cập nhật tiến độ công việc cá nhân",
    desc: "Cập nhật tiến độ (Cần làm ↔ Đang làm) đối với Task của mình để chờ PM duyệt hoàn thành",
  },
  {
    key: "can_view_risk_dashboard",
    label: "Xem Dashboard Tiến độ, Mindmap & Cảnh báo Rủi ro",
    desc: "Theo dõi toàn bộ lộ trình Timeline, Sơ đồ tư duy và cảnh báo trễ hạn của dự án",
  },
];

export function SpaceMembersTab({
  workspaceId,
  spaceId,
  tasks = [],
  isPM = false,
  workspaceOwnerId,
  currentUserId,
  onOpenAddMember,
  onSelectTask,
  onRoleUpdated,
}: SpaceMembersTabProps) {
  const router = useRouter();
  const [spaceMembers, setSpaceMembers] = useState<User[]>([]);
  const [memberRoleMap, setMemberRoleMap] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [updatingRoleIdUser, setUpdatingRoleIdUser] = useState<number | null>(null);

  useEffect(() => {
    loadSpaceMembers();
  }, [spaceId, workspaceOwnerId]);

  const loadSpaceMembers = async () => {
    try {
      setLoading(true);
      const rawMembers = await workspaceService.getSpaceMembers(spaceId);
      const roleMap: Record<number, number> = {};
      const userIdsSet = new Set<number>();

      (rawMembers || []).forEach((m: any) => {
        const uId = m.id?.userId || m.userId;
        if (uId) {
          userIdsSet.add(uId);
          roleMap[uId] = m.roleId || 3;
        }
      });

      if (workspaceOwnerId) {
        userIdsSet.add(workspaceOwnerId);
        roleMap[workspaceOwnerId] = 2; // Workspace Owner is always Lead PM
      }

      const userIds = Array.from(userIdsSet);
      const userProfiles = await Promise.all(
        userIds.map((id) => userService.getUserById(id).catch(() => null))
      );

      const validUsers = userProfiles.filter((u): u is User => u !== null);
      // Sort Lead PM first, then PMs, then ASSISTANT, then MEMBER
      const roleOrder = (uId: number) => {
        if (uId === workspaceOwnerId) return 0;
        const r = roleMap[uId];
        if (r === 2) return 1;
        if (r === 4) return 2;
        return 3;
      };
      validUsers.sort((a, b) => {
        const diff = roleOrder(a.id) - roleOrder(b.id);
        if (diff !== 0) return diff;
        return a.id - b.id;
      });

      setMemberRoleMap(roleMap);
      setSpaceMembers(validUsers);
    } catch (err) {
      console.error("Failed to load space members:", err);
    } finally {
      setLoading(false);
    }
  };

  const getMemberSpaceRole = (userId: number): SpaceRoleType => {
    const isCreator = Boolean(workspaceOwnerId && userId === workspaceOwnerId);
    return roleIdToSpaceRole(memberRoleMap[userId], isCreator);
  };

  const handleChangeMemberRole = async (targetUserId: number, newRole: SpaceRoleType) => {
    if (!isPM || (workspaceOwnerId && targetUserId === workspaceOwnerId)) return;
    const newRoleId = spaceRoleToRoleId(newRole);
    try {
      setUpdatingRoleIdUser(targetUserId);
      await workspaceService.updateSpaceMemberRole(spaceId, targetUserId, newRoleId);
      setMemberRoleMap((prev) => ({ ...prev, [targetUserId]: newRoleId }));
      if (onRoleUpdated) onRoleUpdated();
    } catch (err) {
      alert("Không thể cập nhật vai trò thành viên trong Space!");
    } finally {
      setUpdatingRoleIdUser(null);
    }
  };

  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);

  const handleConfirmRemove = async () => {
    if (!deletingUserId) return;
    try {
      await workspaceService.removeMemberFromSpace(spaceId, deletingUserId);
      setSpaceMembers((prev) => prev.filter((m) => m.id !== deletingUserId));
      setDeletingUserId(null);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("space_tasks_updated"));
      }
      if (onRoleUpdated) onRoleUpdated();
    } catch (err) {
      alert("Không thể xóa thành viên khỏi Space!");
    }
  };

  const getMemberInitials = (name?: string, email?: string) => {
    const text = name || email || "User";
    const parts = text.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return text.substring(0, 2).toUpperCase();
  };

  const filteredMembers = spaceMembers.filter((m) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      (m.fullName && m.fullName.toLowerCase().includes(q)) ||
      (m.email && m.email.toLowerCase().includes(q)) ||
      (m.jobTitle && m.jobTitle.toLowerCase().includes(q))
    );
  });

  const totalSpaceTasks = tasks.length || 1;

  return (
    <div className="space-y-6 font-sans animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-1">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#6B7280]" />
            <input
              type="text"
              placeholder="Tìm theo tên, email hoặc vị trí chuyên môn..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-1.5 bg-white border border-[#D1D5DB] rounded-lg text-xs font-medium text-[#111827] focus:outline-none focus:border-[#1A73E8] w-72 shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-[#6B7280] flex-wrap">
            <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-mono text-[11px] font-bold">
              PM: {spaceMembers.filter((m) => getMemberSpaceRole(m.id) === "PM").length}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 font-mono text-[11px] font-bold">
              ASSISTANT: {spaceMembers.filter((m) => getMemberSpaceRole(m.id) === "ASSISTANT").length}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-mono text-[11px] font-bold">
              MEMBER: {spaceMembers.filter((m) => getMemberSpaceRole(m.id) === "MEMBER").length}
            </span>
          </div>
        </div>

        {isPM && (
          <button
            onClick={onOpenAddMember}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#1A73E8] hover:bg-[#1557B0] text-white rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Thêm thành viên vào Space</span>
          </button>
        )}
      </div>

      {/* Members Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-[#9CA3AF] italic">
          Đang tải danh sách thành viên &amp; cấu hình phân quyền Space...
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-10 text-center space-y-3">
          <Users className="w-10 h-10 text-[#9CA3AF] mx-auto" />
          <p className="text-sm font-bold text-[#111827]">Chưa có thành viên nào trong Space này</p>
          {isPM && (
            <>
              <p className="text-xs text-[#6B7280]">Nhấn nút bên dưới để bắt đầu đưa nhân sự từ Workspace vào dự án.</p>
              <button
                onClick={onOpenAddMember}
                className="px-4 py-2 bg-[#111827] text-white text-xs font-bold rounded-xl shadow-2xs hover:bg-black transition-colors"
              >
                + Thêm thành viên ngay
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMembers.map((member) => {
            const role = getMemberSpaceRole(member.id);
            const isMemberWsOwner = Boolean(workspaceOwnerId && member.id === workspaceOwnerId);
            const { standardizedJobTitle, primaryDomains, roleBadgeLabel } = standardizeMemberProfile(
              member,
              role,
              isMemberWsOwner
            );
            const recommendation = recommendSpaceRoleForMember(member, isMemberWsOwner);

            const memberTasks = tasks.filter(
              (t) => t.assignee?.id === member.id || t.ownerId === member.id
            );
            const assignedCount = memberTasks.length;
            const completedCount = memberTasks.filter((t) => t.status === "DONE").length;
            const workloadPercent = Math.round((assignedCount / totalSpaceTasks) * 100);

            const roleBadgeStyle =
              role === "PM"
                ? "bg-amber-50 text-amber-800 border-amber-300"
                : role === "ASSISTANT"
                ? "bg-purple-50 text-purple-700 border-purple-200"
                : "bg-blue-50 text-blue-700 border-blue-200";

            return (
              <div
                key={member.id}
                className={`bg-white border rounded-2xl p-5 shadow-2xs hover:border-[#1A73E8] transition-all space-y-4 cursor-pointer ${
                  role === "PM"
                    ? "border-amber-200/90"
                    : role === "ASSISTANT"
                    ? "border-purple-200/90"
                    : "border-[#E5E7EB]"
                }`}
                onClick={() => setSelectedMember(member)}
              >
                {/* Member Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-full font-mono font-bold text-sm flex items-center justify-center border shrink-0 ${
                        role === "PM"
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : role === "ASSISTANT"
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : "bg-[#E8F0FE] text-[#1A73E8] border-[#D2E3FC]"
                      }`}
                    >
                      {getMemberInitials(member.fullName, member.email)}
                    </div>
                    <div className="truncate">
                      <h4 className="font-extrabold text-[#111827] text-sm truncate flex items-center gap-1.5">
                        <span className="truncate">{member.fullName || member.email}</span>
                        {currentUserId === member.id && (
                          <span className="text-[10px] font-mono text-[#1A73E8] font-bold shrink-0">(Tôi)</span>
                        )}
                      </h4>
                      <p className="text-[11px] text-[#6B7280] flex items-center gap-1 truncate">
                        <Mail className="w-3 h-3 text-[#9CA3AF] shrink-0" />
                        {member.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {isPM && !isMemberWsOwner ? (
                      <select
                        disabled={updatingRoleIdUser === member.id}
                        value={role}
                        onChange={(e) => handleChangeMemberRole(member.id, e.target.value as SpaceRoleType)}
                        className={`px-2 py-0.5 text-[10px] font-mono font-extrabold rounded-md border cursor-pointer focus:outline-none ${roleBadgeStyle}`}
                        title="Đổi vai trò phân quyền (RBAC) trong Space"
                      >
                        <option value="ASSISTANT">Role: ASSISTANT</option>
                        <option value="MEMBER">Role: MEMBER</option>
                      </select>
                    ) : (
                      <span
                        className={`px-2 py-0.5 text-[10px] font-mono font-extrabold rounded-md border flex items-center gap-1 ${roleBadgeStyle}`}
                      >
                        {isMemberWsOwner && <Crown className="w-3 h-3 text-amber-600" />}
                        {isMemberWsOwner ? "PM (Quản lý Space)" : roleBadgeLabel}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(currentUserId === member.id ? "/profile" : `/profile/${member.id}`);
                      }}
                      className="p-1 hover:bg-blue-50 text-[#6B7280] hover:text-[#1A73E8] rounded-md transition-colors cursor-pointer"
                      title="Xem hồ sơ cá nhân"
                    >
                      <UserCircle className="w-4 h-4" />
                    </button>

                    {isPM && !isMemberWsOwner && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingUserId(member.id);
                        }}
                        className="p-1 hover:bg-red-50 text-[#9CA3AF] hover:text-[#D93025] rounded-md transition-colors"
                        title="Xóa khỏi Space (Giữ nguyên dữ liệu công việc)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Standardized Job Title & Primary Domains */}
                <div className="space-y-2 pt-1 border-t border-[#F3F4F6]">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#374151]">
                    <Briefcase className="w-3.5 h-3.5 text-[#6B7280] shrink-0" />
                    <span className="truncate">{standardizedJobTitle}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {primaryDomains.map((dom) => (
                      <span
                        key={dom}
                        className="px-2 py-0.5 rounded-md bg-[#F9FAFB] border border-[#E5E7EB] text-[10px] font-mono font-semibold text-[#4B5563]"
                      >
                        {dom}
                      </span>
                    ))}
                  </div>

                  {/* Role & Permission Consultant Suggestion */}
                  {!isMemberWsOwner && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1.5 p-2.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] space-y-1.5 text-[11px]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-[#111827] flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-[#1A73E8] shrink-0" />
                          <span>Đề xuất: {recommendation.roleBadgeLabel}</span>
                        </span>
                        {isPM && recommendation.recommendedRole !== role && (
                          <button
                            type="button"
                            disabled={updatingRoleIdUser === member.id}
                            onClick={() => handleChangeMemberRole(member.id, recommendation.recommendedRole)}
                            className="px-2 py-0.5 rounded bg-[#1A73E8] hover:bg-[#1557B0] text-white font-mono text-[10px] font-bold transition-colors cursor-pointer shrink-0"
                          >
                            Áp dụng
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-[#6B7280] leading-relaxed">
                        {recommendation.reason}
                      </p>
                    </div>
                  )}
                </div>

                {/* Task Stats */}
                <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[#F3F4F6]">
                  <div className="bg-[#F9FAFB] p-2.5 rounded-xl border border-[#E5E7EB] space-y-0.5">
                    <p className="text-[10px] text-[#6B7280] font-medium flex items-center gap-1">
                      <ListTodo className="w-3 h-3 text-[#1A73E8]" /> Được giao
                    </p>
                    <p className="text-base font-extrabold text-[#111827]">{assignedCount} tasks</p>
                  </div>
                  <div className="bg-[#E6F4EA]/50 p-2.5 rounded-xl border border-[#CEE7D4] space-y-0.5">
                    <p className="text-[10px] text-[#137333] font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-[#10B981]" /> Hoàn thành
                    </p>
                    <p className="text-base font-extrabold text-[#137333]">{completedCount} tasks</p>
                  </div>
                </div>

                {/* Workload Capacity Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-[#4B5563]">Khối lượng công việc Space</span>
                    <span className="font-mono font-bold text-[#1A73E8]">{workloadPercent}%</span>
                  </div>
                  <div className="w-full bg-[#E5E7EB] h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#1A73E8] h-full transition-all duration-500 rounded-full"
                      style={{ width: `${workloadPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal for Selected Member (RBAC Permissions Matrix + Assigned Tasks) */}
      {selectedMember && (() => {
        const selectedRole = getMemberSpaceRole(selectedMember.id);
        const isSelectedWsOwner = Boolean(workspaceOwnerId && selectedMember.id === workspaceOwnerId);
        const { standardizedJobTitle, primaryDomains } = standardizeMemberProfile(
          selectedMember,
          selectedRole
        );
        const permissions = getSpacePermissionsByRole(selectedRole);
        const memberAssignedTasks = tasks.filter(
          (t) => t.assignee?.id === selectedMember.id || t.ownerId === selectedMember.id
        );

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-[#E5E7EB] max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-full font-mono font-bold text-xs flex items-center justify-center border shrink-0 ${
                      selectedRole === "PM"
                        ? "bg-amber-50 text-amber-800 border-amber-200"
                        : "bg-[#E8F0FE] text-[#1A73E8] border-[#D2E3FC]"
                    }`}
                  >
                    {getMemberInitials(selectedMember.fullName, selectedMember.email)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-[#111827] text-base truncate">
                        {selectedMember.fullName || selectedMember.email}
                      </h3>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-mono font-extrabold rounded-md border ${
                          selectedRole === "PM"
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : selectedRole === "ASSISTANT"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}
                      >
                        {isSelectedWsOwner ? "PM (Quản lý Space)" : `Role: ${selectedRole}`}
                      </span>
                    </div>
                    <p className="text-xs text-[#6B7280] truncate">
                      {standardizedJobTitle} • {primaryDomains.join(", ")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const targetId = selectedMember.id;
                      setSelectedMember(null);
                      router.push(currentUserId === targetId ? "/profile" : `/profile/${targetId}`);
                    }}
                    className="px-3 py-1.5 bg-[#E8F0FE] hover:bg-[#D2E3FC] text-[#1A73E8] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <UserCircle className="w-4 h-4" />
                    <span>Xem hồ sơ</span>
                  </button>
                  <button
                    onClick={() => setSelectedMember(null)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg text-[#6B7280]"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto space-y-4 pr-1 flex-1">
                {/* RBAC Matrix Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-[#111827] uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#137333]" />
                      Ma trận Quyền hạn (Space RBAC Matrix)
                    </h4>
                    {isPM && !isSelectedWsOwner && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-[#6B7280] text-[11px]">Cấp quyền:</span>
                        <select
                          value={selectedRole}
                          disabled={updatingRoleIdUser === selectedMember.id}
                          onChange={(e) =>
                            handleChangeMemberRole(selectedMember.id, e.target.value as SpaceRoleType)
                          }
                          className="px-2 py-1 border border-[#D1D5DB] rounded-lg text-xs font-bold bg-white"
                        >
                          <option value="ASSISTANT">ASSISTANT (Trợ lý điều phối &amp; AI Nháp)</option>
                          <option value="MEMBER">MEMBER (Thành viên thực thi)</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-1.5 bg-[#F9FAFB] p-3 rounded-xl border border-[#E5E7EB]">
                    {PERMISSION_LABELS.map((item) => {
                      const allowed = permissions[item.key];
                      return (
                        <div
                          key={item.key}
                          className={`flex items-start justify-between gap-3 p-2 rounded-lg text-xs ${
                            allowed ? "bg-white border border-[#E5E7EB]" : "opacity-60"
                          }`}
                        >
                          <div className="space-y-0.5">
                            <p className="font-bold text-[#111827]">{item.label}</p>
                            <p className="text-[11px] text-[#6B7280]">{item.desc}</p>
                          </div>
                          {allowed ? (
                            <span className="px-2 py-0.5 rounded-md bg-[#E6F4EA] text-[#137333] border border-[#CEE7D4] font-mono text-[10px] font-bold shrink-0 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Cho phép
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 border border-gray-200 font-mono text-[10px] font-bold shrink-0 flex items-center gap-1">
                              <Lock className="w-3 h-3" /> Giới hạn
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* List of Tasks Assigned to this Member */}
                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold text-[#111827] uppercase tracking-wider font-mono">
                    Danh sách task được gán ({memberAssignedTasks.length})
                  </h4>
                  <div className="max-h-48 overflow-y-auto divide-y divide-[#E5E7EB] border border-[#E5E7EB] rounded-xl bg-[#F9FAFB]">
                    {memberAssignedTasks.length === 0 ? (
                      <div className="p-4 text-center text-xs text-[#9CA3AF] italic">
                        Chưa có công việc nào được giao cho thành viên này.
                      </div>
                    ) : (
                      memberAssignedTasks.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => {
                            setSelectedMember(null);
                            if (onSelectTask) onSelectTask(t);
                          }}
                          className="p-3 hover:bg-white transition-colors flex items-center justify-between text-xs cursor-pointer"
                        >
                          <div className="flex items-center gap-2 truncate pr-2">
                            <span className="text-[#1A73E8] font-mono font-bold">Task-{t.id}</span>
                            <span className="font-medium text-[#111827] truncate">{t.title}</span>
                          </div>
                          <span className="px-2 py-0.5 bg-[#F1F3F4] text-[#5F6368] text-[10px] font-bold rounded-md shrink-0">
                            {t.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-[#E5E7EB] flex justify-end shrink-0">
                <button
                  onClick={() => setSelectedMember(null)}
                  className="px-4 py-2 bg-[#111827] text-white text-xs font-bold rounded-xl hover:bg-black transition-colors cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Custom Confirm Dialog for Member Removal */}
      <ConfirmDialog
        isOpen={Boolean(deletingUserId)}
        title="Xóa thành viên khỏi Space"
        message="Bạn có chắc chắn muốn xóa thành viên này khỏi Space không? Lịch sử và dữ liệu các công việc họ đã từng thực hiện vẫn sẽ được bảo toàn nguyên vẹn."
        confirmText="Xác nhận xóa"
        cancelText="Hủy bỏ"
        variant="danger"
        onConfirm={handleConfirmRemove}
        onCancel={() => setDeletingUserId(null)}
      />
    </div>
  );
}
