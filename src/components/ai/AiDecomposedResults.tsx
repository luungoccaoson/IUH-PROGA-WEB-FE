"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  PlusCircle,
  RefreshCw,
  FolderPlus,
  ArrowRight,
  Pencil,
  Trash2,
  Plus,
  ArrowRightLeft,
  X,
  Save,
  GripVertical,
  BookmarkCheck,
  ExternalLink,
  UserCheck,
  Zap,
  AlertTriangle,
  Layers,
  FileText,
  ShieldCheck,
  BookOpen,
} from "lucide-react";
import { TaskDecompositionResponse, DecomposedTaskItem } from "@/services/ai.service";
import { Space } from "@/types";
import { TargetMode } from "./AiHeaderBanner";
import { RagCitationsDrawer } from "./RagCitationsDrawer";

interface AiDecomposedResultsProps {
  result: TaskDecompositionResponse;
  targetMode: TargetMode;
  selectedSpace?: Space;
  newSpaceName: string;
  workspaceId: number;
  selectedSpaceId: number | null;
  createdSpaceId: number | null;
  onImportTasks: () => void;
  importing: boolean;
  importSuccess: boolean;
  isImported?: boolean;
  members?: string[];
  onUpdateTasks: (updatedTasks: DecomposedTaskItem[]) => void;
  existingTaskCount?: number;
  existingSprintsSummary?: { name: string; status: string; taskCount: number }[];
}

export function AiDecomposedResults({
  result,
  targetMode,
  selectedSpace,
  newSpaceName,
  workspaceId,
  selectedSpaceId,
  createdSpaceId,
  onImportTasks,
  importing,
  importSuccess,
  isImported = false,
  members = [],
  onUpdateTasks,
  existingTaskCount = 0,
  existingSprintsSummary = [],
}: AiDecomposedResultsProps) {
  const router = useRouter();

  // Group tasks by exact Sprint returned from AI result
  const groupedTasks: Record<string, { task: DecomposedTaskItem; originalIndex: number }[]> = {};
  if (result?.tasks) {
    result.tasks.forEach((t, idx) => {
      const sprintName = t.sprint || "Sprint 1";
      if (!groupedTasks[sprintName]) groupedTasks[sprintName] = [];
      groupedTasks[sprintName].push({ task: t, originalIndex: idx });
    });
  }

  // Available Sprints for rendering: ONLY Sprints that exist in result.tasks
  const availableSprints: string[] = Object.keys(groupedTasks);
  if (availableSprints.length === 0 && targetMode === "NEW_SPACE") {
    availableSprints.push("Sprint 1");
    groupedTasks["Sprint 1"] = [];
  }

  // Modal Edit State
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("HIGH");
  const [editEstimatedDays, setEditEstimatedDays] = useState<number>(2);
  const [editBufferDays, setEditBufferDays] = useState<number>(0);
  const [editAssignedRole, setEditAssignedRole] = useState<string>("Backend Developer");
  const [editSprint, setEditSprint] = useState<string>("Sprint 1");

  // Modal Add State
  const [addingToSprint, setAddingToSprint] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPriority, setNewPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("HIGH");
  const [newEstimatedDays, setNewEstimatedDays] = useState<number>(2);

  // Drag over sprint state for visual dropzone highlighting
  const [dragOverSprint, setDragOverSprint] = useState<string | null>(null);

  // Citations Drawer State
  const [isCitationsDrawerOpen, setIsCitationsDrawerOpen] = useState(false);

  // Risk Popover Hover / Click States
  const [hoveredRiskIndex, setHoveredRiskIndex] = useState<number | null>(null);
  const [openRiskIndex, setOpenRiskIndex] = useState<number | null>(null);

  // Citation Link Popover Hover / Click States
  const [hoveredLinkIndex, setHoveredLinkIndex] = useState<number | null>(null);
  const [openLinkIndex, setOpenLinkIndex] = useState<number | null>(null);

  const getPriorityBadgeStyle = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-[#FCE8E6] text-[#D93025] border-[#FADBD8]";
      case "HIGH":
        return "bg-[#FEF7E0] text-[#B06000] border-[#FEEFC3]";
      case "MEDIUM":
        return "bg-[#E8F0FE] text-[#1A73E8] border-[#D2E3FC]";
      default:
        return "bg-[#E6F4EA] text-[#137333] border-[#CEEAD6]";
    }
  };

  const targetSpaceId = targetMode === "NEW_SPACE" ? createdSpaceId : selectedSpaceId;

  // Open Edit Modal
  const handleOpenEdit = (index: number) => {
    const item = result.tasks[index];
    setEditingIndex(index);
    setEditTitle(item.title);
    setEditDescription(item.description);
    setEditPriority(item.priority);
    setEditEstimatedDays(item.estimatedDays || 2);
    setEditBufferDays(item.bufferDays || 0);
    setEditAssignedRole(item.assignedRole || "Backend Developer");
    setEditSprint(item.sprint || "Sprint 1");
  };

  // Save Edit Task
  const handleSaveEdit = () => {
    if (editingIndex === null || !editTitle.trim()) return;

    const updated = [...result.tasks];
    updated[editingIndex] = {
      ...updated[editingIndex],
      title: editTitle.trim(),
      description: editDescription.trim(),
      priority: editPriority,
      estimatedDays: editEstimatedDays,
      bufferDays: editBufferDays,
      assignedRole: editAssignedRole,
      sprint: editSprint,
    };

    onUpdateTasks(updated);
    setEditingIndex(null);
  };

  // Delete Task
  const handleDeleteTask = (index: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa Task này khỏi danh sách gợi ý AI?")) return;
    const updated = result.tasks.filter((_, idx) => idx !== index);
    onUpdateTasks(updated);
  };

  // Quick Move Sprint
  const handleMoveSprint = (index: number, newSprintName: string) => {
    const updated = [...result.tasks];
    updated[index] = { ...updated[index], sprint: newSprintName };
    onUpdateTasks(updated);
  };

  // Add Task to Sprint
  const handleSaveAddTask = () => {
    if (!addingToSprint || !newTitle.trim()) return;

    const newTask: DecomposedTaskItem = {
      sprint: addingToSprint,
      title: newTitle.trim(),
      description: newDescription.trim() || "Công việc được bổ sung thủ công",
      priority: newPriority,
      estimatedDays: newEstimatedDays,
    };

    onUpdateTasks([...result.tasks, newTask]);
    setAddingToSprint(null);
    setNewTitle("");
    setNewDescription("");
  };

  return (
    <div className="space-y-6 font-sans animate-in fade-in duration-300">
      {/* Summary Card */}
      <div className="bg-[#F0F7FF] border border-[#D2E3FC] p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-2 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-[#1A73E8]">
              <CheckCircle2 className="w-4 h-4" />
              Kết Quả Phân Rã Bài Toán Bằng RAG AI Agent
            </span>
            <button
              onClick={() => setIsCitationsDrawerOpen(true)}
              className="px-2.5 py-1 bg-[#111827] hover:bg-black text-white rounded-lg text-[11px] font-bold font-mono transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>📚 Bằng chứng & Trích dẫn RAG</span>
            </button>
          </div>
          <h3 className="text-base font-extrabold text-[#111827]">{result.summary}</h3>

          {result.sourceReference && (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#1A73E8] bg-[#E8F0FE] px-3 py-1.5 rounded-xl border border-[#D2E3FC] font-mono font-bold w-fit">
                <BookmarkCheck className="w-4 h-4 text-[#1A73E8]" />
                <span>Nguồn RAG Tri Thức Chứng Thực: <strong>{result.sourceReference}</strong></span>
              </div>

              {/* Render ALL Tri-Anchor Benchmark Citation Links (Compact Badges with Popover) */}
              {((result.sourceUrls && result.sourceUrls.length > 0) || result.sourceUrl) && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] font-mono font-bold text-[#4B5563] uppercase mr-1">
                    🔗 Link Chứng Thực:
                  </span>
                  {(result.sourceUrls && result.sourceUrls.length > 0 ? result.sourceUrls : [result.sourceUrl!]).map(
                    (url, idx) => {
                      let domain = "";
                      try {
                        domain = new URL(url).hostname.replace(/^www\./, "");
                      } catch {
                        domain = url.substring(0, 24);
                      }

                      const isHovered = hoveredLinkIndex === idx;
                      const isOpen = openLinkIndex === idx;

                      return (
                        <div key={idx} className="relative inline-block">
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onMouseEnter={() => setHoveredLinkIndex(idx)}
                            onMouseLeave={() => setHoveredLinkIndex(null)}
                            onClick={() => setOpenLinkIndex(isOpen ? null : idx)}
                            className="px-2 py-0.5 bg-white hover:bg-[#E8F0FE] border border-[#D2E3FC] hover:border-[#1A73E8] rounded-md text-[11px] font-mono font-bold text-[#1A73E8] transition-all flex items-center gap-1 shadow-2xs hover:shadow-xs cursor-pointer"
                          >
                            <span>Link #{idx + 1}</span>
                            <ExternalLink className="w-3 h-3 text-[#1A73E8]" />
                          </a>

                          {/* Hover / Click Link Preview Popover */}
                          {(isHovered || isOpen) && (
                            <div className="absolute left-0 top-full mt-1.5 w-72 p-3 bg-[#111827] text-white text-[11px] rounded-2xl shadow-xl z-30 space-y-2 animate-in fade-in zoom-in-95 duration-150 border border-gray-700 pointer-events-auto">
                              <div className="flex items-center justify-between text-[#38BDF8] font-mono font-bold text-[10px] uppercase border-b border-gray-800 pb-1">
                                <span className="flex items-center gap-1 truncate">
                                  <ExternalLink className="w-3.5 h-3.5 text-[#38BDF8]" /> {domain}
                                </span>
                                <span className="text-[9px] text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded font-mono">
                                  Link #{idx + 1}
                                </span>
                              </div>

                              <p className="text-gray-200 text-xs font-mono break-all leading-relaxed bg-gray-900/80 p-2 rounded-xl border border-gray-800 select-all">
                                {url}
                              </p>

                              <div className="pt-1 border-t border-gray-800 flex items-center justify-between">
                                <span className="text-[10px] text-gray-400 font-mono">Click để chuyển tới link</span>
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2.5 py-1 bg-[#1A73E8] hover:bg-[#1557B0] text-white rounded-lg text-[10px] font-bold font-mono flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                  <span>Mở trang ↗</span>
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
              )}
            </div>
          )}

          <p className="text-xs text-[#4B5563]">
            Tổng số: <strong className="text-[#111827]">{result.tasks.length} tasks</strong> (Hỗ trợ Story Points Fibonacci, Phân Vai Role & Đánh giá Rủi ro).
          </p>
        </div>

        {/* Action Import Button */}
        <div className="space-y-2 text-left md:text-right shrink-0">
          <button
            onClick={onImportTasks}
            disabled={importing || importSuccess || isImported || result.tasks.length === 0}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs rounded-xl shadow-xs transition-all ${importSuccess || isImported
                ? "bg-[#E6F4EA] text-[#137333] border border-[#CEEAD6] cursor-not-allowed opacity-95"
                : targetMode === "NEW_SPACE"
                  ? "bg-[#10B981] hover:bg-[#059669] text-white cursor-pointer"
                  : "bg-[#137333] hover:bg-[#0D652D] text-white cursor-pointer"
              }`}
          >
            {importing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                {targetMode === "NEW_SPACE" ? "Đang khởi tạo Space Mới & Nạp Task..." : "Đang nạp Task vào Space..."}
              </>
            ) : importSuccess || isImported ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-[#137333]" />
                {targetMode === "NEW_SPACE"
                  ? "✅ Đã Khởi Tạo Space & Nạp Bảng Task WBS Thành Công!"
                  : "✅ Đã Nạp Bảng Task WBS Vào Space Thành Công!"}
              </>
            ) : targetMode === "NEW_SPACE" ? (
              <>
                <FolderPlus className="w-4 h-4" />
                🚀 Khởi Tạo Dự Án Mới & Nạp Tasks ({result.tasks.length})
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                Nạp Tasks Vào Space: {selectedSpace?.name} ({result.tasks.length})
              </>
            )}
          </button>

          {importSuccess && (
            <div className="space-y-1">
              <p className="text-[11px] text-[#137333] font-bold">
                {targetMode === "NEW_SPACE"
                  ? `Đã khởi tạo Dự Án "${newSpaceName}" thành công!`
                  : "Đã nạp tất cả Task vào Space!"}
              </p>
              {targetSpaceId && (
                <button
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      window.dispatchEvent(new Event("switch_to_kanban_tab"));
                    }
                    router.push(`/workspaces/${workspaceId}/spaces/${targetSpaceId}`);
                  }}
                  className="text-xs text-[#1A73E8] hover:underline font-bold flex items-center justify-end gap-1 cursor-pointer ml-auto"
                >
                  👉 Chuyển Tới Bảng Kanban Của Dự Án <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Ongoing Space Timeline Context Banner */}
      {targetMode === "EXISTING_SPACE" && existingSprintsSummary && existingSprintsSummary.length > 0 && (
        <div className="p-4 bg-[#111827] text-white rounded-2xl space-y-2.5 border border-gray-800 font-sans shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#10B981] flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-[#10B981]" />
              <span>Tiến Trình Các Sprint Trong Space "{selectedSpace?.name}" ({existingTaskCount} Tasks)</span>
            </span>
            <span className="text-[11px] text-gray-400 font-mono">Không đụng vào các Sprint cũ</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {existingSprintsSummary.map((sp, idx) => {
              const statusUpper = (sp.status || "").toUpperCase();
              const isActive = statusUpper === "ACTIVE" || statusUpper === "IN_PROGRESS";
              const isClosed = statusUpper === "COMPLETED" || statusUpper === "CLOSED";

              const badgeStyle = isActive
                ? "bg-[#10B981]/20 text-[#A7F3D0] border-[#10B981]/40"
                : isClosed
                  ? "bg-gray-800/80 text-gray-400 border-gray-700"
                  : "bg-blue-500/20 text-blue-300 border-blue-500/40";

              const statusText = isActive ? "Đang chạy" : isClosed ? "Đã hoàn thành" : "Sắp tới";

              return (
                <div
                  key={idx}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold font-mono flex items-center gap-2 ${badgeStyle}`}
                >
                  <span>{sp.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-black/40 text-gray-200">
                    {sp.taskCount} tasks ({statusText})
                  </span>
                </div>
              );
            })}
            <div className="text-[#10B981] font-bold text-sm px-1 font-mono">➜</div>
            <div className="px-3 py-1.5 rounded-xl bg-[#10B981] text-white font-mono text-xs font-extrabold shadow-sm animate-pulse">
              ✨ {result.tasks[0]?.sprint || "Sprint Mới"} (AI Nối Tiếp)
            </div>
          </div>
        </div>
      )}

      {/* Grouped Tasks By Sprint */}
      <div className="space-y-6">
        {availableSprints.map((sprintName, groupIdx) => {
          const taskList = groupedTasks[sprintName] || [];
          const isDragOver = dragOverSprint === sprintName;

          return (
            <div
              key={groupIdx}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                setDragOverSprint(sprintName);
              }}
              onDragLeave={() => setDragOverSprint(null)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverSprint(null);
                const indexStr = e.dataTransfer.getData("aiTaskIndex");
                if (indexStr !== undefined && indexStr !== "") {
                  const taskIdx = parseInt(indexStr, 10);
                  handleMoveSprint(taskIdx, sprintName);
                }
              }}
              className={`bg-white border rounded-2xl p-4 space-y-3 shadow-2xs transition-all ${isDragOver
                  ? "border-[#1A73E8] bg-[#F0F7FF] ring-2 ring-[#1A73E8]/30"
                  : "border-[#E5E7EB]"
                }`}
            >
              {/* Sprint Group Title Header */}
              <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="w-7 h-7 rounded-lg bg-[#111827] text-white flex items-center justify-center font-mono font-bold text-xs shrink-0">
                    S{groupIdx + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-extrabold text-sm text-[#111827] truncate">
                      {sprintName.includes(":") ? sprintName.split(":")[0].trim() : sprintName}
                    </h4>
                    <p className="text-[11px] text-[#6B7280] truncate">
                      {sprintName.includes(":") ? sprintName.split(":").slice(1).join(":").trim() : `Bao gồm ${taskList.length} hạng mục công việc`}
                    </p>
                  </div>
                </div>

                {/* Add Task to this Sprint Button */}
                <button
                  onClick={() => setAddingToSprint(sprintName)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-[#111827] rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm Task
                </button>
              </div>

              {/* Tasks List */}
              {taskList.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {taskList.map(({ task, originalIndex }) => {
                    const cleanTitle = (task.title || "").replace(/^Task-\d+\s*:\s*/i, "").trim();

                    return (
                      <div
                        key={originalIndex}
                        draggable={true}
                        onDragStart={(e) => {
                          e.dataTransfer.setData("aiTaskIndex", originalIndex.toString());
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        className="p-3.5 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] hover:border-[#111827] transition-all space-y-2.5 shadow-2xs group relative cursor-grab active:cursor-grabbing hover:bg-white"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <GripVertical className="w-4 h-4 text-gray-400 shrink-0 cursor-grab active:cursor-grabbing hover:text-[#111827]" />
                            <span className="font-mono text-[10px] font-bold text-[#6B7280] bg-[#F6F5EF] px-2 py-0.5 rounded border border-[#E5E7EB] shrink-0">
                              Task-{(existingTaskCount || 0) + originalIndex + 1}
                            </span>
                            <h5 className="font-extrabold text-xs text-[#111827] leading-snug truncate">
                              {cleanTitle}
                            </h5>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <span
                              className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-md border ${getPriorityBadgeStyle(
                                task.priority
                              )}`}
                            >
                              {task.priority}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-[#4B5563] leading-relaxed line-clamp-2 pl-6">
                          {task.description}
                        </p>

                        {/* Role & Time Estimates */}
                        <div className="flex flex-wrap items-center gap-1.5 pl-6 font-mono text-[10px]">
                          {task.assignedRole && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#E8F0FE] text-[#1A73E8] font-bold border border-[#D2E3FC]">
                              <UserCheck className="w-3 h-3" />
                              {task.assignedRole}
                            </span>
                          )}

                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F3F4F6] text-[#374151] font-bold border border-[#E5E7EB]">
                            <Clock className="w-3 h-3 text-[#6B7280]" />
                            Ước tính: {task.estimatedDays || 2} ngày
                          </span>

                          {task.bufferDays ? (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FEF7E0] text-[#B06000] font-bold border border-[#FEEFC3]">
                              🛡️ +{task.bufferDays} ngày dự phòng
                            </span>
                          ) : null}
                        </div>

                        {/* Member Assignee Selector */}
                        {/* <div className="ml-6 flex items-center gap-1.5 text-xs text-[#374151] bg-[#F9FAFB] p-1.5 rounded-xl border border-[#E5E7EB]">
                          <span className="font-bold font-mono text-[10px] text-[#6B7280] shrink-0">Phân công:</span>
                          <select
                            value={task.suggestedMemberName || ""}
                            onChange={(e) => {
                              const updated = [...result.tasks];
                              updated[originalIndex] = {
                                ...updated[originalIndex],
                                suggestedMemberName: e.target.value,
                              };
                              onUpdateTasks(updated);
                            }}
                            className="w-full bg-white border border-[#E5E7EB] rounded-lg px-2 py-0.5 text-xs font-bold text-[#111827] focus:outline-none cursor-pointer truncate"
                          >
                            <option value="">-- Chưa gán --</option>
                            {members && members.length > 0 ? (
                              Array.from(new Set(members)).map((m, idx) => (
                                <option key={`${m}-${idx}`} value={m}>
                                  👤 {m}
                                </option>
                              ))
                            ) : (
                              <>
                                <option value="Nam">👤 Nam (Backend)</option>
                                <option value="Linh">👤 Linh (Frontend)</option>
                                <option value="Tuấn">👤 Tuấn (QA / QC)</option>
                                <option value="Hùng">👤 Hùng (DevOps)</option>
                              </>
                            )}
                          </select>
                        </div> */}

                        {/* Compact Risk Warning Badge with Hover / Click Popover */}
                        {(task.priority === "URGENT" || task.riskWarning) && (
                          <div className="relative inline-block ml-6">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenRiskIndex(openRiskIndex === originalIndex ? null : originalIndex);
                              }}
                              onMouseEnter={() => setHoveredRiskIndex(originalIndex)}
                              onMouseLeave={() => setHoveredRiskIndex(null)}
                              className="px-2 py-0.5 rounded-md bg-[#FFF0F0] text-[#D93025] border border-[#FADBD8] text-[10px] font-bold font-mono flex items-center gap-1 hover:bg-[#FCE8E6] transition-all cursor-pointer shadow-2xs"
                            >
                              <AlertTriangle className="w-3 h-3 text-[#D93025]" />
                              <span>⚠️ Cảnh báo rủi ro</span>
                            </button>

                            {/* Risk Detail Popover */}
                            {(hoveredRiskIndex === originalIndex || openRiskIndex === originalIndex) && (
                              <div className="absolute left-0 bottom-full mb-2 w-72 p-3 bg-[#111827] text-white text-[11px] rounded-2xl shadow-xl z-30 space-y-1.5 animate-in fade-in zoom-in-95 duration-150 border border-gray-700 pointer-events-auto">
                                <div className="flex items-center justify-between text-[#F87171] font-mono font-bold text-[10px] uppercase border-b border-gray-800 pb-1">
                                  <span className="flex items-center gap-1">
                                    <AlertTriangle className="w-3.5 h-3.5" /> Nguyên nhân & Căn cứ Rủi ro
                                  </span>
                                </div>
                                <p className="text-gray-200 text-xs leading-relaxed font-sans font-medium">
                                  {task.riskWarning || "Task có độ phức tạp kỹ thuật cao, cần chú ý kiểm soát mã hóa dữ liệu & kiểm thử kỹ lưỡng."}
                                </p>
                                <div className="text-[10px] text-[#60A5FA] font-mono font-semibold pt-1 border-t border-gray-800 flex items-center gap-1">
                                  <span>🛡️ Tiêu chuẩn kiểm soát: OWASP & IEEE 12207</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Card Footer Controls (Move Sprint, Edit, Delete) */}
                        <div className="flex items-center justify-between text-[11px] font-mono text-[#6B7280] pt-2 border-t border-[#E5E7EB]">
                          <span className="flex items-center gap-1 pl-6 text-[10px]">
                            <Clock className="w-3 h-3 text-[#111827]" />
                            {task.estimatedDays || 2} ngày
                          </span>

                          <div className="flex items-center gap-2">
                            {/* Move Sprint Selector (Shortened) */}
                            <div className="flex items-center gap-1 text-[10px] text-[#4B5563]">
                              <ArrowRightLeft className="w-3 h-3 text-[#6B7280]" />
                              <select
                                value={task.sprint || sprintName}
                                onChange={(e) => handleMoveSprint(originalIndex, e.target.value)}
                                className="bg-white border border-[#E5E7EB] rounded-lg px-1.5 py-0.5 font-bold text-[#111827] cursor-pointer max-w-[130px] truncate"
                              >
                                {availableSprints.map((sp) => {
                                  const shortSpLabel = sp.includes(":") ? sp.split(":")[0].trim() : sp;
                                  return (
                                    <option key={sp} value={sp}>
                                      {shortSpLabel}
                                    </option>
                                  );
                                })}
                              </select>
                            </div>

                            {/* Edit Button */}
                            <button
                              onClick={() => handleOpenEdit(originalIndex)}
                              className="p-1 hover:bg-gray-200 rounded-md text-[#1A73E8] transition-colors"
                              title="Sửa Task"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDeleteTask(originalIndex)}
                              className="p-1 hover:bg-red-100 rounded-md text-[#D93025] transition-colors"
                              title="Xóa Task"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-[#E5E7EB] text-center text-xs text-[#9CA3AF]">
                  Chưa có task nào trong {sprintName}. Bạn có thể <strong>kéo thả Task từ Sprint khác vào đây</strong> hoặc bấm <strong>"Thêm Task"</strong>.
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* EDIT TASK MODAL */}
      {editingIndex !== null && (
        <div className="fixed inset-0 bg-[#111827]/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-[#E5E7EB] rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-extrabold text-[#111827] flex items-center gap-2">
                <Pencil className="w-4 h-4 text-[#1A73E8]" /> Chỉnh Sửa Task AI Phân Rã
              </h3>
              <button onClick={() => setEditingIndex(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 font-sans">
              <div>
                <label className="text-xs font-bold text-[#374151] font-mono uppercase">Tiêu đề Task:</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2 border border-[#E5E7EB] rounded-xl text-sm font-bold text-[#111827] mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#374151] font-mono uppercase">Mô tả công việc:</label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3.5 py-2 border border-[#E5E7EB] rounded-xl text-xs text-[#111827] mt-1"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#374151] font-mono uppercase">Sprint:</label>
                  <select
                    value={editSprint}
                    onChange={(e) => setEditSprint(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl text-xs font-bold text-[#111827] mt-1"
                  >
                    {availableSprints.map((sp) => (
                      <option key={sp} value={sp}>
                        {sp}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#374151] font-mono uppercase">Mức ưu tiên:</label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as any)}
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl text-xs font-bold text-[#111827] mt-1"
                  >
                    <option value="URGENT">URGENT</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#374151] font-mono uppercase">Số ngày làm:</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={editEstimatedDays}
                    onChange={(e) => setEditEstimatedDays(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl text-xs font-bold text-[#111827] mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#374151] font-mono uppercase">Ngày dự phòng rủi ro:</label>
                  <select
                    value={editBufferDays}
                    onChange={(e) => setEditBufferDays(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl text-xs font-bold text-[#111827] mt-1"
                  >
                    <option value={0}>0 ngày (Không có rủi ro)</option>
                    <option value={1}>+1 ngày dự phòng</option>
                    <option value={2}>+2 ngày dự phòng (Rủi ro cao)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#374151] font-mono uppercase">Vai trò đảm nhiệm (Role):</label>
                  <select
                    value={editAssignedRole}
                    onChange={(e) => setEditAssignedRole(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl text-xs font-bold text-[#111827] mt-1"
                  >
                    <option value="Tech Lead / System Architect">Tech Lead / System Architect</option>
                    <option value="Senior Backend Developer">Senior Backend Developer</option>
                    <option value="Backend Developer">Backend Developer</option>
                    <option value="Frontend Developer">Frontend Developer</option>
                    <option value="DevOps / SRE Engineer">DevOps / SRE Engineer</option>
                    <option value="QA / QC Lead">QA / QC Lead</option>
                    <option value="Business Analyst (BA)">Business Analyst (BA)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setEditingIndex(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-bold rounded-xl"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-[#111827] text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" /> Lưu Thay Đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD TASK MODAL */}
      {addingToSprint !== null && (
        <div className="fixed inset-0 bg-[#111827]/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-[#E5E7EB] rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-extrabold text-[#111827] flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-[#137333]" /> Thêm Task Mới Vào {addingToSprint}
              </h3>
              <button onClick={() => setAddingToSprint(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 font-sans">
              <div>
                <label className="text-xs font-bold text-[#374151] font-mono uppercase">Tiêu đề Task mới:</label>
                <input
                  type="text"
                  placeholder="Nhập tên công việc cần làm..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2 border border-[#E5E7EB] rounded-xl text-sm font-bold text-[#111827] mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#374151] font-mono uppercase">Mô tả công việc:</label>
                <textarea
                  rows={3}
                  placeholder="Mô tả công việc chi tiết..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3.5 py-2 border border-[#E5E7EB] rounded-xl text-xs text-[#111827] mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#374151] font-mono uppercase">Mức ưu tiên:</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl text-xs font-bold text-[#111827] mt-1"
                  >
                    <option value="URGENT">URGENT</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#374151] font-mono uppercase">Số ngày ước tính:</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={newEstimatedDays}
                    onChange={(e) => setNewEstimatedDays(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl text-xs font-bold text-[#111827] mt-1"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setAddingToSprint(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-bold rounded-xl"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveAddTask}
                disabled={!newTitle.trim()}
                className="px-4 py-2 bg-[#137333] hover:bg-[#0D652D] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RAG Citations Slide-over Drawer */}
      <RagCitationsDrawer
        isOpen={isCitationsDrawerOpen}
        onClose={() => setIsCitationsDrawerOpen(false)}
        citations={result?.citations || []}
        sourceReference={result?.sourceReference}
        sourceUrl={result?.sourceUrl}
      />
    </div>
  );
}
