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
  const text = normalizeText(`${user.jobTitle || ""} ${user.bio || ""} ${user.fullName || ""}`);

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
        return { category: "FRONTEND", reason: "Khớp chỉ định AI: Frontend Developer" };
      }
      if (explicitRole.includes("backend") || explicitRole.includes("database") || explicitRole.includes("csdl")) {
        return { category: "BACKEND", reason: "Khớp chỉ định AI: Backend Developer" };
      }
      if (explicitRole.includes("qa") || explicitRole.includes("test") || explicitRole.includes("kiem thu")) {
        return { category: "QA", reason: "Khớp chỉ định AI: QA Lead / Tester" };
      }
      if (explicitRole.includes("devops") || explicitRole.includes("architect") || explicitRole.includes("system")) {
        return { category: "DEVOPS", reason: "Khớp chỉ định AI: DevOps / System Architect" };
      }
      if (explicitRole.includes("ba") || explicitRole.includes("analyst") || explicitRole.includes("pm")) {
        return { category: "MANAGEMENT", reason: "Khớp chỉ định AI: Business Analyst / PM" };
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
    "giao dien", "frontend", "ui", "ux", "react", "next.js", "nextjs", "css",
    "tailwind", "component", "drawer", "modal", "page", "accordion", "preview",
    "chatbot", "kanban", "drag & drop", "dnd", "man hinh", "hien thi", "layout"
  ];
  const beKeywords = [
    "backend", "api", "rest", "service", "database", "csdl", "schema",
    "postgresql", "mongodb", "controller", "microservice", "kafka", "redis",
    "middleware", "token", "jwt", "auth", "interceptor", "stream", "xu ly du lieu",
    "aggregation", "entity", "repository"
  ];
  const qaKeywords = [
    "kiem thu", "test", "qa", "qc", "e2e", "unit test", "integration test",
    "benchmark", "load test", "loi", "bug", "lot loi", "chat luong", "kiem tra"
  ];
  const devopsKeywords = [
    "docker", "container", "ci/cd", "pipeline", "deploy", "trien khai",
    "vps", "cloud", "server", "k8s", "kubernetes", "ha tang", "dong goi"
  ];
  const mgmtKeywords = [
    "yeu cau", "requirement", "ba", "ke hoach", "bao cao", "tai lieu",
    "dac ta", "sprint", "wbs", "do an", "nghiem thu"
  ];

  const scoreFe = feKeywords.filter((k) => fullContent.includes(k)).length;
  const scoreBe = beKeywords.filter((k) => fullContent.includes(k)).length;
  const scoreQa = qaKeywords.filter((k) => fullContent.includes(k)).length;
  const scoreDevOps = devopsKeywords.filter((k) => fullContent.includes(k)).length;
  const scoreMgmt = mgmtKeywords.filter((k) => fullContent.includes(k)).length;

  const maxScore = Math.max(scoreFe, scoreBe, scoreQa, scoreDevOps, scoreMgmt);

  if (maxScore > 0) {
    if (maxScore === scoreQa) {
      return { category: "QA", reason: "Khớp từ khóa chuyên môn: Kiểm thử & Đảm bảo chất lượng (QA)" };
    }
    if (maxScore === scoreDevOps) {
      return { category: "DEVOPS", reason: "Khớp từ khóa chuyên môn: Đóng gói & Triển khai hạ tầng (DevOps)" };
    }
    if (maxScore === scoreFe) {
      return { category: "FRONTEND", reason: "Khớp từ khóa chuyên môn: Giao diện & Trải nghiệm người dùng (Frontend)" };
    }
    if (maxScore === scoreBe) {
      return { category: "BACKEND", reason: "Khớp từ khóa chuyên môn: Xử lý dữ liệu & Kiến trúc dịch vụ (Backend)" };
    }
    if (maxScore === scoreMgmt) {
      return { category: "MANAGEMENT", reason: "Khớp từ khóa chuyên môn: Phân tích nghiệp vụ & Quản lý (BA/PM)" };
    }
  }

  return { category: "GENERAL", reason: "Phân bổ cân bằng theo nhóm năng lực" };
}

/**
 * Thuật toán phân công tự động toàn diện theo vai trò và cân bằng tải
 */
export function autoAssignTasks(
  tasks: Task[],
  members: User[],
  options: {
    unassignedOnly?: boolean;
    sprintId?: number | null;
  } = {}
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

  if (targetTasks.length === 0) {
    return {
      assignments: [],
      preview: [],
      memberStats: members.map((m) => ({ member: m, count: 0, assignedTasks: [] })),
      totalAssigned: 0,
    };
  }

  // 2. Khởi tạo bộ đếm công việc (Workload Counter) để cân bằng tải
  const memberWorkload: Record<number, number> = {};
  members.forEach((m) => {
    // Đếm số task thành viên đã có sẵn (nếu chỉ gán unassigned)
    if (options.unassignedOnly) {
      const existingCount = tasks.filter(
        (t) => !t.isDeleted && (t.ownerId === m.id || t.assignee?.id === m.id)
      ).length;
      memberWorkload[m.id] = existingCount;
    } else {
      memberWorkload[m.id] = 0;
    }
  });

  const memberCaps = members.map((m) => ({
    member: m,
    caps: getMemberCapabilities(m),
  }));

  const previewResults: TaskAssignmentResult[] = [];
  const assignments: { taskId: number; ownerId: number }[] = [];

  // 3. Phân công từng task
  for (const task of targetTasks) {
    const { category, reason, suggestedName } = detectTaskCategory(task);

    // Ưu tiên 0: Trùng tên gợi ý trong mô tả AI
    let selectedMember: User | null = null;
    let finalReason = reason;

    if (suggestedName) {
      const normSuggested = normalizeText(suggestedName);
      const matchUser = members.find(
        (m) =>
          normalizeText(m.fullName).includes(normSuggested) ||
          normSuggested.includes(normalizeText(m.fullName)) ||
          normalizeText(m.displayName || "").includes(normSuggested)
      );
      if (matchUser) {
        selectedMember = matchUser;
        finalReason = `Gợi ý theo phân công AI: ${matchUser.fullName || matchUser.displayName}`;
      }
    }

    // Nếu chưa chọn được theo tên, chọn theo nhóm vai trò phù hợp
    if (!selectedMember) {
      let candidateMembers: User[] = [];

      switch (category) {
        case "QA": {
          // 1. Chuyên gia QA
          candidateMembers = memberCaps.filter((mc) => mc.caps.isQA).map((mc) => mc.member);
          // Fallback nếu không có QA: Fullstack hoặc Backend
          if (candidateMembers.length === 0) {
            candidateMembers = memberCaps
              .filter((mc) => mc.caps.isFullstack || mc.caps.isBackend)
              .map((mc) => mc.member);
            finalReason += " (Không có QA chuyên trách -> Phân bổ cho Dev)";
          }
          break;
        }

        case "DEVOPS": {
          candidateMembers = memberCaps.filter((mc) => mc.caps.isDevOps).map((mc) => mc.member);
          if (candidateMembers.length === 0) {
            candidateMembers = memberCaps
              .filter((mc) => mc.caps.isBackend || mc.caps.isFullstack)
              .map((mc) => mc.member);
            finalReason += " (Không có DevOps chuyên trách -> Phân bổ cho Backend/Fullstack)";
          }
          break;
        }

        case "FRONTEND": {
          // Ưu tiên: Dedicated Frontend trước -> Sau đó đến Fullstack
          const dedicatedFe = memberCaps
            .filter((mc) => mc.caps.isDedicatedFrontend)
            .map((mc) => mc.member);

          if (dedicatedFe.length > 0) {
            candidateMembers = dedicatedFe;
          } else {
            // Nếu không có Dedicated FE, lấy Fullstack
            candidateMembers = memberCaps
              .filter((mc) => mc.caps.isFrontend)
              .map((mc) => mc.member);
            if (candidateMembers.length > 0) {
              finalReason = "Phân bổ chuyên môn Fullstack Developer (Đảm nhận Frontend)";
            }
          }
          break;
        }

        case "BACKEND": {
          // Ưu tiên: Dedicated Backend trước -> Sau đó đến Fullstack
          const dedicatedBe = memberCaps
            .filter((mc) => mc.caps.isDedicatedBackend)
            .map((mc) => mc.member);

          if (dedicatedBe.length > 0) {
            candidateMembers = dedicatedBe;
          } else {
            // Nếu không có Dedicated BE, lấy Fullstack
            candidateMembers = memberCaps
              .filter((mc) => mc.caps.isBackend)
              .map((mc) => mc.member);
            if (candidateMembers.length > 0) {
              finalReason = "Phân bổ chuyên môn Fullstack Developer (Đảm nhận Backend)";
            }
          }
          break;
        }

        case "MANAGEMENT": {
          candidateMembers = memberCaps
            .filter((mc) => mc.caps.isManagement)
            .map((mc) => mc.member);
          break;
        }

        default:
          break;
      }

      // Nếu vẫn chưa có ứng viên, lấy toàn bộ thành viên khả dụng
      if (candidateMembers.length === 0) {
        candidateMembers = members;
        finalReason = "Phân bổ cân bằng tải toàn Space";
      }

      // Thuật toán Cân bằng tải: Chọn thành viên trong nhóm ứng viên có số lượng task hiện tại ÍT NHẤT
      candidateMembers.sort((a, b) => (memberWorkload[a.id] || 0) - (memberWorkload[b.id] || 0));
      selectedMember = candidateMembers[0];
    }

    // Cập nhật bộ đếm tải và danh sách gán
    memberWorkload[selectedMember.id] = (memberWorkload[selectedMember.id] || 0) + 1;

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
    const memberTasks = previewResults.filter((p) => p.assignedMember.id === m.id);
    return {
      member: m,
      count: memberTasks.length,
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
