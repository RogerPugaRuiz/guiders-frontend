export interface ChatData {
  id: string;
  participants: Participant[];
  status: 'active' | 'inactive' | 'closed' | 'waiting';
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
  type: 'text' | 'image' | 'file' | 'system';
  timestamp: Date;
  isRead: boolean;
  metadata?: Record<string, any>;
}

export interface ChatListResponse {
  data: ChatData[];
  pagination: {
    cursor?: string;
    nextCursor?: string;
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
