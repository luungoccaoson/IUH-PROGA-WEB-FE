"use client";
// Space detail page route: /workspaces/[id]/spaces/[spaceId]

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { workspaceService } from "@/services/workspace.service";
import { userService } from "@/services/user.service";
import { SprintTaskList } from "@/components/workspace/SprintTaskList";
import { SprintKanbanBoard } from "@/components/workspace/SprintKanbanBoard";
import { SpaceHeader, TabType } from "@/components/space/SpaceHeader";
import { SpaceOverviewTab } from "@/components/space/SpaceOverviewTab";
import { SpaceTimelineTab } from "@/components/space/SpaceTimelineTab";
import { SpaceMembersTab } from "@/components/space/SpaceMembersTab";
import { EditSpaceModal } from "@/components/space/EditSpaceModal";
import { AddSpaceMemberModal } from "@/components/space/AddSpaceMemberModal";
import { SpaceAiCopilotDrawer } from "@/components/workspace/SpaceAiCopilotDrawer";
import { TaskDetailDrawer } from "@/components/workspace/sprint/TaskDetailDrawer";
import { sprintService } from "@/services/sprint.service";
import { taskService } from "@/services/task.service";
import { Space, Task, Sprint, Workspace, User } from "@/types";

export default function SpaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuthStore();

  const workspaceId = parseInt(params.id as string, 10);
  const spaceId = parseInt(params.spaceId as string, 10);

  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  // Data States
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [space, setSpace] = useState<Space | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isOwner = !!(currentUser?.id && workspace?.ownerId === currentUser.id);

  // Modal States
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

  // Fetch all details (supports silent background sync without remounting page)
  const fetchData = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      setError("");

      const spaceData = await workspaceService.getSpaceById(spaceId).catch(async () => {
        const spacesList = await workspaceService.getSpacesByWorkspace(workspaceId, currentUser?.id);
        return spacesList.find((s) => s.id === spaceId) || null;
      });

      if (!spaceData) {
        if (!isSilent) setError("Không tìm thấy thông tin Space.");
        return;
      }
      setSpace(spaceData);

      const targetWorkspaceId = spaceData.workspaceId || workspaceId;

      const [wsData, taskList, sprintList, memberList] = await Promise.all([
        workspaceService.getWorkspaceById(targetWorkspaceId).catch(() => null),
        workspaceService.getTasksBySpace(spaceId).catch(() => []),
        sprintService.getSprintsBySpace(spaceId).catch(() => []),
        workspaceService.getSpaceMembers(spaceId).catch(() => []),
      ]);

      if (wsData) {
        setWorkspace(wsData);
      }
      setTasks(taskList || []);
      setSprints(sprintList || []);

      // Extract unique user IDs and fetch full user profile details
      const userIds: number[] = Array.from(
        new Set((memberList || []).map((m: any) => m.id?.userId || m.userId).filter(Boolean))
      );

      const userProfiles = await Promise.all(
        userIds.map((id) => userService.getUserById(id).catch(() => null))
      );

      const validMembers = userProfiles.filter((u): u is User => u !== null);
      setMembers(validMembers);
    } catch (err: any) {
      console.error("Error loading space page details:", err);
      if (!isSilent) setError("Không thể tải thông tin Space. Vui lòng thử lại.");
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceId && spaceId) {
      fetchData();
    }

    const handleTasksUpdated = () => {
      fetchData();
    };

    const handleSwitchKanban = () => {
      setActiveTab("kanban");
    };

    window.addEventListener("space_tasks_updated", handleTasksUpdated);
    window.addEventListener("switch_to_kanban_tab", handleSwitchKanban);
    return () => {
      window.removeEventListener("space_tasks_updated", handleTasksUpdated);
      window.removeEventListener("switch_to_kanban_tab", handleSwitchKanban);
    };
  }, [workspaceId, spaceId, activeTab]);

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

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSelectedTask(null);
    setIsDrawerOpen(false);
  };

  const isDrawerVisible = isDrawerOpen || Boolean(selectedTask);

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

  const handleSelectTaskToggle = (task: Task) => {
    if (isDrawerOpen && selectedTask?.id === task.id) {
      setIsDrawerOpen(false);
      setSelectedTask(null);
    } else {
      setSelectedTask(task);
      setIsDrawerOpen(true);
    }
  };

  return (
    <>
      {/* Outer Page Container: Pushed inward (margin-right 410px) when task detail drawer is open so content is never covered! */}
      <div
        className={`space-y-6 animate-in fade-in duration-300 transition-all duration-300 ease-in-out ${
          isDrawerVisible ? "mr-[410px]" : ""
        }`}
        style={{
          width: isDrawerVisible ? "calc(100% - 410px)" : "100%",
          transition: "all 0.3s ease-in-out",
        }}
      >
        {/* Modular Header */}
        <SpaceHeader
          workspaceId={workspaceId}
          workspaceName={workspace?.name}
          space={space}
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          onOpenSettings={() => setIsEditOpen(true)}
          onOpenCopilot={() => setIsCopilotOpen(true)}
          onOpenAddMember={() => setIsAddMemberOpen(true)}
          isOwner={isOwner}
        />

        {/* Tab Contents */}
        <div className="pt-2">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <SpaceOverviewTab
              space={space}
              tasks={tasks}
              sprints={sprints}
              members={members}
              currentUser={currentUser}
              onViewTasks={() => setActiveTab("tasks")}
              onSelectTask={handleSelectTaskToggle}
            />
          )}

          {/* TAB 2: TASKS LIST TABLE (SPRINTS & BACKLOG) */}
          {activeTab === "tasks" && (
            <div className="animate-in fade-in duration-200">
              <SprintTaskList
                spaceId={spaceId}
                members={members}
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

          {/* TAB 4: TIMELINE ROADMAP GANTT */}
          {activeTab === "timeline" && (
            <div className="animate-in fade-in duration-200">
              <SpaceTimelineTab
                sprints={sprints}
                tasks={tasks}
                members={members}
                spaceName={space?.name}
                onSelectTask={handleSelectTaskToggle}
              />
            </div>
          )}

          {/* TAB 5: SPACE MEMBERS TAB */}
          {activeTab === "members" && (
            <div className="animate-in fade-in duration-200">
              <SpaceMembersTab
                workspaceId={workspaceId}
                spaceId={spaceId}
                tasks={tasks}
                onOpenAddMember={() => setIsAddMemberOpen(true)}
                onSelectTask={handleSelectTaskToggle}
              />
            </div>
          )}
        </div>
      </div>

      {/* AI Co-Pilot Drawer for Space */}
      <SpaceAiCopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        space={space}
        workspaceId={workspaceId}
        existingTasks={tasks}
      />

      {/* Add Space Member Modal */}
      <AddSpaceMemberModal
        isOpen={isAddMemberOpen}
        workspaceId={workspaceId}
        spaceId={spaceId}
        onClose={() => setIsAddMemberOpen(false)}
        onMemberAdded={fetchData}
      />

      {/* Task Detail Drawer when selecting task from Timeline / Mindmap / Overview */}
      {selectedTask && isDrawerOpen && (
        <TaskDetailDrawer
          task={selectedTask}
          members={members}
          onClose={() => {
            setSelectedTask(null);
            setIsDrawerOpen(false);
          }}
          onUpdate={async (tId, data) => {
            const current = tasks.find((t) => t.id === tId) || selectedTask;
            const formatIso = (dateStr?: string, isEnd = false) => {
              if (!dateStr) return undefined;
              if (dateStr.includes("T")) return dateStr;
              return isEnd ? `${dateStr}T23:59:59` : `${dateStr}T00:00:00`;
            };

            const payload = {
              spaceId: current?.spaceId || spaceId,
              sprintId: (data as any).sprintId !== undefined ? (data as any).sprintId : (current?.sprintId ?? null),
              title: data.title || current?.title || "",
              description: data.description !== undefined ? data.description : (current?.description ?? ""),
              status: data.status || current?.status,
              priority: data.priority || current?.priority,
              ownerId: data.ownerId !== undefined ? data.ownerId : (current?.ownerId ?? undefined),
              startDate: formatIso(data.startDate !== undefined ? data.startDate : current?.startDate, false),
              dueDate: formatIso(data.dueDate !== undefined ? data.dueDate : current?.dueDate, true),
            };

            const updated = await taskService.updateTask(tId, payload);
            setSelectedTask(updated);
            setTasks((prev) => prev.map((t) => (t.id === tId ? updated : t)));
            await fetchData(true); // Silent re-render without remounting page!
            window.dispatchEvent(new CustomEvent("space_tasks_updated"));
          }}
          onDelete={async (tId) => {
            await taskService.deleteTask(tId);
            setSelectedTask(null);
            setIsDrawerOpen(false);
            setTasks((prev) => prev.filter((t) => t.id !== tId));
            await fetchData(true); // Silent re-render without remounting page!
            window.dispatchEvent(new CustomEvent("space_tasks_updated"));
          }}
        />
      )}

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
