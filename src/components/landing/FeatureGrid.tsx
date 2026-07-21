"use client";

import React from "react";
import {
  LayoutDashboard,
  Kanban,
  Bell,
  Smartphone,
  History,
  ShieldCheck,
  Zap,
  Layers,
} from "lucide-react";

const FEATURES = [
  {
    icon: Kanban,
    color: "text-indigo-400",
    bg: "bg-indigo-500/10 border-indigo-500/20",
    title: "Bảng Kanban 4 Trạng Thái",
    description:
      "Quản lý trực quan với 4 cột TODO, IN_PROGRESS, REVIEW, DONE. Hỗ trợ kéo thả mượt mà với Optimistic UI updates giúp phản hồi tức thì.",
  },
  {
    icon: Layers,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10 border-cyan-500/20",
    title: "Cấu Trúc Workspace & Space",
    description:
      "Phân tầng tổ chức khoa học từ Workspace tổng quát cho đến các Space theo Sprint/Giai đoạn. Quản lý phân quyền chặt chẽ Admin, PM và Member.",
  },
  {
    icon: Bell,
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/20",
    title: "Thông Báo Realtime STOMP",
    description:
      "Kết nối WebSocket liên tục tới notification-service. Cập nhật thông báo đẩy (Toast & Unread Badge) khi có thay đổi trạng thái thẻ hay tin nhắn.",
  },
  {
    icon: Smartphone,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    title: "Mobile App Sync (React Native Expo)",
    description:
      "Ứng dụng di động giúp thành viên cập nhật nhanh Task, nhận Push Notification và tương tác với AI Agents mọi lúc mọi nơi.",
  },
  {
    icon: History,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    title: "Nhật Ký Workspace Logs & Notes",
    description:
      "Ghi lại toàn bộ lịch sử biến động dữ liệu (workspace_logs) và thảo luận (task_notes) minh bạch, dễ dàng tra cứu kiểm vết.",
  },
  {
    icon: ShieldCheck,
    color: "text-rose-400",
    bg: "bg-rose-500/10 border-rose-500/20",
    title: "Bảo Mật API Gateway & JWT",
    description:
      "Mọi giao tiếp client-server đều đi qua API Gateway cổng 8080 với cơ chế Axios Interceptors tự động đính kèm & refresh JWT Token an toàn.",
  },
];

export function FeatureGrid() {
  return (
    <section id="features" className="py-24 relative bg-slate-950/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-panel border border-cyan-500/30 text-xs font-semibold text-cyan-300">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>Nền Tảng Quản Lý Hiện Đại</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-100">
            Tính Năng Nổi Bật Dành Cho <span className="gradient-text">Agile Teams</span>
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            Được tối ưu cho trải nghiệm người dùng mượt mà, sẵn sàng đáp ứng dự án vừa và lớn.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, idx) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={idx}
                className="glass-card rounded-2xl p-6 border border-white/10 flex flex-col justify-between group"
              >
                <div>
                  <div
                    className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-5 ${feature.bg}`}
                  >
                    <IconComponent className={`w-6 h-6 ${feature.color} group-hover:scale-110 transition-transform`} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-100 mb-2 group-hover:text-cyan-300 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
