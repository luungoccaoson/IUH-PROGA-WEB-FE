import React, { useState, useEffect } from "react";
import { Bot } from "lucide-react";
import { aiService, TaskDecompositionResponse, DecomposedTaskItem, AiThreadResponse, AiChatMessageResponse } from "@/services/ai.service";
import { taskService } from "@/services/task.service";
import { sprintService } from "@/services/sprint.service";
import { workspaceService } from "@/services/workspace.service";
import { Space, Sprint } from "@/types";
import { AiHeaderBanner, TargetMode } from "./AiHeaderBanner";
import { AiDecomposedResults } from "./AiDecomposedResults";
import { AiChatSidebarSessions, ChatSessionItem } from "./AiChatSidebarSessions";
import { AiChatWindow } from "./AiChatWindow";

interface AiDecompositionContainerProps {
  workspaceId: number;
  spaces: Space[];
}

export function AiDecompositionContainer({
  workspaceId,
  spaces,
}: AiDecompositionContainerProps) {
  const [targetMode, setTargetMode] = useState<TargetMode>("EXISTING_SPACE");
  const [selectedSpaceId, setSelectedSpaceId] = useState<number | null>(
    spaces.length > 0 ? spaces[0].id : null
  );
  const [newSpaceName, setNewSpaceName] = useState("");
  const [createdSpaceId, setCreatedSpaceId] = useState<number | null>(null);

  const [requirementText, setRequirementText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<TaskDecompositionResponse | null>(null);

  // ChatGPT-style Chat Sessions & Messages State
  const [sessions, setSessions] = useState<ChatSessionItem[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);
  const [messages, setMessages] = useState<AiChatMessageResponse[]>([]);
  const [isImported, setIsImported] = useState(false);
  const [membersList, setMembersList] = useState<string[]>([]);

  // Import State
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);

  // Load workspace members for Task Assignment Dropdown
  useEffect(() => {
    async function fetchMembers() {
      try {
        const members = await workspaceService.getWorkspaceMembers(workspaceId);
        const names = members.map((m: any) => m.fullName || m.email?.split("@")[0] || "Member");
        setMembersList(names);
      } catch (err) {
        console.warn("Could not load workspace members, fallback to default roles:", err);
      }
    }
    fetchMembers();
  }, [workspaceId]);

  // Load Chat Thread Sessions from Backend for selected Space
  const loadSpaceThreads = async () => {
    if (!selectedSpaceId) return;
    try {
      const threads = await aiService.getThreadsBySpace(selectedSpaceId);
      const requirementThreads = threads.filter((t) => t.agentType === "REQUIREMENT");

      const sessionItems: ChatSessionItem[] = [];

      for (const th of requirementThreads) {
        const threadMsgs = await aiService.getThreadMessages(th.id);
        const userMsg = threadMsgs.find((m) => m.senderType === "USER");
        const assistantMsgWithPayload = [...threadMsgs].reverse().find(
          (m) => m.senderType === "ASSISTANT" && m.jsonPayload && m.jsonPayload.trim().startsWith("[")
        );

        let taskCount = 0;
        if (assistantMsgWithPayload?.jsonPayload) {
          try {
            const tasks = JSON.parse(assistantMsgWithPayload.jsonPayload);
            taskCount = tasks.length;
          } catch (e) {}
        }

        const rawTitle = userMsg ? userMsg.messageContent.replace("Phân rã yêu cầu bài toán:\n", "") : `Phiên chat #${th.id}`;
        sessionItems.push({
          thread: th,
          title: rawTitle.length > 35 ? rawTitle.substring(0, 35) + "..." : rawTitle,
          taskCount,
          isImported: false,
        });
      }

      setSessions(sessionItems);
    } catch (err) {
      console.warn("Could not load space threads:", err);
    }
  };

  useEffect(() => {
    loadSpaceThreads();
  }, [selectedSpaceId]);

  // Load thread session details by thread ID
  const loadThreadSessionDetails = async (threadId: number) => {
    try {
      setActiveThreadId(threadId);
      setIsImported(false);
      setImportSuccess(false);
      const threadMsgs = await aiService.getThreadMessages(threadId);
      setMessages(threadMsgs);

      const assistantMsg = [...threadMsgs].reverse().find(
        (m) => m.senderType === "ASSISTANT" && m.jsonPayload && m.jsonPayload.trim().startsWith("[")
      );

      if (assistantMsg?.jsonPayload) {
        const parsedTasks = JSON.parse(assistantMsg.jsonPayload) as DecomposedTaskItem[];
        setResult({
          threadId: threadId,
          summary: assistantMsg.messageContent,
          sourceReference: "Kho tri thức RAG (Phục hồi từ phiên chat)",
          tasks: parsedTasks,
        });
      } else {
        setResult(null);
      }
    } catch (err) {
      console.error("Error loading thread details:", err);
    }
  };

  const handleDecompose = async (textToSubmit?: string) => {
    const text = textToSubmit || requirementText;
    if (!text.trim()) return;

    if (targetMode === "NEW_SPACE" && !newSpaceName.trim()) {
      setError("Vui lòng nhập tên Dự Án (Space) Mới cần khởi tạo.");
      return;
    }

    const contextSpaceId = selectedSpaceId || (spaces.length > 0 ? spaces[0].id : 1);

    // Optimistic UI: Append user message bubble immediately into chat feed!
    const userMsgOptimistic: AiChatMessageResponse = {
      id: Date.now(),
      threadId: activeThreadId || 0,
      senderType: "USER",
      messageContent: text.trim(),
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsgOptimistic]);

    try {
      setLoading(true);
      setError("");
      setImportSuccess(false);

      let finalPromptText = text.trim();

      // IF EXISTING SPACE MODE: Build smart project status report context for AI
      if (targetMode === "EXISTING_SPACE" && selectedSpaceId) {
        try {
          const existingTasks = await workspaceService.getTasksBySpace(selectedSpaceId);
          const existingSprints = await sprintService.getSprintsBySpace(selectedSpaceId);
          const selectedSpaceObj = spaces.find((s) => s.id === selectedSpaceId);

          const taskSummary =
            existingTasks.length > 0
              ? existingTasks.slice(-10).map((t) => `- ${t.title} [Status: ${t.status}]`).join("\n")
              : "Chưa có task nào.";

          const sprintSummary =
            existingSprints.length > 0
              ? existingSprints.map((s) => `- ${s.name} [Trạng thái: ${s.status}]`).join("\n")
              : "Sprint 0: Kickoff & Setup";

          finalPromptText = `[BÁO CÁO PHÂN TÍCH HIỆN TRẠNG DỰ ÁN DÀNH CHO AI AGENT]
- Dự án đang thực hiện: ${selectedSpaceObj?.name || "Space"}
- Danh sách Sprint hiện tại:
${sprintSummary}
- Các Task đang thực hiện / đã tạo gần đây:
${taskSummary}

[YÊU CẦU BÓC TÁCH VÀ MỞ RỘNG CÁC HẠNG MỤC CÔNG VIỆC TIẾP THEO]
Nhiệm vụ của AI Agent: Phân tích hiện trạng dự án trên và tiếp tục bóc tách danh sách các Task mở rộng tiếp theo cho bài toán sau:
${text.trim()}`;
        } catch (ctxErr) {
          console.warn("Could not load existing space context for AI, proceeding with text only:", ctxErr);
        }
      }

      const data = await aiService.decomposeRequirements(contextSpaceId, finalPromptText, activeThreadId);
      setResult(data.tasks && data.tasks.length > 0 ? data : null);
      setActiveThreadId(data.threadId);

      // Append Assistant Response bubble with JSON payload
      const assistantMsgObj: AiChatMessageResponse = {
        id: Date.now() + 1,
        threadId: data.threadId,
        senderType: "ASSISTANT",
        messageContent: data.summary,
        jsonPayload: JSON.stringify(data.tasks),
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsgObj]);
      loadSpaceThreads(); // Refresh sidebar sessions
    } catch (err: any) {
      console.error("Error decomposing requirements:", err);
      setError("Không thể phân rã bài toán. Vui lòng kiểm tra kết nối AI-Service.");
    } finally {
      setLoading(false);
    }
  };

  // Handle auto-importing tasks (Existing Space or Brand New Space)
  const handleImportTasks = async () => {
    if (!result || !result.tasks || result.tasks.length === 0) return;

    try {
      setImporting(true);
      setImportSuccess(false);

      if (targetMode === "NEW_SPACE") {
        if (!newSpaceName.trim()) {
          alert("Vui lòng nhập tên Dự Án (Space) Mới.");
          return;
        }

        // 1. Create a brand new Space in Workspace (creates default Sprint 0: Kickoff & Setup)
        const newSpace = await workspaceService.createSpace({
          workspaceId,
          name: newSpaceName.trim(),
        });
        setCreatedSpaceId(newSpace.id);

        // Dispatch real-time event for sidebar update (no page reload!)
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("space-created"));
        }

        // 2. Extract dynamic unique Sprint names from AI result (e.g. Sprint 1, Sprint 2...)
        const dynamicSprintMap: Record<string, Sprint> = {};
        const uniqueSprintNames = Array.from(
          new Set(result.tasks.map((t) => t.sprint || "Sprint 1"))
        ).sort();

        for (let i = 0; i < uniqueSprintNames.length; i++) {
          const rawName = uniqueSprintNames[i];
          const createdSprint = await sprintService.createSprint({
            spaceId: newSpace.id,
            name: rawName.includes(":") ? rawName : `${rawName}: Phân Rã AI`,
            goal: `Mục tiêu phát triển cho ${rawName}`,
            status: i === 0 ? "ACTIVE" : "FUTURE",
          });
          dynamicSprintMap[rawName] = createdSprint;
        }

        // 3. Populate tasks into their matching AI Created Sprints
        for (const item of result.tasks) {
          const rawSprint = item.sprint || uniqueSprintNames[0];
          const targetSprint = dynamicSprintMap[rawSprint] || dynamicSprintMap[uniqueSprintNames[0]];

          const richDescription = `[AI Decomposed - Role: ${item.assignedRole || "Developer"}] (Ước tính: ${item.estimatedDays || 2} ngày làm việc${item.bufferDays ? ` + ${item.bufferDays} ngày dự phòng` : ""})
${item.suggestedMemberName ? `👤 Phân công cho: ${item.suggestedMemberName}\n` : ""}${item.description}${item.riskWarning ? `\n⚠️ Cảnh báo rủi ro: ${item.riskWarning}` : ""}`;

          await taskService.createTask({
            spaceId: newSpace.id,
            sprintId: targetSprint ? targetSprint.id : undefined,
            title: item.title,
            description: richDescription,
            priority: item.priority,
            status: "TODO",
          });
        }
      } else {
        // EXISTING SPACE MODE: Smart Sprint Matching & Incremental Task Import
        if (!selectedSpaceId) {
          alert("Vui lòng chọn 1 Space có sẵn.");
          return;
        }

        const existingSprints = await sprintService.getSprintsBySpace(selectedSpaceId);
        const sprintMap: Record<string, Sprint> = {};

        // Map existing sprints
        existingSprints.forEach((sp) => {
          const match = sp.name.match(/Sprint\s+\d+/i);
          if (match) {
            sprintMap[match[0]] = sp;
          } else {
            sprintMap[sp.name] = sp;
          }
        });

        // For each decomposed task, put into matching existing Sprint or create new Sprint if needed
        for (const item of result.tasks) {
          const rawSprintName = item.sprint || "Sprint 1";
          let targetSprint = sprintMap[rawSprintName];

          // If matching sprint doesn't exist, create it for the space dynamically
          if (!targetSprint) {
            try {
              targetSprint = await sprintService.createSprint({
                spaceId: selectedSpaceId,
                name: `${rawSprintName}: Advanced Scope Extension`,
                goal: `Sprint mở rộng phát triển từ phân tích AI Agent`,
                status: "FUTURE",
              });
              sprintMap[rawSprintName] = targetSprint;
            } catch (spErr) {
              targetSprint = existingSprints[0];
            }
          }

          const richDescription = `[AI Decomposed - Role: ${item.assignedRole || "Developer"}] (Ước tính: ${item.estimatedDays || 2} ngày làm việc${item.bufferDays ? ` + ${item.bufferDays} ngày dự phòng` : ""})
${item.suggestedMemberName ? `👤 Phân công cho: ${item.suggestedMemberName}\n` : ""}${item.description}${item.riskWarning ? `\n⚠️ Cảnh báo rủi ro: ${item.riskWarning}` : ""}`;

          await taskService.createTask({
            spaceId: selectedSpaceId,
            sprintId: targetSprint ? targetSprint.id : undefined,
            title: item.title,
            description: richDescription,
            priority: item.priority,
            status: "TODO",
          });
        }
      }

      setImportSuccess(true);
      setIsImported(true);
    } catch (err: any) {
      console.error("Error importing tasks:", err);
      alert("Không thể tự động nạp Task vào Space. Vui lòng thử lại.");
    } finally {
      setImporting(false);
    }
  };

  // Update tasks in state (CRUD / Move / Edit)
  const handleUpdateTasks = (updatedTasks: DecomposedTaskItem[]) => {
    if (!result) return;
    setResult({ ...result, tasks: updatedTasks });
    setIsImported(false); // Enable Import button again when tasks are edited!
  };

  // Handle New Session
  const handleNewSession = () => {
    setActiveThreadId(null);
    setResult(null);
    setMessages([]);
    setRequirementText("");
    setIsImported(false);
    setImportSuccess(false);
  };

  const selectedSpace = spaces.find((s) => s.id === selectedSpaceId);

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Target Mode Selection */}
      <AiHeaderBanner
        spaces={spaces}
        targetMode={targetMode}
        setTargetMode={setTargetMode}
        selectedSpaceId={selectedSpaceId}
        onSelectSpace={setSelectedSpaceId}
        newSpaceName={newSpaceName}
        setNewSpaceName={setNewSpaceName}
        onSelectSamplePrompt={(text) => {
          setRequirementText(text);
          handleDecompose(text);
        }}
      />

      {/* 2. Interactive Text Chat Window */}
      <div className="w-full space-y-6">
        <AiChatWindow
          messages={messages}
          onSendMessage={(text: string) => handleDecompose(text)}
          loading={loading}
        />
      </div>

      {/* 3. SEPARATE TASK BREAKDOWN CANVAS SECTION */}
      {result && (
        <div className="pt-4 border-t border-[#E5E7EB] space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-[#111827] flex items-center gap-2">
              <span>📋 Bảng Kết Quả Phân Rã WBS Tasks Theo Sprint</span>
            </h3>
            <span className="text-xs text-[#6B7280]">
              Tự động cập nhật từ đàm thoại Chat AI (Kéo thả / Gán người làm / Nạp vào Space)
            </span>
          </div>

          <AiDecomposedResults
            result={result}
            targetMode={targetMode}
            selectedSpace={selectedSpace}
            newSpaceName={newSpaceName}
            workspaceId={workspaceId}
            selectedSpaceId={selectedSpaceId}
            createdSpaceId={createdSpaceId}
            onImportTasks={handleImportTasks}
            importing={importing}
            importSuccess={importSuccess}
            isImported={isImported}
            members={membersList}
            onUpdateTasks={handleUpdateTasks}
          />
        </div>
      )}
    </div>
  );
}
