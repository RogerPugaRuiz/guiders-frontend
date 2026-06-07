/**
 * White-label iframe contract types.
 *
 * Import this lib explicitly to consume the multi-tenant contract:
 *
 *   import { PROTOCOL_VERSION, IframeInitResponse } from '@guiders-frontend/shared/types/iframe';
 *
 * This barrel re-exports from the four sub-modules in `./lib/`
 * (protocol-version, theme.types, iframe-init.types, post-message.types).
 *
 * It does **NOT** re-export from the parent `libs/shared/types` barrel
 * (`@guiders-frontend/shared/types`). Consumers must import the iframe
 * contract from its dedicated path to keep the type graph explicit and
 * prevent accidental coupling between white-label types and the rest of
 * the app's domain types.
 */
export * from './lib/protocol-version';
export * from './lib/theme.types';
export * from './lib/iframe-init.types';
export * from './lib/post-message.types';
