import { apiClient } from '@/lib/axios';
import { Task, TaskStatus, TaskPriority, ApiResponse } from '@/types';

export const taskService = {
  getTasksBySpace: async (spaceId: number): Promise<Task[]> => {
    const response = await apiClient.get<ApiResponse<Task[]>>(`/tasks/space/${spaceId}`);
    return response.data.data;
  },

  getTasksBySprint: async (sprintId: number): Promise<Task[]> => {
    const response = await apiClient.get<ApiResponse<Task[]>>(`/tasks/sprint/${sprintId}`);
    return response.data.data;
  },

  getTaskById: async (id: number): Promise<Task> => {
    const response = await apiClient.get<ApiResponse<Task>>(`/tasks/${id}`);
    return response.data.data;
  },

  createTask: async (data: {
    spaceId: number;
    sprintId?: number | null;
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    ownerId?: number;
    startDate?: string;
    dueDate?: string;
  }): Promise<Task> => {
    const rawTitle = (data.title || "Công việc mới").trim();
    const safeTitle = rawTitle.length > 140 ? rawTitle.substring(0, 140).trim() : rawTitle;
    const payload = {
      ...data,
      spaceId: Number(data.spaceId),
      title: safeTitle,
    };

    let lastError: any;
    for (let attempt = 1; attempt <= 50; attempt++) {
      try {
        const response = await apiClient.post<ApiResponse<Task>>('/tasks', payload);
        return response.data.data;
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.response?.data?.message || err?.message || "").toLowerCase();
        if (msg.includes("duplicate key") || msg.includes("pkey") || err?.response?.status === 400) {
          continue;
        }
        throw err;
      }
    }
    throw lastError;
  },

  updateTask: async (
    id: number,
    data: {
      spaceId: number;
      sprintId?: number | null;
      title: string;
      description?: string;
      status?: TaskStatus;
      priority?: TaskPriority;
      ownerId?: number | null;
      startDate?: string;
      dueDate?: string;
    }
  ): Promise<Task> => {
    const response = await apiClient.put<ApiResponse<Task>>(`/tasks/${id}`, data);
    return response.data.data;
  },

  updateTaskStatus: async (taskId: number, status: TaskStatus): Promise<Task> => {
    const response = await apiClient.patch<ApiResponse<Task>>(`/tasks/${taskId}/status?status=${status}`);
    return response.data.data;
  },

  deleteTask: async (taskId: number): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(`/tasks/${taskId}`);
  },

  deleteTasksBatch: async (taskIds: number[]): Promise<void> => {
    try {
      await apiClient.post<ApiResponse<void>>('/tasks/batch-delete', { taskIds });
    } catch (err) {
      // Fallback sequentially/concurrently if needed
      await Promise.all(taskIds.map((id) => apiClient.delete(`/tasks/${id}`)));
    }
  },

  assignTasksBatch: async (
    assignments: { taskId: number; ownerId: number; startDate?: string; dueDate?: string }[]
  ): Promise<void> => {
    await apiClient.post<ApiResponse<void>>('/tasks/batch-assign', { assignments });
  },

  getDeletedTasksBySpace: async (spaceId: number): Promise<Task[]> => {
    const response = await apiClient.get<ApiResponse<Task[]>>(`/tasks/space/${spaceId}/trash`);
    return response.data.data;
  },

  restoreTask: async (taskId: number): Promise<Task> => {
    const response = await apiClient.post<ApiResponse<Task>>(`/tasks/${taskId}/restore`);
    return response.data.data;
  },

  permanentDeleteTask: async (taskId: number): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(`/tasks/${taskId}/permanent`);
  },
};
