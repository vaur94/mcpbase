# v2 API Reference

This document provides complete API documentation for `@vaur94/mcpbase` version 2.0.0.

## Installation

```bash
npm install @vaur94/mcpbase zod @modelcontextprotocol/sdk
```

## Core Types

### BaseRuntimeConfig

```typescript
type BaseRuntimeConfig<TExtras = unknown> = {
  server: {
    name: string;
    version: string;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    includeTimestamp: boolean;
  };
} & TExtras;
```

The base configuration interface that all runtime configs extend. The default `RuntimeConfig` adds security settings to this base.

### RuntimeConfig

```typescript
type RuntimeConfig = BaseRuntimeConfig<{
  security: {
    features: {
      serverInfoTool: boolean;
      textTransformTool: boolean;
    };
    commands: {
      allowed: string[];
    };
    paths: {
      allowed: string[];
    };
  };
}>;
```

The complete runtime configuration with security settings. All security fields use deny-by-default - empty arrays mean nothing is allowed.

### AppError

```typescript
class AppError<TCode extends string = BaseAppErrorCode> extends Error {
  public readonly code: TCode;
  public readonly details?: Record<string, unknown>;
  public readonly expose: boolean;

  public constructor(
    code: TCode,
    message: string,
    options?: {
      details?: Record<string, unknown>;
      cause?: unknown;
      expose?: boolean;
    },
  );
}
```

Application error class with structured error codes. The `expose` flag controls whether error messages are visible to clients.

### AppErrorCode

```typescript
type BaseAppErrorCode =
  | 'CONFIG_ERROR'
  | 'VALIDATION_ERROR'
  | 'TOOL_NOT_FOUND'
  | 'TOOL_EXECUTION_ERROR';

type AppErrorCode = BaseAppErrorCode | 'PERMISSION_DENIED';
```

All possible error codes. `PERMISSION_DENIED` is exported from the security subpath.

### BaseToolExecutionContext

```typescript
interface BaseToolExecutionContext<TConfig extends BaseRuntimeConfig = BaseRuntimeConfig> {
  readonly requestId: string;
  readonly toolName: string;
  readonly config: TConfig;
}
```

The execution context passed to tool implementations. Contains the unique request ID, tool name, and configuration.

### ToolExecutionContext

```typescript
type ToolExecutionContext = BaseToolExecutionContext<RuntimeConfig>;
```

Shorthand for the default context type with full security config.

### ToolDefinition

```typescript
interface ToolDefinition<
  TInput extends ToolInputSchema = ToolInputSchema,
  TOutput extends ToolOutputSchema | undefined = ToolOutputSchema | undefined,
  TContext extends BaseToolExecutionContext = ToolExecutionContext,
> {
  readonly name: string;
  readonly title: string;
  readonly description: string;
  readonly inputSchema: TInput;
  readonly outputSchema?: TOutput;
  readonly security?: {
    readonly requiredFeature?: keyof RuntimeConfig['security']['features'];
  };
  readonly annotations?: ToolAnnotations;
  execute(input: z.infer<TInput>, context: TContext): Promise<ToolSuccessPayload>;
}
```

Defines a tool that can be executed by the runtime. Input and output schemas use Zod for validation.

**Example:**

```typescript
import { z } from 'zod';
import type { ToolDefinition } from '@vaur94/mcpbase';

const myTool: ToolDefinition = {
  name: 'my_tool',
  title: 'My Tool',
  description: 'Does something useful',
  inputSchema: z.object({
    input: z.string(),
  }),
  outputSchema: z.object({
    result: z.string(),
  }),
  async execute(input, context) {
    return {
      content: [{ type: 'text', text: input.input }],
      structuredContent: { result: input.input },
    };
  },
};
```

### ToolAnnotations

```typescript
interface ToolAnnotations {
  readonly title?: string;
  readonly readOnlyHint?: boolean;
  readonly destructiveHint?: boolean;
  readonly idempotentHint?: boolean;
  readonly openWorldHint?: boolean;
}
```

MCP protocol hints for UI display and agent behavior guidance.

### ToolSuccessPayload

```typescript
interface ToolSuccessPayload {
  readonly content: TextContentBlock[];
  readonly structuredContent?: Record<string, unknown>;
}
```

Return type for tool execute functions.

---

## Configuration

### runtimeConfigSchema

```typescript
const runtimeConfigSchema: z.ZodObject<{
  server: z.ZodObject<{ name: z.ZodString; version: z.ZodString }>;
  logging: z.ZodObject<{ level: z.ZodEnum; includeTimestamp: z.ZodBoolean }>;
  security: z.ZodObject<{
    features: z.ZodObject<{ serverInfoTool: z.ZodBoolean; textTransformTool: z.ZodBoolean }>;
    commands: z.ZodObject<{ allowed: z.ZodArray<z.ZodString> }>;
    paths: z.ZodObject<{ allowed: z.ZodArray<z.ZodString> }>;
  }>;
}>;
```

Full Zod schema for runtime configuration with security settings.

### createRuntimeConfigSchema

```typescript
function createRuntimeConfigSchema<T extends z.ZodRawShape>(
  extensionSchema: z.ZodObject<T>,
): z.ZodObject<ReturnType<typeof baseRuntimeConfigSchema.extend>['shape']>;
```

Creates a runtime config schema by extending the base config. Use this to add custom configuration fields.

**Example:**

```typescript
import { z } from 'zod';
import { createRuntimeConfigSchema } from '@vaur94/mcpbase';

const customSchema = z.object({
  database: z.object({
    url: z.string().url(),
  }),
});

const myConfigSchema = createRuntimeConfigSchema(customSchema);
```

### createPartialRuntimeConfigSchema

```typescript
function createPartialRuntimeConfigSchema<T extends z.ZodRawShape>(
  extensionSchema: z.ZodObject<T>,
): z.ZodObject<Record<string, z.ZodOptional<z.ZodTypeAny>>>;
```

Creates a partial schema where all fields are optional. Used for configuration file loading with overrides.

### loadConfig

```typescript
function loadConfig(argv?: string[]): Promise<RuntimeConfig>;
function loadConfig<TConfig extends BaseRuntimeConfig = RuntimeConfig>(
  schema: ZodSchema<TConfig>,
  options?: LoadConfigOptions,
): Promise<TConfig>;

interface LoadConfigOptions {
  envPrefix?: string; // Default: 'MCPBASE_'
  defaultConfigFile?: string; // Default: 'mcpbase.config.json'
  argv?: string[];
}
```

Loads configuration with layered precedence: defaults → config file → environment variables → CLI arguments.

**Example:**

```typescript
import { loadConfig, runtimeConfigSchema } from '@vaur94/mcpbase';

// Use default schema
const config = await loadConfig();

// Use custom schema
const customConfig = await loadConfig(myConfigSchema, {
  envPrefix: 'MYAPP_',
  defaultConfigFile: 'myapp.config.json',
});
```

### baseDefaultConfig

```typescript
const baseDefaultConfig: BaseRuntimeConfig = {
  server: {
    name: 'mcpbase',
    version: '0.1.0',
  },
  logging: {
    level: 'info',
    includeTimestamp: true,
  },
};
```

Default values for base configuration (without security settings).

### defaultConfig

```typescript
const defaultConfig: RuntimeConfig;
```

Complete default config including default security settings (all features enabled, empty allowlists).

---

## Runtime

### ApplicationRuntime

```typescript
class ApplicationRuntime<
  TConfig extends BaseRuntimeConfig = BaseRuntimeConfig,
  TContext extends BaseToolExecutionContext<TConfig> = BaseToolExecutionContext<TConfig>,
> {
  public readonly config: TConfig;
  public readonly registry: ToolRegistry<TContext>;

  public constructor(options: RuntimeOptions<TConfig, TContext>);

  public listTools(): ToolDefinition<any, any, TContext>[];

  public async executeTool(
    name: string,
    rawInput: Record<string, unknown>,
  ): Promise<{
    content: { type: 'text'; text: string }[];
    structuredContent?: Record<string, unknown>;
    isError?: boolean;
  }>;
}

interface RuntimeOptions<TConfig, TContext> {
  readonly config: TConfig;
  readonly logger: Logger;
  readonly tools: ToolDefinition<any, any, TContext>[];
  readonly contextFactory?: (toolName: string, requestId: string, config: TConfig) => TContext;
  readonly hooks?: ExecutionHooks<TContext> | ExecutionHooks<TContext>[];
}
```

Core runtime that manages tool registration and execution. Handles input validation, context creation, and hook invocation.

**Example:**

```typescript
import { ApplicationRuntime, StderrLogger } from '@vaur94/mcpbase';

const runtime = new ApplicationRuntime({
  config: await loadConfig(),
  logger: new StderrLogger(config.logging),
  tools: [myTool],
  hooks: {
    beforeExecute: async (tool, input, context) => {
      console.log(`Executing ${tool.name}`);
    },
  },
});

const result = await runtime.executeTool('my_tool', { input: 'hello' });
```

### ToolRegistry

```typescript
class ToolRegistry<TContext extends BaseToolExecutionContext = BaseToolExecutionContext> {
  public register(tool: ToolDefinition<any, any, any>): void;
  public get(name: string): ToolDefinition<any, any, TContext>;
  public list(): ToolDefinition<any, any, TContext>[];
}
```

In-memory registry for tools. Throws `AppError('TOOL_NOT_FOUND')` if a tool doesn't exist.

### ExecutionHooks

```typescript
interface ExecutionHooks<TContext extends BaseToolExecutionContext = BaseToolExecutionContext> {
  beforeExecute?(
    tool: ToolDefinition<any, any, TContext>,
    input: unknown,
    context: TContext,
  ): Promise<void> | void;

  afterExecute?(
    tool: ToolDefinition<any, any, TContext>,
    input: unknown,
    result: ToolSuccessPayload,
    context: TContext,
  ): Promise<void> | void;

  onError?(
    tool: ToolDefinition<any, any, TContext>,
    input: unknown,
    error: AppError,
    context: TContext,
  ): Promise<void> | void;
}
```

Lifecycle hooks for tool execution. Use for logging, metrics, caching, or custom error handling.

### Telemetry

```typescript
interface TelemetryEvent {
  readonly toolName: string;
  readonly durationMs: number;
  readonly success: boolean;
}

interface ToolMetricsSnapshot {
  readonly toolName: string;
  readonly callCount: number;
  readonly errorCount: number;
  readonly errorRate: number;
  readonly p95LatencyMs: number;
}

interface TelemetrySnapshot {
  readonly tools: ReadonlyMap<string, ToolMetricsSnapshot>;
  readonly totalCalls: number;
  readonly totalErrors: number;
  readonly overallErrorRate: number;
  readonly overallP95LatencyMs: number;
}

interface TelemetryRecorder {
  record(event: TelemetryEvent): void;
  snapshot(): TelemetrySnapshot;
}

interface InMemoryTelemetryOptions {
  readonly maxSamplesPerTool?: number;
}

function createInMemoryTelemetry(options?: InMemoryTelemetryOptions): TelemetryRecorder;
```

Optional runtime telemetry for lightweight observability. The built-in implementation keeps bounded in-memory latency samples per tool and exposes aggregate snapshots for call count, error rate, and p95 latency.

**Behavior guarantees:**

- Telemetry is fully opt-in.
- Consumers that do not pass a telemetry recorder see no behavior change.
- Recorder failures are swallowed and logged as warnings, so telemetry cannot break tool execution.
- The in-memory implementation is bounded via `maxSamplesPerTool` to avoid unbounded growth.

**Example:**

```typescript
import {
  ApplicationRuntime,
  createInMemoryTelemetry,
  loadConfig,
  runtimeConfigSchema,
  StderrLogger,
} from '@vaur94/mcpbase';

const config = await loadConfig(runtimeConfigSchema);
const telemetry = createInMemoryTelemetry({ maxSamplesPerTool: 500 });

const runtime = new ApplicationRuntime({
  config,
  logger: new StderrLogger(config.logging),
  tools: [myTool],
  telemetry,
});

await runtime.executeTool('my_tool', { input: 'hello' });

const snapshot = telemetry.snapshot();
console.log(snapshot.totalCalls);
console.log(snapshot.overallErrorRate);
console.log(snapshot.overallP95LatencyMs);
console.log(snapshot.tools.get('my_tool')?.p95LatencyMs ?? 0);
```

---

## Bootstrap

### bootstrap

```typescript
async function bootstrap<
  TConfig extends BaseRuntimeConfig = BaseRuntimeConfig,
  TContext extends BaseToolExecutionContext<TConfig> = BaseToolExecutionContext<TConfig>,
>(options?: BootstrapOptions<TConfig, TContext>): Promise<void>;

interface BootstrapOptions<TConfig, TContext> {
  configSchema?: ZodSchema<TConfig>;
  tools?: ToolDefinition<any, any, TContext>[] | (() => ToolDefinition<any, any, TContext>[]);
  loggerFactory?: (config: TConfig) => Logger;
  contextFactory?: (toolName: string, requestId: string, config: TConfig) => TContext;
  hooks?: ExecutionHooks<TContext> | ExecutionHooks<TContext>[];
  telemetry?: TelemetryRecorder;
  transport?: 'stdio';
  argv?: string[];
}
```

High-level bootstrap function that sets up the entire MCP server. Handles config loading, runtime creation, server setup, and shutdown signals.

**Example:**

```typescript
import { bootstrap, createExampleTools } from '@vaur94/mcpbase';

await bootstrap({
  tools: createExampleTools(),
  telemetry: createInMemoryTelemetry(),
  hooks: {
    afterExecute: async (tool, input, result) => {
      // Log execution metrics
    },
  },
});
```

Telemetry is intentionally passed in as a runtime dependency, not loaded from config. This keeps the feature opt-in and avoids changing existing config files or CLI/env behavior.

---

## Capabilities

### Resources

```typescript
interface ResourceDefinition {
  readonly uri: string;
  readonly name: string;
  readonly description?: string;
  readonly mimeType?: string;
  readonly handler: ReadResourceCallback;
}

interface ResourceTemplateDefinition {
  readonly uriTemplate: string;
  readonly name: string;
  readonly description?: string;
  readonly mimeType?: string;
  readonly handler: ReadResourceTemplateCallback;
}

function registerResources(server: McpServer, resources: ResourceDefinition[]): void;
function registerResourceTemplates(
  server: McpServer,
  templates: ResourceTemplateDefinition[],
): void;
```

Register static resources and URI templated resources with the MCP server.

### Prompts

```typescript
interface PromptMessage {
  readonly role: 'user' | 'assistant';
  readonly content: { readonly type: 'text'; readonly text: string };
}

interface PromptDefinition {
  readonly name: string;
  readonly description?: string;
  readonly messages: readonly PromptMessage[];
}

interface PromptTemplateDefinition<TArgs extends z.ZodRawShape = z.ZodRawShape> {
  readonly name: string;
  readonly description?: string;
  readonly argsSchema: TArgs;
  readonly getMessages: (args: z.infer<z.ZodObject<TArgs>>) => PromptMessage[];
}

function registerPrompts(server: McpServer, prompts: PromptDefinition[]): void;
function registerPromptTemplates(server: McpServer, templates: PromptTemplateDefinition[]): void;
```

Register static prompts and templated prompts with arguments.

### Logging

```typescript
type McpLogLevel =
  | 'debug'
  | 'info'
  | 'notice'
  | 'warning'
  | 'error'
  | 'critical'
  | 'alert'
  | 'emergency';

interface McpLoggingBridge {
  log(level: McpLogLevel, logger: string, data: unknown): void;
  setLevel(level: McpLogLevel): void;
}

function createMcpLoggingBridge(server: McpServer): McpLoggingBridge;
```

Bridge for MCP protocol logging. Sends log messages to the MCP client.

### Sampling

```typescript
interface SamplingRequest {
  readonly messages: ReadonlyArray<{
    readonly role: 'user' | 'assistant';
    readonly content: { readonly type: 'text'; readonly text: string };
  }>;
  readonly maxTokens?: number;
  readonly systemPrompt?: string;
  readonly temperature?: number;
}

interface SamplingResponse {
  readonly role: 'assistant';
  readonly content: { readonly type: 'text'; readonly text: string };
  readonly model?: string;
  readonly stopReason?: string;
}

interface SamplingHelper {
  requestSampling(request: SamplingRequest): Promise<SamplingResponse>;
}

function createSamplingHelper(server: McpServer): SamplingHelper;
```

Helper for requesting LLM sampling from the MCP client.

### Roots

```typescript
interface Root {
  readonly uri: string;
  readonly name?: string;
}

type RootsChangeHandler = (roots: Root[]) => void | Promise<void>;

interface RootsHandler {
  onRootsChanged(handler: RootsChangeHandler): void;
  listRoots(): Promise<Root[]>;
}

function createRootsHandler(server: McpServer): RootsHandler;
```

Handler for MCP roots capability. Lists available roots and notifies on changes.

---

## Transport

### startStdioServer

```typescript
async function startStdioServer(server: McpServer): Promise<StdioServerTransport>;
```

Starts the MCP server using stdio transport. This is the default transport for MCP servers.

### startStreamableHttpServer

```typescript
interface StreamableHttpOptions {
  req: IncomingMessage;
  res: ServerResponse;
  sessionId?: string;
  parsedBody?: unknown;
}

async function startStreamableHttpServer(
  server: McpServer,
  options: StreamableHttpOptions,
): Promise<StreamableHTTPServerTransport>;
```

Starts the MCP server using HTTP transport with streaming responses.

### createMcpServer

```typescript
function createMcpServer(runtime: ApplicationRuntime): McpServer;
```

Creates an MCP server instance from an ApplicationRuntime. Registers all tools automatically.

---

## Subpath Exports

### @vaur94/mcpbase/examples

```typescript
import { createExampleTools } from '@vaur94/mcpbase/examples';

const tools = createExampleTools();
// Returns: [server_info tool, text_transform tool]
```

Returns the built-in example tools: `server_info` and `text_transform`.

### @vaur94/mcpbase/security

```typescript
import {
  assertFeatureEnabled,
  assertAllowedCommand,
  assertAllowedPath,
} from '@vaur94/mcpbase/security';
```

Security guard functions for feature flags, command allowlists, and path allowlists.

**Example:**

```typescript
import { assertFeatureEnabled } from '@vaur94/mcpbase/security';

// In a tool's execute function:
assertFeatureEnabled(context.config.security, 'serverInfoTool');
// Throws AppError('PERMISSION_DENIED') if feature is disabled
```

---

## Utilities

### deepMerge

```typescript
function deepMerge<T extends PlainObject>(base: T, override: Partial<T>): T;

type PlainObject = Record<string, unknown>;
```

Deep merges two objects. Arrays are replaced, not merged.

### createRequestId

```typescript
function createRequestId(): string;
```

Creates a cryptographically secure UUID for request tracking.

### createTextContent

```typescript
function createTextContent(text: string): TextContentBlock;

interface TextContentBlock {
  readonly type: 'text';
  readonly text: string;
}
```

Creates a text content block for tool responses.

### sanitizeMessage

```typescript
function sanitizeMessage(input: string): string;
```

Normalizes a string by removing control characters and normalizing whitespace. Used for safe logging.

### ensureAppError

```typescript
function ensureAppError<TCode extends string>(error: unknown): AppError<TCode>;
```

Converts any error to an AppError. Preserves existing AppError instances.

### StderrLogger

```typescript
class StderrLogger implements Logger {
  public constructor(config: RuntimeConfig['logging']);

  public log(entry: LogEntry): void;
  public debug(message: string, meta?: LogEntry): void;
  public info(message: string, meta?: LogEntry): void;
  public warn(message: string, meta?: LogEntry): void;
  public error(message: string, meta?: LogEntry): void;
}
```

Structured JSON logger that writes to stderr. All MCP logging must go to stderr to avoid corrupting the protocol.

### Logger Interface

```typescript
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  readonly level: LogLevel;
  readonly message: string;
  readonly requestId?: string;
  readonly toolName?: string;
  readonly durationMs?: number;
  readonly errorCode?: string;
  readonly timestamp?: string;
}

interface Logger {
  log(entry: LogEntry): void;
  debug(message: string, meta?: Omit<LogEntry, 'level' | 'message'>): void;
  info(message: string, meta?: Omit<LogEntry, 'level' | 'message'>): void;
  warn(message: string, meta?: Omit<LogEntry, 'level' | 'message'>): void;
  error(message: string, meta?: Omit<LogEntry, 'level' | 'message'>): void;
}
```

Logger interface for custom implementations.

---

## Result Types

### SuccessResult

```typescript
interface SuccessResult {
  readonly content: TextContentBlock[];
  readonly structuredContent?: Record<string, unknown>;
  readonly metadata: {
    readonly requestId: string;
    readonly toolName: string;
    readonly durationMs: number;
  };
}
```

Internal result type returned by runtime execution.

### ErrorResult

```typescript
interface ErrorResult {
  readonly content: TextContentBlock[];
  readonly error: {
    readonly code: AppError['code'];
    readonly message: string;
  };
  readonly metadata: {
    readonly requestId: string;
    readonly toolName: string;
    readonly durationMs: number;
  };
}
```

Internal error result type.

---

## Schemas

### logLevelSchema

```typescript
const logLevelSchema: z.ZodEnum<['debug', 'info', 'warn', 'error']>;
```

Zod schema for log levels.

### baseServerSchema

```typescript
const baseServerSchema: z.ZodObject<{
  name: z.ZodString;
  version: z.ZodString;
}>;
```

Zod schema for server identity.

### baseLoggingSchema

```typescript
const baseLoggingSchema: z.ZodObject<{
  level: typeof logLevelSchema;
  includeTimestamp: z.ZodBoolean;
}>;
```

Zod schema for logging configuration.

### baseRuntimeConfigSchema

```typescript
const baseRuntimeConfigSchema: z.ZodObject<{
  server: typeof baseServerSchema;
  logging: typeof baseLoggingSchema;
}>;
```

Zod schema for base runtime config (without security).

---

## Type Aliases

### ToolInputSchema

```typescript
type ToolInputSchema = z.ZodObject<z.ZodRawShape>;
```

Input schema type for tools.

### ToolOutputSchema

```typescript
type ToolOutputSchema = z.ZodObject<z.ZodRawShape>;
```

Output schema type for tools.

### ToolSuccessPayload

```typescript
type ToolSuccessPayload = {
  readonly content: TextContentBlock[];
  readonly structuredContent?: Record<string, unknown>;
};
```

Return type for tool execute methods.

### PartialRuntimeConfig

```typescript
type PartialRuntimeConfig = {
  server?: { name?: string; version?: string };
  logging?: { level?: 'debug' | 'info' | 'warn' | 'error'; includeTimestamp?: boolean };
  security?: {
    features?: { serverInfoTool?: boolean; textTransformTool?: boolean };
    commands?: { allowed?: string[] };
    paths?: { allowed?: string[] };
  };
};
```

Partial config type used during config loading.
