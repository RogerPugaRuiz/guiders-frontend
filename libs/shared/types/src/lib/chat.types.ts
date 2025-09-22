export interface User {
  id: string;
  name: string;
  avatar?: string;
  email?: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen?: Date;
  role: 'admin' | 'commercial' | 'visitor';
}

export interface Message {
  messageId: string; // API usa messageId
  chatId: string;
  senderId: string;
  senderType: 'COMMERCIAL' | 'VISITOR' | 'SYSTEM'; // API usa senderType
  content: string;
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'AUDIO' | 'VIDEO' | 'SYSTEM'; // API usa mayúsculas
  sentAt: Date; // API usa sentAt en lugar de timestamp
  status: 'SENT' | 'DELIVERED' | 'READ'; // API usa mayúsculas, no tiene 'sending'
  replyTo?: string; // ID del mensaje al que responde
  edited?: boolean;
  editedAt?: Date;
  metadata?: {
    fileName?: string;
    fileSize?: number;
    fileType?: string;
    imageUrl?: string;
    audioUrl?: string;
    videoDuration?: number;
  };
}

export interface Chat {
  chatId: string; // API usa chatId
  status: 'PENDING' | 'ACTIVE' | 'CLOSED' | 'TRANSFERRED'; // Estados de la API
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'; // Prioridades de la API
  department?: string; // Departamento de la API
  subject?: string; // Asunto del chat
  visitorId: string; // ID del visitante
  commercialId?: string; // ID del comercial asignado
  queuePosition?: number; // Posición en cola
  estimatedWaitTime?: number; // Tiempo estimado de espera en segundos
  lastMessage?: Message;
  unreadCount: number;
  isTyping: boolean;
  typingUsers: User[];
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
  // Propiedades adicionales para UI
  participants: User[]; // Calculado a partir de visitorId y commercialId
  name?: string; // Nombre calculado para mostrar
  avatar?: string; // Avatar calculado para mostrar
  archived: boolean;
  muted: boolean;
  pinned: boolean;
}

export interface ChatState {
  chats: Chat[];
  selectedChatId: string | null;
  messages: { [chatId: string]: Message[] };
  loading: boolean;
  error: string | null;
  searchQuery: string;
  filteredChats: Chat[];
}

export interface TypingIndicator {
  chatId: string;
  userId: string;
  userName: string;
  timestamp: Date;
}

export interface ChatConfig {
  autoRead: boolean;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  theme: 'light' | 'dark' | 'auto';
  fontSize: 'small' | 'medium' | 'large';
  showTimestamps: boolean;
  showAvatar: boolean;
}

// Tipos para las peticiones a la API
export interface CreateChatRequest {
  department?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  subject?: string;
}

export interface CreateChatWithMessageRequest {
  chat: CreateChatRequest;
  message: {
    content: string;
    type: 'TEXT' | 'IMAGE' | 'FILE' | 'AUDIO' | 'VIDEO';
  };
}

export interface SendMessageRequest {
  chatId: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'AUDIO' | 'VIDEO';
}

export interface MarkAsReadRequest {
  messageIds: string[];
}

// Tipos para las respuestas de la API
export interface CreateChatResponse {
  chatId: string;
  status: string;
  queuePosition?: number;
  estimatedWaitTime?: number;
}

export interface SendMessageResponse {
  messageId: string;
  chatId: string;
  senderId: string;
  senderType: string;
  content: string;
  sentAt: string;
  status: string;
}

export interface GetChatsResponse {
  chats: Chat[];
  pagination?: {
    hasNext: boolean;
    cursor?: string;
    total?: number;
  };
}

export interface GetMessagesResponse {
  messages: Message[];
  pagination?: {
    hasNext: boolean;
    cursor?: string;
    total?: number;
  };
}