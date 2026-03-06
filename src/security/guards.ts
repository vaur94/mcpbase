import * as path from 'node:path';

import { AppError } from '../core/app-error.js';
import type { RuntimeConfig } from '../contracts/runtime-config.js';

export type SecurityConfig = RuntimeConfig['security'];

export function assertFeatureEnabled(
  security: SecurityConfig,
  feature: keyof SecurityConfig['features'],
): void {
  if (!security.features[feature]) {
    throw new AppError('PERMISSION_DENIED', `Feature is disabled: ${feature}`);
  }
}

export function assertAllowedCommand(security: SecurityConfig, command: string): void {
  const baseCommand = command.trim().split(/\s+/u)[0] ?? '';
  if (!security.commands.allowed.includes(baseCommand)) {
    throw new AppError('PERMISSION_DENIED', `Command is not allowed: ${baseCommand}`);
  }
}

export function assertAllowedPath(security: SecurityConfig, targetPath: string): void {
  const normalizedTarget = path.resolve(targetPath);
  const allowedRoots = security.paths.allowed.map((value) => path.resolve(value));

  if (
    !allowedRoots.some(
      (root) => normalizedTarget === root || normalizedTarget.startsWith(`${root}${path.sep}`),
    )
  ) {
    throw new AppError('PERMISSION_DENIED', `Path is not allowed: ${normalizedTarget}`);
  }
}
