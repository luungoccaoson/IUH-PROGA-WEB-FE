export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Task {
  id: number;
  spaceId: number;
  sprintId?: number | null;
  sprintName?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  ownerId?: number;
  ownerName?: string;
  assignee?: { fullName?: string; email?: string };
  assignedRole?: string;
  suggestedMemberName?: string;
  riskWarning?: string;
  estimatedDays?: number;
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
