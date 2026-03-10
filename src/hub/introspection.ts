import { z } from 'zod';

import type { ToolRegistry } from '../application/tool-registry.js';
import type { BaseRuntimeConfig } from '../contracts/runtime-config.js';
import type { ToolAnnotations, ToolDefinition } from '../contracts/tool-contract.js';
import { createTextContent } from '../core/result.js';
import type { BaseToolExecutionContext } from '../core/execution-context.js';
import type {
  SerializableTelemetrySnapshot,
  TelemetryRecorder,
  ToolMetricsSnapshot,
} from '../telemetry/telemetry.js';
import type { ToolState, ToolStateEntry, ToolStateManager } from './tool-state.js';

const toolStateSchema = z.enum(['enabled', 'disabled', 'hidden']);

const toolAnnotationsSchema = z
  .object({
    title: z.string().optional(),
    readOnlyHint: z.boolean().optional(),
    destructiveHint: z.boolean().optional(),
    idempotentHint: z.boolean().optional(),
    openWorldHint: z.boolean().optional(),
  })
  .strict();

const toolStateEntrySchema = z
  .object({
    name: z.string(),
    state: toolStateSchema,
    reason: z.string().optional(),
  })
  .strict();

const introspectionToolEntrySchema = z
  .object({
    name: z.string(),
    title: z.string(),
    description: z.string(),
    annotations: toolAnnotationsSchema.optional(),
    state: toolStateSchema,
  })
  .strict();

const toolMetricsSnapshotSchema: z.ZodType<ToolMetricsSnapshot> = z
  .object({
    toolName: z.string(),
    callCount: z.number(),
    errorCount: z.number(),
    errorRate: z.number(),
    p95LatencyMs: z.number(),
  })
  .strict();

const serializableTelemetrySnapshotSchema: z.ZodType<SerializableTelemetrySnapshot> = z
  .object({
    tools: z.record(z.string(), toolMetricsSnapshotSchema),
    totalCalls: z.number(),
    totalErrors: z.number(),
    overallErrorRate: z.number(),
    overallP95LatencyMs: z.number(),
    capturedAt: z.string(),
  })
  .strict();

const emptyInputSchema = z.object({});

const introspectionResultSchema = z
  .object({
    server: z
      .object({
        name: z.string(),
        version: z.string(),
      })
      .strict(),
    mcpbase: z
      .object({
        version: z.string(),
      })
      .strict(),
    transports: z.array(z.string()),
    capabilities: z.record(z.string(), z.boolean()),
    tools: z.array(introspectionToolEntrySchema),
    telemetry: z
      .object({
        available: z.boolean(),
        snapshot: serializableTelemetrySnapshotSchema.optional(),
      })
      .strict(),
    toolStates: z.array(toolStateEntrySchema).optional(),
  })
  .strict();

export interface IntrospectionToolEntry {
  readonly name: string;
  readonly title: string;
  readonly description: string;
  readonly annotations?: ToolAnnotations;
  readonly state: ToolState;
}

export interface IntrospectionResult {
  readonly [key: string]: unknown;
  readonly server: {
    readonly name: string;
    readonly version: string;
  };
  readonly mcpbase: {
    readonly version: string;
  };
  readonly transports: readonly string[];
  readonly capabilities: Record<string, boolean>;
  readonly tools: readonly IntrospectionToolEntry[];
  readonly telemetry: {
    readonly available: boolean;
    readonly snapshot?: SerializableTelemetrySnapshot;
  };
  readonly toolStates?: readonly ToolStateEntry[];
}

export interface IntrospectionOptions {
  readonly toolName?: string;
  readonly includeTelemetry?: boolean;
}

export interface InternalIntrospectionContext {
  readonly config: BaseRuntimeConfig;
  readonly registry: ToolRegistry;
  readonly telemetry?: TelemetryRecorder;
  readonly stateManager?: ToolStateManager;
  readonly mcpbaseVersion: string;
  readonly transports?: readonly string[];
  readonly capabilities?: Partial<
    Record<'tools' | 'resources' | 'prompts' | 'logging' | 'sampling' | 'roots', boolean>
  >;
}

function getTelemetrySnapshot(
  includeTelemetry: boolean,
  telemetry: TelemetryRecorder | undefined,
): { readonly available: boolean; readonly snapshot?: SerializableTelemetrySnapshot } {
  if (!telemetry) {
    return { available: false };
  }

  if (!includeTelemetry || !telemetry.toSerializable) {
    return { available: true };
  }

  return {
    available: true,
    snapshot: telemetry.toSerializable(),
  };
}

function resolveToolState(
  toolName: string,
  stateEntries: ReadonlyMap<string, ToolStateEntry>,
  stateManager: ToolStateManager | undefined,
): ToolState {
  return stateEntries.get(toolName)?.state ?? stateManager?.getState(toolName) ?? 'enabled';
}

function createToolEntry(
  toolName: string,
  context: InternalIntrospectionContext,
  stateEntries: ReadonlyMap<string, ToolStateEntry>,
): IntrospectionToolEntry | undefined {
  const definition = context.registry.tryGet(toolName);
  if (!definition) {
    return undefined;
  }

  return {
    name: definition.name,
    title: definition.title,
    description: definition.description,
    ...(definition.annotations ? { annotations: definition.annotations } : {}),
    state: resolveToolState(toolName, stateEntries, context.stateManager),
  };
}

function collectToolNames(context: InternalIntrospectionContext): string[] {
  const names = new Set<string>();

  for (const tool of context.registry.list()) {
    names.add(tool.name);
  }

  for (const stateEntry of context.stateManager?.listStates() ?? []) {
    names.add(stateEntry.name);
  }

  return [...names].sort((left, right) => left.localeCompare(right));
}

function createIntrospectionResult(
  publicOptions: IntrospectionOptions,
  context: InternalIntrospectionContext,
): IntrospectionResult {
  const stateEntries = new Map(
    (context.stateManager?.listStates() ?? []).map((entry) => [entry.name, entry] as const),
  );
  const tools = collectToolNames(context)
    .map((toolName) => createToolEntry(toolName, context, stateEntries))
    .filter((entry): entry is IntrospectionToolEntry => entry !== undefined);

  return {
    server: {
      name: context.config.server.name,
      version: context.config.server.version,
    },
    mcpbase: {
      version: context.mcpbaseVersion,
    },
    transports: context.transports ?? ['stdio'],
    capabilities: {
      tools: context.capabilities?.tools ?? tools.length > 0,
      resources: context.capabilities?.resources ?? false,
      prompts: context.capabilities?.prompts ?? false,
      logging: context.capabilities?.logging ?? false,
      sampling: context.capabilities?.sampling ?? false,
      roots: context.capabilities?.roots ?? false,
    },
    tools,
    telemetry: getTelemetrySnapshot(publicOptions.includeTelemetry ?? true, context.telemetry),
    ...(context.stateManager
      ? {
          toolStates: context.stateManager.listStates(),
        }
      : {}),
  };
}

export function createIntrospectionTool<
  TConfig extends BaseRuntimeConfig = BaseRuntimeConfig,
  TContext extends BaseToolExecutionContext<TConfig> = BaseToolExecutionContext<TConfig>,
>(
  publicOptions: IntrospectionOptions = {},
  context: InternalIntrospectionContext,
): ToolDefinition<typeof emptyInputSchema, typeof introspectionResultSchema, TContext> {
  return {
    name: publicOptions.toolName ?? '_mcpbase_introspect',
    title: 'MCPBase Introspection',
    description: 'Sunucu yapisini ve arac durumlarini dondurur.',
    inputSchema: emptyInputSchema,
    outputSchema: introspectionResultSchema,
    annotations: {
      title: 'MCPBase Introspection',
      readOnlyHint: true,
      idempotentHint: true,
    },
    async execute() {
      const structuredContent = createIntrospectionResult(publicOptions, context);

      return {
        content: [createTextContent('Introspection bilgileri hazir.')],
        structuredContent,
      };
    },
  };
}
