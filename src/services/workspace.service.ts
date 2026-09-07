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
    const response = await apiClient.post<ApiResponse<Space>>('/spaces', data);
    return response.data.data;
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
