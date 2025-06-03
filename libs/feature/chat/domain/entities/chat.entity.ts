export interface Chat {
  id: string;
  participants: Participant[];
  status: ChatStatus;
  lastMessage?: Message | null;
  lastMessageAt: string | null;
  createdAt: string;
}

export interface Participant {
  id: string;
  name: string;
  isCommercial: boolean;
  isVisitor: boolean;
  isOnline: boolean;
  assignedAt: string;
  lastSeenAt: string | null;
  isViewing: boolean;
  isTyping: boolean;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: MessageType;
  timestamp: string;
  isRead: boolean;
  metadata?: Record<string, any>;
}

export type ChatStatus = 'active' | 'inactive' | 'closed' | 'waiting' | 'pending';
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

export interface RealChatListResponse {
  chats: Chat[];
  total: number;
  hasMore: boolean;
  nextCursor: string | null;
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