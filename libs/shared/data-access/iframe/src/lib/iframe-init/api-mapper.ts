import type {
  IframeInitResponse,
  IframeInitError,
  IframeCompany,
  IframeThemeSummary,
  IframeUser,
  IframeFeatureFlags,
  IframeRuntimeConfig,
  ProtocolVersion,
  IframeInitErrorReason,
} from '@guiders-frontend/shared/types/iframe';
import { isSectionName, checkCompatibility, PROTOCOL_VERSION } from '@guiders-frontend/shared/types/iframe';

const VALID_ERROR_REASONS: readonly IframeInitErrorReason[] = [
  'expired',
  'missing',
  'invalid',
  'iframe_mode_disabled',
  'theme_not_found',
  'network_error',
  'timeout',
  'server_error',
  'protocol_mismatch',
  'not_initialized',
];

function isValidErrorReason(value: string): value is IframeInitErrorReason {
  return VALID_ERROR_REASONS.includes(value as IframeInitErrorReason);
}

export class VersionError extends Error {
  readonly version: string;
  constructor(version: string) {
    super(`validateVersion: incompatible version ${version}`);
    this.name = 'VersionError';
    this.version = version;
  }
}

function validateVersion(version: string): ProtocolVersion {
  const compat = checkCompatibility(PROTOCOL_VERSION, version);
  if (compat.action === 'reject') {
    throw new VersionError(version);
  }
  return version as ProtocolVersion;
}

/**
 * Backend response shape (snake_case keys) for `/api/v1/iframe/init`.
 * Used only as input to the mapper — never exported.
 */
interface ApiIframeInitResponse {
  company: {
    id: string;
    name: string;
    subdomain: string;
    logo: { url: string; alt: string };
    support_email: string;
  };
  theme: ApiIframeThemeSummary | null;
  features: Record<string, boolean>;
  user: {
    id: string;
    name: string;
    role: 'operator' | 'supervisor' | 'super_admin';
    avatar: string;
    permissions: string[];
  };
  config: {
    session_timeout: number;
    max_file_size: number;
    allowed_file_types: string[];
  };
  version: string;
}

interface ApiIframeThemeSummary {
  id: string;
  name: string;
  config: ApiThemeConfig;
}

interface ApiThemeConfig {
  id: string;
  colors: Record<string, string>;
  typography: Record<string, string | number>;
  logos: {
    header: { url: string; height?: number; type?: string };
    favicon: { url: string; height?: number; type?: string };
    emptyState: { url: string; height?: number; type?: string };
  };
  enabled_sections: string[];
  custom_css: string;
  component_mappings: Record<string, string>;
}

/**
 * Maps an API error body to the canonical `IframeInitError` shape.
 * @param raw - Raw error object from HTTP error response
 * @returns Canonical error shape
 */
export function mapApiErrorToCanonical(raw: unknown): IframeInitError {
  if (typeof raw !== 'object' || raw === null) {
    return {};
  }
  const obj = raw as Record<string, unknown>;
  const reason = typeof obj.reason === 'string' && isValidErrorReason(obj.reason) ? obj.reason : undefined;
  return {
    reason,
    message: typeof obj.message === 'string' ? obj.message : undefined,
    fallbackTheme: obj.fallbackTheme as IframeInitError['fallbackTheme'],
    retryAfter: typeof obj.retryAfter === 'number' ? obj.retryAfter : undefined,
  };
}

/**
 * Maps the snake_case API response to the canonical camelCase `IframeInitResponse`.
 *
 * Backend field → Angular field mapping:
 *   company.id            → company.id
 *   company.name          → company.name
 *   company.subdomain     → company.subdomain
 *   company.logo → company.logo
 *   company.support_email → company.supportEmail
 *   theme → theme (null | mapped)
 *   features → features (snake_key → camelKey)
 *   user                  → user
 *   config.session_timeout → config.sessionTimeout
 *   config.max_file_size   → config.maxFileSize
 *   config.allowed_file_types → config.allowedFileTypes
 *   version               → version
 *
 * @param raw - Raw API response object
 * @throws TypeError if input is not a valid object
 */
export function mapApiResponseToCanonical(raw: unknown): IframeInitResponse {
  if (typeof raw !== 'object' || raw === null) {
    throw new TypeError('mapApiResponseToCanonical: expected a non-null object');
  }
  const api = raw as ApiIframeInitResponse;

  return {
    company: mapCompany(api.company),
    theme: api.theme ? mapTheme(api.theme) : null,
    features: mapFeatures(api.features),
    user: mapUser(api.user),
    config: mapRuntimeConfig(api.config),
    version: validateVersion(api.version),
  };
}

function mapCompany(api: ApiIframeInitResponse['company']): IframeCompany {
  return {
    id: api.id,
    name: api.name,
    subdomain: api.subdomain,
    logo: { url: api.logo.url, alt: api.logo.alt },
    supportEmail: api.support_email,
  };
}

function mapTheme(api: ApiIframeThemeSummary): IframeThemeSummary {
  return {
    id: api.id,
    name: api.name,
    config: mapThemeConfig(api.config),
  };
}

function mapThemeConfig(api: ApiThemeConfig): import('@guiders-frontend/shared/types/iframe').ThemeConfig {
  return {
    id: api.id,
    colors: {
      primary: api.colors.primary ?? api.colors['primary'] ?? '',
      secondary: api.colors.secondary ?? api.colors['secondary'] ?? '',
      accent: api.colors.accent ?? api.colors['accent'] ?? '',
      textPrimary: api.colors.textPrimary ?? api.colors['text_primary'] ?? '',
      textSecondary: api.colors.textSecondary ?? api.colors['text_secondary'] ?? '',
      background: api.colors.background ?? api.colors['background'] ?? '',
      surface: api.colors.surface ?? api.colors['surface'] ?? '',
      error: api.colors.error ?? api.colors['error'] ?? '',
      success: api.colors.success ?? api.colors['success'] ?? '',
    },
    typography: {
      fontFamily: (api.typography['font_family'] ?? api.typography.fontFamily) as string,
      baseFontSize: (api.typography['base_font_size'] ?? api.typography.baseFontSize) as string,
      headingFontWeight: mapFontWeight(api.typography['heading_font_weight'] ?? api.typography.headingFontWeight),
    },
    logos: {
      header: {
        url: api.logos.header.url,
        height: api.logos.header.height,
        type: api.logos.header.type,
      },
      favicon: {
        url: api.logos.favicon.url,
        height: api.logos.favicon.height,
        type: api.logos.favicon.type,
      },
      emptyState: {
        url: api.logos.emptyState.url,
        height: api.logos.emptyState.height,
        type: api.logos.emptyState.type,
      },
    },
    enabledSections: api.enabled_sections.filter(isSectionName),
    customCss: api.custom_css,
    componentMappings: api.component_mappings,
  };
}

function mapFontWeight(value: string | number | undefined): import('@guiders-frontend/shared/types/iframe').FontWeight {
  if (value === undefined || value === null) return 400;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed)) return parsed;
    const weightMap: Record<string, number> = {
      normal: 400,
      bold: 700,
      lighter: 300,
      bolder: 800,
    };
    return weightMap[value] ?? 400;
  }
  return 400;
}

function mapFeatures(api: Record<string, boolean>): IframeFeatureFlags {
  return {
    chatEnabled: api['chat_enabled'] ?? api.chatEnabled ?? false,
    escalationsEnabled: api['escalations_enabled'] ?? api.escalationsEnabled ?? false,
    contactsEnabled: api['contacts_enabled'] ?? api.contactsEnabled ?? false,
    visitorsEnabled: api['visitors_enabled'] ?? api.visitorsEnabled ?? false,
    inboxEnabled: api['inbox_enabled'] ?? api.inboxEnabled ?? false,
    fileAttachments: api['file_attachments'] ?? api.fileAttachments ?? false,
    readReceipts: api['read_receipts'] ?? api.readReceipts ?? false,
    typingIndicators: api['typing_indicators'] ?? api.typingIndicators ?? false,
    aiSuggestions: api['ai_suggestions'] ?? api.aiSuggestions ?? false,
  };
}

function mapUser(api: ApiIframeInitResponse['user']): IframeUser {
  return {
    id: api.id,
    name: api.name,
    role: api.role,
    avatar: api.avatar,
    permissions: api.permissions,
  };
}

function mapRuntimeConfig(api: ApiIframeInitResponse['config']): IframeRuntimeConfig {
  return {
    sessionTimeout: api.session_timeout,
    maxFileSize: api.max_file_size,
    allowedFileTypes: api.allowed_file_types,
  };
}
