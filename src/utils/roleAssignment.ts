import { Task, User } from "@/types";

export type RoleCategory =
  | "FRONTEND"
  | "BACKEND"
  | "FULLSTACK"
  | "QA"
  | "DEVOPS"
  | "MANAGEMENT"
  | "GENERAL";

export interface TaskAssignmentResult {
  taskId: number;
  taskTitle: string;
  sprintId?: number | null;
  assignedMember: User;
  roleReason: string;
  category: RoleCategory;
}

export interface AutoAssignSummary {
  assignments: { taskId: number; ownerId: number }[];
  preview: TaskAssignmentResult[];
  memberStats: {
    member: User;
    count: number;
    existingOpenCount: number;
    existingDoneCount: number;
    assignedTasks: TaskAssignmentResult[];
  }[];
  totalAssigned: number;
}

/**
 * Chuẩn hóa chuỗi tìm kiếm không phân biệt hoa thường và dấu tiếng Việt
 */
function normalizeText(text?: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Phân tích năng lực chuyên môn của thành viên
 */
export function getMemberCapabilities(user: User) {
  const text = normalizeText(
    `${user.jobTitle || ""} ${user.bio || ""} ${user.fullName || ""}`,
  );

  const isFullstack =
    text.includes("fullstack") ||
    text.includes("full-stack") ||
    text.includes("full stack");

  const isFrontend =
    isFullstack ||
    text.includes("frontend") ||
    text.includes("front-end") ||
    text.includes("fe") ||
    text.includes("react") ||
    text.includes("next.js") ||
    text.includes("nextjs") ||
    text.includes("ui") ||
    text.includes("ux");

  const isBackend =
    isFullstack ||
    text.includes("backend") ||
    text.includes("back-end") ||
    text.includes("be") ||
    text.includes("java") ||
    text.includes("spring") ||
    text.includes("node") ||
    text.includes("api") ||
    text.includes("database") ||
    text.includes("csdl");

  const isQA =
    text.includes("qa") ||
    text.includes("qc") ||
    text.includes("tester") ||
    text.includes("test") ||
    text.includes("kiem thu") ||
    text.includes("chat luong");

  const isDevOps =
    text.includes("devops") ||
    text.includes("system") ||
    text.includes("cloud") ||
    text.includes("ha tang") ||
    text.includes("vps") ||
    text.includes("docker") ||
    text.includes("architect") ||
    text.includes("sysadmin");

  const isManagement =
    text.includes("pm") ||
    text.includes("project manager") ||
    text.includes("scrum master") ||
    text.includes("ba") ||
    text.includes("business analyst") ||
    text.includes("phan tich") ||
    text.includes("quan ly");

  return {
    isFrontend,
    isBackend,
    isFullstack,
    isQA,
    isDevOps,
    isManagement,
    isDedicatedFrontend: isFrontend && !isFullstack,
    isDedicatedBackend: isBackend && !isFullstack,
  };
}

/**
 * Nhận diện vai trò yêu cầu của một Task
 */
export function detectTaskCategory(task: Task): {
  category: RoleCategory;
  reason: string;
  suggestedName?: string;
} {
  const normTitle = normalizeText(task.title);
  const normDesc = normalizeText(task.description);
  const fullContent = `${normTitle} ${normDesc}`;

  // 1. Kiểm tra vai trò định nghĩa từ AI Decomposition: [AI Decomposed - Role: ...]
  if (task.description) {
    const roleMatch = task.description.match(/Role:\s*([^\n\r\]\)]+)/i);
    if (roleMatch && roleMatch[1]) {
      const explicitRole = normalizeText(roleMatch[1]);
      if (explicitRole.includes("frontend") || explicitRole.includes("ui")) {
        return {
          category: "FRONTEND",
          reason: "Khớp chỉ định AI: Frontend Developer",
        };
      }
      if (
        explicitRole.includes("backend") ||
        explicitRole.includes("database") ||
        explicitRole.includes("csdl")
      ) {
        return {
          category: "BACKEND",
          reason: "Khớp chỉ định AI: Backend Developer",
        };
      }
      if (
        explicitRole.includes("qa") ||
        explicitRole.includes("test") ||
        explicitRole.includes("kiem thu")
      ) {
        return { category: "QA", reason: "Khớp chỉ định AI: QA Lead / Tester" };
      }
      if (
        explicitRole.includes("devops") ||
        explicitRole.includes("architect") ||
        explicitRole.includes("system")
      ) {
        return {
          category: "DEVOPS",
          reason: "Khớp chỉ định AI: DevOps / System Architect",
        };
      }
      if (
        explicitRole.includes("ba") ||
        explicitRole.includes("analyst") ||
        explicitRole.includes("pm")
      ) {
        return {
          category: "MANAGEMENT",
          reason: "Khớp chỉ định AI: Business Analyst / PM",
        };
      }
    }

    // Kiểm tra tên người được gợi ý phân công: 👤 Phân công cho: [Tên]
    const assignMatch = task.description.match(/Phân công cho:\s*([^\n\r]+)/i);
    if (assignMatch && assignMatch[1]) {
      return {
        category: "GENERAL",
        reason: `Gợi ý đích danh: ${assignMatch[1].trim()}`,
        suggestedName: assignMatch[1].trim(),
      };
    }
  }

  // 2. Phân loại theo từ khóa kỹ thuật (Semantic Keyword Scoring)
  const feKeywords = [
    "giao dien",
    "frontend",
    "ui",
    "ux",
    "react",
    "next.js",
    "nextjs",
    "css",
    "tailwind",
    "component",
    "drawer",
    "modal",
    "page",
    "accordion",
    "preview",
    "chatbot",
    "kanban",
    "drag & drop",
    "dnd",
    "man hinh",
    "hien thi",
    "layout",
  ];
  const beKeywords = [
    "backend",
    "api",
    "rest",
    "service",
    "database",
    "csdl",
    "schema",
    "postgresql",
    "mongodb",
    "controller",
    "microservice",
    "kafka",
    "redis",
    "middleware",
    "token",
    "jwt",
    "auth",
    "interceptor",
    "stream",
    "xu ly du lieu",
    "aggregation",
    "entity",
    "repository",
  ];
  const qaKeywords = [
    "kiem thu",
    "test",
    "qa",
    "qc",
    "e2e",
    "unit test",
    "integration test",
    "benchmark",
    "load test",
    "loi",
    "bug",
    "lot loi",
    "chat luong",
    "kiem tra",
  ];
  const devopsKeywords = [
    "docker",
    "container",
    "ci/cd",
    "pipeline",
    "deploy",
    "trien khai",
    "vps",
    "cloud",
    "server",
    "k8s",
    "kubernetes",
    "ha tang",
    "dong goi",
  ];
  const mgmtKeywords = [
    "yeu cau",
    "requirement",
    "ba",
    "ke hoach",
    "bao cao",
    "tai lieu",
    "dac ta",
    "sprint",
    "wbs",
    "do an",
    "nghiem thu",
  ];

  const scoreFe = feKeywords.filter((k) => fullContent.includes(k)).length;
  const scoreBe = beKeywords.filter((k) => fullContent.includes(k)).length;
  const scoreQa = qaKeywords.filter((k) => fullContent.includes(k)).length;
  const scoreDevOps = devopsKeywords.filter((k) =>
    fullContent.includes(k),
  ).length;
  const scoreMgmt = mgmtKeywords.filter((k) => fullContent.includes(k)).length;

  const maxScore = Math.max(scoreFe, scoreBe, scoreQa, scoreDevOps, scoreMgmt);

  if (maxScore > 0) {
    if (maxScore === scoreQa) {
      return {
        category: "QA",
        reason: "Khớp từ khóa chuyên môn: Kiểm thử & Đảm bảo chất lượng (QA)",
      };
    }
    if (maxScore === scoreDevOps) {
      return {
        category: "DEVOPS",
        reason:
          "Khớp từ khóa chuyên môn: Đóng gói & Triển khai hạ tầng (DevOps)",
      };
    }
    if (maxScore === scoreFe) {
      return {
        category: "FRONTEND",
        reason:
          "Khớp từ khóa chuyên môn: Giao diện & Trải nghiệm người dùng (Frontend)",
      };
    }
    if (maxScore === scoreBe) {
      return {
        category: "BACKEND",
        reason:
          "Khớp từ khóa chuyên môn: Xử lý dữ liệu & Kiến trúc dịch vụ (Backend)",
      };
    }
    if (maxScore === scoreMgmt) {
      return {
        category: "MANAGEMENT",
        reason:
          "Khớp từ khóa chuyên môn: Phân tích nghiệp vụ & Quản lý (BA/PM)",
      };
    }
  }

  return { category: "GENERAL", reason: "Phân bổ cân bằng theo nhóm năng lực" };
}

/**
 * Lấy số ngày làm việc thực tế của một Task do AI ước tính từ trước (Số nguyên tròn: 1, 2, 3...)
 */
export function getTaskComplexity(task: Task): {
  days: number;
  label: string;
  level: "HIGH" | "MEDIUM" | "LOW";
} {
  let days = 2;

  // 1. Ưu tiên lấy từ trường estimatedDays mà AI đã lưu
  if (task.estimatedDays && task.estimatedDays > 0) {
    days = Math.round(task.estimatedDays);
  } else if (task.description) {
    // 2. Tìm trong mô tả task nếu AI đã phân rã ra trước đó
    const match = task.description.match(
      /(?:ước tính|thời gian|estimate|dự kiến)?:\s*(\d+)\s*(?:ngày|days?)/i,
    );
    if (match && match[1]) {
      const parsed = parseInt(match[1], 10);
      if (!isNaN(parsed) && parsed > 0) days = parsed;
    } else {
      const daysMatch = task.description.match(/(\d+)\s*ngày/i);
      if (daysMatch && daysMatch[1]) {
        const parsed = parseInt(daysMatch[1], 10);
        if (!isNaN(parsed) && parsed > 0) days = parsed;
      }
    }
  } else if (task.startDate && task.dueDate) {
    // 3. Tính từ khoảng thời gian startDate và dueDate nếu có
    const diff = Math.ceil(
      (new Date(task.dueDate).getTime() - new Date(task.startDate).getTime()) /
        (1000 * 60 * 60 * 24),
    );
    if (diff > 0 && diff <= 14) days = diff;
  } else if (task.priority === "URGENT" || task.priority === "HIGH") {
    // 4. Nếu task ưu tiên khẩn cấp/cao -> 3 ngày, còn lại mặc định 2 ngày
    days = 3;
  }

  const level = days >= 3 ? "HIGH" : days === 2 ? "MEDIUM" : "LOW";
  return { days, label: `${days} ngày`, level };
}

/**
 * Thuật toán phân công tự động toàn diện theo vai trò và cân bằng tải công bằng cho TẤT CẢ thành viên
 */
export function autoAssignTasks(
  tasks: Task[],
  members: User[],
  options: {
    unassignedOnly?: boolean;
    sprintId?: number | null;
  } = {},
): AutoAssignSummary {
  if (!members || members.length === 0 || !tasks || tasks.length === 0) {
    return { assignments: [], preview: [], memberStats: [], totalAssigned: 0 };
  }

  // 1. Lọc danh sách task mục tiêu
  let targetTasks = tasks.filter((t) => !t.isDeleted);

  if (options.sprintId !== undefined) {
    targetTasks = targetTasks.filter((t) => t.sprintId === options.sprintId);
  }

  if (options.unassignedOnly) {
    targetTasks = targetTasks.filter((t) => !t.ownerId && !t.assignee?.id);
  }

  const targetTaskIds = new Set(targetTasks.map((t) => t.id));

  // Tính số việc đang mở (chưa xong) và đã xong hiện tại của từng thành viên (không tính các task đang chuẩn bị gán lại)
  const existingOpenByMember: Record<number, number> = {};
  const existingDoneByMember: Record<number, number> = {};
  const existingDaysByMember: Record<number, number> = {};

  members.forEach((m) => {
    const memberExistingTasks = tasks.filter(
      (t) =>
        !t.isDeleted &&
        !targetTaskIds.has(t.id) &&
        (t.ownerId === m.id || t.assignee?.id === m.id),
    );
    const openTasks = memberExistingTasks.filter((t) => t.status !== "DONE");
    const doneTasks = memberExistingTasks.filter((t) => t.status === "DONE");

    existingOpenByMember[m.id] = openTasks.length;
    existingDoneByMember[m.id] = doneTasks.length;
    existingDaysByMember[m.id] = openTasks.reduce(
      (sum, t) => sum + getTaskComplexity(t).days,
      0,
    );
  });

  if (targetTasks.length === 0) {
    return {
      assignments: [],
      preview: [],
      memberStats: members.map((m) => ({
        member: m,
        count: 0,
        existingOpenCount: existingOpenByMember[m.id] || 0,
        existingDoneCount: existingDoneByMember[m.id] || 0,
        assignedTasks: [],
      })),
      totalAssigned: 0,
    };
  }

  // 2. Khởi tạo bộ đếm số task chưa xong và tổng ngày công việc (Workload Counter)
  const memberWorkload: Record<number, number> = {};
  const memberDaysLoad: Record<number, number> = {};
  members.forEach((m) => {
    memberWorkload[m.id] = existingOpenByMember[m.id] || 0;
    memberDaysLoad[m.id] = existingDaysByMember[m.id] || 0;
  });

  const memberCaps = members.map((m) => ({
    member: m,
    caps: getMemberCapabilities(m),
  }));

  // Sắp xếp task theo độ phức tạp / ngày ước tính giảm dần (LPT - Longest Processing Time First)
  // Task kỹ thuật cốt lõi lớn xếp trước để Dev chuyên môn nhận, các task vừa/nhỏ chia đều cho các thành viên khác
  const sortedTasks = [...targetTasks].sort((a, b) => {
    const compA = getTaskComplexity(a).days;
    const compB = getTaskComplexity(b).days;
    return compB - compA;
  });

  const totalOpenAfterBatch =
    Object.values(existingOpenByMember).reduce((a, b) => a + b, 0) +
    sortedTasks.length;
  // Số lượng task trung bình mỗi người nên giữ để đảm bảo công bằng
  const avgTasksPerMember = Math.ceil(totalOpenAfterBatch / members.length);
  // Ngưỡng tối đa cho 1 thành viên để không bị dồn việc quá tải
  const maxTasksPerMember = Math.max(
    avgTasksPerMember + 1,
    Math.ceil(totalOpenAfterBatch * 0.4),
  );

  const categoryShortLabel: Record<RoleCategory, string> = {
    FRONTEND: "Frontend & UI",
    BACKEND: "Backend & CSDL",
    FULLSTACK: "Fullstack",
    QA: "Kiểm thử (QA)",
    DEVOPS: "DevOps & Hạ tầng",
    MANAGEMENT: "Phân tích & Quản lý (BA/PM)",
    GENERAL: "Đa năng",
  };

  const previewResults: TaskAssignmentResult[] = [];
  const assignments: { taskId: number; ownerId: number }[] = [];

  // 3. Phân công từng task với cơ chế Khớp Chuyên Môn + Cân Bằng Tải Thực Sự
  for (const task of sortedTasks) {
    const { category, suggestedName } = detectTaskCategory(task);
    const comp = getTaskComplexity(task);

    let selectedMember: User | null = null;
    let finalReason = "";

    // Ưu tiên 0: Trùng tên gợi ý trong mô tả AI (nếu người đó chưa bị quá tải)
    if (suggestedName) {
      const normSuggested = normalizeText(suggestedName);
      const matchUser = members.find(
        (m) =>
          normalizeText(m.fullName).includes(normSuggested) ||
          normSuggested.includes(normalizeText(m.fullName)) ||
          normalizeText(m.displayName || "").includes(normSuggested),
      );
      if (
        matchUser &&
        (memberWorkload[matchUser.id] || 0) < maxTasksPerMember
      ) {
        selectedMember = matchUser;
        const currentHold = memberWorkload[matchUser.id] || 0;
        finalReason = `Khớp đề xuất AI (${categoryShortLabel[category]}) • Đang giữ ${currentHold} việc chưa xong`;
      }
    }

    // Nếu chưa chọn theo tên, tính toán độ phù hợp theo chuyên môn + cân bằng tải
    if (!selectedMember) {
      let candidatePool: User[] = [];

      switch (category) {
        case "QA": {
          candidatePool = memberCaps
            .filter((mc) => mc.caps.isQA)
            .map((mc) => mc.member);
          break;
        }
        case "DEVOPS": {
          candidatePool = memberCaps
            .filter((mc) => mc.caps.isDevOps)
            .map((mc) => mc.member);
          break;
        }
        case "FRONTEND": {
          candidatePool = memberCaps
            .filter((mc) => mc.caps.isFrontend)
            .map((mc) => mc.member);
          break;
        }
        case "BACKEND": {
          candidatePool = memberCaps
            .filter((mc) => mc.caps.isBackend)
            .map((mc) => mc.member);
          break;
        }
        case "MANAGEMENT": {
          candidatePool = memberCaps
            .filter((mc) => mc.caps.isManagement)
            .map((mc) => mc.member);
          break;
        }
        default:
          break;
      }

      const membersWithZeroTasks = members.filter(
        (m) => (memberWorkload[m.id] || 0) === 0,
      );
      const allCandidatesOverloaded =
        candidatePool.length > 0 &&
        candidatePool.every(
          (m) => (memberWorkload[m.id] || 0) >= maxTasksPerMember,
        );

      let isLoadSharedFallback = false;
      if (candidatePool.length === 0 || allCandidatesOverloaded) {
        candidatePool = members;
        isLoadSharedFallback = true;
      } else if (membersWithZeroTasks.length > 0 && comp.level !== "HIGH") {
        candidatePool = Array.from(
          new Set([...candidatePool, ...membersWithZeroTasks]),
        );
      }

      const scoredCandidates = candidatePool.map((m) => {
        const currentCount = memberWorkload[m.id] || 0;
        const currentDays = memberDaysLoad[m.id] || 0;
        const caps = getMemberCapabilities(m);

        let roleScore = 0;
        let hasDirectSkill = false;
        if (category === "FRONTEND" && caps.isFrontend) {
          roleScore += 12;
          hasDirectSkill = true;
        }
        if (category === "BACKEND" && caps.isBackend) {
          roleScore += 12;
          hasDirectSkill = true;
        }
        if (category === "QA" && caps.isQA) {
          roleScore += 12;
          hasDirectSkill = true;
        }
        if (category === "DEVOPS" && caps.isDevOps) {
          roleScore += 12;
          hasDirectSkill = true;
        }
        if (category === "MANAGEMENT" && caps.isManagement) {
          roleScore += 12;
          hasDirectSkill = true;
        }

        // Phạt nặng theo số việc đang giữ để ưu tiên người đang giữ ít việc hơn
        const loadPenalty = currentCount * 7 + currentDays * 2;
        // Thưởng cho người đang giữ 0 việc để mọi thành viên đều có việc làm
        const zeroBonus = currentCount === 0 ? 18 : 0;

        return {
          member: m,
          hasDirectSkill,
          currentCount,
          score: zeroBonus + roleScore - loadPenalty,
        };
      });

      scoredCandidates.sort((a, b) => b.score - a.score);
      const winner = scoredCandidates[0];
      selectedMember = winner.member;

      const holdText =
        winner.currentCount === 0
          ? "Đang rảnh (0 việc chưa xong)"
          : `Đang giữ ${winner.currentCount} việc chưa xong`;

      if (winner.hasDirectSkill && category !== "GENERAL") {
        finalReason = `Đúng chuyên môn ${categoryShortLabel[category]} • ${holdText}`;
      } else if (isLoadSharedFallback) {
        finalReason = `San sẻ cân bằng tải (Nhóm ${categoryShortLabel[category]} đã đầy việc) • ${holdText}`;
      } else {
        finalReason = `Phân bổ cân bằng tải • ${holdText}`;
      }
    }

    // Cập nhật bộ đếm tải và danh sách gán
    memberWorkload[selectedMember.id] =
      (memberWorkload[selectedMember.id] || 0) + 1;
    memberDaysLoad[selectedMember.id] =
      (memberDaysLoad[selectedMember.id] || 0) + comp.days;

    assignments.push({
      taskId: task.id,
      ownerId: selectedMember.id,
    });

    previewResults.push({
      taskId: task.id,
      taskTitle: task.title,
      sprintId: task.sprintId,
      assignedMember: selectedMember,
      roleReason: finalReason,
      category,
    });
  }

  // 4. Tổng hợp thống kê theo thành viên
  const memberStats = members.map((m) => {
    const memberTasks = previewResults.filter(
      (p) => p.assignedMember.id === m.id,
    );
    return {
      member: m,
      count: memberTasks.length,
      existingOpenCount: existingOpenByMember[m.id] || 0,
      existingDoneCount: existingDoneByMember[m.id] || 0,
      assignedTasks: memberTasks,
    };
  });

  return {
    assignments,
    preview: previewResults,
    memberStats,
    totalAssigned: assignments.length,
  };
}

/**
 * ============================================================================
 * SPACE-LEVEL RBAC (ROLE-BASED ACCESS CONTROL) & GOVERNANCE MATRIX
 * Mô hình 3 Vai trò đơn giản, dễ hiểu cho Khóa luận (1 Space chỉ có duy nhất 1 PM):
 * - PM (roleId = 2): Duy nhất 1 PM cho mỗi Space (Người tạo Space / Chủ sở hữu).
 *   Toàn quyền cài đặt Space, quản lý thành viên, xóa dữ liệu, và DUYỆT CUỐI CÙNG (Chốt DONE).
 * - ASSISTANT (roleId = 4): Trợ lý điều phối (BA / Scrum Master / Điều phối viên).
 *   Hỗ trợ chạy AI phân rã nháp, sửa deadline, gán việc, sắp xếp Kanban,
 *   nhưng KHÔNG có quyền bấm Duyệt DONE và KHÔNG có quyền xóa Space/Sprint/Task.
 * - MEMBER (roleId = 3): Mặc định khi được thêm vào Space.
 *   Tạo task mới, tự nhận việc trống (+ Nhận việc), cập nhật tiến độ và bấm Hoàn thành (sang Chờ duyệt) để PM duyệt DONE.
 * ============================================================================
 */
export type SpaceRoleType = "PM" | "ASSISTANT" | "MEMBER";

export interface SpaceMemberPermissions {
  can_manage_space_and_members: boolean; // Cài đặt Space, Thêm/Xóa thành viên, Quản lý Thùng rác, Xóa Sprint/Task (Chỉ PM)
  can_approve_tasks_to_done: boolean; // Chốt duyệt công việc hoàn thành sang trạng thái ĐÃ XONG - DONE (Chỉ PM)
  can_coordinate_and_ai_draft: boolean; // Dùng AI phân rã nháp, Tự động phân công, Tạo/Sửa Sprint, Sửa Deadline & Sắp xếp Kanban (PM + ASSISTANT)
  can_create_and_self_assign: boolean; // Tạo task mới và Tự nhận việc chưa có người làm (PM + ASSISTANT + MEMBER)
  can_execute_own_tasks: boolean; // Cập nhật tiến độ công việc cá nhân & báo cáo hoàn thành chờ PM duyệt (PM + ASSISTANT + MEMBER)
  can_view_risk_dashboard: boolean; // Xem Tổng quan, Mindmap, Timeline & Cảnh báo trễ hạn (Tất cả)
}

export interface RoleRecommendation {
  recommendedRole: SpaceRoleType;
  recommendedRoleId: number; // 2 = PM (chỉ 1 người tạo Space), 4 = ASSISTANT, 3 = MEMBER
  roleBadgeLabel: string; // VD: "PM (Quản lý Space)", "ASSISTANT (Trợ lý điều phối)", "MEMBER (Thực thi)"
  standardizedJobTitle: string;
  primaryDomains: string[];
  reason: string;
}

export function roleIdToSpaceRole(
  roleId?: number,
  isCreatorOrOwner?: boolean,
): SpaceRoleType {
  // Mỗi Space chỉ có duy nhất 1 PM (Người tạo Space / Chủ sở hữu Workspace)
  if (isCreatorOrOwner) return "PM";
  if (roleId === 4) return "ASSISTANT";
  return "MEMBER";
}

export function spaceRoleToRoleId(role: SpaceRoleType): number {
  if (role === "PM") return 2;
  if (role === "ASSISTANT") return 4;
  return 3;
}

/**
 * Chuẩn hóa chức danh kỹ thuật (standardized_job_title), lĩnh vực chuyên môn (primary_domains)
 * và Tư vấn / Đề xuất vai trò hợp lý trong Space ("Role & Permission Consultant Agent")
 * Quy tắc: Mỗi Space chỉ có 1 PM duy nhất (isCreatorOrOwner). Các thành viên khác chỉ nhận ASSISTANT hoặc MEMBER.
 */
export function recommendSpaceRoleForMember(
  user: User,
  isCreatorOrOwner: boolean = false,
): RoleRecommendation {
  const text = normalizeText(`${user.jobTitle || ""} ${user.bio || ""}`);
  const domains: string[] = [];

  const hasBackend =
    text.includes("backend") ||
    text.includes("back-end") ||
    text.includes("java") ||
    text.includes("spring") ||
    text.includes("microservice");
  const hasFrontend =
    text.includes("frontend") ||
    text.includes("front-end") ||
    text.includes("react") ||
    text.includes("next") ||
    text.includes("ui");
  const hasFullstack =
    text.includes("fullstack") ||
    text.includes("full-stack") ||
    text.includes("full stack");
  const hasAI =
    text.includes("ai") ||
    text.includes("llm") ||
    text.includes("rag") ||
    text.includes("agent") ||
    text.includes("vector");
  const hasDB =
    text.includes("database") ||
    text.includes("csdl") ||
    text.includes("kien truc du lieu") ||
    text.includes("postgres") ||
    text.includes("sql");
  const hasMobile =
    text.includes("mobile") ||
    text.includes("react native") ||
    text.includes("expo") ||
    text.includes("android") ||
    text.includes("ios");
  const hasDevOps =
    text.includes("devops") ||
    text.includes("docker") ||
    text.includes("cloud") ||
    text.includes("ci/cd") ||
    text.includes("ha tang");
  const hasQA =
    text.includes("qa") ||
    text.includes("qc") ||
    text.includes("test") ||
    text.includes("kiem thu");
  const hasBAOrCoord =
    text.includes("ba") ||
    text.includes("business analyst") ||
    text.includes("phan tich") ||
    text.includes("scrum master") ||
    text.includes("dieu phoi") ||
    text.includes("tro ly") ||
    text.includes("bien ban") ||
    text.includes("tai lieu");
  const hasLeadOrPM =
    text.includes("pm") ||
    text.includes("project manager") ||
    text.includes("quan ly") ||
    text.includes("tech lead") ||
    text.includes("lead") ||
    text.includes("architect") ||
    text.includes("kien truc");

  if (hasFrontend || hasFullstack) domains.push("Frontend");
  if (hasBackend || hasFullstack) domains.push("Backend");
  if (hasAI) domains.push("AI");
  if (hasDB) domains.push("Database");
  if (hasMobile) domains.push("Mobile");
  if (hasDevOps) domains.push("DevOps");
  if (hasQA) domains.push("QA/Testing");
  if (hasBAOrCoord || hasLeadOrPM || isCreatorOrOwner)
    domains.push("Project Management");

  if (domains.length === 0) {
    domains.push("Software Engineering");
  }

  // 1. Chuẩn hóa Job Title kỹ thuật rõ ràng, chuyên nghiệp
  let standardizedJobTitle = user.jobTitle?.trim() || "";
  if (!standardizedJobTitle || standardizedJobTitle.length < 3) {
    if (isCreatorOrOwner) {
      standardizedJobTitle = hasBackend
        ? "Project Manager / Tech Lead (Backend & DevOps)"
        : "Project Manager (PM)";
    } else if (hasBAOrCoord) {
      standardizedJobTitle = "Business Analyst & Project Coordinator";
    } else if (hasFullstack && hasAI) {
      standardizedJobTitle = "Fullstack & AI Specialist";
    } else if (hasFullstack) {
      standardizedJobTitle = "Fullstack Developer";
    } else if (hasBackend && hasDevOps) {
      standardizedJobTitle = "Backend & DevOps Engineer";
    } else if (hasBackend) {
      standardizedJobTitle = "Backend Developer";
    } else if (hasFrontend) {
      standardizedJobTitle = "Frontend Developer";
    } else if (hasQA) {
      standardizedJobTitle = "QA Tester / QC Engineer";
    } else {
      standardizedJobTitle = "Software Developer";
    }
  }

  // 2. Tư vấn vai trò phù hợp trong Space (Chỉ 1 PM duy nhất là người tạo Space)
  if (isCreatorOrOwner) {
    return {
      recommendedRole: "PM",
      recommendedRoleId: 2,
      roleBadgeLabel: "PM (Quản lý Space)",
      standardizedJobTitle,
      primaryDomains: domains,
      reason:
        "Người khởi tạo Space / Chủ sở hữu mặc định giữ vai trò PM duy nhất điều phối tổng thể và duyệt hoàn thành công việc.",
    };
  }

  // Ưu tiên gợi ý ASSISTANT cho BA / Scrum Master / Điều phối / Tech Lead hỗ trợ PM
  if (hasBAOrCoord || hasLeadOrPM) {
    return {
      recommendedRole: "ASSISTANT",
      recommendedRoleId: 4,
      roleBadgeLabel: "ASSISTANT (Trợ lý điều phối)",
      standardizedJobTitle,
      primaryDomains: domains,
      reason:
        "Có kỹ năng phân tích & điều phối (BA/Scrum/Lead), phù hợp làm ASSISTANT hỗ trợ PM nạp tài liệu AI phân rã nháp, sửa deadline và sắp xếp Kanban.",
    };
  }

  // Còn lại mặc định là MEMBER thực thi
  return {
    recommendedRole: "MEMBER",
    recommendedRoleId: 3,
    roleBadgeLabel: "MEMBER (Thực thi)",
    standardizedJobTitle,
    primaryDomains: domains,
    reason:
      "Thành viên thực thi mặc định: Tự nhận task trống, cập nhật tiến độ và bấm Hoàn thành để chuyển sang Chờ PM duyệt.",
  };
}

export function standardizeMemberProfile(
  user: User,
  role: SpaceRoleType,
  isCreatorOrOwner = false,
): {
  standardizedJobTitle: string;
  primaryDomains: string[];
  roleBadgeLabel: string;
} {
  const rec = recommendSpaceRoleForMember(user, isCreatorOrOwner);
  let badge = "MEMBER (Thực thi)";
  if (isCreatorOrOwner || role === "PM") {
    badge = "PM (Quản lý Space)";
  } else if (role === "ASSISTANT") {
    badge = "ASSISTANT (Trợ lý điều phối)";
  }

  return {
    standardizedJobTitle: rec.standardizedJobTitle,
    primaryDomains: rec.primaryDomains,
    roleBadgeLabel: badge,
  };
}

/**
 * Xuất ma trận 6 quyền hạn đơn giản, rõ ràng theo 3 vai trò PM | ASSISTANT | MEMBER
 */
export function getSpacePermissionsByRole(
  role: SpaceRoleType,
): SpaceMemberPermissions {
  const isPM = role === "PM";
  const isAssistant = role === "ASSISTANT";
  return {
    can_manage_space_and_members: isPM,
    can_approve_tasks_to_done: isPM,
    can_coordinate_and_ai_draft: isPM || isAssistant,
    can_create_and_self_assign: true,
    can_execute_own_tasks: true,
    can_view_risk_dashboard: true,
  };
}

/**
 * Kiểm tra xem người dùng hiện tại có quyền chỉnh sửa / kéo thả một Task cụ thể hay không:
 * - PM & ASSISTANT: Có quyền điều phối deadline, độ ưu tiên, gán việc và kéo thả (nhưng chỉ PM được chốt DONE).
 * - MEMBER: Chỉ được chỉnh sửa / đổi trạng thái (TODO <-> IN_PROGRESS) trên Task của chính mình.
 */
export function canUserEditTask(
  task: Task,
  currentUserId?: number,
  isPM: boolean = false,
  isAssistant: boolean = false,
): boolean {
  if (isPM || isAssistant) return true;
  if (!currentUserId) return false;
  const taskOwnerId = task.ownerId || task.assignee?.id;
  return taskOwnerId === currentUserId;
}

/**
 * Kiểm tra xem người dùng hiện tại có thể tự nhận (Self-assign) một Task chưa có người làm hay không
 */
export function canUserSelfAssignTask(
  task: Task,
  currentUserId?: number,
  isClosedSprint: boolean = false,
): boolean {
  if (isClosedSprint || !currentUserId) return false;
  const taskOwnerId = task.ownerId || task.assignee?.id;
  return !taskOwnerId;
}
