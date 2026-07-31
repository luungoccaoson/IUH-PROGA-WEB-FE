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
  isPrivate?: boolean;
  createdAt: string;
}

export interface WorkspaceMember {
  workspaceId: number;
  userId: number;
  roleId: number;
  status: "ACCEPTED" | "PENDING" | "REJECTED";
  joinedAt: string;
}

export interface ClassifiedWorkspaces {
  ownedWorkspaces: Workspace[];
  joinedWorkspaces: Workspace[];
  pendingWorkspaces: Workspace[];
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
