import { Task, User } from "@/types";
import {
  detectTaskCategory,
  getTaskComplexity,
  getMemberCapabilities,
  RoleCategory,
} from "./roleAssignment";
import { getTaskTransferredOrigin } from "@/hooks/useSprints";

export interface TaskChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface ParsedTaskDescription {
  baseDescription: string;
  checklist: TaskChecklistItem[];
  aiRationale?: string;
  assistantVerified: boolean;
  createdByUserId?: number;
}

const CHECKLIST_HEADER = "### 📋 Các bước thực hiện:";
const LEGACY_CHECKLIST_HEADER = "### 📋 Các bước thực hiện (Checklist):";
const RATIONALE_PREFIX = "> 💡 Cơ sở gợi ý:";
const LEGACY_RATIONALE_PREFIX = "> 💡 Căn cứ phân rã AI:";
const ASSISTANT_VERIFIED_TAG = "[✓ Assistant đã kiểm tra & đề xuất duyệt]";
const CREATED_BY_REGEX = /\[CreatedBy:(\d+)\]/;

/**
 * Tách phần Mô tả gốc, danh sách các bước thực hiện và nhãn xác nhận của Assistant
 */
export function parseTaskDescriptionWithChecklist(
  rawDescription?: string,
): ParsedTaskDescription {
  if (!rawDescription) {
    return { baseDescription: "", checklist: [], assistantVerified: false };
  }

  let working = rawDescription;
  let assistantVerified = false;
  let createdByUserId: number | undefined;

  const createdMatch = working.match(CREATED_BY_REGEX);
  if (createdMatch && createdMatch[1]) {
    createdByUserId = parseInt(createdMatch[1], 10);
    working = working.replace(CREATED_BY_REGEX, "").trim();
  }

  if (working.includes(ASSISTANT_VERIFIED_TAG)) {
    assistantVerified = true;
    working = working.replace(ASSISTANT_VERIFIED_TAG, "").trim();
  }

  let headerIndex = working.indexOf(CHECKLIST_HEADER);
  let headerLen = CHECKLIST_HEADER.length;
  if (headerIndex === -1) {
    headerIndex = working.indexOf(LEGACY_CHECKLIST_HEADER);
    headerLen = LEGACY_CHECKLIST_HEADER.length;
  }

  if (headerIndex === -1) {
    return {
      baseDescription: working.trim(),
      checklist: [],
      assistantVerified,
      createdByUserId,
    };
  }

  const baseDescription = working.substring(0, headerIndex).trim();
  const checklistSection = working.substring(headerIndex + headerLen).trim();

  const lines = checklistSection.split(/\r?\n/);
  const checklist: TaskChecklistItem[] = [];
  let aiRationale: string | undefined;

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith(RATIONALE_PREFIX)) {
      aiRationale = trimmed.replace(RATIONALE_PREFIX, "").trim();
      return;
    }
    if (trimmed.startsWith(LEGACY_RATIONALE_PREFIX)) {
      aiRationale = trimmed.replace(LEGACY_RATIONALE_PREFIX, "").trim();
      return;
    }
    const match = trimmed.match(/^-\s*\[(x|X|\s)\]\s*(.+)$/);
    if (match) {
      checklist.push({
        id: `step-${idx}-${Date.now()}`,
        completed: match[1].toLowerCase() === "x",
        text: match[2].trim(),
      });
    }
  });

  return {
    baseDescription,
    checklist,
    aiRationale,
    assistantVerified,
    createdByUserId,
  };
}

/**
 * Gộp Mô tả gốc, Checklist và trạng thái xác nhận của Assistant để lưu xuống Backend
 */
export function serializeTaskDescriptionWithChecklist(
  baseDescription: string,
  checklist: TaskChecklistItem[],
  aiRationale?: string,
  options?: { assistantVerified?: boolean; createdByUserId?: number },
): string {
  const parts: string[] = [];

  if (options?.createdByUserId) {
    parts.push(`[CreatedBy:${options.createdByUserId}]`);
  }
  if (options?.assistantVerified) {
    parts.push(ASSISTANT_VERIFIED_TAG);
  }
  if (baseDescription.trim()) {
    parts.push(baseDescription.trim());
  }

  if (checklist && checklist.length > 0) {
    const checklistLines = checklist.map(
      (item) => `- [${item.completed ? "x" : " "}] ${item.text.trim()}`,
    );
    const rationaleLine = aiRationale
      ? `${RATIONALE_PREFIX} ${aiRationale}\n`
      : "";
    parts.push(
      `${CHECKLIST_HEADER}\n${rationaleLine}${checklistLines.join("\n")}`,
    );
  }

  return parts.join("\n\n").trim();
}

/**
 * Kiểm tra xem thành viên hiện tại có quyền xóa một Task hay không:
 * - PM: Được xóa mọi Task ở trạng thái TODO (trong Sprint đang chạy) hoặc các Task ở Sprint tương lai/Backlog.
 * - MEMBER / ASSISTANT: Được xóa Task do chính họ tạo mới (hoặc Task của chính họ đang ở trạng thái Cần làm - TODO mà không phải Task gốc do AI phân rã từ đầu).
 */
export function canUserDeleteTaskItem(
  task: Task,
  currentUserId?: number,
  isPM: boolean = false,
  isClosedSprint: boolean = false,
  isActiveSprint: boolean = false,
  isGhostTransferred: boolean = false,
): boolean {
  if (isClosedSprint || isGhostTransferred) return false;
  if (isActiveSprint && task.status !== "TODO") return false;

  if (isPM) return true;
  if (!currentUserId) return false;

  // Chỉ cho phép Member / Assistant xóa khi task vẫn đang ở trạng thái "Cần làm" (TODO)
  if (task.status !== "TODO") return false;

  const parsed = parseTaskDescriptionWithChecklist(task.description);
  if (parsed.createdByUserId && parsed.createdByUserId === currentUserId) {
    return true;
  }

  const taskOwnerId = task.ownerId || task.assignee?.id;
  const isMyTask = taskOwnerId === currentUserId;
  const isMacroAiTask = Boolean(task.description?.includes("[AI Decomposed"));

  // Nếu là task của chính Member đó đang ở TODO và không phải task cốt lõi do PM dùng AI phân rã vĩ mô
  return isMyTask && !isMacroAiTask;
}

/**
 * Bước 1: AI Gợi ý các bước thực hiện công việc ngắn gọn, rõ ràng
 */
export function generateAiSubstepsForTask(
  task: Task,
  customTitle?: string,
  customBaseDesc?: string,
): {
  steps: TaskChecklistItem[];
  rationale: string;
  categoryLabel: string;
  estimatedDays: number;
} {
  const effectiveTask: Task = {
    ...task,
    title: customTitle || task.title,
    description:
      customBaseDesc !== undefined ? customBaseDesc : task.description,
  };

  const { category } = detectTaskCategory(effectiveTask);
  const { days } = getTaskComplexity(effectiveTask);
  const shortTitle = effectiveTask.title.trim();

  const categoryLabels: Record<RoleCategory, string> = {
    FRONTEND: "Frontend / Giao diện",
    BACKEND: "Backend / Dữ liệu",
    FULLSTACK: "Fullstack",
    QA: "Kiểm thử (QA/QC)",
    DEVOPS: "Hạ tầng / DevOps",
    MANAGEMENT: "Phân tích nghiệp vụ",
    GENERAL: "Thực thi dự án",
  };

  let stepTexts: string[] = [];

  switch (category) {
    case "FRONTEND":
      stepTexts = [
        `Rà soát bố cục và yêu cầu hiển thị của "${shortTitle}"`,
        `Xây dựng giao diện và các trạng thái tương tác người dùng`,
        `Kết nối dữ liệu API và kiểm tra hiển thị thực tế`,
      ];
      break;
    case "BACKEND":
      stepTexts = [
        `Xác định dữ liệu đầu vào/đầu ra và quy tắc xử lý cho "${shortTitle}"`,
        `Cập nhật cấu trúc dữ liệu và xây dựng dịch vụ xử lý chính`,
        `Kiểm tra kết quả phản hồi API và phân quyền truy cập`,
      ];
      break;
    case "QA":
      stepTexts = [
        `Lập danh sách kịch bản kiểm thử cho "${shortTitle}"`,
        `Thực hiện kiểm tra các luồng chính và trường hợp ngoại lệ`,
        `Ghi nhận kết quả kiểm thử trước khi bàn giao`,
      ];
      break;
    case "DEVOPS":
      stepTexts = [
        `Kiểm tra cấu hình môi trường cho "${shortTitle}"`,
        `Thiết lập kịch bản đóng gói / kết nối dịch vụ`,
        `Kiểm tra trạng thái vận hành ổn định (Health check)`,
      ];
      break;
    default:
      stepTexts = [
        `Xác định phạm vi và yêu cầu chi tiết của "${shortTitle}"`,
        `Thực hiện các hạng mục công việc chính (${days} ngày công)`,
        `Rà soát kết quả hoàn thành trước khi gửi duyệt`,
      ];
      break;
  }

  if (
    days >= 3 ||
    effectiveTask.priority === "URGENT" ||
    effectiveTask.priority === "HIGH"
  ) {
    stepTexts.push(
      `Kiểm tra chéo các trường hợp phát sinh (ưu tiên ${effectiveTask.priority})`,
    );
  }

  const rationale = `Nhóm [${categoryLabels[category]}] • Ước tính ${days} ngày công • Ưu tiên ${effectiveTask.priority}`;

  return {
    steps: stepTexts.map((text, idx) => ({
      id: `ai-step-${idx}-${Date.now()}`,
      text,
      completed: false,
    })),
    rationale,
    categoryLabel: categoryLabels[category],
    estimatedDays: days,
  };
}

/**
 * ============================================================================
 * BƯỚC 2: TỔNG HỢP & ĐÁNH GIÁ ĐIỀU KIỆN BÀN GIAO (HỖ TRỢ ASSISTANT & PM DUYỆT TASK)
 * Không đánh giá code thay con người, mà kiểm tra điều kiện bàn giao quản lý dự án:
 * 1. Thành viên đã hoàn tất các bước công việc (Checklist) chưa?
 * 2. Tiến độ nộp đúng hạn hay trễ hạn?
 * 3. Assistant đã kiểm tra xác nhận đề xuất duyệt chưa?
 * ============================================================================
 */
export interface TaskAcceptanceEvaluation {
  taskId: number;
  readyForApproval: boolean;
  assistantVerified: boolean;
  completedSteps: number;
  totalSteps: number;
  isOverdue: boolean;
  statusSummary: string;
  checklistLabel: string;
  timelineLabel: string;
}

export function evaluateTaskForAcceptance(
  task: Task,
): TaskAcceptanceEvaluation {
  const parsed = parseTaskDescriptionWithChecklist(task.description);
  const totalSteps = parsed.checklist.length;
  const completedSteps = parsed.checklist.filter((c) => c.completed).length;

  let isOverdue = false;
  if (task.dueDate) {
    const now = new Date();
    const due = new Date(task.dueDate);
    due.setHours(23, 59, 59, 999);
    if (now > due) isOverdue = true;
  }

  const stepsDone = totalSteps === 0 || completedSteps === totalSteps;
  const readyForApproval =
    stepsDone && (parsed.assistantVerified || !isOverdue);

  const checklistLabel =
    totalSteps > 0
      ? stepsDone
        ? `Bước làm: Đã xong đủ ${completedSteps}/${totalSteps} bước`
        : `Bước làm: Mới xong ${completedSteps}/${totalSteps} bước (Còn ${totalSteps - completedSteps} bước)`
      : "Bước làm: Không chia bước nhỏ";

  const dueStr = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
      })
    : "";

  const timelineLabel = isOverdue
    ? `Quá hạn${dueStr ? ` (${dueStr})` : ""}`
    : `Còn trong hạn${dueStr ? ` (${dueStr})` : ""}`;

  let statusSummary = "Chờ kiểm tra";
  if (parsed.assistantVerified && stepsDone) {
    statusSummary = "Assistant đã kiểm tra • Đủ điều kiện duyệt";
  } else if (!stepsDone) {
    statusSummary = `Chưa xong hết bước làm (${completedSteps}/${totalSteps})`;
  } else if (stepsDone && !isOverdue) {
    statusSummary = "Nộp trong hạn";
  } else {
    statusSummary = "Nộp quá hạn • Cần PM kiểm tra kỹ";
  }

  return {
    taskId: task.id,
    readyForApproval,
    assistantVerified: parsed.assistantVerified,
    completedSteps,
    totalSteps,
    isOverdue,
    statusSummary,
    checklistLabel,
    timelineLabel,
  };
}

/**
 * ============================================================================
 * AI GỢI Ý NHẬN VIỆC TRỐNG PHÙ HỢP KỸ NĂNG THÀNH VIÊN
 * ============================================================================
 */
export interface MemberTaskRecommendation {
  task: Task;
  matchScore: number;
  category: RoleCategory;
  estimatedDays: number;
  matchReason: string;
}

export function recommendUnassignedTasksForMember(
  tasks: Task[],
  member?: User | null,
): MemberTaskRecommendation[] {
  if (!member) return [];
  const unassigned = tasks.filter(
    (t) => !t.isDeleted && t.status !== "DONE" && !t.ownerId && !t.assignee?.id,
  );
  if (unassigned.length === 0) return [];

  const caps = getMemberCapabilities(member);

  const results: MemberTaskRecommendation[] = unassigned.map((task) => {
    const { category } = detectTaskCategory(task);
    const { days } = getTaskComplexity(task);

    let score = 60;
    let skillMatchDesc = "Phù hợp kỹ năng chung";

    if (category === "FRONTEND" && caps.isFrontend) {
      score += 30;
      skillMatchDesc = "Khớp chuyên môn Frontend";
    } else if (category === "BACKEND" && caps.isBackend) {
      score += 30;
      skillMatchDesc = "Khớp chuyên môn Backend/DB";
    } else if (category === "QA" && caps.isQA) {
      score += 30;
      skillMatchDesc = "Khớp chuyên môn Kiểm thử QA";
    } else if (category === "DEVOPS" && caps.isDevOps) {
      score += 30;
      skillMatchDesc = "Khớp chuyên môn DevOps";
    } else if (category === "MANAGEMENT" && caps.isManagement) {
      score += 28;
      skillMatchDesc = "Khớp chuyên môn Phân tích/Điều phối";
    } else if (caps.isFullstack) {
      score += 24;
      skillMatchDesc = "Phù hợp năng lực Fullstack";
    }

    if (task.priority === "URGENT") score += 8;
    else if (task.priority === "HIGH") score += 5;

    return {
      task,
      matchScore: Math.min(98, score),
      category,
      estimatedDays: days,
      matchReason: `${skillMatchDesc} • Ước tính ${days} ngày`,
    };
  });

  return results.sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * ============================================================================
 * BƯỚC 3: AI ĐÁNH GIÁ RỦI RO, TIẾN ĐỘ DỰ ÁN & TỪNG THÀNH VIÊN + ĐỀ XUẤT GIẢI PHÁP
 * ============================================================================
 */
export interface MemberRiskProfile {
  member: User;
  totalAssigned: number;
  doneCount: number;
  inReviewCount: number;
  todoCount: number;
  inProgressCount: number;
  openCount: number; // TODO + IN_PROGRESS
  overdueCount: number;
  remainingDaysLoad: number;
  completionRate: number;
  loadStatus: "OVERLOADED" | "BALANCED" | "AVAILABLE";
  loadLabel: string;
  openTasksList: Task[];
}

export interface ProjectRiskItem {
  id: string;
  task: Task;
  riskType: "OVERDUE" | "AT_RISK_TODO" | "PENDING_REVIEW";
  riskBadge: string;
  riskBadgeClass: string;
  riskReason: string;
  assigneeName: string;
  assigneeRole: string;
}

export interface AiActionSuggestion {
  id: string;
  type: "REASSIGN" | "EXTEND_DUE" | "PRIORITIZE_TASK" | "ASSIGN_UNASSIGNED";
  title: string;
  problem: string; // Vấn đề phát hiện
  solution: string; // Giải pháp đề xuất
  actionLabel: string; // Nhãn nút bấm rõ ràng
  task: Task;
  targetMember?: User;
  newDueDate?: string;
  newStatus?: Task["status"];
  newPriority?: Task["priority"];
}

export interface SpaceRiskAndProgressAnalysis {
  totalTasks: number;
  doneTasks: number;
  inProgressTasks: number;
  inReviewTasks: number;
  todoTasks: number;
  overdueTasks: number;
  unassignedTasks: number;
  completionPercent: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  riskLabel: string;
  riskSummary: string;
  riskItems: ProjectRiskItem[];
  memberProfiles: MemberRiskProfile[];
  suggestions: AiActionSuggestion[];
}

export function analyzeProjectAndMemberRisks(
  tasks: Task[],
  members: User[],
): SpaceRiskAndProgressAnalysis {
  const activeTasks = tasks.filter((t) => !t.isDeleted);
  const totalTasks = activeTasks.length;
  const doneTasks = activeTasks.filter((t) => t.status === "DONE").length;
  const inReviewTasks = activeTasks.filter(
    (t) => t.status === "IN_REVIEW",
  ).length;
  const inProgressTasks = activeTasks.filter(
    (t) => t.status === "IN_PROGRESS",
  ).length;
  const todoTasks = activeTasks.filter((t) => t.status === "TODO").length;

  const now = new Date();
  const overdueList = activeTasks.filter((t) => {
    if (t.status === "DONE" || !t.dueDate) return false;
    const due = new Date(t.dueDate);
    due.setHours(23, 59, 59, 999);
    return now > due;
  });

  const unassignedList = activeTasks.filter(
    (t) => t.status !== "DONE" && !t.ownerId && !t.assignee?.id,
  );

  const completionPercent =
    totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  // 1. Đánh giá từng thành viên
  const memberProfiles: MemberRiskProfile[] = members.map((m) => {
    const mTasks = activeTasks.filter(
      (t) => t.ownerId === m.id || t.assignee?.id === m.id,
    );
    const doneCount = mTasks.filter((t) => t.status === "DONE").length;
    const inReviewCount = mTasks.filter((t) => t.status === "IN_REVIEW").length;
    const todoTasksOfMember = mTasks.filter((t) => t.status === "TODO");
    const inProgressTasksOfMember = mTasks.filter(
      (t) => t.status === "IN_PROGRESS",
    );
    const openTasks = [...inProgressTasksOfMember, ...todoTasksOfMember];
    const openCount = openTasks.length;

    const overdueCount = openTasks.filter((t) => {
      if (!t.dueDate) return false;
      const due = new Date(t.dueDate);
      due.setHours(23, 59, 59, 999);
      return now > due;
    }).length;

    const remainingDaysLoad = openTasks.reduce(
      (sum, t) => sum + getTaskComplexity(t).days,
      0,
    );

    const completionRate =
      mTasks.length > 0 ? Math.round((doneCount / mTasks.length) * 100) : 0;

    let loadStatus: "OVERLOADED" | "BALANCED" | "AVAILABLE" = "BALANCED";
    let loadLabel = "Cân bằng";

    if (openCount >= 4 || remainingDaysLoad >= 9 || overdueCount >= 1) {
      loadStatus = "OVERLOADED";
      loadLabel =
        overdueCount > 0
          ? `Cần hỗ trợ (${overdueCount} trễ hạn)`
          : "Quá tải công việc";
    } else if (openCount <= 1 && remainingDaysLoad <= 3) {
      loadStatus = "AVAILABLE";
      loadLabel = "Có thể nhận thêm";
    }

    return {
      member: m,
      totalAssigned: mTasks.length,
      doneCount,
      inReviewCount,
      todoCount: todoTasksOfMember.length,
      inProgressCount: inProgressTasksOfMember.length,
      openCount,
      overdueCount,
      remainingDaysLoad,
      completionRate,
      loadStatus,
      loadLabel,
      openTasksList: openTasks,
    };
  });

  // 2. Danh sách rủi ro cụ thể của dự án (Rủi ro ở đâu & Tại sao rủi ro?)
  const riskItems: ProjectRiskItem[] = [];

  // A. Công việc trễ hạn hoặc tồn đọng từ Sprint trước
  overdueList.forEach((t) => {
    const transferred = getTaskTransferredOrigin(t);
    const assignee = members.find(
      (m) => m.id === t.ownerId || m.id === t.assignee?.id,
    );
    const dueFormatted = t.dueDate
      ? new Date(t.dueDate).toLocaleDateString("vi-VN")
      : "";

    let reason = "";
    if (transferred.isTransferred) {
      reason = `Tồn đọng từ ${transferred.originSprintName || "Sprint cũ"} (hạn chót ban đầu: ${dueFormatted}), hiện vẫn chưa xong.`;
    } else {
      const daysOver = Math.max(
        1,
        Math.ceil(
          (now.getTime() - new Date(t.dueDate!).getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      );
      reason = `Đã quá hạn ${daysOver} ngày (Hạn: ${dueFormatted}), trạng thái hiện tại: [${
        t.status === "TODO" ? "Cần làm (Chưa bắt đầu)" : "Đang làm"
      }].`;
    }

    riskItems.push({
      id: `risk-overdue-${t.id}`,
      task: t,
      riskType: "OVERDUE",
      riskBadge: transferred.isTransferred ? "Tồn đọng cũ" : "Trễ hạn",
      riskBadgeClass: "bg-red-50 text-red-700 border-red-200",
      riskReason: reason,
      assigneeName: assignee
        ? assignee.fullName || assignee.displayName || assignee.username
        : "Chưa có",
      assigneeRole: assignee?.jobTitle || "Thành viên",
    });
  });

  // B. Công việc sắp trễ hạn trong vòng 2 ngày nhưng vẫn ở trạng thái TODO (chưa bắt đầu)
  const twoDaysLater = new Date();
  twoDaysLater.setDate(twoDaysLater.getDate() + 2);
  twoDaysLater.setHours(23, 59, 59, 999);

  activeTasks
    .filter((t) => {
      if (t.status !== "TODO" || !t.dueDate) return false;
      const due = new Date(t.dueDate);
      return due >= now && due <= twoDaysLater;
    })
    .forEach((t) => {
      const assignee = members.find(
        (m) => m.id === t.ownerId || m.id === t.assignee?.id,
      );
      const dueFormatted = new Date(t.dueDate!).toLocaleDateString("vi-VN");
      riskItems.push({
        id: `risk-near-due-${t.id}`,
        task: t,
        riskType: "AT_RISK_TODO",
        riskBadge: "Sắp đến hạn",
        riskBadgeClass: "bg-amber-50 text-amber-800 border-amber-200",
        riskReason: `Hạn chót sắp tới (${dueFormatted}) nhưng vẫn ở trạng thái Cần làm (chưa bắt đầu thực hiện).`,
        assigneeName: assignee
          ? assignee.fullName || assignee.displayName || assignee.username
          : "Chưa có",
        assigneeRole: assignee?.jobTitle || "Thành viên",
      });
    });

  // C. Công việc chờ duyệt (IN_REVIEW) cần PM/Assistant nghiệm thu
  activeTasks
    .filter((t) => t.status === "IN_REVIEW")
    .forEach((t) => {
      const assignee = members.find(
        (m) => m.id === t.ownerId || m.id === t.assignee?.id,
      );
      riskItems.push({
        id: `risk-in-review-${t.id}`,
        task: t,
        riskType: "PENDING_REVIEW",
        riskBadge: "Chờ duyệt",
        riskBadgeClass: "bg-purple-50 text-purple-800 border-purple-200",
        riskReason: `Thành viên đã hoàn tất và nộp duyệt, đang chờ kiểm tra nghiệm thu.`,
        assigneeName: assignee
          ? assignee.fullName || assignee.displayName || assignee.username
          : "Thành viên",
        assigneeRole: assignee?.jobTitle || "Thành viên",
      });
    });

  // 3. Xác định mức độ rủi ro chung của Space
  const overloadedMembers = memberProfiles.filter(
    (mp) => mp.loadStatus === "OVERLOADED",
  );
  const availableMembers = memberProfiles.filter(
    (mp) => mp.loadStatus === "AVAILABLE",
  );

  let riskLevel: "LOW" | "MEDIUM" | "HIGH" = "LOW";
  let riskLabel = "An toàn • Đúng tiến độ";
  let riskSummary = `Hoàn thành ${completionPercent}% (${doneTasks}/${totalTasks} việc). Khối lượng công việc giữa các thành viên đang ổn định.`;

  if (overdueList.length >= 2 || overloadedMembers.length >= 2) {
    riskLevel = "HIGH";
    riskLabel = "Rủi ro cao • Nguy cơ trễ tiến độ";
    riskSummary = `Có ${overdueList.length} công việc trễ hạn và ${overloadedMembers.length} thành viên đang quá tải. Cần điều phối lại ngay.`;
  } else if (
    overdueList.length === 1 ||
    overloadedMembers.length === 1 ||
    unassignedList.length >= 2
  ) {
    riskLevel = "MEDIUM";
    riskLabel = "Rủi ro trung bình • Cần điều phối";
    riskSummary = `Có ${overdueList.length} việc trễ hạn, ${unassignedList.length} việc chưa giao và ${inReviewTasks} việc đang chờ duyệt.`;
  }

  // 4. Sinh các giải pháp điều phối cụ thể (Actionable Suggestions)
  const suggestions: AiActionSuggestion[] = [];

  // Giải pháp 1: San sẻ việc từ người Quá tải sang người Đang rảnh có chuyên môn phù hợp
  for (const over of overloadedMembers) {
    const candidateTodoTasks = activeTasks.filter(
      (t) =>
        (t.ownerId === over.member.id || t.assignee?.id === over.member.id) &&
        t.status === "TODO",
    );

    if (candidateTodoTasks.length > 0 && availableMembers.length > 0) {
      const taskToMove = candidateTodoTasks[0];
      const { category } = detectTaskCategory(taskToMove);

      // Ưu tiên người rảnh có chuyên môn khớp với task
      const matchedReceiver =
        availableMembers.find((rec) => {
          const caps = getMemberCapabilities(rec.member);
          if (category === "FRONTEND" && caps.isFrontend) return true;
          if (category === "BACKEND" && caps.isBackend) return true;
          if (category === "QA" && caps.isQA) return true;
          if (category === "DEVOPS" && caps.isDevOps) return true;
          if (category === "MANAGEMENT" && caps.isManagement) return true;
          return false;
        }) || availableMembers[0];

      const overName = over.member.fullName || over.member.username;
      const recName =
        matchedReceiver.member.fullName || matchedReceiver.member.username;

      suggestions.push({
        id: `reassign-${taskToMove.id}`,
        type: "REASSIGN",
        title: `San sẻ việc chưa làm "${taskToMove.title}" sang ${recName}`,
        problem: `${overName} đang giữ ${over.openCount} việc chưa xong (${over.overdueCount > 0 ? `có ${over.overdueCount} việc trễ hạn` : "quá tải"}).`,
        solution: `Chuyển Task này (hiện vẫn ở Cần làm) sang cho ${recName} (hiện chỉ giữ ${matchedReceiver.openCount} việc, đúng chuyên môn).`,
        actionLabel: `Áp dụng: Chuyển Task cho ${recName}`,
        task: taskToMove,
        targetMember: matchedReceiver.member,
      });
    }
  }

  // Giải pháp 2: Đôn đốc công việc trễ hạn
  for (const odTask of overdueList.slice(0, 2)) {
    const transferred = getTaskTransferredOrigin(odTask);
    const assignee = members.find(
      (m) => m.id === odTask.ownerId || m.id === odTask.assignee?.id,
    );
    const aName = assignee
      ? assignee.fullName || assignee.username
      : "Thành viên";

    if (odTask.status === "TODO") {
      suggestions.push({
        id: `prioritize-start-${odTask.id}`,
        type: "PRIORITIZE_TASK",
        title: `Ưu tiên bắt đầu ngay: "${odTask.title}"`,
        problem: `Công việc đã quá hạn nhưng vẫn đang ở trạng thái Cần làm (chưa bắt đầu).`,
        solution: `Chuyển ngay sang trạng thái "Đang làm" và nâng độ ưu tiên lên "Khẩn cấp" để ${aName} tập trung xử lý.`,
        actionLabel: `Áp dụng: Bắt đầu làm & Đặt Khẩn cấp`,
        task: odTask,
        newStatus: "IN_PROGRESS",
        newPriority: "URGENT",
      });
    } else if (!transferred.isTransferred) {
      // Chỉ cho phép gia hạn nếu đây là task bình thường, không phải task tồn đọng bị khóa ngày hạn
      const baseDate = new Date();
      baseDate.setDate(baseDate.getDate() + 3);
      const newDueStr = baseDate.toISOString().split("T")[0];
      suggestions.push({
        id: `extend-${odTask.id}`,
        type: "EXTEND_DUE",
        title: `Gia hạn thêm 3 ngày cho "${odTask.title}"`,
        problem: `Công việc đang làm dở nhưng đã quá hạn (${
          odTask.dueDate
            ? new Date(odTask.dueDate).toLocaleDateString("vi-VN")
            : ""
        }).`,
        solution: `Điều chỉnh ngày kết thúc thêm 3 ngày để ${aName} kịp hoàn thành.`,
        actionLabel: `Áp dụng: Gia hạn đến ${new Date(newDueStr).toLocaleDateString("vi-VN")}`,
        task: odTask,
        newDueDate: newDueStr,
      });
    }
  }

  // Giải pháp 3: Giao các việc chưa có người nhận (khớp đúng người theo chuyên môn và tải thấp nhất)
  for (const unTask of unassignedList.slice(0, 2)) {
    const { category } = detectTaskCategory(unTask);

    // Tìm thành viên có năng lực phù hợp và ít việc nhất
    const sortedPool = [...memberProfiles].sort((a, b) => {
      const capsA = getMemberCapabilities(a.member);
      const capsB = getMemberCapabilities(b.member);
      let matchA = 0;
      let matchB = 0;
      if (category === "FRONTEND") {
        if (capsA.isFrontend) matchA += 5;
        if (capsB.isFrontend) matchB += 5;
      }
      if (category === "BACKEND") {
        if (capsA.isBackend) matchA += 5;
        if (capsB.isBackend) matchB += 5;
      }
      if (category === "QA") {
        if (capsA.isQA) matchA += 5;
        if (capsB.isQA) matchB += 5;
      }
      if (category === "DEVOPS") {
        if (capsA.isDevOps) matchA += 5;
        if (capsB.isDevOps) matchB += 5;
      }
      if (category === "MANAGEMENT") {
        if (capsA.isManagement) matchA += 5;
        if (capsB.isManagement) matchB += 5;
      }
      const scoreA = matchA - a.openCount * 2;
      const scoreB = matchB - b.openCount * 2;
      return scoreB - scoreA;
    });

    const receiver = sortedPool[0];
    if (receiver) {
      const recName = receiver.member.fullName || receiver.member.username;
      suggestions.push({
        id: `assign-unassigned-${unTask.id}`,
        type: "ASSIGN_UNASSIGNED",
        title: `Giao việc trống "${unTask.title}" cho ${recName}`,
        problem: `Công việc chưa có người phụ trách trong khi Sprint đang diễn ra.`,
        solution: `Giao cho ${recName} (khớp chuyên môn ${category}, hiện chỉ giữ ${receiver.openCount} việc chưa xong).`,
        actionLabel: `Áp dụng: Giao cho ${recName}`,
        task: unTask,
        targetMember: receiver.member,
      });
    }
  }

  return {
    totalTasks,
    doneTasks,
    inProgressTasks,
    inReviewTasks,
    todoTasks,
    overdueTasks: overdueList.length,
    unassignedTasks: unassignedList.length,
    completionPercent,
    riskLevel,
    riskLabel,
    riskSummary,
    riskItems,
    memberProfiles,
    suggestions,
  };
}
