import { AppError } from '../core/app-error.js';
import { logLevelSchema, type PartialRuntimeConfig } from '../contracts/runtime-config.js';

export interface CliParseResult {
  readonly configPath?: string;
  readonly overrides: PartialRuntimeConfig;
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

export function parseCliArgs(argv: string[]): CliParseResult {
  const overrides: PartialRuntimeConfig = {};
  let configPath: string | undefined;

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
      case '--enable-server-info-tool': {
        overrides.security = {
          ...(overrides.security ?? {}),
          features: {
            ...(overrides.security?.features ?? {}),
            serverInfoTool: true,
          },
        };
        break;
      }
      case '--disable-server-info-tool': {
        overrides.security = {
          ...(overrides.security ?? {}),
          features: {
            ...(overrides.security?.features ?? {}),
            serverInfoTool: false,
          },
        };
        break;
      }
      case '--enable-text-transform-tool': {
        overrides.security = {
          ...(overrides.security ?? {}),
          features: {
            ...(overrides.security?.features ?? {}),
            textTransformTool: true,
          },
        };
        break;
      }
      case '--disable-text-transform-tool': {
        overrides.security = {
          ...(overrides.security ?? {}),
          features: {
            ...(overrides.security?.features ?? {}),
            textTransformTool: false,
          },
        };
        break;
      }
      default: {
        if (token.startsWith('--allow-command=')) {
          const command = token.replace('--allow-command=', '');
          overrides.security = {
            ...(overrides.security ?? {}),
            commands: {
              allowed: [...(overrides.security?.commands?.allowed ?? []), command],
            },
          };
          break;
        }

        if (token.startsWith('--allow-path=')) {
          const path = token.replace('--allow-path=', '');
          overrides.security = {
            ...(overrides.security ?? {}),
            paths: {
              allowed: [...(overrides.security?.paths?.allowed ?? []), path],
            },
          };
          break;
        }

        throw new AppError('CONFIG_ERROR', `Unknown argument: ${token}`);
      }
    }
  }

  return { configPath, overrides };
}
