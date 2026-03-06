import { describe, expect, it } from 'vitest';

import { ApplicationRuntime } from '../../src/application/runtime.js';
import { createExampleTools } from '../../src/application/example-tools.js';
import { StderrLogger } from '../../src/logging/stderr-logger.js';
import { createFixtureConfig } from '../fixtures/runtime-config.js';

describe('ApplicationRuntime normalization', () => {
  it('basarili ciktida normalize edilmis sonuc dondurur', async () => {
    const config = createFixtureConfig();
    const runtime = new ApplicationRuntime(
      config,
      new StderrLogger({ level: 'error', includeTimestamp: false }),
      createExampleTools(),
    );

    const result = await runtime.executeTool('text_transform', {
      text: 'Merhaba',
      mode: 'uppercase',
    });

    expect(result.isError).toBeUndefined();
    expect(result.content[0]?.type).toBe('text');
    expect(result.content[0]?.text).toBe('MERHABA');
    expect(result.structuredContent).toEqual({
      transformedText: 'MERHABA',
      mode: 'uppercase',
    });
  });
});
