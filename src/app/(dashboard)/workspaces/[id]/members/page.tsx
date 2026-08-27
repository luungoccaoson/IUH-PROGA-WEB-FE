"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Users, UserPlus, Search, ShieldCheck, Mail, ChevronRight, CheckCircle2, ListTodo, ArrowLeft } from "lucide-react";
import { workspaceService } from "@/services/workspace.service";
import { userService } from "@/services/user.service";
import { User, Workspace } from "@/types";

export default function WorkspaceMembersPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = Number(params?.id);

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    if (workspaceId) {
      loadData();
    }
  }, [workspaceId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ws, wsMembers] = await Promise.all([
        workspaceService.getWorkspaceById(workspaceId).catch(() => null),
        workspaceService.getWorkspaceMembers(workspaceId).catch(() => []),
      ]);

      setWorkspace(ws);

      const userIds: number[] = Array.from(
        new Set((wsMembers || []).map((m: any) => m.id?.userId || m.userId).filter(Boolean))
      );

      const userProfiles = await Promise.all(
        userIds.map((id) => userService.getUserById(id).catch(() => null))
      );

      const validUsers = userProfiles.filter((u): u is User => u !== null);
      setMembers(validUsers);
    } catch (err) {
      console.error("Failed to load workspace members:", err);
    } finally {
      setLoading(false);
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

  const filteredMembers = members.filter((m) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (m.fullName && m.fullName.toLowerCase().includes(q)) ||
      (m.email && m.email.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 font-sans animate-in fade-in duration-200">
      {/* Breadcrumb Header */}
      <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-[#6B7280] font-mono">
            <button
              onClick={() => router.push(`/workspaces/${workspaceId}`)}
              className="hover:underline flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Workspace {workspace?.name || workspaceId}
            </button>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-bold text-[#111827]">Thành viên Workspace</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#111827] flex items-center gap-2">
            <Users className="w-6 h-6 text-[#1A73E8]" />
            Quản Lý Thành Viên Workspace
          </h1>
          <p className="text-xs text-[#6B7280]">
            Danh sách nhân sự tham gia Workspace {workspace?.name}. Thêm hoặc phân bổ các thành viên vào các Space.
          </p>
        </div>
      </div>

      {/* Top Search & Action */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#6B7280]" />
          <input
            type="text"
            placeholder="Tìm kiếm thành viên..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 bg-white border border-[#D1D5DB] rounded-xl text-xs font-medium text-[#111827] focus:outline-none focus:border-[#1A73E8] w-72 shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-[#6B7280] font-mono">
          <span>Tổng số: <strong className="text-[#111827]">{members.length} thành viên</strong></span>
        </div>
      </div>

      {/* Members Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-[#9CA3AF] italic">
          Đang tải danh sách thành viên Workspace...
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-10 text-center space-y-2">
          <Users className="w-10 h-10 text-[#9CA3AF] mx-auto" />
          <p className="text-sm font-bold text-[#111827]">Không tìm thấy thành viên nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMembers.map((member) => {
            const isOwner = member.id === workspace?.ownerId;

            return (
              <div
                key={member.id}
                className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-2xs hover:border-[#1A73E8] transition-all space-y-4 cursor-pointer"
                onClick={() => setSelectedUser(member)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {member.avatarUrl ? (
                      <img
                        src={member.avatarUrl}
                        alt={member.fullName || member.email}
                        className="w-12 h-12 rounded-full object-cover border border-[#D1D5DB]"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[#E8F0FE] text-[#1A73E8] font-mono font-bold text-sm flex items-center justify-center border border-[#D2E3FC] shrink-0">
                        {getMemberInitials(member.fullName, member.email)}
                      </div>
                    )}
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

                  <span
                    className={`px-2.5 py-0.5 text-[10px] font-bold rounded-lg border shrink-0 ${
                      isOwner
                        ? "bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]"
                        : "bg-[#F3F4F6] text-[#4B5563] border-[#E5E7EB]"
                    }`}
                  >
                    {isOwner ? "Chủ sở hữu" : "Thành viên"}
                  </span>
                </div>

                <div className="pt-2 border-t border-[#F3F4F6] flex items-center justify-between text-xs text-[#6B7280]">
                  <span className="flex items-center gap-1 font-medium">
                    <ShieldCheck className="w-4 h-4 text-[#10B981]" /> Tài khoản đã xác thực
                  </span>
                  <span className="text-[#1A73E8] font-bold hover:underline">Chi tiết &rarr;</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
