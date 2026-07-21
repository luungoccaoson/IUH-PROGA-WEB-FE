"use client";

import React, { useState } from "react";
import { Plus, MoreHorizontal, Clock } from "lucide-react";

interface ProjectItem {
  id: string;
  name: string;
  client: string;
  dueDate: string;
  statusText: string;
  statusType: "success" | "warning";
  progress: number;
}

const INITIAL_PROJECTS: ProjectItem[] = [
  {
    id: "proj-1",
    name: "Hệ thống ERP nội bộ",
    client: "Công ty ABC",
    dueDate: "2026-08-15",
    statusText: "Đúng tiến độ",
    statusType: "success",
    progress: 72,
  },
  {
    id: "proj-2",
    name: "Hệ sinh thái PROGA Platform",
    client: "IUH KLTN - Khoa CNTT",
    dueDate: "2026-09-30",
    statusText: "Đúng tiến độ",
    statusType: "success",
    progress: 85,
  },
  {
    id: "proj-3",
    name: "Ứng dụng Mobile Expo Sync",
    client: "PROGA Team",
    dueDate: "2026-07-28",
    statusText: "Cần chú ý",
    statusType: "warning",
    progress: 40,
  },
];

export default function WorkspacesPage() {
  const [projects, setProjects] = useState<ProjectItem[]>(INITIAL_PROJECTS);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjName, setNewProjName] = useState("");
  const [newProjClient, setNewProjClient] = useState("");

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;

    const newProj: ProjectItem = {
      id: `proj-${Date.now()}`,
      name: newProjName,
      client: newProjClient || "Nội bộ",
      dueDate: "2026-10-15",
      statusText: "Đúng tiến độ",
      statusType: "success",
      progress: 0,
    };

    setProjects([newProj, ...projects]);
    setNewProjName("");
    setNewProjClient("");
    setShowCreateModal(false);
  };

  return (
    <div className="max-w-6xl space-y-8 animate-in fade-in duration-300">
      {/* Header Bar matching image: Dashboard + [+ Dự án mới] */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] font-sans">
          Dashboard
        </h1>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl bg-white border border-[#111827] text-[#111827] font-bold text-sm hover:bg-[#F6F5EF] transition-all shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Dự án mới</span>
          </button>
          <button className="p-2 text-[#6B7280] hover:text-[#111827]">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 4 Summary Stat Cards matching uploaded image in #F6F5EF warm cream */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: TỔNG DỰ ÁN */}
        <div className="bg-[#F6F5EF] p-5 rounded-2xl border border-[#E5E7EB] space-y-2 shadow-sm">
          <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#6B7280]">
            TỔNG DỰ ÁN
          </p>
          <p className="text-3xl font-extrabold text-[#111827] font-sans">
            4
          </p>
          <p className="text-xs text-[#4B5563] font-medium">
            Đang quản lý
          </p>
        </div>

        {/* Card 2: HOÀN THÀNH */}
        <div className="bg-[#F6F5EF] p-5 rounded-2xl border border-[#E5E7EB] space-y-2 shadow-sm">
          <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#6B7280]">
            HOÀN THÀNH
          </p>
          <p className="text-3xl font-extrabold text-[#137333] font-sans">
            1
          </p>
          <p className="text-xs text-[#4B5563] font-medium">
            Dự án xong
          </p>
        </div>

        {/* Card 3: CẦN CHÚ Ý */}
        <div className="bg-[#F6F5EF] p-5 rounded-2xl border border-[#E5E7EB] space-y-2 shadow-sm">
          <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#6B7280]">
            CẦN CHÚ Ý
          </p>
          <p className="text-3xl font-extrabold text-[#D93025] font-sans">
            2
          </p>
          <p className="text-xs text-[#4B5563] font-medium">
            Rủi ro / Trễ
          </p>
        </div>

        {/* Card 4: TIẾN ĐỘ TB */}
        <div className="bg-[#F6F5EF] p-5 rounded-2xl border border-[#E5E7EB] space-y-2 shadow-sm">
          <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#6B7280]">
            TIẾN ĐỘ TB
          </p>
          <p className="text-3xl font-extrabold text-[#111827] font-sans">
            56%
          </p>
          <p className="text-xs text-[#4B5563] font-medium">
            Trung bình
          </p>
        </div>
      </div>

      {/* Projects List Section matching image */}
      <div className="space-y-4 pt-4">
        <h2 className="text-base font-bold text-[#111827] font-sans">
          Tất cả dự án
        </h2>

        <div className="space-y-4">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className="bg-white p-6 rounded-2xl border border-[#3B82F6] shadow-sm hover:shadow-md transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-[#111827] font-sans">
                    {proj.name}
                  </h3>
                  <p className="text-xs text-[#6B7280] mt-1 font-mono">
                    {proj.client} · Hạn: {proj.dueDate}
                  </p>
                </div>

                <div>
                  {proj.statusType === "success" && (
                    <span className="px-3 py-1 rounded-full bg-[#E6F4EA] text-[#137333] text-xs font-bold font-sans">
                      Đúng tiến độ
                    </span>
                  )}
                  {proj.statusType === "warning" && (
                    <span className="px-3 py-1 rounded-full bg-[#FEF3C7] text-[#D97706] text-xs font-bold font-sans">
                      Cần chú ý
                    </span>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5 pt-2 border-t border-[#F6F5EF]">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#6B7280]">Tiến độ</span>
                  <span className="font-bold text-[#111827]">{proj.progress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#F6F5EF] overflow-hidden">
                  <div
                    className="h-full bg-[#111827] rounded-full transition-all duration-500"
                    style={{ width: `${proj.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: New Project */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
              <h3 className="text-lg font-bold text-[#111827] font-sans">
                Tạo Dự Án Mới
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-[#6B7280] font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4 font-sans">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#111827] font-mono">
                  Tên Dự Án *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Hệ thống ERP nội bộ"
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#F6F5EF] text-sm text-[#111827] focus:outline-none focus:border-[#111827]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#111827] font-mono">
                  Đơn vị / Khách hàng
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Công ty ABC"
                  value={newProjClient}
                  onChange={(e) => setNewProjClient(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#F6F5EF] text-sm text-[#111827] focus:outline-none focus:border-[#111827]"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#E5E7EB] font-mono">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#6B7280]"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#111827] text-white text-xs font-bold shadow-md"
                >
                  Tạo Dự Án
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
