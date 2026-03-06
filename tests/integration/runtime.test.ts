import { describe, expect, it } from 'vitest';

import { ApplicationRuntime } from '../../src/application/runtime.js';
import { createExampleTools } from '../../src/application/example-tools.js';
import { StderrLogger } from '../../src/logging/stderr-logger.js';
import { createFixtureConfig } from '../fixtures/runtime-config.js';

describe('ApplicationRuntime integration', () => {
  it('returns a normalized error result for invalid input', async () => {
    const runtime = new ApplicationRuntime(
      createFixtureConfig(),
      new StderrLogger({ level: 'error', includeTimestamp: false }),
      createExampleTools(),
    );

    const result = await runtime.executeTool('text_transform', {
      text: '',
      mode: 'uppercase',
    });

    expect(result.isError).toBe(true);
    expect(result.structuredContent).toMatchObject({ code: 'TOOL_EXECUTION_ERROR' });
  });

  it('rejects calls when the feature is disabled', async () => {
    const runtime = new ApplicationRuntime(
      createFixtureConfig({
        security: {
          features: {
            serverInfoTool: true,
            textTransformTool: false,
          },
        },
      }),
      new StderrLogger({ level: 'error', includeTimestamp: false }),
      createExampleTools(),
    );

    const result = await runtime.executeTool('text_transform', {
      text: 'Hello',
      mode: 'trim',
    });

    expect(result.isError).toBe(true);
    expect(result.structuredContent).toMatchObject({ code: 'PERMISSION_DENIED' });
  });
});
