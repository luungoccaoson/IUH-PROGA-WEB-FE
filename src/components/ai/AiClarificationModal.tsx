"use client";

import React, { useState } from "react";
import { Users, ShieldCheck, Server, AlertTriangle, CheckCircle2, MessageSquareCode, X, ArrowRight } from "lucide-react";

export interface ClarificationAnswers {
  teamScope: string;
  securityScope: string;
  infraScope: string;
  contingencyScope: string;
  customNotes: string;
}

interface AiClarificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitAnswers: (answers: ClarificationAnswers) => void;
  loading: boolean;
}

export function AiClarificationModal({
  isOpen,
  onClose,
  onSubmitAnswers,
  loading,
}: AiClarificationModalProps) {
  const [teamScope, setTeamScope] = useState("MEDIUM_TEAM");
  const [securityScope, setSecurityScope] = useState("ENTERPRISE_SECURITY");
  const [infraScope, setInfraScope] = useState("DOCKER_MICROSERVICES");
  const [contingencyScope, setContingencyScope] = useState("STANDARD_SCRUM");
  const [customNotes, setCustomNotes] = useState("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    onSubmitAnswers({
      teamScope,
      securityScope,
      infraScope,
      contingencyScope,
      customNotes: customNotes.trim(),
    });
  };

  return (
    <div className="fixed inset-0 bg-[#111827]/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-[#E5E7EB] rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto font-sans">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F0F7FF] text-[#1A73E8] flex items-center justify-center border border-[#D2E3FC]">
              <MessageSquareCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#111827]">
                Họp Ban Quản Lý (Board Meeting & Scope Alignment)
              </h3>
              <p className="text-xs text-[#6B7280]">
                AI Co-Pilot đóng vai trò Product Owner làm rõ phạm vi trước khi chốt WBS Task
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Options */}
        <div className="space-y-4 text-xs">
          {/* 1. Team Headcount & Roles */}
          <div className="space-y-2">
            <label className="font-extrabold text-[#111827] flex items-center gap-1.5 font-mono uppercase text-[11px]">
              <Users className="w-4 h-4 text-[#1A73E8]" /> 1. Quy Mô Đội Ngũ Nhân Sự & Phân Role:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {[
                { id: "SMALL_TEAM", label: "Team Tinh Gọn (3-4 người)", desc: "1 Tech Lead, 1 Backend, 1 Frontend, 1 QA" },
                { id: "MEDIUM_TEAM", label: "Team Tiêu Chuẩn (5-8 người)", desc: "1 Architect, 3 BE, 2 FE, 1 DevOps, 1 QA" },
                { id: "ENTERPRISE_TEAM", label: "Quy Mô Enterprise (10+ người)", desc: "PM, Tech Leads, Security Spec, Multi-Devs" },
              ].map((item) => (
                <div
                  key={item.id}
                  onClick={() => setTeamScope(item.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all space-y-1 ${
                    teamScope === item.id
                      ? "border-[#1A73E8] bg-[#F0F7FF] ring-2 ring-[#1A73E8]/20"
                      : "border-[#E5E7EB] bg-white hover:border-[#111827]/30"
                  }`}
                >
                  <div className="font-bold text-[#111827] flex items-center justify-between">
                    <span>{item.label}</span>
                    {teamScope === item.id && <CheckCircle2 className="w-3.5 h-3.5 text-[#1A73E8]" />}
                  </div>
                  <p className="text-[11px] text-[#6B7280] leading-snug">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Security & Compliance */}
          <div className="space-y-2">
            <label className="font-extrabold text-[#111827] flex items-center gap-1.5 font-mono uppercase text-[11px]">
              <ShieldCheck className="w-4 h-4 text-[#137333]" /> 2. Yêu Cầu Bảo Mật & Tiêu Chuẩn Nghiệp Vụ:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                { id: "BASIC_SECURITY", label: "Cơ bản (JWT Authentication & Basic Access)", desc: "Xác thực Token JWT cơ bản và phân quyền theo Role" },
                { id: "ENTERPRISE_SECURITY", label: "Nâng cao (ISO 27001 / PCI-DSS Compliance)", desc: "Mã hóa AES-256, Audit Logs, Rate Limiting & Idempotency" },
              ].map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSecurityScope(item.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all space-y-1 ${
                    securityScope === item.id
                      ? "border-[#137333] bg-[#E6F4EA] ring-2 ring-[#137333]/20"
                      : "border-[#E5E7EB] bg-white hover:border-[#111827]/30"
                  }`}
                >
                  <div className="font-bold text-[#111827] flex items-center justify-between">
                    <span>{item.label}</span>
                    {securityScope === item.id && <CheckCircle2 className="w-3.5 h-3.5 text-[#137333]" />}
                  </div>
                  <p className="text-[11px] text-[#6B7280] leading-snug">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Infrastructure & Deployment */}
          <div className="space-y-2">
            <label className="font-extrabold text-[#111827] flex items-center gap-1.5 font-mono uppercase text-[11px]">
              <Server className="w-4 h-4 text-[#B06000]" /> 3. Hạ Tầng Triển Khai & Kiến Trúc System:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                { id: "DOCKER_MICROSERVICES", label: "Docker Compose Microservices (Local / Single VM)", desc: "Đóng gói Container đồng nhất cho 5+ microservices" },
                { id: "KUBERNETES_CLOUD", label: "Cloud Native Kubernetes (Multi-region HA)", desc: "Tự động scale pod, Load balancing Nginx & Multi-DB Cluster" },
              ].map((item) => (
                <div
                  key={item.id}
                  onClick={() => setInfraScope(item.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all space-y-1 ${
                    infraScope === item.id
                      ? "border-[#B06000] bg-[#FEF7E0] ring-2 ring-[#B06000]/20"
                      : "border-[#E5E7EB] bg-white hover:border-[#111827]/30"
                  }`}
                >
                  <div className="font-bold text-[#111827] flex items-center justify-between">
                    <span>{item.label}</span>
                    {infraScope === item.id && <CheckCircle2 className="w-3.5 h-3.5 text-[#B06000]" />}
                  </div>
                  <p className="text-[11px] text-[#6B7280] leading-snug">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Custom Clarification Notes */}
          <div className="space-y-1.5">
            <label className="font-extrabold text-[#111827] flex items-center gap-1.5 font-mono uppercase text-[11px]">
              <AlertTriangle className="w-4 h-4 text-[#D93025]" /> 4. Ghi Chú Đặc Thù Hoặc Yêu Cầu Bổ Sung:
            </label>
            <textarea
              rows={2}
              placeholder="Nhập thêm yêu cầu riêng (ví dụ: Cần tích hợp VNPAY Sandbox, Cần hỗ trợ 5.000 concurrent users...)"
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              className="w-full px-3.5 py-2 border border-[#E5E7EB] rounded-xl text-xs text-[#111827] focus:border-[#111827] outline-none"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E7EB]">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2.5 bg-[#111827] hover:bg-black text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            <span>Thống Nhất Scope & Phân Rã WBS Task</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
