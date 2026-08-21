"use client";

import React from "react";
import { MessageSquare, Plus, CheckCircle, Clock, Trash2 } from "lucide-react";
import { AiThreadResponse } from "@/services/ai.service";

export interface ChatSessionItem {
  thread: AiThreadResponse;
  title: string;
  taskCount?: number;
  isImported?: boolean;
}

interface AiChatSidebarSessionsProps {
  sessions: ChatSessionItem[];
  activeThreadId: number | null;
  onSelectSession: (threadId: number) => void;
  onNewSession: () => void;
}

export function AiChatSidebarSessions({
  sessions,
  activeThreadId,
  onSelectSession,
  onNewSession,
}: AiChatSidebarSessionsProps) {
  return (
    <div className="w-full md:w-72 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl p-4 space-y-4 font-sans shrink-0">
      {/* New Session Button */}
      <button
        onClick={onNewSession}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#111827] hover:bg-black text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        <span>Tạo Cuộc Hội Thoại Mới</span>
      </button>

      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] font-mono font-bold uppercase text-[#6B7280]">
          Lịch Sử Phiên Chat ({sessions.length})
        </span>
      </div>

      {/* Sessions List */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
        {sessions.length === 0 ? (
          <div className="text-center py-6 text-xs text-[#9CA3AF]">
            <MessageSquare className="w-6 h-6 mx-auto mb-2 opacity-50" />
            <span>Chưa có phiên chat nào. Hãy nhập câu hỏi để bắt đầu.</span>
          </div>
        ) : (
          sessions.map((item) => {
            const isActive = activeThreadId === item.thread.id;
            return (
              <div
                key={item.thread.id}
                onClick={() => onSelectSession(item.thread.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                  isActive
                    ? "bg-white border-[#111827] shadow-sm ring-1 ring-[#111827]/10"
                    : "bg-[#F3F4F6]/50 border-transparent hover:bg-white hover:border-[#E5E7EB]"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <MessageSquare
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isActive ? "text-[#1A73E8]" : "text-[#6B7280]"
                      }`}
                    />
                    <h4 className="text-xs font-bold text-[#111827] truncate leading-tight">
                      {item.title || `Phiên chat #${item.thread.id}`}
                    </h4>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-[#6B7280]">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#9CA3AF]" />
                    {new Date(item.thread.createdAt).toLocaleDateString("vi-VN")}
                  </span>

                  {item.isImported ? (
                    <span className="flex items-center gap-0.5 text-[#137333] bg-[#E6F4EA] px-1.5 py-0.5 rounded font-bold">
                      <CheckCircle className="w-3 h-3" /> Đã nạp
                    </span>
                  ) : item.taskCount ? (
                    <span className="bg-[#E8F0FE] text-[#1A73E8] px-1.5 py-0.5 rounded font-bold">
                      {item.taskCount} tasks
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
