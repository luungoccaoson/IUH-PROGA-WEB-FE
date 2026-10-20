import { Task, Sprint } from "@/types";
import { getTaskComplexity } from "./roleAssignment";

export interface ScheduledTaskDate {
  taskId: number;
  startDate: string; // ISO string YYYY-MM-DD
  dueDate: string;   // ISO string YYYY-MM-DD
  days: number;
}

/**
 * Format Date thành chuỗi YYYY-MM-DD
 */
function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Thêm ngày vào một đối tượng Date
 */
function addDays(d: Date, days: number): Date {
  const result = new Date(d.getTime());
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Tính số ngày giữa 2 mốc Date (làm tròn lên)
 */
function diffDays(start: Date, end: Date): number {
  const diffTime = end.getTime() - start.getTime();
  return Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)));
}

/**
 * Thuật toán tự động ngầm phân bổ ngày bắt đầu cho từng thành viên (100% tự động):
 * - Độc lập cho từng người (người này không liên quan đến người kia).
 * - Nếu 1 người làm từ 2 task trở lên:
 *   + Nếu thời gian thoải mái: Hết task này mới đến task kia (tuần tự).
 *   + Nếu thời gian không đủ: Tự động gối đầu / chồng lấn thời gian bắt đầu (từ 1 đến nhiều ngày tùy theo độ dài Sprint và độ phức tạp công việc).
 *   + Nguyên tắc cốt lõi: Làm ĐỦ trong số tuần của Sprint, có thể thiếu nhưng TUYỆT ĐỐI KHÔNG BAO GIỜ THỪA NGÀY (dueDate <= sprintEnd).
 */
export function scheduleMemberTasksInSprint(
  memberTasks: Task[],
  sprint?: Sprint | null
): Map<number, ScheduledTaskDate> {
  const resultMap = new Map<number, ScheduledTaskDate>();
  if (!memberTasks || memberTasks.length === 0) return resultMap;

  // Xác định mốc thời gian của Sprint
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let sprintStart = sprint?.startDate ? new Date(sprint.startDate) : new Date(today);
  sprintStart.setHours(0, 0, 0, 0);

  let sprintEnd: Date;
  if (sprint?.endDate) {
    sprintEnd = new Date(sprint.endDate);
    sprintEnd.setHours(0, 0, 0, 0);
  } else {
    // Nếu chưa có ngày kết thúc, kiểm tra tên sprint xem có (Tuần X) hoặc mặc định 14 ngày (2 tuần)
    let weeks = 2;
    if (sprint?.name) {
      const weekMatch = sprint.name.match(/(\d+)\s*tuần/i);
      if (weekMatch && weekMatch[1]) {
        weeks = parseInt(weekMatch[1], 10);
      }
    }
    sprintEnd = addDays(sprintStart, weeks * 7);
  }

  const sprintTotalDays = Math.max(1, diffDays(sprintStart, sprintEnd));

  // Tính số ngày làm việc cho từng task của thành viên này
  const taskWorkList = memberTasks.map((task) => {
    const comp = getTaskComplexity(task);
    return {
      task,
      days: Math.max(1, comp.days),
    };
  });

  const totalEstimatedDays = taskWorkList.reduce((sum, item) => sum + item.days, 0);
  const taskCount = taskWorkList.length;

  if (taskCount === 1) {
    // Chỉ có 1 task: Bắt đầu từ sprintStart, kết thúc sau số ngày ước tính (chặn ở sprintEnd)
    const taskStart = new Date(sprintStart);
    let taskDue = addDays(taskStart, taskWorkList[0].days);
    if (taskDue > sprintEnd) {
      taskDue = new Date(sprintEnd);
    }
    resultMap.set(taskWorkList[0].task.id, {
      taskId: taskWorkList[0].task.id,
      startDate: formatDate(taskStart),
      dueDate: formatDate(taskDue),
      days: diffDays(taskStart, taskDue),
    });
    return resultMap;
  }

  // Khi có từ 2 task trở lên:
  // 1. Kiểm tra xem có bị thừa ngày so với thời gian Sprint không
  const isOverflow = totalEstimatedDays > sprintTotalDays;
  const excessDays = isOverflow ? totalEstimatedDays - sprintTotalDays : 0;
  // Số ngày cần gối đầu tự động giữa mỗi cặp task liền kề (có thể 1, 2, 3, 4, 5... ngày tùy độ dài và độ dôi dư)
  const overlapPerGap = isOverflow ? Math.ceil(excessDays / (taskCount - 1)) : 0;

  let currentCursor = new Date(sprintStart);

  for (let i = 0; i < taskCount; i++) {
    const { task, days } = taskWorkList[i];
    let taskStart: Date;
    let taskDue: Date;

    if (i === 0) {
      taskStart = new Date(sprintStart);
      taskDue = addDays(taskStart, days);
      if (taskDue > sprintEnd) {
        taskDue = new Date(sprintEnd);
      }
      currentCursor = new Date(taskDue);
    } else {
      const prevScheduled = resultMap.get(taskWorkList[i - 1].task.id)!;
      const prevStart = new Date(prevScheduled.startDate);
      const prevDue = new Date(prevScheduled.dueDate);

      if (isOverflow && overlapPerGap > 0) {
        // Gối đầu: Lùi ngày bắt đầu về trước hạn chót của task trước
        // RÀNG BUỘC CỐT LÕI: taskStart BẮT BUỘC phải sau prevStart ít nhất 1 ngày!
        const maxBacktrack = Math.max(1, overlapPerGap);
        let candidateStart = addDays(prevDue, -maxBacktrack);
        const earliestAllowed = addDays(prevStart, 1);
        if (candidateStart < earliestAllowed) {
          candidateStart = earliestAllowed;
        }
        taskStart = candidateStart;
      } else {
        // Nối tiếp tuần tự: Bắt đầu khi task trước kết thúc (prevDue)
        const earliestAllowed = addDays(prevStart, 1);
        taskStart = prevDue < earliestAllowed ? earliestAllowed : new Date(prevDue);
      }

      // Đảm bảo không trước sprintStart
      if (taskStart < sprintStart) {
        taskStart = new Date(sprintStart);
      }

      // NGUYÊN TẮC THÉP: Cùng 1 người tuyệt đối không bao giờ bắt đầu 2 task cùng 1 ngày
      if (taskStart <= prevStart) {
        taskStart = addDays(prevStart, 1);
      }

      // Tính hạn chót
      taskDue = addDays(taskStart, days);

      // NGUYÊN TẮC: Tuyệt đối không được vượt quá sprintEnd
      if (taskDue > sprintEnd) {
        taskDue = new Date(sprintEnd);
      }

      // Đảm bảo hạn chót dueDate phải sau taskStart ít nhất 1 ngày
      if (taskDue <= taskStart) {
        if (taskStart < sprintEnd) {
          taskDue = addDays(taskStart, 1);
          if (taskDue > sprintEnd) taskDue = new Date(sprintEnd);
        } else {
          taskStart = addDays(sprintEnd, -1);
          taskDue = new Date(sprintEnd);
        }
      }

      currentCursor = new Date(taskDue);
    }

    resultMap.set(task.id, {
      taskId: task.id,
      startDate: formatDate(taskStart),
      dueDate: formatDate(taskDue),
      days: Math.max(1, diffDays(taskStart, taskDue)),
    });
  }

  return resultMap;
}

/**
 * Lập lịch thông minh toàn diện cho tất cả thành viên trong kết quả phân công
 */
export function optimizeScheduleForAssignments(
  assignments: { taskId: number; ownerId: number }[],
  allTasks: Task[],
  sprints: Sprint[]
): Map<number, ScheduledTaskDate> {
  const fullSchedule = new Map<number, ScheduledTaskDate>();

  // 1. Gom nhóm task theo từng thành viên (mỗi người làm việc độc lập)
  const memberTasksMap = new Map<number, Task[]>();
  assignments.forEach((a) => {
    const t = allTasks.find((task) => task.id === a.taskId);
    if (!t) return;
    const list = memberTasksMap.get(a.ownerId) || [];
    list.push(t);
    memberTasksMap.set(a.ownerId, list);
  });

  // 2. Với mỗi thành viên, gom nhóm theo Sprint để lập lịch
  memberTasksMap.forEach((tasksOfMember) => {
    // Nhóm theo sprintId
    const sprintGroupMap = new Map<number | null, Task[]>();
    tasksOfMember.forEach((task) => {
      const spId = task.sprintId || null;
      const list = sprintGroupMap.get(spId) || [];
      list.push(task);
      sprintGroupMap.set(spId, list);
    });

    sprintGroupMap.forEach((tasksInSprint, sprintId) => {
      const sprint = sprintId ? sprints.find((s) => s.id === sprintId) || null : null;
      const scheduled = scheduleMemberTasksInSprint(tasksInSprint, sprint);
      scheduled.forEach((value, taskId) => {
        fullSchedule.set(taskId, value);
      });
    });
  });

  return fullSchedule;
}
