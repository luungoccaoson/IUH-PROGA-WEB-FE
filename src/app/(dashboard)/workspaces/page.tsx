"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, MoreVertical, Edit2, Trash2, Folder, Sparkles, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { workspaceService } from "@/services/workspace.service";
import { Workspace } from "@/types";

export default function WorkspacesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
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

  // Fetch workspaces
  const fetchWorkspaces = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      setError("");
      const list = await workspaceService.getWorkspacesByOwner(user.id);
      setWorkspaces(list);
    } catch (err: any) {
      console.error("Error loading workspaces:", err);
      setError("Không thể tải danh sách Workspace. Vui lòng thử lại.");
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
      setWorkspaces([newWs, ...workspaces]);
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
      setWorkspaces(workspaces.map((w) => (w.id === updated.id ? updated : w)));
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
      setWorkspaces(workspaces.filter((w) => w.id !== selectedWorkspace.id));
      setShowDeleteModal(false);
      setSelectedWorkspace(null);
    } catch (err: any) {
      console.error("Error deleting workspace:", err);
      setError("Không thể xóa Workspace này.");
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

  return (
    <div className="max-w-6xl space-y-8 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-[#6B7280] font-mono font-bold">
            Quản Lý Hệ Thống
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] font-sans mt-1">
            Workspaces
          </h1>
        </div>

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
      ) : workspaces.length === 0 ? (
        <div className="bg-[#F6F5EF] border border-[#E5E7EB] rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4 shadow-sm">
          <Folder className="w-12 h-12 text-[#6B7280] mx-auto" />
          <h3 className="text-lg font-bold text-[#111827]">Không có Workspace nào</h3>
          <p className="text-sm text-[#6B7280]">
            Bắt đầu bằng cách tạo Workspace đầu tiên của bạn để quản lý các Spaces và các nhiệm vụ tích hợp AI Agents.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 bg-[#111827] text-white font-bold rounded-xl text-sm hover:bg-[#1F2937] transition-colors"
          >
            Tạo Workspace đầu tiên
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaces.map((w) => (
            <div
              key={w.id}
              onClick={() => router.push(`/workspaces/${w.id}`)}
              className="bg-white p-6 rounded-2xl border border-[#E5E7EB] hover:border-[#111827] cursor-pointer shadow-sm hover:shadow-md transition-all duration-200 group flex flex-col justify-between min-h-[180px] relative"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#F6F5EF] border border-[#E5E7EB] flex items-center justify-center text-[#111827] group-hover:bg-[#111827] group-hover:text-white transition-colors">
                    <Folder className="w-5 h-5" />
                  </div>

                  {/* Actions buttons */}
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

              <div className="pt-4 mt-4 border-t border-[#F6F5EF] text-[10px] text-[#9CA3AF] font-mono flex items-center justify-between">
                <span>Created: {new Date(w.createdAt).toLocaleDateString("vi-VN")}</span>
                <span className="font-bold text-[#6B7280] group-hover:text-[#111827]">Vào Workspace →</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
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
