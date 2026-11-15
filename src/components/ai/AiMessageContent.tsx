"use client";

import React, { useState } from "react";
import {
  Calendar,
  AlertTriangle,
  Check,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Layers,
  Clock,
  Target,
  ChevronDown,
  ChevronUp,
  ListTodo,
  RotateCcw,
  Pencil,
  Plus,
  Minus,
} from "lucide-react";

interface AiMessageContentProps {
  content: string;
  isUser: boolean;
  onSendMessage?: (text: string) => void;
  onFillInput?: (text: string) => void;
  onScrollToWbs?: () => void;
  configuredStartDate?: string;
  configuredEndDate?: string;
}

export interface DemoTaskItem {
  id?: string;
  title: string;
}

interface SprintItem {
  number: string;
  duration?: string;
  durationDays: number;
  scope: string;
  tasks: DemoTaskItem[];
}

export function AiMessageContent({
  content,
  isUser,
  onSendMessage,
  onFillInput,
  onScrollToWbs,
  configuredStartDate,
  configuredEndDate,
}: AiMessageContentProps) {
  // State for sprint accordion: Sprint 1 (index 0) open by default, others closed by default
  const [openSprintMap, setOpenSprintMap] = useState<Record<number, boolean>>({});

  // State to track selected options across multiple questions (Single selection per question: { [qKey]: { label, text, qNum } })
  const [selectedOptionsMap, setSelectedOptionsMap] = useState<
    Record<string, { label: string; text: string; qNum?: string }>
  >({});

  // Inline editing state for Demo Plan
  const [sprintsOverride, setSprintsOverride] = useState<SprintItem[] | null>(null);
  const [isPlanEdited, setIsPlanEdited] = useState(false);
  const [editingTaskKey, setEditingTaskKey] = useState<string | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState("");
  const [isApproved, setIsApproved] = useState(false);
  const [daysLimitWarning, setDaysLimitWarning] = useState<string | null>(null);

  const isSprintOpen = (idx: number) => {
    return openSprintMap[idx] !== undefined ? openSprintMap[idx] : idx === 0;
  };

  const toggleSprint = (idx: number) => {
    setOpenSprintMap((prev) => ({
      ...prev,
      [idx]: !isSprintOpen(idx),
    }));
  };

  // 1. If it's a User message, render clean formatted text
  if (isUser) {
    return (
      <div className="whitespace-pre-wrap text-left select-text leading-relaxed font-sans text-xs">
        {content}
      </div>
    );
  }

  const lowerContent = content.toLowerCase();

  // Check if message contains interactive questionnaire options (e.g. Option A, Option B)
  const hasOptions =
    /(?:Option\s+[A-Za-z0-9]+|Lựa chọn\s+[A-Za-z0-9]+)[:\s]/i.test(content);

  // Check if content has explicit Sprint items like "Sprint 1:", "Sprint 2:"
  const hasSprintHeaders = /(?:[-*•\s]*)\*?\*?Sprint\s*\d+[^:*]*[:\s]*/i.test(content);

  // A message is ONLY a candidate for Demo Plan if it does NOT have question options and has explicit Sprints
  const isPotentialDemoPlan =
    !hasOptions &&
    hasSprintHeaders &&
    (lowerContent.includes("kế hoạch") ||
      lowerContent.includes("lộ trình") ||
      lowerContent.includes("phê duyệt") ||
      lowerContent.includes("bạn có đồng ý") ||
      lowerContent.includes("quy mô dự kiến") ||
      lowerContent.includes("tên dự án gợi ý") ||
      lowerContent.includes("bản kế hoạch"));

  if (isPotentialDemoPlan) {
    const lines = content.split("\n");
    const sprintList: SprintItem[] = [];
    let projectName = "Hệ thống Quản lý Phần mềm";
    let estimatedScale = "";
    let benchmarkStandards = "";
    let currentSprint: SprintItem | null = null;

    lines.forEach((line) => {
      const trimmed = line.trim();
      const lower = trimmed.toLowerCase();

      // Extract Project Name
      if (lower.includes("tên dự án gợi ý") || lower.includes("tên dự án:")) {
        const parts = trimmed.split(/[:：]/);
        if (parts.length > 1) {
          projectName = parts.slice(1).join(":").replace(/[*#]/g, "").trim();
        }
      }
      // Extract Scale / Duration
      else if (lower.includes("quy mô dự kiến") || lower.includes("thời gian thực hiện")) {
        const parts = trimmed.split(/[:：]/);
        if (parts.length > 1) {
          estimatedScale = parts.slice(1).join(":").replace(/[*#]/g, "").trim();
        }
      }
      // Extract Benchmark
      else if (lower.includes("căn cứ") || lower.includes("tiêu chuẩn")) {
        const parts = trimmed.split(/[:：]/);
        if (parts.length > 1) {
          benchmarkStandards = parts.slice(1).join(":").replace(/[*#]/g, "").trim();
        }
      }
      // Parse Sprint items & sub-tasks
      else {
        const sprintMatch = trimmed.match(
          /(?:[-*•\s]*)\*?\*?(Sprint\s*\d+[^:*]*)\*?\*?[:\s]*(.*)/i
        );

        if (sprintMatch && !lower.includes("lời mời") && !lower.includes("phê duyệt")) {
          const titlePart = sprintMatch[1].replace(/[*#]/g, "").trim();
          const descPart = sprintMatch[2].replace(/[*#]/g, "").trim();

          const durationMatch = titlePart.match(/\(([^)]+)\)/);
          let duration = durationMatch ? durationMatch[1] : "";
          const cleanNumber = titlePart.replace(/\([^)]+\)/, "").trim();

          // Parse days from title or scope
          let durationDays = 7;
          const daysInText = (titlePart + " " + descPart).match(/(\d+)\s*ngày/i);
          if (daysInText) {
            durationDays = parseInt(daysInText[1], 10);
          } else {
            const weeksInText = (titlePart + " " + descPart).match(/(\d+)\s*tuần/i);
            if (weeksInText) {
              durationDays = parseInt(weeksInText[1], 10) * 7;
            }
          }

          if (!duration) {
            duration = `${durationDays} ngày`;
          }

          currentSprint = {
            number: cleanNumber,
            duration: duration,
            durationDays: durationDays,
            scope: descPart || "Phát triển và hoàn thiện các tính năng nghiệp vụ trọng tâm.",
            tasks: [],
          };
          sprintList.push(currentSprint);
        } else if (currentSprint) {
          const isTaskLine =
            (trimmed.startsWith("+") ||
              trimmed.startsWith("-") ||
              trimmed.startsWith("*") ||
              trimmed.startsWith("•") ||
              /^\d+[\.\)]/.test(trimmed)) &&
            !trimmed.startsWith("#") &&
            !lower.startsWith("sprint") &&
            !lower.includes("xác nhận kế hoạch") &&
            !lower.includes("bạn có đồng ý") &&
            !lower.includes("căn cứ tiêu chuẩn") &&
            !lower.includes("tên dự án") &&
            !lower.includes("quy mô dự kiến");

          if (isTaskLine) {
            const taskTitle = trimmed
              .replace(/^[+\-*•\d\.\)]+\s*/, "")
              .replace(/^Task\s*\d*[:\s]*/i, "")
              .replace(/[*#]/g, "")
              .trim();

            if (taskTitle && taskTitle.length > 3) {
              currentSprint.tasks.push({ title: taskTitle });
            }
          }
        }
      }
    });

    // Fallback: If any sprint doesn't have tasks parsed yet, derive tasks from scope or standard software phases
    sprintList.forEach((sp) => {
      if (sp.tasks.length === 0 && sp.scope) {
        const cleanScope = sp.scope.replace(/\([^)]+\)/g, "").trim();
        const parts = cleanScope
          .split(/[,;]|\s+và\s+/i)
          .map((p) => p.trim())
          .filter((p) => p.length > 4);

        if (parts.length >= 2) {
          parts.forEach((p) => {
            const title = p.charAt(0).toUpperCase() + p.slice(1);
            sp.tasks.push({ title });
          });
        } else {
          sp.tasks = [
            { title: `Đặc tả yêu cầu & phân tích chi tiết cho ${sp.number}` },
            { title: sp.scope },
            { title: `Kiểm thử & rà soát hoàn thiện phạm vi ${sp.number}` },
          ];
        }
      }
    });

    // Determine current active sprints (edited override vs parsed list)
    const activeSprints = sprintsOverride || sprintList;
    const totalSprints = activeSprints.length > 0 ? activeSprints.length : 3;
    const totalSprintDays = activeSprints.reduce((sum, sp) => sum + (sp.durationDays || 7), 0);

    const combinedText = `${estimatedScale} ${content}`;

    // Compute project milestone total days limit
    let initialMilestoneDays = 0;
    if (configuredStartDate && configuredEndDate) {
      const s = new Date(configuredStartDate).getTime();
      const e = new Date(configuredEndDate).getTime();
      if (!isNaN(s) && !isNaN(e) && e >= s) {
        initialMilestoneDays = Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
      }
    }
    if (!initialMilestoneDays) {
      const daysMatch = combinedText.match(/(\d+)\s*ngày/i);
      if (daysMatch) {
        initialMilestoneDays = parseInt(daysMatch[1], 10);
      } else {
        initialMilestoneDays = sprintList.reduce((sum, sp) => sum + (sp.durationDays || 7), 0);
      }
    }
    const maxProjectDays = initialMilestoneDays > 0 ? initialMilestoneDays : 42;

    // INTELLIGENT DATE PARSING:
    let startDateStr = "";
    let endDateStr = "";

    const rangeMatch = combinedText.match(
      /(?:từ\s*)?(\d{1,2}[/-]\d{1,2}[/-]\d{4})\s*(?:đến|-)\s*(\d{1,2}[/-]\d{1,2}[/-]\d{4})/i
    );
    if (rangeMatch) {
      startDateStr = rangeMatch[1].replace(/-/g, "/");
      endDateStr = rangeMatch[2].replace(/-/g, "/");
    } else {
      const endMatch = combinedText.match(/đến\s*(\d{1,2}[/-]\d{1,2}[/-]\d{4})/i);
      if (endMatch) {
        endDateStr = endMatch[1].replace(/-/g, "/");
      }
      const startMatch = combinedText.match(/từ\s*(\d{1,2}[/-]\d{1,2}[/-]\d{4})/i);
      if (startMatch) {
        startDateStr = startMatch[1].replace(/-/g, "/");
      }
    }

    if (!startDateStr && configuredStartDate) {
      const parts = configuredStartDate.split("-");
      if (parts.length === 3) {
        startDateStr = `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }
    if (!startDateStr) {
      startDateStr = new Date().toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
    }

    if (!endDateStr && configuredEndDate) {
      const parts = configuredEndDate.split("-");
      if (parts.length === 3) {
        endDateStr = `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }

    // Dynamic endDate based on totalSprintDays
    if (!endDateStr || isPlanEdited) {
      const [d, m, y] = startDateStr.split("/").map(Number);
      if (d && m && y) {
        const startD = new Date(y, m - 1, d);
        const endD = new Date(startD.getTime() + (totalSprintDays - 1) * 24 * 60 * 60 * 1000);
        endDateStr = endD.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
      }
    }

    // Handlers for inline editing
    const handleAdjustSprintDays = (sprintIdx: number, delta: number) => {
      if (isApproved) return;
      const baseList = sprintsOverride || sprintList;
      const current = baseList.map((s) => ({
        ...s,
        tasks: s.tasks.map((t) => ({ ...t })),
      }));
      if (!current[sprintIdx]) return;

      if (delta > 0) {
        const currentTotal = current.reduce((sum, sp) => sum + sp.durationDays, 0);
        if (currentTotal + delta > maxProjectDays) {
          setDaysLimitWarning(`Tổng số ngày các Sprint (${currentTotal + delta} ngày) không được vượt quá mốc thời gian dự án (${maxProjectDays} ngày)!`);
          setTimeout(() => setDaysLimitWarning(null), 3500);
          return;
        }
      }

      const newDays = Math.max(3, Math.min(30, current[sprintIdx].durationDays + delta));
      current[sprintIdx].durationDays = newDays;
      current[sprintIdx].duration = `${newDays} ngày`;
      setSprintsOverride(current);
      setIsPlanEdited(true);
      setDaysLimitWarning(null);
    };

    const handleSaveTaskTitle = (sprintIdx: number, taskIdx: number, newTitle: string) => {
      if (isApproved || !newTitle.trim()) return;
      const baseList = sprintsOverride || sprintList;
      const current = baseList.map((s) => ({
        ...s,
        tasks: s.tasks.map((t) => ({ ...t })),
      }));
      if (!current[sprintIdx] || !current[sprintIdx].tasks[taskIdx]) return;
      current[sprintIdx].tasks[taskIdx].title = newTitle.trim();
      setSprintsOverride(current);
      setIsPlanEdited(true);
      setEditingTaskKey(null);
    };

    const handleResetPlan = () => {
      setSprintsOverride(null);
      setIsPlanEdited(false);
      setEditingTaskKey(null);
    };

    const handleApprovePlan = () => {
      if (!onSendMessage || isApproved) return;
      setIsApproved(true);
      const sprintDetails = activeSprints
        .map((s, sIdx) => {
          const taskListStr = s.tasks
            .map((t, tIdx) => `Task ${sIdx + 1}.${tIdx + 1}: ${t.title}`)
            .join(" | ");
          return `- ${s.number} (${s.durationDays} ngày) [Phạm vi: ${s.scope}] -> GỒM ĐÚNG ${s.tasks.length} TASK: ${taskListStr}`;
        })
        .join("\n");

      const approvalMessage = `Duyệt và chốt kế hoạch dự án: ${projectName}
Quy mô: ${activeSprints.length} Sprint (Tổng ${totalSprintDays} ngày).
Danh sách các Sprint và toàn bộ Task đã chốt:
${sprintDetails}

Yêu cầu AI: Bắt đầu phân rã bảng Task WBS chi tiết. BẮT BUỘC giữ nguyên 100% đúng ${activeSprints.length} Sprint, đúng số ngày và toàn bộ danh sách các Task của từng Sprint như trên.`;

      onSendMessage(approvalMessage);
    };

    if (activeSprints.length > 0) {
      return (
        <div className="space-y-4 text-left font-sans w-full">
          {/* TOP: PLAN EXECUTIVE SUMMARY CARD */}
          <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-2xl p-4 shadow-sm border border-indigo-800/60 space-y-3 w-full">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-700/50 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-200">
                  Bản Kế Hoạch Dự Án Sơ Bộ (Demo Project Plan)
                </h4>
              </div>
              <div className="flex items-center gap-2">
                {isPlanEdited && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-mono">
                    Đã chỉnh sửa
                  </span>
                )}
                <span className="text-[11px] font-mono bg-indigo-500/30 text-indigo-200 px-2.5 py-0.5 rounded-full border border-indigo-400/30 font-semibold">
                  Agile / Scrum
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-white tracking-tight">
                {projectName}
              </h3>
              {estimatedScale && (
                <p className="text-xs text-indigo-200/90 leading-relaxed">
                  {estimatedScale}
                </p>
              )}
            </div>

            {/* Key Metrics: Timeline, Duration, Sprint Count */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="bg-white/10 rounded-xl p-2.5 border border-white/10">
                <span className="text-[10px] text-indigo-300 font-mono flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-indigo-400" /> Ngày Bắt Đầu
                </span>
                <span className="text-xs font-bold text-white block mt-0.5 font-mono">{startDateStr}</span>
              </div>

              <div className="bg-white/10 rounded-xl p-2.5 border border-white/10">
                <span className="text-[10px] text-indigo-300 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3 text-emerald-400" /> Ngày Kết Thúc (Dự kiến)
                </span>
                <span className="text-xs font-bold text-emerald-300 block mt-0.5 font-mono">
                  {endDateStr} {totalSprintDays > 0 ? `(${totalSprintDays} ngày)` : ""}
                </span>
              </div>

              <div className="bg-white/10 rounded-xl p-2.5 border border-white/10">
                <span className="text-[10px] text-indigo-300 font-mono flex items-center gap-1">
                  <Layers className="w-3 h-3 text-amber-400" /> Tổng Số Sprint
                </span>
                <span className="text-xs font-bold text-amber-300 block mt-0.5 font-mono">
                  {totalSprints} Sprint
                </span>
              </div>
            </div>

            {benchmarkStandards && (
              <div className="text-[11px] text-indigo-200/80 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="truncate">Căn cứ tiêu chuẩn: {benchmarkStandards}</span>
              </div>
            )}
          </div>

          {/* Alert banner if days exceeded limit */}
          {daysLimitWarning && (
            <div className="bg-amber-50 border border-amber-300 text-amber-800 px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-medium">{daysLimitWarning}</span>
            </div>
          )}

          {/* MIDDLE: FULL-WIDTH STRUCTURED SPRINTS TABLE WITH EXPANDABLE TASK LISTS & INLINE EDITING */}
          {activeSprints.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs w-full">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  Danh Sách Các Sprints Dự Kiến ({activeSprints.length} Sprints)
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  Mặc định hiện Sprint 1 • Bấm xem tasks • Cho phép chỉnh ngày và tên task
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {activeSprints.map((sprint, idx) => {
                  const isOpen = isSprintOpen(idx);
                  return (
                    <div key={idx} className="transition-colors">
                      {/* SPRINT ACCORDION HEADER (Clickable) */}
                      <div
                        onClick={() => toggleSprint(idx)}
                        className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none transition-colors ${
                          isOpen ? "bg-indigo-50/40" : "hover:bg-slate-50/70"
                        }`}
                        title={isOpen ? "Bấm để thu gọn danh sách task" : "Bấm để mở xem danh sách task"}
                      >
                        <div className="flex items-center gap-2.5 shrink-0">
                          <span
                            className={`w-6 h-6 rounded-lg font-bold text-xs flex items-center justify-center font-mono border transition-colors ${
                              isOpen
                                ? "bg-indigo-600 border-indigo-600 text-white shadow-2xs"
                                : "bg-indigo-50 border-indigo-200 text-indigo-700"
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h5 className="text-xs font-bold text-slate-900">{sprint.number}</h5>

                              {/* SPRINT DURATION STEPPER (+/- DAYS) */}
                              {isApproved ? (
                                <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-lg font-mono font-bold">
                                  {sprint.durationDays} ngày
                                </span>
                              ) : (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex items-center bg-indigo-50 border border-indigo-200/80 rounded-lg px-1.5 py-0.5 gap-1 font-mono text-[11px] text-indigo-800"
                                  title="Điều chỉnh số ngày trong Sprint này"
                                >
                                  <button
                                    type="button"
                                    disabled={sprint.durationDays <= 3}
                                    onClick={() => handleAdjustSprintDays(idx, -1)}
                                    className="w-4 h-4 rounded hover:bg-indigo-200/70 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-indigo-700 transition-colors cursor-pointer"
                                    title="Giảm 1 ngày"
                                  >
                                    <Minus className="w-2.5 h-2.5" />
                                  </button>
                                  <span className="font-bold min-w-[42px] text-center select-none">
                                    {sprint.durationDays} ngày
                                  </span>
                                  <button
                                    type="button"
                                    disabled={totalSprintDays >= maxProjectDays}
                                    onClick={() => handleAdjustSprintDays(idx, 1)}
                                    className="w-4 h-4 rounded hover:bg-indigo-200/70 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-indigo-700 transition-colors cursor-pointer"
                                    title={totalSprintDays >= maxProjectDays ? "Đã đạt tổng số ngày tối đa của dự án" : "Tăng 1 ngày"}
                                  >
                                    <Plus className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              )}

                              <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-mono flex items-center gap-1 border border-slate-200/50">
                                <ListTodo className="w-3 h-3 text-indigo-500" />
                                {sprint.tasks.length} tasks
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex-1 text-xs text-slate-700 leading-relaxed sm:pl-3 line-clamp-2 sm:line-clamp-1">
                          {sprint.scope}
                        </div>

                        <div className="shrink-0 flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800">
                          <span>{isOpen ? "Thu gọn" : "Xem tasks"}</span>
                          {isOpen ? (
                            <ChevronUp className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </div>

                      {/* SPRINT TASKS LIST (Default OPEN for Sprint 1, CLOSED for others) */}
                      {isOpen && (
                        <div className="px-4 pb-3.5 pt-1 bg-slate-50/60 border-t border-slate-100 animate-in fade-in slide-in-from-top-1 duration-150">
                          <div className="bg-white rounded-xl border border-slate-200/80 p-2.5 shadow-2xs space-y-1.5">
                            <div className="text-[11px] font-bold text-slate-600 flex items-center justify-between pb-1 border-b border-slate-100 px-1">
                              <span className="flex items-center gap-1.5">
                                <ListTodo className="w-3.5 h-3.5 text-indigo-500" />
                                Danh sách công việc dự kiến ({sprint.tasks.length} tasks)
                              </span>
                              <span className="text-[10px] font-mono text-slate-400 font-normal">
                                {sprint.number} ({sprint.durationDays} ngày)
                              </span>
                            </div>

                            <div className="divide-y divide-slate-50">
                              {sprint.tasks.map((task, tIdx) => {
                                const isEditingThisTask = editingTaskKey === `${idx}_${tIdx}`;
                                return (
                                  <div
                                    key={tIdx}
                                    className="py-1.5 px-2 hover:bg-slate-50 rounded-lg flex items-center justify-between gap-3 text-xs text-slate-800 group transition-colors"
                                  >
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <span className="w-4 h-4 rounded-md bg-indigo-50 text-indigo-600 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 border border-indigo-100">
                                        {tIdx + 1}
                                      </span>

                                      {isEditingThisTask ? (
                                        <div
                                          className="flex items-center gap-1.5 flex-1 min-w-0"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <input
                                            type="text"
                                            value={editingTaskTitle}
                                            onChange={(e) => setEditingTaskTitle(e.target.value)}
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter") {
                                                handleSaveTaskTitle(idx, tIdx, editingTaskTitle);
                                              } else if (e.key === "Escape") {
                                                setEditingTaskKey(null);
                                              }
                                            }}
                                            autoFocus
                                            className="flex-1 text-xs px-2 py-0.5 border border-indigo-400 rounded-md focus:outline-hidden focus:ring-1 focus:ring-indigo-500 bg-white"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => handleSaveTaskTitle(idx, tIdx, editingTaskTitle)}
                                            className="p-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                                            title="Lưu tên công việc"
                                          >
                                            <Check className="w-3 h-3" />
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                          <span className="truncate group-hover:text-indigo-900 font-medium">
                                            {task.title}
                                          </span>
                                          {!isApproved && (
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingTaskKey(`${idx}_${tIdx}`);
                                                setEditingTaskTitle(task.title);
                                              }}
                                              className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-indigo-600 rounded transition-opacity cursor-pointer"
                                              title="Chỉnh sửa tên công việc này"
                                            >
                                              <Pencil className="w-3 h-3" />
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </div>

                                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100/80 px-2 py-0.5 rounded shrink-0 border border-slate-200/50">
                                      Task {idx + 1}.{tIdx + 1}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* BOTTOM: APPROVAL CARD WITH UNDO BUTTON WHEN EDITED */}
          <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
            <div>
              <h5 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Bạn có đồng ý với Khung Kế Hoạch & Các Sprints này không?
              </h5>
              <p className="text-[11px] text-indigo-800/80 mt-0.5">
                Bấm nút duyệt bên dưới để AI tiến hành bóc tách toàn bộ công việc WBS chi tiết:
              </p>
            </div>

            {isApproved ? (
              <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl shadow-xs font-bold text-xs select-none">
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>✓ Kế hoạch đã được phê duyệt &amp; Đã chốt lộ trình</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                {isPlanEdited && (
                  <button
                    type="button"
                    onClick={handleResetPlan}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 shadow-2xs transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                    title="Khôi phục lại kế hoạch ban đầu do AI đề xuất"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Hoàn tác</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleApprovePlan}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                >
                  <CheckCircle2 className="w-4 h-4 text-indigo-200" />
                  <span>Duyệt Kế Hoạch & Phân Rã WBS Ngay</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }
  }

  // 3. CHECK IF THIS IS A WBS CREATED SUCCESS MESSAGE (Stage 3 after approval)
  const isWbsSuccess =
    content.startsWith("Bảng phân rã công việc (WBS) chi tiết") ||
    content.startsWith("Đã phân rã") ||
    (content.includes("WBS") && content.includes("thành viên chính") && !lowerContent.includes("bạn có đồng ý"));

  if (isWbsSuccess) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 text-emerald-950 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs w-full shadow-2xs font-sans">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <h5 className="font-bold text-xs text-emerald-950">
              Đã khởi tạo thành công Bảng Phân Rã Công Việc (WBS)!
            </h5>
            <p className="text-[11px] text-emerald-800/80">
              Tất cả các Task và Sprint đã được cập nhật hoàn tất ở khu vực bên dưới.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            if (onScrollToWbs) {
              onScrollToWbs();
            } else {
              const elem = document.getElementById("wbs-result-table");
              if (elem) elem.scrollIntoView({ behavior: "smooth" });
            }
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
        >
          <span>Xem Bảng WBS Chi Tiết ↓</span>
        </button>
      </div>
    );
  }

  // Handle single option selection per question (Radio button behavior)
  const handleToggleOption = (
    qKey: string,
    optText: string,
    optLabel: string,
    qNum?: string
  ) => {
    const newMap = { ...selectedOptionsMap };
    if (newMap[qKey]?.text === optText) {
      // Toggle off if clicking the same option again
      delete newMap[qKey];
    } else {
      // Radio behavior: Replace any existing selection for this question with the newly clicked option
      newMap[qKey] = { label: optLabel, text: optText, qNum };
    }

    // Update local state
    setSelectedOptionsMap(newMap);

    // Combine all selected answers across questions sequentially
    const keys = Object.keys(newMap).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, "") || "0", 10);
      const numB = parseInt(b.replace(/\D/g, "") || "0", 10);
      return numA - numB;
    });

    if (keys.length === 0) {
      onFillInput?.("");
    } else {
      const combined = keys
        .map((k, i) => {
          const item = newMap[k];
          const prefix = item.qNum ? `Lựa chọn ${item.qNum}: ` : `Lựa chọn ${i + 1}: `;
          return `${prefix}${item.text}`;
        })
        .join("\n\n");

      onFillInput?.(combined);
    }
  };

  // 4. Default: Standard text with Clean Markdown (Headings, Tables, Blockquotes, Options)
  let currentQuestionTracker: string | undefined = undefined;

  const rawLines = content.split("\n");
  const blocks: React.ReactNode[] = [];
  let tableBuffer: string[] = [];

  const flushTable = (keyPrefix: number) => {
    if (tableBuffer.length > 0) {
      blocks.push(renderMarkdownTable(tableBuffer, keyPrefix));
      tableBuffer = [];
    }
  };

  rawLines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Check if line is part of a markdown table: | col 1 | col 2 |
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      tableBuffer.push(trimmed);
      return;
    } else {
      flushTable(idx);
    }

    if (!trimmed) {
      blocks.push(<div key={`empty_${idx}`} className="h-1" />);
      return;
    }

    // Horizontal Rule: --- or ***
    if (/^[-*_]{3,}$/.test(trimmed)) {
      blocks.push(<hr key={`hr_${idx}`} className="border-slate-200 my-2" />);
      return;
    }

    // Heading 1: # Title
    if (trimmed.startsWith("# ")) {
      blocks.push(
        <h2 key={`h1_${idx}`} className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-1 mt-2.5 mb-1 tracking-tight">
          {renderFormattedText(trimmed.replace(/^#\s+/, ""))}
        </h2>
      );
      return;
    }

    // Heading 2: ## Title
    if (trimmed.startsWith("## ")) {
      blocks.push(
        <h3 key={`h2_${idx}`} className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-0.5 mt-2 mb-1 tracking-tight">
          {renderFormattedText(trimmed.replace(/^##\s+/, ""))}
        </h3>
      );
      return;
    }

    // Heading 3: ### Title
    if (trimmed.startsWith("### ")) {
      blocks.push(
        <h4 key={`h3_${idx}`} className="text-xs font-bold text-indigo-950 uppercase font-mono mt-2 mb-0.5 tracking-wider">
          {renderFormattedText(trimmed.replace(/^###\s+/, ""))}
        </h4>
      );
      return;
    }

    // Heading 4: #### Title
    if (trimmed.startsWith("#### ")) {
      blocks.push(
        <h5 key={`h4_${idx}`} className="text-xs font-bold text-slate-800 mt-1.5 mb-0.5">
          {renderFormattedText(trimmed.replace(/^####\s+/, ""))}
        </h5>
      );
      return;
    }

    // Blockquote: > text
    if (trimmed.startsWith(">")) {
      blocks.push(
        <div key={`quote_${idx}`} className="border-l-4 border-indigo-500 bg-indigo-50/50 p-2.5 rounded-r-xl text-xs text-slate-800 my-1 font-medium leading-relaxed">
          {renderFormattedText(trimmed.replace(/^>\s*/, ""))}
        </div>
      );
      return;
    }

    // Check if line is a numbered question like "1. Trong 3 Sprint..."
    const numberedQuestionMatch = trimmed.match(/^(\d+[\.\)])\s*(.*)/);
    if (numberedQuestionMatch && !trimmed.toLowerCase().startsWith("task")) {
      const num = numberedQuestionMatch[1].replace(/[\.\)]/, "");
      currentQuestionTracker = num;
      const questionText = numberedQuestionMatch[2];
      blocks.push(
        <div key={`q_${idx}`} className="flex items-start gap-2 pt-1 font-bold text-slate-900 text-xs">
          <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 font-mono font-extrabold flex items-center justify-center shrink-0 text-[11px] border border-blue-200 shadow-2xs">
            {num}
          </span>
          <div className="flex-1 leading-relaxed">
            {renderFormattedText(questionText)}
          </div>
        </div>
      );
      return;
    }

    // Check if line contains Options (e.g., "Option A:", "Option B:", "Option 1:", "Lựa chọn A:")
    const optionRegex = /(?:Option\s+[A-Za-z0-9]+|Lựa chọn\s+[A-Za-z0-9]+)[:\s]/i;
    if (optionRegex.test(trimmed)) {
      blocks.push(
        renderOptionLine(
          trimmed,
          idx,
          selectedOptionsMap,
          handleToggleOption,
          currentQuestionTracker
        )
      );
      return;
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.startsWith("• ")) {
      const bulletText = trimmed.replace(/^[-*•]\s*/, "");
      blocks.push(
        <div key={`bullet_${idx}`} className="flex items-start gap-2 pl-1">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
          <div className="flex-1 leading-relaxed">{renderFormattedText(bulletText)}</div>
        </div>
      );
      return;
    }

    blocks.push(
      <p key={`p_${idx}`} className="leading-relaxed">
        {renderFormattedText(trimmed)}
      </p>
    );
  });

  flushTable(rawLines.length);

  return (
    <div className="space-y-2 text-left text-xs leading-relaxed text-slate-800 font-sans w-full">
      {blocks}
    </div>
  );
}

function renderOptionLine(
  line: string,
  lineIdx: number,
  selectedOptionsMap: Record<string, { label: string; text: string; qNum?: string }>,
  onToggleOption: (qKey: string, optText: string, optLabel: string, qNum?: string) => void,
  currentQuestionNum?: string
): React.ReactNode {
  const qKey = currentQuestionNum ? `q_${currentQuestionNum}` : `q_line_${lineIdx}`;

  // Check if there is a prefix like "Gợi ý trả lời mẫu:"
  const firstOptionMatch = line.match(/(?:Option\s+[A-Za-z0-9]+|Lựa chọn\s+[A-Za-z0-9]+)[:\s]/i);
  let prefix = "";
  let optionsText = line;

  if (firstOptionMatch && firstOptionMatch.index !== undefined && firstOptionMatch.index > 0) {
    prefix = line.slice(0, firstOptionMatch.index).trim();
    optionsText = line.slice(firstOptionMatch.index).trim();
  }

  // Split options by " / " or matching next option
  let rawOptions: string[] = [];
  if (optionsText.includes(" / ")) {
    rawOptions = optionsText.split(/\s*\/\s*(?=(?:Option|Lựa chọn)\s+[A-Za-z0-9]+[:\s])/i);
  } else {
    rawOptions = optionsText.split(/(?=(?:Option|Lựa chọn)\s+[A-Za-z0-9]+[:\s])/i);
  }

  return (
    <div key={lineIdx} className="space-y-1.5 pt-0.5">
      {prefix && (
        <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 pl-0.5">
          <span>{renderFormattedText(prefix)}</span>
        </div>
      )}

      <div className="space-y-1.5 pl-1 sm:pl-2">
        {rawOptions.map((opt, optIdx) => {
          const trimmedOpt = opt.trim();
          if (!trimmedOpt) return null;

          // Extract label (e.g. "Option A:" or "Option B:") and rest of text
          const matchLabel = trimmedOpt.match(/^((?:Option|Lựa chọn)\s+[A-Za-z0-9]+[:\s]*)(.*)/i);
          const optionLabel = matchLabel ? matchLabel[1].trim() : "Option:";
          const optionBody = matchLabel ? matchLabel[2].trim() : trimmedOpt;

          const isSelected = selectedOptionsMap[qKey]?.text === trimmedOpt;

          return (
            <div
              key={optIdx}
              onClick={() => onToggleOption(qKey, trimmedOpt, optionLabel, currentQuestionNum)}
              className={`flex items-start gap-2.5 p-2 rounded-xl border transition-all cursor-pointer group shadow-2xs ${
                isSelected
                  ? "bg-emerald-50 border-2 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs"
                  : "bg-slate-50/90 hover:bg-emerald-50/60 border-slate-200/90 hover:border-emerald-300"
              }`}
              title={isSelected ? "Đang chọn (Bấm lại để hủy)" : "Bấm để chọn câu trả lời mẫu này"}
            >
              {isSelected ? (
                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </span>
              ) : (
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1.5 shadow-xs group-hover:scale-125 transition-transform ring-2 ring-emerald-200/50" />
              )}

              <div className="text-xs leading-relaxed text-slate-800 flex-1">
                <strong
                  className={`font-extrabold px-2 py-0.5 rounded-md border shadow-2xs font-mono text-[11px] mr-1.5 inline-block ${
                    isSelected
                      ? "text-white bg-emerald-700 border-emerald-800"
                      : "text-slate-900 bg-white border-slate-300 text-emerald-800 group-hover:border-emerald-300"
                  }`}
                >
                  {optionLabel}
                </strong>
                <span className={`font-medium ${isSelected ? "text-emerald-950 font-semibold" : "text-slate-700"}`}>
                  {renderFormattedText(optionBody)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function renderFormattedText(text: string): React.ReactNode {
  const cleanedText = text
    .replace(/^[📌⏱️🔗📋❓👉•]+\s*/, "")
    .replace(/^([?])\s*\*\*/, "**");

  const parts = cleanedText.split(/(\**[^*]+\*\*|`[^`]+`)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      const boldText = part.slice(2, -2);
      return (
        <strong key={index} className="font-semibold text-slate-900">
          {boldText}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      const codeText = part.slice(1, -1);
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-indigo-700 rounded font-mono text-[11px]"
        >
          {codeText}
        </code>
      );
    }
    return part;
  });
}

function renderMarkdownTable(tableLines: string[], keyPrefix: number): React.ReactNode {
  if (tableLines.length < 2) return null;

  // Header line
  const headerCells = tableLines[0]
    .split("|")
    .map((c) => c.trim())
    .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);

  // Body lines (skipping divider line with '---')
  const bodyRows: string[][] = [];
  for (let i = 1; i < tableLines.length; i++) {
    const line = tableLines[i];
    if (line.includes("---")) continue;
    const cells = line
      .split("|")
      .map((c) => c.trim())
      .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
    if (cells.length > 0) {
      bodyRows.push(cells);
    }
  }

  return (
    <div key={`table_${keyPrefix}`} className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs my-2 max-w-full overflow-x-auto">
      <table className="w-full text-left text-xs border-collapse font-sans">
        <thead>
          <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-bold font-mono text-[11px]">
            {headerCells.map((h, hIdx) => (
              <th key={hIdx} className="p-2.5 whitespace-nowrap">
                {renderFormattedText(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {bodyRows.map((row, rIdx) => (
            <tr key={rIdx} className="hover:bg-slate-50/80 transition-colors">
              {row.map((cell, cIdx) => {
                const upperCell = cell.toUpperCase();
                const isReview = upperCell.includes("REVIEW");
                const isInProgress = upperCell.includes("PROGRESS");
                const isDone = upperCell.includes("DONE");
                const isUrgent = upperCell.includes("URGENT");
                const isHigh = upperCell.includes("HIGH");

                let badgeNode: React.ReactNode = null;
                if (isReview || isInProgress || isDone) {
                  badgeNode = (
                    <span
                      className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold border ${
                        isDone
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : isReview
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}
                    >
                      {cell.replace(/[*#]/g, "")}
                    </span>
                  );
                } else if (isUrgent || isHigh) {
                  badgeNode = (
                    <span
                      className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold border ${
                        isUrgent
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-orange-50 text-orange-700 border-orange-200"
                      }`}
                    >
                      {cell.replace(/[*#]/g, "")}
                    </span>
                  );
                }

                return (
                  <td key={cIdx} className="p-2.5">
                    {badgeNode ? badgeNode : renderFormattedText(cell)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
