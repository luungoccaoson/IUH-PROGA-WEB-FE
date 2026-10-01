"use client";

import React, { useState } from "react";
import {
  Calendar,
  Check,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Layers,
  Clock,
  Target,
} from "lucide-react";

interface AiMessageContentProps {
  content: string;
  isUser: boolean;
  onSendMessage?: (text: string) => void;
  onFillInput?: (text: string) => void;
  onScrollToWbs?: () => void;
}

interface SprintItem {
  number: string;
  duration?: string;
  scope: string;
}

export function AiMessageContent({
  content,
  isUser,
  onSendMessage,
  onFillInput,
  onScrollToWbs,
}: AiMessageContentProps) {
  // 1. If it's a User message, render clean formatted text
  if (isUser) {
    return (
      <div className="whitespace-pre-wrap text-left select-text leading-relaxed font-sans text-xs">
        {content}
      </div>
    );
  }

  const lowerContent = content.toLowerCase();

  // 2. CHECK IF THIS IS A DEMO PLAN PROPOSAL (Stage 2)
  const isDemoPlan =
    (lowerContent.includes("sprint") &&
      (lowerContent.includes("kế hoạch") ||
        lowerContent.includes("lộ trình") ||
        lowerContent.includes("phê duyệt") ||
        lowerContent.includes("bạn có đồng ý") ||
        lowerContent.includes("quy mô dự kiến") ||
        lowerContent.includes("tên dự án gợi ý"))) ||
    lowerContent.includes("bạn có đồng ý với bản kế hoạch");

  if (isDemoPlan) {
    const lines = content.split("\n");
    const sprintList: SprintItem[] = [];
    let projectName = "Hệ thống Quản lý Phần mềm";
    let estimatedScale = "";
    let benchmarkStandards = "";

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
      // Parse Sprint items
      else {
        const sprintMatch = trimmed.match(
          /(?:[-*•\s]*)\*?\*?(Sprint\s*\d+[^:*]*)\*?\*?[:\s]*(.*)/i
        );

        if (sprintMatch && !lower.includes("lời mời") && !lower.includes("phê duyệt")) {
          const titlePart = sprintMatch[1].replace(/[*#]/g, "").trim();
          const descPart = sprintMatch[2].replace(/[*#]/g, "").trim();

          const durationMatch = titlePart.match(/\(([^)]+)\)/);
          const duration = durationMatch ? durationMatch[1] : "Theo kế hoạch";
          const cleanNumber = titlePart.replace(/\([^)]+\)/, "").trim();

          sprintList.push({
            number: cleanNumber,
            duration: duration,
            scope: descPart || "Phát triển và hoàn thiện các tính năng nghiệp vụ trọng tâm.",
          });
        }
      }
    });

    const totalSprints = sprintList.length > 0 ? sprintList.length : 3;
    const now = new Date();
    const startDateStr = now.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
    const endDate = new Date(now.getTime() + totalSprints * 14 * 24 * 60 * 60 * 1000);
    const endDateStr = endDate.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

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
            <span className="text-[11px] font-mono bg-indigo-500/30 text-indigo-200 px-2.5 py-0.5 rounded-full border border-indigo-400/30 font-semibold">
              Agile / Scrum
            </span>
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

          {/* Key Metrics: Timeline, Duration, Sprint Count (NO Man-days estimation) */}
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
              <span className="text-xs font-bold text-emerald-300 block mt-0.5 font-mono">{endDateStr}</span>
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

        {/* MIDDLE: FULL-WIDTH STRUCTURED SPRINTS TABLE (NO NARROW TILES, FULL TEXT VISIBLE) */}
        {sprintList.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs w-full">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-600" />
                Danh Sách Các Sprints Dự Kiến ({sprintList.length} Sprints)
              </span>
              <span className="text-[11px] text-slate-500 font-mono">Hiển thị đầy đủ phạm vi từng Sprint</span>
            </div>

            <div className="divide-y divide-slate-100">
              {sprintList.map((sprint, idx) => (
                <div
                  key={idx}
                  className="p-3.5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs flex items-center justify-center font-mono">
                      {idx + 1}
                    </span>
                    <div>
                      <h5 className="text-xs font-bold text-slate-900">{sprint.number}</h5>
                      <span className="text-[10px] text-slate-400 font-mono">{sprint.duration}</span>
                    </div>
                  </div>

                  <div className="flex-1 text-xs text-slate-700 leading-relaxed sm:pl-4">
                    {sprint.scope}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BOTTOM: APPROVAL CARD WITH EXACTLY ONE CONFIRM BUTTON (NO CLUTTER) */}
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

          <button
            onClick={() => {
              if (onSendMessage) {
                const sprintSummaryText = sprintList.length > 0
                  ? `gồm đúng ${sprintList.length} Sprint: ${sprintList.map((s) => `${s.number} (${s.scope})`).join("; ")}`
                  : "theo bản kế hoạch mới nhất";
                onSendMessage(`Duyệt và chốt kế hoạch: ${projectName} ${sprintSummaryText}. Bắt đầu phân rã bảng Task WBS chi tiết cho đúng các Sprint này.`);
              }
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] shrink-0"
          >
            <CheckCircle2 className="w-4 h-4 text-indigo-200" />
            <span>Duyệt Kế Hoạch & Phân Rã WBS Ngay</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // 3. CHECK IF THIS IS A WBS CREATED SUCCESS MESSAGE (Stage 3 after approval)
  // Per user instruction: "ghi chữ là đã tạo hay gì này nọ thôi, khỏi cái sơ đồ lộ trình gì đi"
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

  // State to track selected options across multiple questions: { [lineIdx]: { label, text, qNum } }
  const [selectedOptionsMap, setSelectedOptionsMap] = useState<
    Record<number, { label: string; text: string; qNum?: string }>
  >({});

  const handleToggleOption = (
    lineIdx: number,
    optText: string,
    optLabel: string,
    qNum?: string
  ) => {
    setSelectedOptionsMap((prev) => {
      const newMap = { ...prev };
      if (newMap[lineIdx]?.text === optText) {
        // Toggle off if clicking the same option again
        delete newMap[lineIdx];
      } else {
        // Select this option for this question line
        newMap[lineIdx] = { label: optLabel, text: optText, qNum };
      }

      // Combine all selected answers across questions sequentially
      const keys = Object.keys(newMap)
        .map(Number)
        .sort((a, b) => a - b);

      if (keys.length === 0) {
        if (onFillInput) onFillInput("");
      } else {
        const combined = keys
          .map((k, i) => {
            const item = newMap[k];
            const prefix = item.qNum ? `Câu ${item.qNum}: ` : `Lựa chọn ${i + 1}: `;
            return `${prefix}${item.text}`;
          })
          .join("\n\n");

        if (onFillInput) {
          onFillInput(combined);
        }
      }

      return newMap;
    });
  };

  // 4. Default: Standard text with Clean Markdown and Multi-Question Option Parsing
  let currentQuestionTracker: string | undefined = undefined;

  return (
    <div className="space-y-2.5 text-left text-xs leading-relaxed text-slate-800 font-sans w-full">
      {content.split("\n").map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        // Check if line is a numbered question like "1. Trong 3 Sprint..."
        const numberedQuestionMatch = trimmed.match(/^(\d+[\.\)])\s*(.*)/);
        if (numberedQuestionMatch) {
          const num = numberedQuestionMatch[1].replace(/[\.\)]/, "");
          currentQuestionTracker = num;
          const questionText = numberedQuestionMatch[2];
          return (
            <div key={idx} className="flex items-start gap-2 pt-1.5 font-bold text-slate-900 text-xs">
              <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 font-mono font-extrabold flex items-center justify-center shrink-0 text-[11px] border border-blue-200 shadow-2xs">
                {num}
              </span>
              <div className="flex-1 leading-relaxed">
                {renderFormattedText(questionText)}
              </div>
            </div>
          );
        }

        // Check if line contains Options (e.g., "Option A:", "Option B:", "Option 1:", "Lựa chọn A:")
        const optionRegex = /(?:Option\s+[A-Za-z0-9]+|Lựa chọn\s+[A-Za-z0-9]+)[:\s]/i;
        if (optionRegex.test(trimmed)) {
          return renderOptionLine(
            trimmed,
            idx,
            selectedOptionsMap,
            handleToggleOption,
            currentQuestionTracker
          );
        }

        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          const bulletText = trimmed.replace(/^[-*]\s*/, "");
          return (
            <div key={idx} className="flex items-start gap-2 pl-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
              <div className="flex-1">{renderFormattedText(bulletText)}</div>
            </div>
          );
        }

        return (
          <p key={idx} className="leading-relaxed">
            {renderFormattedText(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

function renderOptionLine(
  line: string,
  lineIdx: number,
  selectedOptionsMap: Record<number, { label: string; text: string; qNum?: string }>,
  onToggleOption: (lineIdx: number, optText: string, optLabel: string, qNum?: string) => void,
  currentQuestionNum?: string
): React.ReactNode {
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
          <span className="text-amber-500">💡</span>
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

          const isSelected = selectedOptionsMap[lineIdx]?.text === trimmedOpt;

          return (
            <div
              key={optIdx}
              onClick={() => onToggleOption(lineIdx, trimmedOpt, optionLabel, currentQuestionNum)}
              className={`flex items-start gap-2.5 p-2 rounded-xl border transition-all cursor-pointer group shadow-2xs ${
                isSelected
                  ? "bg-emerald-50 border-2 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs"
                  : "bg-slate-50/90 hover:bg-emerald-50/60 border-slate-200/90 hover:border-emerald-300"
              }`}
              title={isSelected ? "Đang chọn (Bấm lại để hủy)" : "Bấm để chọn câu trả lời mẫu này"}
            >
              {/* Chấm tròn đổi thành icon check xanh nếu đang chọn */}
              {isSelected ? (
                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </span>
              ) : (
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1.5 shadow-xs group-hover:scale-125 transition-transform ring-2 ring-emerald-200/50" />
              )}

              <div className="text-xs leading-relaxed text-slate-800 flex-1">
                {/* Bôi đậm nổi bật chữ Option A - B */}
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

  const parts = cleanedText.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

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
