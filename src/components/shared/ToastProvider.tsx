"use client";

import React, { useState, useEffect, useCallback } from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface AlertDialogState {
  isOpen: boolean;
  type: ToastType;
  title: string;
  message: string;
}

// Global Event Emitter for toasts and modals so any file can trigger them without hook constraints
export const toast = {
  success: (message: string, title?: string, duration = 4000) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("app_toast", {
          detail: { type: "success", title: title || "Thành công", message, duration },
        })
      );
    }
  },
  error: (message: string, title?: string, duration = 5000) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("app_toast", {
          detail: { type: "error", title: title || "Lỗi", message, duration },
        })
      );
    }
  },
  warning: (message: string, title?: string, duration = 5000) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("app_toast", {
          detail: { type: "warning", title: title || "Lưu ý", message, duration },
        })
      );
    }
  },
  info: (message: string, title?: string, duration = 4000) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("app_toast", {
          detail: { type: "info", title: title || "Thông tin", message, duration },
        })
      );
    }
  },
  // Opens a centered modal dialog with an "Đã hiểu" confirmation button
  alert: (message: string, title?: string, type: ToastType = "warning") => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("app_alert_dialog", {
          detail: {
            title: title || (type === "warning" ? "Thông báo quy trình" : "Thông báo"),
            message,
            type,
          },
        })
      );
    }
  },
};

export function ToastProvider() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [alertDialog, setAlertDialog] = useState<AlertDialogState>({
    isOpen: false,
    type: "warning",
    title: "",
    message: "",
  });

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    // 1. Intercept native window.alert to render our custom beautiful modal
    if (typeof window !== "undefined") {
      const originalAlert = window.alert;

      window.alert = (message?: any) => {
        const rawMsg = String(message || "");
        // Clean leading emojis or prefixes
        let cleanMsg = rawMsg.replace(/^[⚠️❗❌ℹ️\s]+/, "").trim();
        let title = "Thông báo hệ thống";

        if (cleanMsg.includes("Quy trình nghiệm thu")) {
          title = "Quy trình nghiệm thu";
        } else if (cleanMsg.includes("quyền") || cleanMsg.includes("vai trò")) {
          title = "Phân quyền quản lý";
        } else if (cleanMsg.includes("Không thể") || cleanMsg.includes("Lỗi")) {
          title = "Không thể thực hiện";
        }

        // Display as our elegant dialog
        setAlertDialog({
          isOpen: true,
          type: cleanMsg.includes("Lỗi") || cleanMsg.includes("Không thể") ? "error" : "warning",
          title,
          message: cleanMsg,
        });
      };

      // 2. Handle Custom Toast Event
      const handleToastEvent = (e: Event) => {
        const customEvent = e as CustomEvent<{
          type: ToastType;
          title?: string;
          message: string;
          duration?: number;
        }>;
        if (!customEvent.detail) return;

        const newId = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const newItem: ToastItem = {
          id: newId,
          type: customEvent.detail.type || "info",
          title: customEvent.detail.title,
          message: customEvent.detail.message,
          duration: customEvent.detail.duration || 4500,
        };

        setToasts((prev) => [...prev.slice(-4), newItem]); // Max 5 toasts on screen

        if (newItem.duration && newItem.duration > 0) {
          setTimeout(() => {
            removeToast(newId);
          }, newItem.duration);
        }
      };

      // 3. Handle Custom Alert Dialog Event
      const handleAlertDialogEvent = (e: Event) => {
        const customEvent = e as CustomEvent<{
          type?: ToastType;
          title: string;
          message: string;
        }>;
        if (!customEvent.detail) return;

        setAlertDialog({
          isOpen: true,
          type: customEvent.detail.type || "warning",
          title: customEvent.detail.title,
          message: customEvent.detail.message,
        });
      };

      window.addEventListener("app_toast", handleToastEvent);
      window.addEventListener("app_alert_dialog", handleAlertDialogEvent);

      return () => {
        window.alert = originalAlert;
        window.removeEventListener("app_toast", handleToastEvent);
        window.removeEventListener("app_alert_dialog", handleAlertDialogEvent);
      };
    }
  }, [removeToast]);

  return (
    <>
      {/* ====================================================================
          1. FLOATING TOASTS (Top-Right / Top-Center)
          ==================================================================== */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none p-2 sm:p-0">
        {toasts.map((t) => {
          const isSuccess = t.type === "success";
          const isError = t.type === "error";
          const isWarning = t.type === "warning";

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl bg-white shadow-xl border transition-all animate-in slide-in-from-top-3 fade-in duration-200 ${
                isSuccess
                  ? "border-emerald-200 text-emerald-950"
                  : isError
                  ? "border-red-200 text-red-950"
                  : isWarning
                  ? "border-amber-200 text-amber-950"
                  : "border-blue-200 text-blue-950"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  isSuccess
                    ? "bg-emerald-100 text-emerald-700"
                    : isError
                    ? "bg-red-100 text-red-700"
                    : isWarning
                    ? "bg-amber-100 text-amber-800"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {isSuccess && <CheckCircle2 className="w-4 h-4" />}
                {isError && <AlertCircle className="w-4 h-4" />}
                {isWarning && <AlertTriangle className="w-4 h-4" />}
                {!isSuccess && !isError && !isWarning && <Info className="w-4 h-4" />}
              </div>

              <div className="flex-1 min-w-0 pr-1">
                {t.title && (
                  <h5 className="font-extrabold text-xs font-sans mb-0.5 text-slate-900">
                    {t.title}
                  </h5>
                )}
                <p className="text-xs text-slate-600 leading-relaxed font-sans break-words">
                  {t.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors cursor-pointer"
                title="Đóng"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* ====================================================================
          2. ELEGANT APP ALERT DIALOG (Replacing native localhost:3000 alert)
          ==================================================================== */}
      {alertDialog.isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 font-sans">
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  alertDialog.type === "error"
                    ? "bg-red-50 text-red-600 border border-red-200"
                    : alertDialog.type === "success"
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                {alertDialog.type === "error" && <AlertCircle className="w-5 h-5" />}
                {alertDialog.type === "success" && <CheckCircle2 className="w-5 h-5" />}
                {alertDialog.type !== "error" && alertDialog.type !== "success" && (
                  <AlertTriangle className="w-5 h-5" />
                )}
              </div>

              <div className="flex-1 space-y-1">
                <h4 className="font-extrabold text-[#111827] text-sm">
                  {alertDialog.title}
                </h4>
                <p className="text-xs text-[#4B5563] leading-relaxed">
                  {alertDialog.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setAlertDialog((prev) => ({ ...prev, isOpen: false }))}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAlertDialog((prev) => ({ ...prev, isOpen: false }))}
                className="px-5 py-2 bg-[#111827] hover:bg-[#1f2937] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
