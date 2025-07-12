export type ChatStatus = 'active' | 'inactive' | 'closed' | 'archived' | 'pending';

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
  total: number;
  hasMore: boolean;
  nextCursor: string | null;
}

export interface RealChatListResponse {
  chats: ChatData[];
  pagination: {
    cursor?: string;
    nextCursor?: string | null;
    hasMore: boolean;
    limit: number;
    total?: number;
  };
}

// Opciones para el selector
export interface SelectOption {
  value: string;
  label: string;
}

// Interfaces para el sistema de claims de chats
export interface ChatClaim {
  id: string;
  chatId: string;
  comercialId: string;
  claimedAt: string;
  releasedAt?: string | null;
  status: 'active' | 'released';
}

export interface AvailableChatsResponse {
  chats: ChatData[];
  total: number;
}

export interface ClaimChatRequest {
  chatId: string;
  comercialId: string;
}

export interface ReleaseChatClaimRequest {
  chatId: string;
  comercialId: string;
}

export interface ClaimChatResponse {
  claim: ChatClaim;
  chat: ChatData;
}

// Eventos para el sistema de claims
export interface ChatClaimedEvent {
  chatId: string;
  comercialId: string;
  claimedAt: string;
}

export interface ChatReleaseEvent {
  chatId: string;
  comercialId: string;
  releasedAt: string;
}
