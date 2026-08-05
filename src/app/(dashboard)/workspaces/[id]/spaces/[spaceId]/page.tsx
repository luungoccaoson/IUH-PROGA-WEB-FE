"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { workspaceService } from "@/services/workspace.service";
import { SprintTaskList } from "@/components/workspace/SprintTaskList";
import { SprintKanbanBoard } from "@/components/workspace/SprintKanbanBoard";
import { SpaceHeader, TabType } from "@/components/space/SpaceHeader";
import { SpaceOverviewTab } from "@/components/space/SpaceOverviewTab";
import { EditSpaceModal } from "@/components/space/EditSpaceModal";
import { Space, Task, Workspace } from "@/types";

export default function SpaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuthStore();

  const workspaceId = parseInt(params.id as string, 10);
  const spaceId = parseInt(params.spaceId as string, 10);

  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Data States
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [space, setSpace] = useState<Space | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isOwner = !!(currentUser?.id && workspace?.ownerId === currentUser.id);

  // Edit Space Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Fetch all details
  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const wsData = await workspaceService.getWorkspaceById(workspaceId);
      setWorkspace(wsData);

      const spacesList = await workspaceService.getSpacesByWorkspace(workspaceId);
      const activeSpace = spacesList.find((s) => s.id === spaceId);

      if (!activeSpace) {
        setError("Không tìm thấy thông tin Space.");
        return;
      }
      setSpace(activeSpace);

      // Load tasks
      const taskList = await workspaceService.getTasksBySpace(spaceId);
      setTasks(taskList);
    } catch (err: any) {
      console.error("Error loading space page details:", err);
      setError("Không thể tải thông tin Space. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceId && spaceId) {
      fetchData();
    }
  }, [workspaceId, spaceId]);

  // Handle Edit Space
  const handleUpdateSpace = async (data: { name: string; startDate?: string; endDate?: string }) => {
    const updated = await workspaceService.updateSpace(spaceId, {
      workspaceId,
      name: data.name,
      startDate: data.startDate ? `${data.startDate}T00:00:00` : undefined,
      endDate: data.endDate ? `${data.endDate}T23:59:59` : undefined,
    });
    setSpace(updated);
    window.location.reload();
  };

  // Handle Delete Space
  const handleDeleteSpace = async () => {
    await workspaceService.deleteSpace(spaceId);
    router.push(`/workspaces/${workspaceId}`);
    setTimeout(() => {
      window.location.reload();
    }, 400);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[#6B7280]">
        <Sparkles className="w-8 h-8 text-[#111827] animate-spin mb-3" />
        <p className="font-mono text-xs uppercase tracking-wider">Đang tải chi tiết Space...</p>
      </div>
    );
  }

  if (error || !space) {
    return (
      <div className="bg-[#FDEDEC] border border-[#FADBD8] text-[#D93025] p-6 rounded-2xl max-w-xl mx-auto text-center space-y-4 font-sans">
        <p className="font-bold">{error || "Không tìm thấy Space."}</p>
        <button
          onClick={() => router.push(`/workspaces/${workspaceId}`)}
          className="px-4 py-2 bg-[#111827] text-white rounded-xl text-sm font-bold"
        >
          Quay lại workspace
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Outer Page Container: Pushes left when task detail drawer is open! */}
      <div
        className={`max-w-6xl space-y-6 animate-in fade-in duration-300 transition-all duration-300 ease-in-out ${
          isDrawerOpen ? "mr-0 lg:mr-[360px]" : "mr-0"
        }`}
      >
        {/* Modular Header */}
        <SpaceHeader
          workspaceId={workspaceId}
          workspaceName={workspace?.name}
          space={space}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenSettings={() => setIsEditOpen(true)}
          isOwner={isOwner}
        />

        {/* Tab Contents */}
        <div className="pt-2">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <SpaceOverviewTab
              tasks={tasks}
              onViewTasks={() => setActiveTab("tasks")}
            />
          )}

          {/* TAB 2: TASKS LIST TABLE (SPRINTS & BACKLOG) */}
          {activeTab === "tasks" && (
            <div className="animate-in fade-in duration-200">
              <SprintTaskList
                spaceId={spaceId}
                onDrawerStateChange={setIsDrawerOpen}
              />
            </div>
          )}

          {/* TAB 3: KANBAN BOARD */}
          {activeTab === "kanban" && (
            <div className="animate-in fade-in duration-200">
              <SprintKanbanBoard
                spaceId={spaceId}
                onDrawerStateChange={setIsDrawerOpen}
              />
            </div>
          )}
        </div>
      </div>

      {/* Settings Modal (Edit/Delete Space) */}
      <EditSpaceModal
        isOpen={isEditOpen}
        space={space}
        isOwner={isOwner}
        onClose={() => setIsEditOpen(false)}
        onUpdate={handleUpdateSpace}
        onDelete={handleDeleteSpace}
      />
    </>
  );
}
