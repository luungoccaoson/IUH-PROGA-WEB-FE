"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  MessageSquare,
  History,
  Send,
  Filter,
  CheckCircle2,
  RefreshCw,
  User as UserIcon,
  Trash2,
  RotateCcw,
  Layers,
  ChevronDown,
  Info,
} from "lucide-react";
import { Task, Sprint } from "@/types";
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
import { computeTaskNumberMap, formatTaskCode } from "@/utils/taskNumber";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { SearchableTaskDropdown } from "./SearchableTaskDropdown";

interface SpaceDiscussionsTabProps {
  spaceId: number;
  tasks?: Task[];
  sprints?: Sprint[];
  members?: any[];
  currentUserId?: number;
  onSelectTask?: (task: Task) => void;
}

export function SpaceDiscussionsTab({
  spaceId,
  tasks = [],
  sprints = [],
  members = [],
  currentUserId,
  onSelectTask,
}: SpaceDiscussionsTabProps) {
  const [activeTab, setActiveTab] = useState<"discussions" | "logs">(
    "discussions",
  );
  const [notes, setNotes] = useState<TaskNote[]>([]);
  const [logs, setLogs] = useState<WorkspaceLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSprintId, setSelectedSprintId] = useState<
    number | "backlog" | "all"
  >(() => {
    const active = sprints.find((s) => s.status === "ACTIVE");
    if (active) return active.id;
    return "all";
  });
  const [selectedTaskId, setSelectedTaskId] = useState<number | "all">("all");
  const [visibleNotesCount, setVisibleNotesCount] = useState(10);
  const [visibleLogsCount, setVisibleLogsCount] = useState(15);
  const [newComment, setNewComment] = useState("");
  const [targetTaskId, setTargetTaskId] = useState<number | null>(null);
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

  const hasInitializedSprintRef = useRef(false);

  // Tự động focus vào Sprint hiện tại đang diễn ra (ACTIVE) khi danh sách Sprints sẵn sàng
  useEffect(() => {
    if (!hasInitializedSprintRef.current && sprints.length > 0) {
      const active = sprints.find((s) => s.status === "ACTIVE");
      if (active) {
        setSelectedSprintId(active.id);
        hasInitializedSprintRef.current = true;
      }
    }
  }, [sprints]);

  const taskNumberMap = React.useMemo(
    () => computeTaskNumberMap(tasks, sprints),
    [tasks, sprints],
  );

  // Danh sách công việc của bản thân người dùng hiện tại đang phụ trách (chưa hoàn thành)
  const myActiveTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.isDeleted || t.status === "DONE") return false;
      const taskOwnerId = t.ownerId || (t.assignee as any)?.id;
      return Boolean(currentUserId && taskOwnerId === currentUserId);
    });
  }, [tasks, currentUserId]);

  // Tự động chọn task đầu tiên của bản thân nếu chưa có lựa chọn hoặc lựa chọn không còn hợp lệ
  useEffect(() => {
    if (myActiveTasks.length > 0) {
      setTargetTaskId((prev) => {
        if (prev && myActiveTasks.some((t) => t.id === prev)) {
          return prev;
        }
        const sorted = [...myActiveTasks].sort((a, b) => {
          const numA = taskNumberMap.get(a.id) ?? a.id;
          const numB = taskNumberMap.get(b.id) ?? b.id;
          return numA - numB;
        });
        return sorted[0]?.id || null;
      });
    } else {
      setTargetTaskId(null);
    }
  }, [myActiveTasks, taskNumberMap]);

  const fetchSpaceData = async () => {
    if (!spaceId) return;
    setLoading(true);
    try {
      const [fetchedNotes, fetchedLogs] = await Promise.all([
        discussionService.getNotesBySpaceId(spaceId),
        discussionService.getLogsBySpaceId(spaceId),
      ]);
      setNotes(fetchedNotes);
      setLogs(
        fetchedLogs.filter(
          (l) =>
            l.actionType !== "COMMENT" &&
            !l.logMessage?.toLowerCase().includes("thảo luận") &&
            !l.logMessage?.toLowerCase().includes("ghi chú"),
        ),
      );
    } catch (err) {
      console.warn("Failed to load space discussions/logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpaceData();

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("proga_task_notes");
      bc.onmessage = (event) => {
        const data = event.data;
        if (!data) return;
        if (data.type === "NEW_NOTE") {
          setNotes((prev) =>
            prev.some((n) => n.id === data.note.id)
              ? prev
              : [data.note, ...prev],
          );
        } else if (data.type === "DELETE_NOTE") {
          setNotes((prev) => prev.filter((n) => n.id !== data.noteId));
        }
      };
    } catch {}

    const timer = setInterval(() => {
      fetchSpaceData();
    }, 4000);

    return () => {
      clearInterval(timer);
      if (bc) bc.close();
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current.timeout);
        clearInterval(undoTimerRef.current.interval);
      }
    };
  }, [spaceId]);

  // Bước 1: Khi bấm nút xóa -> Hỏi xác nhận trước (ConfirmDialog)
  const handleRequestDelete = (note: TaskNote) => {
    setNoteToDelete(note);
  };

  // Bước 2: Người dùng xác nhận xóa -> Xóa tạm trên UI & cho phép Hoàn tác trong 8s
  const handleConfirmDelete = () => {
    if (!noteToDelete) return;
    const targetNote = noteToDelete;
    setNoteToDelete(null);

    // Hủy bỏ timer hoàn tác cũ nếu có và xóa vĩnh viễn note trước đó
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current.timeout);
      clearInterval(undoTimerRef.current.interval);
      undoTimerRef.current = null;
    }

    // Tạm xóa trên giao diện để phản hồi tức thì
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
          targetNote.taskId,
          currentUserId,
        );
        if (typeof window !== "undefined") {
          try {
            const bc = new BroadcastChannel("proga_task_notes");
            bc.postMessage({
              type: "DELETE_NOTE",
              noteId: targetNote.id,
              taskId: targetNote.taskId,
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

  // Bước 3: Người dùng bấm Hoàn tác trong vòng 8 giây
  const handleUndoDelete = () => {
    if (!undoDelete) return;
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current.timeout);
      clearInterval(undoTimerRef.current.interval);
      undoTimerRef.current = null;
    }
    const restored = undoDelete.note;
    setNotes((prev) =>
      prev.some((n) => n.id === restored.id) ? prev : [restored, ...prev],
    );
    setUndoDelete(null);
    toast.success("Đã hoàn tác khôi phục thảo luận!");
  };

  const handlePostDiscussion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !targetTaskId || submitting) return;

    const targetTask = tasks.find((t) => t.id === targetTaskId);
    if (targetTask?.status === "DONE") {
      toast.error("Công việc này đã hoàn thành. Không thể gửi thêm thảo luận mới!");
      return;
    }

    try {
      setSubmitting(true);
      const authorId = currentUserId || 1;
      const created = await discussionService.createNote(targetTaskId, {
        authorId,
        noteContent: newComment.trim(),
        taskTitle: targetTask?.title,
      });
      setNotes((prev) => [created, ...prev]);
      setNewComment("");
      toast.success("Đã đăng thảo luận thành công!");
    } catch (err) {
      toast.error("Không thể đăng thảo luận. Vui lòng thử lại!");
    } finally {
      setSubmitting(false);
    }
  };

  const getMemberInfo = (userId: number) => {
    const member = members.find((m) => m.id === userId || m.userId === userId);
    return {
      name:
        member?.fullName ||
        member?.displayName ||
        member?.name ||
        `Thành viên #${userId}`,
      avatar: member?.avatarUrl || null,
      email: member?.email || "",
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

  // Danh sách công việc thuộc Sprint được chọn (hoặc tất cả / Backlog)
  const sprintFilteredTasks = useMemo(() => {
    if (selectedSprintId === "all") return tasks.filter((t) => !t.isDeleted);
    if (selectedSprintId === "backlog") {
      const sprintIds = new Set(sprints.map((s) => s.id));
      return tasks.filter(
        (t) => !t.isDeleted && (!t.sprintId || !sprintIds.has(t.sprintId)),
      );
    }
    return tasks.filter(
      (t) => !t.isDeleted && t.sprintId === selectedSprintId,
    );
  }, [tasks, sprints, selectedSprintId]);

  const sprintTaskIds = useMemo(() => {
    return new Set(sprintFilteredTasks.map((t) => t.id));
  }, [sprintFilteredTasks]);

  // Lọc thảo luận theo Sprint & Task
  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      if (selectedSprintId !== "all" && !sprintTaskIds.has(n.taskId)) {
        return false;
      }
      if (selectedTaskId !== "all" && n.taskId !== selectedTaskId) {
        return false;
      }
      return true;
    });
  }, [notes, selectedSprintId, sprintTaskIds, selectedTaskId]);

  // Lọc nhật ký hoạt động theo Sprint & Task
  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      if (
        selectedSprintId !== "all" &&
        (!l.taskId || !sprintTaskIds.has(l.taskId))
      ) {
        return false;
      }
      if (selectedTaskId !== "all" && l.taskId !== selectedTaskId) {
        return false;
      }
      return true;
    });
  }, [logs, selectedSprintId, sprintTaskIds, selectedTaskId]);

  // Phân trang 10 thảo luận mỗi trang (bấm "Xem thêm" để tải tiếp)
  const displayedNotes = useMemo(
    () => filteredNotes.slice(0, visibleNotesCount),
    [filteredNotes, visibleNotesCount],
  );

  const displayedLogs = useMemo(
    () => filteredLogs.slice(0, visibleLogsCount),
    [filteredLogs, visibleLogsCount],
  );

  return (
    <div className="space-y-4 font-sans animate-in fade-in duration-200">
      {/* Top Card: Navigation & Task Filter */}
      <div className="p-4 bg-white border border-[#E5E7EB] rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Subtabs */}
        <div className="flex items-center gap-1 bg-[#F3F4F6] p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab("discussions")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "discussions"
                ? "bg-white text-[#111827] shadow-xs"
                : "text-[#6B7280] hover:text-[#111827]"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Thảo luận công việc ({notes.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("logs")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "logs"
                ? "bg-white text-[#111827] shadow-xs"
                : "text-[#6B7280] hover:text-[#111827]"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Nhật ký hoạt động ({logs.length})</span>
          </button>
        </div>

        {/* Sprint & Task Filters & Refresh Button */}
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          {/* Lọc theo Sprint */}
          <div className="flex items-center gap-1.5 bg-[#F9FAFB] border border-[#E5E7EB] px-2.5 py-2 rounded-xl text-xs font-mono">
            <Layers className="w-3.5 h-3.5 text-[#6B7280] shrink-0" />
            <select
              value={selectedSprintId}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedSprintId(
                  val === "all" ? "all" : val === "backlog" ? "backlog" : Number(val),
                );
                setSelectedTaskId("all");
                setVisibleNotesCount(10);
              }}
              className="bg-transparent font-bold text-[#111827] focus:outline-none cursor-pointer max-w-[200px] truncate"
              title="Lọc thảo luận theo Sprint hoặc Backlog"
            >
              <option value="all">Tất cả Sprint &amp; Backlog</option>
              {sprints.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (
                  {s.status === "ACTIVE"
                    ? "Đang chạy"
                    : s.status === "CLOSED"
                      ? "Đã đóng"
                      : "Sắp tới"}
                  )
                </option>
              ))}
              <option value="backlog">Backlog (Tồn đọng)</option>
            </select>
          </div>

          {/* Lọc theo Task (hỗ trợ tìm kiếm & sắp xếp tăng dần Task-1, Task-2...) */}
          <SearchableTaskDropdown
            tasks={sprintFilteredTasks}
            taskNumberMap={taskNumberMap}
            value={selectedTaskId}
            onChange={(val) => {
              setSelectedTaskId(val);
              setVisibleNotesCount(10);
            }}
            allowAll={true}
            allLabel="Tất cả công việc"
            icon={Filter}
            className="w-full sm:w-[250px]"
          />

          <button
            type="button"
            onClick={fetchSpaceData}
            disabled={loading}
            className="p-2 border border-[#E5E7EB] bg-white hover:bg-gray-50 rounded-xl text-slate-600 transition-colors cursor-pointer shrink-0"
            title="Tải lại dữ liệu"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === "discussions" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: Message Thread List */}
          <div className="lg:col-span-2 space-y-3">
            {filteredNotes.length === 0 ? (
              <div className="p-10 bg-white border border-[#E5E7EB] rounded-2xl text-center text-slate-500 text-xs">
                Chưa có trao đổi nào trong phạm vi đã chọn.
              </div>
            ) : (
              <div className="space-y-3">
                {displayedNotes.map((note) => {
                  const author = getMemberInfo(note.authorId);
                  const isMe = currentUserId && note.authorId === currentUserId;

                  return (
                    <div
                      key={note.id}
                      className="p-4 bg-white border border-[#E5E7EB] rounded-2xl shadow-2xs space-y-2 hover:border-[#111827]/30 transition-all"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          {author.avatar ? (
                            <img
                              src={author.avatar}
                              alt={author.name}
                              className="w-7 h-7 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0">
                              {author.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-[#111827] text-xs">
                                {author.name}
                              </span>
                              {isMe && (
                                <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 font-mono text-[9px] font-bold">
                                  Bạn
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {formatTimestamp(note.createdAt)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isMe && (
                            <button
                              type="button"
                              onClick={() => handleRequestDelete(note)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                              title="Xóa thảo luận này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {note.taskTitle && (
                            <button
                              type="button"
                              onClick={() => {
                                const found = tasks.find(
                                  (t) => t.id === note.taskId,
                                );
                                if (found && onSelectTask) onSelectTask(found);
                              }}
                              className={`px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-mono text-[11px] font-bold border border-slate-200 max-w-[280px] truncate ${
                                onSelectTask
                                  ? "hover:bg-slate-200 cursor-pointer"
                                  : ""
                              }`}
                            >
                              {formatTaskCode(note.taskId, taskNumberMap)}
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-slate-800 text-xs whitespace-pre-wrap leading-relaxed pt-1 pl-9">
                        {note.noteContent}
                      </p>
                    </div>
                  );
                })}

                {/* Nút Xem thêm thảo luận cũ (mỗi lần nạp thêm 10 thảo luận) */}
                {filteredNotes.length > visibleNotesCount && (
                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => setVisibleNotesCount((prev) => prev + 10)}
                      className="px-4 py-2 bg-white hover:bg-slate-50 border border-[#E5E7EB] rounded-xl text-xs font-bold text-slate-700 hover:text-black shadow-2xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                      <span>
                        Xem thêm thảo luận cũ (còn{" "}
                        {filteredNotes.length - visibleNotesCount})
                      </span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: New Discussion Form (Chỉ cho phép thảo luận nhanh các task của bản thân đang nhận, chưa hoàn thành) */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-sm space-y-3 h-fit sticky top-4">
            <h4 className="font-extrabold text-sm text-[#111827] flex items-center gap-2 pb-2 border-b border-[#F3F4F6]">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <span>Gửi thảo luận mới</span>
            </h4>

            {myActiveTasks.length === 0 ? (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2 font-bold text-slate-800">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Chỉ thảo luận nhanh việc của bạn</span>
                </div>
                <p className="leading-relaxed text-[11px] text-slate-600">
                  Bạn hiện không có công việc nào đang nhận hoặc các công việc đã hoàn thành.
                </p>
                <div className="pt-1.5 border-t border-slate-200/60 text-[11px] text-slate-500 leading-normal">
                  💡 Để trao đổi về công việc của thành viên khác, vui lòng nhấn vào chi tiết công việc đó từ danh sách hoặc bảng Kanban.
                </div>
              </div>
            ) : (
              <form onSubmit={handlePostDiscussion} className="space-y-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-[#111827] uppercase tracking-wider font-mono text-[10px]">
                      Công việc của bạn ({myActiveTasks.length}):
                    </label>
                  </div>
                  <SearchableTaskDropdown
                    tasks={myActiveTasks}
                    taskNumberMap={taskNumberMap}
                    value={targetTaskId ?? myActiveTasks[0]?.id ?? "all"}
                    onChange={(val) => {
                      if (typeof val === "number") setTargetTaskId(val);
                    }}
                    placeholder="Chọn công việc của bạn..."
                    className="w-full"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#111827] uppercase tracking-wider font-mono text-[10px]">
                    Nội dung trao đổi:
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Ghi chú giải pháp, báo cáo tiến độ hoặc đặt câu hỏi cho thành viên khác..."
                    className="w-full p-3 bg-slate-50 border border-[#E5E7EB] rounded-xl text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#111827] focus:bg-white resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || !newComment.trim() || !targetTaskId}
                  className="w-full py-2.5 bg-[#111827] hover:bg-black text-white font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? "Đang gửi..." : "Đăng thảo luận"}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      ) : (
        /* ACTIVITY LOGS TIMELINE */
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm space-y-4">
          <h4 className="font-extrabold text-sm text-[#111827] flex items-center gap-2 pb-3 border-b border-[#F3F4F6]">
            <History className="w-4 h-4 text-emerald-600" />
            <span>
              Lịch sử hoạt động và Dòng kiểm vết công việc (Audit Trail)
            </span>
          </h4>

          {filteredLogs.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-6 text-center">
              Chưa có nhật ký hoạt động nào được ghi nhận.
            </p>
          ) : (
            <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
              {displayedLogs.map((log) => {
                const user = getMemberInfo(log.userId);
                return (
                  <div
                    key={log.id}
                    className="relative flex items-start gap-4 pl-1"
                  >
                    <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-slate-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 bg-white z-10 text-slate-700">
                      •
                    </div>

                    <div className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between text-[11px] gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#111827]">
                            {user.name}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 font-mono text-[9px] font-bold">
                            {formatActionTypeVn(log.actionType)}
                          </span>
                          <span className="text-slate-400 font-mono text-[10px]">
                            {formatTimestamp(log.createdAt)}
                          </span>
                        </div>

                        {log.taskTitle && (
                          <button
                            type="button"
                            onClick={() => {
                              const found = tasks.find(
                                (t) => t.id === log.taskId,
                              );
                              if (found && onSelectTask) onSelectTask(found);
                            }}
                            className={`px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200 font-mono text-[10px] font-bold ${
                              onSelectTask
                                ? "hover:bg-slate-100 cursor-pointer"
                                : ""
                            }`}
                          >
                            {formatTaskCode(log.taskId, taskNumberMap)}:{" "}
                            {log.taskTitle}
                          </button>
                        )}
                      </div>

                      <p className="text-slate-700 text-xs leading-normal">
                        {formatLogMessageVn(log.logMessage)}
                      </p>

                      {log.oldValue && log.newValue && (
                        <div className="flex items-center gap-2 text-[10px] font-mono bg-white p-1 rounded border border-slate-200 w-fit">
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
                  </div>
                );
              })}

              {/* Nút Xem thêm nhật ký cũ */}
              {filteredLogs.length > visibleLogsCount && (
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setVisibleLogsCount((prev) => prev + 10)}
                    className="px-4 py-2 bg-white hover:bg-slate-50 border border-[#E5E7EB] rounded-xl text-xs font-bold text-slate-700 hover:text-black shadow-2xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span>
                      Xem thêm nhật ký cũ (còn{" "}
                      {filteredLogs.length - visibleLogsCount})
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

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
