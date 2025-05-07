export interface AnalyticsData {
  date: string;
  embedId?: string;
  teamId?: string;
  period: 'daily' | 'weekly' | 'monthly';
  totalConversations: number;
  averageMessageCount: number;
  averageUserMessages: number;
  averageAssistantMessages: number;
  averageConversationLength: number; // in seconds
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  averageResponseTime: number; // in seconds
  commonTopics: Array<{ topic: string; count: number }>;
}

export interface ChatSessionData {
  id: string;
  embedId: string;
  sessionId: string;
  startTime: string;
  endTime: string | null;
  messageCount: number;
  userMessageCount: number;
  assistantMessageCount: number;
}

export interface TopicData {
  topic: string;
  count: number;
}
