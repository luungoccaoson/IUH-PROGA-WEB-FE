import { apiClient } from '@/lib/axios';
import { Workspace, Space, Task, TaskStatus, ApiResponse } from '@/types';

export const workspaceService = {
  // Workspaces
  getWorkspaces: async (): Promise<Workspace[]> => {
    const response = await apiClient.get<ApiResponse<Workspace[]>>('/workspaces');
    return response.data.data;
  },

  createWorkspace: async (data: { name: string; description?: string }): Promise<Workspace> => {
    const response = await apiClient.post<ApiResponse<Workspace>>('/workspaces', data);
    return response.data.data;
  },

  // Spaces
  getSpacesByWorkspace: async (workspaceId: string): Promise<Space[]> => {
    const response = await apiClient.get<ApiResponse<Space[]>>(`/workspaces/${workspaceId}/spaces`);
    return response.data.data;
  },

  createSpace: async (workspaceId: string, data: { name: string; startDate?: string; endDate?: string }): Promise<Space> => {
    const response = await apiClient.post<ApiResponse<Space>>(`/workspaces/${workspaceId}/spaces`, data);
    return response.data.data;
  },

  // Tasks & Kanban
  getTasksBySpace: async (spaceId: string): Promise<Task[]> => {
    const response = await apiClient.get<ApiResponse<Task[]>>(`/spaces/${spaceId}/tasks`);
    return response.data.data;
  },

  updateTaskStatus: async (taskId: string, status: TaskStatus): Promise<Task> => {
    const response = await apiClient.patch<ApiResponse<Task>>(`/tasks/${taskId}/status`, { status });
    return response.data.data;
  },

  createTask: async (spaceId: string, data: Partial<Task>): Promise<Task> => {
    const response = await apiClient.post<ApiResponse<Task>>(`/spaces/${spaceId}/tasks`, data);
    return response.data.data;
  },
};
