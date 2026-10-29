import { apiClient } from '@/lib/axios';
import { Workspace, Space, Task, TaskStatus, ApiResponse } from '@/types';

export const workspaceService = {
  // Workspaces
  getWorkspacesByOwner: async (ownerId: number): Promise<Workspace[]> => {
    const response = await apiClient.get<ApiResponse<Workspace[]>>(`/workspaces/owner/${ownerId}`);
    return response.data.data;
  },

  getClassifiedWorkspaces: async (userId: number): Promise<import('@/types').ClassifiedWorkspaces> => {
    const response = await apiClient.get<ApiResponse<import('@/types').ClassifiedWorkspaces>>(`/workspaces/user/${userId}/classified`);
    return response.data.data;
  },

  inviteMember: async (workspaceId: number, userId: number, roleId = 3): Promise<void> => {
    await apiClient.post(`/workspaces/${workspaceId}/invite?userId=${userId}&roleId=${roleId}`);
  },

  acceptInvitation: async (workspaceId: number, userId: number): Promise<void> => {
    await apiClient.put(`/workspaces/${workspaceId}/invitations/accept?userId=${userId}`);
  },

  declineInvitation: async (workspaceId: number, userId: number): Promise<void> => {
    await apiClient.put(`/workspaces/${workspaceId}/invitations/decline?userId=${userId}`);
  },

  getWorkspaceMembers: async (workspaceId: number): Promise<import('@/types').WorkspaceMember[]> => {
    const response = await apiClient.get<ApiResponse<import('@/types').WorkspaceMember[]>>(`/workspaces/${workspaceId}/members`);
    return response.data.data;
  },

  getWorkspaceById: async (id: number): Promise<Workspace> => {
    const response = await apiClient.get<ApiResponse<Workspace>>(`/workspaces/${id}`);
    return response.data.data;
  },

  createWorkspace: async (data: { name: string; description?: string; ownerId: number }): Promise<Workspace> => {
    const response = await apiClient.post<ApiResponse<Workspace>>('/workspaces', data);
    return response.data.data;
  },

  updateWorkspace: async (id: number, data: { name: string; description?: string; ownerId: number }): Promise<Workspace> => {
    const response = await apiClient.put<ApiResponse<Workspace>>(`/workspaces/${id}`, data);
    return response.data.data;
  },

  deleteWorkspace: async (id: number): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(`/workspaces/${id}`);
  },

  // Spaces
  getSpaceById: async (id: number): Promise<Space> => {
    const response = await apiClient.get<ApiResponse<Space>>(`/spaces/${id}`);
    return response.data.data;
  },

  getSpacesByWorkspace: async (workspaceId: number, userId?: number): Promise<Space[]> => {
    const url = userId ? `/spaces/workspace/${workspaceId}?userId=${userId}` : `/spaces/workspace/${workspaceId}`;
    const response = await apiClient.get<ApiResponse<Space[]>>(url);
    return response.data.data;
  },

  createSpace: async (data: { workspaceId: number; name: string; startDate?: string; endDate?: string; isPrivate?: boolean }): Promise<Space> => {
    const normalizeIso = (d?: string, fallbackTime = "08:00:00"): string | undefined => {
      if (!d || typeof d !== "string") return undefined;
      const datePart = d.includes("T") ? d.split("T")[0] : d.trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return undefined;
      const timePart = d.includes("T") ? d.split("T")[1].substring(0, 8) : fallbackTime;
      return `${datePart}T${timePart.length === 5 ? `${timePart}:00` : timePart}`;
    };

    const rawName = (data.name || "Dự Án Mới").trim();
    const baseName = rawName.length > 88 ? rawName.substring(0, 88).trim() : rawName;
    let candidateName = baseName;
    let nameSuffix = 2;

    // Tự động kiểm tra danh sách Space hiện có để tránh trùng tên gây lỗi 400
    try {
      const existing = await apiClient.get<ApiResponse<Space[]>>(`/spaces/workspace/${data.workspaceId}`);
      const existingNames = new Set(
        (existing.data?.data || []).map((s) => (s.name || "").trim().toLowerCase())
      );
      while (existingNames.has(candidateName.toLowerCase())) {
        candidateName = `${baseName} (${nameSuffix})`;
        nameSuffix++;
      }
    } catch {
      // Bỏ qua nếu không tải trước được danh sách
    }

    const startDateIso = normalizeIso(data.startDate, "08:00:00");
    const endDateIso = normalizeIso(data.endDate, "18:00:00");

    // Thử tối đa 20 lần để tự động vượt qua lỗi trùng tên hoặc lệch Sequence ID (spaces_id_seq) sau khi nạp dữ liệu mẫu
    let lastError: any;
    for (let attempt = 1; attempt <= 20; attempt++) {
      try {
        const payload: Record<string, any> = {
          workspaceId: Number(data.workspaceId),
          name: candidateName,
        };
        if (startDateIso) payload.startDate = startDateIso;
        if (endDateIso) payload.endDate = endDateIso;
        if (data.isPrivate !== undefined) payload.isPrivate = data.isPrivate;

        const response = await apiClient.post<ApiResponse<Space>>('/spaces', payload);
        return response.data.data;
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.response?.data?.message || err?.message || "").toLowerCase();
        if (msg.includes("already exists") || msg.includes("exists")) {
          candidateName = `${baseName} (${nameSuffix})`;
          nameSuffix++;
          continue;
        }
        if (msg.includes("duplicate key") || msg.includes("pkey") || msg.includes("constraint") || err?.response?.status === 400) {
          if (attempt >= 3 && !candidateName.includes("(")) {
            candidateName = `${baseName} (${nameSuffix})`;
            nameSuffix++;
          }
          continue;
        }
        throw err;
      }
    }
    throw lastError;
  },

  updateSpace: async (id: number, data: { workspaceId: number; name: string; startDate?: string; endDate?: string; isPrivate?: boolean }): Promise<Space> => {
    const response = await apiClient.put<ApiResponse<Space>>(`/spaces/${id}`, data);
    return response.data.data;
  },

  deleteSpace: async (id: number): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(`/spaces/${id}`);
  },

  addMemberToSpace: async (spaceId: number, userId: number, roleId: number = 3): Promise<void> => {
    await apiClient.post(`/spaces/${spaceId}/members?userId=${userId}&roleId=${roleId}`);
  },

  updateSpaceMemberRole: async (spaceId: number, userId: number, roleId: number): Promise<void> => {
    await apiClient.put(`/spaces/${spaceId}/members/${userId}/role?roleId=${roleId}`);
  },

  removeMemberFromSpace: async (spaceId: number, userId: number): Promise<void> => {
    await apiClient.delete(`/spaces/${spaceId}/members/${userId}`);
  },

  getSpaceMembers: async (spaceId: number): Promise<any[]> => {
    const response = await apiClient.get<ApiResponse<any[]>>(`/spaces/${spaceId}/members`);
    return response.data.data;
  },

  // Tasks & Kanban
  getTasksBySpace: async (spaceId: number): Promise<Task[]> => {
    const response = await apiClient.get<ApiResponse<Task[]>>(`/tasks/space/${spaceId}`);
    return response.data.data;
  },

  updateTaskStatus: async (taskId: number, status: TaskStatus): Promise<Task> => {
    const response = await apiClient.patch<ApiResponse<Task>>(`/tasks/${taskId}/status?status=${status}`);
    return response.data.data;
  },

  createTask: async (data: {
    spaceId: number;
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: string;
    ownerId?: number;
    startDate?: string;
    dueDate?: string;
  }): Promise<Task> => {
    const response = await apiClient.post<ApiResponse<Task>>('/tasks', data);
    return response.data.data;
  },

  deleteTask: async (taskId: number): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(`/tasks/${taskId}`);
  },
};
