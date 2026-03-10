import { describe, expect, it } from 'vitest';

import { createInMemoryTelemetry, toSerializable } from '../../src/telemetry/telemetry.js';
import type { TelemetrySnapshot } from '../../src/telemetry/telemetry.js';

describe('telemetri serilestirme yardimcilari', () => {
  it('yardimci toSerializable map yapisini record yapisina cevirir', () => {
    const snapshot: TelemetrySnapshot = {
      tools: new Map([
        [
          'metin_araci',
          {
            toolName: 'metin_araci',
            callCount: 3,
            errorCount: 1,
            errorRate: 1 / 3,
            p95LatencyMs: 48,
          },
        ],
      ]),
      totalCalls: 3,
      totalErrors: 1,
      overallErrorRate: 1 / 3,
      overallP95LatencyMs: 48,
    };

    const serializable = toSerializable(snapshot);

    expect(Object.keys(serializable.tools)).toEqual(['metin_araci']);
    expect(serializable.tools.metin_araci?.callCount).toBe(3);
    expect(serializable.totalCalls).toBe(3);
    expect(new Date(serializable.capturedAt).toString()).not.toBe('Invalid Date');
  });

  it('kaydedici uzerinden toSerializable cagrisinda guncel snapshot dondurur', () => {
    const telemetry = createInMemoryTelemetry({ maxSamplesPerTool: 10 });
    telemetry.record({ toolName: 'arac_a', durationMs: 10, success: true });
    telemetry.record({ toolName: 'arac_a', durationMs: 20, success: false });

    expect(telemetry.toSerializable).toBeDefined();

    const serializable = telemetry.toSerializable?.();

    expect(serializable).toBeDefined();
    expect(serializable?.totalCalls).toBe(2);
    expect(serializable?.totalErrors).toBe(1);
    expect(serializable?.tools.arac_a?.errorRate).toBe(0.5);
  });
});
