import { describe, expect, it, vi } from 'vitest';

import type { PromptDefinition, PromptTemplateDefinition } from '../../src/capabilities/prompts.js';
import { registerPrompts, registerPromptTemplates } from '../../src/capabilities/prompts.js';
import { z } from 'zod';

function createMockServer() {
  return {
    prompt: vi.fn(),
  };
}

describe('PromptDefinition arayuzu', () => {
  it('zorunlu alanlari kabul eder', () => {
    const definition: PromptDefinition = {
      name: 'selamlama',
      messages: [{ role: 'user', content: { type: 'text', text: 'Merhaba' } }],
    };

    expect(definition.name).toBe('selamlama');
    expect(definition.messages).toHaveLength(1);
    expect(definition.messages[0]!.role).toBe('user');
  });

  it('opsiyonel alanlari kabul eder', () => {
    const definition: PromptDefinition = {
      name: 'selamlama',
      description: 'Basit selamlama promptu',
      messages: [{ role: 'user', content: { type: 'text', text: 'Merhaba' } }],
    };

    expect(definition.description).toBe('Basit selamlama promptu');
  });
});

describe('PromptTemplateDefinition arayuzu', () => {
  it('zorunlu alanlari kabul eder', () => {
    const definition: PromptTemplateDefinition = {
      name: 'ozetleme',
      argsSchema: { metin: z.string() },
      getMessages: (args) => [
        { role: 'user', content: { type: 'text', text: `Ozetle: ${args.metin}` } },
      ],
    };

    expect(definition.name).toBe('ozetleme');
    expect(definition.argsSchema).toBeDefined();
    expect(definition.getMessages).toBeTypeOf('function');
  });

  it('opsiyonel alanlari kabul eder', () => {
    const definition: PromptTemplateDefinition = {
      name: 'ozetleme',
      description: 'Metin ozetleme sablonu',
      argsSchema: { metin: z.string() },
      getMessages: (args) => [
        { role: 'user', content: { type: 'text', text: `Ozetle: ${args.metin}` } },
      ],
    };

    expect(definition.description).toBe('Metin ozetleme sablonu');
  });

  it('getMessages dogru mesajlari uretir', () => {
    const definition: PromptTemplateDefinition<{ konu: z.ZodString }> = {
      name: 'soru-sor',
      argsSchema: { konu: z.string() },
      getMessages: (args) => [
        { role: 'user', content: { type: 'text', text: `${args.konu} hakkinda bilgi ver` } },
      ],
    };

    const messages = definition.getMessages({ konu: 'TypeScript' });
    expect(messages).toHaveLength(1);
    expect(messages[0]!.content.text).toBe('TypeScript hakkinda bilgi ver');
  });
});

describe('registerPrompts', () => {
  it('tek bir statik prompt kaydeder', () => {
    const server = createMockServer();

    const prompts: PromptDefinition[] = [
      {
        name: 'selamlama',
        messages: [{ role: 'user', content: { type: 'text', text: 'Merhaba' } }],
      },
    ];

    registerPrompts(server as never, prompts);

    expect(server.prompt).toHaveBeenCalledOnce();
    const call = server.prompt.mock.calls[0]!;
    expect(call[0]).toBe('selamlama');
    expect(call[1]).toBeTypeOf('function');
  });

  it('aciklama ile statik prompt kaydeder', () => {
    const server = createMockServer();

    const prompts: PromptDefinition[] = [
      {
        name: 'selamlama',
        description: 'Basit selamlama',
        messages: [{ role: 'user', content: { type: 'text', text: 'Merhaba' } }],
      },
    ];

    registerPrompts(server as never, prompts);

    expect(server.prompt).toHaveBeenCalledOnce();
    const call = server.prompt.mock.calls[0]!;
    expect(call[0]).toBe('selamlama');
    expect(call[1]).toBe('Basit selamlama');
    expect(call[2]).toBeTypeOf('function');
  });

  it('callback dogru mesajlari dondurur', () => {
    const server = createMockServer();
    const messages = [
      { role: 'user' as const, content: { type: 'text' as const, text: 'Merhaba' } },
      { role: 'assistant' as const, content: { type: 'text' as const, text: 'Selam!' } },
    ];

    registerPrompts(server as never, [{ name: 'test', messages }]);

    const call = server.prompt.mock.calls[0]!;
    const cb = call[1] as () => { messages: typeof messages };
    const result = cb();
    expect(result.messages).toEqual(messages);
  });

  it('birden fazla prompt kaydeder', () => {
    const server = createMockServer();

    const prompts: PromptDefinition[] = [
      {
        name: 'a',
        messages: [{ role: 'user', content: { type: 'text', text: 'A' } }],
      },
      {
        name: 'b',
        description: 'B promptu',
        messages: [{ role: 'user', content: { type: 'text', text: 'B' } }],
      },
    ];

    registerPrompts(server as never, prompts);

    expect(server.prompt).toHaveBeenCalledTimes(2);
  });

  it('bos dizi ile hata vermez', () => {
    const server = createMockServer();

    registerPrompts(server as never, []);

    expect(server.prompt).not.toHaveBeenCalled();
  });
});

describe('registerPromptTemplates', () => {
  it('tek bir sablon prompt kaydeder', () => {
    const server = createMockServer();

    const templates: PromptTemplateDefinition[] = [
      {
        name: 'ozetleme',
        argsSchema: { metin: z.string() },
        getMessages: (args) => [
          { role: 'user', content: { type: 'text', text: `Ozetle: ${args.metin}` } },
        ],
      },
    ];

    registerPromptTemplates(server as never, templates);

    expect(server.prompt).toHaveBeenCalledOnce();
    const call = server.prompt.mock.calls[0]!;
    expect(call[0]).toBe('ozetleme');
    expect(call[1]).toEqual({ metin: expect.any(Object) });
    expect(call[2]).toBeTypeOf('function');
  });

  it('aciklama ile sablon prompt kaydeder', () => {
    const server = createMockServer();

    const templates: PromptTemplateDefinition[] = [
      {
        name: 'ozetleme',
        description: 'Metin ozetleme',
        argsSchema: { metin: z.string() },
        getMessages: (args) => [
          { role: 'user', content: { type: 'text', text: `Ozetle: ${args.metin}` } },
        ],
      },
    ];

    registerPromptTemplates(server as never, templates);

    expect(server.prompt).toHaveBeenCalledOnce();
    const call = server.prompt.mock.calls[0]!;
    expect(call[0]).toBe('ozetleme');
    expect(call[1]).toBe('Metin ozetleme');
    expect(call[2]).toEqual({ metin: expect.any(Object) });
    expect(call[3]).toBeTypeOf('function');
  });

  it('callback dogru mesajlari uretir', () => {
    const server = createMockServer();

    const templates: PromptTemplateDefinition[] = [
      {
        name: 'soru',
        argsSchema: { konu: z.string() },
        getMessages: (args) => [
          { role: 'user', content: { type: 'text', text: `${String(args.konu)} nedir?` } },
        ],
      },
    ];

    registerPromptTemplates(server as never, templates);

    const call = server.prompt.mock.calls[0]!;
    const cb = call[2] as (args: { konu: string }) => { messages: unknown[] };
    const result = cb({ konu: 'MCP' });
    expect(result.messages).toEqual([
      { role: 'user', content: { type: 'text', text: 'MCP nedir?' } },
    ]);
  });

  it('birden fazla sablon kaydeder', () => {
    const server = createMockServer();

    const templates: PromptTemplateDefinition[] = [
      {
        name: 'a',
        argsSchema: { x: z.string() },
        getMessages: (args) => [{ role: 'user', content: { type: 'text', text: String(args.x) } }],
      },
      {
        name: 'b',
        argsSchema: { y: z.number() },
        getMessages: (args) => [{ role: 'user', content: { type: 'text', text: String(args.y) } }],
      },
    ];

    registerPromptTemplates(server as never, templates);

    expect(server.prompt).toHaveBeenCalledTimes(2);
  });

  it('bos dizi ile hata vermez', () => {
    const server = createMockServer();

    registerPromptTemplates(server as never, []);

    expect(server.prompt).not.toHaveBeenCalled();
  });
});
