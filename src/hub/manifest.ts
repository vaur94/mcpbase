import { z } from 'zod';

import type { BaseRuntimeConfig } from '../contracts/runtime-config.js';
import type { BaseToolExecutionContext } from '../core/execution-context.js';
import type { BootstrapOptions } from '../index.js';
import type { TransportType } from '../transport/transport-factory.js';
import type {
  SettingsField,
  SettingsGroup,
  SettingsSchema,
  SettingsSelectOption,
} from './settings.js';
import { MCPBASE_VERSION } from './version.js';

const transportTypes = ['stdio', 'streamable-http'] as const satisfies readonly [
  TransportType,
  ...TransportType[],
];

const transportTypeSchema = z.enum(transportTypes);

const settingsSelectOptionSchema: z.ZodType<SettingsSelectOption> = z
  .object({
    value: z.union([z.string(), z.number(), z.boolean()]),
    label: z.string().min(1),
    description: z.string().min(1).optional(),
  })
  .strict();

const settingsFieldValidationSchema = z
  .object({
    min: z.number().optional(),
    max: z.number().optional(),
    minLength: z.number().int().optional(),
    maxLength: z.number().int().optional(),
    pattern: z.string().min(1).optional(),
  })
  .strict();

const settingsFieldSchema: z.ZodType<SettingsField> = z
  .object({
    key: z.string().min(1),
    type: z.enum(['string', 'number', 'boolean', 'select', 'multiselect', 'path']),
    required: z.boolean(),
    label: z.string().min(1),
    description: z.string().min(1).optional(),
    group: z.string().min(1).optional(),
    hint: z.string().min(1).optional(),
    secret: z.boolean().optional(),
    order: z.number().int().optional(),
    default: z.unknown().optional(),
    options: z.array(settingsSelectOptionSchema).readonly().optional(),
    validation: settingsFieldValidationSchema.optional(),
  })
  .strict();

const settingsGroupSchema: z.ZodType<SettingsGroup> = z
  .object({
    key: z.string().min(1),
    label: z.string().min(1),
    description: z.string().min(1).optional(),
    fields: z.array(settingsFieldSchema).readonly(),
  })
  .strict();

const settingsSchemaSchema: z.ZodType<SettingsSchema> = z
  .object({
    groups: z.array(settingsGroupSchema).readonly(),
    version: z.string().min(1),
  })
  .strict();

const manifestPackageSchema = z
  .object({
    name: z.string().min(1),
    version: z.string().min(1),
    description: z.string().min(1).optional(),
  })
  .strict();

const manifestMcpbaseSchema = z
  .object({
    version: z.string().min(1),
    compatibility: z.string().min(1),
  })
  .strict();

const manifestServerSchema = z
  .object({
    name: z.string().min(1),
    version: z.string().min(1),
  })
  .strict();

const manifestTransportsSchema = z.array(transportTypeSchema).readonly();

const manifestCapabilitiesSchema = z
  .object({
    tools: z.boolean(),
    resources: z.boolean(),
    prompts: z.boolean(),
    logging: z.boolean(),
    sampling: z.boolean(),
    roots: z.boolean(),
  })
  .strict();

const manifestLaunchSchema = z
  .object({
    command: z.string().min(1),
    args: z.array(z.string().min(1)).readonly(),
    bin: z.string().min(1).optional(),
    nodeVersion: z.string().min(1).optional(),
    configFile: z.string().min(1),
    envPrefix: z.string().min(1),
  })
  .strict();

export const hubManifestSchema = z
  .object({
    package: manifestPackageSchema,
    mcpbase: manifestMcpbaseSchema,
    server: manifestServerSchema,
    transports: manifestTransportsSchema,
    capabilities: manifestCapabilitiesSchema,
    launch: manifestLaunchSchema,
    settingsSchema: settingsSchemaSchema.optional(),
  })
  .strict();

export type HubManifest = z.infer<typeof hubManifestSchema>;

export interface HubManifestOptions {
  readonly package: HubManifest['package'];
  readonly mcpbase: HubManifest['mcpbase'];
  readonly server: HubManifest['server'];
  readonly transports: HubManifest['transports'];
  readonly capabilities: HubManifest['capabilities'];
  readonly launch: HubManifest['launch'];
  readonly settingsSchema?: SettingsSchema;
}

export interface HubManifestBootstrapLaunchOptions {
  readonly command?: string;
  readonly args?: readonly string[];
  readonly bin?: string;
  readonly nodeVersion?: string;
  readonly configFile?: string;
  readonly envPrefix?: string;
}

export interface HubManifestBootstrapOptions<
  TConfig extends BaseRuntimeConfig = BaseRuntimeConfig,
  TContext extends BaseToolExecutionContext<TConfig> = BaseToolExecutionContext<TConfig>,
> extends BootstrapOptions<TConfig, TContext> {
  readonly package: HubManifest['package'];
  readonly compatibility?: string;
  readonly capabilities?: Partial<HubManifest['capabilities']>;
  readonly launch?: HubManifestBootstrapLaunchOptions;
  readonly transports?: readonly TransportType[];
  readonly settingsSchema?: SettingsSchema;
}

export function createHubManifest(options: HubManifestOptions): HubManifest {
  return hubManifestSchema.parse(options);
}

export function createHubManifestFromBootstrap<
  TConfig extends BaseRuntimeConfig = BaseRuntimeConfig,
  TContext extends BaseToolExecutionContext<TConfig> = BaseToolExecutionContext<TConfig>,
>(options: HubManifestBootstrapOptions<TConfig, TContext>, config: TConfig): HubManifest {
  return createHubManifest({
    package: options.package,
    mcpbase: {
      version: MCPBASE_VERSION,
      compatibility: options.compatibility ?? `^${MCPBASE_VERSION}`,
    },
    server: {
      name: config.server.name,
      version: config.server.version,
    },
    transports: resolveTransports(options),
    capabilities: resolveCapabilities(options),
    launch: {
      command: options.launch?.command ?? 'node',
      args: options.launch?.args ?? ['./dist/index.js'],
      bin: options.launch?.bin,
      nodeVersion: options.launch?.nodeVersion,
      configFile: options.launch?.configFile ?? 'mcpbase.config.json',
      envPrefix: options.launch?.envPrefix ?? 'MCPBASE_',
    },
    settingsSchema: options.settingsSchema,
  });
}

function resolveTransports<
  TConfig extends BaseRuntimeConfig,
  TContext extends BaseToolExecutionContext<TConfig>,
>(options: HubManifestBootstrapOptions<TConfig, TContext>): readonly TransportType[] {
  if (options.transports && options.transports.length > 0) {
    return options.transports;
  }

  return [options.transport ?? 'stdio'];
}

function resolveCapabilities<
  TConfig extends BaseRuntimeConfig,
  TContext extends BaseToolExecutionContext<TConfig>,
>(options: HubManifestBootstrapOptions<TConfig, TContext>): HubManifest['capabilities'] {
  const capabilities = options.capabilities;
  const hasExplicitTools = Array.isArray(options.tools) ? options.tools.length > 0 : true;

  return {
    tools: capabilities?.tools ?? hasExplicitTools,
    resources: capabilities?.resources ?? false,
    prompts: capabilities?.prompts ?? false,
    logging: capabilities?.logging ?? false,
    sampling: capabilities?.sampling ?? false,
    roots: capabilities?.roots ?? false,
  };
}
