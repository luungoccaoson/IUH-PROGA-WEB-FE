"use client";

import React, { useState } from "react";
import { Sparkles, Bot, Layers, CheckCircle2, ArrowRight, Clock, Tag, RefreshCw, Send, AlertCircle, PlusCircle } from "lucide-react";
import { aiService, TaskDecompositionResponse, DecomposedTaskItem } from "@/services/ai.service";
import { taskService } from "@/services/task.service";
import { sprintService } from "@/services/sprint.service";

interface TaskDecompositionTabProps {
  spaceId: number;
  onTasksImported?: () => void;
}

const SAMPLE_REQUIREMENTS = [
  {
    label: "🛒 Sàn Thương Mại Điện Tử Microservices",
    text: "Phát triển sàn thương mại điện tử quy mô lớn hỗ trợ danh mục sản phẩm ElasticSearch, giỏ hàng Redis, thanh toán VNPAY/MoMo, theo dõi đơn hàng và email hóa đơn.",
  },
  {
    label: "📱 App Ngân Hàng Số & Sinh Trắc Học",
    text: "Xây dựng ứng dụng ngân hàng số bảo mật cao với xác thực sinh trắc học FaceID, chuyển tiền liên ngân hàng 24/7 Napas, quét mã VietQR và phát hiện giao dịch bất thường.",
  },
  {
    label: "🚗 Đặt Xe Công Nghệ & Giao Hàng GPS",
    text: "Xây dựng ứng dụng đặt xe công nghệ real-time với định vị GPS, thuật toán ghép tài xế tối ưu gần nhất, tính cước phí động surge pricing và bản đồ lộ trình.",
  },
  {
    label: "🤖 Chatbot AI CSKH Doanh Nghiệp (RAG)",
    text: "Phát triển nền tảng Chatbot AI tự động trả lời thắc mắc của khách hàng dựa trên kho tài liệu doanh nghiệp RAG, hỗ trợ nhúng SDK vào Website và chuyển giao tư vấn viên.",
  },
];

export function TaskDecompositionTab({ spaceId, onTasksImported }: TaskDecompositionTabProps) {
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

    try {
      setLoading(true);
      setError("");
      setImportSuccess(false);

      const data = await aiService.decomposeRequirements(spaceId, text.trim());
      setResult(data);
    } catch (err: any) {
      console.error("Error decomposing requirements:", err);
      setError("Không thể phân rã bài toán. Vui lòng kiểm tra lại kết nối AI-Service.");
    } finally {
      setLoading(false);
    }
  };

  // Group tasks by Sprint
  const groupedTasks: Record<string, DecomposedTaskItem[]> = {};
  if (result?.tasks) {
    result.tasks.forEach((t) => {
      const sprintName = t.sprint || "Sprint 1";
      if (!groupedTasks[sprintName]) groupedTasks[sprintName] = [];
      groupedTasks[sprintName].push(t);
    });
  }

  // Handle auto-importing tasks to space
  const handleImportTasksToSpace = async () => {
    if (!result || !result.tasks || result.tasks.length === 0) return;

    try {
      setImporting(true);
      setImportSuccess(false);

      // Get existing sprints in space
      const existingSprints = await sprintService.getSprintsBySpace(spaceId);
      const activeSprint = existingSprints.find((s) => s.status === "ACTIVE") || existingSprints[0];

      // Import each task into space
      for (const item of result.tasks) {
        await taskService.createTask({
          spaceId,
          sprintId: activeSprint ? activeSprint.id : undefined,
          title: item.title,
          description: `[AI Decomposed] ${item.description}\nThứ tự Sprint gợi ý: ${item.sprint}`,
          priority: item.priority,
          status: "TODO",
        });
      }

      setImportSuccess(true);
      if (onTasksImported) onTasksImported();
    } catch (err: any) {
      console.error("Error importing tasks to space:", err);
      alert("Không thể tự động nạp Task vào Space.");
    } finally {
      setImporting(false);
    }
  };

  const getPriorityBadgeStyle = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-[#FCE8E6] text-[#D93025] border-[#FADBD8]";
      case "HIGH":
        return "bg-[#FEF7E0] text-[#B06000] border-[#FEEFC3]";
      case "MEDIUM":
        return "bg-[#E8F0FE] text-[#1A73E8] border-[#D2E3FC]";
      default:
        return "bg-[#E6F4EA] text-[#137333] border-[#CEEAD6]";
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#111827] to-[#1F2937] text-white p-6 rounded-2xl shadow-sm space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md border border-white/10">
            <Sparkles className="w-6 h-6 text-[#FBBF24] animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold tracking-tight">Requirement Agent - Phân Rã Bài Toán Tự Động</h2>
            <p className="text-xs text-[#9CA3AF] font-medium">
              Ứng dụng RAG Vector Database kết hợp Spring AI bóc tách bài toán thành danh sách Task theo từng Sprint
            </p>
          </div>
        </div>

        {/* Preset Sample Prompts */}
        <div className="pt-2">
          <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#9CA3AF] mb-2">
            Mẫu yêu cầu bài toán gợi ý (Bấm để thử nghiệm ngay):
          </p>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_REQUIREMENTS.map((req, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setRequirementText(req.text);
                  handleDecompose(req.text);
                }}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-medium border border-white/15 transition-all text-left"
              >
                {req.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Requirement Input Form */}
      <div className="bg-white border border-[#E5E7EB] p-5 rounded-2xl shadow-2xs space-y-4">
        <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#374151]">
          Mô tả bài toán / Yêu cầu tính năng cần phân rã:
        </label>
        <textarea
          rows={4}
          value={requirementText}
          onChange={(e) => setRequirementText(e.target.value)}
          placeholder="Nhập chi tiết yêu cầu bài toán hoặc chọn các mẫu gợi ý phía trên..."
          className="w-full p-3.5 border border-[#E5E7EB] rounded-xl text-sm font-sans text-[#111827] focus:outline-hidden focus:ring-2 focus:ring-[#111827] focus:border-transparent placeholder-[#9CA3AF]"
        />

        {error && (
          <div className="flex items-center gap-2 p-3 bg-[#FDEDEC] text-[#D93025] rounded-xl text-xs font-bold border border-[#FADBD8]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-[#6B7280]">
            💡 AI sẽ tự động phân tích ngữ nghĩa, rút tri thức từ Vector DB và phân chia Task theo Sprint.
          </p>
          <button
            onClick={() => handleDecompose()}
            disabled={loading || !requirementText.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#111827] text-white hover:bg-[#1F2937] active:scale-95 disabled:opacity-50 disabled:scale-100 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-[#FBBF24]" />
                Đang truy vấn AI RAG...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Phân Rã Bài Toán
              </>
            )}
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="bg-[#F9FAFB] border border-[#E5E7EB] p-8 rounded-2xl text-center space-y-4 animate-pulse">
          <Bot className="w-10 h-10 text-[#1A73E8] mx-auto animate-bounce" />
          <div className="space-y-2">
            <h3 className="font-extrabold text-sm text-[#111827]">Đang truy vấn Kho tri thức Vector RAG...</h3>
            <p className="text-xs text-[#6B7280] font-mono">Requirement Agent đang phân tích ngữ nghĩa bài toán và chia task theo Sprint</p>
          </div>
        </div>
      )}

      {/* Results View */}
      {result && !loading && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Summary Card */}
          <div className="bg-[#F0F7FF] border border-[#D2E3FC] p-5 rounded-2xl flex items-start justify-between">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#1A73E8]">
                <CheckCircle2 className="w-4 h-4" />
                Kết Quả Phân Rã Bằng RAG AI Agent
              </div>
              <h3 className="text-base font-extrabold text-[#111827]">{result.summary}</h3>
              <p className="text-xs text-[#4B5563]">
                Tổng số task được tạo: <strong className="text-[#111827]">{result.tasks.length} tasks</strong> phân chia theo {Object.keys(groupedTasks).length} Sprint.
              </p>
            </div>

            {/* One-click Import Button */}
            <div className="space-y-2 text-right">
              <button
                onClick={handleImportTasksToSpace}
                disabled={importing || importSuccess}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#137333] hover:bg-[#0D652D] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-60"
              >
                {importing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Đang nạp Task vào Space...
                  </>
                ) : importSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#A8DAB5]" />
                    Đã nạp thành công!
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    Tự Động Nạp Tasks Vào Space
                  </>
                )}
              </button>
              {importSuccess && (
                <p className="text-[11px] text-[#137333] font-bold">
                  Các Task đã xuất hiện trong danh sách Task & Bảng Kanban!
                </p>
              )}
            </div>
          </div>

          {/* Grouped Tasks By Sprint */}
          <div className="space-y-6">
            {Object.entries(groupedTasks).map(([sprintName, taskList], groupIdx) => (
              <div key={groupIdx} className="bg-white border border-[#E5E7EB] rounded-2xl p-5 space-y-4 shadow-2xs">
                {/* Sprint Group Title */}
                <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3">
                  <div className="w-7 h-7 rounded-lg bg-[#111827] text-white flex items-center justify-center font-mono font-bold text-xs">
                    S{groupIdx + 1}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-[#111827]">{sprintName}</h4>
                    <p className="text-[11px] text-[#6B7280]">Bao gồm {taskList.length} hạng mục công việc</p>
                  </div>
                </div>

                {/* Tasks List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {taskList.map((task, taskIdx) => (
                    <div
                      key={taskIdx}
                      className="p-4 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] hover:border-[#111827] transition-all space-y-2.5 shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h5 className="font-extrabold text-sm text-[#111827] leading-snug">
                          {task.title}
                        </h5>
                        <span
                          className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md border shrink-0 ${getPriorityBadgeStyle(
                            task.priority
                          )}`}
                        >
                          {task.priority}
                        </span>
                      </div>

                      <p className="text-xs text-[#4B5563] leading-relaxed line-clamp-3">
                        {task.description}
                      </p>

                      <div className="flex items-center justify-between text-[11px] font-mono text-[#6B7280] pt-1 border-t border-[#E5E7EB]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#111827]" />
                          Ước tính: {task.estimatedDays || 2} ngày
                        </span>
                        <span className="text-[#137333] font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Ready for Dev
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
