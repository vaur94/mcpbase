import * as path from 'node:path';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { z } from 'zod';
import { afterEach, describe, expect, it } from 'vitest';

const clients: Client[] = [];

function createClient(): Client {
  const client = new Client({ name: 'mcpbase-test-client', version: '1.0.0' });
  clients.push(client);
  return client;
}

function createTransport(): StdioClientTransport {
  return new StdioClientTransport({
    command: process.execPath,
    args: [path.resolve(process.cwd(), 'dist/index.js')],
  });
}

afterEach(async () => {
  await Promise.all(clients.splice(0).map(async (client) => client.close()));
});

describe('stdio protocol', () => {
  it('initialize sonrasi sunucu basariyla baglanti kurar', async () => {
    const client = createClient();
    const transport = createTransport();

    await client.connect(transport);

    const result = await client.listTools();
    expect(result.tools.length).toBeGreaterThanOrEqual(2);
  });

  it('tools/list kayitli araclari dondurur', async () => {
    const client = createClient();
    const transport = createTransport();

    await client.connect(transport);

    const result = await client.listTools();
    const toolNames = result.tools.map((tool) => tool.name);
    expect(toolNames).toEqual(expect.arrayContaining(['server_info', 'text_transform']));

    const textTransform = result.tools.find((t) => t.name === 'text_transform');
    expect(textTransform).toBeDefined();
    expect(textTransform?.description).toBeTruthy();
  });

  it('tools/call araci calistirir ve sonuc dondurur', async () => {
    const client = createClient();
    const transport = createTransport();

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

  it('bilinmeyen arac cagrisinda hata dondurur', async () => {
    const client = createClient();
    const transport = createTransport();

    await client.connect(transport);

    const result = await client.callTool({
      name: 'nonexistent_tool',
      arguments: {},
    });

    expect(result.isError).toBe(true);
    const content = result.content as Array<{ type: string; text: string }>;
    expect(content[0]?.type).toBe('text');
    expect(content[0]?.text).toBeTruthy();
  });
});
