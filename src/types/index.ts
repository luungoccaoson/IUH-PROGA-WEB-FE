// Enums
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type AgentType = 'REQUIREMENT' | 'PM' | 'TECHNICAL_ADVISOR';
export type RoleName = 'ADMIN' | 'PM' | 'MEMBER';

// User & Auth
export interface User {
  id: number;
  username: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// Workspace & Space
export interface Workspace {
  id: number;
  name: string;
  description?: string;
  ownerId: number;
  createdAt: string;
}

export interface Space {
  id: number;
  workspaceId: number;
  name: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

// Task & Kanban
export interface Task {
  id: number;
  spaceId: number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  ownerId?: number; // Assignee ID
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

export interface WorkspaceLog {
  id: number;
  workspaceId: number;
  taskId?: number;
  userId: number;
  actionType: string;
  oldValue?: string;
  newValue?: string;
  logMessage: string;
  createdAt: string;
}

// AI Chat
export interface ChatMessage {
  id: number;
  threadId: number;
  senderType: 'USER' | 'ASSISTANT' | 'SYSTEM';
  messageContent: string;
  jsonPayload?: string; // Dùng cho Task Deconstruction preview
  createdAt: string;
}

// Generic API Response Wrapper
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp?: string;
}
