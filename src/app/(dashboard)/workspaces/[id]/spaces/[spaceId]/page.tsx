"use client";
// Space detail page route: /workspaces/[id]/spaces/[spaceId]

import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Sparkles, ShieldAlert } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { workspaceService } from "@/services/workspace.service";
import { userService } from "@/services/user.service";
import { SprintTaskList } from "@/components/workspace/SprintTaskList";
import { SprintKanbanBoard } from "@/components/workspace/SprintKanbanBoard";
import { SpaceHeader, TabType } from "@/components/space/SpaceHeader";
import { SpaceOverviewTab } from "@/components/space/SpaceOverviewTab";
import { SpaceTimelineTab } from "@/components/space/SpaceTimelineTab";
import { SpaceMembersTab } from "@/components/space/SpaceMembersTab";
import { SpaceDiscussionsTab } from "@/components/space/SpaceDiscussionsTab";
import { EditSpaceModal } from "@/components/space/EditSpaceModal";
import { AddSpaceMemberModal } from "@/components/space/AddSpaceMemberModal";
import { SpaceAiCopilotDrawer } from "@/components/workspace/SpaceAiCopilotDrawer";
import { TaskDetailDrawer } from "@/components/workspace/sprint/TaskDetailDrawer";
import { SpaceTrashModal } from "@/components/space/SpaceTrashModal";
import { sprintService } from "@/services/sprint.service";
import { taskService } from "@/services/task.service";
import { Space, Task, Sprint, Workspace, User } from "@/types";
import { roleIdToSpaceRole } from "@/utils/roleAssignment";

export default function SpaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryTaskId = searchParams.get("taskId");
  const { user: currentUser } = useAuthStore();

  const workspaceId = parseInt(params.id as string, 10);
  const spaceId = parseInt(params.spaceId as string, 10);

  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [pageSelectedTask, setPageSelectedTask] = useState<Task | null>(null);
  const [isChildDrawerOpen, setIsChildDrawerOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  // Data States
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [space, setSpace] = useState<Space | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [rawSpaceMembers, setRawSpaceMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [accessDenied, setAccessDenied] = useState(false);

  const isOwner = !!(currentUser?.id && workspace?.ownerId === currentUser.id);
  const mySpaceRole = React.useMemo(() => {
    if (!currentUser?.id) return "MEMBER";
    const isCreator = workspace?.ownerId === currentUser.id;
    const myMember = rawSpaceMembers.find(
      (m: any) => (m.id?.userId || m.userId) === currentUser.id
    );
    return roleIdToSpaceRole(myMember?.roleId, isCreator);
  }, [currentUser?.id, workspace?.ownerId, rawSpaceMembers]);

  const isSpacePM = mySpaceRole === "PM";
  const isSpaceAssistant = mySpaceRole === "ASSISTANT";

  const sprintIds = React.useMemo(() => new Set(sprints.map((s) => s.id)), [sprints]);

  const orderedSpaceTasks = React.useMemo(() => {
    const list: Task[] = [];
    sprints.forEach((sprint) => {
      const sTasks = tasks.filter((t) => t.sprintId === sprint.id && !t.isDeleted);
      list.push(...sTasks);
    });
    const bTasks = tasks.filter(
      (t) => !t.isDeleted && (!t.sprintId || !sprintIds.has(t.sprintId))
    );
    list.push(...bTasks);
    return list;
  }, [sprints, tasks, sprintIds]);

  const taskNumberMap = React.useMemo(() => {
    const map = new Map<number, number>();
    orderedSpaceTasks.forEach((t, idx) => {
      map.set(t.id, idx + 1);
    });
    return map;
  }, [orderedSpaceTasks]);

  // Modal States
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isTrashOpen, setIsTrashOpen] = useState(false);

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
      setRawSpaceMembers(memberList || []);

      // Kiểm tra quyền: nếu thành viên đã bị xóa khỏi Space và không phải Owner của Workspace -> Báo giao diện Không có quyền truy cập
      const isOwnerUser = !!(currentUser?.id && wsData?.ownerId === currentUser.id);
      const isMemberUser = (memberList || []).some(
        (m: any) => (m.id?.userId || m.userId) === currentUser?.id
      );

      if (currentUser?.id && wsData && !isOwnerUser && !isMemberUser) {
        setAccessDenied(true);
        return;
      }
      setAccessDenied(false);

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
      fetchData(true);
    };

    const handleSwitchKanban = () => {
      setActiveTab("kanban");
    };

    const handleToggleCopilot = () => {
      setIsCopilotOpen((prev) => !prev);
    };

    window.addEventListener("space_tasks_updated", handleTasksUpdated);
    window.addEventListener("switch_to_kanban_tab", handleSwitchKanban);
    window.addEventListener("toggle_space_ai_copilot", handleToggleCopilot);
    return () => {
      window.removeEventListener("space_tasks_updated", handleTasksUpdated);
      window.removeEventListener("switch_to_kanban_tab", handleSwitchKanban);
      window.removeEventListener("toggle_space_ai_copilot", handleToggleCopilot);
    };
  }, [workspaceId, spaceId, activeTab]);

  // Tự động mở bảng chi tiết Task khi liên kết từ thông báo có ?taskId=...
  useEffect(() => {
    if (queryTaskId && tasks.length > 0) {
      const targetId = parseInt(queryTaskId, 10);
      const found = tasks.find((t) => t.id === targetId);
      if (found) {
        setPageSelectedTask(found);
        // Xóa query param ?taskId=... khỏi thanh địa chỉ để không bị lưu trạng thái cũ
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href);
          url.searchParams.delete("taskId");
          window.history.replaceState({}, "", url.pathname + (url.search ? url.search : ""));
        }
      }
    }
  }, [queryTaskId, tasks]);

  // Lắng nghe sự kiện mở task trực tiếp từ chuông thông báo (khi đang ở cùng Space)
  useEffect(() => {
    const handleOpenTaskEvent = (e: any) => {
      const { taskId, spaceId: targetSpaceId } = e.detail || {};
      if (targetSpaceId && targetSpaceId !== spaceId) return;
      if (taskId && tasks.length > 0) {
        const found = tasks.find((t) => t.id === Number(taskId));
        if (found) {
          setPageSelectedTask(found);
        }
      }
    };
    window.addEventListener("open_task_detail", handleOpenTaskEvent);
    return () => window.removeEventListener("open_task_detail", handleOpenTaskEvent);
  }, [spaceId, tasks]);

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
    setPageSelectedTask(null);
    setIsChildDrawerOpen(false);
  };

  const isDrawerVisible = Boolean(pageSelectedTask) || isChildDrawerOpen;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[#6B7280]">
        <Sparkles className="w-8 h-8 text-[#111827] animate-spin mb-3" />
        <p className="font-mono text-xs uppercase tracking-wider">Đang tải chi tiết Space...</p>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="py-20 px-4 font-sans flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-white border border-[#E5E7EB] rounded-3xl p-8 max-w-md w-full text-center space-y-5 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200 shadow-2xs">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-extrabold text-[#111827]">
              Không có quyền truy cập Space
            </h3>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              Bạn hiện không còn là thành viên của Space này hoặc đã được Quản trị viên điều chuyển ra khỏi dự án.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => router.replace(`/workspaces/${workspaceId}`)}
              className="w-full py-2.5 px-4 bg-[#111827] hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              Quay về Không gian làm việc (Workspace)
            </button>
          </div>
        </div>
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
    if (pageSelectedTask?.id === task.id) {
      setPageSelectedTask(null);
    } else {
      setPageSelectedTask(task);
    }
  };

  const handleChildDrawerStateChange = (isOpen: boolean) => {
    setIsChildDrawerOpen(isOpen);
    if (isOpen) {
      // Khi component con (Kanban / Backlog) mở drawer của nó, đóng drawer của trang để không bao giờ bị đè!
      setPageSelectedTask(null);
    }
  };

  return (
    <>
      {/* Outer Page Container: Pushed inward (margin-right 540px) when task detail drawer is open so content is never covered! */}
      <div
        className={`space-y-6 animate-in fade-in duration-300 transition-all duration-300 ease-in-out ${
          isDrawerVisible ? "lg:mr-[540px] lg:max-w-[calc(100%-540px)]" : ""
        }`}
      >
        {/* Modular Header */}
        <SpaceHeader
          workspaceId={workspaceId}
          workspaceName={workspace?.name}
          space={space}
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          onOpenSettings={() => setIsEditOpen(true)}
          onOpenCopilot={() => setIsCopilotOpen((prev) => !prev)}
          onOpenAddMember={isSpacePM ? () => setIsAddMemberOpen(true) : undefined}
          onOpenTrash={() => setIsTrashOpen(true)}
          isOwner={isSpacePM}
          isLeadPM={isOwner}
          spaceRole={mySpaceRole}
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
              isPM={isSpacePM}
              isAssistant={isSpaceAssistant}
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
                isPM={isSpacePM}
                isAssistant={isSpaceAssistant}
                currentUserId={currentUser?.id}
                onDrawerStateChange={handleChildDrawerStateChange}
              />
            </div>
          )}

          {/* TAB 3: KANBAN BOARD */}
          {activeTab === "kanban" && (
            <div className="animate-in fade-in duration-200">
              <SprintKanbanBoard
                spaceId={spaceId}
                isPM={isSpacePM}
                isAssistant={isSpaceAssistant}
                currentUserId={currentUser?.id}
                members={members}
                onDrawerStateChange={handleChildDrawerStateChange}
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
                isPM={isSpacePM}
                workspaceOwnerId={workspace?.ownerId}
                currentUserId={currentUser?.id}
                onOpenAddMember={() => setIsAddMemberOpen(true)}
                onSelectTask={handleSelectTaskToggle}
                onRoleUpdated={() => fetchData(true)}
              />
            </div>
          )}

          {/* TAB 6: DISCUSSIONS & ACTIVITY LOGS */}
          {activeTab === "discussions" && (
            <div className="animate-in fade-in duration-200">
              <SpaceDiscussionsTab
                spaceId={spaceId}
                tasks={tasks}
                sprints={sprints}
                members={members}
                currentUserId={currentUser?.id}
                onSelectTask={handleSelectTaskToggle}
              />
            </div>
          )}
        </div>
      </div>

      {/* AI Co-Pilot Drawer for Space (Available for ALL roles: PM, ASSISTANT, and MEMBER) */}
      {space && (
        <SpaceAiCopilotDrawer
          isOpen={true}
          isMinimized={!isCopilotOpen}
          onToggleMinimize={(minimized) => setIsCopilotOpen(!minimized)}
          onClose={() => setIsCopilotOpen(false)}
          space={space}
          workspaceId={workspaceId}
          existingTasks={tasks}
          spaceRole={mySpaceRole}
          currentUser={currentUser}
          members={members}
          isTaskDrawerOpen={isDrawerVisible}
        />
      )}

      {/* Add Space Member Modal */}
      {isSpacePM && (
        <AddSpaceMemberModal
          isOpen={isAddMemberOpen}
          workspaceId={workspaceId}
          spaceId={spaceId}
          onClose={() => setIsAddMemberOpen(false)}
          onMemberAdded={fetchData}
        />
      )}

      {/* Task Detail Drawer when selecting task from Timeline / Mindmap / Overview / Notifications */}
      {pageSelectedTask && (
        <TaskDetailDrawer
          task={pageSelectedTask}
          taskNumber={pageSelectedTask ? taskNumberMap.get(pageSelectedTask.id) : undefined}
          isPM={isSpacePM}
          isAssistant={isSpaceAssistant}
          currentUserId={currentUser?.id}
          members={members}
          isClosedSprint={Boolean(
            pageSelectedTask?.sprintId &&
            sprints.find((s) => s.id === pageSelectedTask.sprintId)?.status === "CLOSED"
          )}
          isActiveSprint={Boolean(
            pageSelectedTask?.sprintId &&
            sprints.find((s) => s.id === pageSelectedTask.sprintId)?.status === "ACTIVE"
          )}
          onClose={() => {
            setPageSelectedTask(null);
          }}
          onUpdate={async (tId, data) => {
            const current = tasks.find((t) => t.id === tId) || pageSelectedTask;
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
            setPageSelectedTask(updated);
            setTasks((prev) => prev.map((t) => (t.id === tId ? updated : t)));
            await fetchData(true); // Silent re-render without remounting page!
            window.dispatchEvent(new CustomEvent("space_tasks_updated"));
          }}
          onDelete={async (tId) => {
            await taskService.deleteTask(tId);
            setPageSelectedTask(null);
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
        isOwner={isSpacePM}
        onClose={() => setIsEditOpen(false)}
        onUpdate={handleUpdateSpace}
        onDelete={handleDeleteSpace}
      />

      {/* Trash Modal (Soft-deleted tasks with restore option) */}
      <SpaceTrashModal
        isOpen={isTrashOpen}
        spaceId={spaceId}
        sprints={sprints}
        onClose={() => setIsTrashOpen(false)}
        onTasksRestored={() => {
          fetchData(true);
          window.dispatchEvent(new CustomEvent("space_tasks_updated"));
        }}
      />
    </>
  );
}
