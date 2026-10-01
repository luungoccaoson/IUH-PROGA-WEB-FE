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
  const [isMinimized, setIsMinimized] = useState(true);
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
      // Build detailed context of current space's sprints & tasks
      const sprintSummary = spaceSprints.length > 0
        ? spaceSprints.map((s) => {
          const sStart = s.startDate ? s.startDate.substring(0, 10) : "Chưa đặt";
          const sEnd = s.endDate ? s.endDate.substring(0, 10) : "Chưa đặt";
          return `- ${s.name} [ID: ${s.id}] [Trạng thái: ${s.status}] [Thời gian: ${sStart} đến ${sEnd}]`;
        }).join("\n")
        : "Chưa có Sprint nào.";

      const taskSummary = existingTasks.length > 0
        ? existingTasks.map((t, idx) => {
          const spName = spaceSprints.find((sp) => sp.id === t.sprintId)?.name || "Chưa gắn Sprint";
          return `- Task-${idx + 1} [Sprint: ${spName}] [Trạng thái: ${t.status}] ${t.title}`;
        }).join("\n")
        : "Chưa có công việc nào trong Space.";

      const promptWithContext = `[NGỮ CẢNH DỰ ÁN ĐANG DIỄN RA: ${space.name} (Space ID: ${space.id})]

=== DANH SÁCH SPRINT HIỆN CÓ TRONG SPACE ===
${sprintSummary}

=== DANH SÁCH CÔNG VIỆC HIỆN CÓ TRONG SPACE (Tổng: ${totalExistingTaskCount} công việc) ===
${taskSummary}

=== CÁC NGUYÊN TẮC RÀNG BUỘC KHI PHÂN RÃ TASK CHO SPACE NÀY ===
1. NẾU NGƯỜI DÙNG YÊU CẦU CHIA NHỎ / THÊM TASK VÀO SPRINT CỤ THỂ (ví dụ "Sprint 7"):
   - Hãy tìm Sprint đó trong danh sách Sprint hiện có ở trên:
     + NẾU SPRINT ĐÃ HOÀN THÀNH ('CLOSED'): CẢNH BÁO người dùng rằng Sprint này đã đóng và không thể thêm task vào. Đề xuất chuyển task sang Sprint Đang diễn ra ('ACTIVE') hoặc tạo Sprint Mới ('FUTURE').
     + NẾU SPRINT LÀ 'ACTIVE' HOẶC 'FUTURE': BẮT BUỘC gán trường "sprint" đúng tên của Sprint đó (ví dụ "Sprint 7"). TẬP TRUNG TỐI ĐA bóc tách task cho chính Sprint đó. TUYỆT ĐỐI KHÔNG TỰ Ý TẠO THÊM SPRINT MỚI, KHÔNG ĐỔI TÊN SPRINT!

2. QUY TẮC PHÂN TÁCH GIAI ĐOẠN & PHẠM VI NGHIỆP VỤ THỰC TẾ (REALISTIC AGILE SCOPE):
   - ĐÂY LÀ SPRINT PHÁT TRIỂN TÍNH NĂNG CHUYÊN BIỆT (Feature Sprint), KHÔNG PHẢI TOÀN BỘ QUY TRÌNH VÒNG ĐỜI DỰ ÁN (SDLC)!
   - BẮT BUỘC chỉ bóc tách các Task phát triển nghiệp vụ trực tiếp cho chủ đề của Sprint đó (Ví dụ với Sprint "Activity Log & Dashboard Thống kê Tiến độ": xây dựng Service & API ghi nhận event audit log, xây dựng API truy vấn dữ liệu thống kê tổng hợp, phát triển giao diện Timeline Audit Log, xây dựng các Widget biểu đồ Burndown/Velocity/Task Distribution, kết nối dữ liệu FE - BE).
   - TUYỆT ĐỐI KHÔNG GOM CẢ QUY TRÌNH (từ thiết kế Schema CSDL nền tảng đến Kiểm thử tự động E2E toàn hệ thống hay Đóng gói CI/CD/Docker) VÀO CHUNG MỘT SPRINT TÍNH NĂNG!
   - Lý do thực tế: Thiết kế CSDL/Schema hệ thống đã được thực hiện ở Sprint kiến trúc ban đầu. Kiểm thử toàn hệ thống (E2E Integration Testing), tối ưu hóa và đóng gói triển khai (CI/CD Pipeline, Docker) thuộc về Sprint Kiểm thử & Triển khai riêng biệt (như Sprint 8 đã có trong Space).
   - Mỗi task phải là một hạng mục công việc cụ thể, thực tế, làm trong 1 - 3 ngày của Sprint.

3. CHỈ KHI NGƯỜI DÙNG YÊU CẦU TẠO SPRINT MỚI: Mới đặt tên Sprint nối tiếp bắt đầu từ "Sprint ${nextSprintNum}".
4. ĐÁNH SỐ TASK NỐI TIẾP: Các task mới phát sinh tiếp tục nối số thứ tự từ Task-${totalExistingTaskCount + 1}, Task-${totalExistingTaskCount + 2}...
5. KHÔNG TRÙNG LẶP: Không tạo lại các tính năng đã có trong danh sách trên.

[YÊU CẦU CỦA NGƯỜI DÙNG]:
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
      // Helper function to add days
      const addDays = (dateStr: string, days: number): string => {
        const d = new Date(dateStr);
        d.setDate(d.getDate() + days);
        return d.toISOString().split("T")[0];
      };

      // Fetch existing sprints in this space
      const existingSprints = await sprintService.getSprintsBySpace(space.id);
      const activeSprint = existingSprints.find((s) => s.status === "ACTIVE");
      const futureSprints = existingSprints.filter((s) => s.status === "FUTURE");
      const sprintMap: Record<string, any> = {};

      // Helper to find matching existing sprint by exact name, sprint number (e.g. "Sprint 7"), or prefix
      const findExistingSprint = (rawSprintName: string): any | undefined => {
        if (!rawSprintName) return undefined;
        const cleanRaw = rawSprintName.trim().toLowerCase();
        const cleanPrefix = cleanRaw.split(":")[0].trim();

        // 1. Exact or prefix match
        let found = existingSprints.find((sp: any) => {
          const spClean = sp.name.trim().toLowerCase();
          const spPrefix = spClean.split(":")[0].trim();
          return spClean === cleanRaw || spPrefix === cleanPrefix || spClean.startsWith(cleanPrefix);
        });
        if (found) return found;

        // 2. Sprint number match (e.g., "Sprint 7" matches "Sprint 7: Activity Log & Dashboard...")
        const rawNumMatch = rawSprintName.match(/Sprint\s*(\d+)/i);
        if (rawNumMatch) {
          const sprintNum = rawNumMatch[1];
          found = existingSprints.find((sp: any) => {
            const spNumMatch = sp.name.match(/Sprint\s*(\d+)/i);
            return spNumMatch && spNumMatch[1] === sprintNum;
          });
          if (found) return found;
        }
        return undefined;
      };

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

      // Find latest end date among existing sprints to schedule new future sprints sequentially
      let latestExistingEndDate = space.endDate ? space.endDate.substring(0, 10) : new Date().toISOString().substring(0, 10);
      existingSprints.forEach((sp) => {
        if (sp.endDate) {
          const ed = sp.endDate.substring(0, 10);
          if (ed > latestExistingEndDate) {
            latestExistingEndDate = ed;
          }
        }
      });

      for (const item of result.tasks) {
        const rawSprintName = item.sprint || `Sprint ${nextSprintNum}`;
        const { name: cleanSprintName, goal: sprintGoal } = parseSprintHeader(
          rawSprintName,
          nextSprintNum
        );

        let targetSprint = findExistingSprint(rawSprintName) || sprintMap[cleanSprintName];

        // Ràng buộc trạng thái Sprint:
        // Nếu sprint đã đóng (CLOSED): Không được thêm task vào sprint đã đóng!
        if (targetSprint && targetSprint.status === "CLOSED") {
          console.warn(`Sprint ${targetSprint.name} đã đóng, tự động chuyển task '${item.title}' sang Sprint đang diễn ra.`);
          targetSprint = activeSprint || (futureSprints.length > 0 ? futureSprints[0] : undefined);
        }

        // Chỉ tạo sprint mới khi người dùng yêu cầu sprint hoàn toàn mới chưa có trong space
        if (!targetSprint) {
          try {
            const newSprintStart = addDays(latestExistingEndDate, 1);
            const newSprintEnd = addDays(newSprintStart, 13);
            latestExistingEndDate = newSprintEnd;

            targetSprint = await sprintService.createSprint({
              spaceId: space.id,
              name: cleanSprintName,
              goal: sprintGoal || `Sprint ${cleanSprintName} mở rộng phát triển từ phân tích AI Agent`,
              startDate: `${newSprintStart}T08:00:00`,
              endDate: `${newSprintEnd}T18:00:00`,
              status: "FUTURE",
            });
            sprintMap[cleanSprintName] = targetSprint;
          } catch (spErr) {
            console.error("Failed to create new sprint in backend DB:", spErr);
          }
        }

        const cleanedTitle = cleanTaskTitle(item.title);

        // Bounding task dates strictly within targetSprint's actual date range:
        const spStartStr = targetSprint?.startDate ? targetSprint.startDate.substring(0, 10) : new Date().toISOString().substring(0, 10);
        const spEndStr = targetSprint?.endDate ? targetSprint.endDate.substring(0, 10) : addDays(spStartStr, 13);

        const estDays = item.estimatedDays || 2;
        let taskDueStr = addDays(spStartStr, Math.max(1, estDays));
        if (taskDueStr > spEndStr) {
          taskDueStr = spEndStr;
        }

        const taskStartIso = `${spStartStr}T08:00:00`;
        const taskDueIso = `${taskDueStr}T18:00:00`;

        const richDescription = `[AI Decomposed - Role: ${item.assignedRole || "Developer"}] (Ước tính: ${item.estimatedDays || 2} ngày làm việc${item.bufferDays ? ` + ${item.bufferDays} ngày dự phòng` : ""})
${item.suggestedMemberName ? `👤 Phân công cho: ${item.suggestedMemberName}\n` : ""}${item.description || ""}${item.riskWarning ? `\n⚠️ Cảnh báo rủi ro: ${item.riskWarning}` : ""}`;

        const normalizePriority = (priority?: string): "LOW" | "MEDIUM" | "HIGH" | "URGENT" => {
          if (!priority) return "MEDIUM";
          const p = priority.toUpperCase().trim();
          if (p === "URGENT" || p.includes("KHẨN")) return "URGENT";
          if (p === "HIGH" || p.includes("CAO")) return "HIGH";
          if (p === "LOW" || p.includes("THẤP")) return "LOW";
          return "MEDIUM";
        };

        await taskService.createTask({
          spaceId: space.id,
          sprintId: targetSprint ? targetSprint.id : undefined,
          title: cleanedTitle,
          description: richDescription,
          priority: normalizePriority(item.priority),
          status: "TODO",
          startDate: taskStartIso,
          dueDate: taskDueIso,
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

  if (!isOpen || !space) return null;

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-[9999] font-sans">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 px-3.5 py-2.5 bg-[#111827] text-white hover:bg-black rounded-2xl shadow-2xl border border-gray-700 text-xs font-extrabold transition-all cursor-pointer animate-in zoom-in-95 hover:scale-105"
        >
          <Bot className="w-4 h-4 text-[#10B981]" />
          <span>AI Hỗ Trợ Space</span>
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
        </button>
      </div>
    );
  }

  return (
    <div
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      className="fixed bottom-4 right-4 z-[9999] w-full sm:w-[1100px] max-w-[95vw] h-[700px] max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-gray-300 flex flex-col font-sans overflow-hidden animate-in slide-in-from-bottom-5 duration-300"
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
              <span>AI Phân Rã Task</span>
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
            <X className="w-4 h-4" />
            {/* <span className="text-sm font-extrabold font-mono leading-none">−</span> */}
          </button>

          {/* <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white transition-all cursor-pointer"
            title="Đóng AI Co-Pilot"
          >
            <X className="w-4 h-4" />
          </button> */}
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
              startDate={space.startDate ? space.startDate.split("T")[0] : new Date().toISOString().split("T")[0]}
            />
          </div>
        )}
      </div>
    </div>
  );
}
