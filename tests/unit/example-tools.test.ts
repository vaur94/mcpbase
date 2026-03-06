import { describe, expect, it } from 'vitest';

import { ApplicationRuntime } from '../../src/application/runtime.js';
import { createExampleTools } from '../../src/application/example-tools.js';
import { StderrLogger } from '../../src/logging/stderr-logger.js';
import { createFixtureConfig } from '../fixtures/runtime-config.js';

describe('example tools', () => {
  it('server_info aracini calistirir', async () => {
    const runtime = new ApplicationRuntime(
      createFixtureConfig(),
      new StderrLogger({ level: 'error', includeTimestamp: false }),
      createExampleTools(),
    );

    const result = await runtime.executeTool('server_info', {});

    expect(result.isError).toBeUndefined();
    expect(result.structuredContent).toEqual({
      name: 'mcpbase',
      version: '0.1.0',
      enabledFeatures: ['serverInfoTool', 'textTransformTool'],
    });
  });

  it('text_transform aracinin diger modlarini da kapsar', async () => {
    const runtime = new ApplicationRuntime(
      createFixtureConfig(),
      new StderrLogger({ level: 'error', includeTimestamp: false }),
      createExampleTools(),
    );

    const reverseResult = await runtime.executeTool('text_transform', {
      text: 'abc',
      mode: 'reverse',
    });
    const trimResult = await runtime.executeTool('text_transform', {
      text: '  abc  ',
      mode: 'trim',
    });

    expect(reverseResult.structuredContent).toEqual({ transformedText: 'cba', mode: 'reverse' });
    expect(trimResult.structuredContent).toEqual({ transformedText: 'abc', mode: 'trim' });
  });
});
