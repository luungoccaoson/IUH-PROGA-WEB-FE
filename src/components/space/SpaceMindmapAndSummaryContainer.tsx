"use client";

import React, { useState } from "react";
import { GitBranch, Maximize2, Minimize2 } from "lucide-react";
import { Space, Task, Sprint } from "@/types";
import { SpaceProgressMindmap } from "./SpaceProgressMindmap";

interface SpaceMindmapAndSummaryContainerProps {
  space?: Space | null;
  tasks: Task[];
  sprints?: Sprint[];
  members?: any[];
  currentUser?: any;
  onSelectTask?: (task: Task) => void;
}

export function SpaceMindmapAndSummaryContainer({
  space,
  tasks,
  sprints = [],
  members = [],
  currentUser,
  onSelectTask,
}: SpaceMindmapAndSummaryContainerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerClasses = isFullscreen
    ? "fixed inset-3 z-50 bg-white border border-[#CBD5E1] rounded-2xl shadow-2xl overflow-y-auto p-6 flex flex-col space-y-4"
    : "bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-2xs space-y-4";

  return (
    <div className={containerClasses}>
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F3F4F6] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#EFF6FF] to-[#EEF2FF] text-[#1A73E8] flex items-center justify-center border border-[#BFDBFE] shrink-0">
            <GitBranch className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#111827]">
                Sơ đồ Mindmap Tiến độ Dự án
              </h3>
            </div>
            <p className="text-xs text-[#6B7280]">
              Lộ trình phát triển từ Đề tài Space ➔ Sprints ➔ Task theo phong cách Roadmap.
            </p>
          </div>
        </div>

        {/* FULLSCREEN BUTTON */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "Thu nhỏ" : "Phóng to toàn màn hình"}
            className="p-2 text-[#4B5563] hover:text-[#111827] hover:bg-[#F3F4F6] rounded-xl border border-[#E5E7EB] transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* MINDMAP CONTENT */}
      <div className="pt-1">
        <SpaceProgressMindmap
          space={space}
          tasks={tasks}
          sprints={sprints}
          members={members}
          currentUser={currentUser}
          onSelectTask={onSelectTask}
        />
      </div>
    </div>
  );
}
