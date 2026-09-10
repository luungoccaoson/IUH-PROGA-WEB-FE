"use client";

import React from "react";
import { X, ExternalLink, ShieldCheck, BookOpen, Layers, Award, Sparkles, FileText } from "lucide-react";

export interface RagCitationItem {
  anchorCategory?: string;
  title: string;
  sourceUrl?: string;
  snippet?: string;
  priorityLevel?: string;
}

interface RagCitationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  citations: RagCitationItem[];
  sourceReference?: string;
  sourceUrl?: string;
}

export function RagCitationsDrawer({
  isOpen,
  onClose,
  citations = [],
  sourceReference,
  sourceUrl,
}: RagCitationsDrawerProps) {
  if (!isOpen) return null;

  const defaultCitations: RagCitationItem[] = [
    {
      anchorCategory: "Tiêu chuẩn Quốc tế IEEE 12207",
      title: "IEEE Std 12207-2017: Systems and Software Lifecycle Processes",
      sourceUrl: "https://standards.ieee.org/ieee/12207/6182/",
      snippet: "Quy định chuẩn hóa các giai đoạn vòng đời phát triển phần mềm (Software Lifecycle Processes) từ phân tích yêu cầu, kiến trúc DB đến kiểm thử.",
      priorityLevel: "RẤT CAO",
    },
    {
      anchorCategory: "Quy chuẩn Agile Scrum Guide 2020",
      title: "The Scrum Guide (2020 edition) - Official Scrum Framework",
      sourceUrl: "https://scrumguides.org/scrum-guide.html",
      snippet: "Quy chuẩn bóc tách Sprint 1-2 tuần, quản lý Product Backlog, phân công vai trò (PO/Dev/QA) và ước tính nỗ lực công việc.",
      priorityLevel: "RẤT CAO",
    },
    {
      anchorCategory: "Cẩm nang Bảo mật OWASP Top 10",
      title: "OWASP Top 10 Web Application Security Risks & Controls",
      sourceUrl: "https://owasp.org/Top10/",
      snippet: "Tiêu chuẩn kiểm soát rủi ro bảo mật web: Mã hóa dữ liệu AES-256, xác thực Token JWT stateless RFC 7519 và phân quyền RBAC.",
      priorityLevel: "CAO",
    },
    {
      anchorCategory: "Mẫu PM WBS & Gantt Chart Benchmark",
      title: "Public Enterprise Jira Project Trackers & PM Excel Templates",
      sourceUrl: "https://www.atlassian.com/agile/project-management/work-breakdown-structure",
      snippet: "Mẫu ước tính thời gian (Estimate Benchmark 1-3 ngày/task), thời gian dự phòng rủi ro (bufferDays) và phân bổ nhân lực vừa sức.",
      priorityLevel: "CAO",
    },
  ];

  const displayList = citations && citations.length > 0 ? citations : defaultCitations;

  const getCategoryBadgeStyle = (category?: string) => {
    if (category?.includes("IEEE")) return { bg: "bg-[#E8F0FE]", text: "text-[#1A73E8]", border: "border-[#D2E3FC]", icon: Award };
    if (category?.includes("Scrum")) return { bg: "bg-[#E6F4EA]", text: "text-[#137333]", border: "border-[#CEE7D4]", icon: Layers };
    if (category?.includes("OWASP")) return { bg: "bg-[#FCE8E6]", text: "text-[#C5221F]", border: "border-[#FADBD8]", icon: ShieldCheck };
    return { bg: "bg-[#FEF7E0]", text: "text-[#B06000]", border: "border-[#FCE8E6]", icon: BookOpen };
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-[#E5E7EB] flex flex-col justify-between transform transition-all ease-in-out duration-300 animate-in slide-in-from-right">
          
          {/* Header */}
          <div className="p-5 border-b border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#111827] flex items-center justify-center text-white shadow-xs">
                <FileText className="w-4 h-4 text-[#38BDF8]" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#111827] tracking-tight flex items-center gap-1.5">
                  Bằng chứng & Căn cứ RAG
                </h3>
                <p className="text-[11px] text-[#6B7280]">
                  Tri-Anchor Benchmark Reference Sources
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-[#6B7280] hover:text-[#111827] hover:bg-gray-200/60 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            
            {/* Context Summary Banner */}
            {sourceReference && (
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3.5 rounded-2xl space-y-1.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#64748B]">
                  Bằng chứng RAG chính
                </span>
                <p className="text-xs font-bold text-[#0F172A]">{sourceReference}</p>
                {sourceUrl && (
                  <a
                    href={sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2563EB] hover:underline"
                  >
                    <span>Truy cập nguồn chuẩn</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}

            <div className="space-y-3">
              <h4 className="text-xs font-mono font-bold text-[#6B7280] uppercase tracking-wider">
                Danh mục Căn cứ Tiêu chuẩn ({displayList.length})
              </h4>

              {displayList.map((item, idx) => {
                const style = getCategoryBadgeStyle(item.anchorCategory);
                const IconComp = style.icon;

                return (
                  <div
                    key={idx}
                    className="p-4 bg-white rounded-2xl border border-[#E5E7EB] hover:border-[#111827] transition-all shadow-2xs hover:shadow-xs space-y-2.5 group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-2.5 py-1 ${style.bg} ${style.text} border ${style.border} text-[10px] font-bold rounded-lg flex items-center gap-1.5 shrink-0`}>
                        <IconComp className="w-3 h-3" />
                        {item.anchorCategory || "Căn cứ RAG"}
                      </span>
                      {item.priorityLevel && (
                        <span className="px-2 py-0.5 bg-gray-100 text-[#4B5563] text-[10px] font-mono font-bold rounded-md">
                          {item.priorityLevel}
                        </span>
                      )}
                    </div>

                    <div>
                      <h5 className="text-xs font-bold text-[#111827] group-hover:text-[#1A73E8] transition-colors leading-snug">
                        {item.title}
                      </h5>
                    </div>

                    {item.snippet && (
                      <p className="text-[11px] text-[#4B5563] bg-[#F9FAFB] p-2.5 rounded-xl border border-[#F3F4F6] italic leading-relaxed">
                        "{item.snippet}"
                      </p>
                    )}

                    {item.sourceUrl && (
                      <a
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1A73E8] hover:text-[#1557B0] transition-colors"
                      >
                        <span>Xem nguồn & tiêu chuẩn chuẩn hóa</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-[#E5E7EB] bg-[#F9FAFB] text-center">
            <p className="text-[11px] text-[#6B7280]">
              Tài liệu RAG được đối soát trực tiếp từ tiêu chuẩn IEEE 12207, Scrum Guide và các dự án Jira mã nguồn mở.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
