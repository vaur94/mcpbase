import * as path from 'node:path';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { z } from 'zod';
import { afterEach, describe, expect, it } from 'vitest';

const clients: Client[] = [];

afterEach(async () => {
  await Promise.all(clients.splice(0).map(async (client) => client.close()));
});

describe('stdio protocol', () => {
  it('lists tools after the initialize handshake', async () => {
    const client = new Client({ name: 'mcpbase-test-client', version: '1.0.0' });
    clients.push(client);

    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [path.resolve(process.cwd(), 'dist/index.js')],
    });

    await client.connect(transport);

    const result = await client.listTools();
    expect(result.tools.map((tool) => tool.name)).toEqual(
      expect.arrayContaining(['server_info', 'text_transform']),
    );
  });

  it('calls the reference tool through tools/call', async () => {
    const client = new Client({ name: 'mcpbase-test-client', version: '1.0.0' });
    clients.push(client);

    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [path.resolve(process.cwd(), 'dist/index.js')],
    });

    await client.connect(transport);

    const result = await client.callTool({
      name: 'text_transform',
      arguments: {
        text: 'Hello World',
        mode: 'lowercase',
      },
    });

    const parsed = z
      .object({
        content: z.array(z.object({ type: z.literal('text'), text: z.string() })),
        structuredContent: z.object({
          transformedText: z.string(),
          mode: z.literal('lowercase'),
        }),
      })
      .parse(result);

    expect(parsed.content[0]?.type).toBe('text');
    expect(parsed.content[0]?.text).toBe('hello world');
    expect(parsed.structuredContent).toEqual({
      transformedText: 'hello world',
      mode: 'lowercase',
    });
  });
});
