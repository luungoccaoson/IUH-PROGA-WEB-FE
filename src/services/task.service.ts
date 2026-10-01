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
    const response = await apiClient.post<ApiResponse<Task>>('/tasks', data);
    return response.data.data;
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

  assignTasksBatch: async (assignments: { taskId: number; ownerId: number }[]): Promise<void> => {
    try {
      await apiClient.post<ApiResponse<void>>('/tasks/batch-assign', { assignments });
    } catch (err) {
      // Fallback sequentially/concurrently if needed
      await Promise.all(
        assignments.map((item) =>
          apiClient.put(`/tasks/${item.taskId}`, { ownerId: item.ownerId }).catch(() => null)
        )
      );
    }
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
