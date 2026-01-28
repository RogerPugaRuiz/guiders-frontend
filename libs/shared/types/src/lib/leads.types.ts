// Tipos principales para la integración de leads y CRM

// Datos de contacto del lead
export interface LeadContactData {
  id: string;
  visitorId: string;
  companyId: string;
  nombre?: string;
  apellidos?: string;
  email?: string;
  telefono?: string;
  dni?: string;
  poblacion?: string;
  additionalData?: Record<string, unknown>;
  extractedFromChatId?: string;
  extractedAt: string;
  updatedAt: string;
}

// Request para guardar datos de contacto
// NOTA: visitorId va en la URL del endpoint, NO en el body
export interface SaveContactDataRequest {
  nombre?: string;
  apellidos?: string;
  email?: string;
  telefono?: string;
  dni?: string;
  poblacion?: string;
  additionalData?: Record<string, unknown>;
  extractedFromChatId?: string;
}

// Tipos de CRM soportados
export type CrmType = 'leadcars' | 'hubspot' | 'salesforce';

// Configuración de CRM por empresa
export interface CrmCompanyConfig {
  id: string;
  companyId: string;
  crmType: CrmType;
  enabled: boolean;
  syncChatConversations: boolean;
  triggerEvents: string[];
  config: LeadCarsConfig | Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// Configuración específica de LeadCars
export interface LeadCarsConfig {
  clienteToken: string;
  useSandbox?: boolean;
  concesionarioId?: number;
  sedeId?: number;
  campanaId?: number;
  tipoLeadDefault?: string;
}

// Request para crear/actualizar configuración CRM
export interface CreateCrmConfigRequest {
  crmType: CrmType;
  enabled: boolean;
  syncChatConversations: boolean;
  triggerEvents: string[];
  config: Record<string, unknown>;
}

// Estados de sincronización
export type SyncStatus = 'pending' | 'synced' | 'failed' | 'partial';

// Registro de sincronización
export interface CrmSyncRecord {
  id: string;
  visitorId: string;
  companyId: string;
  crmType: CrmType;
  externalLeadId?: string;
  status: SyncStatus;
  lastSyncAt?: string;
  lastError?: string;
  retryCount: number;
  chatsSynced: string[];
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// Respuesta de test de conexión
export interface TestConnectionResponse {
  success: boolean;
  message: string;
}

// Respuesta de tipos CRM soportados
export interface SupportedCrmTypesResponse {
  supportedCrmTypes: CrmType[];
}

// Valores por defecto para LeadCars
export const LEADCARS_CONFIG_DEFAULTS: Partial<LeadCarsConfig> = {
  useSandbox: false,
  tipoLeadDefault: 'WEB',
};

// Eventos de trigger disponibles
export const AVAILABLE_TRIGGER_EVENTS = [
  'lifecycle_changed_to_lead',
  'chat_closed',
  'contact_data_updated',
] as const;

export type TriggerEvent = (typeof AVAILABLE_TRIGGER_EVENTS)[number];
