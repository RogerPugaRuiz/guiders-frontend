export interface Chat {
  id: string;
  participants: Participant[];
  status: ChatStatus;
  lastMessage?: Message;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface Participant {
  id: string;
  name: string;
  role: 'visitor' | 'commercial';
  isOnline: boolean;
  joinedAt: Date;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: MessageType;
  timestamp: Date;
  isRead: boolean;
  metadata?: Record<string, any>;
}

export type ChatStatus = 'active' | 'inactive' | 'closed' | 'waiting';
export type MessageType = 'text' | 'image' | 'file' | 'system';

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    cursor?: string;
    nextCursor?: string;
    hasMore: boolean;
    limit: number;
    total?: number;
  };
}

export interface ChatListResponse extends PaginatedResponse<Chat> {}
export interface MessageListResponse extends PaginatedResponse<Message> {}

export interface GetChatsParams {
  limit?: number;
  cursor?: string;
  include?: string[];
}

export interface GetMessagesParams {
  chatId: string;
  limit?: number;
  cursor?: string;
}

export interface GetChatByIdParams {
  chatId: string;
}