import { apiClient } from "@/lib/axios";
import { ApiResponse } from "@/types";

export interface DecomposedTaskItem {
  sprint: string;
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  estimatedDays: number;
}

export interface TaskDecompositionResponse {
  threadId: number;
  summary: string;
  tasks: DecomposedTaskItem[];
}

export interface AiChatMessageResponse {
  id: number;
  threadId: number;
  senderType: "USER" | "ASSISTANT";
  messageContent: string;
  jsonPayload?: string;
  createdAt: string;
}

export const aiService = {
  // Requirement Agent: Phân rã bài toán tự động với RAG Tri thức
  decomposeRequirements: async (spaceId: number, requirementText: string): Promise<TaskDecompositionResponse> => {
    const response = await apiClient.post<ApiResponse<TaskDecompositionResponse>>("/ai/agents/decompose", {
      spaceId,
      requirementText,
    });
    return response.data.data;
  },

  // PM Agent: Báo cáo tiến độ & Dự báo rủi ro trễ deadline
  getPmSummary: async (spaceId: number): Promise<AiChatMessageResponse> => {
    const response = await apiClient.post<ApiResponse<AiChatMessageResponse>>(`/ai/agents/pm-summary/${spaceId}`);
    return response.data.data;
  },

  // Tech Lead Agent: Tư vấn giải pháp kỹ thuật & Fix bug
  getTechAdvice: async (taskId: number, problemDescription: string): Promise<AiChatMessageResponse> => {
    const response = await apiClient.post<ApiResponse<AiChatMessageResponse>>("/ai/agents/tech-advisor", null, {
      params: { taskId, problemDescription },
    });
    return response.data.data;
  },
};
