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
    const match = task.description.match(/(?:ước tính|thời gian|estimate|dự kiến)?:\s*(\d+)\s*(?:ngày|days?)/i);
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
    const diff = Math.ceil((new Date(task.dueDate).getTime() - new Date(task.startDate).getTime()) / (1000 * 60 * 60 * 24));
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

  // 2. Khởi tạo bộ đếm số task và tổng ngày công việc (Workload Counter)
  const memberWorkload: Record<number, number> = {};
  const memberDaysLoad: Record<number, number> = {};
  members.forEach((m) => {
    if (options.unassignedOnly) {
      const existingCount = tasks.filter(
        (t) => !t.isDeleted && (t.ownerId === m.id || t.assignee?.id === m.id)
      ).length;
      memberWorkload[m.id] = existingCount;
    } else {
      memberWorkload[m.id] = 0;
    }
    memberDaysLoad[m.id] = 0;
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

  // Số lượng task trung bình mỗi người nên nhận để đảm bảo công bằng
  const avgTasksPerMember = Math.ceil(sortedTasks.length / members.length);
  // Ngưỡng tối đa cho 1 Dev nhận để không bị dồn 100% việc (Ví dụ: 3 người 18 việc thì 1 người nhận tối đa ~7-8 việc)
  const maxTasksPerMember = Math.max(avgTasksPerMember + 1, Math.ceil(sortedTasks.length * 0.45));

  const previewResults: TaskAssignmentResult[] = [];
  const assignments: { taskId: number; ownerId: number }[] = [];

  // 3. Phân công từng task với cơ chế Cân Bằng Tải Thực Sự
  for (const task of sortedTasks) {
    const { category, reason, suggestedName } = detectTaskCategory(task);
    const comp = getTaskComplexity(task);

    let selectedMember: User | null = null;
    let finalReason = reason;

    // Ưu tiên 0: Trùng tên gợi ý trong mô tả AI
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
        finalReason = `Gợi ý theo phân công AI`;
      }
    }

    // Nếu chưa chọn theo tên, tính toán độ phù hợp theo chuyên môn + cân bằng tải
    if (!selectedMember) {
      let candidatePool: User[] = [];

      switch (category) {
        case "QA": {
          candidatePool = memberCaps.filter((mc) => mc.caps.isQA).map((mc) => mc.member);
          break;
        }
        case "DEVOPS": {
          candidatePool = memberCaps.filter((mc) => mc.caps.isDevOps).map((mc) => mc.member);
          break;
        }
        case "FRONTEND": {
          candidatePool = memberCaps.filter((mc) => mc.caps.isFrontend).map((mc) => mc.member);
          break;
        }
        case "BACKEND": {
          candidatePool = memberCaps.filter((mc) => mc.caps.isBackend).map((mc) => mc.member);
          break;
        }
        case "MANAGEMENT": {
          candidatePool = memberCaps.filter((mc) => mc.caps.isManagement).map((mc) => mc.member);
          break;
        }
        default:
          break;
      }

      // Kiểm tra: Nếu tất cả ứng viên trong nhóm chuyên môn đã vượt quá ngưỡng tải `maxTasksPerMember`,
      // HOẶC nếu trong Space có thành viên đang có 0 task trong khi người khác đã nhận nhiều:
      // => MỞ RỘNG POOL ỨNG VIÊN RA TOÀN BỘ THÀNH VIÊN SPACE để san sẻ công việc!
      const membersWithZeroTasks = members.filter((m) => (memberWorkload[m.id] || 0) === 0);
      const allCandidatesOverloaded =
        candidatePool.length > 0 &&
        candidatePool.every((m) => (memberWorkload[m.id] || 0) >= maxTasksPerMember);

      if (candidatePool.length === 0 || allCandidatesOverloaded) {
        // San sẻ cho các thành viên chưa có việc hoặc ít việc nhất trong Space
        candidatePool = members;
        finalReason = "Phân bổ cân bằng tải toàn Space";
      } else if (membersWithZeroTasks.length > 0 && comp.level !== "HIGH") {
        // Với các task độ phức tạp Vừa / Thấp: Ưu tiên san sẻ cho thành viên chưa có việc (PM, Scrum, v.v.)
        candidatePool = [...candidatePool, ...membersWithZeroTasks];
      }

      // Chấm điểm từng thành viên trong candidatePool:
      // + Người có ít task hơn được ưu tiên cao nhất
      // + Thành viên có 0 task được ưu tiên tuyệt đối để không ai bị bỏ rơi
      // + Người có đúng chuyên môn được ưu tiên thêm điểm
      const scoredCandidates = candidatePool.map((m) => {
        const currentCount = memberWorkload[m.id] || 0;
        const currentDays = memberDaysLoad[m.id] || 0;
        const caps = getMemberCapabilities(m);

        let roleScore = 0;
        if (category === "FRONTEND" && caps.isFrontend) roleScore += 4;
        if (category === "BACKEND" && caps.isBackend) roleScore += 4;
        if (category === "QA" && caps.isQA) roleScore += 4;
        if (category === "DEVOPS" && caps.isDevOps) roleScore += 4;
        if (category === "MANAGEMENT" && caps.isManagement) roleScore += 4;

        // Phạt nặng nếu đã vượt ngưỡng tải trung bình để san sẻ cho người khác
        const loadPenalty = currentCount * 5 + currentDays * 2;
        // Thưởng lớn cho người chưa có task nào
        const zeroBonus = currentCount === 0 ? 30 : 0;

        return {
          member: m,
          score: zeroBonus + roleScore - loadPenalty,
        };
      });

      scoredCandidates.sort((a, b) => b.score - a.score);
      selectedMember = scoredCandidates[0].member;
    }

    // Cập nhật bộ đếm tải và danh sách gán
    memberWorkload[selectedMember.id] = (memberWorkload[selectedMember.id] || 0) + 1;
    memberDaysLoad[selectedMember.id] = (memberDaysLoad[selectedMember.id] || 0) + comp.days;

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
