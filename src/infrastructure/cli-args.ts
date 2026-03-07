import { AppError } from '../core/app-error.js';
import { logLevelSchema, type PartialRuntimeConfig } from '../contracts/runtime-config.js';
import { deepMerge } from '../shared/merge.js';

export interface CliParseResult<TOverrides extends Record<string, unknown> = PartialRuntimeConfig> {
  readonly configPath?: string;
  readonly overrides: PartialRuntimeConfig & TOverrides;
}

function expectValue(argv: string[], index: number, flag: string): string {
  const next = argv[index + 1];
  if (!next || next.startsWith('--')) {
    throw new AppError('CONFIG_ERROR', `${flag} expects a value.`);
  }

  return next;
}

function parseBoolean(value: string): boolean {
  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  throw new AppError('CONFIG_ERROR', `Invalid boolean value: ${value}`);
}

export function parseCliArgs<TOverrides extends Record<string, unknown> = PartialRuntimeConfig>(
  argv: string[],
  cliMapper?: (args: string[]) => TOverrides,
): CliParseResult<TOverrides> {
  const overrides: PartialRuntimeConfig = {};
  let configPath: string | undefined;
  let unknownArgument: string | undefined;

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token) {
      continue;
    }

    switch (token) {
      case '--config': {
        configPath = expectValue(argv, index, token);
        index += 1;
        break;
      }
      case '--server-name': {
        overrides.server = { ...(overrides.server ?? {}), name: expectValue(argv, index, token) };
        index += 1;
        break;
      }
      case '--server-version': {
        overrides.server = {
          ...(overrides.server ?? {}),
          version: expectValue(argv, index, token),
        };
        index += 1;
        break;
      }
      case '--log-level': {
        overrides.logging = {
          ...(overrides.logging ?? {}),
          level: logLevelSchema.parse(expectValue(argv, index, token)),
        };
        index += 1;
        break;
      }
      case '--logging-timestamp': {
        overrides.logging = {
          ...(overrides.logging ?? {}),
          includeTimestamp: parseBoolean(expectValue(argv, index, token)),
        };
        index += 1;
        break;
      }
      default: {
        unknownArgument = token;
      }
    }

    if (unknownArgument) {
      break;
    }
  }

  const mappedOverrides = cliMapper?.(argv) ?? ({} as TOverrides);
  const hasMappedOverrides = Object.keys(mappedOverrides).length > 0;

  if (unknownArgument && !hasMappedOverrides) {
    throw new AppError('CONFIG_ERROR', `Unknown argument: ${unknownArgument}`);
  }

  return {
    configPath,
    overrides: deepMerge(
      overrides as Record<string, unknown>,
      mappedOverrides as Record<string, unknown>,
    ) as PartialRuntimeConfig & TOverrides,
  };
}
