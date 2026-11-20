"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  MessageSquare,
  Check,
  ExternalLink,
  X,
  Info,
  Clock,
  ArrowRightLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { AppNotification } from "@/types/notification";
import { notificationService } from "@/services/notification.service";
import { useAuthStore } from "@/stores/useAuthStore";

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className = "" }: NotificationBellProps) {
  const { user } = useAuthStore();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [selectedDetail, setSelectedDetail] = useState<AppNotification | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!user?.id) return;
    try {
      const [list, count] = await Promise.all([
        notificationService.getNotificationsByUserId(user.id),
        notificationService.getUnreadCount(user.id),
      ]);
      setNotifications(list);
      setUnreadCount(count);
    } catch (err) {
      console.warn("Failed to load notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Tự động kiểm tra thời gian thực mỗi 4 giây
    const interval = setInterval(fetchNotifications, 4000);

    // Lắng nghe qua BroadcastChannel giữa các tab trình duyệt
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("proga_notifications");
      bc.onmessage = () => {
        fetchNotifications();
      };
    } catch {}

    const handleUpdate = () => {
      fetchNotifications();
    };
    window.addEventListener("space_tasks_updated", handleUpdate);
    window.addEventListener("task_status_changed", handleUpdate);

    return () => {
      clearInterval(interval);
      if (bc) bc.close();
      window.removeEventListener("space_tasks_updated", handleUpdate);
      window.removeEventListener("task_status_changed", handleUpdate);
    };
  }, [user?.id]);

  // Đóng popover khi bấm ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpenItem = async (item: AppNotification) => {
    if (!item.isRead) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      await notificationService.markAsRead(item.id);
    }

    if (item.spaceId) {
      setIsOpen(false);
      const targetWorkspaceId = item.workspaceId || 1;
      const targetUrl = item.taskId
        ? `/workspaces/${targetWorkspaceId}/spaces/${item.spaceId}?taskId=${item.taskId}`
        : `/workspaces/${targetWorkspaceId}/spaces/${item.spaceId}`;
      router.push(targetUrl);
      if (item.taskId) {
        window.dispatchEvent(
          new CustomEvent("open_task_detail", {
            detail: { taskId: item.taskId, spaceId: item.spaceId },
          })
        );
      }
    } else {
      setSelectedDetail(item);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.id || unreadCount === 0) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    await notificationService.markAllAsRead(user.id);
  };

  const getNotificationIcon = (typeCode?: string | null) => {
    switch (typeCode) {
      case "TASK_ASSIGNED":
        return <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />;
      case "TASK_APPROVED":
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />;
      case "TASK_REJECTED":
        return <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />;
      case "TASK_COMMENTED":
        return <MessageSquare className="w-4 h-4 text-indigo-600 shrink-0" />;
      case "TASK_IN_REVIEW":
        return <Clock className="w-4 h-4 text-purple-600 shrink-0" />;
      case "STATUS_CHANGED":
        return <ArrowRightLeft className="w-4 h-4 text-teal-600 shrink-0" />;
      default:
        return <Bell className="w-4 h-4 text-slate-600 shrink-0" />;
    }
  };

  // Định dạng thời gian chuẩn xác, khắc phục triệt để lỗi lệch múi giờ (7 giờ trước)
  const formatTime = (timeStr?: string) => {
    if (!timeStr) return "";
    try {
      const normalized =
        timeStr.includes("Z") || timeStr.includes("+")
          ? timeStr
          : `${timeStr}Z`;
      const date = new Date(normalized);
      const now = new Date();
      let diffMs = now.getTime() - date.getTime();
      if (diffMs < 0) diffMs = 0;

      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);

      if (diffSecs < 60) return "Vừa xong";
      if (diffMins < 60) return `${diffMins} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;

      return date.toLocaleDateString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
      });
    } catch {
      return timeStr;
    }
  };

  return (
    <>
      <div ref={containerRef} className={`relative font-sans ${className}`}>
        {/* Nút Chuông Thông Báo */}
        <button
          type="button"
          onClick={() => {
            setIsOpen((prev) => !prev);
            if (!isOpen) fetchNotifications();
          }}
          className="relative p-2 rounded-xl bg-white hover:bg-slate-100 border border-[#E5E7EB] text-slate-700 hover:text-black transition-all cursor-pointer shadow-2xs"
          title="Thông báo quan trọng"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center font-mono shadow-xs animate-in zoom-in-75">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* Popover Danh Sách Thông Báo */}
        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white border border-[#E5E7EB] rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-3.5 border-b border-[#F3F4F6] flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-slate-700" />
                <h4 className="font-extrabold text-xs text-[#111827] uppercase tracking-wider font-mono">
                  Thông báo
                </h4>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-red-100 text-red-700 text-[10px] font-bold font-mono">
                    {unreadCount} mới
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer transition-colors"
                  title="Đánh dấu tất cả là đã đọc"
                >
                  <Check className="w-3 h-3" />
                  <span>Đã đọc tất cả</span>
                </button>
              )}
            </div>

            {/* Body List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {notifications.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <Bell className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500 font-medium">
                    Bạn không có thông báo nào mới.
                  </p>
                  <p className="text-[10px] text-slate-400 italic">
                    Hệ thống chỉ thông báo khi có phân công, nghiệm thu hoặc trao đổi liên quan đến bạn.
                  </p>
                </div>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleOpenItem(item)}
                    className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer hover:bg-slate-50 text-left relative group ${
                      !item.isRead ? "bg-blue-50/40" : "bg-white"
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-slate-100 shrink-0 mt-0.5 group-hover:bg-white group-hover:shadow-2xs transition-all">
                      {getNotificationIcon(item.typeCode)}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h5
                          className={`text-xs leading-snug line-clamp-1 ${
                            !item.isRead ? "font-bold text-[#111827]" : "font-semibold text-slate-700"
                          }`}
                        >
                          {item.title}
                        </h5>
                        {!item.isRead && (
                          <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1" />
                        )}
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                        {item.content}
                      </p>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-slate-400 font-mono">
                          {formatTime(item.createdAt)}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDetail(item);
                            }}
                            className="text-[10px] text-slate-500 hover:text-black font-medium"
                          >
                            Xem chi tiết
                          </button>
                          {item.spaceId && (
                            <span className="text-[10px] text-blue-600 font-medium flex items-center gap-0.5">
                              <span>Mở</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-2 border-t border-[#F3F4F6] bg-slate-50/50 text-center text-[10px] text-slate-400 font-mono">
              Chỉ thông báo các sự kiện quan trọng để tránh làm phiền
            </div>
          </div>
        )}
      </div>

      {/* Modal Chi Tiết Thông Báo */}
      {selectedDetail && (
        <div className="fixed inset-0 bg-[#111827]/40 backdrop-blur-xs z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 font-sans">
            <div className="flex items-start justify-between gap-3 border-b border-[#F3F4F6] pb-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-xl bg-slate-100 shrink-0">
                  {getNotificationIcon(selectedDetail.typeCode)}
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-[#111827] leading-snug">
                    {selectedDetail.title}
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {formatTime(selectedDetail.createdAt)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetail(null)}
                className="p-1 text-slate-400 hover:text-black rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
              {selectedDetail.content}
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSelectedDetail(null)}
                className="px-4 py-2 border border-[#E5E7EB] bg-white hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
              >
                Đóng
              </button>
              {selectedDetail.spaceId && (
                <button
                  type="button"
                  onClick={() => {
                    const item = selectedDetail;
                    setSelectedDetail(null);
                    setIsOpen(false);
                    const targetWorkspaceId = item.workspaceId || 1;
                    const targetUrl = item.taskId
                      ? `/workspaces/${targetWorkspaceId}/spaces/${item.spaceId}?taskId=${item.taskId}`
                      : `/workspaces/${targetWorkspaceId}/spaces/${item.spaceId}`;
                    router.push(targetUrl);
                    if (item.taskId) {
                      window.dispatchEvent(
                        new CustomEvent("open_task_detail", {
                          detail: { taskId: item.taskId, spaceId: item.spaceId },
                        })
                      );
                    }
                  }}
                  className="px-4 py-2 bg-[#111827] hover:bg-black text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>Mở công việc liên quan</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
