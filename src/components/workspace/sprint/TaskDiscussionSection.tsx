"use client";

import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, History, Send, Clock, User as UserIcon, RefreshCw, Trash2, RotateCcw, Lock } from "lucide-react";
import {
  TaskNote,
  WorkspaceLog,
  formatStatusVn,
  formatPriorityVn,
  formatActionTypeVn,
  formatLogMessageVn,
} from "@/types/discussion";
import { discussionService } from "@/services/discussion.service";
import { toast } from "@/components/shared/ToastProvider";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

interface TaskDiscussionSectionProps {
  taskId: number;
  taskTitle: string;
  currentUserId?: number;
  members?: any[];
  taskStatus?: string;
  isDone?: boolean;
}

export function TaskDiscussionSection({
  taskId,
  taskTitle,
  currentUserId,
  members = [],
  taskStatus,
  isDone = false,
}: TaskDiscussionSectionProps) {
  const [activeSubTab, setActiveSubTab] = useState<"discussion" | "logs">("discussion");
  const [notes, setNotes] = useState<TaskNote[]>([]);
  const [logs, setLogs] = useState<WorkspaceLog[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Trạng thái xác nhận xóa & Hoàn tác trong 8 giây
  const [noteToDelete, setNoteToDelete] = useState<TaskNote | null>(null);
  const [undoDelete, setUndoDelete] = useState<{
    note: TaskNote;
    countdown: number;
  } | null>(null);
  const undoTimerRef = useRef<{
    timeout: NodeJS.Timeout;
    interval: NodeJS.Timeout;
  } | null>(null);

  const fetchDiscussionData = async (silent = false) => {
    if (!taskId) return;
    if (!silent) setLoading(true);
    try {
      const [fetchedNotes, fetchedLogs] = await Promise.all([
        discussionService.getNotesByTaskId(taskId),
        discussionService.getLogsByTaskId(taskId),
      ]);
      setNotes(fetchedNotes);
      // Exclude comment actions from activity logs
      setLogs(
        fetchedLogs.filter(
          (l) =>
            l.actionType !== "COMMENT" &&
            !l.logMessage?.toLowerCase().includes("thảo luận") &&
            !l.logMessage?.toLowerCase().includes("ghi chú")
        )
      );
    } catch (err) {
      console.warn("Error fetching task notes/logs:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscussionData();

    // 1. Multi-tab & Component Realtime BroadcastChannel
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("proga_task_notes");
      bc.onmessage = (event) => {
        const data = event.data;
        if (!data) return;
        if (data.type === "NEW_NOTE" && data.taskId === taskId) {
          setNotes((prev) => (prev.some((n) => n.id === data.note.id) ? prev : [...prev, data.note]));
        } else if (data.type === "DELETE_NOTE" && data.taskId === taskId) {
          setNotes((prev) => prev.filter((n) => n.id !== data.noteId));
        }
      };
    } catch {}

    // 2. Realtime Polling Loop (Silent 3-second heartbeat for instant multi-user cross-browser updates)
    const timer = setInterval(() => {
      fetchDiscussionData(true);
    }, 3000);

    return () => {
      clearInterval(timer);
      if (bc) bc.close();
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current.timeout);
        clearInterval(undoTimerRef.current.interval);
      }
    };
  }, [taskId]);

  const handleRequestDelete = (note: TaskNote) => {
    setNoteToDelete(note);
  };

  const handleConfirmDelete = () => {
    if (!noteToDelete) return;
    const targetNote = noteToDelete;
    setNoteToDelete(null);

    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current.timeout);
      clearInterval(undoTimerRef.current.interval);
      undoTimerRef.current = null;
    }

    setNotes((prev) => prev.filter((n) => n.id !== targetNote.id));

    let count = 8;
    setUndoDelete({ note: targetNote, countdown: count });

    const interval = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        clearInterval(interval);
      } else {
        setUndoDelete((prev) =>
          prev && prev.note.id === targetNote.id
            ? { ...prev, countdown: count }
            : null,
        );
      }
    }, 1000);

    const timeout = setTimeout(async () => {
      clearInterval(interval);
      setUndoDelete((prev) => (prev?.note.id === targetNote.id ? null : prev));
      undoTimerRef.current = null;
      try {
        await discussionService.deleteNote(
          targetNote.id,
          taskId,
          currentUserId,
        );
        if (typeof window !== "undefined") {
          try {
            const bc = new BroadcastChannel("proga_task_notes");
            bc.postMessage({
              type: "DELETE_NOTE",
              noteId: targetNote.id,
              taskId,
            });
            bc.close();
          } catch {}
        }
      } catch (err) {
        console.warn("Failed to permanently delete note:", err);
      }
    }, 8000);

    undoTimerRef.current = { timeout, interval };
  };

  const handleUndoDelete = () => {
    if (!undoDelete) return;
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current.timeout);
      clearInterval(undoTimerRef.current.interval);
      undoTimerRef.current = null;
    }
    const restored = undoDelete.note;
    setNotes((prev) =>
      prev.some((n) => n.id === restored.id) ? prev : [...prev, restored],
    );
    setUndoDelete(null);
    toast.success("Đã hoàn tác khôi phục thảo luận!");
  };

  const isTaskLocked = Boolean(isDone || taskStatus === "DONE");

  const handleSendComment = async () => {
    const trimmed = newComment.trim();
    if (!trimmed || submitting || isTaskLocked) return;

    try {
      setSubmitting(true);
      const authorId = currentUserId || 1;
      const created = await discussionService.createNote(taskId, {
        authorId,
        noteContent: trimmed,
        taskTitle,
      });
      setNotes((prev) => (prev.some((n) => n.id === created.id) ? prev : [...prev, created]));
      setNewComment("");

      // Broadcast realtime event
      if (typeof window !== "undefined") {
        try {
          const bc = new BroadcastChannel("proga_task_notes");
          bc.postMessage({ type: "NEW_NOTE", note: created, taskId });
          bc.close();

          const bcNotif = new BroadcastChannel("proga_notifications");
          bcNotif.postMessage({ type: "NEW_NOTIFICATION" });
          bcNotif.close();
        } catch {}
      }

      toast.success("Đã đăng thảo luận mới!");
    } catch (err) {
      toast.error("Không thể gửi thảo luận. Vui lòng thử lại!");
    } finally {
      setSubmitting(false);
    }
  };

  const getMemberInfo = (userId: number) => {
    const member = members.find(
      (m) =>
        m.id === userId ||
        m.userId === userId ||
        m.id?.userId === userId ||
        m.user?.id === userId,
    );
    return {
      name:
        member?.fullName ||
        member?.displayName ||
        member?.user?.fullName ||
        member?.user?.email ||
        member?.name ||
        (userId === currentUserId ? "Tôi" : `Thành viên #${userId}`),
      avatar: member?.avatarUrl || member?.user?.avatarUrl || null,
      email: member?.email || member?.user?.email || "",
    };
  };

  const formatTimestamp = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="border border-[#E5E7EB] rounded-2xl bg-white overflow-hidden shadow-2xs font-sans">
      {/* Sub-tab navigation */}
      <div className="flex items-center justify-between px-3 pt-2 bg-slate-50 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveSubTab("discussion")}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-mono text-[11px] font-bold transition-all cursor-pointer ${
              activeSubTab === "discussion"
                ? "border-[#111827] text-[#111827]"
                : "border-transparent text-[#6B7280] hover:text-[#111827]"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Thảo luận ({notes.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("logs")}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-mono text-[11px] font-bold transition-all cursor-pointer ${
              activeSubTab === "logs"
                ? "border-[#111827] text-[#111827]"
                : "border-transparent text-[#6B7280] hover:text-[#111827]"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Nhật ký thay đổi ({logs.length})</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => fetchDiscussionData(false)}
          disabled={loading}
          className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer transition-colors"
          title="Tải lại thảo luận và nhật ký"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="p-3.5 space-y-3">
        {/* VIEW 1: DISCUSSIONS / COMMENTS */}
        {activeSubTab === "discussion" && (
          <div className="space-y-3">
            {/* Comment List */}
            {notes.length === 0 ? (
              <p className="text-[11px] text-[#9CA3AF] italic py-2 text-center">
                Chưa có trao đổi nào trên công việc này. Hãy để lại thảo luận đầu tiên bên dưới.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {notes.map((note) => {
                  const author = getMemberInfo(note.authorId);
                  const isMe = Boolean(currentUserId && note.authorId === currentUserId);

                  return (
                    <div
                      key={note.id}
                      className={`p-3 rounded-2xl border text-xs leading-relaxed space-y-1.5 transition-colors group ${
                        isMe
                          ? "bg-blue-50/50 border-blue-200"
                          : "bg-slate-50/70 border-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {author.avatar ? (
                            <img
                              src={author.avatar}
                              alt={author.name}
                              className="w-5 h-5 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                              {author.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="font-bold text-[#111827] text-[11px] truncate">
                            {author.name}
                          </span>
                          {isMe && (
                            <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 font-mono text-[9px] font-bold">
                              Bạn
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] text-[#9CA3AF] font-mono">
                            {formatTimestamp(note.createdAt)}
                          </span>

                          {/* Delete button (Only for own comments) */}
                          {isMe && (
                            <button
                              type="button"
                              onClick={() => handleRequestDelete(note)}
                              className="opacity-70 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 rounded transition-all cursor-pointer"
                              title="Xóa thảo luận này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-slate-800 text-xs whitespace-pre-wrap pl-7">
                        {note.noteContent}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Nếu công việc đã hoàn thành: Khóa thảo luận để lưu trữ */}
            {isTaskLocked ? (
              <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-xs font-medium">
                <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                <span>
                  Công việc này đã hoàn thành. Mục thảo luận đã được khóa để lưu trữ hồ sơ.
                </span>
              </div>
            ) : (
              <>
                {/* Gợi ý nhắn nhanh (Quick Reminder Chips - 3 nút phổ biến, tinh gọn không rối) */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1.5 border-t border-slate-100">
                  <span className="text-[10px] font-mono text-slate-400 font-bold">Gợi ý nhanh:</span>
                  <button
                    type="button"
                    onClick={() => setNewComment("⚡ Nhắc nhở: Vui lòng đẩy nhanh tiến độ công việc này nhé!")}
                    className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-medium transition-colors cursor-pointer"
                    title="Điền lời nhắc đẩy nhanh tiến độ"
                  >
                    ⚡ Nhắc đẩy nhanh
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewComment("📋 Xin cập nhật tình hình tiến độ hiện tại của task này.")}
                    className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-medium transition-colors cursor-pointer"
                    title="Điền lời xin cập nhật tiến độ"
                  >
                    📋 Cập nhật tiến độ
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewComment("🔍 Bạn có đang gặp vướng mắc kỹ thuật cần hỗ trợ không?")}
                    className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-medium transition-colors cursor-pointer"
                    title="Điền câu hỏi hỗ trợ vướng mắc"
                  >
                    🔍 Cần hỗ trợ vướng mắc
                  </button>
                </div>

                {/* Input Box (Pure div, no nested form) */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSendComment();
                      }
                    }}
                    placeholder="Nhập nội dung thảo luận..."
                    className="flex-1 px-3 py-2 bg-slate-50 border border-[#E5E7EB] rounded-xl text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#111827] focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSendComment();
                    }}
                    disabled={submitting || !newComment.trim()}
                    className="px-3.5 py-2 bg-[#111827] hover:bg-black text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Gửi</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* VIEW 2: TASK ACTIVITY LOGS (PURE VIETNAMESE, NO COMMENT LOGS) */}
        {activeSubTab === "logs" && (
          <div className="space-y-2">
            {logs.length === 0 ? (
              <p className="text-[11px] text-[#9CA3AF] italic py-2 text-center">
                Chưa có nhật ký ghi nhận hoạt động nào cho công việc này.
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {logs.map((log) => {
                  const user = getMemberInfo(log.userId);
                  return (
                    <div
                      key={log.id}
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[11px] text-[#6B7280]">
                        <span className="font-bold text-[#111827]">
                          {user.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 font-mono text-[9px] font-bold">
                            {formatActionTypeVn(log.actionType)}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">
                            {formatTimestamp(log.createdAt)}
                          </span>
                        </div>
                      </div>

                      <p className="text-slate-700 text-xs leading-normal">
                        {formatLogMessageVn(log.logMessage)}
                      </p>

                      {log.oldValue && log.newValue && (
                        <div className="flex items-center gap-1.5 text-[10px] font-mono bg-white p-1.5 rounded-lg border border-slate-200 w-fit">
                          <span className="line-through text-red-500 font-semibold">
                            {formatStatusVn(log.oldValue)}
                          </span>
                          <span className="text-slate-400">→</span>
                          <span className="font-bold text-emerald-600">
                            {formatStatusVn(log.newValue)}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirm Dialog: Xác nhận trước khi xóa thảo luận */}
      <ConfirmDialog
        isOpen={noteToDelete !== null}
        title="Xác nhận xóa thảo luận"
        message="Bạn có chắc chắn muốn xóa thảo luận này không? Bạn vẫn có thể hoàn tác trong vòng 8 giây sau khi bấm xóa."
        confirmText="Xác nhận xóa"
        cancelText="Hủy bỏ"
        onConfirm={handleConfirmDelete}
        onCancel={() => setNoteToDelete(null)}
      />

      {/* Floating Undo Banner: Cho phép Hoàn tác xóa thảo luận trong 8 giây */}
      {undoDelete && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#111827] text-white px-5 py-3 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-3.5 animate-in slide-in-from-bottom duration-200 font-sans">
          <span className="text-xs font-semibold">
            Đã xóa thảo luận ({undoDelete.countdown}s)
          </span>
          <div className="h-4 w-px bg-white/20" />
          <button
            type="button"
            onClick={handleUndoDelete}
            className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold font-mono transition-colors cursor-pointer shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Hoàn tác</span>
          </button>
        </div>
      )}
    </div>
  );
}
