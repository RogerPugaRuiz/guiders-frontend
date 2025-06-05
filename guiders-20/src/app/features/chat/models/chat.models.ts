export interface ChatData {
  id: string;
  participants: Participant[];
  status: 'active' | 'inactive' | 'closed' | 'archived' | 'pending';
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
  isAnonymous?: boolean;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  timestamp: string;
  isRead: boolean;
  metadata?: Record<string, any>;
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
