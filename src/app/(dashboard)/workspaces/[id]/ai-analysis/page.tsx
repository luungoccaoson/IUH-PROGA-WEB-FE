"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Sparkles, ChevronRight } from "lucide-react";
import { workspaceService } from "@/services/workspace.service";
import { useAuthStore } from "@/stores/useAuthStore";
import { Workspace, Space } from "@/types";
import { AiDecompositionContainer } from "@/components/ai/AiDecompositionContainer";

export default function AiAnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();

  const workspaceId = parseInt(params.id as string, 10);

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) return;

    const loadData = async () => {
      try {
        setPageLoading(true);
        const wsData = await workspaceService.getWorkspaceById(workspaceId);
        setWorkspace(wsData);

        const spaceList = await workspaceService.getSpacesByWorkspace(workspaceId, user?.id);
        setSpaces(spaceList);
      } catch (err) {
        console.error("Error loading workspace data for AI analysis:", err);
      } finally {
        setPageLoading(false);
      }
    };

    loadData();
  }, [workspaceId]);

  if (pageLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[#6B7280]">
        <Sparkles className="w-8 h-8 text-[#111827] animate-spin mb-3" />
        <p className="font-mono text-xs uppercase tracking-wider">Đang tải trung tâm Phân tích AI...</p>
      </div>
    );
  }

  const isOwner = Boolean(user?.id && workspace?.ownerId === user.id);

  if (workspace && !isOwner) {
    return (
      <div className="bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] p-6 rounded-2xl max-w-xl mx-auto text-center space-y-4 font-sans my-10">
        <p className="font-extrabold text-sm">
          🔒 Giới hạn quyền truy cập (RBAC)
        </p>
        <p className="text-xs text-[#7F1D1D]">
          Chỉ Chủ sở hữu Workspace hoặc Project Manager (PM) mới có quyền kích hoạt <strong>AI Khởi Tạo Space &amp; Phân Rã Dự Án Tổng (Macro AI Decomposition)</strong>.
        </p>
        <button
          onClick={() => router.push(`/workspaces/${workspaceId}`)}
          className="px-4 py-2 bg-[#111827] text-white rounded-xl text-xs font-bold cursor-pointer"
        >
          Quay lại Workspace Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 font-sans animate-in fade-in duration-300">
      {/* Path Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-xs text-[#6B7280] font-mono">
        <span className="hover:underline cursor-pointer" onClick={() => router.push("/workspaces")}>
          workspaces
        </span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span
          className="hover:underline cursor-pointer"
          onClick={() => router.push(`/workspaces/${workspaceId}`)}
        >
          {workspace?.name || "Workspace"}
        </span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-[#111827] font-bold">Phân tích AI</span>
      </div>

      {/* Page Title Banner */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#E6F4EA] flex items-center justify-center text-[#137333] border border-[#D1E7DD] shadow-2xs">
              <Sparkles className="w-5 h-5 text-[#137333]" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#111827]">
              Phân Tích & Phân Rã Bài Toán (Requirement Agent)
            </h1>
          </div>
          <p className="text-xs text-[#6B7280]">
            Sử dụng mô hình ngôn ngữ RAG Vector Database chia nhỏ bài toán kinh doanh thành các Task theo Sprint
          </p>
        </div>
      </div>

      {/* Modular AI Decomposition Container Component */}
      <AiDecompositionContainer workspaceId={workspaceId} spaces={spaces} />
    </div>
  );
}
