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

export interface RagCitationItem {
  anchorCategory?: string;
  title: string;
  sourceUrl?: string;
  snippet?: string;
  priorityLevel?: string;
}

export interface TaskDecompositionResponse {
  threadId: number;
  suggestedSpaceName?: string;
  summary: string;
  sourceReference?: string;
  sourceUrl?: string;
  sourceUrls?: string[];
  citations?: RagCitationItem[];
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
  // Upload & parse PDF/Docx document into PgVector Store
  uploadAndParseDocument: async (file: File): Promise<{ fileName: string; fileSize: number; extractedText: string; chunkCount: number }> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post<ApiResponse<{ fileName: string; fileSize: number; extractedText: string; chunkCount: number }>>(
      "/ai/parse-document",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 60000,
      }
    );
    return response.data.data;
  },

  // Requirement Agent: Phân rã bài toán tự động với RAG Tri thức & Đàm thoại 2 Lượt
  decomposeRequirements: async (
    spaceId: number,
    requirementText: string,
    threadId?: number | null
  ): Promise<TaskDecompositionResponse> => {
    const response = await apiClient.post<ApiResponse<TaskDecompositionResponse>>(
      "/ai/agents/decompose",
      {
        spaceId,
        threadId: threadId || undefined,
        requirementText,
      },
      { timeout: 120000 } // Extended 2-minute timeout for AI LLM reasoning
    );
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
    const response = await apiClient.post<ApiResponse<AiChatMessageResponse>>(
      `/ai/agents/pm-summary/${spaceId}`,
      null,
      { timeout: 120000 }
    );
    return response.data.data;
  },

  // Tech Lead Agent: Tư vấn giải pháp kỹ thuật & Fix bug
  getTechAdvice: async (taskId: number, problemDescription: string): Promise<AiChatMessageResponse> => {
    const response = await apiClient.post<ApiResponse<AiChatMessageResponse>>(
      "/ai/agents/tech-advisor",
      null,
      {
        params: { taskId, problemDescription },
        timeout: 120000,
      }
    );
    return response.data.data;
  },
};
