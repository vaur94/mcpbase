import * as path from 'node:path';

import { AppError } from '../core/app-error.js';

export interface SecurityConfig<
  TFeatures extends Record<string, boolean> = Record<string, boolean>,
> {
  features: TFeatures;
  commands: { allowed: string[] };
  paths: { allowed: string[] };
}

export function assertFeatureEnabled<TFeatures extends Record<string, boolean>>(
  security: SecurityConfig<TFeatures>,
  feature: keyof TFeatures,
): void {
  if (!security.features[feature]) {
    throw new AppError('PERMISSION_DENIED', `Feature is disabled: ${String(feature)}`);
  }
}

export function assertAllowedCommand(
  security: Pick<SecurityConfig, 'commands'>,
  command: string,
): void {
  const baseCommand = command.trim().split(/\s+/u)[0] ?? '';
  if (!security.commands.allowed.includes(baseCommand)) {
    throw new AppError('PERMISSION_DENIED', `Command is not allowed: ${baseCommand}`);
  }
}

export function assertAllowedPath(
  security: Pick<SecurityConfig, 'paths'>,
  targetPath: string,
): void {
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
