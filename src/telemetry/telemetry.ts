/** Outcome of a single tool execution. */
export interface TelemetryEvent {
  readonly toolName: string;
  readonly durationMs: number;
  readonly success: boolean;
}

/** Per-tool metrics snapshot. */
export interface ToolMetricsSnapshot {
  readonly toolName: string;
  readonly callCount: number;
  readonly errorCount: number;
  readonly errorRate: number;
  readonly p95LatencyMs: number;
}

/** Aggregate snapshot across all tools. */
export interface TelemetrySnapshot {
  readonly tools: ReadonlyMap<string, ToolMetricsSnapshot>;
  readonly totalCalls: number;
  readonly totalErrors: number;
  readonly overallErrorRate: number;
  readonly overallP95LatencyMs: number;
}

/** Records telemetry events and produces snapshots. */
export interface TelemetryRecorder {
  record(event: TelemetryEvent): void;
  snapshot(): TelemetrySnapshot;
}

/** Options for the in-memory telemetry recorder. */
export interface InMemoryTelemetryOptions {
  /** Maximum number of recent duration samples to keep per tool. Defaults to 1000. */
  readonly maxSamplesPerTool?: number;
}

interface ToolAccumulator {
  callCount: number;
  errorCount: number;
  /** Circular buffer of recent durations for p95 calculation. */
  durations: number[];
  /** Write index into the circular buffer. */
  writeIndex: number;
  /** Whether the buffer has wrapped around at least once. */
  filled: boolean;
}

function calculateP95FromSamples(samples: number[]): number {
  if (samples.length === 0) return 0;
  const sorted = samples.slice().sort((a, b) => a - b);
  const index = Math.ceil(sorted.length * 0.95) - 1;
  return sorted[Math.max(0, index)] ?? 0;
}

function calculateP95(durations: number[], filled: boolean, writeIndex: number): number {
  const active = filled ? durations.slice() : durations.slice(0, writeIndex);
  return calculateP95FromSamples(active);
}

function createToolAccumulator(maxSamples: number): ToolAccumulator {
  return {
    callCount: 0,
    errorCount: 0,
    durations: new Array<number>(maxSamples),
    writeIndex: 0,
    filled: false,
  };
}

class InMemoryTelemetryRecorder implements TelemetryRecorder {
  readonly #maxSamples: number;
  readonly #tools = new Map<string, ToolAccumulator>();

  constructor(options?: InMemoryTelemetryOptions) {
    this.#maxSamples = options?.maxSamplesPerTool ?? 1000;
  }

  record(event: TelemetryEvent): void {
    let acc = this.#tools.get(event.toolName);
    if (!acc) {
      acc = createToolAccumulator(this.#maxSamples);
      this.#tools.set(event.toolName, acc);
    }

    acc.callCount++;
    if (!event.success) {
      acc.errorCount++;
    }

    acc.durations[acc.writeIndex] = event.durationMs;
    acc.writeIndex++;
    if (acc.writeIndex >= this.#maxSamples) {
      acc.writeIndex = 0;
      acc.filled = true;
    }
  }

  snapshot(): TelemetrySnapshot {
    const tools = new Map<string, ToolMetricsSnapshot>();
    let totalCalls = 0;
    let totalErrors = 0;

    for (const [toolName, acc] of this.#tools) {
      totalCalls += acc.callCount;
      totalErrors += acc.errorCount;

      tools.set(toolName, {
        toolName,
        callCount: acc.callCount,
        errorCount: acc.errorCount,
        errorRate: acc.callCount > 0 ? acc.errorCount / acc.callCount : 0,
        p95LatencyMs: calculateP95(acc.durations, acc.filled, acc.writeIndex),
      });
    }

    const allDurations: number[] = [];
    for (const acc of this.#tools.values()) {
      const count = acc.filled ? acc.durations.length : acc.writeIndex;
      for (let i = 0; i < count; i++) {
        allDurations.push(acc.durations[i] as number);
      }
    }

    return {
      tools,
      totalCalls,
      totalErrors,
      overallErrorRate: totalCalls > 0 ? totalErrors / totalCalls : 0,
      overallP95LatencyMs: calculateP95FromSamples(allDurations),
    };
  }
}

/** Creates a bounded in-memory telemetry recorder. */
export function createInMemoryTelemetry(options?: InMemoryTelemetryOptions): TelemetryRecorder {
  return new InMemoryTelemetryRecorder(options);
}
