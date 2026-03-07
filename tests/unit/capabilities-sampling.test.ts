import { describe, expect, it, vi } from 'vitest';

import type { SamplingRequest, SamplingResponse } from '../../src/capabilities/sampling.js';
import { createSamplingHelper } from '../../src/capabilities/sampling.js';

describe('SamplingRequest arayuzu', () => {
  it('zorunlu alanlari kabul eder', () => {
    const request: SamplingRequest = {
      messages: [
        {
          role: 'user',
          content: { type: 'text', text: 'Merhaba' },
        },
      ],
    };

    expect(request.messages).toHaveLength(1);
    expect(request.messages[0]?.role).toBe('user');
    expect(request.messages[0]?.content.type).toBe('text');
  });

  it('opsiyonel alanlari kabul eder', () => {
    const request: SamplingRequest = {
      messages: [
        {
          role: 'user',
          content: { type: 'text', text: 'Selam' },
        },
      ],
      maxTokens: 1000,
      systemPrompt: 'Sen bir yardimci asistansin',
      temperature: 0.7,
    };

    expect(request.maxTokens).toBe(1000);
    expect(request.systemPrompt).toBe('Sen bir yardimci asistansin');
    expect(request.temperature).toBe(0.7);
  });

  it('assistant rolunu kabul eder', () => {
    const request: SamplingRequest = {
      messages: [
        {
          role: 'assistant',
          content: { type: 'text', text: 'Merhaba!' },
        },
      ],
    };

    expect(request.messages[0]?.role).toBe('assistant');
  });
});

describe('SamplingResponse arayuzu', () => {
  it('zorunlu alanlari kabul eder', () => {
    const response: SamplingResponse = {
      role: 'assistant',
      content: { type: 'text', text: 'Merhaba!' },
    };

    expect(response.role).toBe('assistant');
    expect(response.content.type).toBe('text');
    expect(response.content.text).toBe('Merhaba!');
  });

  it('opsiyonel alanlari kabul eder', () => {
    const response: SamplingResponse = {
      role: 'assistant',
      content: { type: 'text', text: 'Tamamlandi' },
      model: 'claude-3-sonnet',
      stopReason: 'end_turn',
    };

    expect(response.model).toBe('claude-3-sonnet');
    expect(response.stopReason).toBe('end_turn');
  });
});

describe('createSamplingHelper', () => {
  it('ornekleyici yardimci olusturur', () => {
    const mockServer = {
      server: {
        createMessage: vi.fn(),
      },
    };

    const helper = createSamplingHelper(mockServer as never);

    expect(helper).toBeDefined();
    expect(helper.requestSampling).toBeDefined();
    expect(typeof helper.requestSampling).toBe('function');
  });

  it('istemciden ornekleme talep eder', async () => {
    const mockResponse = {
      role: 'assistant' as const,
      content: { type: 'text' as const, text: 'Cevap' },
      model: 'claude-3',
      stopReason: 'end_turn',
    };

    const mockServer = {
      server: {
        createMessage: vi.fn().mockResolvedValue(mockResponse),
      },
    };

    const helper = createSamplingHelper(mockServer as never);

    const request: SamplingRequest = {
      messages: [
        {
          role: 'user',
          content: { type: 'text', text: 'Soru' },
        },
      ],
      maxTokens: 500,
    };

    const result = await helper.requestSampling(request);

    expect(mockServer.server.createMessage).toHaveBeenCalledOnce();
    expect(mockServer.server.createMessage).toHaveBeenCalledWith({
      messages: request.messages,
      maxTokens: 500,
    });
    expect(result).toEqual(mockResponse);
  });

  it('sistem promptunu iletir', async () => {
    const mockServer = {
      server: {
        createMessage: vi.fn().mockResolvedValue({
          role: 'assistant' as const,
          content: { type: 'text' as const, text: 'Cevap' },
        }),
      },
    };

    const helper = createSamplingHelper(mockServer as never);

    const request: SamplingRequest = {
      messages: [
        {
          role: 'user',
          content: { type: 'text', text: 'Soru' },
        },
      ],
      systemPrompt: 'Ozel sistem promptu',
    };

    await helper.requestSampling(request);

    expect(mockServer.server.createMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: 'Ozel sistem promptu',
      }),
    );
  });

  it('sicaklik degerini iletir', async () => {
    const mockServer = {
      server: {
        createMessage: vi.fn().mockResolvedValue({
          role: 'assistant' as const,
          content: { type: 'text' as const, text: 'Cevap' },
        }),
      },
    };

    const helper = createSamplingHelper(mockServer as never);

    const request: SamplingRequest = {
      messages: [
        {
          role: 'user',
          content: { type: 'text', text: 'Soru' },
        },
      ],
      temperature: 0.9,
    };

    await helper.requestSampling(request);

    expect(mockServer.server.createMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        temperature: 0.9,
      }),
    );
  });

  it('bos mesaj dizisi ile cagri yapar', async () => {
    const mockServer = {
      server: {
        createMessage: vi.fn().mockResolvedValue({
          role: 'assistant' as const,
          content: { type: 'text' as const, text: '' },
        }),
      },
    };

    const helper = createSamplingHelper(mockServer as never);

    const request: SamplingRequest = {
      messages: [],
    };

    await helper.requestSampling(request);

    expect(mockServer.server.createMessage).toHaveBeenCalledWith({
      messages: [],
    });
  });
});
