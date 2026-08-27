"use client";

import React, { useState, useEffect } from "react";
import { UserPlus, X, Check, ShieldCheck, Search } from "lucide-react";
import { workspaceService } from "@/services/workspace.service";
import { userService } from "@/services/user.service";
import { User } from "@/types";

interface AddSpaceMemberModalProps {
  isOpen: boolean;
  workspaceId: number;
  spaceId: number;
  onClose: () => void;
  onMemberAdded?: () => void;
}

export function AddSpaceMemberModal({
  isOpen,
  workspaceId,
  spaceId,
  onClose,
  onMemberAdded,
}: AddSpaceMemberModalProps) {
  const [memberDetails, setMemberDetails] = useState<User[]>([]);
  const [spaceMemberIds, setSpaceMemberIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingUserId, setAddingUserId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isOpen && workspaceId && spaceId) {
      loadMembers();
    }
  }, [isOpen, workspaceId, spaceId]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const [wsMembers, spMembers] = await Promise.all([
        workspaceService.getWorkspaceMembers(workspaceId).catch(() => []),
        workspaceService.getSpaceMembers(spaceId).catch(() => []),
      ]);

      const existingIds = (spMembers || []).map((sm: any) => sm.id?.userId || sm.userId);
      setSpaceMemberIds(existingIds);

      // Extract unique user IDs from workspace members
      const userIds: number[] = Array.from(
        new Set((wsMembers || []).map((m: any) => m.id?.userId || m.userId).filter(Boolean))
      );

      // Fetch user profile info for each member ID
      const userProfiles = await Promise.all(
        userIds.map((id) => userService.getUserById(id).catch(() => null))
      );

      const validUsers = userProfiles.filter((u): u is User => u !== null);
      setMemberDetails(validUsers);
    } catch (err) {
      console.error("Failed to load members:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (userId: number) => {
    try {
      setAddingUserId(userId);
      await workspaceService.addMemberToSpace(spaceId, userId);
      setSpaceMemberIds((prev) => [...prev, userId]);
      if (onMemberAdded) onMemberAdded();
    } catch (err) {
      alert("Không thể thêm thành viên vào Space!");
    } finally {
      setAddingUserId(null);
    }
  };

  const filteredUsers = memberDetails.filter((u) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (u.fullName && u.fullName.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q))
    );
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200 font-sans">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#E5E7EB]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[#1A73E8]" />
            <h3 className="font-extrabold text-[#111827] text-base">
              Thêm Thành Viên Vào Space
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-[#6B7280] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-[#E5E7EB] rounded-xl text-xs font-medium focus:outline-none focus:border-[#1A73E8]"
          />
        </div>

        {/* Member List */}
        <div className="max-h-72 overflow-y-auto divide-y divide-[#E5E7EB] border border-[#E5E7EB] rounded-xl bg-[#F9FAFB]">
          {loading ? (
            <div className="p-6 text-center text-xs text-[#9CA3AF] italic">
              Đang tải chi tiết thành viên...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#9CA3AF] italic">
              Không tìm thấy thành viên phù hợp.
            </div>
          ) : (
            filteredUsers.map((u) => {
              const isAlreadyInSpace = spaceMemberIds.includes(u.id);

              return (
                <div
                  key={u.id}
                  className="p-3 flex items-center justify-between hover:bg-white transition-colors text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#E8F0FE] text-[#1A73E8] font-mono font-bold text-xs flex items-center justify-center border border-[#D2E3FC] shrink-0">
                      {(u.fullName || u.email).substring(0, 2).toUpperCase()}
                    </div>
                    <div className="truncate pr-2">
                      <p className="font-bold text-[#111827] truncate">
                        {u.fullName || u.email}
                      </p>
                      <p className="text-[10px] text-[#6B7280] flex items-center gap-1 truncate">
                        <ShieldCheck className="w-3 h-3 text-[#10B981] shrink-0" />
                        {u.email}
                      </p>
                    </div>
                  </div>

                  {isAlreadyInSpace ? (
                    <span className="px-2.5 py-1 bg-[#E6F4EA] text-[#137333] border border-[#CEE7D4] text-[10px] font-bold rounded-lg flex items-center gap-1 shrink-0">
                      <Check className="w-3 h-3 text-[#137333]" />
                      Đã ở trong Space
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAddMember(u.id)}
                      disabled={addingUserId === u.id}
                      className="px-3 py-1 bg-[#1A73E8] hover:bg-[#1557B0] text-white font-bold text-[11px] rounded-lg transition-colors shadow-2xs shrink-0 disabled:opacity-50"
                    >
                      {addingUserId === u.id ? "Đang thêm..." : "+ Thêm vào Space"}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-[#E5E7EB] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#111827] text-white font-bold text-xs rounded-xl shadow-2xs hover:bg-gray-800 transition-colors"
          >
            Hoàn tất
          </button>
        </div>
      </div>
    </div>
  );
}
