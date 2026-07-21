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
          ? "bg-[#090d16]/80 backdrop-blur-md border-b border-white/10 py-3 shadow-lg shadow-indigo-950/20"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-500 p-[1px] shadow-lg shadow-indigo-500/25 group-hover:shadow-indigo-500/40 transition-all">
            <div className="w-full h-full bg-[#090d16] rounded-[11px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-cyan-400 group-hover:rotate-12 transition-transform duration-300" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-xl tracking-wider gradient-text font-sans">
              PROGA
            </span>
            <span className="text-[10px] uppercase tracking-widest text-indigo-400 font-mono">
              AI Project Platform
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-8 glass-panel px-6 py-2 rounded-full border border-white/10">
          <a
            href="#features"
            className="text-sm font-medium text-slate-300 hover:text-cyan-400 transition-colors flex items-center gap-1.5"
          >
            <Zap className="w-4 h-4 text-cyan-400" />
            Tính năng
          </a>
          <a
            href="#ai-agents"
            className="text-sm font-medium text-slate-300 hover:text-indigo-400 transition-colors flex items-center gap-1.5"
          >
            <Bot className="w-4 h-4 text-indigo-400" />
            AI Agents
          </a>
          <a
            href="#kanban"
            className="text-sm font-medium text-slate-300 hover:text-violet-400 transition-colors flex items-center gap-1.5"
          >
            <LayoutDashboard className="w-4 h-4 text-violet-400" />
            Bảng Kanban
          </a>
          <a
            href="#mobile-app"
            className="text-sm font-medium text-slate-300 hover:text-emerald-400 transition-colors flex items-center gap-1.5"
          >
            <Smartphone className="w-4 h-4 text-emerald-400" />
            Mobile Sync
          </a>
        </nav>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-medium text-slate-300 hover:text-white px-4 py-2 rounded-lg transition-colors"
          >
            Đăng nhập
          </Link>
          <Link
            href="/workspaces"
            className="group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-600 shadow-md shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            <span>Vào Workspace</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-panel border-b border-white/10 px-6 py-6 mt-3 space-y-4 animate-in fade-in slide-in-from-top-4">
          <a
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-slate-200 hover:text-cyan-400 font-medium py-2"
          >
            Tính năng hệ thống
          </a>
          <a
            href="#ai-agents"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-slate-200 hover:text-indigo-400 font-medium py-2"
          >
            Bộ ba AI Agents
          </a>
          <a
            href="#kanban"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-slate-200 hover:text-violet-400 font-medium py-2"
          >
            Bảng Kanban & Spaces
          </a>
          <a
            href="#mobile-app"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-slate-200 hover:text-emerald-400 font-medium py-2"
          >
            Ứng dụng Mobile Sync
          </a>
          <div className="pt-4 border-t border-slate-800 flex flex-col gap-3">
            <Link
              href="/login"
              className="w-full text-center py-2.5 rounded-lg border border-slate-700 text-slate-200 hover:bg-slate-800 font-medium text-sm"
            >
              Đăng nhập
            </Link>
            <Link
              href="/workspaces"
              className="w-full text-center py-2.5 rounded-lg bg-indigo-600 text-white font-medium text-sm shadow-lg shadow-indigo-600/30"
            >
              Vào Workspace
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
