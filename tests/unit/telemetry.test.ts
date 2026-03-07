import { describe, expect, it } from 'vitest';

import { createInMemoryTelemetry, type TelemetryRecorder } from '../../src/telemetry/telemetry.js';

function createRecorder(maxSamplesPerTool = 1000): TelemetryRecorder {
  return createInMemoryTelemetry({ maxSamplesPerTool });
}

describe('createInMemoryTelemetry', () => {
  it('bos snapshot dondurur kayit yoksa', () => {
    const recorder = createRecorder();
    const snap = recorder.snapshot();

    expect(snap.totalCalls).toBe(0);
    expect(snap.totalErrors).toBe(0);
    expect(snap.overallErrorRate).toBe(0);
    expect(snap.overallP95LatencyMs).toBe(0);
    expect(snap.tools.size).toBe(0);
  });

  it('basarili cagrida sayac artar', () => {
    const recorder = createRecorder();
    recorder.record({ toolName: 'tool_a', durationMs: 10, success: true });
    recorder.record({ toolName: 'tool_a', durationMs: 20, success: true });

    const snap = recorder.snapshot();
    const metrics = snap.tools.get('tool_a');

    expect(metrics?.callCount).toBe(2);
    expect(metrics?.errorCount).toBe(0);
    expect(metrics?.errorRate).toBe(0);
    expect(snap.totalCalls).toBe(2);
    expect(snap.totalErrors).toBe(0);
  });

  it('hata oranini dogru hesaplar', () => {
    const recorder = createRecorder();
    recorder.record({ toolName: 'tool_a', durationMs: 10, success: true });
    recorder.record({ toolName: 'tool_a', durationMs: 20, success: false });
    recorder.record({ toolName: 'tool_a', durationMs: 30, success: true });
    recorder.record({ toolName: 'tool_a', durationMs: 40, success: false });

    const snap = recorder.snapshot();
    const metrics = snap.tools.get('tool_a');

    expect(metrics?.callCount).toBe(4);
    expect(metrics?.errorCount).toBe(2);
    expect(metrics?.errorRate).toBe(0.5);
    expect(snap.overallErrorRate).toBe(0.5);
  });

  it('birden fazla araci ayri ayri izler', () => {
    const recorder = createRecorder();
    recorder.record({ toolName: 'tool_a', durationMs: 10, success: true });
    recorder.record({ toolName: 'tool_b', durationMs: 20, success: false });

    const snap = recorder.snapshot();

    expect(snap.tools.size).toBe(2);
    expect(snap.tools.get('tool_a')?.callCount).toBe(1);
    expect(snap.tools.get('tool_a')?.errorCount).toBe(0);
    expect(snap.tools.get('tool_b')?.callCount).toBe(1);
    expect(snap.tools.get('tool_b')?.errorCount).toBe(1);
    expect(snap.totalCalls).toBe(2);
    expect(snap.totalErrors).toBe(1);
  });
});

describe('p95 gecikme hesaplama', () => {
  it('tek kayit icin p95 o kaydin suresidir', () => {
    const recorder = createRecorder();
    recorder.record({ toolName: 'tool_a', durationMs: 42, success: true });

    const snap = recorder.snapshot();
    expect(snap.tools.get('tool_a')?.p95LatencyMs).toBe(42);
  });

  it('siralanmis 20 kayit icin p95 dogru indeksi kullanir', () => {
    const recorder = createRecorder();
    for (let i = 1; i <= 20; i++) {
      recorder.record({ toolName: 'tool_a', durationMs: i * 10, success: true });
    }

    const snap = recorder.snapshot();
    // 20 samples, p95 index = ceil(20 * 0.95) - 1 = 19 - 1 = 18 (0-indexed)
    // sorted[18] = 190
    expect(snap.tools.get('tool_a')?.p95LatencyMs).toBe(190);
  });

  it('100 kayit icin p95 en yuksek %5 esigindedir', () => {
    const recorder = createRecorder();
    for (let i = 1; i <= 100; i++) {
      recorder.record({ toolName: 'tool_a', durationMs: i, success: true });
    }

    const snap = recorder.snapshot();
    // 100 samples, p95 index = ceil(100 * 0.95) - 1 = 95 - 1 = 94 (0-indexed)
    // sorted[94] = 95
    expect(snap.tools.get('tool_a')?.p95LatencyMs).toBe(95);
  });

  it('kayit yoksa p95 sifirdir', () => {
    const recorder = createRecorder();
    const snap = recorder.snapshot();
    expect(snap.tools.size).toBe(0);
  });
});

describe('sinirli bellek dairesel tampon', () => {
  it('maxSamplesPerTool sinirini asinca eski orneklerin uzerine yazar', () => {
    const recorder = createRecorder(5);

    // 5 kayit: [10, 20, 30, 40, 50]
    for (let i = 1; i <= 5; i++) {
      recorder.record({ toolName: 'tool_a', durationMs: i * 10, success: true });
    }

    // 2 daha ekle: [600, 700, 30, 40, 50] (dairesel tampon ilk 2 uzerine yazar)
    recorder.record({ toolName: 'tool_a', durationMs: 600, success: true });
    recorder.record({ toolName: 'tool_a', durationMs: 700, success: true });

    const snap = recorder.snapshot();
    const metrics = snap.tools.get('tool_a');

    expect(metrics?.callCount).toBe(7);
    // sorted: [30, 40, 50, 600, 700], p95 index = ceil(5 * 0.95) - 1 = 4
    expect(metrics?.p95LatencyMs).toBe(700);
  });

  it('sayac tampon sinirinin otesinde dogru sayar', () => {
    const recorder = createRecorder(3);

    for (let i = 0; i < 10; i++) {
      recorder.record({ toolName: 'tool_a', durationMs: 1, success: i % 3 !== 0 });
    }

    const snap = recorder.snapshot();
    const metrics = snap.tools.get('tool_a');

    expect(metrics?.callCount).toBe(10);
    // errors at i=0,3,6,9 → 4 errors
    expect(metrics?.errorCount).toBe(4);
    expect(metrics?.errorRate).toBeCloseTo(0.4);
  });
});

describe('varsayilan secenekler', () => {
  it('maxSamplesPerTool belirtilmezse varsayilan deger kullanilir', () => {
    const recorder = createInMemoryTelemetry();
    recorder.record({ toolName: 'tool_a', durationMs: 5, success: true });
    const snap = recorder.snapshot();
    expect(snap.tools.get('tool_a')?.callCount).toBe(1);
  });
});

describe('overallP95LatencyMs', () => {
  it('tek aracin tek kaydinda o kaydin suresini dondurur', () => {
    const recorder = createRecorder();
    recorder.record({ toolName: 'tool_a', durationMs: 42, success: true });

    expect(recorder.snapshot().overallP95LatencyMs).toBe(42);
  });

  it('birden fazla aracin kayitlarini birlestirerek hesaplar', () => {
    const recorder = createRecorder();
    for (let i = 1; i <= 10; i++) {
      recorder.record({ toolName: 'tool_a', durationMs: i, success: true });
    }
    for (let i = 11; i <= 20; i++) {
      recorder.record({ toolName: 'tool_b', durationMs: i, success: true });
    }

    // 20 samples total [1..20], p95 index = ceil(20 * 0.95) - 1 = 18 (0-indexed)
    // sorted[18] = 19
    expect(recorder.snapshot().overallP95LatencyMs).toBe(19);
  });

  it('dairesel tampon sonrasinda sadece aktif ornekleri kullanir', () => {
    const recorder = createRecorder(3);

    recorder.record({ toolName: 'tool_a', durationMs: 100, success: true });
    recorder.record({ toolName: 'tool_a', durationMs: 200, success: true });
    recorder.record({ toolName: 'tool_a', durationMs: 300, success: true });
    // tampon dolu: [100, 200, 300], simdi uzerine yaz
    recorder.record({ toolName: 'tool_a', durationMs: 5, success: true });

    // tampon artik: [5, 200, 300] — aktif ornekler 3 tane
    // sorted: [5, 200, 300], p95 index = ceil(3 * 0.95) - 1 = 2
    expect(recorder.snapshot().overallP95LatencyMs).toBe(300);
  });
});
