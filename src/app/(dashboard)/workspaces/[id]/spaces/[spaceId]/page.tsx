"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Calendar, CheckCircle2, Clock, Plus, Trash2, Settings, 
  Sparkles, History, ListTodo, KanbanSquare, FileText, ChevronRight, User, AlertCircle
} from "lucide-react";
import { workspaceService } from "@/services/workspace.service";
import { SprintTaskList } from "@/components/workspace/SprintTaskList";
import { Space, Task, TaskStatus, Workspace } from "@/types";

type TabType = "overview" | "tasks" | "kanban";

export default function SpaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  
  const workspaceId = parseInt(params.id as string, 10);
  const spaceId = parseInt(params.spaceId as string, 10);

  const [activeTab, setActiveTab] = useState<TabType>("overview");
  
  // Data States
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [space, setSpace] = useState<Space | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit Space Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  // Sprints (Projects have Sprints)
  const [sprints, setSprints] = useState([
    { id: 1, name: "Sprint 1 - Thiết kế UI & API", startDate: "2026-07-01", endDate: "2026-07-15", status: "COMPLETED" },
    { id: 2, name: "Sprint 2 - Kanban Board & Logic", startDate: "2026-07-16", endDate: "2026-07-31", status: "ACTIVE" },
    { id: 3, name: "Sprint 3 - Phân Tích Báo Cáo AI", startDate: "2026-08-01", endDate: "2026-08-15", status: "FUTURE" },
  ]);
  const [selectedSprintId, setSelectedSprintId] = useState<number | "all">(2);

  // Create sprint modal state
  const [isCreateSprintOpen, setIsCreateSprintOpen] = useState(false);
  const [newSprintName, setNewSprintName] = useState("");
  const [newSprintStart, setNewSprintStart] = useState("");
  const [newSprintEnd, setNewSprintEnd] = useState("");

  // Fetch all details
  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      
      const wsData = await workspaceService.getWorkspaceById(workspaceId);
      setWorkspace(wsData);

      const spacesList = await workspaceService.getSpacesByWorkspace(workspaceId);
      const activeSpace = spacesList.find(s => s.id === spaceId);
      
      if (!activeSpace) {
        setError("Không tìm thấy thông tin Space.");
        return;
      }
      setSpace(activeSpace);
      setEditName(activeSpace.name);
      setEditStartDate(activeSpace.startDate ? activeSpace.startDate.substring(0, 10) : "");
      setEditEndDate(activeSpace.endDate ? activeSpace.endDate.substring(0, 10) : "");

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
  const handleEditSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;

    try {
      setEditLoading(true);
      setEditError("");
      const updated = await workspaceService.updateSpace(spaceId, {
        workspaceId,
        name: editName.trim(),
        startDate: editStartDate ? `${editStartDate}T00:00:00` : undefined,
        endDate: editEndDate ? `${editEndDate}T23:59:59` : undefined,
      });
      setSpace(updated);
      setIsEditOpen(false);
      
      // Force reload sidebar since space name changed
      window.location.reload();
    } catch (err: any) {
      console.error("Error updating space:", err);
      setEditError(err.response?.data?.message || "Không thể cập nhật Space.");
    } finally {
      setEditLoading(false);
    }
  };

  // Handle Delete Space
  const handleDeleteSpace = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa Space này không? Tất cả các task thuộc về Space này cũng sẽ bị ảnh hưởng.")) {
      return;
    }

    try {
      setEditLoading(true);
      setEditError("");
      await workspaceService.deleteSpace(spaceId);
      setIsEditOpen(false);
      
      // Navigate back to workspace dashboard
      router.push(`/workspaces/${workspaceId}`);
      
      // Wait a brief moment then reload to sync sidebar
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (err: any) {
      console.error("Error deleting space:", err);
      setEditError(err.response?.data?.message || "Không thể xóa Space.");
    } finally {
      setEditLoading(false);
    }
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
      <div className="bg-[#FDEDEC] border border-[#FADBD8] text-[#D93025] p-6 rounded-2xl max-w-xl mx-auto text-center space-y-4">
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

  // Helper static task list for mock representation if no real tasks
  const mockTasks: Task[] = [
    { id: 1, spaceId, title: "Thiết kế sơ đồ ERD & PostgreSQL Schema", status: "DONE", priority: "HIGH", ownerName: "Son Luu", dueDate: "2026-07-05", createdAt: "2026-07-01" },
    { id: 2, spaceId, title: "Xây dựng Auth-Service & Cấu hình Security JWT", status: "IN_PROGRESS", priority: "URGENT", ownerName: "Duy Dev", dueDate: "2026-07-12", createdAt: "2026-07-06" },
    { id: 3, spaceId, title: "Xây dựng Giao diện Kanban Board kéo thả", status: "TODO", priority: "MEDIUM", ownerName: "Duy Dev", dueDate: "2026-07-22", createdAt: "2026-07-16" },
    { id: 4, spaceId, title: "Tích hợp Requirement Agent tự động phân rã Task", status: "TODO", priority: "HIGH", ownerName: "Hoa Tester", dueDate: "2026-07-30", createdAt: "2026-07-23" },
  ];

  const tasksToDisplay = tasks.length ? tasks : mockTasks;

  // Filter tasks based on selected sprint
  const filteredTasks = (() => {
    if (selectedSprintId === "all") return tasksToDisplay;
    if (selectedSprintId === 1) {
      return tasksToDisplay.filter(t => t.status === "DONE" || t.priority === "HIGH" || t.title.includes("ERD"));
    }
    if (selectedSprintId === 2) {
      return tasksToDisplay.filter(t => t.status !== "DONE" && !t.title.includes("ERD"));
    }
    return [];
  })();

  // Visual Helper: Segments for SVG Donut
  const todoCount = filteredTasks.filter(t => t.status === "TODO").length;
  const inProgressCount = filteredTasks.filter(t => t.status === "IN_PROGRESS").length;
  const reviewCount = filteredTasks.filter(t => t.status === "REVIEW").length;
  const doneCount = filteredTasks.filter(t => t.status === "DONE").length;
  const totalCount = filteredTasks.length;

  // SVG calculations for a simple 3-segment donut representation
  const finalTodo = todoCount;
  const finalInProgress = inProgressCount;
  const finalReview = reviewCount;
  const finalDone = doneCount;
  const finalTotal = totalCount || 1;

  const todoPercent = (finalTodo / finalTotal) * 100;
  const inProgressPercent = (finalInProgress / finalTotal) * 100;
  const donePercent = (finalDone / finalTotal) * 100;
  const reviewPercent = (finalReview / finalTotal) * 100;

  // Mock Activity log data
  const mockActivities = [
    { id: 1, user: "Son Luu", action: "đã cập nhật trường", target: "status", on: "PROGA-31: Sửa đổi kiểu dữ liệu Entity", val: "IN PROGRESS", time: "36 phút trước", type: "UPDATE" },
    { id: 2, user: "Son Luu", action: "đã tạo mới task", target: "PROGA-32: Tích hợp API Gateway", on: "Sprint 2", val: "TODO", time: "1 giờ trước", type: "CREATE" },
    { id: 3, user: "Duy Dev", action: "đã chuyển trạng thái", target: "status", on: "PROGA-25: Thiết kế sơ đồ quan hệ DB", val: "DONE", time: "3 giờ trước", type: "STATUS" },
  ];

  return (
    <div className="max-w-6xl space-y-6 animate-in fade-in duration-300">
      {/* Path Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-xs text-[#6B7280] font-mono">
        <span className="hover:underline cursor-pointer" onClick={() => router.push("/workspaces")}>workspaces</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="hover:underline cursor-pointer" onClick={() => router.push(`/workspaces/${workspaceId}`)}>{workspace?.name || "Workspace"}</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-[#111827] font-bold">Space: {space.name}</span>
      </div>

      {/* Title Header bar */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E6F4EA] flex items-center justify-center text-[#137333] font-mono font-bold text-xs border border-[#D1E7DD]">
              {space.name.substring(0, 2).toUpperCase()}
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#111827] font-sans">
              {space.name}
            </h1>
          </div>
          {space.startDate && (
            <p className="text-xs text-[#6B7280] flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Thời gian: {new Date(space.startDate).toLocaleDateString("vi-VN")} - {space.endDate ? new Date(space.endDate).toLocaleDateString("vi-VN") : "Không xác định"}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Sprint Selector */}
          <div className="flex items-center gap-2 bg-[#F6F5EF] border border-[#E5E7EB] rounded-xl px-3 py-2 shadow-sm font-sans">
            <span className="text-xs font-mono font-bold text-[#6B7280] uppercase">Sprint:</span>
            <select
              value={selectedSprintId}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedSprintId(val === "all" ? "all" : parseInt(val, 10));
              }}
              className="bg-transparent text-xs font-bold text-[#111827] focus:outline-none border-none cursor-pointer"
            >
              <option value="all">Tất cả Sprints</option>
              {sprints.map(sprint => (
                <option key={sprint.id} value={sprint.id}>
                  {sprint.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsEditOpen(true)}
            className="flex items-center gap-2 px-3 py-2 border border-[#E5E7EB] bg-[#F6F5EF] hover:bg-white text-[#4B5563] hover:text-[#111827] rounded-xl text-xs font-mono font-bold transition-all shadow-sm"
          >
            <Settings className="w-4 h-4" />
            CÀI ĐẶT SPACE
          </button>
        </div>
      </div>

      {/* Horizontal Tabs */}
      <div className="flex items-center gap-1 border-b border-[#E5E7EB] font-mono text-xs font-bold uppercase tracking-wider text-[#6B7280]">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 -mb-px transition-all ${
            activeTab === "overview"
              ? "border-[#111827] text-[#111827]"
              : "border-transparent hover:text-[#111827]"
          }`}
        >
          <History className="w-4 h-4" />
          Tổng quan
        </button>
        <button
          onClick={() => setActiveTab("tasks")}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 -mb-px transition-all ${
            activeTab === "tasks"
              ? "border-[#111827] text-[#111827]"
              : "border-transparent hover:text-[#111827]"
          }`}
        >
          <ListTodo className="w-4 h-4" />
          Danh sách task
        </button>
        <button
          onClick={() => setActiveTab("kanban")}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 -mb-px transition-all ${
            activeTab === "kanban"
              ? "border-[#111827] text-[#111827]"
              : "border-transparent hover:text-[#111827]"
          }`}
        >
          <KanbanSquare className="w-4 h-4" />
          Bảng kanban
        </button>
      </div>

      {/* Tab Contents */}
      <div className="pt-2">
        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* 4 Metrics cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-[#F6F5EF] p-5 rounded-2xl border border-[#E5E7EB] space-y-2 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#6B7280]">
                    ĐÃ HOÀN THÀNH
                  </p>
                  <p className="text-3xl font-extrabold text-[#111827] font-sans">
                    {finalDone}
                  </p>
                  <p className="text-[10px] text-[#6B7280]">Trong 7 ngày qua</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center border border-[#E5E7EB] text-[#137333]">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-[#F6F5EF] p-5 rounded-2xl border border-[#E5E7EB] space-y-2 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#6B7280]">
                    ĐÃ CẬP NHẬT
                  </p>
                  <p className="text-3xl font-extrabold text-[#111827] font-sans">
                    28
                  </p>
                  <p className="text-[10px] text-[#6B7280]">Trong 7 ngày qua</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center border border-[#E5E7EB] text-[#1A73E8]">
                  <History className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-[#F6F5EF] p-5 rounded-2xl border border-[#E5E7EB] space-y-2 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#6B7280]">
                    ĐÃ TẠO MỚI
                  </p>
                  <p className="text-3xl font-extrabold text-[#111827] font-sans">
                    20
                  </p>
                  <p className="text-[10px] text-[#6B7280]">Trong 7 ngày qua</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center border border-[#E5E7EB] text-[#B06000]">
                  <Plus className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-[#F6F5EF] p-5 rounded-2xl border border-[#E5E7EB] space-y-2 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#6B7280]">
                    SẮP HẾT HẠN
                  </p>
                  <p className="text-3xl font-extrabold text-[#D93025] font-sans">
                    0
                  </p>
                  <p className="text-[10px] text-[#6B7280]">Trong 7 ngày tới</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center border border-[#E5E7EB] text-[#D93025]">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Split layout: Donut Chart & Recent Activities */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Status Overview donut representation */}
              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider font-mono">
                    Tổng quan trạng thái
                  </h3>
                  <button className="text-xs font-mono text-[#1A73E8] hover:underline font-bold">
                    Xem tất cả công việc
                  </button>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-around gap-6 py-4">
                  {/* Clean SVG Donut Chart */}
                  <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                      {/* Grey background circle */}
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#E5E7EB" strokeWidth="4" />
                      
                      {/* Done segment (Purple - matching design #a855f7) */}
                      <circle 
                        cx="18" cy="18" r="15.915" fill="none" stroke="#A855F7" strokeWidth="4" 
                        strokeDasharray={`${donePercent} ${100 - donePercent}`} 
                        strokeDashoffset="0"
                      />
                      
                      {/* In Progress segment (Blue - #1a73e8) */}
                      <circle 
                        cx="18" cy="18" r="15.915" fill="none" stroke="#1A73E8" strokeWidth="4" 
                        strokeDasharray={`${inProgressPercent} ${100 - inProgressPercent}`} 
                        strokeDashoffset={-donePercent}
                      />
                      
                      {/* To Do segment (Green - #137333) */}
                      <circle 
                        cx="18" cy="18" r="15.915" fill="none" stroke="#137333" strokeWidth="4" 
                        strokeDasharray={`${todoPercent} ${100 - todoPercent}`} 
                        strokeDashoffset={-(donePercent + inProgressPercent)}
                      />
                    </svg>
                    <div className="absolute text-center">
                      <p className="text-3xl font-extrabold text-[#111827] font-sans leading-none">{finalTotal}</p>
                      <p className="text-[10px] text-[#6B7280] font-mono uppercase tracking-wider font-bold mt-1">Tổng cộng</p>
                    </div>
                  </div>

                  {/* Status labels listing */}
                  <div className="space-y-3 font-sans w-full max-w-[200px]">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-xs font-semibold text-[#4B5563]">
                        <span className="w-3 h-3 rounded-full bg-[#A855F7]" />
                        Đã xong (Done)
                      </span>
                      <span className="text-xs font-bold text-[#111827]">{finalDone}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-xs font-semibold text-[#4B5563]">
                        <span className="w-3 h-3 rounded-full bg-[#1A73E8]" />
                        Đang làm (In Progress)
                      </span>
                      <span className="text-xs font-bold text-[#111827]">{finalInProgress}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-xs font-semibold text-[#4B5563]">
                        <span className="w-3 h-3 rounded-full bg-[#137333]" />
                        Cần làm (To Do)
                      </span>
                      <span className="text-xs font-bold text-[#111827]">{finalTodo}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activities list */}
              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider font-mono">
                    Hoạt động gần đây
                  </h3>
                  <p className="text-xs text-[#6B7280]">Luôn cập nhật những sự kiện đang diễn ra trong space.</p>
                </div>

                <div className="divide-y divide-[#E5E7EB]/60 font-sans">
                  {mockActivities.map((act) => (
                    <div key={act.id} className="py-3.5 first:pt-0 last:pb-0 flex gap-3 text-xs align-top">
                      <div className="w-7 h-7 rounded-full bg-[#E5E7EB] text-[#111827] font-bold font-mono flex items-center justify-center shrink-0">
                        {act.user.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <p className="text-[#4B5563] leading-relaxed">
                          <span className="font-bold text-[#111827]">{act.user}</span> {act.action}{" "}
                          <span className="px-1.5 py-0.5 rounded bg-gray-100 font-mono font-bold text-[10px] text-[#111827]">
                            {act.target}
                          </span>{" "}
                          trên <span className="font-bold text-[#111827]">{act.on}</span>
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-[#6B7280]">
                          <span className="px-2 py-0.5 rounded bg-[#E8F0FE] text-[#1A73E8] font-bold font-mono uppercase tracking-wider scale-90 origin-left">
                            {act.val}
                          </span>
                          <span>•</span>
                          <span>{act.time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        {/* TAB 2: TASKS LIST TABLE (SPRINTS & BACKLOG) */}
        {activeTab === "tasks" && (
          <div className="animate-in fade-in duration-200">
            <SprintTaskList spaceId={spaceId} />
          </div>
        )}

        {/* TAB 3: KANBAN BOARD */}
        {activeTab === "kanban" && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-in fade-in duration-200">
            {/* Columns */}
            {(["TODO", "IN_PROGRESS", "REVIEW", "DONE"] as TaskStatus[]).map((status) => {
              const colTasks = filteredTasks.filter(t => t.status === status);
              const headerInfo = {
                TODO: { title: "CẦN LÀM", count: colTasks.length, border: "border-t-[#9CA3AF]", bg: "bg-gray-100/50" },
                IN_PROGRESS: { title: "ĐANG LÀM", count: colTasks.length, border: "border-t-[#1A73E8]", bg: "bg-[#E8F0FE]/30" },
                REVIEW: { title: "ĐANG DUYỆT", count: colTasks.length, border: "border-t-[#F2994A]", bg: "bg-[#FEF7E0]/40" },
                DONE: { title: "ĐÃ XONG", count: colTasks.length, border: "border-t-[#137333]", bg: "bg-[#E6F4EA]/30" }
              };
              const col = headerInfo[status];

              return (
                <div key={status} className={`rounded-2xl border border-[#E5E7EB] border-t-4 ${col.border} ${col.bg} p-4 space-y-3 min-h-[450px]`}>
                  <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]/60">
                    <span className="text-xs font-mono font-bold tracking-wider text-[#111827]">{col.title}</span>
                    <span className="px-2 py-0.5 rounded-full bg-white border border-[#E5E7EB] text-xs font-mono font-extrabold text-[#4B5563]">
                      {col.count}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {colTasks.map((t) => {
                      const priorityColors: Record<string, string> = {
                        LOW: "bg-gray-100 text-gray-600",
                        MEDIUM: "bg-blue-50 text-blue-700",
                        HIGH: "bg-orange-50 text-orange-700",
                        URGENT: "bg-red-50 text-red-700"
                      };
                      return (
                        <div key={t.id} className="bg-white border border-[#E5E7EB] rounded-xl p-3.5 shadow-sm space-y-3 hover:scale-[1.01] transition-transform cursor-grab active:cursor-grabbing">
                          <span className="text-[10px] font-mono font-bold text-[#9CA3AF]">TASK-{t.id}</span>
                          <p className="text-xs font-bold text-[#111827] line-clamp-2 leading-relaxed">
                            {t.title}
                          </p>

                          <div className="flex items-center justify-between pt-1 text-[10px]">
                            <span className={`px-2 py-0.5 rounded font-mono font-bold ${priorityColors[t.priority] || priorityColors.MEDIUM}`}>
                              {t.priority}
                            </span>
                            
                            <div className="flex items-center gap-1.5 text-[#6B7280] font-medium">
                              <div className="w-4 h-4 rounded-full bg-[#E5E7EB] flex items-center justify-center text-[8px] font-bold text-[#4B5563]">
                                {t.ownerName ? t.ownerName.substring(0, 2).toUpperCase() : <User className="w-2.5 h-2.5" />}
                              </div>
                              <span className="max-w-[70px] truncate">{t.ownerName || "Chưa giao"}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    {colTasks.length === 0 && (
                      <div className="border border-dashed border-[#E5E7EB] rounded-xl p-6 text-center text-xs text-[#9CA3AF] font-mono">
                        Kéo thả hoặc thêm task
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Settings Modal (Edit/Delete) */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-[#111827]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#F6F5EF] border border-[#E5E7EB] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#111827] font-mono uppercase tracking-wider">
                Cài đặt Space
              </h3>
              <button
                onClick={() => {
                  setIsEditOpen(false);
                  setEditError("");
                }}
                className="text-[#6B7280] hover:text-[#111827] text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {editError && (
              <div className="bg-[#FDEDEC] border border-[#FADBD8] text-[#D93025] px-4 py-2.5 rounded-xl text-xs font-medium">
                {editError}
              </div>
            )}

            <form onSubmit={handleEditSpace} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#4B5563] uppercase tracking-wider font-mono">
                  Tên Space
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#111827] transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#4B5563] uppercase tracking-wider font-mono">
                    Ngày bắt đầu
                  </label>
                  <input
                    type="date"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#111827] transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#4B5563] uppercase tracking-wider font-mono">
                    Ngày kết thúc
                  </label>
                  <input
                    type="date"
                    value={editEndDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#111827] transition-colors"
                  />
                </div>
              </div>

              {/* Danger Zone */}
              <div className="pt-4 border-t border-[#E5E7EB] space-y-2">
                <p className="text-[11px] font-bold text-[#D93025] uppercase tracking-wider font-mono">Vùng nguy hiểm</p>
                <button
                  type="button"
                  onClick={handleDeleteSpace}
                  disabled={editLoading}
                  className="w-full py-2.5 border border-[#FADBD8] hover:bg-[#FDEDEC] text-[#D93025] rounded-xl text-xs font-mono font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  XÓA SPACE NÀY
                </button>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditOpen(false);
                    setEditError("");
                  }}
                  className="flex-1 py-2.5 bg-white hover:bg-gray-100 border border-[#E5E7EB] text-[#4B5563] rounded-xl text-xs font-mono font-bold transition-colors"
                >
                  HỦY
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex-1 py-2.5 bg-[#111827] hover:bg-black text-white rounded-xl text-xs font-mono font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  {editLoading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  LƯU THAY ĐỔI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
