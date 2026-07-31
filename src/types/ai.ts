export type AgentType = 'REQUIREMENT' | 'PM' | 'TECHNICAL_ADVISOR';

export interface ChatMessage {
  id: number;
  threadId: number;
  senderType: 'USER' | 'ASSISTANT' | 'SYSTEM';
  messageContent: string;
  jsonPayload?: string;
  createdAt: string;
}
