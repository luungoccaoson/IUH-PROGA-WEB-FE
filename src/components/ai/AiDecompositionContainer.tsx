"use client";

import React, { useState, useEffect } from "react";
import { Bot } from "lucide-react";
import { aiService, TaskDecompositionResponse, DecomposedTaskItem } from "@/services/ai.service";
import { taskService } from "@/services/task.service";
import { sprintService } from "@/services/sprint.service";
import { workspaceService } from "@/services/workspace.service";
import { Space, Sprint } from "@/types";
import { AiHeaderBanner, TargetMode } from "./AiHeaderBanner";
import { AiRequirementInput } from "./AiRequirementInput";
import { AiDecomposedResults } from "./AiDecomposedResults";
import { AiClarificationModal, ClarificationAnswers } from "./AiClarificationModal";

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

  // Modal Clarification Board Meeting State
  const [isClarificationOpen, setIsClarificationOpen] = useState(false);

  // Import State
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);

  // F5 Proof Persistence: Restore latest thread conversation & decomposition payload on mount/space change
  useEffect(() => {
    async function restoreLatestDecomposition() {
      if (!selectedSpaceId) return;
      try {
        const threads = await aiService.getThreadsBySpace(selectedSpaceId);
        const reqThread = threads.find((t) => t.agentType === "REQUIREMENT") || threads[0];

        if (reqThread) {
          const messages = await aiService.getThreadMessages(reqThread.id);
          const assistantMsgsWithPayload = messages.filter(
            (m) => m.senderType === "ASSISTANT" && m.jsonPayload && m.jsonPayload.trim().startsWith("[")
          );

          if (assistantMsgsWithPayload.length > 0) {
            const latestMsg = assistantMsgsWithPayload[assistantMsgsWithPayload.length - 1];
            const parsedTasks = JSON.parse(latestMsg.jsonPayload!) as DecomposedTaskItem[];
            setResult({
              threadId: reqThread.id,
              summary: latestMsg.messageContent,
              sourceReference: "Tri thức RAG đã khôi phục từ Lịch Sử Hội Thoại",
              tasks: parsedTasks,
            });
          }
        }
      } catch (err) {
        console.warn("Could not restore thread history on mount:", err);
      }
    }

    restoreLatestDecomposition();
  }, [selectedSpaceId]);

  const handleDecompose = async (textToSubmit?: string) => {
    const text = textToSubmit || requirementText;
    if (!text.trim()) return;

    if (targetMode === "NEW_SPACE" && !newSpaceName.trim()) {
      setError("Vui lòng nhập tên Dự Án (Space) Mới cần khởi tạo.");
      return;
    }

    const contextSpaceId = selectedSpaceId || (spaces.length > 0 ? spaces[0].id : 1);

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

      const data = await aiService.decomposeRequirements(contextSpaceId, finalPromptText);
      setResult(data);
    } catch (err: any) {
      console.error("Error decomposing requirements:", err);
      setError("Không thể phân rã bài toán. Vui lòng kiểm tra kết nối AI-Service.");
    } finally {
      setLoading(false);
    }
  };

  // Update tasks in state (CRUD / Move)
  const handleUpdateTasks = (updatedTasks: DecomposedTaskItem[]) => {
    setResult((prev) => (prev ? { ...prev, tasks: updatedTasks } : null));
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

          const richDescription = `[AI Decomposed - Role: ${item.recommendedRole || "Developer"}] (Story Points: ${item.storyPoints || 3} SP)
${item.description}
💡 Lý do đánh giá: ${item.reasoning || "Dựa trên tiêu chuẩn WBS"}
⚠️ Phương án dự phòng rủi ro: ${item.contingencyPlan || "Sử dụng tài liệu chuẩn"}`;

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

          const richDescription = `[AI Decomposed - Role: ${item.recommendedRole || "Developer"}] (Story Points: ${item.storyPoints || 3} SP)
${item.description}
💡 Lý do đánh giá: ${item.reasoning || "Dựa trên tiêu chuẩn WBS"}
⚠️ Phương án dự phòng rủi ro: ${item.contingencyPlan || "Sử dụng tài liệu chuẩn"}`;

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
    } catch (err: any) {
      console.error("Error importing tasks:", err);
      alert("Không thể tự động nạp Task vào Space. Vui lòng thử lại.");
    } finally {
      setImporting(false);
    }
  };

  const handleClarificationSubmit = (answers: ClarificationAnswers) => {
    setIsClarificationOpen(false);
    const scopePrompt = `
[THỐNG NHẤT QUY MÔ & PHẠM VI HỌP BAN QUẢN LÝ (BOARD MEETING SPECIFICATION)]
- Quy mô Nhân sự & Team: ${answers.teamScope}
- Yêu cầu Bảo mật & Tiêu chuẩn: ${answers.securityScope}
- Hạ tầng System & Deployment: ${answers.infraScope}
- Phương án Dự phòng Rủi ro: ${answers.contingencyScope}
- Ghi chú bổ sung của Ban Giám Đốc: ${answers.customNotes || "Không có"}

[YÊU CẦU BÓC TÁCH WBS TASK CHI TIẾT]
Nhiệm vụ: Dựa trên thống nhất phạm vi trên, hãy bóc tách các Task cụ thể kèm Story Points Fibonacci (1, 2, 3, 5, 8, 13) và Phân vai Role phù hợp cho bài toán:
${requirementText.trim()}
`;

    handleDecompose(scopePrompt);
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

      {/* 2. Requirement Input Form */}
      <AiRequirementInput
        requirementText={requirementText}
        setRequirementText={setRequirementText}
        onSubmit={() => handleDecompose()}
        onOpenClarificationModal={() => setIsClarificationOpen(true)}
        loading={loading}
        disabled={targetMode === "EXISTING_SPACE" && !selectedSpaceId}
        error={error}
      />

      {/* 3. Board Meeting Scope Clarification Modal */}
      <AiClarificationModal
        isOpen={isClarificationOpen}
        onClose={() => setIsClarificationOpen(false)}
        onSubmitAnswers={handleClarificationSubmit}
        loading={loading}
      />

      {/* 4. Loading Skeleton */}
      {loading && (
        <div className="bg-[#F9FAFB] border border-[#E5E7EB] p-8 rounded-2xl text-center space-y-4 animate-pulse">
          <Bot className="w-10 h-10 text-[#1A73E8] mx-auto animate-bounce" />
          <div className="space-y-2">
            <h3 className="font-extrabold text-sm text-[#111827]">Đang truy vấn Kho tri thức Vector RAG & Phân tích hiện trạng dự án...</h3>
            <p className="text-xs text-[#6B7280] font-mono">
              Requirement Agent đang đọc ngữ cảnh bài toán và bóc tách danh sách task tiếp theo...
            </p>
          </div>
        </div>
      )}

      {/* 5. Decomposed Results View */}
      {result && !loading && (
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
          onUpdateTasks={handleUpdateTasks}
        />
      )}
    </div>
  );
}
