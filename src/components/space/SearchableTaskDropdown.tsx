"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown, Check, X, Filter } from "lucide-react";
import { Task } from "@/types";
import { formatTaskCode } from "@/utils/taskNumber";

interface SearchableTaskDropdownProps {
  tasks: Task[];
  taskNumberMap: Map<number, number>;
  value: number | "all";
  onChange: (val: any) => void;
  allowAll?: boolean;
  allLabel?: string;
  placeholder?: string;
  className?: string;
  icon?: React.ElementType;
}

export function SearchableTaskDropdown({
  tasks,
  taskNumberMap,
  value,
  onChange,
  allowAll = false,
  allLabel = "Tất cả công việc",
  placeholder = "Chọn công việc...",
  className = "",
  icon: Icon,
}: SearchableTaskDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sắp xếp tăng dần từ Task-1, Task-2,...
  const sortedTasks = useMemo(() => {
    return [...tasks]
      .filter((t) => !t.isDeleted)
      .sort((a, b) => {
        const numA = taskNumberMap.get(a.id) ?? a.id;
        const numB = taskNumberMap.get(b.id) ?? b.id;
        return numA - numB;
      });
  }, [tasks, taskNumberMap]);

  // Lọc real-time theo từ khóa tìm kiếm (hỗ trợ tìm cả mã "task-1", "task 1", số "1" hoặc tiêu đề)
  const filteredTasks = useMemo(() => {
    if (!searchTerm.trim()) return sortedTasks;
    const lower = searchTerm.toLowerCase().trim();
    const cleanQuery = lower.replace(/\s+/g, "");

    return sortedTasks.filter((t) => {
      const taskNum = taskNumberMap.get(t.id) ?? t.id;
      const code = `task-${taskNum}`.toLowerCase();
      const codeCompact = `task${taskNum}`.toLowerCase();
      const numStr = String(taskNum);
      const title = t.title.toLowerCase();

      return (
        code.includes(lower) ||
        codeCompact.includes(cleanQuery) ||
        numStr === cleanQuery ||
        title.includes(lower)
      );
    });
  }, [sortedTasks, searchTerm, taskNumberMap]);

  // Xác định nhãn hiển thị hiện tại
  const selectedTask = useMemo(() => {
    if (value === "all") return null;
    return sortedTasks.find((t) => t.id === value) || null;
  }, [value, sortedTasks]);

  const displayLabel = useMemo(() => {
    if (value === "all") return allLabel;
    if (selectedTask) {
      return `${formatTaskCode(selectedTask.id, taskNumberMap)}: ${selectedTask.title}`;
    }
    return placeholder;
  }, [value, selectedTask, allLabel, placeholder, taskNumberMap]);

  // Đóng khi click ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto focus ô search khi mở dropdown
  useEffect(() => {
    if (isOpen) {
      setSearchTerm("");
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`relative font-sans text-xs ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-[#E5E7EB] rounded-xl text-left font-semibold text-[#111827] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#111827]"
        title={displayLabel}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1 truncate">
          {Icon && <Icon className="w-3.5 h-3.5 text-[#6B7280] shrink-0" />}
          {selectedTask && value !== "all" ? (
            <span className="font-mono text-[10px] font-bold text-gray-700 bg-gray-200/80 px-1.5 py-0.5 rounded border border-gray-300 shrink-0">
              {formatTaskCode(selectedTask.id, taskNumberMap)}
            </span>
          ) : null}
          <span className="truncate text-xs font-bold text-[#111827]">
            {value === "all" ? allLabel : selectedTask?.title || placeholder}
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#6B7280] shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu with Search Field */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-[#E5E7EB] rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 min-w-[280px]">
          {/* Search Input Box */}
          <div className="p-2.5 border-b border-[#F3F4F6] bg-slate-50/70">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm mã (ví dụ: task-1) hoặc tiêu đề..."
                className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#111827]"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 p-0.5 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                  title="Xóa tìm kiếm"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto p-1 divide-y divide-slate-100">
            {/* Tùy chọn "Tất cả công việc" nếu cho phép */}
            {allowAll && !searchTerm.trim() && (
              <button
                type="button"
                onClick={() => {
                  onChange("all");
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                  value === "all"
                    ? "bg-slate-100 font-bold text-[#111827]"
                    : "hover:bg-slate-50 text-slate-700 font-medium"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-slate-500" />
                  <span>{allLabel}</span>
                </div>
                {value === "all" && (
                  <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                )}
              </button>
            )}

            {filteredTasks.length === 0 ? (
              <div className="py-6 px-3 text-center text-slate-400 text-xs italic">
                Không tìm thấy công việc nào khớp với &quot;{searchTerm}&quot;
              </div>
            ) : (
              filteredTasks.map((t) => {
                const isSelected = value === t.id;
                const taskNum = taskNumberMap.get(t.id) ?? t.id;

                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      onChange(t.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-blue-50 text-blue-900 font-bold border-l-2 border-l-blue-600"
                        : "hover:bg-slate-50 text-slate-800 font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="font-mono text-[10px] font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 shrink-0">
                        Task-{taskNum}
                      </span>
                      <span className="truncate">{t.title}</span>
                    </div>

                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
