"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit2, Trash2, Folder, Sparkles, AlertCircle, Users, Mail, Check, X, ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { workspaceService } from "@/services/workspace.service";
import { Workspace, ClassifiedWorkspaces } from "@/types";

type TabCategory = "owned" | "joined" | "pending";

export default function WorkspacesPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<TabCategory>("owned");
  const [classified, setClassified] = useState<ClassifiedWorkspaces>({
    ownedWorkspaces: [],
    joinedWorkspaces: [],
    pendingWorkspaces: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);

  // Fetch classified workspaces
  const fetchWorkspaces = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      setError("");
      const data = await workspaceService.getClassifiedWorkspaces(user.id);
      setClassified(data);
    } catch (err: any) {
      console.error("Error loading workspaces:", err);
      // Fallback if classified API fails
      try {
        const owned = await workspaceService.getWorkspacesByOwner(user.id);
        setClassified({ ownedWorkspaces: owned, joinedWorkspaces: [], pendingWorkspaces: [] });
      } catch (e) {
        setError("Không thể tải danh sách Workspace. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, [user?.id]);

  // Create Workspace
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !user?.id) return;

    try {
      setError("");
      const newWs = await workspaceService.createWorkspace({
        name: name.trim(),
        description: description.trim(),
        ownerId: user.id,
      });
      setClassified((prev) => ({
        ...prev,
        ownedWorkspaces: [newWs, ...prev.ownedWorkspaces],
      }));
      setShowCreateModal(false);
      setName("");
      setDescription("");
    } catch (err: any) {
      console.error("Error creating workspace:", err);
      setError("Không thể tạo Workspace mới.");
    }
  };

  // Edit Workspace
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkspace || !name.trim() || !user?.id) return;

    try {
      setError("");
      const updated = await workspaceService.updateWorkspace(selectedWorkspace.id, {
        name: name.trim(),
        description: description.trim(),
        ownerId: user.id,
      });
      setClassified((prev) => ({
        ...prev,
        ownedWorkspaces: prev.ownedWorkspaces.map((w) => (w.id === updated.id ? updated : w)),
      }));
      setShowEditModal(false);
      setSelectedWorkspace(null);
      setName("");
      setDescription("");
    } catch (err: any) {
      console.error("Error updating workspace:", err);
      setError("Không thể cập nhật thông tin Workspace.");
    }
  };

  // Delete Workspace
  const handleDelete = async () => {
    if (!selectedWorkspace) return;

    try {
      setError("");
      await workspaceService.deleteWorkspace(selectedWorkspace.id);
      setClassified((prev) => ({
        ...prev,
        ownedWorkspaces: prev.ownedWorkspaces.filter((w) => w.id !== selectedWorkspace.id),
      }));
      setShowDeleteModal(false);
      setSelectedWorkspace(null);
    } catch (err: any) {
      console.error("Error deleting workspace:", err);
      setError("Không thể xóa Workspace này.");
    }
  };

  // Handle Accept Invitation
  const handleAcceptInvitation = async (wsId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.id) return;
    try {
      await workspaceService.acceptInvitation(wsId, user.id);
      const acceptedWs = classified.pendingWorkspaces.find((w) => w.id === wsId);
      setClassified((prev) => ({
        ...prev,
        pendingWorkspaces: prev.pendingWorkspaces.filter((w) => w.id !== wsId),
        joinedWorkspaces: acceptedWs ? [acceptedWs, ...prev.joinedWorkspaces] : prev.joinedWorkspaces,
      }));
    } catch (err) {
      alert("Không thể chấp nhận lời mời!");
    }
  };

  // Handle Decline Invitation
  const handleDeclineInvitation = async (wsId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.id) return;
    try {
      await workspaceService.declineInvitation(wsId, user.id);
      setClassified((prev) => ({
        ...prev,
        pendingWorkspaces: prev.pendingWorkspaces.filter((w) => w.id !== wsId),
      }));
    } catch (err) {
      alert("Không thể từ chối lời mời!");
    }
  };

  const openEditModal = (w: Workspace, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedWorkspace(w);
    setName(w.name);
    setDescription(w.description || "");
    setShowEditModal(true);
  };

  const openDeleteModal = (w: Workspace, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedWorkspace(w);
    setShowDeleteModal(true);
  };

  const currentWorkspaces =
    activeTab === "owned"
      ? classified.ownedWorkspaces
      : activeTab === "joined"
      ? classified.joinedWorkspaces
      : classified.pendingWorkspaces;

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300 font-sans">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-[#6B7280] font-mono font-bold">
            Quản Lý Hệ Thống
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] mt-1">
            Workspaces
          </h1>
        </div>

        {activeTab === "owned" && (
          <button
            onClick={() => {
              setName("");
              setDescription("");
              setShowCreateModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-[#111827] text-white hover:bg-[#1F2937] font-bold text-sm shadow-md transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Workspace</span>
          </button>
        )}
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-[#E5E7EB] font-mono text-xs font-bold uppercase tracking-wider text-[#6B7280]">
        <button
          onClick={() => setActiveTab("owned")}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 -mb-px transition-all ${
            activeTab === "owned"
              ? "border-[#111827] text-[#111827]"
              : "border-transparent hover:text-[#111827]"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Workspace của tôi ({classified.ownedWorkspaces.length})
        </button>
        <button
          onClick={() => setActiveTab("joined")}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 -mb-px transition-all ${
            activeTab === "joined"
              ? "border-[#111827] text-[#111827]"
              : "border-transparent hover:text-[#111827]"
          }`}
        >
          <Users className="w-4 h-4" />
          Đang tham gia ({classified.joinedWorkspaces.length})
        </button>
        <button
          onClick={() => setActiveTab("pending")}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 -mb-px transition-all relative ${
            activeTab === "pending"
              ? "border-[#111827] text-[#111827]"
              : "border-transparent hover:text-[#111827]"
          }`}
        >
          <Mail className="w-4 h-4" />
          Lời mời tham gia
          {classified.pendingWorkspaces.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white font-mono text-[9px] font-extrabold animate-pulse">
              {classified.pendingWorkspaces.length}
            </span>
          )}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-[#FDEDEC] border border-[#FADBD8] text-[#D93025] p-4 rounded-xl flex items-center gap-2 text-sm font-medium">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#6B7280]">
          <Sparkles className="w-8 h-8 text-[#111827] animate-spin mb-3" />
          <p className="font-mono text-xs uppercase tracking-wider">Đang tải danh sách Workspace...</p>
        </div>
      ) : currentWorkspaces.length === 0 ? (
        <div className="bg-[#F6F5EF] border border-[#E5E7EB] rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4 shadow-2xs">
          <Folder className="w-12 h-12 text-[#6B7280] mx-auto" />
          <h3 className="text-lg font-bold text-[#111827]">
            {activeTab === "owned"
              ? "Bạn chưa có Workspace nào do chính mình tạo"
              : activeTab === "joined"
              ? "Bạn chưa tham gia vào Workspace nào khác"
              : "Không có lời mời tham gia Workspace nào"}
          </h3>
          <p className="text-sm text-[#6B7280]">
            {activeTab === "owned"
              ? "Bắt đầu bằng cách tạo Workspace đầu tiên của bạn để quản lý các Spaces và nhiệm vụ."
              : activeTab === "joined"
              ? "Khi bạn được người khác mời vào Workspace của họ, danh sách sẽ xuất hiện tại đây."
              : "Tất cả lời mời gia nhập Workspace sẽ được hiển thị tại mục này để bạn duyệt."}
          </p>
          {activeTab === "owned" && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 bg-[#111827] text-white font-bold rounded-xl text-sm hover:bg-[#1F2937] transition-colors"
            >
              Tạo Workspace đầu tiên
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentWorkspaces.map((w) => (
            <div
              key={w.id}
              onClick={() => activeTab !== "pending" && router.push(`/workspaces/${w.id}`)}
              className={`bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-2xs transition-all duration-200 group flex flex-col justify-between min-h-[180px] relative ${
                activeTab !== "pending" ? "hover:border-[#111827] cursor-pointer hover:shadow-md" : ""
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#F6F5EF] border border-[#E5E7EB] flex items-center justify-center text-[#111827] group-hover:bg-[#111827] group-hover:text-white transition-colors">
                    <Folder className="w-5 h-5" />
                  </div>

                  {/* Actions buttons for OWNED workspaces */}
                  {activeTab === "owned" && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => openEditModal(w, e)}
                        className="p-1.5 rounded-lg hover:bg-[#F6F5EF] text-[#6B7280] hover:text-[#111827]"
                        title="Chỉnh sửa"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => openDeleteModal(w, e)}
                        className="p-1.5 rounded-lg hover:bg-[#FDEDEC] text-[#6B7280] hover:text-[#D93025]"
                        title="Xóa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Badge for JOINED or PENDING */}
                  {activeTab === "joined" && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#E8F0FE] text-[#1A73E8] border border-[#D2E3FC]">
                      Thành viên
                    </span>
                  )}
                  {activeTab === "pending" && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      Chờ xác nhận
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-bold text-[#111827] group-hover:text-[#137333] transition-colors">
                    {w.name}
                  </h3>
                  <p className="text-xs text-[#6B7280] line-clamp-2 mt-1">
                    {w.description || "Chưa có mô tả."}
                  </p>
                </div>
              </div>

              {/* Card Footer: Accept/Decline for Pending OR Open Link */}
              {activeTab === "pending" ? (
                <div className="pt-4 mt-4 border-t border-[#E5E7EB] flex items-center justify-end gap-2">
                  <button
                    onClick={(e) => handleDeclineInvitation(w.id, e)}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" /> Từ chối
                  </button>
                  <button
                    onClick={(e) => handleAcceptInvitation(w.id, e)}
                    className="px-3 py-1.5 bg-[#137333] hover:bg-[#0f5c28] text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-2xs"
                  >
                    <Check className="w-3.5 h-3.5" /> Chấp nhận
                  </button>
                </div>
              ) : (
                <div className="pt-4 mt-4 border-t border-[#F6F5EF] text-[10px] text-[#9CA3AF] font-mono flex items-center justify-between">
                  <span>Tạo ngày: {new Date(w.createdAt).toLocaleDateString("vi-VN")}</span>
                  <span className="font-bold text-[#6B7280] group-hover:text-[#111827]">Vào Workspace →</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-[#111827]">Tạo Workspace mới</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#111827] font-mono">Tên Workspace</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Dự án tốt nghiệp"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-sm text-[#111827] focus:outline-none focus:border-[#111827] bg-[#F6F5EF]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#111827] font-mono">Mô tả chi tiết</label>
                <textarea
                  placeholder="Ví dụ: KLTN hệ thống tích hợp AI agents"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-sm text-[#111827] focus:outline-none focus:border-[#111827] bg-[#F6F5EF] min-h-[100px]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#E5E7EB] hover:bg-[#F6F5EF] text-sm font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#111827] hover:bg-[#1F2937] text-white text-sm font-bold shadow-md"
                >
                  Tạo mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-[#111827]">Chỉnh sửa Workspace</h3>
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#111827] font-mono">Tên Workspace</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-sm text-[#111827] focus:outline-none focus:border-[#111827] bg-[#F6F5EF]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#111827] font-mono">Mô tả chi tiết</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-sm text-[#111827] focus:outline-none focus:border-[#111827] bg-[#F6F5EF] min-h-[100px]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedWorkspace(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-[#E5E7EB] hover:bg-[#F6F5EF] text-sm font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#111827] hover:bg-[#1F2937] text-white text-sm font-bold shadow-md"
                >
                  Cập nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#FDEDEC] text-[#D93025] flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-[#111827]">Xóa Workspace?</h3>
              <p className="text-sm text-[#6B7280]">
                Bạn có chắc chắn muốn xóa workspace <strong>{selectedWorkspace?.name}</strong>? Hành động này không thể hoàn tác.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedWorkspace(null);
                }}
                className="px-4 py-2 rounded-xl border border-[#E5E7EB] hover:bg-[#F6F5EF] text-sm font-semibold"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl bg-[#D93025] hover:bg-[#C0392B] text-white text-sm font-bold shadow-md"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
