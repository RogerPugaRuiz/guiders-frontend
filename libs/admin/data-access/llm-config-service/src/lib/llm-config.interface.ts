export interface LlmToolConfig {
  fetchPageEnabled: boolean;
  baseUrl: string;
  allowedPaths: string[];
  maxIterations: number;
  fetchTimeoutMs: number;
  cacheEnabled: boolean;
  cacheTtlSeconds: number;
}

export const LLM_TOOL_CONFIG_DEFAULTS: LlmToolConfig = {
  fetchPageEnabled: false,
  baseUrl: '',
  allowedPaths: [],
  maxIterations: 3,
  fetchTimeoutMs: 10000,
  cacheEnabled: true,
  cacheTtlSeconds: 3600
};

export interface LlmConfig {
  siteId: string;
  companyId: string;
  aiAutoResponseEnabled: boolean;
  aiSuggestionsEnabled: boolean;
  aiRespondWithCommercial: boolean;
  preferredProvider: string;
  preferredModel: string;
  customSystemPrompt?: string;
  maxResponseTokens: number;
  temperature: number;
  responseDelayMs: number;
  toolConfig?: LlmToolConfig;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateLlmConfigRequest {
  siteId: string;
  companyId: string;
  aiAutoResponseEnabled?: boolean;
  aiSuggestionsEnabled?: boolean;
  aiRespondWithCommercial?: boolean;
  preferredProvider?: string;
  preferredModel?: string;
  customSystemPrompt?: string;
  maxResponseTokens?: number;
  temperature?: number;
  responseDelayMs?: number;
}

export interface UpdateLlmConfigRequest {
  aiAutoResponseEnabled?: boolean;
  aiSuggestionsEnabled?: boolean;
  aiRespondWithCommercial?: boolean;
  preferredProvider?: string;
  preferredModel?: string;
  customSystemPrompt?: string | null;
  maxResponseTokens?: number;
  temperature?: number;
  responseDelayMs?: number;
  toolConfig?: LlmToolConfig;
}

export interface LlmModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  maxContextTokens: number;
  isActive: boolean;
  isDefault?: boolean;
}

export interface LlmProvider {
  id: string;
  name: string;
  isActive: boolean;
  models: LlmModel[];
}

export interface LlmProvidersResponse {
  providers: LlmProvider[];
  defaultModel: string;
  defaultProvider: string;
}

export const LLM_CONFIG_DEFAULTS: Omit<LlmConfig, 'siteId' | 'companyId'> = {
  aiAutoResponseEnabled: true,
  aiSuggestionsEnabled: true,
  aiRespondWithCommercial: false,
  preferredProvider: 'groq',
  preferredModel: 'llama-3.3-70b-versatile',
  maxResponseTokens: 500,
  temperature: 0.7,
  responseDelayMs: 1000
};
