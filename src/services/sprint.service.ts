import { apiClient } from '@/lib/axios';
import { Sprint, SprintStatus, Task, ApiResponse } from '@/types';

export const sprintService = {
  getSprintsBySpace: async (spaceId: number, status?: SprintStatus): Promise<Sprint[]> => {
    const url = status 
      ? `/sprints/space/${spaceId}?status=${status}` 
      : `/sprints/space/${spaceId}`;
    const response = await apiClient.get<ApiResponse<Sprint[]>>(url);
    return response.data.data;
  },

  getSprintById: async (id: number): Promise<Sprint> => {
    const response = await apiClient.get<ApiResponse<Sprint>>(`/sprints/${id}`);
    return response.data.data;
  },

  createSprint: async (data: {
    spaceId: number;
    name: string;
    goal?: string;
    status?: SprintStatus;
    startDate?: string;
    endDate?: string;
  }): Promise<Sprint> => {
    const rawName = (data.name || "Sprint Mới").trim();
    const safeName = rawName.length > 95 ? rawName.substring(0, 95).trim() : rawName;
    const payload = {
      ...data,
      spaceId: Number(data.spaceId),
      name: safeName,
    };

    let lastError: any;
    for (let attempt = 1; attempt <= 20; attempt++) {
      try {
        const response = await apiClient.post<ApiResponse<Sprint>>('/sprints', payload);
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

  updateSprint: async (
    id: number,
    data: {
      spaceId: number;
      name: string;
      goal?: string;
      status?: SprintStatus;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<Sprint> => {
    const response = await apiClient.put<ApiResponse<Sprint>>(`/sprints/${id}`, data);
    return response.data.data;
  },

  updateSprintStatus: async (id: number, status: SprintStatus): Promise<Sprint> => {
    const response = await apiClient.patch<ApiResponse<Sprint>>(`/sprints/${id}/status?status=${status}`);
    return response.data.data;
  },

  deleteSprint: async (id: number, deleteTasks = false): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(`/sprints/${id}`, {
      params: { deleteTasks },
    });
  },

  getTasksBySprint: async (sprintId: number): Promise<Task[]> => {
    const response = await apiClient.get<ApiResponse<Task[]>>(`/tasks/sprint/${sprintId}`);
    return response.data.data;
  },
};
