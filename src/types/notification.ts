export interface AppNotification {
  id: number;
  userId: number;
  workspaceId?: number | null;
  spaceId?: number | null;
  taskId?: number | null;
  title: string;
  content: string;
  isRead: boolean;
  typeId?: number | null;
  typeCode?: string | null;
  typeLabel?: string | null;
  createdAt: string;
}
