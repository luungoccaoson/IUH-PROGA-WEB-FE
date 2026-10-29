"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User as UserIcon,
  Mail,
  Phone,
  Briefcase,
  FileText,
  Edit3,
  Save,
  X,
  CheckCircle2,
  Sparkles,
  Calendar,
  Search,
  Users,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";
import { User } from "@/types";
import { userService } from "@/services/user.service";
import { useAuthStore } from "@/stores/useAuthStore";
import { recommendSpaceRoleForMember } from "@/utils/roleAssignment";

interface UserProfileViewProps {
  targetUserId?: number;
}

const JOB_TITLE_SUGGESTIONS = [
  "Fullstack & AI Specialist",
  "Backend & DevOps Lead",
  "Frontend Developer (React / Next.js)",
  "Business Analyst & Scrum Master",
  "QA Automation & Manual Tester",
  "Mobile Developer (React Native)",
  "Database & Data Architect",
];

export function UserProfileView({ targetUserId }: UserProfileViewProps) {
  const router = useRouter();
  const { user: currentUser, updateUser } = useAuthStore();

  const resolvedUserId = targetUserId || currentUser?.id;
  const isOwnProfile = Boolean(currentUser?.id && resolvedUserId === currentUser.id);

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState("");
  const [memberSearch, setMemberSearch] = useState("");

  // Form states for editing
  const [fullName, setFullName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const populateForm = (u: User) => {
    setFullName(u.fullName || "");
    setDisplayName(u.displayName || "");
    setPhoneNumber(u.phoneNumber || "");
    setJobTitle(u.jobTitle || "");
    setBio(u.bio || "");
    setAvatarUrl(u.avatarUrl || "");
  };

  const fetchProfileAndDirectory = async () => {
    if (!resolvedUserId) return;
    try {
      setLoading(true);
      setError("");
      const [userDetail, usersList] = await Promise.all([
        userService.getUserById(resolvedUserId),
        userService.getAllUsers().catch(() => []),
      ]);
      setProfileUser(userDetail);
      populateForm(userDetail);
      setAllUsers(usersList || []);
    } catch (err: any) {
      console.error("Failed to load user profile:", err);
      setError("Không thể tải thông tin hồ sơ người dùng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (resolvedUserId) {
      fetchProfileAndDirectory();
      setIsEditing(false);
      setSaveSuccess(false);
    }
  }, [resolvedUserId]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileUser || !isOwnProfile) return;

    try {
      setSaving(true);
      setError("");
      setSaveSuccess(false);

      const updated = await userService.updateUserProfile(profileUser.id, {
        fullName: fullName.trim(),
        displayName: displayName.trim(),
        phoneNumber: phoneNumber.trim(),
        jobTitle: jobTitle.trim(),
        bio: bio.trim(),
        avatarUrl: avatarUrl.trim(),
      });

      setProfileUser(updated);
      populateForm(updated);
      updateUser(updated);
      setAllUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setError(err.response?.data?.message || "Không thể cập nhật thông tin hồ sơ. Vui lòng thử lại!");
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (u?: User | null) => {
    const text = u?.fullName || u?.displayName || u?.username || u?.email || "U";
    const parts = text.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return text.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[#6B7280] font-sans">
        <Sparkles className="w-8 h-8 text-[#111827] animate-spin mb-3" />
        <p className="font-mono text-xs uppercase tracking-wider">Đang tải hồ sơ người dùng...</p>
      </div>
    );
  }

  if (error && !profileUser) {
    return (
      <div className="bg-[#FDEDEC] border border-[#FADBD8] text-[#D93025] p-6 rounded-2xl max-w-xl mx-auto text-center space-y-4 font-sans">
        <p className="font-bold">{error}</p>
        <button
          onClick={() => router.push("/profile")}
          className="px-4 py-2 bg-[#111827] text-white rounded-xl text-xs font-bold cursor-pointer"
        >
          Về hồ sơ của tôi
        </button>
      </div>
    );
  }

  if (!profileUser) return null;

  const roleAnalysis = recommendSpaceRoleForMember(profileUser, false);

  const filteredDirectory = allUsers.filter((u) => {
    if (!memberSearch.trim()) return true;
    const q = memberSearch.toLowerCase();
    return (
      (u.fullName && u.fullName.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.jobTitle && u.jobTitle.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-sans animate-in fade-in duration-200">
      {/* Top Bar / Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 rounded-xl border border-[#E5E7EB] bg-white hover:bg-gray-50 text-[#4B5563] transition-colors cursor-pointer shadow-2xs"
            title="Quay lại"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-[#111827] tracking-tight flex items-center gap-2">
              <span>{isOwnProfile ? "Hồ sơ cá nhân của tôi" : `Hồ sơ thành viên: ${profileUser.fullName || profileUser.username}`}</span>
              {isOwnProfile && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#E8F0FE] text-[#1A73E8] border border-[#D2E3FC] font-mono text-[10px] font-bold uppercase">
                  Tài khoản hiện tại
                </span>
              )}
            </h1>
            <p className="text-xs text-[#6B7280]">
              {isOwnProfile
                ? "Quản lý thông tin cá nhân, chức danh chuyên môn và kỹ năng để AI tự động phân công công việc chính xác hơn."
                : "Xem thông tin liên hệ, chức danh kỹ thuật và năng lực chuyên môn của thành viên trong hệ thống."}
            </p>
          </div>
        </div>

        {!isOwnProfile && currentUser?.id && (
          <button
            type="button"
            onClick={() => router.push("/profile")}
            className="px-4 py-2 bg-[#111827] hover:bg-black text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Về hồ sơ của tôi</span>
          </button>
        )}
      </div>

      {saveSuccess && (
        <div className="bg-[#E6F4EA] border border-[#CEE7D4] text-[#137333] px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-2xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Đã cập nhật thông tin hồ sơ cá nhân thành công!</span>
        </div>
      )}

      {error && (
        <div className="bg-[#FDEDEC] border border-[#FADBD8] text-[#D93025] px-4 py-3 rounded-2xl text-xs font-bold">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT / MAIN COLUMN (2/3 width): Profile Card & Edit Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Profile Card */}
          <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 shadow-2xs space-y-6">
            {/* Avatar & Header Info */}
            <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-[#F3F4F6]">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-[#111827] text-white font-mono font-extrabold text-2xl flex items-center justify-center shadow-md border-2 border-[#E5E7EB] shrink-0">
                  {getInitials(profileUser)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-extrabold text-[#111827]">
                      {profileUser.fullName || profileUser.username}
                    </h2>
                    {profileUser.displayName && (
                      <span className="text-xs font-mono text-[#6B7280] bg-[#F6F5EF] px-2 py-0.5 rounded-md border border-[#E5E7EB]">
                        @{profileUser.displayName}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-[#1A73E8] flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 shrink-0" />
                    <span>{roleAnalysis.standardizedJobTitle}</span>
                  </p>
                  <p className="text-xs text-[#6B7280] flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span>{profileUser.email}</span>
                  </p>
                </div>
              </div>

              {isOwnProfile && !isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-[#1A73E8] hover:bg-[#1557B0] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Chỉnh sửa hồ sơ</span>
                </button>
              )}
            </div>

            {/* EDIT MODE FORM */}
            {isEditing && isOwnProfile ? (
              <form onSubmit={handleSaveProfile} className="space-y-4 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-[#4B5563] uppercase tracking-wider font-mono">
                      Họ và tên đầy đủ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="VD: Lưu Ngọc Cao Sơn"
                      className="w-full px-3.5 py-2.5 bg-white border border-[#D1D5DB] rounded-xl text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#1A73E8]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-[#4B5563] uppercase tracking-wider font-mono">
                      Tên hiển thị (Display Name)
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="VD: Son Luu"
                      className="w-full px-3.5 py-2.5 bg-white border border-[#D1D5DB] rounded-xl text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#1A73E8]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-[#4B5563] uppercase tracking-wider font-mono">
                      Số điện thoại
                    </label>
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="VD: 0901234567"
                      className="w-full px-3.5 py-2.5 bg-white border border-[#D1D5DB] rounded-xl text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#1A73E8]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-[#4B5563] uppercase tracking-wider font-mono">
                      Email (Không thể thay đổi)
                    </label>
                    <input
                      type="email"
                      disabled
                      value={profileUser.email}
                      className="w-full px-3.5 py-2.5 bg-gray-100 border border-[#E5E7EB] rounded-xl text-xs font-semibold text-gray-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Job Title + Quick Suggestions */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-[#4B5563] uppercase tracking-wider font-mono">
                    Chức danh chuyên môn (Job Title)
                  </label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="VD: Fullstack & AI Specialist, Backend Developer, Business Analyst..."
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D1D5DB] rounded-xl text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#1A73E8]"
                  />
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    <span className="text-[10px] font-mono text-[#6B7280]">Gợi ý nhanh:</span>
                    {JOB_TITLE_SUGGESTIONS.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setJobTitle(item)}
                        className="px-2 py-0.5 rounded-md bg-[#F6F5EF] hover:bg-[#E8F0FE] hover:text-[#1A73E8] border border-[#E5E7EB] text-[10px] font-mono font-semibold text-[#4B5563] transition-colors cursor-pointer"
                      >
                        + {item}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bio / Skills Description */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#4B5563] uppercase tracking-wider font-mono">
                    Giới thiệu kỹ năng &amp; Kinh nghiệm (Bio)
                  </label>
                  <textarea
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Mô tả kỹ năng chuyên môn (VD: Chuyên phụ trách Spring Boot, PostgreSQL, React/Next.js, AI Agent RAG, phân tích nghiệp vụ BA...)"
                    className="w-full p-3.5 bg-white border border-[#D1D5DB] rounded-2xl text-xs font-medium text-[#111827] focus:outline-none focus:border-[#1A73E8] leading-relaxed"
                  />
                  <p className="text-[11px] text-[#6B7280]">
                    💡 Hệ thống AI dựa vào <strong>Chức danh</strong> và <strong>Kỹ năng (Bio)</strong> này để gợi ý vai trò trong Space (ASSISTANT / MEMBER) và tự động phân bổ công việc phù hợp.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5E7EB]">
                  <button
                    type="button"
                    onClick={() => {
                      populateForm(profileUser);
                      setIsEditing(false);
                    }}
                    className="px-4 py-2 border border-[#D1D5DB] bg-white hover:bg-gray-50 text-[#4B5563] rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Hủy</span>
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 bg-[#111827] hover:bg-black text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{saving ? "Đang lưu..." : "Lưu cập nhật"}</span>
                  </button>
                </div>
              </form>
            ) : (
              /* VIEW MODE DETAILS */
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] space-y-1">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-[#6B7280] font-bold flex items-center gap-1.5">
                      <UserIcon className="w-3.5 h-3.5 text-[#1A73E8]" />
                      Username / Định danh
                    </p>
                    <p className="text-xs font-bold text-[#111827]">
                      {profileUser.username} (ID: #{profileUser.id})
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] space-y-1">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-[#6B7280] font-bold flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#10B981]" />
                      Số điện thoại liên hệ
                    </p>
                    <p className="text-xs font-bold text-[#111827]">
                      {profileUser.phoneNumber || "Chưa cập nhật"}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] space-y-1">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-[#6B7280] font-bold flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-[#F59E0B]" />
                      Chức danh chuyên môn
                    </p>
                    <p className="text-xs font-bold text-[#111827]">
                      {profileUser.jobTitle || roleAnalysis.standardizedJobTitle}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] space-y-1">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-[#6B7280] font-bold flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#6366F1]" />
                      Ngày tham gia hệ thống
                    </p>
                    <p className="text-xs font-bold text-[#111827]">
                      {profileUser.createdAt
                        ? new Date(profileUser.createdAt).toLocaleDateString("vi-VN")
                        : "Thành viên chính thức"}
                    </p>
                  </div>
                </div>

                {/* Bio Section */}
                <div className="p-4 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] space-y-2">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-[#6B7280] font-bold flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#111827]" />
                    Giới thiệu kỹ năng &amp; Kinh nghiệm (Bio)
                  </p>
                  <p className="text-xs text-[#374151] leading-relaxed whitespace-pre-line">
                    {profileUser.bio || "Thành viên chưa cập nhật mô tả kỹ năng chi tiết."}
                  </p>
                </div>

                {/* AI Competency & Role Consultant Card */}
                <div className="p-4 rounded-2xl bg-[#F6F5EF] border border-[#E5E7EB] space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <p className="text-xs font-extrabold text-[#111827] flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#137333]" />
                      <span>Hồ sơ năng lực kỹ thuật &amp; Gợi ý phân quyền AI</span>
                    </p>
                    <span className="px-2.5 py-0.5 rounded-lg bg-white border border-[#E5E7EB] font-mono text-[10px] font-bold text-[#1A73E8]">
                      Gợi ý khi tham gia Space: {roleAnalysis.roleBadgeLabel}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {roleAnalysis.primaryDomains.map((dom) => (
                      <span
                        key={dom}
                        className="px-2.5 py-1 rounded-lg bg-white border border-[#E5E7EB] text-[11px] font-mono font-bold text-[#111827] shadow-2xs"
                      >
                        #{dom}
                      </span>
                    ))}
                  </div>

                  <p className="text-[11px] text-[#4B5563] leading-relaxed">
                    {roleAnalysis.reason}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN (1/3 width): System Member Directory (View Other Users' Profiles) */}
        <div className="space-y-4">
          <div className="bg-white border border-[#E5E7EB] rounded-3xl p-5 shadow-2xs space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-[#111827] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#1A73E8]" />
                <span>Danh bạ thành viên ({allUsers.length})</span>
              </h3>
              <p className="text-[11px] text-[#6B7280]">
                Nhấn vào bất kỳ thành viên nào để xem hồ sơ chi tiết của họ.
              </p>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#9CA3AF]" />
              <input
                type="text"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Tìm thành viên theo tên, email..."
                className="w-full pl-8 pr-3 py-1.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#111827] focus:outline-none focus:border-[#1A73E8]"
              />
            </div>

            <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
              {filteredDirectory.map((member) => {
                const isSelected = member.id === profileUser.id;
                const isMe = currentUser?.id === member.id;
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => {
                      if (isMe) {
                        router.push("/profile");
                      } else {
                        router.push(`/profile/${member.id}`);
                      }
                    }}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-2xl text-left transition-all cursor-pointer border ${
                      isSelected
                        ? "bg-[#E8F0FE]/70 border-[#1A73E8] shadow-2xs"
                        : "bg-white hover:bg-[#F9FAFB] border-transparent hover:border-[#E5E7EB]"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl font-mono font-bold text-xs flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "bg-[#1A73E8] text-white"
                          : "bg-[#F6F5EF] text-[#111827] border border-[#E5E7EB]"
                      }`}
                    >
                      {getInitials(member)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#111827] truncate flex items-center gap-1">
                        <span className="truncate">{member.fullName || member.username}</span>
                        {isMe && (
                          <span className="text-[10px] font-mono text-[#1A73E8] font-extrabold shrink-0">
                            (Tôi)
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-[#6B7280] truncate">
                        {member.jobTitle || member.email}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
