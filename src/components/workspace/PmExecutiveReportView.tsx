"use client";

import React, { useState } from "react";
import {
  FileText,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  Copy,
  Check,
  X,
  Target,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";

interface PmExecutiveReportViewProps {
  reportText: string;
  spaceName: string;
  onClose: () => void;
}

interface ParsedMetrics {
  total: number;
  done: number;
  donePercent: number;
  inReview: number;
  inReviewPercent: number;
  inProgress: number;
  inProgressPercent: number;
  todo: number;
  todoPercent: number;
  summaryNote: string;
}

interface TableRow {
  taskId: string;
  title: string;
  status: string;
  priority: string;
  action: string;
}

export function PmExecutiveReportView({
  reportText,
  spaceName,
  onClose,
}: PmExecutiveReportViewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 1. Parse metrics from report text
  const parseMetrics = (): ParsedMetrics => {
    const totalMatch = reportText.match(/(?:tổng số công việc|tổng số|total)[:\s*]+(\d+)/i);
    const doneMatch = reportText.match(/(?:đã hoàn thành|done)[:\s*]+(\d+)[^(\n]*\((?:[+]*([\d\.]+)%|\+*([\d\.]+)%)/i);
    const reviewMatch = reportText.match(/(?:chờ duyệt|chờ pm duyệt|in_review|review)[:\s*]+(\d+)[^(\n]*\((?:[+]*([\d\.]+)%|\+*([\d\.]+)%)/i);
    const progressMatch = reportText.match(/(?:đang thực hiện|đang làm|in_progress)[:\s*]+(\d+)[^(\n]*\((?:[+]*([\d\.]+)%|\+*([\d\.]+)%)/i);
    const todoMatch = reportText.match(/(?:cần làm|todo)[:\s*]+(\d+)[^(\n]*\((?:[+]*([\d\.]+)%|\+*([\d\.]+)%)/i);

    const total = totalMatch ? parseInt(totalMatch[1], 10) : 30;
    const done = doneMatch ? parseInt(doneMatch[1], 10) : 0;
    const inReview = reviewMatch ? parseInt(reviewMatch[1], 10) : 0;
    const inProgress = progressMatch ? parseInt(progressMatch[1], 10) : 0;
    const todo = todoMatch ? parseInt(todoMatch[1], 10) : Math.max(0, total - done - inReview - inProgress);

    const donePercent = total > 0 ? Math.round((done / total) * 100) : 0;
    const inReviewPercent = total > 0 ? Math.round((inReview / total) * 100) : 0;
    const inProgressPercent = total > 0 ? Math.round((inProgress / total) * 100) : 0;
    const todoPercent = total > 0 ? Math.max(0, 100 - donePercent - inReviewPercent - inProgressPercent) : 0;

    // Extract general assessment (Đánh giá chung)
    let summaryNote = "";
    const summaryMatch = reportText.match(/>\s*(?:\*\*)?Đánh giá chung:(?:\*\*)?\s*([^\n]+)/i);
    if (summaryMatch) {
      summaryNote = summaryMatch[1].replace(/[*#]/g, "").trim();
    }

    return {
      total,
      done,
      donePercent,
      inReview,
      inReviewPercent,
      inProgress,
      inProgressPercent,
      todo,
      todoPercent,
      summaryNote,
    };
  };

  const metrics = parseMetrics();

  // 2. Parse sections and table
  const lines = reportText.split("\n");
  const tableRows: TableRow[] = [];
  const riskItems: string[] = [];
  const actionItems: string[] = [];

  let currentSection = "";
  let insideTable = false;

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    if (trimmed.startsWith("### 1.") || trimmed.toLowerCase().includes("tóm tắt tỷ lệ")) {
      currentSection = "METRICS";
      insideTable = false;
    } else if (trimmed.startsWith("### 2.") || trimmed.toLowerCase().includes("phân tích rủi ro")) {
      currentSection = "RISK";
      insideTable = false;
    } else if (trimmed.startsWith("### 3.") || trimmed.toLowerCase().includes("đề xuất hành động") || trimmed.toLowerCase().includes("kế hoạch hành động")) {
      currentSection = "ACTION";
      insideTable = false;
    } else if (trimmed.startsWith("### 4.") || trimmed.toLowerCase().includes("bảng tóm tắt")) {
      currentSection = "TABLE";
      insideTable = true;
    } else if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      if (trimmed.includes("---")) return; // divider row
      if (trimmed.toLowerCase().includes("task id") || trimmed.toLowerCase().includes("tên công việc")) return; // header

      const cells = trimmed
        .split("|")
        .map((c) => c.replace(/[*#]/g, "").trim())
        .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);

      if (cells.length >= 4) {
        tableRows.push({
          taskId: cells[0] || "",
          title: cells[1] || "",
          status: cells[2] || "",
          priority: cells.length >= 5 ? cells[3] : "HIGH",
          action: cells.length >= 5 ? cells[4] : cells[3] || "",
        });
      }
    } else {
      if (currentSection === "RISK" && (trimmed.startsWith("-") || trimmed.startsWith("*") || trimmed.startsWith("•") || /^\d+\./.test(trimmed))) {
        riskItems.push(trimmed.replace(/^[-*•\d\.]+\s*/, ""));
      } else if (currentSection === "ACTION" && (trimmed.startsWith("-") || trimmed.startsWith("*") || trimmed.startsWith("•") || /^\d+\./.test(trimmed))) {
        actionItems.push(trimmed.replace(/^[-*•\d\.]+\s*/, ""));
      }
    }
  });

  const currentDate = new Date().toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden text-slate-800 font-sans text-xs space-y-4 animate-in fade-in duration-200">
      {/* 1. DOCUMENT HEADER */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 shadow-2xs">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-white tracking-tight uppercase">
                Báo Cáo Phân Tích Tiến Độ &amp; Đánh Giá Rủi Ro
              </h3>
              <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-bold">
                PM Agent Report
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-medium mt-0.5">
              Dự án: <strong className="text-white font-bold">{spaceName}</strong> • Ngày lập: {currentDate} • Phụ trách: PM Agent
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-all cursor-pointer"
            title="Sao chép toàn bộ nội dung báo cáo"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Đã sao chép" : "Sao chép"}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Đóng báo cáo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-5">
        {/* 2. EXECUTIVE KPI METRICS CARDS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <span className="font-bold text-xs text-slate-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              1. Thống Kê Tổng Quan Tiến Độ Dự Án
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              Tổng số: <strong>{metrics.total} công việc</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* DONE */}
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 space-y-1">
              <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Đã Hoàn Thành
              </span>
              <div className="flex items-baseline justify-between pt-0.5">
                <span className="text-lg font-black text-emerald-950 font-mono">
                  {metrics.done}
                </span>
                <span className="text-xs font-bold text-emerald-700 font-mono bg-emerald-100/80 px-1.5 py-0.2 rounded-md">
                  {metrics.donePercent}%
                </span>
              </div>
            </div>

            {/* IN_REVIEW */}
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 space-y-1">
              <span className="text-[11px] font-bold text-amber-800 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                Đang Chờ Duyệt
              </span>
              <div className="flex items-baseline justify-between pt-0.5">
                <span className="text-lg font-black text-amber-950 font-mono">
                  {metrics.inReview}
                </span>
                <span className="text-xs font-bold text-amber-700 font-mono bg-amber-100/80 px-1.5 py-0.2 rounded-md">
                  {metrics.inReviewPercent}%
                </span>
              </div>
            </div>

            {/* IN_PROGRESS */}
            <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3 space-y-1">
              <span className="text-[11px] font-bold text-blue-800 flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-blue-600" />
                Đang Thực Hiện
              </span>
              <div className="flex items-baseline justify-between pt-0.5">
                <span className="text-lg font-black text-blue-950 font-mono">
                  {metrics.inProgress}
                </span>
                <span className="text-xs font-bold text-blue-700 font-mono bg-blue-100/80 px-1.5 py-0.2 rounded-md">
                  {metrics.inProgressPercent}%
                </span>
              </div>
            </div>

            {/* TODO */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
              <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                Cần Làm (Tồn đọng)
              </span>
              <div className="flex items-baseline justify-between pt-0.5">
                <span className="text-lg font-black text-slate-900 font-mono">
                  {metrics.todo}
                </span>
                <span className="text-xs font-bold text-slate-600 font-mono bg-slate-200/70 px-1.5 py-0.2 rounded-md">
                  {metrics.todoPercent}%
                </span>
              </div>
            </div>
          </div>

          {/* MULTI-SEGMENT PROGRESS BAR */}
          <div className="space-y-1 pt-1">
            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
              <div
                style={{ width: `${metrics.donePercent}%` }}
                className="bg-emerald-500 transition-all duration-500"
                title={`Đã hoàn thành: ${metrics.donePercent}%`}
              />
              <div
                style={{ width: `${metrics.inReviewPercent}%` }}
                className="bg-amber-400 transition-all duration-500"
                title={`Đang chờ duyệt: ${metrics.inReviewPercent}%`}
              />
              <div
                style={{ width: `${metrics.inProgressPercent}%` }}
                className="bg-blue-500 transition-all duration-500"
                title={`Đang thực hiện: ${metrics.inProgressPercent}%`}
              />
              <div
                style={{ width: `${metrics.todoPercent}%` }}
                className="bg-slate-300 transition-all duration-500"
                title={`Cần làm: ${metrics.todoPercent}%`}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-0.5">
              <span>Tiến độ tổng thể: <strong className="text-slate-800">{metrics.donePercent}% hoàn tất</strong></span>
              <span>Khối lượng còn lại cần xử lý: <strong className="text-slate-800">{100 - metrics.donePercent}%</strong></span>
            </div>
          </div>

          {metrics.summaryNote && (
            <div className="p-3 rounded-xl bg-slate-50 border-l-4 border-indigo-600 text-xs text-slate-700 leading-relaxed font-sans">
              <strong className="text-slate-900 font-bold">Đánh giá chung:</strong> {metrics.summaryNote}
            </div>
          )}
        </div>

        {/* 3. RISKS & BOTTLENECK ANALYSIS */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <span className="font-bold text-xs text-slate-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              2. Phân Tích Rủi Ro &amp; Điểm Nghẽn Tiến Độ
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Risk Box */}
            <div className="bg-red-50/50 border border-red-200/80 rounded-xl p-3.5 space-y-2">
              <span className="text-[11px] font-bold text-red-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-red-600" />
                Rủi ro Mức độ Cao (Critical Risks)
              </span>
              <ul className="space-y-1.5 text-xs text-red-950/90 leading-relaxed">
                {riskItems.filter((r) => !r.toLowerCase().includes("điểm nghẽn") && !r.toLowerCase().includes("ùn tắc")).slice(0, 3).map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-red-500 font-bold shrink-0">•</span>
                    <span>{item.replace(/[*#]/g, "")}</span>
                  </li>
                ))}
                {riskItems.length === 0 && (
                  <li className="text-slate-500 italic">Không có rủi ro nghiêm trọng ở mức đỏ.</li>
                )}
              </ul>
            </div>

            {/* Bottlenecks Box */}
            <div className="bg-amber-50/50 border border-amber-200/80 rounded-xl p-3.5 space-y-2">
              <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600" />
                Điểm Nghẽn Hiện Tại (Bottlenecks)
              </span>
              <ul className="space-y-1.5 text-xs text-amber-950/90 leading-relaxed">
                {riskItems.filter((r) => r.toLowerCase().includes("điểm nghẽn") || r.toLowerCase().includes("ùn tắc") || r.toLowerCase().includes("tồn đọng")).map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-amber-500 font-bold shrink-0">•</span>
                    <span>{item.replace(/[*#]/g, "")}</span>
                  </li>
                ))}
                {riskItems.filter((r) => r.toLowerCase().includes("điểm nghẽn") || r.toLowerCase().includes("ùn tắc")).length === 0 && (
                  <li className="text-slate-500 italic">Cột In-Review và In-Progress đang lưu thông ổn định.</li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* 4. ACTION PLAN */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <span className="font-bold text-xs text-slate-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Target className="w-4 h-4 text-emerald-600" />
              3. Kế Hoạch Hành Động Đề Xuất Cho PM
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {actionItems.slice(0, 4).map((action, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white transition-colors space-y-1"
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                  <span className="w-4 h-4 rounded-md bg-indigo-100 text-indigo-700 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 border border-indigo-200">
                    {idx + 1}
                  </span>
                  <span className="truncate">{action.split(":")[0]?.replace(/[*#]/g, "")}</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed pl-5.5">
                  {action.includes(":") ? action.split(":").slice(1).join(":").replace(/[*#]/g, "").trim() : action}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 5. STRUCTURED PRIORITY TABLE */}
        {tableRows.length > 0 && (
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <span className="font-bold text-xs text-slate-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-600" />
                4. Bảng Thứ Tự Ưu Tiên Xử Lý Tiếp Theo
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {tableRows.length} hạng mục trọng tâm
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold font-mono text-[11px]">
                    <th className="p-2.5">Task ID</th>
                    <th className="p-2.5">Tên công việc</th>
                    <th className="p-2.5">Trạng thái</th>
                    <th className="p-2.5">Ưu tiên</th>
                    <th className="p-2.5">Hành động đề xuất</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {tableRows.map((row, rIdx) => {
                    const isUrgent = row.priority.toUpperCase().includes("URGENT");
                    const isHigh = row.priority.toUpperCase().includes("HIGH");
                    const isReview = row.status.toUpperCase().includes("REVIEW");
                    const isInProgress = row.status.toUpperCase().includes("PROGRESS");

                    return (
                      <tr key={rIdx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-2.5 font-mono font-bold text-indigo-700 whitespace-nowrap">
                          {row.taskId}
                        </td>
                        <td className="p-2.5 font-medium text-slate-900">
                          {row.title}
                        </td>
                        <td className="p-2.5 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold border ${
                              isReview
                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                : isInProgress
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-slate-100 text-slate-700 border-slate-200"
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="p-2.5 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold border ${
                              isUrgent
                                ? "bg-red-50 text-red-700 border-red-200"
                                : isHigh
                                ? "bg-orange-50 text-orange-700 border-orange-200"
                                : "bg-blue-50 text-blue-700 border-blue-200"
                            }`}
                          >
                            {row.priority}
                          </span>
                        </td>
                        <td className="p-2.5 font-semibold text-slate-800">
                          {row.action}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
