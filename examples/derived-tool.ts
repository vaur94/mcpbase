import { z } from 'zod';

import { createTextContent, type ToolDefinition } from '../src/index.js';

export const healthTool: ToolDefinition = {
  name: 'health_check',
  title: 'Health Check',
  description: 'Simple reference tool for servers derived from mcpbase.',
  inputSchema: z.object({
    service: z.string().min(1),
  }),
  outputSchema: z.object({
    service: z.string(),
    ok: z.boolean(),
  }),
  async execute(input) {
    return {
      content: [createTextContent(`${input.service} looks healthy.`)],
      structuredContent: {
        service: input.service,
        ok: true,
      },
    };
  },
};
