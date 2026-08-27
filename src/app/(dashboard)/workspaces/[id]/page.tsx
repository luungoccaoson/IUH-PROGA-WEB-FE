"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, Sparkles, Calendar, Lock, Globe, ShieldAlert, UserPlus, Users, Search, Check, Trash2, Mail } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { workspaceService } from "@/services/workspace.service";
import { userService } from "@/services/user.service";
import { Workspace, Space, User, WorkspaceMember } from "@/types";

export default function WorkspaceDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const workspaceId = parseInt(params.id as string, 10);

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create Space Modal State
  const [showCreateSpaceModal, setShowCreateSpaceModal] = useState(false);
  const [spaceName, setSpaceName] = useState("");
  const [spaceStartDate, setSpaceStartDate] = useState("");
  const [spaceEndDate, setSpaceEndDate] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  // Delete Space State
  const [selectedSpaceToDelete, setSelectedSpaceToDelete] = useState<Space | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Invite Member Modal State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [invitedUserIds, setInvitedUserIds] = useState<number[]>([]);

  const isOwner = currentUser?.id && workspace?.ownerId === currentUser.id;

  const fetchWorkspaceDetails = async () => {
    if (!workspaceId) return;
    try {
      setLoading(true);
      setError("");
      const wsData = await workspaceService.getWorkspaceById(workspaceId);
      setWorkspace(wsData);

      const spacesList = await workspaceService.getSpacesByWorkspace(workspaceId);
      setSpaces(spacesList);

      try {
        const memberList = await workspaceService.getWorkspaceMembers(workspaceId);
        setMembers(memberList);
      } catch (e) {
        console.error("Error loading workspace members:", e);
      }
    } catch (err: any) {
      console.error("Error fetching workspace details:", err);
      setError("Không thể tải thông tin workspace.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaceDetails();
  }, [workspaceId, currentUser?.id]);

  // Handle Search Users for Invitation
  useEffect(() => {
    if (!showInviteModal) return;

    const timer = setTimeout(async () => {
      try {
        setSearching(true);
        const users = await userService.searchUsers(searchQuery);
        // Exclude current owner from search results
        setSearchResults(users.filter((u) => u.id !== currentUser?.id));
      } catch (err) {
        console.error("Error searching users:", err);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, showInviteModal, currentUser?.id]);

  const handleInviteUser = async (targetUser: User) => {
    try {
      await workspaceService.inviteMember(workspaceId, targetUser.id);
      setInvitedUserIds([...invitedUserIds, targetUser.id]);
      setMembers((prev) => [
        ...prev,
        {
          workspaceId,
          userId: targetUser.id,
          roleId: 3,
          status: "PENDING",
          joinedAt: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      alert("Không thể gửi lời mời tham gia Workspace!");
    }
  };

  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spaceName.trim() || !isOwner) return;

    try {
      setCreateLoading(true);
      setCreateError("");
      const newSpace = await workspaceService.createSpace({
        workspaceId,
        name: spaceName.trim(),
        startDate: spaceStartDate ? `${spaceStartDate}T00:00:00` : undefined,
        endDate: spaceEndDate ? `${spaceEndDate}T23:59:59` : undefined,
        isPrivate,
      });

      setSpaces([...spaces, newSpace]);
      setShowCreateSpaceModal(false);
      setSpaceName("");
      setSpaceStartDate("");
      setSpaceEndDate("");
      setIsPrivate(false);
    } catch (err: any) {
      setCreateError(err.response?.data?.message || "Không thể tạo Space mới.");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteSpace = async () => {
    if (!selectedSpaceToDelete || !isOwner) return;
    try {
      setDeleteLoading(true);
      await workspaceService.deleteSpace(selectedSpaceToDelete.id);
      setSpaces(spaces.filter((s) => s.id !== selectedSpaceToDelete.id));
      setSelectedSpaceToDelete(null);
    } catch (err) {
      alert("Không thể xóa Space này!");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[#6B7280]">
        <Sparkles className="w-8 h-8 text-[#111827] animate-spin mb-3" />
        <p className="font-mono text-xs uppercase tracking-wider">Đang tải thông tin workspace...</p>
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="bg-[#FDEDEC] border border-[#FADBD8] text-[#D93025] p-6 rounded-2xl max-w-xl mx-auto text-center space-y-4 font-sans">
        <p className="font-bold">{error || "Không tìm thấy Workspace."}</p>
        <button
          onClick={() => router.push("/workspaces")}
          className="px-4 py-2 bg-[#111827] text-white rounded-xl text-sm font-bold"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300 font-sans">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-[#6B7280] font-mono font-bold flex items-center gap-1.5">
            Workspace Dashboard
            {!isOwner && (
              <span className="px-2 py-0.5 rounded-full bg-[#E8F0FE] text-[#1A73E8] font-mono text-[9px] font-bold">
                Thành viên
              </span>
            )}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] mt-1">
            {workspace.name}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* View Workspace Members Button */}
          <button
            onClick={() => router.push(`/workspaces/${workspaceId}/members`)}
            className="px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] bg-white hover:bg-gray-50 text-[#111827] font-bold text-sm transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Users className="w-4 h-4 text-[#1A73E8]" />
            <span>Thành viên Workspace ({members.length})</span>
          </button>

          {/* Invite Members Button for Owner */}
          {isOwner && (
            <button
              onClick={() => {
                setSearchQuery("");
                setShowInviteModal(true);
              }}
              className="px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] bg-white hover:bg-gray-50 text-[#111827] font-bold text-sm transition-all shadow-2xs flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4 text-[#137333]" />
              <span>Mời thành viên</span>
            </button>
          )}

          {/* Create Space Button - Only enabled for Workspace Owner */}
          {isOwner ? (
            <button
              onClick={() => {
                setSpaceName("");
                setSpaceStartDate("");
                setSpaceEndDate("");
                setIsPrivate(false);
                setShowCreateSpaceModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-[#111827] text-white hover:bg-[#1F2937] font-bold text-sm shadow-md transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Space mới</span>
            </button>
          ) : (
            <div
              title="Chỉ Chủ sở hữu Workspace mới có quyền tạo Space mới"
              className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-400 font-bold text-sm flex items-center gap-1.5 cursor-not-allowed border border-gray-200"
            >
              <ShieldAlert className="w-4 h-4 text-gray-400" />
              <span>Tạo Space mới</span>
            </div>
          )}
        </div>
      </div>

      {/* Description Panel */}
      {workspace.description && (
        <div className="bg-[#F6F5EF] p-6 rounded-2xl border border-[#E5E7EB] shadow-2xs">
          <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#6B7280] mb-2">
            Mô tả workspace
          </p>
          <p className="text-sm text-[#4B5563] leading-relaxed">
            {workspace.description}
          </p>
        </div>
      )}

      {/* Workspace metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#F6F5EF] p-5 rounded-2xl border border-[#E5E7EB] space-y-2 shadow-2xs">
          <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#6B7280]">
            TỔNG SPACES
          </p>
          <p className="text-3xl font-extrabold text-[#111827]">
            {spaces.length}
          </p>
          <p className="text-xs text-[#4B5563] font-medium">Không gian làm việc hiển thị</p>
        </div>

        <div className="bg-[#F6F5EF] p-5 rounded-2xl border border-[#E5E7EB] space-y-2 shadow-2xs">
          <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#6B7280]">
            THÀNH VIÊN WORKSPACE
          </p>
          <p className="text-3xl font-extrabold text-[#137333]">
            {members.length > 0 ? members.length : 1}
          </p>
          <p className="text-xs text-[#4B5563] font-medium">Thành viên & Lời mời</p>
        </div>

        <div className="bg-[#F6F5EF] p-5 rounded-2xl border border-[#E5E7EB] space-y-2 shadow-2xs">
          <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#6B7280]">
            SPACES CÔNG KHAI
          </p>
          <p className="text-3xl font-extrabold text-[#1A73E8]">
            {spaces.filter((s) => !s.isPrivate).length}
          </p>
          <p className="text-xs text-[#4B5563] font-medium">Public Spaces</p>
        </div>

        <div className="bg-[#F6F5EF] p-5 rounded-2xl border border-[#E5E7EB] space-y-2 shadow-2xs">
          <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#6B7280]">
            SPACES RIÊNG TƯ
          </p>
          <p className="text-3xl font-extrabold text-[#B06000]">
            {spaces.filter((s) => s.isPrivate).length}
          </p>
          <p className="text-xs text-[#4B5563] font-medium">Private Spaces</p>
        </div>
      </div>

      {/* List of Spaces in this Workspace */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-[#111827] uppercase tracking-wider font-mono">
            Danh sách Spaces trong Workspace
          </h2>
        </div>

        {spaces.length === 0 ? (
          <div className="bg-white border border-dashed border-[#E5E7EB] p-8 rounded-2xl text-center text-sm text-[#6B7280]">
            Chưa có Space nào hiển thị cho tài khoản của bạn trong Workspace này.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {spaces.map((s) => (
              <div
                key={s.id}
                onClick={() => router.push(`/workspaces/${workspaceId}/spaces/${s.id}`)}
                className="bg-white p-5 rounded-2xl border border-[#E5E7EB] hover:border-[#111827] cursor-pointer shadow-2xs hover:shadow-md transition-all group space-y-3 flex flex-col justify-between relative"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-[#E6F4EA] flex items-center justify-center text-[#137333] font-mono font-bold text-xs border border-[#D1E7DD]">
                      {s.name.substring(0, 2).toUpperCase()}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Privacy Badge */}
                      {s.isPrivate ? (
                        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-mono font-bold">
                          <Lock className="w-3 h-3" /> Private
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold">
                          <Globe className="w-3 h-3" /> Public
                        </span>
                      )}

                      {/* Delete button for Owner */}
                      {isOwner && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSpaceToDelete(s);
                          }}
                          className="p-1 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                          title="Xóa Space"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="text-sm font-extrabold text-[#111827] group-hover:text-[#137333] transition-colors">
                    {s.name}
                  </h3>
                </div>

                <div className="pt-3 border-t border-[#F6F5EF] flex items-center justify-between text-[10px] font-mono text-[#6B7280]">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {s.startDate ? new Date(s.startDate).toLocaleDateString("vi-VN") : "Chưa chọn"}
                  </span>
                  <span className="font-bold text-[#111827] group-hover:underline">Vào Space →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* INVITE MEMBERS MODAL */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200 font-sans">
          <div className="w-full max-w-lg bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <h3 className="text-base font-extrabold text-[#111827] flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#137333]" />
                Mời thành viên vào Workspace
              </h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Search Input Box */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#111827] font-mono uppercase tracking-wider">
                Tìm kiếm User (Theo Username, Email, Tên)
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Nhập username, email hoặc tên hiển thị..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5E7EB] text-xs text-[#111827] focus:outline-none focus:border-[#111827] bg-[#F6F5EF]"
                />
              </div>
            </div>

            {/* Results List */}
            <div className="max-h-60 overflow-y-auto space-y-2 pt-1 border-t border-[#E5E7EB]">
              {searching ? (
                <div className="text-center py-6 text-xs text-gray-400 font-mono">Đang tìm kiếm...</div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-400">
                  {searchQuery ? "Không tìm thấy user nào khớp." : "Nhập từ khóa để tìm kiếm các thành viên hệ thống."}
                </div>
              ) : (
                searchResults.map((u) => {
                  const isInvited = invitedUserIds.includes(u.id);
                  return (
                    <div
                      key={u.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#F6F5EF] border border-[#E5E7EB] hover:bg-white transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#111827] text-white flex items-center justify-center font-bold text-xs overflow-hidden">
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt={u.username} className="w-full h-full object-cover" />
                          ) : (
                            u.username.substring(0, 2).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#111827]">
                            {u.displayName || u.fullName || u.username}
                          </p>
                          <p className="text-[10px] text-gray-500 font-mono flex items-center gap-2">
                            <span>@{u.username}</span> • <span className="flex items-center gap-0.5"><Mail className="w-2.5 h-2.5" />{u.email}</span>
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleInviteUser(u)}
                        disabled={isInvited}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
                          isInvited
                            ? "bg-emerald-100 text-emerald-700 cursor-default"
                            : "bg-[#111827] hover:bg-[#1F2937] text-white shadow-2xs"
                        }`}
                      >
                        {isInvited ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> Đã gửi lời mời
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3.5 h-3.5" /> Mời tham gia
                          </>
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-[#E5E7EB]">
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE SPACE MODAL */}
      {showCreateSpaceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200 font-sans">
          <div className="w-full max-w-md bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-[#111827]">Tạo Space mới</h3>

            {createError && (
              <div className="bg-[#FDEDEC] border border-[#FADBD8] text-[#D93025] p-3 rounded-xl text-xs font-bold">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateSpace} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[#111827] font-mono uppercase tracking-wider text-[11px]">
                  Tên Space <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Development Space"
                  value={spaceName}
                  onChange={(e) => setSpaceName(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#111827] bg-[#F6F5EF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#111827] font-mono uppercase tracking-wider text-[11px]">
                    Ngày bắt đầu
                  </label>
                  <input
                    type="date"
                    value={spaceStartDate}
                    onChange={(e) => setSpaceStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#111827] bg-[#F6F5EF]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-[#111827] font-mono uppercase tracking-wider text-[11px]">
                    Ngày kết thúc
                  </label>
                  <input
                    type="date"
                    value={spaceEndDate}
                    onChange={(e) => setSpaceEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#111827] bg-[#F6F5EF]"
                  />
                </div>
              </div>

              {/* Privacy Toggle */}
              <div className="space-y-2 pt-1 border-t border-[#E5E7EB]">
                <label className="font-bold text-[#111827] font-mono uppercase tracking-wider text-[11px]">
                  Quyền riêng tư của Space
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPrivate(false)}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between space-y-1 transition-all ${
                      !isPrivate
                        ? "border-[#137333] bg-[#E6F4EA]/40 text-[#137333] font-bold"
                        : "border-[#E5E7EB] hover:bg-gray-50 text-[#6B7280]"
                    }`}
                  >
                    <span className="flex items-center gap-1 font-bold text-xs">
                      <Globe className="w-3.5 h-3.5" /> Public
                    </span>
                    <span className="text-[10px] leading-tight opacity-80 font-normal">
                      Tất cả thành viên trong Workspace đều xem được
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPrivate(true)}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between space-y-1 transition-all ${
                      isPrivate
                        ? "border-amber-600 bg-amber-50 text-amber-800 font-bold"
                        : "border-[#E5E7EB] hover:bg-gray-50 text-[#6B7280]"
                    }`}
                  >
                    <span className="flex items-center gap-1 font-bold text-xs">
                      <Lock className="w-3.5 h-3.5" /> Private
                    </span>
                    <span className="text-[10px] leading-tight opacity-80 font-normal">
                      Chỉ những ai được mời mới nhìn thấy và truy cập được
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setShowCreateSpaceModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#E5E7EB] hover:bg-[#F6F5EF] text-xs font-semibold text-[#4B5563]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 rounded-xl bg-[#111827] hover:bg-[#1F2937] text-white text-xs font-bold shadow-md disabled:opacity-50"
                >
                  {createLoading ? "Đang tạo..." : "Tạo Space mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE SPACE MODAL */}
      {selectedSpaceToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200 font-sans">
          <div className="w-full max-w-sm bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#FDEDEC] text-[#D93025] flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-base font-bold text-[#111827]">Xác nhận xóa Space?</h3>
              <p className="text-xs text-[#6B7280]">
                Bạn có chắc chắn muốn xóa Space <strong>{selectedSpaceToDelete.name}</strong>? Tất cả Sprints và Task thuộc về Space này sẽ bị ảnh hưởng.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedSpaceToDelete(null)}
                className="px-4 py-2 rounded-xl border border-[#E5E7EB] hover:bg-[#F6F5EF] text-xs font-semibold"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDeleteSpace}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-xl bg-[#D93025] hover:bg-[#C0392B] text-white text-xs font-bold shadow-md disabled:opacity-50"
              >
                {deleteLoading ? "Đang xóa..." : "Xác nhận xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
