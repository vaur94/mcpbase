import { describe, expect, it } from 'vitest';

import { ApplicationRuntime } from '../../src/application/runtime.js';
import { createExampleTools } from '../../src/application/example-tools.js';
import { StderrLogger } from '../../src/logging/stderr-logger.js';
import { createFixtureConfig } from '../fixtures/runtime-config.js';

describe('ApplicationRuntime normalization', () => {
  it('returns a normalized result for successful output', async () => {
    const config = createFixtureConfig();
    const runtime = new ApplicationRuntime({
      config,
      logger: new StderrLogger({ level: 'error', includeTimestamp: false }),
      tools: createExampleTools(),
    });

    const result = await runtime.executeTool('text_transform', {
      text: 'Hello',
      mode: 'uppercase',
    });

    expect(result.isError).toBeUndefined();
    expect(result.content[0]?.type).toBe('text');
    expect(result.content[0]?.text).toBe('HELLO');
    expect(result.structuredContent).toEqual({
      transformedText: 'HELLO',
      mode: 'uppercase',
    });
  });
});
