import { Task, Sprint } from "@/types";

/**
 * Computes a map of task.id -> sequential space task index (1-based: Task-1, Task-2, ...)
 * based on sequential sprint order and then backlog order.
 */
export function computeTaskNumberMap(tasks: Task[] = [], sprints: Sprint[] = []): Map<number, number> {
  const map = new Map<number, number>();
  const sprintIds = new Set(sprints.map((s) => s.id));

  const list: Task[] = [];
  // 1. Tasks in sequential sprints
  sprints.forEach((sprint) => {
    const sTasks = tasks.filter((t) => t.sprintId === sprint.id && !t.isDeleted);
    list.push(...sTasks);
  });
  // 2. Tasks in Backlog
  const bTasks = tasks.filter(
    (t) => !t.isDeleted && (!t.sprintId || !sprintIds.has(t.sprintId))
  );
  list.push(...bTasks);

  // Fallback for any other non-deleted tasks
  tasks.filter((t) => !t.isDeleted).forEach((t) => {
    if (!list.some((existing) => existing.id === t.id)) {
      list.push(t);
    }
  });

  list.forEach((t, idx) => {
    map.set(t.id, idx + 1);
  });

  return map;
}

export function formatTaskCode(taskId?: number | null, taskNumberMap?: Map<number, number>): string {
  if (!taskId) return "Task";
  const num = taskNumberMap?.get(taskId) || taskId;
  return `Task-${num}`;
}
