"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sparkles, Mail, Lock, LogIn } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";

import { authService } from "@/services/auth.service";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const data = await authService.login(email, password);
      setAuth(data.user, data.accessToken);
      window.location.href = "/workspaces";
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        err.response?.data?.message || 
        "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white text-[#111827] relative overflow-hidden">
      <div className="w-full max-w-md bg-[#F6F5EF] p-8 rounded-3xl border border-[#E5E7EB] shadow-lg relative z-10">
        {/* Header Logo */}
        <div className="text-center space-y-3 mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5 text-[#111827]" />
            </div>
            <span className="font-extrabold text-2xl tracking-wider text-[#111827] font-sans">PROGA</span>
          </Link>
          <h1 className="text-2xl font-bold text-[#111827] font-sans">Đăng Nhập Hệ Thống</h1>
          <p className="text-xs text-[#6B7280] font-mono font-semibold">
            Truy cập Workspace và làm việc cùng Bộ ba AI Agents
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-[#FDEDEC] border border-[#FDEDEC] text-[#D93025] text-xs text-center font-mono font-bold">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 font-sans">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#111827] font-mono">
              Email hoặc Username
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                placeholder="developer@proga.vn hoặc pm_sonluu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm text-[#111827] focus:outline-none focus:border-[#111827] shadow-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#111827] font-mono">
              Mật khẩu
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm text-[#111827] focus:outline-none focus:border-[#111827] shadow-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#111827] hover:bg-[#1F2937] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 mt-6 font-mono disabled:opacity-50"
          >
            {loading ? (
              <span>Đang xác thực...</span>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Đăng Nhập</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-[#6B7280] font-mono font-semibold">
          Chưa có tài khoản?{" "}
          <Link href="/register" className="text-[#111827] font-bold hover:underline">
            Đăng ký tài khoản mới
          </Link>
        </div>
      </div>
    </div>
  );
}
