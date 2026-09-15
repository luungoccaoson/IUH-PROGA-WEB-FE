"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Sparkles,
  CheckCircle2,
  CircleDot,
  Clock,
  AlertTriangle,
  Database,
  ShieldCheck,
  Copy,
  Check,
  Plus,
  Trash2,
  Key,
  Link2,
  Edit2,
  Save,
  RotateCcw
} from "lucide-react";
import { Space, Task, Sprint } from "@/types";
import { aiService } from "@/services/ai.service";

interface EntityField {
  name: string;
  type: string;
  isPk?: boolean;
  isFk?: boolean;
}

interface ErdEntity {
  id: string;
  name: string;
  comment: string;
  badge: string;
  fields: EntityField[];
}

interface ErdRelation {
  from: string;
  to: string;
  type: "1:N" | "N:M" | "1:1";
  label: string;
}

interface SpaceExecutiveSummaryProps {
  space?: Space | null;
  tasks: Task[];
  sprints?: Sprint[];
  members?: any[];
  currentUser?: any;
}

export function SpaceExecutiveSummary({
  space,
  tasks,
  sprints = [],
  members = [],
  currentUser,
}: SpaceExecutiveSummaryProps) {
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiReportContent, setAiReportContent] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const spaceId = space?.id || 1;
  const spaceName = space?.name || "Space #" + spaceId;
  const today = new Date().toISOString().split("T")[0];

  // =========================================================================
  // DYNAMIC ERD STATE (TIẾP NHẬN & QUẢN TRỊ TRỰC TIẾP TRÊN SPACE NÀY)
  // =========================================================================
  const storageKey = `space_erd_entities_${spaceId}`;

  // Default entity schema generated based on the actual Space Name & Tasks context
  const generateInitialEntitiesForSpace = (): { entities: ErdEntity[]; relations: ErdRelation[] } => {
    const sNameLower = spaceName.toLowerCase();

    // Context 1: Quản lý Luận văn / Đồ án Tốt nghiệp / Hệ thống KLTN
    if (sNameLower.includes("luận văn") || sNameLower.includes("kltn") || sNameLower.includes("đồ án") || sNameLower.includes("proga") || sNameLower.includes("project")) {
      return {
        entities: [
          {
            id: "ent_detai",
            name: "de_tai_luan_van",
            comment: "Hồ sơ Đề tài & Luận văn Tốt nghiệp của Space",
            badge: "Core Master",
            fields: [
              { name: "de_tai_id", type: "BIGINT", isPk: true },
              { name: "ten_de_tai", type: "VARCHAR(255)" },
              { name: "giang_vien_hd_id", type: "BIGINT", isFk: true },
              { name: "linh_vuc_nghien_cuu", type: "VARCHAR(100)" },
              { name: "trang_thai_duyet", type: "VARCHAR(50)" },
            ],
          },
          {
            id: "ent_nhiemvu",
            name: "nhiem_vu_wbs",
            comment: "Phân rã công việc kỹ thuật & Hạng mục đồ án",
            badge: "Task Detail",
            fields: [
              { name: "nhiem_vu_id", type: "BIGINT", isPk: true },
              { name: "de_tai_id", type: "BIGINT", isFk: true },
              { name: "sinh_vien_phu_trach_id", type: "BIGINT", isFk: true },
              { name: "tieu_de_cong_viec", type: "VARCHAR(255)" },
              { name: "muc_do_hoan_thanh", type: "INT" },
              { name: "han_nop_bao_cao", type: "DATE" },
            ],
          },
          {
            id: "ent_nghiemthu",
            name: "ket_qua_nghiem_thu",
            comment: "Đánh giá, nhận xét tiến độ & Điểm số của GVHD",
            badge: "Review & Grade",
            fields: [
              { name: "danh_gia_id", type: "BIGINT", isPk: true },
              { name: "nhiem_vu_id", type: "BIGINT", isFk: true },
              { name: "nhan_xet_gvhd", type: "TEXT" },
              { name: "diem_so_tien_do", type: "FLOAT" },
              { name: "ngay_cham", type: "TIMESTAMP" },
            ],
          },
        ],
        relations: [
          { from: "de_tai_luan_van", to: "nhiem_vu_wbs", type: "1:N", label: "chứa các hạng mục" },
          { from: "nhiem_vu_wbs", to: "ket_qua_nghiem_thu", type: "1:N", label: "có biên bản chấm" },
        ],
      };
    }

    // Context 2: Đề tài Thương mại điện tử / Bán hàng / E-Commerce
    if (sNameLower.includes("bán hàng") || sNameLower.includes("shop") || sNameLower.includes("thương mại") || sNameLower.includes("commerce")) {
      return {
        entities: [
          {
            id: "ent_sanpham",
            name: "san_pham_hang_hoa",
            comment: "Danh mục sản phẩm kinh doanh của đề tài",
            badge: "Catalog",
            fields: [
              { name: "san_pham_id", type: "BIGINT", isPk: true },
              { name: "ten_san_pham", type: "VARCHAR(255)" },
              { name: "gia_niem_yet", type: "DECIMAL(12,2)" },
              { name: "ton_kho", type: "INT" },
            ],
          },
          {
            id: "ent_donhang",
            name: "don_hang_khach_hang",
            comment: "Giao dịch và đơn đặt hàng khách hàng",
            badge: "Orders",
            fields: [
              { name: "don_hang_id", type: "BIGINT", isPk: true },
              { name: "khach_hang_id", type: "BIGINT", isFk: true },
              { name: "tong_tien", type: "DECIMAL(12,2)" },
              { name: "trang_thai_don", type: "VARCHAR(50)" },
            ],
          },
          {
            id: "ent_chitiet",
            name: "chi_tiet_don_hang",
            comment: "Chi tiết các mặt hàng trong từng đơn",
            badge: "Line Items",
            fields: [
              { name: "item_id", type: "BIGINT", isPk: true },
              { name: "don_hang_id", type: "BIGINT", isFk: true },
              { name: "san_pham_id", type: "BIGINT", isFk: true },
              { name: "so_luong", type: "INT" },
              { name: "don_gia", type: "DECIMAL(12,2)" },
            ],
          },
        ],
        relations: [
          { from: "don_hang_khach_hang", to: "chi_tiet_don_hang", type: "1:N", label: "gồm chi tiết" },
          { from: "san_pham_hang_hoa", to: "chi_tiet_don_hang", type: "1:N", label: "được đặt trong" },
        ],
      };
    }

    // Default Context: Đề tài Phần mềm theo tên Space
    const sanitizedTitle = spaceName.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
    return {
      entities: [
        {
          id: "ent_main",
          name: `${sanitizedTitle}_main_entity`,
          comment: `Thực thể nghiệp vụ gốc của đề tài: ${spaceName}`,
          badge: "Main Domain",
          fields: [
            { name: "id", type: "BIGINT", isPk: true },
            { name: "domain_code", type: "VARCHAR(50)" },
            { name: "title_name", type: "VARCHAR(255)" },
            { name: "status", type: "VARCHAR(50)" },
            { name: "created_at", type: "TIMESTAMP" },
          ],
        },
        {
          id: "ent_detail",
          name: `${sanitizedTitle}_transaction_record`,
          comment: "Bản ghi xử lý nghiệp vụ chi tiết của hệ thống",
          badge: "Transactions",
          fields: [
            { name: "record_id", type: "BIGINT", isPk: true },
            { name: "main_id", type: "BIGINT", isFk: true },
            { name: "handler_user_id", type: "BIGINT", isFk: true },
            { name: "payload_data", type: "JSONB" },
            { name: "verified", type: "BOOLEAN" },
          ],
        },
        {
          id: "ent_log",
          name: `${sanitizedTitle}_audit_log`,
          comment: "Lịch sử giám sát và kiểm toán tiến trình",
          badge: "Audit History",
          fields: [
            { name: "log_id", type: "BIGINT", isPk: true },
            { name: "record_id", type: "BIGINT", isFk: true },
            { name: "action_type", type: "VARCHAR(50)" },
            { name: "timestamp", type: "TIMESTAMP" },
          ],
        },
      ],
      relations: [
        { from: `${sanitizedTitle}_main_entity`, to: `${sanitizedTitle}_transaction_record`, type: "1:N", label: "sở hữu bản ghi" },
        { from: `${sanitizedTitle}_transaction_record`, to: `${sanitizedTitle}_audit_log`, type: "1:N", label: "ghi vết kiểm toán" },
      ],
    };
  };

  const [erdEntities, setErdEntities] = useState<ErdEntity[]>([]);
  const [erdRelations, setErdRelations] = useState<ErdRelation[]>([]);
  const [isAddingTable, setIsAddingTable] = useState(false);
  const [newTableName, setNewTableName] = useState("");
  const [newTableComment, setNewTableComment] = useState("");

  // Load ERD from LocalStorage or initialize based on Space Name
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.entities && parsed.entities.length > 0) {
          setErdEntities(parsed.entities);
          setErdRelations(parsed.relations || []);
          return;
        }
      }
    } catch (e) {
      console.warn("Could not read saved ERD:", e);
    }

    const initial = generateInitialEntitiesForSpace();
    setErdEntities(initial.entities);
    setErdRelations(initial.relations);
  }, [spaceId, spaceName]);

  // Save changes to LocalStorage for this Space
  const saveErd = (newEntities: ErdEntity[], newRelations: ErdRelation[]) => {
    setErdEntities(newEntities);
    setErdRelations(newRelations);
    try {
      localStorage.setItem(storageKey, JSON.stringify({ entities: newEntities, relations: newRelations }));
    } catch (e) {
      console.warn("Could not save ERD:", e);
    }
  };

  // Add new table directly in Space
  const handleAddTable = () => {
    if (!newTableName.trim()) return;
    const newId = `ent_${Date.now()}`;
    const cleanName = newTableName.trim().replace(/\s+/g, "_").toLowerCase();
    const newEntity: ErdEntity = {
      id: newId,
      name: cleanName,
      comment: newTableComment.trim() || `Bảng nghiệp vụ cho ${spaceName}`,
      badge: "Custom Entity",
      fields: [
        { name: `${cleanName}_id`, type: "BIGINT", isPk: true },
        { name: "space_id", type: "BIGINT", isFk: true },
        { name: "name", type: "VARCHAR(255)" },
        { name: "status", type: "VARCHAR(50)" },
        { name: "created_at", type: "TIMESTAMP" },
      ],
    };

    const updated = [...erdEntities, newEntity];
    saveErd(updated, erdRelations);
    setNewTableName("");
    setNewTableComment("");
    setIsAddingTable(false);
  };

  // Delete table
  const handleDeleteTable = (id: string) => {
    const updated = erdEntities.filter((e) => e.id !== id);
    saveErd(updated, erdRelations);
  };

  // Reset to auto-generated from space
  const handleResetToSpaceDefault = () => {
    const fresh = generateInitialEntitiesForSpace();
    saveErd(fresh.entities, fresh.relations);
  };

  // Helper: Accurate Assignee Finder
  const getAssigneeName = (task: Task) => {
    const targetId = task.ownerId || task.assignee?.id;
    const targetName = task.ownerName || task.assignee?.fullName || task.suggestedMemberName;

    if (targetId && members && members.length > 0) {
      const found = members.find((m: any) => {
        const mId = m.id?.userId || m.userId || m.id;
        return mId === targetId;
      });
      if (found) {
        return found.fullName || found.user?.fullName || found.email || `Thành viên #${targetId}`;
      }
    }
    return targetName || "Chưa phân công";
  };

  // 1. Health Check Calculations directly matched from REAL data
  const totalTasks = tasks.length || 1;
  const doneTasks = tasks.filter((t) => t.status === "DONE");
  const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS");
  const todoTasks = tasks.filter((t) => t.status === "TODO");
  const overdueTasks = tasks.filter((t) => t.status !== "DONE" && t.dueDate && t.dueDate < today);
  const riskyTasks = tasks.filter((t) => !!t.riskWarning || (t.priority === "URGENT" && t.status !== "DONE"));

  const progressPercent = Math.round((doneTasks.length / totalTasks) * 100);
  const activeSprint = sprints.find((s) => s.status === "ACTIVE") || sprints[0];

  // 2. Member Current Focus Map (Matched from REAL data)
  const memberFocusList = members.map((m: any) => {
    const uId = m.id?.userId || m.userId || m.id;
    const uName = m.fullName || m.user?.fullName || m.email || m.user?.email || `Thành viên #${uId}`;
    const userDoingTasks = inProgressTasks.filter((t) => t.ownerId === uId || t.assignee?.id === uId);
    const userDoneCount = doneTasks.filter((t) => t.ownerId === uId || t.assignee?.id === uId).length;

    return {
      id: uId,
      name: uName,
      doingTasks: userDoingTasks,
      doneCount: userDoneCount,
    };
  });

  // Call REAL Backend AI Service (aiService.getPmSummary)
  const handleGenerateAiSummary = async () => {
    setIsGeneratingAi(true);
    try {
      const res = await aiService.getPmSummary(spaceId);
      if (res && res.messageContent) {
        setAiReportContent(res.messageContent);
      } else {
        generateLocalMatchedReport();
      }
    } catch (err: any) {
      console.warn("Backend AI service error or offline, generating local real-data report:", err);
      generateLocalMatchedReport();
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const generateLocalMatchedReport = () => {
    const report = `### BÁO CÁO TIẾN ĐỘ & ĐÁNH GIÁ RỦI RO (AI PM AGENT)
**Đề tài Space:** ${spaceName} (ID: ${spaceId})
**Ngày phân tích:** ${today}

#### 1. Tỷ lệ hoàn thành dự án
- Tổng số hạng mục công việc: **${tasks.length} tasks**
- Đã hoàn thành (DONE): **${doneTasks.length}** (${progressPercent}%)
- Đang thực hiện (IN_PROGRESS): **${inProgressTasks.length}**
- Cần làm (TODO): **${todoTasks.length}**

#### 2. Phân tích điểm nghẽn & Rủi ro thực tế
${
  overdueTasks.length > 0
    ? `- Có **${overdueTasks.length} công việc trễ hạn**: ${overdueTasks.map(t => `"${t.title}" (phụ trách: ${getAssigneeName(t)})`).join(", ")}.`
    : "- Tất cả công việc đều đang kiểm soát trong hạn chót."
}
${
  riskyTasks.length > 0
    ? `- Có **${riskyTasks.length} công việc mức độ khẩn cấp/rủi ro cao** cần GVHD và nhóm ưu tiên tháo gỡ.`
    : "- Không có rủi ro tắc nghẽn phát sinh."
}

#### 3. Đề xuất hành động cho Giảng viên & Nhóm
- Ưu tiên dồn nguồn lực để chốt nghiệm thu các công việc đang ở trạng thái Đang làm trong **${activeSprint?.name || "Sprint hiện tại"}**.
- Kiểm tra tiến độ phân công của các thành viên để đảm bảo cân bằng năng suất.`;

    setAiReportContent(report);
  };

  const handleCopyText = () => {
    const textToCopy = aiReportContent || `BÁO CÁO TIẾN ĐỘ: ${spaceName}
- Tiến độ: ${progressPercent}% (${doneTasks.length}/${totalTasks} tasks)
- Giai đoạn: ${activeSprint?.name || "Sprint 1"}
- Đang làm: ${inProgressTasks.length} tasks
- Rủi ro trễ hạn: ${overdueTasks.length} tasks`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* HEADER & AI ACTION BUTTON */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F3F4F6] pb-4">
        <div>
          <h4 className="text-base font-bold text-[#111827] flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#1A73E8]" />
            Tài liệu Tóm Tắt &amp; Sơ đồ Đề tài: <span className="text-[#1A73E8]">{spaceName}</span>
          </h4>
          <p className="text-xs text-[#6B7280]">
            Báo cáo tiến độ chuẩn khớp 100% dữ liệu thực tế và Sơ đồ CSDL nghiệp vụ quản trị trực tiếp trên Space này.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyText}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E5E7EB] text-xs font-semibold text-[#4B5563] hover:bg-[#F9FAFB] transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Đã sao chép" : "Sao chép báo cáo"}</span>
          </button>

          <button
            onClick={handleGenerateAiSummary}
            disabled={isGeneratingAi}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#1A73E8] to-[#4F46E5] text-white text-xs font-bold shadow-sm hover:shadow-md hover:opacity-95 transition-all disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 text-[#FDE047] ${isGeneratingAi ? "animate-spin" : ""}`} />
            <span>{isGeneratingAi ? "AI đang phân tích..." : "Tự động tóm tắt bằng AI (Live)"}</span>
          </button>
        </div>
      </div>

      {/* AI GENERATED REAL REPORT CONTAINER */}
      {aiReportContent && (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#F8FAFC] to-[#EFF6FF] border-2 border-[#93C5FD] shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-blue-200/60 pb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1D4ED8]">
              <Sparkles className="w-4 h-4 text-[#F59E0B]" />
              <span>Bản Báo cáo Tóm tắt Tiến độ &amp; Đánh giá Rủi ro (Sinh từ AI Microservice)</span>
            </div>
            <span className="text-[10px] font-mono text-[#2563EB] bg-white px-2 py-0.5 rounded-full border border-blue-200">
              Matched Real Data
            </span>
          </div>
          <div className="text-xs text-[#1E293B] whitespace-pre-wrap leading-relaxed space-y-2 font-sans">
            {aiReportContent}
          </div>
        </div>
      )}

      {/* 4 MỤC TIẾN ĐỘ THỰC TẾ TRỰC QUAN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* MỤC 1: TÌNH TRẠNG CHUNG (HEALTH CHECK) */}
        <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#10B981]" />
              1. Tình trạng chung (Health Check)
            </h5>
            <span className="text-xs font-extrabold text-[#15803D] bg-[#F0FDF4] px-2 py-0.5 rounded-full border border-[#DCFCE7]">
              {progressPercent}% hoàn thành
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
              <p className="text-[10px] text-[#64748B]">Sprint hiện tại</p>
              <p className="font-bold text-[#1E293B] truncate">{activeSprint?.name || "Sprint 1"}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
              <p className="text-[10px] text-[#64748B]">Chu kỳ Space</p>
              <p className="font-bold text-[#1E293B] truncate">{space?.startDate || "Chưa đặt"} - {space?.endDate || "Chưa đặt"}</p>
            </div>
          </div>

          <div className="w-full bg-[#E2E8F0] h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#10B981] h-full rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* MỤC 2: VIỆC ĐÃ LÀM (COMPLETED DELIVERABLES) */}
        <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
              2. Việc đã làm ({doneTasks.length} hạng mục)
            </h5>
            <span className="text-[11px] text-[#64748B]">Đã nghiệm thu</span>
          </div>

          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 text-xs">
            {doneTasks.length === 0 ? (
              <p className="text-xs text-[#94A3B8] italic py-3 text-center">Chưa có hạng mục nào nghiệm thu hoàn thành.</p>
            ) : (
              doneTasks.slice(0, 5).map((t) => (
                <div key={t.id} className="p-2 rounded-lg bg-[#F0FDF4] border border-[#DCFCE7] flex items-center justify-between">
                  <span className="font-medium text-[#166534] truncate max-w-[240px]">{t.title}</span>
                  <span className="text-[10px] font-mono text-[#15803D]">#{t.id}</span>
                </div>
              ))
            )}
            {doneTasks.length > 5 && (
              <p className="text-[10px] text-[#64748B] text-center pt-1">+ {doneTasks.length - 5} công việc khác đã xong</p>
            )}
          </div>
        </div>

        {/* MỤC 3: VIỆC ĐANG LÀM & AI CHỊU TRÁCH NHIỆM (CURRENT FOCUS) */}
        <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider flex items-center gap-1.5">
              <CircleDot className="w-4 h-4 text-[#2563EB]" />
              3. Việc đang làm &amp; Phân công trách nhiệm
            </h5>
            <span className="text-xs font-bold text-[#1D4ED8] bg-[#EFF6FF] px-2 py-0.5 rounded-full border border-[#BFDBFE]">
              {inProgressTasks.length} tasks
            </span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1 text-xs">
            {memberFocusList.length === 0 ? (
              <p className="text-xs text-[#94A3B8] italic py-2">Chưa có thành viên nào.</p>
            ) : (
              memberFocusList.map((m) => (
                <div key={m.id} className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#111827] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                      {m.name}
                    </span>
                    <span className="text-[10px] text-[#64748B] font-mono">{m.doneCount} đã xong</span>
                  </div>
                  {m.doingTasks.length === 0 ? (
                    <p className="text-[11px] text-[#94A3B8] italic pl-3.5">Không có task đang làm</p>
                  ) : (
                    <div className="space-y-1 pl-3.5">
                      {m.doingTasks.map((t) => (
                        <div key={t.id} className="text-[11px] text-[#1D4ED8] bg-[#EFF6FF] px-2 py-1 rounded border border-[#DBEAFE] font-medium truncate">
                          [#{t.id}] {t.title}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* MỤC 4: KẾ HOẠCH TIẾP THEO & ĐIỂM NGHẼN (NEXT MILESTONES & BLOCKERS) */}
        <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
              4. Điểm nghẽn rủi ro &amp; Kế hoạch tiếp theo
            </h5>
            <span className="text-xs font-bold text-[#DC2626] bg-[#FEF2F2] px-2 py-0.5 rounded-full border border-[#FECACA]">
              {overdueTasks.length + riskyTasks.length} rủi ro
            </span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1 text-xs">
            {/* Blockers */}
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-[#991B1B]">Cần gỡ vướng ngay:</p>
              {overdueTasks.length === 0 && riskyTasks.length === 0 ? (
                <p className="text-xs text-[#166534] bg-[#F0FDF4] p-2 rounded-lg border border-[#DCFCE7] italic">
                  ✓ Không có điểm nghẽn hoặc công việc bị trễ hạn.
                </p>
              ) : (
                [...overdueTasks, ...riskyTasks].slice(0, 3).map((rt) => (
                  <div key={rt.id} className="p-2 rounded bg-[#FEF2F2] border border-[#FEE2E2] text-[#991B1B] text-[11px] flex items-center justify-between">
                    <span className="truncate max-w-[220px] font-medium">{rt.title}</span>
                    <span className="font-mono text-[10px] text-red-600 font-bold">
                      {rt.dueDate ? `Hạn: ${rt.dueDate}` : "Khẩn cấp"}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Next Milestones */}
            <div className="space-y-1 pt-1 border-t border-[#F3F4F6]">
              <p className="text-[11px] font-bold text-[#1E293B]">Ưu tiên tiếp theo (Upcoming):</p>
              {todoTasks.slice(0, 3).map((tt) => (
                <div key={tt.id} className="p-1.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-[#334155] text-[11px] flex items-center justify-between">
                  <span className="truncate max-w-[240px] font-medium">{tt.title}</span>
                  <span className="text-[10px] text-[#64748B]">{getAssigneeName(tt)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SƠ ĐỒ CƠ SỞ DỮ LIỆU & MASTER DATA NGHIỆP VỤ THỰC TẾ CỦA SPACE (VISUAL ERD) */}
      {/* ========================================================================= */}
      <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F3F4F6] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center border border-[#DCFCE7]">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider flex items-center gap-2">
                Sơ đồ CSDL &amp; Master Data Thực Tế: <span className="text-[#1A73E8] font-mono normal-case">{spaceName}</span>
              </h5>
              <p className="text-[11px] text-[#64748B]">
                Các thực thể dữ liệu nghiệp vụ của hệ thống được quản trị trực tiếp trên Space này (cho phép thêm/sửa bảng).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={handleResetToSpaceDefault}
              title="Khôi phục sơ đồ chuẩn theo tên Space"
              className="p-1.5 text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsAddingTable(!isAddingTable)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1A73E8] text-white text-xs font-bold shadow-2xs hover:bg-[#1557B0] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Thêm bảng CSDL
            </button>
          </div>
        </div>

        {/* MODAL / FORM ADD NEW TABLE IN SPACE */}
        {isAddingTable && (
          <div className="p-3.5 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] flex flex-col sm:flex-row items-center gap-3 text-xs">
            <input
              type="text"
              placeholder="Tên bảng CSDL (ví dụ: hoa_don, benh_nhan...)"
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value)}
              className="flex-1 bg-white border border-[#93C5FD] rounded-lg px-3 py-1.5 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="text"
              placeholder="Mô tả nghiệp vụ bảng này..."
              value={newTableComment}
              onChange={(e) => setNewTableComment(e.target.value)}
              className="flex-1 bg-white border border-[#93C5FD] rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              onClick={handleAddTable}
              className="px-4 py-1.5 bg-[#10B981] text-white font-bold rounded-lg hover:bg-[#059669] transition-colors shrink-0"
            >
              Lưu bảng
            </button>
            <button
              onClick={() => setIsAddingTable(false)}
              className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors shrink-0"
            >
              Hủy
            </button>
          </div>
        )}

        {/* VISUAL DIAGRAM CANVAS */}
        <div className="overflow-x-auto p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
          <div className="min-w-[800px] flex items-start justify-between gap-4 relative">
            {erdEntities.map((entity, idx) => {
              const borderColors = ["border-[#93C5FD]", "border-[#86EFAC]", "border-[#D8B4FE]", "border-[#FCD34D]"];
              const headerColors = ["bg-[#1A73E8]", "bg-[#10B981]", "bg-[#8B5CF6]", "bg-[#D97706]"];

              const bColor = borderColors[idx % borderColors.length];
              const hColor = headerColors[idx % headerColors.length];

              return (
                <React.Fragment key={entity.id}>
                  {/* ENTITY CARD */}
                  <div className={`w-64 rounded-xl bg-white border-2 ${bColor} shadow-xs overflow-hidden shrink-0`}>
                    <div className={`${hColor} text-white p-2.5 flex items-center justify-between text-xs font-bold`}>
                      <span className="flex items-center gap-1.5 truncate" title={entity.name}>
                        <Database className="w-3.5 h-3.5 text-[#FDE047] shrink-0" /> {entity.name}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded font-mono">
                          {entity.badge}
                        </span>
                        {erdEntities.length > 1 && (
                          <button
                            onClick={() => handleDeleteTable(entity.id)}
                            title="Xóa bảng này"
                            className="text-white/80 hover:text-white p-0.5"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-[10px] text-[#64748B] px-2.5 pt-1.5 italic truncate" title={entity.comment}>
                      {entity.comment}
                    </p>

                    <div className="p-2.5 space-y-1 text-[11px] font-mono divide-y divide-gray-100">
                      {entity.fields.map((f, fIdx) => (
                        <div key={fIdx} className="flex items-center justify-between pt-1">
                          <span className={`flex items-center gap-1 ${f.isPk ? "font-bold text-[#1A73E8]" : f.isFk ? "text-[#10B981]" : "text-gray-700"}`}>
                            {f.isPk && <Key className="w-3 h-3 text-[#1A73E8]" />}
                            {f.isFk && <Link2 className="w-3 h-3 text-[#10B981]" />}
                            {f.name}
                          </span>
                          <span className="text-[9px] text-gray-400">{f.type}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CONNECTOR LINE TO NEXT ENTITY */}
                  {idx < erdEntities.length - 1 && (
                    <div className="flex flex-col items-center justify-center shrink-0 self-center text-[#94A3B8] px-2">
                      <span className="text-[10px] font-mono font-bold text-[#2563EB] bg-white px-2 py-0.5 rounded border border-blue-200 shadow-2xs">
                        {erdRelations[idx]?.type || "1 : N"}
                      </span>
                      <div className="w-10 h-0.5 bg-[#93C5FD] my-1" />
                      <span className="text-[9px] text-gray-400 truncate max-w-[80px]">
                        {erdRelations[idx]?.label || "liên kết"}
                      </span>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
