import { describe, it, expectTypeOf } from 'vitest';
import type {
  ProtocolVersion,
  PROTOCOL_VERSION,
} from './protocol-version';
import type {
  SectionName,
  ThemeColors,
  ThemeTypography,
  ThemeLogoAsset,
  ThemeLogos,
  ThemeConfig,
  FontWeight,
} from './theme.types';
import type {
  IframeCompany,
  IframeThemeSummary,
  IframeUser,
  IframeFeatureFlags,
  IframeRuntimeConfig,
  IframeInitResponse,
  IframeInitError,
  IframeInitErrorReason,
  IframeInitResult,
  AuthErrorReason,
} from './iframe-init.types';
import type {
  AllowedParentOrigin,
  MessageKind,
  EmbedConfig,
  UserInfo,
  ReauthCompletePayload,
  ReadyPayload,
  SessionExpiredPayload,
  AuthRequiredPayload,
  LogoutPayload,
  ProtocolMismatchPayload,
  MessagePayloads,
  PayloadFor,
  MessageEnvelope,
  PostMessage,
} from './post-message.types';

describe('protocol-version — type contracts', () => {
  it('PROTOCOL_VERSION is a literal type assignable to ProtocolVersion', () => {
    expectTypeOf<typeof PROTOCOL_VERSION>().toEqualTypeOf<ProtocolVersion>();
  });

  it('ProtocolVersion is a template-literal string type', () => {
    expectTypeOf<ProtocolVersion>().toEqualTypeOf<`${number}.${number}.${number}`>();
  });
});

describe('theme.types — type contracts', () => {
  it('SectionName covers the 5 known sections', () => {
    expectTypeOf<SectionName>().toEqualTypeOf<
      'chat' | 'escalations' | 'contacts' | 'visitors' | 'inbox'
    >();
  });

  it('ThemeColors has 9 entries', () => {
    expectTypeOf<ThemeColors>().toHaveProperty('primary');
    expectTypeOf<ThemeColors>().toHaveProperty('secondary');
    expectTypeOf<ThemeColors>().toHaveProperty('accent');
    expectTypeOf<ThemeColors>().toHaveProperty('textPrimary');
    expectTypeOf<ThemeColors>().toHaveProperty('textSecondary');
    expectTypeOf<ThemeColors>().toHaveProperty('background');
    expectTypeOf<ThemeColors>().toHaveProperty('surface');
    expectTypeOf<ThemeColors>().toHaveProperty('error');
    expectTypeOf<ThemeColors>().toHaveProperty('success');
  });

  it('FontWeight accepts 100-900 numerics and 4 keywords', () => {
    expectTypeOf<FontWeight>().toEqualTypeOf<
      | 100
      | 200
      | 300
      | 400
      | 500
      | 600
      | 700
      | 800
      | 900
      | 'normal'
      | 'bold'
      | 'lighter'
      | 'bolder'
    >();
  });

  it('ThemeTypography.headingFontWeight is FontWeight, not string', () => {
    expectTypeOf<ThemeTypography['headingFontWeight']>().toEqualTypeOf<FontWeight>();
    // Negative assertion: a value outside the union is a compile error.
    // @ts-expect-error — 'banana' is not a valid FontWeight
    const bad: ThemeTypography = { fontFamily: 'Inter', baseFontSize: '14px', headingFontWeight: 'banana' };
    void bad;
  });

  it('ThemeLogoAsset allows optional height and type', () => {
    expectTypeOf<ThemeLogoAsset>().toHaveProperty('url');
    expectTypeOf<ThemeLogoAsset['height']>().toEqualTypeOf<number | undefined>();
    expectTypeOf<ThemeLogoAsset['type']>().toEqualTypeOf<string | undefined>();
  });

  it('ThemeLogos has header, favicon, emptyState', () => {
    expectTypeOf<ThemeLogos>().toHaveProperty('header');
    expectTypeOf<ThemeLogos>().toHaveProperty('favicon');
    expectTypeOf<ThemeLogos>().toHaveProperty('emptyState');
  });

  it('ThemeConfig requires id, colors, typography, logos, enabledSections, customCss, componentMappings', () => {
    expectTypeOf<ThemeConfig>().toHaveProperty('id');
    expectTypeOf<ThemeConfig>().toHaveProperty('colors');
    expectTypeOf<ThemeConfig>().toHaveProperty('typography');
    expectTypeOf<ThemeConfig>().toHaveProperty('logos');
    expectTypeOf<ThemeConfig>().toHaveProperty('enabledSections');
    expectTypeOf<ThemeConfig>().toHaveProperty('customCss');
    expectTypeOf<ThemeConfig>().toHaveProperty('componentMappings');
  });
});

describe('iframe-init.types — type contracts', () => {
  it('AuthErrorReason is the shared 3-value union', () => {
    expectTypeOf<AuthErrorReason>().toEqualTypeOf<'expired' | 'missing' | 'invalid'>();
  });

  it('IframeInitErrorReason extends AuthErrorReason with 2 more', () => {
    expectTypeOf<IframeInitErrorReason>().toEqualTypeOf<
      AuthErrorReason | 'iframe_mode_disabled' | 'theme_not_found'
    >();
  });

  it('IframeUser.role uses backend identifiers (super_admin literal)', () => {
    expectTypeOf<IframeUser['role']>().toEqualTypeOf<
      'operator' | 'supervisor' | 'super_admin'
    >();
  });

  it('IframeFeatureFlags has 5 section-gated + 4 cross-cutting flags', () => {
    expectTypeOf<IframeFeatureFlags>().toHaveProperty('chatEnabled');
    expectTypeOf<IframeFeatureFlags>().toHaveProperty('escalationsEnabled');
    expectTypeOf<IframeFeatureFlags>().toHaveProperty('contactsEnabled');
    expectTypeOf<IframeFeatureFlags>().toHaveProperty('visitorsEnabled');
    expectTypeOf<IframeFeatureFlags>().toHaveProperty('inboxEnabled');
    expectTypeOf<IframeFeatureFlags>().toHaveProperty('fileAttachments');
    expectTypeOf<IframeFeatureFlags>().toHaveProperty('readReceipts');
    expectTypeOf<IframeFeatureFlags>().toHaveProperty('typingIndicators');
    expectTypeOf<IframeFeatureFlags>().toHaveProperty('aiSuggestions');
  });

  it('IframeInitError.reason is optional (accommodates 503 body shape)', () => {
    expectTypeOf<IframeInitError['reason']>().toEqualTypeOf<
      IframeInitErrorReason | undefined
    >();
  });

  it('IframeInitResult is a discriminated union by ok', () => {
    type Success = Extract<IframeInitResult, { ok: true }>;
    type Failure = Extract<IframeInitResult, { ok: false }>;
    expectTypeOf<Success>().toHaveProperty('response');
    expectTypeOf<Failure>().toHaveProperty('error');
  });
});

describe('post-message.types — type contracts', () => {
  it('MessageKind covers 8 kinds (3 parent→iframe + 5 iframe→parent)', () => {
    expectTypeOf<MessageKind>().toEqualTypeOf<
      | 'LEADCARS_USER_INFO'
      | 'LEADCARS_EMBED_CONFIG'
      | 'LEADCARS_REAUTH_COMPLETE'
      | 'GUIDERS_READY'
      | 'GUIDERS_SESSION_EXPIRED'
      | 'GUIDERS_AUTH_REQUIRED'
      | 'GUIDERS_LOGOUT'
      | 'GUIDERS_PROTOCOL_MISMATCH'
    >();
  });

  it('EmbedConfig.features is keyof IframeFeatureFlags (typo-proof)', () => {
    expectTypeOf<NonNullable<EmbedConfig['features']>>().toEqualTypeOf<
      ReadonlyArray<keyof IframeFeatureFlags>
    >();
    // @ts-expect-error — 'totally_made_up_flag' is not a key of IframeFeatureFlags
    const bad: EmbedConfig = { features: ['totally_made_up_flag'], timestamp: 0 };
    void bad;
  });

  it('EmbedConfig.timestamp is required while other fields are optional', () => {
    // @ts-expect-error — timestamp is required
    const bad: EmbedConfig = { language: 'es' };
    void bad;
    const ok: EmbedConfig = { timestamp: 0 };
    expectTypeOf(ok).toEqualTypeOf<EmbedConfig>();
  });

  it('AuthRequiredPayload.reason is AuthErrorReason (shared union, F7)', () => {
    expectTypeOf<AuthRequiredPayload['reason']>().toEqualTypeOf<AuthErrorReason>();
  });

  it('AllowedParentOrigin template literal accepts any https://* string', () => {
    // Compile-time assertion: the branded type accepts the pattern.
    // Runtime validation is the PostMessageHandler's job.
    const a: AllowedParentOrigin = 'https://leadcars.com';
    const b: AllowedParentOrigin = 'https://';
    expectTypeOf(a).toEqualTypeOf<AllowedParentOrigin>();
    expectTypeOf(b).toEqualTypeOf<AllowedParentOrigin>();
  });

  it('MessagePayloads is exhaustive over MessageKind (F9)', () => {
    // All 8 kinds must be present.
    expectTypeOf<MessagePayloads['LEADCARS_USER_INFO']>().toEqualTypeOf<UserInfo>();
    expectTypeOf<MessagePayloads['LEADCARS_EMBED_CONFIG']>().toEqualTypeOf<EmbedConfig>();
    expectTypeOf<MessagePayloads['LEADCARS_REAUTH_COMPLETE']>().toEqualTypeOf<ReauthCompletePayload>();
    expectTypeOf<MessagePayloads['GUIDERS_READY']>().toEqualTypeOf<ReadyPayload>();
    expectTypeOf<MessagePayloads['GUIDERS_SESSION_EXPIRED']>().toEqualTypeOf<SessionExpiredPayload>();
    expectTypeOf<MessagePayloads['GUIDERS_AUTH_REQUIRED']>().toEqualTypeOf<AuthRequiredPayload>();
    expectTypeOf<MessagePayloads['GUIDERS_LOGOUT']>().toEqualTypeOf<LogoutPayload>();
    expectTypeOf<MessagePayloads['GUIDERS_PROTOCOL_MISMATCH']>().toEqualTypeOf<ProtocolMismatchPayload>();
  });

  it('PayloadFor<T> maps correctly to the matching payload type', () => {
    expectTypeOf<PayloadFor<'LEADCARS_USER_INFO'>>().toEqualTypeOf<UserInfo>();
    expectTypeOf<PayloadFor<'GUIDERS_AUTH_REQUIRED'>>().toEqualTypeOf<AuthRequiredPayload>();
  });

  it('MessageEnvelope<T> is a discriminated union via type field', () => {
    type E<T extends MessageKind> = MessageEnvelope<T>;
    const e1: E<'LEADCARS_USER_INFO'> = {
      type: 'LEADCARS_USER_INFO',
      version: '1.0.0',
      requestId: 'r',
      timestamp: 0,
      payload: { userId: 'u', userName: 'A', timestamp: 0 },
    };
    expectTypeOf(e1.type).toEqualTypeOf<'LEADCARS_USER_INFO'>();
  });

  it('PostMessage is the concrete discriminated union of all envelopes', () => {
    // Compile-time check: the type compiles, and each member has a
    // distinct `type` field.
    type DistinguishUnion<T> = T extends { type: infer U } ? U : never;
    expectTypeOf<DistinguishUnion<PostMessage>>().toEqualTypeOf<MessageKind>();
  });
});
