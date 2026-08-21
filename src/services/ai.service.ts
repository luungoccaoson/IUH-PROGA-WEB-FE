import { apiClient } from "@/lib/axios";
import { ApiResponse } from "@/types";

export interface DecomposedTaskItem {
  sprint: string;
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  estimatedDays: number;
  bufferDays?: number;
  assignedRole?: string;
  suggestedMemberName?: string;
  riskWarning?: string;
}

export interface TaskDecompositionResponse {
  threadId: number;
  summary: string;
  sourceReference?: string;
  sourceUrl?: string;
  tasks: DecomposedTaskItem[];
}

export interface AiThreadResponse {
  id: number;
  openaiThreadId?: string;
  spaceId: number;
  agentType: "REQUIREMENT" | "PM_PROGRESS" | "TECH_ADVISOR";
  createdAt: string;
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
  // Requirement Agent: Phân rã bài toán tự động với RAG Tri thức & Đàm thoại 2 Lượt
  decomposeRequirements: async (
    spaceId: number,
    requirementText: string,
    threadId?: number | null
  ): Promise<TaskDecompositionResponse> => {
    const response = await apiClient.post<ApiResponse<TaskDecompositionResponse>>("/ai/agents/decompose", {
      spaceId,
      threadId: threadId || undefined,
      requirementText,
    });
    return response.data.data;
  },

  // Fetch threads by spaceId
  getThreadsBySpace: async (spaceId: number): Promise<AiThreadResponse[]> => {
    const response = await apiClient.get<ApiResponse<AiThreadResponse[]>>(`/ai/threads/space/${spaceId}`);
    return response.data.data;
  },

  // Fetch thread messages by threadId
  getThreadMessages: async (threadId: number): Promise<AiChatMessageResponse[]> => {
    const response = await apiClient.get<ApiResponse<AiChatMessageResponse[]>>(`/ai/messages/thread/${threadId}`);
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
