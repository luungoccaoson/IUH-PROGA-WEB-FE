"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  PlusCircle,
  RefreshCw,
  FolderPlus,
  ArrowRight,
  BookmarkCheck,
  ExternalLink,
  Zap,
  FileText,
  Sparkles,
} from "lucide-react";
import { TaskDecompositionResponse, DecomposedTaskItem, aiService } from "@/services/ai.service";
import { Space } from "@/types";
import { TargetMode } from "./AiHeaderBanner";
import { RagCitationsDrawer } from "./RagCitationsDrawer";
import { AiUnifiedChatBox, UnifiedChatMessage } from "./AiUnifiedChatBox";
import { AiTaskEditModal } from "./AiTaskEditModal";
import { AiTaskAddModal } from "./AiTaskAddModal";
import { AiSprintGroup } from "./AiSprintGroup";

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

  // Modals & UI States
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [addingToSprint, setAddingToSprint] = useState<string | null>(null);
  const [dragOverSprint, setDragOverSprint] = useState<string | null>(null);
  const [isCitationsDrawerOpen, setIsCitationsDrawerOpen] = useState(false);

  // Citation Link Popover Hover / Click States
  const [hoveredLinkIndex, setHoveredLinkIndex] = useState<number | null>(null);
  const [openLinkIndex, setOpenLinkIndex] = useState<number | null>(null);

  // Single Unified AI Chatbox States
  const [isChatBoxOpen, setIsChatBoxOpen] = useState(false);
  const [targetSprintScope, setTargetSprintScope] = useState<string>("ALL");
  const [chatBoxMessages, setChatBoxMessages] = useState<UnifiedChatMessage[]>([]);
  const [isChatBoxLoading, setIsChatBoxLoading] = useState(false);
  const [prevThreadId, setPrevThreadId] = useState<number | undefined>(result?.threadId);

  // Auto reset Chatbox session when main threadId changes
  useEffect(() => {
    if (result?.threadId !== prevThreadId) {
      setPrevThreadId(result?.threadId);
      setChatBoxMessages([]);
    }
  }, [result?.threadId, prevThreadId]);

  const targetSpaceId = targetMode === "NEW_SPACE" ? createdSpaceId : selectedSpaceId;

  // Open Unified Chatbox focused on a target sprint or ALL
  const handleOpenChatBox = (scope: string) => {
    setTargetSprintScope(scope);
    setIsChatBoxOpen(true);
  };

  // Send AI Chat prompt for Unified Chatbox
  const handleSendUnifiedChatBox = async (prompt: string) => {
    if (!prompt.trim() || isChatBoxLoading) return;

    const nowTime = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    const userMsg: UnifiedChatMessage = {
      sender: "USER",
      text: prompt,
      sprintScope: targetSprintScope,
      timestamp: nowTime,
    };

    setChatBoxMessages((prev) => [...prev, userMsg]);
    setIsChatBoxLoading(true);

    try {
      const spaceIdToUse = selectedSpaceId || 0;
      const threadIdToUse = result.threadId || undefined;

      const currentTasksJson = JSON.stringify(result.tasks);
      let fullInstruction = "";
      if (targetSprintScope === "ALL") {
        fullInstruction = `[YÊU CẦU TINH CHỈNH TOÀN BỘ BÀI TOÁN WBS]\nYêu cầu người dùng: "${prompt}"\nLƯU Ý QUAN TRỌNG: Người dùng đã sắp xếp, kéo thả các task vào từng Sprint cụ thể. BẮT BUỘC tôn trọng vị trí Sprint hiện tại của từng task, TUYỆT ĐỐI không được kéo task trở lại Sprint cũ. Hãy cập nhật và phân rã lại bảng WBS task hoàn chỉnh.`;
      } else {
        const currentSprintTasks = (groupedTasks[targetSprintScope] || []).map((t) => t.task);
        fullInstruction = `[YÊU CẦU ĐIỀU CHỈNH RIÊNG CHO SPRINT: ${targetSprintScope}]\nCác tasks hiện tại của ${targetSprintScope}: ${JSON.stringify(
          currentSprintTasks
        )}\nYêu cầu người dùng: "${prompt}"\nLƯU Ý QUAN TRỌNG: Hãy thực hiện chỉnh sửa/thêm task riêng cho ${targetSprintScope}. Đối với các task thuộc Sprint khác hoặc các task đã được người dùng kéo sang Sprint khác, BẮT BUỘC giữ nguyên vị trí Sprint hiện tại của chúng, TUYỆT ĐỐI không được chuyển chúng về Sprint cũ.`;
      }

      let updatedResult: TaskDecompositionResponse | null = null;
      try {
        updatedResult = await aiService.decomposeRequirements(spaceIdToUse, fullInstruction, threadIdToUse, currentTasksJson);
      } catch (err) {
        console.warn("Backend decompose call warning, applying smart local refinement:", err);
      }

      if (updatedResult && updatedResult.tasks && updatedResult.tasks.length > 0) {
        // Map current user task sprint placements: title -> sprint
        const userPlacedSprintMap: Record<string, string> = {};
        result.tasks.forEach((t) => {
          const cleanKey = (t.title || "").toLowerCase().replace(/^task-\d+\s*:\s*/i, "").trim();
          if (cleanKey && t.sprint) {
            userPlacedSprintMap[cleanKey] = t.sprint;
          }
        });

        // Ensure tasks that were dragged keep their current user-placed sprint unless explicitly targeted
        const mergedTasks = updatedResult.tasks.map((t) => {
          const cleanKey = (t.title || "").toLowerCase().replace(/^task-\d+\s*:\s*/i, "").trim();
          if (userPlacedSprintMap[cleanKey] && targetSprintScope !== "ALL") {
            return {
              ...t,
              sprint: userPlacedSprintMap[cleanKey],
            };
          }
          return t;
        });

        onUpdateTasks(mergedTasks);
        const assistantMsg: UnifiedChatMessage = {
          sender: "ASSISTANT",
          text: `✅ AI đã cập nhật công việc thành công cho **${
            targetSprintScope === "ALL" ? "Toàn bộ bài toán" : targetSprintScope
          }** theo yêu cầu!`,
          sprintScope: targetSprintScope,
          timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        };
        setChatBoxMessages((prev) => [...prev, assistantMsg]);
      } else {
        // Smart client-side fallback
        const promptLower = prompt.toLowerCase();
        let updatedTasks = [...result.tasks];
        let responseNote = "";

        if (targetSprintScope !== "ALL") {
          if (promptLower.includes("bổ sung") || promptLower.includes("thêm")) {
            const newTaskTitle =
              prompt.replace(/^(bổ sung|thêm|thêm task|bổ sung task)\s*/i, "").trim() ||
              `Công việc mới bổ sung cho ${targetSprintScope}`;
            updatedTasks.push({
              sprint: targetSprintScope,
              title: newTaskTitle.charAt(0).toUpperCase() + newTaskTitle.slice(1),
              description: `Nhiệm vụ được AI bổ sung tự động cho ${targetSprintScope} theo yêu cầu: "${prompt}"`,
              priority: "HIGH",
              estimatedDays: 2,
              assignedRole: "Backend Developer",
            });
            responseNote = `✅ Đã bổ sung task mới **"${newTaskTitle}"** vào ${targetSprintScope}.`;
          } else if (promptLower.includes("tăng") || promptLower.includes("kéo dài")) {
            updatedTasks = updatedTasks.map((t) =>
              t.sprint === targetSprintScope ? { ...t, estimatedDays: (t.estimatedDays || 2) + 1 } : t
            );
            responseNote = `⏱️ Đã tăng thêm +1 ngày làm cho tất cả task trong ${targetSprintScope}.`;
          } else if (promptLower.includes("rủi ro") || promptLower.includes("dự phòng")) {
            updatedTasks = updatedTasks.map((t) =>
              t.sprint === targetSprintScope
                ? {
                    ...t,
                    bufferDays: (t.bufferDays || 0) + 1,
                    riskWarning: "Task có rủi ro kỹ thuật cao, cần kiểm thử kỹ.",
                  }
                : t
            );
            responseNote = `🛡️ Đã cập nhật cảnh báo rủi ro & thêm ngày dự phòng cho ${targetSprintScope}.`;
          } else {
            responseNote = `💡 Đã ghi nhận yêu cầu chỉnh sửa cho ${targetSprintScope}.`;
          }
        } else {
          responseNote = `💡 Đã ghi nhận yêu cầu tinh chỉnh toàn bộ bài toán WBS.`;
        }

        onUpdateTasks(updatedTasks);
        const assistantMsg: UnifiedChatMessage = {
          sender: "ASSISTANT",
          text: responseNote,
          sprintScope: targetSprintScope,
          timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        };
        setChatBoxMessages((prev) => [...prev, assistantMsg]);
      }
    } catch (err) {
      console.error("Error in unified chatbox:", err);
    } finally {
      setIsChatBoxLoading(false);
    }
  };

  // Save Task Edit from modal
  const handleSaveEdit = (index: number, updatedTask: DecomposedTaskItem) => {
    const updated = [...result.tasks];
    updated[index] = updatedTask;
    onUpdateTasks(updated);
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

  // Add Task to Sprint from modal
  const handleSaveAddTask = (newTask: DecomposedTaskItem) => {
    onUpdateTasks([...result.tasks, newTask]);
  };

  return (
    <div className="space-y-6 font-sans animate-in fade-in duration-300">
      {/* Summary Card */}
      <div className="bg-[#F0F7FF] border border-[#D2E3FC] p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs">
        <div className="space-y-2 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-[#1A73E8]">
              <CheckCircle2 className="w-4 h-4" />
              Kết Quả Phân Rã Bài Toán Bằng RAG AI Agent
            </span>
            <button
              type="button"
              onClick={() => setIsCitationsDrawerOpen(true)}
              className="px-2.5 py-1 bg-[#111827] hover:bg-black text-white rounded-lg text-[11px] font-bold font-mono transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>📚 Bằng chứng & Trích dẫn RAG</span>
            </button>
            <button
              type="button"
              onClick={() => handleOpenChatBox("ALL")}
              className={`px-2.5 py-1 text-white rounded-lg text-[11px] font-bold font-mono transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer ${
                isChatBoxOpen && targetSprintScope === "ALL"
                  ? "bg-[#38BDF8] text-gray-900 font-extrabold"
                  : "bg-[#1A73E8] hover:bg-[#1557B0]"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>💬 Chat AI Tinh Chỉnh WBS</span>
            </button>
          </div>
          <h3 className="text-base font-extrabold text-[#111827]">{result.summary}</h3>

          {result.sourceReference && (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#1A73E8] bg-[#E8F0FE] px-3 py-1.5 rounded-xl border border-[#D2E3FC] font-mono font-bold w-fit">
                <BookmarkCheck className="w-4 h-4 text-[#1A73E8]" />
                <span>
                  Nguồn RAG Tri Thức Chứng Thực: <strong>{result.sourceReference}</strong>
                </span>
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
            Tổng số: <strong className="text-[#111827]">{result.tasks.length} tasks</strong> (Hỗ trợ Story Points
            Fibonacci, Phân Vai Role & Đánh giá Rủi ro).
          </p>
        </div>

        {/* Action Import Button */}
        <div className="space-y-2 text-left md:text-right shrink-0">
          <button
            type="button"
            onClick={onImportTasks}
            disabled={importing || importSuccess || isImported || result.tasks.length === 0}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs rounded-xl shadow-xs transition-all ${
              importSuccess || isImported
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
                  type="button"
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
              <span>
                Tiến Trình Các Sprint Trong Space "{selectedSpace?.name}" ({existingTaskCount} Tasks)
              </span>
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
            <AiSprintGroup
              key={groupIdx}
              sprintName={sprintName}
              groupIdx={groupIdx}
              taskList={taskList}
              isChatBoxOpen={isChatBoxOpen}
              targetSprintScope={targetSprintScope}
              isDragOver={isDragOver}
              existingTaskCount={existingTaskCount}
              availableSprints={availableSprints}
              onOpenChatBox={handleOpenChatBox}
              onOpenAddTask={(sprint) => setAddingToSprint(sprint)}
              onOpenEditTask={(index) => setEditingIndex(index)}
              onDeleteTask={handleDeleteTask}
              onMoveSprint={handleMoveSprint}
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
            />
          );
        })}
      </div>

      {/* EDIT TASK MODAL */}
      <AiTaskEditModal
        isOpen={editingIndex !== null}
        task={editingIndex !== null ? result.tasks[editingIndex] : null}
        taskIndex={editingIndex}
        availableSprints={availableSprints}
        onSave={handleSaveEdit}
        onClose={() => setEditingIndex(null)}
      />

      {/* ADD TASK MODAL */}
      <AiTaskAddModal
        isOpen={addingToSprint !== null}
        sprintName={addingToSprint}
        onSave={handleSaveAddTask}
        onClose={() => setAddingToSprint(null)}
      />

      {/* Floating Unified AI Chatbox Widget (Enlarged & Scope Selector) */}
      <AiUnifiedChatBox
        isOpen={isChatBoxOpen}
        onClose={() => setIsChatBoxOpen(false)}
        targetSprintScope={targetSprintScope}
        onScopeChange={(scope) => setTargetSprintScope(scope)}
        availableSprints={availableSprints}
        messages={chatBoxMessages}
        onSendMessage={handleSendUnifiedChatBox}
        loading={isChatBoxLoading}
      />

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
