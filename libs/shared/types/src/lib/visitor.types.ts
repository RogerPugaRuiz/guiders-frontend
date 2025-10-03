// Enums y tipos para visitantes
export type VisitorLifecycle = 'ANON' | 'ENGAGED' | 'LEAD' | 'CONVERTED';
export type VisitorStatus = 'online' | 'offline' | 'idle';
export type SessionStatus = 'active' | 'inactive' | 'ended';

// Interface principal para visitante
export interface Visitor {
  id: string;
  fingerprint?: string;
  sessionId?: string;
  lifecycle: VisitorLifecycle;
  isNewVisitor: boolean;
  
  // Información personal (opcional)
  name?: string;
  email?: string;
  phone?: string;
  
  // Información de sesión
  status: VisitorStatus;
  currentUrl?: string;
  domain: string;
  siteId: string;
  tenantId: string;
  
  // Metadata de tracking
  userAgent?: string;
  ipAddress?: string;
  country?: string;
  city?: string;
  referrer?: string;
  source?: string;
  
  // Información de intenciones
  intents?: VisitorIntent[];
  tags?: VisitorTag[];
  
  // Timestamps
  firstVisit: Date;
  lastVisit: Date;
  currentSessionStart?: Date;
  
  // Estadísticas
  totalSessions: number;
  totalPageViews: number;
  averageSessionDuration: number;
  
  // Estado de chat
  hasActiveChat: boolean;
  lastChatId?: string;
  totalChats: number;
  pendingChatIds?: string[]; // IDs de chats pendientes
  
  // Para UI
  isSelected?: boolean;
}

// Interface para sesión de visitante
export interface VisitorSession {
  id: string;
  visitorId: string;
  status: SessionStatus;
  startTime: Date;
  endTime?: Date;
  duration?: number; // en segundos
  
  // Información de la sesión
  pages: PageView[];
  events: VisitorEvent[];
  
  // Metadata
  userAgent: string;
  ipAddress: string;
  referrer?: string;
  
  // Estadísticas
  pageViews: number;
  timeOnSite: number; // en segundos
  bounceRate?: number;
}

// Interface para página vista
export interface PageView {
  id: string;
  sessionId: string;
  url: string;
  title?: string;
  timestamp: Date;
  timeOnPage?: number; // en segundos
  exitPage?: boolean;
}

// Interface para eventos de visitante
export interface VisitorEvent {
  id: string;
  sessionId: string;
  type: 'click' | 'scroll' | 'form_submit' | 'download' | 'exit_intent' | 'custom';
  category: string;
  action: string;
  label?: string;
  value?: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

// Interface para intenciones de visitante
export interface VisitorIntent {
  id: string;
  visitorId: string;
  category: string;
  subcategory?: string;
  confidence: number; // 0-1
  description?: string;
  detectedAt: Date;
  source: 'behavior' | 'explicit' | 'ai_analysis';
}

// Interface para tags de visitante
export interface VisitorTag {
  id: string;
  name: string;
  category: string;
  confidence?: number;
  addedAt: Date;
  addedBy?: 'system' | 'commercial' | 'ai';
}

// Tipos para filtros de visitantes
export interface VisitorFilters {
  status?: VisitorStatus[];
  lifecycle?: VisitorLifecycle[];
  hasActiveChat?: boolean;
  hasPendingChats?: boolean;
  siteId?: string;
  includeOffline?: boolean;
  department?: string;
  tags?: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  search?: string;
}

// Tipos para ordenamiento
export interface VisitorSort {
  field: 'lastVisit' | 'firstVisit' | 'name' | 'totalChats' | 'lifecycle';
  direction: 'asc' | 'desc';
}

// Tipos para paginación
export interface VisitorPagination {
  limit: number;
  offset?: number;
  cursor?: string;
  totalCount?: number; // Total de registros disponibles
  currentPage?: number; // Página actual (calculada desde offset)
}

// Respuestas de la API
export interface GetVisitorsResponse {
  visitors: Visitor[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

// Tipo para visitante en el contexto de tenant-visitors
export interface TenantVisitor {
  id: string;
  fingerprint: string;
  connectionStatus: "ONLINE" | "OFFLINE";
  siteId: string;
  siteName: string;
  createdAt: string;
  lastActivity: string;
  pendingChatIds: string[];
}

// Respuesta del endpoint tenant-visitors
export interface GetTenantVisitorsResponse {
  tenantId: string;
  companyName: string;
  visitors: TenantVisitor[];
  totalCount: number;
  activeSitesCount: number;
  timestamp: string;
}

export interface GetVisitorResponse {
  visitor: Visitor;
  sessions: VisitorSession[];
  currentSession?: VisitorSession;
}

export interface GetVisitorSessionsResponse {
  sessions: VisitorSession[];
  total: number;
  activeSession?: VisitorSession;
}

export interface IdentifyVisitorRequest {
  fingerprint: string;
  domain: string;
  apiKey: string;
  currentUrl?: string;
}

export interface IdentifyVisitorResponse {
  visitorId: string;
  sessionId: string;
  lifecycle: VisitorLifecycle;
  isNewVisitor: boolean;
}

export interface HeartbeatRequest {
  sessionId?: string;
  visitorId?: string;
}

export interface HeartbeatResponse {
  success: boolean;
  message: string;
}

export interface EndSessionRequest {
  sessionId?: string;
  visitorId?: string;
  reason?: string;
}

export interface EndSessionResponse {
  success: boolean;
  message: string;
}

// Tipos para crear chat con visitante
export interface CreateChatWithVisitorRequest {
  visitorId: string;
  firstMessage?: {
    content: string;
    type?: 'TEXT' | 'IMAGE' | 'FILE';
  };
  visitorInfo?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  metadata?: {
    department?: string;
    source?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  };
}

export interface CreateChatWithVisitorResponse {
  chatId: string;
  messageId?: string;
  position: number;
}

// Tipos para estadísticas de visitantes
export interface VisitorStats {
  totalVisitors: number;
  onlineVisitors: number;
  newVisitors: number;
  returningVisitors: number;
  withPendingChats: number;
  averageSessionDuration: number;
  bounceRate: number;
  conversionRate: number;
  topPages: Array<{
    url: string;
    title?: string;
    views: number;
  }>;
  topSources: Array<{
    source: string;
    visitors: number;
  }>;
}

// Interface para el estado del componente de visitantes
export interface VisitorState {
  visitors: Visitor[];
  selectedVisitor: Visitor | null;
  filters: VisitorFilters;
  sort: VisitorSort;
  pagination: VisitorPagination;
  loading: boolean;
  error: string | null;
  stats: VisitorStats | null;
  searchQuery: string;
}