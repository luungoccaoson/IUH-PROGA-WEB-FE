"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Bot, Sparkles, RefreshCw, GripHorizontal } from "lucide-react";
import { workspaceService } from "@/services/workspace.service";
import { sprintService } from "@/services/sprint.service";
import { taskService } from "@/services/task.service";
import { aiService, AiChatMessageResponse, TaskDecompositionResponse, DecomposedTaskItem } from "@/services/ai.service";
import { AiChatWindow } from "../ai/AiChatWindow";
import { AiDecomposedResults } from "../ai/AiDecomposedResults";
import { Space, Task, Sprint } from "@/types";

interface SpaceAiCopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  space: Space;
  workspaceId: number;
  existingTasks?: Task[];
}

export function SpaceAiCopilotDrawer({
  isOpen,
  onClose,
  space,
  workspaceId,
  existingTasks = [],
}: SpaceAiCopilotDrawerProps) {
  const [messages, setMessages] = useState<AiChatMessageResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);
  const [result, setResult] = useState<TaskDecompositionResponse | null>(null);
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [isImported, setIsImported] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [spaceSprints, setSpaceSprints] = useState<Sprint[]>([]);

  // Position Dragging State
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const STORAGE_KEY = `proga_ai_space_copilot_${space.id}`;

  // Load existing Sprints for this Space
  useEffect(() => {
    if (!space.id) return;
    sprintService.getSprintsBySpace(space.id).then((sprints) => {
      setSpaceSprints(sprints);
    }).catch((e) => console.warn("Could not load sprints for AI copilot:", e));
  }, [space.id]);

  // Header Drag Handler
  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  // 60fps Butter-Smooth Dragging Listener
  useEffect(() => {
    if (!isDragging) return;

    document.body.style.userSelect = "none";
    let animationFrameId: number;

    const handleMouseMove = (e: MouseEvent) => {
      animationFrameId = requestAnimationFrame(() => {
        setPosition({
          x: e.clientX - dragStartRef.current.x,
          y: e.clientY - dragStartRef.current.y,
        });
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
    };
  }, [isDragging]);

  // Restore chat session for this specific space from localStorage
  useEffect(() => {
    if (!isOpen) return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.messages) setMessages(parsed.messages);
        if (parsed.result) setResult(parsed.result);
        if (parsed.activeThreadId) setActiveThreadId(parsed.activeThreadId);
      }
    } catch (e) {
      console.warn("Could not restore space copilot session:", e);
    }
  }, [isOpen, space.id]);

  // Persist session to localStorage
  useEffect(() => {
    if (messages.length > 0 || result) {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ messages, result, activeThreadId })
        );
      } catch (e) {
        console.warn("Could not save space copilot session:", e);
      }
    }
  }, [messages, result, activeThreadId, space.id]);

  // Compute existing Sprints & Task metadata for ongoing space
  let maxExistingSprintNum = 0;
  const sprintTaskCountMap: Record<string, { status: string; count: number }> = {};

  // Seed with fetched sprints
  spaceSprints.forEach((sp) => {
    sprintTaskCountMap[sp.name] = { status: sp.status || "ACTIVE", count: 0 };
    const match = sp.name.match(/\d+/);
    if (match) {
      const num = parseInt(match[0], 10);
      if (num > maxExistingSprintNum) maxExistingSprintNum = num;
    }
  });

  existingTasks.forEach((t) => {
    const matchedSprint = spaceSprints.find((sp) => sp.id === t.sprintId);
    const spName = matchedSprint?.name || "Sprint 1";
    const spStatus = matchedSprint?.status || "ACTIVE";

    if (!sprintTaskCountMap[spName]) {
      sprintTaskCountMap[spName] = { status: spStatus, count: 0 };
    }
    sprintTaskCountMap[spName].count += 1;
  });

  if (maxExistingSprintNum === 0 && (spaceSprints.length > 0 || existingTasks.length > 0)) {
    maxExistingSprintNum = Math.max(1, spaceSprints.length);
  }

  const nextSprintNum = maxExistingSprintNum > 0 ? maxExistingSprintNum + 1 : 1;
  const totalExistingTaskCount = existingTasks.length;

  const existingSprintsSummary = Object.entries(sprintTaskCountMap).map(([name, data]) => ({
    name,
    status: data.status,
    taskCount: data.count,
  }));

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsgObj: AiChatMessageResponse = {
      id: Date.now(),
      threadId: activeThreadId || 0,
      senderType: "USER",
      messageContent: text.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsgObj]);
    setLoading(true);

    try {
      // Build detailed context of current space's tasks for ongoing space
      const taskSummary = existingTasks.length > 0
        ? existingTasks.map((t, idx) => {
            const spName = spaceSprints.find((sp) => sp.id === t.sprintId)?.name || "Sprint 1";
            return `- Task-${idx + 1} [Sprint: ${spName}] [Trạng thái: ${t.status}] ${t.title}`;
          }).join("\n")
        : "Chưa có công việc nào trong Space.";

      const promptWithContext = `[NGỮ CẢNH DỰ ÁN ĐANG DIỄN RA: ${space.name} (Space ID: ${space.id})]

=== THÔNG TIN SPRINT & TASK HIỆN CÓ TRONG SPACE ===
- Tổng số Task đang có trong Space: ${totalExistingTaskCount} công việc.
- Sprint cao nhất hiện có trong Space: Sprint ${maxExistingSprintNum || 1}.
- Sprint MỚI TIẾP THEO BẮT BUỘC ĐẶT TÊN LÀ: "Sprint ${nextSprintNum}".

Danh sách tất cả công việc ĐÃ VÀ ĐANG CÓ trong Space (KHÔNG ĐƯỢC TẠO TRÙNG LẶP):
${taskSummary}

=== CÁC QUY TẮC NỐI TIẾP BẮT BUỘC (STRICT MANDATORY RULES) ===
1. QUY TẮC SPRINT N+1: Các Sprint mới tạo ra BẮT BUỘC phải đặt tên từ "Sprint ${nextSprintNum}", "Sprint ${nextSprintNum + 1}"... KHÔNG ĐƯỢC ĐẶT TÊN LÀ "Sprint 1", "Sprint 2" HAY ĐỤNG VÀO CÁC SPRINT ĐANG DIỄN RA CŨ!
2. ĐÁNH SỐ TASK NỐI TIẾP: Các task mới phát sinh phải tiếp tục nối số thứ tự từ Task-${totalExistingTaskCount + 1}, Task-${totalExistingTaskCount + 2}...
3. KHÔNG TRÙNG LẶP: Đọc kỹ danh sách ${totalExistingTaskCount} task ở trên. Tuyệt đối KHÔNG tạo lại các tính năng đã có. Chỉ bóc tách các module/giai đoạn tiếp theo.

[YÊU CẦU ĐÀM THOẠI CỦA NGƯỜI DÙNG]:
${text.trim()}`;

      const data = await aiService.decomposeRequirements(space.id, promptWithContext, activeThreadId);
      setResult(data.tasks && data.tasks.length > 0 ? data : null);
      setActiveThreadId(data.threadId);
      setIsImported(false);
      setImportSuccess(false);

      const assistantMsgObj: AiChatMessageResponse = {
        id: Date.now() + 1,
        threadId: data.threadId,
        senderType: "ASSISTANT",
        messageContent: data.summary,
        jsonPayload: JSON.stringify(data.tasks),
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsgObj]);
    } catch (err) {
      console.error("Error in Space AI Copilot:", err);
    } finally {
      setLoading(false);
    }
  };

  // Import Decomposed Tasks into Space DB
  const handleImportTasks = async () => {
    if (!result || !result.tasks || result.tasks.length === 0) return;
    setImporting(true);
    try {
      // Fetch existing sprints in this space
      const existingSprints = await sprintService.getSprintsBySpace(space.id);
      const sprintMap: Record<string, any> = {};
      existingSprints.forEach((sp: any) => {
        sprintMap[sp.name] = sp;
      });

      const parseSprintHeader = (raw: string, fallbackNum: number) => {
        if (!raw) return { name: `Sprint ${fallbackNum}`, goal: "" };
        const parts = raw.split(":");
        let name = parts[0].trim();
        if (name.length > 30) name = name.substring(0, 30);
        const goal = parts.length > 1 ? parts.slice(1).join(":").trim() : "";
        return { name, goal };
      };

      const cleanTaskTitle = (title: string) => {
        if (!title) return "Công việc mới";
        return title.replace(/^Task-\d+\s*:\s*/i, "").trim();
      };

      for (const item of result.tasks) {
        const { name: cleanSprintName, goal: sprintGoal } = parseSprintHeader(
          item.sprint || `Sprint ${nextSprintNum}`,
          nextSprintNum
        );

        let targetSprint = sprintMap[cleanSprintName];

        if (!targetSprint) {
          try {
            const todayIso = `${new Date().toISOString().split("T")[0]}T00:00:00`;
            const futureIso = `${new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}T23:59:59`;

            targetSprint = await sprintService.createSprint({
              spaceId: space.id,
              name: cleanSprintName,
              goal: sprintGoal || `Sprint ${cleanSprintName} nối tiếp được khởi tạo tự động bởi AI Co-Pilot`,
              startDate: todayIso,
              endDate: futureIso,
              status: "FUTURE",
            });
            sprintMap[cleanSprintName] = targetSprint;
          } catch (spErr) {
            console.error("Failed to create new sprint in backend DB:", spErr);
          }
        }

        const cleanedTitle = cleanTaskTitle(item.title);
        const richDescription = `[AI Decomposed - Role: ${item.assignedRole || "Developer"}] (Ước tính: ${item.estimatedDays || 2} ngày làm việc${item.bufferDays ? ` + ${item.bufferDays} ngày dự phòng` : ""})
${item.suggestedMemberName ? `👤 Phân công cho: ${item.suggestedMemberName}\n` : ""}${item.description}${item.riskWarning ? `\n⚠️ Cảnh báo rủi ro: ${item.riskWarning}` : ""}`;

        await taskService.createTask({
          spaceId: space.id,
          sprintId: targetSprint ? targetSprint.id : undefined,
          title: cleanedTitle,
          description: richDescription,
          priority: item.priority,
          status: "TODO",
        });
      }

      setImportSuccess(true);
      setIsImported(true);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("space_tasks_updated"));
      }
    } catch (err: any) {
      console.error("Error importing tasks into Space:", err);
      alert("Không thể tự động nạp Task vào Space. Vui lòng thử lại.");
    } finally {
      setImporting(false);
    }
  };

  const handleUpdateTasks = (updatedTasks: DecomposedTaskItem[]) => {
    if (!result) return;
    setResult({ ...result, tasks: updatedTasks });
    setIsImported(false);
  };

  const handleNewSession = () => {
    setMessages([]);
    setResult(null);
    setActiveThreadId(null);
    setIsImported(false);
    setImportSuccess(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) { }
  };

  if (!isOpen) return null;

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-[9999] font-sans">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2.5 px-4 py-3 bg-[#111827] text-white hover:bg-black rounded-2xl shadow-2xl border border-gray-700 text-xs font-extrabold transition-all cursor-pointer animate-in zoom-in-95"
        >
          <Bot className="w-4 h-4 text-[#10B981]" />
          <span>🤖 AI Co-Pilot ({space.name})</span>
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
        </button>
      </div>
    );
  }

  return (
    <div
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      className="fixed bottom-4 right-4 z-[9999] w-full sm:w-[740px] max-w-[95vw] h-[600px] max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-gray-300 flex flex-col font-sans overflow-hidden animate-in slide-in-from-bottom-5 duration-300"
    >
      {/* Draggable Header */}
      <div
        onMouseDown={handleHeaderMouseDown}
        className="p-3.5 bg-[#111827] text-white flex items-center justify-between border-b border-gray-800 shrink-0 cursor-grab active:cursor-grabbing select-none"
        title="Kéo giữ để di chuyển cửa sổ AI Co-Pilot tới vị trí bất kỳ"
      >
        <div className="flex items-center gap-3">
          <GripHorizontal className="w-4 h-4 text-gray-400 shrink-0" />
          <div className="w-8 h-8 rounded-xl bg-[#10B981] text-white flex items-center justify-center font-bold shrink-0">
            <Bot className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold flex items-center gap-2">
              <span>🤖 AI Co-Pilot Phân Rã & Đánh Giá Rủi Ro</span>
            </h3>
            <p className="text-[10px] text-gray-300">
              Dự án: <span className="font-bold text-[#A7F3D0]">{space.name}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleNewSession}
            className="flex items-center gap-1 px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-[11px] font-bold text-white transition-all cursor-pointer"
            title="Bắt đầu đàm thoại mới cho Space này"
          >
            <RefreshCw className="w-3 h-3 text-[#FBBF24]" />
            <span>Tạo Phiên Mới</span>
          </button>

          <button
            onClick={() => setIsMinimized(true)}
            className="p-1.5 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white transition-all cursor-pointer"
            title="Thu nhỏ cửa sổ"
          >
            <span className="text-sm font-extrabold font-mono leading-none">−</span>
          </button>

          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white transition-all cursor-pointer"
            title="Đóng AI Co-Pilot"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Drawer Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-[#FAFAFA]">
        {/* Context Info Banner */}
        <div className="p-3 bg-[#F0F7FF] border border-[#D2E3FC] rounded-xl text-xs text-[#1A73E8] space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            <span>AI Co-Pilot đang hoạt động trực tiếp trong Space "{space.name}"</span>
          </p>
          <p className="text-[11px] text-[#3C4043] leading-relaxed">
            Tự động nối tiếp các Sprint tương lai (Sprint N+1), đánh giá rủi ro cho công việc chưa thực hiện và KHÔNG đụng vào Sprint đang diễn ra.
          </p>
        </div>

        {/* Chat Window */}
        <AiChatWindow
          messages={messages}
          onSendMessage={handleSendMessage}
          loading={loading}
        />

        {/* Decomposed Tasks Results Canvas */}
        {result && (
          <div className="pt-4 border-t border-[#E5E7EB] space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#111827]">
              📋 Kết Quả Phân Rã Task Mới Nối Tiếp
            </h4>
            <AiDecomposedResults
              result={result}
              targetMode="EXISTING_SPACE"
              selectedSpace={space}
              newSpaceName=""
              workspaceId={workspaceId}
              selectedSpaceId={space.id}
              createdSpaceId={null}
              onImportTasks={handleImportTasks}
              importing={importing}
              importSuccess={importSuccess}
              isImported={isImported}
              members={[]}
              onUpdateTasks={handleUpdateTasks}
              existingTaskCount={totalExistingTaskCount}
              existingSprintsSummary={existingSprintsSummary}
            />
          </div>
        )}
      </div>
    </div>
  );
}
