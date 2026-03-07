export {
  assertFeatureEnabled,
  assertAllowedCommand,
  assertAllowedPath,
} from '../security/guards.js';

export const PERMISSION_DENIED = 'PERMISSION_DENIED' as const;
export type PermissionDeniedCode = typeof PERMISSION_DENIED;
