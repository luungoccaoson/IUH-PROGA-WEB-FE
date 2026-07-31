export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Task {
  id: number;
  spaceId: number;
  sprintId?: number | null;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  ownerId?: number;
  ownerName?: string;
  startDate?: string;
  dueDate?: string;
  createdAt: string;
}

export interface TaskNote {
  id: number;
  taskId: number;
  authorId: number;
  authorName: string;
  noteContent: string;
  createdAt: string;
}
