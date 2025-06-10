export interface Chat {
  id: string;
  participants: Participant[];
  status: ChatStatus;
  lastMessage?: Message | null;
  lastMessageAt: string | null;
  createdAt: string;
}

// Keep backward compatibility - use string for lastMessage like original
export interface ChatData {
  id: string;
  participants: Participant[];
  status: ChatStatus;
  lastMessage?: string | null;
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
  isAnonymous: boolean;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: MessageType;
  timestamp: string;
  createdAt: string; // Keep for backward compatibility
  isRead: boolean;
  metadata?: Record<string, any>;
}

export type ChatStatus = 'active' | 'inactive' | 'closed' | 'archived' | 'pending';
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

export interface ChatListResponse extends PaginatedResponse<ChatData> {
  chats?: ChatData[]; // Backward compatibility
}
export interface MessageListResponse extends PaginatedResponse<Message> {}

export interface RealChatListResponse {
  chats: Chat[];
  total: number;
  hasMore: boolean;
  nextCursor: string | null;
}

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

// Use ChatData for service responses to maintain backward compatibility
export interface ChatListServiceResponse {
  data: ChatData[];
  chats: ChatData[];
  pagination: {
    cursor?: string;
    nextCursor?: string;
    hasMore: boolean;
    limit: number;
    total?: number;
  };
}

// Legacy interface - keep for backward compatibility
export interface MessagesListResponse {
  messages: Message[];
  nextCursor?: string | null;
  hasMore: boolean;
}

// Opciones para el selector
export interface SelectOption {
  value: string;
  label: string;
}
