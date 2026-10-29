"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Bot,
  Sparkles,
  RefreshCw,
  GripHorizontal,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  ListTodo,
  FileText,
  ShieldCheck,
  Play,
  Check,
  RotateCcw,
  BarChart3,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Clock,
} from "lucide-react";
import { workspaceService } from "@/services/workspace.service";
import { sprintService } from "@/services/sprint.service";
import { taskService } from "@/services/task.service";
import { aiService, AiChatMessageResponse, TaskDecompositionResponse, DecomposedTaskItem } from "@/services/ai.service";
import { AiChatWindow } from "../ai/AiChatWindow";
import { AiDecomposedResults } from "../ai/AiDecomposedResults";
import { Space, Task, Sprint, User } from "@/types";
import { SpaceRoleType } from "@/utils/roleAssignment";
import {
  evaluateTaskForAcceptance,
  recommendUnassignedTasksForMember,
  analyzeProjectAndMemberRisks,
  parseTaskDescriptionWithChecklist,
  serializeTaskDescriptionWithChecklist,
} from "@/utils/aiTaskAssistant";

type CopilotMode = "personal" | "risk" | "acceptance" | "decompose";

interface SpaceAiCopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  space: Space;
  workspaceId: number;
  existingTasks?: Task[];
  spaceRole?: SpaceRoleType;
  currentUser?: User | null;
  members?: User[];
  isTaskDrawerOpen?: boolean;
}

export function SpaceAiCopilotDrawer({
  isOpen,
  onClose,
  space,
  workspaceId,
  existingTasks = [],
  spaceRole = "PM",
  currentUser,
  members = [],
  isTaskDrawerOpen = false,
}: SpaceAiCopilotDrawerProps) {
  const isPM = spaceRole === "PM";
  const isAssistant = spaceRole === "ASSISTANT";
  const isCoordinator = spaceRole === "PM" || spaceRole === "ASSISTANT";

  const [activeMode, setActiveMode] = useState<CopilotMode>(
    spaceRole === "MEMBER" ? "personal" : "risk"
  );
  const [actionLoadingId, setActionLoadingId] = useState<number | string | null>(null);
  const [batchApproving, setBatchApproving] = useState(false);
  const [messages, setMessages] = useState<AiChatMessageResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);
  const [result, setResult] = useState<TaskDecompositionResponse | null>(null);
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [isImported, setIsImported] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [spaceSprints, setSpaceSprints] = useState<Sprint[]>([]);
  const [expandedMemberRiskId, setExpandedMemberRiskId] = useState<number | null>(null);

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

  // Lắng nghe sự kiện mở/đóng từ thanh SpaceHeader phía trên
  useEffect(() => {
    const handleToggle = () => {
      setIsMinimized((prev) => !prev);
    };
    window.addEventListener("toggle_space_ai_copilot", handleToggle);
    return () => {
      window.removeEventListener("toggle_space_ai_copilot", handleToggle);
    };
  }, []);

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

      // Theo dõi lịch trình của từng vai trò / người được gợi ý trong từng sprint để các task không bị trùng ngày bắt đầu
      const memberSprintCursor = new Map<string, { start: string; due: string }>();

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

        const assigneeKey = (item.suggestedMemberName || item.assignedRole || "general").toLowerCase().trim();
        const scheduleKey = `${targetSprint?.id || "sp"}-${assigneeKey}`;
        const prevSchedule = memberSprintCursor.get(scheduleKey);

        let taskStartStr = spStartStr;
        if (prevSchedule) {
          // Bắt buộc task sau phải bắt đầu SAU ngày bắt đầu của task trước (tối thiểu +1 ngày hoặc nối tiếp)
          const nextCandidate = prevSchedule.due;
          if (nextCandidate > prevSchedule.start && nextCandidate < spEndStr) {
            taskStartStr = nextCandidate;
          } else {
            const minNext = addDays(prevSchedule.start, 1);
            taskStartStr = minNext < spEndStr ? minNext : prevSchedule.start;
          }
        }

        const estDays = item.estimatedDays || 2;
        let taskDueStr = addDays(taskStartStr, Math.max(1, estDays));
        if (taskDueStr > spEndStr) {
          taskDueStr = spEndStr;
        }

        memberSprintCursor.set(scheduleKey, { start: taskStartStr, due: taskDueStr });

        const taskStartIso = `${taskStartStr}T08:00:00`;
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

  useEffect(() => {
    if (spaceRole === "MEMBER") {
      setActiveMode("personal");
    }
  }, [spaceRole]);

  // Quick Task Update helper for Personal AI, Risk AI & Acceptance AI
  const handleQuickTaskUpdate = async (
    task: Task,
    patch: {
      status?: Task["status"];
      priority?: Task["priority"];
      ownerId?: number;
      dueDate?: string;
      description?: string;
    }
  ) => {
    try {
      setActionLoadingId(task.id);
      const formatIso = (d?: string) => {
        if (!d) return undefined;
        return d.includes("T") ? d : `${d}T23:59:59`;
      };
      await taskService.updateTask(task.id, {
        spaceId: task.spaceId || space.id,
        sprintId: task.sprintId ?? null,
        title: task.title,
        description: patch.description !== undefined ? patch.description : (task.description ?? ""),
        status: patch.status || task.status,
        priority: patch.priority || task.priority,
        ownerId: patch.ownerId !== undefined ? patch.ownerId : task.ownerId,
        startDate: task.startDate,
        dueDate: patch.dueDate ? formatIso(patch.dueDate) : task.dueDate,
      });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("space_tasks_updated"));
      }
    } catch (err) {
      alert("Không thể cập nhật công việc. Vui lòng thử lại!");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Assistant confirms task verification
  const handleAssistantVerifyTask = async (task: Task) => {
    const parsed = parseTaskDescriptionWithChecklist(task.description);
    const updatedDesc = serializeTaskDescriptionWithChecklist(
      parsed.baseDescription,
      parsed.checklist,
      parsed.aiRationale,
      { assistantVerified: true, createdByUserId: parsed.createdByUserId }
    );
    await handleQuickTaskUpdate(task, { description: updatedDesc });
  };

  // Evaluate all IN_REVIEW tasks for Acceptance Tab
  const inReviewTasks = existingTasks.filter((t) => !t.isDeleted && t.status === "IN_REVIEW");
  const evaluatedInReview = inReviewTasks.map((t) => ({
    task: t,
    evalResult: evaluateTaskForAcceptance(t),
  }));
  const readyForApproveTasks = evaluatedInReview.filter((item) => item.evalResult.readyForApproval);

  const handleBatchApprovePassedTasks = async () => {
    if (!isPM || readyForApproveTasks.length === 0) return;
    try {
      setBatchApproving(true);
      for (const item of readyForApproveTasks) {
        const t = item.task;
        await taskService.updateTask(t.id, {
          spaceId: t.spaceId || space.id,
          sprintId: t.sprintId ?? null,
          title: t.title,
          description: t.description ?? "",
          status: "DONE",
          priority: t.priority,
          ownerId: t.ownerId,
          startDate: t.startDate,
          dueDate: t.dueDate,
        });
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("space_tasks_updated"));
      }
    } catch (err) {
      alert("Có lỗi khi duyệt hàng loạt!");
    } finally {
      setBatchApproving(false);
    }
  };

  // Step 3: Risk & Progress Analysis across project and members
  const riskAnalysis = analyzeProjectAndMemberRisks(existingTasks, members);

  // Personal AI recommendations for current user
  const skillMatchedUnassigned = recommendUnassignedTasksForMember(existingTasks, currentUser);
  const myActiveTasks = existingTasks
    .filter(
      (t) =>
        !t.isDeleted &&
        t.status !== "DONE" &&
        currentUser?.id &&
        (t.ownerId === currentUser.id || t.assignee?.id === currentUser.id)
    )
    .sort((a, b) => {
      const pWeight: Record<string, number> = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      return (pWeight[b.priority] || 1) - (pWeight[a.priority] || 1);
    });

  if (!isOpen || !space) return null;

  if (isMinimized) {
    // Tự động ẩn nút nổi ở góc dưới khi bảng chi tiết Task (TaskDetailDrawer) đang mở để không bao giờ che nút Lưu / Hoàn tác
    if (isTaskDrawerOpen) return null;

    return (
      <div className="fixed bottom-4 right-4 z-30 font-sans">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 px-3.5 py-2 border border-[#E5E7EB] bg-white hover:bg-gray-100 text-[#4B5563] hover:text-[#111827] rounded-xl shadow-lg text-xs font-bold transition-all cursor-pointer animate-in zoom-in-95"
          title="Mở bảng Trợ lý AI"
        >
          <Sparkles className="w-4 h-4 text-[#111827]" />
          <span>
            {spaceRole === "MEMBER"
              ? "Trợ lý AI Cá nhân"
              : `Trợ lý AI Dự án${inReviewTasks.length > 0 ? ` (${inReviewTasks.length} chờ duyệt)` : ""}`}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      className="fixed bottom-4 right-4 z-[9999] w-full sm:w-[1050px] max-w-[95vw] h-[680px] max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-gray-300 flex flex-col font-sans overflow-hidden animate-in slide-in-from-bottom-5 duration-300"
    >
      {/* Draggable Header with Role-Aware AI Mode Switcher */}
      <div
        onMouseDown={handleHeaderMouseDown}
        className="p-3 bg-[#111827] text-white flex flex-wrap items-center justify-between gap-2 border-b border-gray-800 shrink-0 cursor-grab active:cursor-grabbing select-none"
        title="Kéo giữ để di chuyển cửa sổ AI Co-Pilot"
      >
        <div className="flex items-center gap-2.5">
          <GripHorizontal className="w-4 h-4 text-gray-400 shrink-0" />
          <div className="w-7 h-7 rounded-xl bg-[#10B981] text-white flex items-center justify-center font-bold shrink-0">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold flex items-center gap-2">
              <span>Multi-AI Co-Pilot</span>
              <span className="px-2 py-0.5 rounded bg-white/15 text-[10px] font-mono text-[#A7F3D0]">
                {spaceRole}
              </span>
            </h3>
          </div>
        </div>

        {/* Mode Tabs inside Header */}
        <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl flex-wrap">
          <button
            type="button"
            onClick={() => setActiveMode("personal")}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeMode === "personal"
                ? "bg-white text-[#111827] shadow-2xs"
                : "text-gray-300 hover:text-white"
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Việc của tôi ({myActiveTasks.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode("risk")}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeMode === "risk"
                ? "bg-white text-[#111827] shadow-2xs"
                : "text-gray-300 hover:text-white"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>Tiến độ &amp; Rủi ro</span>
          </button>

          {isCoordinator && (
            <button
              type="button"
              onClick={() => setActiveMode("acceptance")}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeMode === "acceptance"
                  ? "bg-white text-[#111827] shadow-2xs"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Tổng hợp &amp; Duyệt ({inReviewTasks.length})</span>
            </button>
          )}

          {isCoordinator && (
            <button
              type="button"
              onClick={() => setActiveMode("decompose")}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeMode === "decompose"
                  ? "bg-white text-[#111827] shadow-2xs"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-[#FBBF24]" />
              <span>Phân rã Task</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {activeMode === "decompose" && (
            <button
              onClick={handleNewSession}
              className="flex items-center gap-1 px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-[11px] font-bold text-white transition-all cursor-pointer"
            >
              <RefreshCw className="w-3 h-3 text-[#FBBF24]" />
              <span>Phiên mới</span>
            </button>
          )}

          <button
            onClick={() => setIsMinimized(true)}
            className="p-1.5 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white transition-all cursor-pointer"
            title="Thu nhỏ"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Drawer Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FAFAFA]">
        {/* ====================================================================
            MODE 1: VIỆC CỦA TÔI (Gợi ý nhận việc khớp kỹ năng & Ưu tiên cá nhân)
            ==================================================================== */}
        {activeMode === "personal" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-in fade-in duration-150">
            {/* Left Column: Unassigned Tasks Matching Member's Skills */}
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between border-b border-[#F3F4F6] pb-2">
                <h4 className="text-xs font-extrabold text-[#111827] flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-[#1A73E8]" />
                  <span>Gợi ý việc trống đúng chuyên môn ({skillMatchedUnassigned.length})</span>
                </h4>
                <span className="text-[10px] font-mono text-[#6B7280]">
                  {currentUser?.jobTitle || "Member"}
                </span>
              </div>

              {skillMatchedUnassigned.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#9CA3AF] italic">
                  Không còn công việc trống nào trong Space.
                </div>
              ) : (
                <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                  {skillMatchedUnassigned.map((item) => (
                    <div
                      key={item.task.id}
                      className="p-3 rounded-xl border border-[#E5E7EB] hover:border-[#1A73E8] bg-[#F9FAFB] flex items-center justify-between gap-3 transition-all"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-white border border-[#E5E7EB] text-[#6B7280]">
                            Task-{item.task.id}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-[#E6F4EA] text-[#137333] font-mono text-[10px] font-bold">
                            Phù hợp {item.matchScore}%
                          </span>
                          <span className="text-[10px] text-[#6B7280] font-mono">
                            {item.matchReason}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-[#111827] truncate">
                          {item.task.title}
                        </p>
                      </div>

                      {currentUser?.id && (
                        <button
                          type="button"
                          disabled={actionLoadingId === item.task.id}
                          onClick={() =>
                            handleQuickTaskUpdate(item.task, { ownerId: currentUser.id })
                          }
                          className="px-3 py-1.5 rounded-xl bg-[#1A73E8] hover:bg-[#1557B0] text-white font-mono text-[10px] font-bold shrink-0 cursor-pointer"
                        >
                          {actionLoadingId === item.task.id ? "..." : "+ Nhận việc"}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Member's Priority Work Queue */}
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between border-b border-[#F3F4F6] pb-2">
                <h4 className="text-xs font-extrabold text-[#111827] flex items-center gap-1.5">
                  <ListTodo className="w-4 h-4 text-[#137333]" />
                  <span>Thứ tự ưu tiên việc của tôi ({myActiveTasks.length})</span>
                </h4>
              </div>

              {myActiveTasks.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#9CA3AF] italic">
                  Bạn chưa có công việc nào đang mở.
                </div>
              ) : (
                <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                  {myActiveTasks.map((t, idx) => (
                    <div
                      key={t.id}
                      className="p-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-1.5 py-0.5 rounded bg-[#111827] text-white font-mono text-[10px] font-bold">
                            #{idx + 1}
                          </span>
                          <span className="font-mono text-[10px] font-bold text-[#6B7280]">
                            Task-{t.id}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-mono text-[10px] font-bold">
                            {t.priority}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-[10px] font-bold">
                            {t.status === "TODO"
                              ? "Cần làm"
                              : t.status === "IN_PROGRESS"
                              ? "Đang làm"
                              : "Chờ duyệt"}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-[#111827] truncate">{t.title}</p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {t.status === "TODO" && (
                          <button
                            type="button"
                            disabled={actionLoadingId === t.id}
                            onClick={() => handleQuickTaskUpdate(t, { status: "IN_PROGRESS" })}
                            className="px-2.5 py-1.5 rounded-xl bg-[#1A73E8] hover:bg-[#1557B0] text-white font-mono text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Play className="w-3 h-3" />
                            <span>Bắt đầu</span>
                          </button>
                        )}
                        {t.status === "IN_PROGRESS" && (
                          <button
                            type="button"
                            disabled={actionLoadingId === t.id}
                            onClick={() =>
                              handleQuickTaskUpdate(t, {
                                status: isPM ? "DONE" : "IN_REVIEW",
                              })
                            }
                            className="px-2.5 py-1.5 rounded-xl bg-[#137333] hover:bg-[#0d5324] text-white font-mono text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3 h-3" />
                            <span>Hoàn thành</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ====================================================================
            MODE 2: BƯỚC 3 - AI ĐÁNH GIÁ TIẾN ĐỘ, RỦI RO & ĐỀ XUẤT ĐIỀU PHỐI
            ==================================================================== */}
        {activeMode === "risk" && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Project Health Summary Row */}
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs font-extrabold text-[#111827] uppercase font-mono">
                    Đánh giá Tiến độ &amp; Rủi ro Dự án
                  </h4>
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-extrabold border ${
                      riskAnalysis.riskLevel === "HIGH"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : riskAnalysis.riskLevel === "MEDIUM"
                        ? "bg-amber-50 text-amber-800 border-amber-300"
                        : "bg-[#E6F4EA] text-[#137333] border-[#CEE7D4]"
                    }`}
                  >
                    {riskAnalysis.riskLevel === "HIGH"
                      ? "🔴 "
                      : riskAnalysis.riskLevel === "MEDIUM"
                      ? "🟡 "
                      : "🟢 "}
                    {riskAnalysis.riskLabel}
                  </span>
                </div>
                <p className="text-xs text-[#4B5563]">{riskAnalysis.riskSummary}</p>
              </div>

              <div className="flex items-center gap-3 text-center font-mono text-xs">
                <div className="px-3 py-1.5 rounded-xl bg-[#E6F4EA] text-[#137333] border border-[#CEE7D4]">
                  <p className="text-[10px] font-semibold">Đã xong</p>
                  <p className="font-extrabold">{riskAnalysis.doneTasks}/{riskAnalysis.totalTasks}</p>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
                  <p className="text-[10px] font-semibold">Chờ duyệt</p>
                  <p className="font-extrabold">{riskAnalysis.inReviewTasks}</p>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-red-50 text-red-700 border border-red-200">
                  <p className="text-[10px] font-semibold">Trễ hạn</p>
                  <p className="font-extrabold">{riskAnalysis.overdueTasks}</p>
                </div>
              </div>
            </div>

            {/* SECTION 1: DANH SÁCH ĐIỂM NGHẼN & RỦI RO CỤ THỂ (Rủi ro ở đâu & Tại sao rủi ro?) */}
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <h4 className="text-xs font-extrabold text-[#111827] uppercase font-mono">
                    Danh sách Điểm nghẽn &amp; Công việc Rủi ro ({riskAnalysis.riskItems.length})
                  </h4>
                </div>
                <span className="text-[11px] text-[#6B7280]">
                  Chỉ rõ công việc nào đang chậm trễ và nguyên nhân rủi ro
                </span>
              </div>

              {riskAnalysis.riskItems.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-[#CEE7D4] bg-[#E6F4EA]/40 text-center text-xs text-[#137333] font-medium flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Không có công việc nào bị trễ hạn hoặc có nguy cơ cao trong dự án.</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {riskAnalysis.riskItems.map((item) => {
                    const sprint = spaceSprints.find((sp) => sp.id === item.task.sprintId);
                    return (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] hover:bg-white transition-colors flex flex-wrap items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-[11px] font-extrabold px-1.5 py-0.5 rounded bg-gray-100 text-gray-800 border border-gray-200">
                              Task-{item.task.id}
                            </span>
                            <span className="font-bold text-[#111827] truncate max-w-[360px]" title={item.task.title}>
                              {item.task.title}
                            </span>
                            <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-extrabold border ${item.riskBadgeClass}`}>
                              {item.riskBadge}
                            </span>
                            {sprint && (
                              <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                {sprint.name}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#4B5563]">
                            <strong>Nguyên nhân rủi ro:</strong> {item.riskReason}
                          </p>
                        </div>

                        <div className="text-right shrink-0 font-mono text-[11px]">
                          <p className="text-[#6B7280]">Người phụ trách:</p>
                          <p className="font-bold text-[#111827]">{item.assigneeName}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SECTION 2 & 3: GRID 2 CỘT */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              {/* Member Progress & Workload Assessment (3/5 width) */}
              <div className="lg:col-span-3 bg-white border border-[#E5E7EB] rounded-2xl p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-[#111827] uppercase font-mono">
                    Tiến độ &amp; Khối lượng Công việc từng Thành viên ({riskAnalysis.memberProfiles.length})
                  </h4>
                  <span className="text-[10px] text-[#6B7280] italic">
                    (Bấm vào hàng để xem chi tiết task)
                  </span>
                </div>

                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {riskAnalysis.memberProfiles.map((mp) => {
                    const isExpanded = expandedMemberRiskId === mp.member.id;
                    return (
                      <div
                        key={mp.member.id}
                        className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] text-xs overflow-hidden transition-all"
                      >
                        <div
                          onClick={() => setExpandedMemberRiskId(isExpanded ? null : mp.member.id)}
                          className="p-3 flex flex-wrap items-center justify-between gap-3 cursor-pointer hover:bg-gray-100/70 transition-colors"
                        >
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-[#111827]">
                                {mp.member.fullName || mp.member.username}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold border ${
                                  mp.loadStatus === "OVERLOADED"
                                    ? "bg-red-50 text-red-700 border-red-200"
                                    : mp.loadStatus === "AVAILABLE"
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : "bg-[#E6F4EA] text-[#137333] border-[#CEE7D4]"
                                }`}
                              >
                                {mp.loadLabel}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#6B7280] truncate">
                              {mp.member.jobTitle || mp.member.email}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold" title="Đã hoàn thành">
                              Đã xong: {mp.doneCount}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold" title="Đang làm">
                              Đang làm: {mp.inProgressCount}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200 font-bold" title="Cần làm (chưa bắt đầu)">
                              Cần làm: {mp.todoCount}
                            </span>
                            {mp.overdueCount > 0 && (
                              <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 font-bold" title="Công việc bị trễ hạn">
                                ⚠️ Trễ: {mp.overdueCount}
                              </span>
                            )}
                            <button type="button" className="p-0.5 text-gray-400 hover:text-gray-600">
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        {/* Expandable list of unfinished tasks held by this member */}
                        {isExpanded && (
                          <div className="p-2.5 bg-white border-t border-[#E5E7EB] space-y-1.5">
                            <p className="text-[10px] font-mono font-bold uppercase text-gray-500 pb-1 border-b border-gray-100">
                              Các công việc chưa hoàn thành đang giữ ({mp.openTasksList.length}):
                            </p>
                            {mp.openTasksList.length === 0 ? (
                              <p className="text-[11px] text-gray-400 italic">Thành viên không còn công việc nào đang mở.</p>
                            ) : (
                              mp.openTasksList.map((ot) => (
                                <div
                                  key={ot.id}
                                  className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-gray-50 border border-gray-200 text-[11px]"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="font-mono font-bold text-gray-600 shrink-0">
                                      Task-{ot.id}
                                    </span>
                                    <span className="truncate text-gray-900 font-medium">{ot.title}</span>
                                  </div>
                                  <span
                                    className={`px-1.5 py-0.2 rounded font-mono text-[9px] font-bold shrink-0 ${
                                      ot.status === "IN_PROGRESS"
                                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                                        : "bg-gray-100 text-gray-700 border border-gray-200"
                                    }`}
                                  >
                                    {ot.status === "IN_PROGRESS" ? "Đang làm" : "Cần làm"}
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actionable AI Solutions (2/5 width) */}
              <div className="lg:col-span-2 bg-white border border-[#E5E7EB] rounded-2xl p-4 space-y-3 shadow-2xs">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-extrabold text-[#111827] uppercase font-mono flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#1A73E8]" />
                    <span>Giải pháp Điều phối Rủi ro ({riskAnalysis.suggestions.length})</span>
                  </h4>
                  <p className="text-[11px] text-[#6B7280]">
                    Đề xuất xử lý các điểm nghẽn và san sẻ việc quá tải
                  </p>
                </div>

                {riskAnalysis.suggestions.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#9CA3AF] italic">
                    Dự án đang cân bằng tốt, không có cảnh báo cần can thiệp.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                    {riskAnalysis.suggestions.map((sug) => (
                      <div
                        key={sug.id}
                        className="p-3 rounded-xl border border-[#D2E3FC] bg-[#F0F7FF]/60 space-y-2 text-xs"
                      >
                        <p className="font-bold text-[#111827]">{sug.title}</p>
                        
                        <div className="space-y-1 text-[11px]">
                          <p className="text-red-700">
                            <strong>• Vấn đề:</strong> {sug.problem}
                          </p>
                          <p className="text-blue-900">
                            <strong>• Giải pháp:</strong> {sug.solution}
                          </p>
                        </div>

                        {isCoordinator && (
                          <button
                            type="button"
                            disabled={actionLoadingId === sug.id}
                            onClick={async () => {
                              setActionLoadingId(sug.id);
                              if (
                                (sug.type === "REASSIGN" || sug.type === "ASSIGN_UNASSIGNED") &&
                                sug.targetMember
                              ) {
                                await handleQuickTaskUpdate(sug.task, {
                                  ownerId: sug.targetMember.id,
                                });
                              } else if (sug.type === "EXTEND_DUE" && sug.newDueDate) {
                                await handleQuickTaskUpdate(sug.task, {
                                  dueDate: sug.newDueDate,
                                });
                              } else if (sug.type === "PRIORITIZE_TASK") {
                                await handleQuickTaskUpdate(sug.task, {
                                  status: sug.newStatus || "IN_PROGRESS",
                                  priority: sug.newPriority || "URGENT",
                                });
                              }
                              setActionLoadingId(null);
                            }}
                            className="w-full py-1.5 px-3 bg-[#1A73E8] hover:bg-[#1557B0] text-white rounded-xl font-mono text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                          >
                            <span>{sug.actionLabel}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            MODE 3: BƯỚC 2 - TỔNG HỢP BÁO CÁO BÀN GIAO & DUYỆT TASK (PM & ASSISTANT)
            ==================================================================== */}
        {activeMode === "acceptance" && isCoordinator && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="p-4 bg-white border border-[#E5E7EB] rounded-2xl shadow-2xs flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-0.5">
                <h4 className="text-xs font-extrabold text-[#111827] uppercase font-mono">
                  Tổng hợp Công việc Chờ duyệt ({inReviewTasks.length})
                </h4>
                <p className="text-xs text-[#6B7280]">
                  {isAssistant
                    ? "Assistant kiểm tra kết quả thực hiện của thành viên và xác nhận đề xuất để PM duyệt."
                    : "Tổng hợp trạng thái hoàn thành bước làm và xác nhận từ Assistant để PM quyết định duyệt."}
                </p>
              </div>

              {isPM && readyForApproveTasks.length > 0 && (
                <button
                  type="button"
                  disabled={batchApproving}
                  onClick={handleBatchApprovePassedTasks}
                  className="px-4 py-2 bg-[#137333] hover:bg-[#0d5324] text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {batchApproving
                      ? "Đang duyệt..."
                      : `Duyệt nhanh các task đủ điều kiện (${readyForApproveTasks.length})`}
                  </span>
                </button>
              )}
            </div>

            {evaluatedInReview.length === 0 ? (
              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-10 text-center space-y-2">
                <CheckCircle2 className="w-9 h-9 text-[#10B981] mx-auto" />
                <p className="text-sm font-bold text-[#111827]">
                  Không có công việc nào đang ở trạng thái Chờ duyệt
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {evaluatedInReview.map(({ task: t, evalResult }) => {
                  const assigneeUser = members.find(
                    (m) => m.id === t.ownerId || m.id === t.assignee?.id
                  );
                  return (
                    <div
                      key={t.id}
                      className="p-3.5 rounded-2xl bg-white border border-[#E5E7EB] shadow-2xs flex flex-wrap items-center justify-between gap-3"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#F6F5EF] border border-[#E5E7EB] text-[#111827]">
                            Task-{t.id}
                          </span>
                          <span className="text-sm font-extrabold text-[#111827]">{t.title}</span>
                          <span className="text-xs text-[#6B7280]">
                            ({assigneeUser?.fullName || t.ownerName || "Thành viên"})
                          </span>
                        </div>

                        {/* Short Visual Pills */}
                        <div className="flex items-center gap-2 flex-wrap font-mono text-[10px] font-bold">
                          <span className="px-2 py-0.5 rounded bg-[#F9FAFB] border border-[#E5E7EB] text-[#111827]">
                            {evalResult.checklistLabel}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded border ${
                              evalResult.isOverdue
                                ? "bg-red-50 text-red-700 border-red-200"
                                : "bg-[#E6F4EA] text-[#137333] border-[#CEE7D4]"
                            }`}
                          >
                            {evalResult.timelineLabel}
                          </span>
                          {evalResult.assistantVerified ? (
                            <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200">
                              ✓ Assistant đã kiểm tra
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                              {evalResult.statusSummary}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isAssistant && !isPM && (
                          <button
                            type="button"
                            disabled={actionLoadingId === t.id || evalResult.assistantVerified}
                            onClick={() => handleAssistantVerifyTask(t)}
                            className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-60"
                          >
                            {evalResult.assistantVerified
                              ? "✓ Đã xác nhận"
                              : "✓ Xác nhận đạt"}
                          </button>
                        )}

                        {isPM && (
                          <button
                            type="button"
                            disabled={actionLoadingId === t.id}
                            onClick={() => handleQuickTaskUpdate(t, { status: "DONE" })}
                            className="px-3.5 py-1.5 bg-[#137333] hover:bg-[#0d5324] text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Duyệt Done</span>
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={actionLoadingId === t.id}
                          onClick={() => handleQuickTaskUpdate(t, { status: "IN_PROGRESS" })}
                          className="px-3 py-1.5 bg-white hover:bg-gray-100 text-[#4B5563] border border-[#D1D5DB] rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Sửa lại</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ====================================================================
            MODE 4: AI PHÂN RÃ TASK TỪ TÀI LIỆU (Dành cho PM & ASSISTANT)
            ==================================================================== */}
        {activeMode === "decompose" && isCoordinator && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <AiChatWindow
              messages={messages}
              onSendMessage={handleSendMessage}
              loading={loading}
            />

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
                  members={members.map((m) => m.fullName || m.email)}
                  onUpdateTasks={handleUpdateTasks}
                  existingTaskCount={totalExistingTaskCount}
                  existingSprintsSummary={existingSprintsSummary}
                  startDate={space.startDate ? space.startDate.split("T")[0] : new Date().toISOString().split("T")[0]}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
