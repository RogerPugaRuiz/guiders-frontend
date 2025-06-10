export interface ChatData {
  id: string;
  participants: Participant[];
  status: 'active' | 'inactive' | 'closed' | 'archived' | 'pending';
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
  isAnonymous?: boolean;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  createdAt: string; // ISO 8601 format ej: "2023-10-01T12:00:00Z"
  isRead: boolean;
  metadata?: Record<string, any>;
}

export interface MessagesListResponse {
  messages: Message[];
  cursor?: string | null;
  hasMore: boolean;
}

export interface ChatListResponse {
  chats: ChatData[];
  pagination: {
    cursor?: string;
    nextCursor?: string | null;
    hasMore: boolean;
    limit: number;
    total?: number;
  };
}

export type ChatStatus = 'active' | 'inactive' | 'closed' | 'archived' | 'pending';

export interface RealChatListResponse {
  chats: ChatData[];
  total: number;
  hasMore: boolean;
  nextCursor: string | null;
}

// Opciones para el selector
export interface SelectOption {
  value: string;
  label: string;
}
