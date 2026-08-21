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
  HelpCircle,
  Layers,
} from "lucide-react";
import { TaskDecompositionResponse, DecomposedTaskItem } from "@/services/ai.service";
import { Space } from "@/types";
import { TargetMode } from "./AiHeaderBanner";

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
  onUpdateTasks: (updatedTasks: DecomposedTaskItem[]) => void;
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
  onUpdateTasks,
}: AiDecomposedResultsProps) {
  const router = useRouter();

  // Dynamically compute available Sprints from AI result tasks (3, 4, 5, 6+ Sprints flexible!)
  const sprintNamesFromTasks = Array.from(
    new Set(result.tasks.map((t) => t.sprint || "Sprint 1"))
  );

  let maxSprintNum = 1;
  sprintNamesFromTasks.forEach((s) => {
    const m = s.match(/\d+/);
    if (m) {
      const num = parseInt(m[0], 10);
      if (num > maxSprintNum) maxSprintNum = num;
    }
  });

  const availableSprints: string[] = [];
  for (let i = 1; i <= maxSprintNum; i++) {
    availableSprints.push(`Sprint ${i}`);
  }

  // Modal Edit State
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("HIGH");
  const [editEstimatedDays, setEditEstimatedDays] = useState<number>(2);
  const [editStoryPoints, setEditStoryPoints] = useState<number>(3);
  const [editRecommendedRole, setEditRecommendedRole] = useState<string>("Backend Developer");
  const [editSprint, setEditSprint] = useState<string>("Sprint 1");

  // Modal Add State
  const [addingToSprint, setAddingToSprint] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPriority, setNewPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("HIGH");
  const [newEstimatedDays, setNewEstimatedDays] = useState<number>(2);

  // Drag over sprint state for visual dropzone highlighting
  const [dragOverSprint, setDragOverSprint] = useState<string | null>(null);

  // Group tasks by Sprint
  const groupedTasks: Record<string, { task: DecomposedTaskItem; originalIndex: number }[]> = {};
  if (result?.tasks) {
    result.tasks.forEach((t, idx) => {
      const sprintName = t.sprint || "Sprint 1";
      if (!groupedTasks[sprintName]) groupedTasks[sprintName] = [];
      groupedTasks[sprintName].push({ task: t, originalIndex: idx });
    });
  }

  // Ensure all dynamic Sprints exist in grouped view
  availableSprints.forEach((sp) => {
    if (!groupedTasks[sp]) groupedTasks[sp] = [];
  });

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
    setEditStoryPoints(item.storyPoints || 3);
    setEditRecommendedRole(item.recommendedRole || "Backend Developer");
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
      storyPoints: editStoryPoints,
      recommendedRole: editRecommendedRole,
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
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#1A73E8]">
            <CheckCircle2 className="w-4 h-4" />
            Kết Quả Phân Rã Bài Toán Bằng RAG AI Agent
          </div>
          <h3 className="text-base font-extrabold text-[#111827]">{result.summary}</h3>
          
          {result.sourceReference && (
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#1A73E8] bg-[#E8F0FE] px-3 py-1.5 rounded-xl border border-[#D2E3FC] font-mono font-bold w-fit">
              <BookmarkCheck className="w-4 h-4 text-[#1A73E8]" />
              <span>Nguồn RAG Tri Thức Chuẩn: <strong>{result.sourceReference}</strong></span>
              {result.sourceUrl && (
                <a
                  href={result.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-[#0B57D0] hover:text-[#0040A8] flex items-center gap-0.5 ml-1"
                >
                  [Xem Nguồn Xác Thực <ExternalLink className="w-3 h-3 inline" />]
                </a>
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
            disabled={importing || importSuccess || result.tasks.length === 0}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-60 text-white ${
              targetMode === "NEW_SPACE"
                ? "bg-[#10B981] hover:bg-[#059669]"
                : "bg-[#137333] hover:bg-[#0D652D]"
            }`}
          >
            {importing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                {targetMode === "NEW_SPACE" ? "Đang khởi tạo Space Mới & Nạp Task..." : "Đang nạp Task vào Space..."}
              </>
            ) : importSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-[#A8DAB5]" />
                {targetMode === "NEW_SPACE" ? "Đã Khởi Tạo & Nạp Thành Công!" : "Đã nạp thành công!"}
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
                    // SPA Routing without full browser reload
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
              className={`bg-white border rounded-2xl p-5 space-y-4 shadow-2xs transition-all ${
                isDragOver
                  ? "border-[#1A73E8] bg-[#F0F7FF] ring-2 ring-[#1A73E8]/30"
                  : "border-[#E5E7EB]"
              }`}
            >
              {/* Sprint Group Title Header */}
              <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#111827] text-white flex items-center justify-center font-mono font-bold text-xs">
                    S{groupIdx + 1}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-[#111827]">{sprintName}</h4>
                    <p className="text-[11px] text-[#6B7280]">
                      Bao gồm {taskList.length} hạng mục công việc (Có thể thả Task vào đây)
                    </p>
                  </div>
                </div>

                {/* Add Task to this Sprint Button */}
                <button
                  onClick={() => setAddingToSprint(sprintName)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-[#111827] rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm Task vào {sprintName}
                </button>
              </div>

              {/* Tasks List */}
              {taskList.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {taskList.map(({ task, originalIndex }) => (
                    <div
                      key={originalIndex}
                      draggable={true}
                      onDragStart={(e) => {
                        e.dataTransfer.setData("aiTaskIndex", originalIndex.toString());
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      className="p-4 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] hover:border-[#111827] transition-all space-y-3 shadow-2xs group relative cursor-grab active:cursor-grabbing hover:bg-white"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <GripVertical className="w-4 h-4 text-gray-400 shrink-0 cursor-grab active:cursor-grabbing hover:text-[#111827]" />
                          <span className="font-mono text-[10px] font-bold text-[#6B7280] bg-[#F6F5EF] px-2 py-0.5 rounded border border-[#E5E7EB] shrink-0">
                            Task-{originalIndex + 1}
                          </span>
                          <h5 className="font-extrabold text-sm text-[#111827] leading-snug truncate">
                            {task.title}
                          </h5>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <span
                            className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md border ${getPriorityBadgeStyle(
                              task.priority
                            )}`}
                          >
                            {task.priority}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-[#4B5563] leading-relaxed line-clamp-3 pl-6">
                        {task.description}
                      </p>

                      {/* Agile Badges: Role & Story Points */}
                      <div className="flex flex-wrap items-center gap-1.5 pl-6 font-mono text-[10px]">
                        {task.recommendedRole && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#E8F0FE] text-[#1A73E8] font-bold border border-[#D2E3FC]">
                            <UserCheck className="w-3 h-3" />
                            {task.recommendedRole}
                          </span>
                        )}

                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FEF7E0] text-[#B06000] font-bold border border-[#FEEFC3]">
                          <Zap className="w-3 h-3 text-[#B06000]" />
                          {task.storyPoints || 3} SP (Story Points)
                        </span>
                      </div>

                      {/* Chain-of-Thought Reasoning Explanation */}
                      {task.reasoning && (
                        <div className="ml-6 p-2 rounded-lg bg-[#F3F4F6] border border-[#E5E7EB] text-[11px] text-[#4B5563] space-y-0.5">
                          <span className="font-bold font-mono text-[#111827] flex items-center gap-1">
                            <HelpCircle className="w-3 h-3 text-[#1A73E8]" /> Lý do đánh giá & Độ phức tạp:
                          </span>
                          <p className="leading-snug italic">{task.reasoning}</p>
                        </div>
                      )}

                      {/* Risk Contingency Plan Box */}
                      {task.contingencyPlan && (
                        <div className="ml-6 p-2 rounded-lg bg-[#FFF0F0] border border-[#FADBD8] text-[11px] text-[#D93025] space-y-0.5">
                          <span className="font-bold font-mono flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-[#D93025]" /> Phương án dự phòng rủi ro:
                          </span>
                          <p className="leading-snug">{task.contingencyPlan}</p>
                        </div>
                      )}

                      {/* Card Footer Controls (Move Sprint, Edit, Delete) */}
                      <div className="flex items-center justify-between text-[11px] font-mono text-[#6B7280] pt-2 border-t border-[#E5E7EB]">
                        <span className="flex items-center gap-1 pl-6">
                          <Clock className="w-3 h-3 text-[#111827]" />
                          {task.estimatedDays || 2} ngày ước tính
                        </span>

                        <div className="flex items-center gap-2">
                          {/* Move Sprint Selector */}
                          <div className="flex items-center gap-1 text-[10px] text-[#4B5563]">
                            <ArrowRightLeft className="w-3 h-3 text-[#6B7280]" />
                            <select
                              value={task.sprint || sprintName}
                              onChange={(e) => handleMoveSprint(originalIndex, e.target.value)}
                              className="bg-white border border-[#E5E7EB] rounded-lg px-1.5 py-0.5 font-bold text-[#111827] cursor-pointer"
                            >
                              {availableSprints.map((sp) => (
                                <option key={sp} value={sp}>
                                  Chuyển sang {sp}
                                </option>
                              ))}
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
                  ))}
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
                  <label className="text-xs font-bold text-[#374151] font-mono uppercase">Story Points (Fibonacci):</label>
                  <select
                    value={editStoryPoints}
                    onChange={(e) => setEditStoryPoints(parseInt(e.target.value, 10) || 3)}
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl text-xs font-bold text-[#111827] mt-1"
                  >
                    <option value={1}>1 SP (Cực Kỳ Đơn Giản)</option>
                    <option value={2}>2 SP (Đơn Giản)</option>
                    <option value={3}>3 SP (Trung Bình)</option>
                    <option value={5}>5 SP (Phức Tạp)</option>
                    <option value={8}>8 SP (Rất Phức Tạp)</option>
                    <option value={13}>13 SP (Nghiêm Trọng / Rủi Ro)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#374151] font-mono uppercase">Gợi Ý Vai Trò (Role):</label>
                  <select
                    value={editRecommendedRole}
                    onChange={(e) => setEditRecommendedRole(e.target.value)}
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
    </div>
  );
}
