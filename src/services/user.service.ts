import { apiClient } from '@/lib/axios';
import { User, ApiResponse } from '@/types';

export const userService = {
  getAllUsers: async (): Promise<User[]> => {
    const response = await apiClient.get<ApiResponse<User[]>>('/users');
    return response.data.data;
  },

  getUserById: async (id: number): Promise<User> => {
    const response = await apiClient.get<ApiResponse<User>>(`/users/${id}`);
    return response.data.data;
  },

  searchUsers: async (query: string): Promise<User[]> => {
    const q = query ? query.trim() : '';
    const response = await apiClient.get<ApiResponse<User[]>>(`/users/search?query=${encodeURIComponent(q)}`);
    return response.data.data;
  },

  updateUserProfile: async (
    id: number,
    data: {
      fullName?: string;
      displayName?: string;
      phoneNumber?: string;
      jobTitle?: string;
      bio?: string;
      avatarUrl?: string;
    }
  ): Promise<User> => {
    const response = await apiClient.put<ApiResponse<User>>(`/users/${id}`, data);
    return response.data.data;
  },
};
