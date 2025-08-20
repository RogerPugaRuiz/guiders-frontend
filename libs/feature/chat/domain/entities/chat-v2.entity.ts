/**
 * Entidades y tipos específicos para la API V2 de Chat
 * Basados en las especificaciones del backend conversations-v2
 */

/**
 * Información del visitante en formato V2
 */
export interface VisitorInfoV2 {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  additionalData?: Record<string, any>;
}

/**
 * Metadatos del chat en formato V2
 */
export interface ChatMetadataV2 {
  department: string;
  source: string;
  initialUrl?: string;
  userAgent?: string;
  referrer?: string;
  tags?: Record<string, any>;
  customFields?: Record<string, any>;
}

/**
 * Estados disponibles para un chat en V2
 */
export type ChatStatusV2 = 'PENDING' | 'ASSIGNED' | 'ACTIVE' | 'CLOSED' | 'TRANSFERRED' | 'ABANDONED';

/**
 * Prioridades disponibles para un chat en V2
 */
export type ChatPriorityV2 = 'LOW' | 'MEDIUM' | 'NORMAL' | 'HIGH' | 'URGENT';

/**
 * Estados de resolución para un chat en V2
 */
export type ResolutionStatusV2 = 'resolved' | 'unresolved' | 'escalated';

/**
 * Chat en formato V2 (estructura optimizada del backend)
 */
export interface ChatV2 {
  id: string;
  status: ChatStatusV2;
  priority: ChatPriorityV2;
  visitorInfo: VisitorInfoV2;
  assignedCommercialId?: string;
  availableCommercialIds?: string[];
  metadata: ChatMetadataV2;
  createdAt: Date;
  assignedAt?: Date;
  closedAt?: Date;
  lastMessageDate?: Date;
  totalMessages: number;
  unreadMessagesCount: number;
  isActive: boolean;
  visitorId: string;
  department: string;
  tags?: string[];
  updatedAt?: Date;
  averageResponseTimeMinutes?: number;
  chatDurationMinutes?: number;
  resolutionStatus?: ResolutionStatusV2;
  satisfactionRating?: number;
}

/**
 * Respuesta de la API V2 para lista de chats con paginación cursor
 */
export interface ChatListResponseV2 {
  chats: ChatV2[];
  total: number;
  hasMore: boolean;
  nextCursor?: string | null;
}

/**
 * Parámetros para obtener chats con filtros V2
 */
export interface GetChatsV2Params {
  cursor?: string;
  limit?: number;
  filters?: {
    status?: ChatStatusV2[];
    priority?: ChatPriorityV2[];
    visitorId?: string;
    commercialId?: string;
    department?: string;
    dateFrom?: Date;
    dateTo?: Date;
    tags?: string[];
  };
  sort?: {
    field: 'createdAt' | 'lastMessageDate' | 'priority' | 'status';
    direction: 'asc' | 'desc';
  };
}

/**
 * Métricas de comercial en V2
 */
export interface CommercialMetricsV2 {
  totalChats: number;
  activeChats: number;
  closedChats: number;
  averageResponseTime: number;
  totalMessages: number;
  averageChatDuration: number;
  resolutionRate: number;
}

/**
 * Estadísticas de tiempo de respuesta en V2
 */
export interface ResponseTimeStatsV2 {
  period: string;
  avgResponseTime: number;
  count: number;
}

/**
 * Funciones de mapeo entre V2 y V1 para compatibilidad
 */

import { Chat, Participant, ChatStatus } from './chat.entity';

/**
 * Convierte un ChatV2 al formato Chat legacy (V1) para compatibilidad
 */
export function mapChatV2ToV1(chatV2: ChatV2): Chat {
  // Mapear participantes
  const participants: Participant[] = [];
  
  // Agregar visitante
  participants.push({
    id: chatV2.visitorInfo.id,
    name: chatV2.visitorInfo.name,
    isVisitor: true,
    isCommercial: false,
    isOnline: chatV2.isActive,
    assignedAt: chatV2.assignedAt?.toISOString() || new Date().toISOString(),
    lastSeenAt: chatV2.lastMessageDate?.toISOString() || null,
    isViewing: chatV2.isActive,
    isTyping: false,
    isAnonymous: !chatV2.visitorInfo.email
  });

  // Agregar comercial asignado si existe
  if (chatV2.assignedCommercialId) {
    participants.push({
      id: chatV2.assignedCommercialId,
      name: `Comercial ${chatV2.assignedCommercialId}`,
      isCommercial: true,
      isVisitor: false,
      isOnline: chatV2.isActive,
      assignedAt: chatV2.assignedAt?.toISOString() || new Date().toISOString(),
      lastSeenAt: chatV2.lastMessageDate?.toISOString() || null,
      isViewing: chatV2.isActive,
      isTyping: false,
      isAnonymous: false
    });
  }

  // Mapear status
  let status: ChatStatus;
  switch (chatV2.status) {
    case 'PENDING':
      status = 'pending';
      break;
    case 'ASSIGNED':
    case 'ACTIVE':
      status = 'active';
      break;
    case 'CLOSED':
      status = 'closed';
      break;
    case 'TRANSFERRED':
      status = 'inactive'; // Mapear a un estado válido
      break;
    case 'ABANDONED':
      status = 'inactive'; // Mapear a un estado válido
      break;
    default:
      status = 'pending';
  }

  return {
    id: chatV2.id,
    participants,
    status,
    lastMessage: null, // Se puede obtener por separado si es necesario
    lastMessageAt: chatV2.lastMessageDate?.toISOString() || null,
    createdAt: chatV2.createdAt.toISOString()
  };
}

/**
 * Convierte una ChatListResponseV2 al formato ChatListResponse legacy (V1)
 */
export function mapChatListV2ToV1(responseV2: ChatListResponseV2): import('./chat.entity').ChatListResponse {
  return {
    data: responseV2.chats.map(mapChatV2ToV1),
    pagination: {
      hasMore: responseV2.hasMore,
      limit: responseV2.chats.length,
      total: responseV2.total,
      nextCursor: responseV2.nextCursor || undefined
    }
  };
}

/**
 * Convierte parámetros V1 a parámetros V2
 */
export function mapGetChatsParamsToV2(paramsV1?: import('./chat.entity').GetChatsParams): GetChatsV2Params {
  if (!paramsV1) {
    return {};
  }

  return {
    cursor: paramsV1.cursor,
    limit: paramsV1.limit,
    // Los filtros V1 son más simples, se mapean a la estructura V2
    filters: {
      // En V1 no hay filtros específicos, pero se puede agregar lógica aquí
    },
    sort: {
      field: 'lastMessageDate',
      direction: 'desc'
    }
  };
}
