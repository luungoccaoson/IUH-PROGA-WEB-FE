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
