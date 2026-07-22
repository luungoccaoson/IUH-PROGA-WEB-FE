"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, Menu, X, LayoutDashboard, Bot, Smartphone, Zap } from "lucide-react";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-[#FFFFFF]/95 backdrop-blur-md border-b border-[#E5E7EB] py-3 shadow-sm"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-[#F6F5EF] border border-[#E5E7EB] flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5 text-[#111827] group-hover:rotate-12 transition-transform duration-300" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-xl tracking-wider text-[#111827] font-sans">
              PROGA
            </span>
            <span className="text-[10px] uppercase tracking-widest text-[#6B7280] font-mono font-bold">
              AI Project Platform
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-8 bg-[#F6F5EF] px-6 py-2 rounded-full border border-[#E5E7EB] shadow-sm">
          <a
            href="#features"
            className="text-sm font-semibold text-[#111827] hover:text-[#137333] transition-colors flex items-center gap-1.5"
          >
            <Zap className="w-4 h-4 text-[#137333]" />
            Tính năng
          </a>
          <a
            href="#ai-agents"
            className="text-sm font-semibold text-[#111827] hover:text-[#137333] transition-colors flex items-center gap-1.5"
          >
            <Bot className="w-4 h-4 text-[#111827]" />
            AI Agents
          </a>
          <a
            href="#kanban"
            className="text-sm font-semibold text-[#111827] hover:text-[#137333] transition-colors flex items-center gap-1.5"
          >
            <LayoutDashboard className="w-4 h-4 text-[#137333]" />
            Bảng Kanban
          </a>
          <a
            href="#mobile-app"
            className="text-sm font-semibold text-[#111827] hover:text-[#137333] transition-colors flex items-center gap-1.5"
          >
            <Smartphone className="w-4 h-4 text-[#6B7280]" />
            Mobile Sync
          </a>
        </nav>

        {/* Action Buttons (No Theme Switcher) */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-bold text-[#111827] hover:text-black px-4 py-2 rounded-lg transition-colors"
          >
            Đăng nhập
          </Link>
          <Link
            href="/workspaces"
            className="group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#111827] hover:bg-[#1F2937] shadow-md transition-all duration-200"
          >
            <span>Vào Workspace</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg bg-[#F6F5EF] border border-[#E5E7EB] text-[#111827]"
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#FFFFFF] border-b border-[#E5E7EB] px-6 py-6 mt-3 space-y-4 animate-in fade-in slide-in-from-top-4">
          <a
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-[#111827] font-semibold py-2"
          >
            Tính năng hệ thống
          </a>
          <a
            href="#ai-agents"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-[#111827] font-semibold py-2"
          >
            Bộ ba AI Agents
          </a>
          <a
            href="#kanban"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-[#111827] font-semibold py-2"
          >
            Bảng Kanban &amp; Spaces
          </a>
          <a
            href="#mobile-app"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-[#111827] font-semibold py-2"
          >
            Ứng dụng Mobile Sync
          </a>
          <div className="pt-4 border-t border-[#E5E7EB] flex flex-col gap-3">
            <Link
              href="/login"
              className="w-full text-center py-2.5 rounded-lg border border-[#E5E7EB] text-[#111827] font-bold text-sm"
            >
              Đăng nhập
            </Link>
            <Link
              href="/workspaces"
              className="w-full text-center py-2.5 rounded-lg bg-[#111827] text-white font-bold text-sm shadow-md"
            >
              Vào Workspace
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
