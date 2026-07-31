import { apiClient } from '@/lib/axios';
import { Workspace, Space, Task, TaskStatus, ApiResponse } from '@/types';

export const workspaceService = {
  // Workspaces
  getWorkspacesByOwner: async (ownerId: number): Promise<Workspace[]> => {
    const response = await apiClient.get<ApiResponse<Workspace[]>>(`/workspaces/owner/${ownerId}`);
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
  getSpacesByWorkspace: async (workspaceId: number): Promise<Space[]> => {
    const response = await apiClient.get<ApiResponse<Space[]>>(`/spaces/workspace/${workspaceId}`);
    return response.data.data;
  },

  createSpace: async (data: { workspaceId: number; name: string; startDate?: string; endDate?: string }): Promise<Space> => {
    const response = await apiClient.post<ApiResponse<Space>>('/spaces', data);
    return response.data.data;
  },

  updateSpace: async (id: number, data: { workspaceId: number; name: string; startDate?: string; endDate?: string }): Promise<Space> => {
    const response = await apiClient.put<ApiResponse<Space>>(`/spaces/${id}`, data);
    return response.data.data;
  },

  deleteSpace: async (id: number): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(`/spaces/${id}`);
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
