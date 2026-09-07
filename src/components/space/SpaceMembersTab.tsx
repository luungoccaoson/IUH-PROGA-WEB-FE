"use client";

import React, { useState, useEffect } from "react";
import { Users, UserPlus, ShieldCheck, CheckCircle2, ListTodo, Search, Trash2, Mail } from "lucide-react";
import { Task, User } from "@/types";
import { userService } from "@/services/user.service";
import { workspaceService } from "@/services/workspace.service";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

interface SpaceMembersTabProps {
  workspaceId: number;
  spaceId: number;
  tasks: Task[];
  onOpenAddMember: () => void;
  onSelectTask?: (task: Task) => void;
}

export function SpaceMembersTab({
  workspaceId,
  spaceId,
  tasks = [],
  onOpenAddMember,
  onSelectTask,
}: SpaceMembersTabProps) {
  const [spaceMembers, setSpaceMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMember, setSelectedMember] = useState<User | null>(null);

  useEffect(() => {
    loadSpaceMembers();
  }, [spaceId]);

  const loadSpaceMembers = async () => {
    try {
      setLoading(true);
      const rawMembers = await workspaceService.getSpaceMembers(spaceId);
      const userIds: number[] = Array.from(
        new Set((rawMembers || []).map((m: any) => m.id?.userId || m.userId).filter(Boolean))
      );

      const userProfiles = await Promise.all(
        userIds.map((id) => userService.getUserById(id).catch(() => null))
      );

      const validUsers = userProfiles.filter((u): u is User => u !== null);
      setSpaceMembers(validUsers);
    } catch (err) {
      console.error("Failed to load space members:", err);
    } finally {
      setLoading(false);
    }
  };

  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);

  const handleConfirmRemove = async () => {
    if (!deletingUserId) return;
    try {
      await workspaceService.removeMemberFromSpace(spaceId, deletingUserId);
      setSpaceMembers((prev) => prev.filter((m) => m.id !== deletingUserId));
      setDeletingUserId(null);
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
      (m.email && m.email.toLowerCase().includes(q))
    );
  });

  const totalSpaceTasks = tasks.length || 1;

  return (
    <div className="space-y-6 font-sans animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-1">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#6B7280]" />
            <input
              type="text"
              placeholder="Tìm kiếm thành viên trong Space..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-1.5 bg-white border border-[#D1D5DB] rounded-lg text-xs font-medium text-[#111827] focus:outline-none focus:border-[#1A73E8] w-64 shadow-2xs"
            />
          </div>
        </div>

        <button
          onClick={onOpenAddMember}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#1A73E8] hover:bg-[#1557B0] text-white rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Thêm thành viên vào Space</span>
        </button>
      </div>

      {/* Members Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-[#9CA3AF] italic">
          Đang tải danh sách thành viên Space...
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-10 text-center space-y-3">
          <Users className="w-10 h-10 text-[#9CA3AF] mx-auto" />
          <p className="text-sm font-bold text-[#111827]">Chưa có thành viên nào trong Space này</p>
          <p className="text-xs text-[#6B7280]">Nhấn nút bên dưới để bắt đầu đưa nhân sự từ Workspace vào dự án.</p>
          <button
            onClick={onOpenAddMember}
            className="px-4 py-2 bg-[#111827] text-white text-xs font-bold rounded-xl shadow-2xs hover:bg-black transition-colors"
          >
            + Thêm thành viên ngay
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMembers.map((member) => {
            const memberTasks = tasks.filter(
              (t) => t.assignee?.id === member.id || t.ownerId === member.id
            );
            const assignedCount = memberTasks.length;
            const completedCount = memberTasks.filter((t) => t.status === "DONE").length;
            const workloadPercent = Math.round((assignedCount / totalSpaceTasks) * 100);

            return (
              <div
                key={member.id}
                className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-2xs hover:border-[#1A73E8] transition-all space-y-4 cursor-pointer"
                onClick={() => setSelectedMember(member)}
              >
                {/* Member Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-[#E8F0FE] text-[#1A73E8] font-mono font-bold text-sm flex items-center justify-center border border-[#D2E3FC] shrink-0">
                      {getMemberInitials(member.fullName, member.email)}
                    </div>
                    <div className="truncate">
                      <h4 className="font-extrabold text-[#111827] text-sm truncate">
                        {member.fullName || member.email}
                      </h4>
                      <p className="text-[11px] text-[#6B7280] flex items-center gap-1 truncate">
                        <Mail className="w-3 h-3 text-[#9CA3AF] shrink-0" />
                        {member.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="px-2 py-0.5 bg-[#F3F4F6] text-[#4B5563] text-[10px] font-bold rounded-md border border-[#E5E7EB]">
                      Thành viên
                    </span>
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
                  </div>
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

      {/* Detail Modal for Selected Member */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-[#E5E7EB]">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <div className="flex items-center gap-3">
                {selectedMember.avatarUrl ? (
                  <img
                    src={selectedMember.avatarUrl}
                    alt={selectedMember.fullName || selectedMember.email}
                    className="w-10 h-10 rounded-full object-cover border border-[#D1D5DB]"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#E8F0FE] text-[#1A73E8] font-mono font-bold text-xs flex items-center justify-center border border-[#D2E3FC]">
                    {getMemberInitials(selectedMember.fullName, selectedMember.email)}
                  </div>
                )}
                <div>
                  <h3 className="font-extrabold text-[#111827] text-base">
                    {selectedMember.fullName || selectedMember.email}
                  </h3>
                  <p className="text-xs text-[#6B7280]">{selectedMember.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-[#6B7280]"
              >
                ✕
              </button>
            </div>

            {/* List of Tasks Assigned to this Member */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-[#111827] uppercase tracking-wider font-mono">
                Danh sách task được gán ({tasks.filter((t) => t.assignee?.id === selectedMember.id || t.ownerId === selectedMember.id).length})
              </h4>
              <div className="max-h-60 overflow-y-auto divide-y divide-[#E5E7EB] border border-[#E5E7EB] rounded-xl bg-[#F9FAFB]">
                {tasks
                  .filter((t) => t.assignee?.id === selectedMember.id || t.ownerId === selectedMember.id)
                  .map((t) => (
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
                  ))}
              </div>
            </div>

            <div className="pt-2 border-t border-[#E5E7EB] flex justify-end">
              <button
                onClick={() => setSelectedMember(null)}
                className="px-4 py-2 bg-[#111827] text-white text-xs font-bold rounded-xl hover:bg-black transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

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
