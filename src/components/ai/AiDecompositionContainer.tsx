"use client";

import React, { useState } from "react";
import { Bot } from "lucide-react";
import { aiService, TaskDecompositionResponse, DecomposedTaskItem } from "@/services/ai.service";
import { taskService } from "@/services/task.service";
import { sprintService } from "@/services/sprint.service";
import { workspaceService } from "@/services/workspace.service";
import { Space, Sprint } from "@/types";
import { AiHeaderBanner, TargetMode } from "./AiHeaderBanner";
import { AiRequirementInput } from "./AiRequirementInput";
import { AiDecomposedResults } from "./AiDecomposedResults";

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

  // Import State
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);

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
              : "Sprint 1: ACTIVE";

          finalPromptText = `[BÁO CÁO PHÂN TÍCH HIỆN TRẠNG DỰ ÁN DÀNH CHO AI AGENT]
- Dự án đang thực hiện: ${selectedSpaceObj?.name || "Space"}
- Danh sách Sprint hiện tại:
${sprintSummary}
- Các Task đang thực hiện / đã tạo gần đây:
${taskSummary}

[YÊU CẦU BÓC TÁCH VÀ MỞ RỘNG CÁC HẠNG MỤC CÔNG VIỆC TIẾP THEO]
Nhiệm vụ của AI Agent: Phân tích hiện trạng dự án trên và tiếp tục bóc tách danh sách từ 10 - 25 Task tiếp theo cho bài toán sau:
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

        // 1. Create a brand new Space in Workspace
        const newSpace = await workspaceService.createSpace({
          workspaceId,
          name: newSpaceName.trim(),
        });
        setCreatedSpaceId(newSpace.id);

        // Dispatch real-time event for sidebar update (no page reload!)
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("space-created"));
        }

        // 2. Automatically create 5 Sprints for the new Space
        const createdSprints: Sprint[] = [];
        const sprintTitles = [
          "Sprint 1: Architecture Baseline & Core APIs",
          "Sprint 2: Core Business Modules Implementation",
          "Sprint 3: Integration & Advanced Services",
          "Sprint 4: AI & Vector Database Features",
          "Sprint 5: Testing, QA & Final Delivery",
        ];

        for (let i = 0; i < 5; i++) {
          const sp = await sprintService.createSprint({
            spaceId: newSpace.id,
            name: sprintTitles[i],
            goal: `Mục tiêu cho ${sprintTitles[i]}`,
            status: i === 0 ? "ACTIVE" : "FUTURE",
          });
          createdSprints.push(sp);
        }

        // 3. Populate tasks into new Space Sprints
        for (const item of result.tasks) {
          let sprintIndex = 0;
          if (item.sprint) {
            const match = item.sprint.match(/Sprint\s+(\d+)/i);
            if (match) {
              sprintIndex = Math.min(Math.max(parseInt(match[1], 10) - 1, 0), 4);
            }
          }
          const targetSprint = createdSprints[sprintIndex] || createdSprints[0];

          await taskService.createTask({
            spaceId: newSpace.id,
            sprintId: targetSprint.id,
            title: item.title,
            description: `[AI Decomposed] ${item.description}\nThứ tự Sprint gợi ý: ${item.sprint}`,
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

        // Map existing sprints (e.g., "Sprint 1", "Sprint 2")
        existingSprints.forEach((sp, idx) => {
          sprintMap[`Sprint ${idx + 1}`] = sp;
        });

        // For each decomposed task, put into matching existing Sprint or create new Sprint if needed
        for (const item of result.tasks) {
          const rawSprintName = item.sprint || "Sprint 1";
          let targetSprint = sprintMap[rawSprintName];

          // If matching sprint doesn't exist, create it for the space
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

          await taskService.createTask({
            spaceId: selectedSpaceId,
            sprintId: targetSprint ? targetSprint.id : undefined,
            title: item.title,
            description: `[AI Decomposed] ${item.description}\nThứ tự Sprint gợi ý: ${item.sprint}`,
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
        loading={loading}
        disabled={targetMode === "EXISTING_SPACE" && !selectedSpaceId}
        error={error}
      />

      {/* 3. Loading Skeleton */}
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

      {/* 4. Decomposed Results View */}
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
