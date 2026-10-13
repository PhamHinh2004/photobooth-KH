import axiosInstance from './axios';

export interface ChatMessageItem {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: Record<string, any> | null;
  createdAt: string;
}

export interface ChatSessionItem {
  id: string;
  accountId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages?: ChatMessageItem[];
}

export interface SendMessagePayload {
  message: string;
  sessionId?: string;
  frameId?: string;
  memberCount?: number;
  style?: string;
  theme?: string;
  history?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
}

export interface SendMessageResponse {
  success: boolean;
  reply: string;
  provider?: string;
  modelUsed?: string;
  sessionId?: string;
  userMessageId?: string;
  assistantMessageId?: string;
  context?: {
    frameId?: string;
    frameName?: string;
    memberCount?: number;
  };
}

export const chatboxApi = {
  getSessions: async (): Promise<ChatSessionItem[]> => {
    const res = await axiosInstance.get<ChatSessionItem[]>('/chatbox/sessions');
    return res.data;
  },

  createSession: async (title?: string): Promise<ChatSessionItem> => {
    const res = await axiosInstance.post<ChatSessionItem>('/chatbox/sessions', { title });
    return res.data;
  },

  getSession: async (id: string): Promise<ChatSessionItem> => {
    const res = await axiosInstance.get<ChatSessionItem>(`/chatbox/sessions/${id}`);
    return res.data;
  },

  deleteSession: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await axiosInstance.delete<{ success: boolean; message: string }>(`/chatbox/sessions/${id}`);
    return res.data;
  },

  deleteAllSessions: async (): Promise<{ success: boolean; message: string }> => {
    const res = await axiosInstance.delete<{ success: boolean; message: string }>('/chatbox/sessions');
    return res.data;
  },

  deleteMessage: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await axiosInstance.delete<{ success: boolean; message: string }>(`/chatbox/messages/${id}`);
    return res.data;
  },

  sendMessage: async (payload: SendMessagePayload): Promise<SendMessageResponse> => {
    const res = await axiosInstance.post<SendMessageResponse>('/chatbox/message', payload, {
      timeout: 30000,
    });
    return res.data;
  },
};
