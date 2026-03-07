import { z, type ZodRawShape, type ZodSchema, type ZodTypeAny } from 'zod';

import { AppError } from '../core/app-error.js';
import {
  runtimeConfigSchema,
  type BaseRuntimeConfig,
  type RuntimeConfig,
} from '../contracts/runtime-config.js';
import { parseCliArgs } from '../infrastructure/cli-args.js';
import { fileExists, readJsonFile } from '../infrastructure/json-file.js';
import { deepMerge } from '../shared/merge.js';
import { defaultConfig } from './default-config.js';

export interface LoadConfigOptions {
  envPrefix?: string;
  defaultConfigFile?: string;
  argv?: string[];
}

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Array<infer U>
    ? U[]
    : T[K] extends Record<string, unknown>
      ? DeepPartial<T[K]>
      : T[K];
};

function deepPartialShape(shape: ZodRawShape): ZodRawShape {
  const result: Record<string, ZodTypeAny> = {};

  for (const [key, field] of Object.entries(shape)) {
    if (field instanceof z.ZodObject) {
      result[key] = z.object(deepPartialShape(field.shape)).optional();
      continue;
    }

    result[key] = (field as ZodTypeAny).optional();
  }

  return result;
}

function createPartialConfigSchema<TConfig extends BaseRuntimeConfig>(
  schema: ZodSchema<TConfig>,
): ZodSchema<DeepPartial<TConfig>> {
  if (!(schema instanceof z.ZodObject)) {
    throw new AppError('CONFIG_ERROR', 'Configuration schema must be a Zod object.');
  }

  return z.object(deepPartialShape((schema as z.ZodObject<ZodRawShape>).shape)) as ZodSchema<
    DeepPartial<TConfig>
  >;
}

function envName(prefix: string, suffix: string): string {
  return `${prefix}${suffix}`;
}

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

  throw new AppError('CONFIG_ERROR', `${name} must be either true or false.`);
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

function loadEnvConfig<TConfig extends BaseRuntimeConfig>(
  partialSchema: ZodSchema<DeepPartial<TConfig>>,
  envPrefix: string,
): DeepPartial<TConfig> {
  return partialSchema.parse({
    server: {
      name: process.env[envName(envPrefix, 'SERVER_NAME')],
      version: process.env[envName(envPrefix, 'SERVER_VERSION')],
    },
    logging: {
      level: process.env[envName(envPrefix, 'LOG_LEVEL')],
      includeTimestamp: envBoolean(envName(envPrefix, 'LOGGING_TIMESTAMP')),
    },
    security: {
      features: {
        serverInfoTool: envBoolean(envName(envPrefix, 'SERVER_INFO_TOOL_ENABLED')),
        textTransformTool: envBoolean(envName(envPrefix, 'TEXT_TRANSFORM_TOOL_ENABLED')),
      },
      commands: {
        allowed: envList(envName(envPrefix, 'ALLOWED_COMMANDS')),
      },
      paths: {
        allowed: envList(envName(envPrefix, 'ALLOWED_PATHS')),
      },
    },
  });
}

async function loadFileConfig<TConfig extends BaseRuntimeConfig>(
  partialSchema: ZodSchema<DeepPartial<TConfig>>,
  cliConfigPath: string | undefined,
  envConfigPath: string | undefined,
  defaultConfigFile: string,
): Promise<DeepPartial<TConfig>> {
  const explicitConfigPath = cliConfigPath ?? envConfigPath;
  if (explicitConfigPath) {
    if (!(await fileExists(explicitConfigPath))) {
      throw new AppError('CONFIG_ERROR', `Configuration file not found: ${explicitConfigPath}`);
    }

    return partialSchema.parse(await readJsonFile(explicitConfigPath));
  }

  if (!(await fileExists(defaultConfigFile))) {
    return partialSchema.parse({});
  }

  return partialSchema.parse(await readJsonFile(defaultConfigFile));
}

async function loadConfigFromSchema<TConfig extends BaseRuntimeConfig>(
  schema: ZodSchema<TConfig>,
  options: Required<LoadConfigOptions>,
): Promise<TConfig> {
  const partialSchema = createPartialConfigSchema(schema);
  const cli = parseCliArgs(options.argv);
  const fileConfig = await loadFileConfig(
    partialSchema,
    cli.configPath,
    process.env[envName(options.envPrefix, 'CONFIG')],
    options.defaultConfigFile,
  );
  const defaultLayer = partialSchema.parse(defaultConfig);
  const cliConfig = partialSchema.parse(cli.overrides);

  const merged = deepMerge(
    deepMerge(
      deepMerge(defaultLayer as Record<string, unknown>, fileConfig as Record<string, unknown>),
      loadEnvConfig(partialSchema, options.envPrefix) as Record<string, unknown>,
    ),
    cliConfig as Record<string, unknown>,
  );

  return schema.parse(merged);
}

export async function loadConfig(argv?: string[]): Promise<RuntimeConfig>;
export async function loadConfig<TConfig extends BaseRuntimeConfig = RuntimeConfig>(
  schema: ZodSchema<TConfig>,
  options?: LoadConfigOptions,
): Promise<TConfig>;
export async function loadConfig<TConfig extends BaseRuntimeConfig = RuntimeConfig>(
  schemaOrArgv?: ZodSchema<TConfig> | string[],
  options: LoadConfigOptions = {},
): Promise<TConfig | RuntimeConfig> {
  const resolvedOptions: Required<LoadConfigOptions> = {
    envPrefix: options.envPrefix ?? 'MCPBASE_',
    defaultConfigFile: options.defaultConfigFile ?? 'mcpbase.config.json',
    argv: Array.isArray(schemaOrArgv) ? schemaOrArgv : (options.argv ?? process.argv.slice(2)),
  };

  if (Array.isArray(schemaOrArgv) || schemaOrArgv === undefined) {
    return loadConfigFromSchema(runtimeConfigSchema, resolvedOptions);
  }

  return loadConfigFromSchema(schemaOrArgv, resolvedOptions);
}
