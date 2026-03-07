export { assertFeatureEnabled, assertAllowedCommand, assertAllowedPath } from './guards.js';
export { createSecurityEnforcementHook } from './tool-security.js';

export type { SecurityConfig } from './guards.js';
export type { SecureToolDefinition, ToolSecurityDefinition } from './tool-security.js';
export const PERMISSION_DENIED = 'PERMISSION_DENIED' as const;
export type PermissionDeniedCode = typeof PERMISSION_DENIED;
