import { AppError } from '../core/app-error.js';
import {
  partialRuntimeConfigSchema,
  runtimeConfigSchema,
  type RuntimeConfig,
} from '../contracts/runtime-config.js';
import { parseCliArgs } from '../infrastructure/cli-args.js';
import { fileExists, readJsonFile } from '../infrastructure/json-file.js';
import { deepMerge } from '../shared/merge.js';
import { defaultConfig } from './default-config.js';

function envBoolean(name: string): boolean | undefined {
  const value = process.env[name];
  if (value === undefined) {
    return undefined;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  throw new AppError('CONFIG_ERROR', `${name} yalnizca true veya false olabilir.`);
}

function envList(name: string): string[] | undefined {
  const value = process.env[name];
  if (!value) {
    return undefined;
  }

  return value
    .split(',')
    .map((item: string) => item.trim())
    .filter((item: string) => item.length > 0);
}

function loadEnvConfig() {
  return partialRuntimeConfigSchema.parse({
    server: {
      name: process.env.MCPBASE_SERVER_NAME,
      version: process.env.MCPBASE_SERVER_VERSION,
    },
    logging: {
      level: process.env.MCPBASE_LOG_LEVEL,
      includeTimestamp: envBoolean('MCPBASE_LOGGING_TIMESTAMP'),
    },
    security: {
      features: {
        serverInfoTool: envBoolean('MCPBASE_SERVER_INFO_TOOL_ENABLED'),
        textTransformTool: envBoolean('MCPBASE_TEXT_TRANSFORM_TOOL_ENABLED'),
      },
      commands: {
        allowed: envList('MCPBASE_ALLOWED_COMMANDS'),
      },
      paths: {
        allowed: envList('MCPBASE_ALLOWED_PATHS'),
      },
    },
  });
}

export async function loadConfig(argv: string[]): Promise<RuntimeConfig> {
  const cli = parseCliArgs(argv);
  const configPath = cli.configPath ?? process.env.MCPBASE_CONFIG;
  const fileConfig = configPath
    ? partialRuntimeConfigSchema.parse(
        (await fileExists(configPath))
          ? await readJsonFile(configPath)
          : (() => {
              throw new AppError('CONFIG_ERROR', `Konfigurasyon dosyasi bulunamadi: ${configPath}`);
            })(),
      )
    : {};

  const merged = deepMerge(
    deepMerge(
      deepMerge(defaultConfig, fileConfig as Partial<RuntimeConfig>),
      loadEnvConfig() as Partial<RuntimeConfig>,
    ),
    partialRuntimeConfigSchema.parse(cli.overrides) as Partial<RuntimeConfig>,
  );

  return runtimeConfigSchema.parse(merged);
}
