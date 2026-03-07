import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CreateMessageResult } from '@modelcontextprotocol/sdk/types.js';

export interface SamplingRequest {
  readonly messages: ReadonlyArray<{
    readonly role: 'user' | 'assistant';
    readonly content: { readonly type: 'text'; readonly text: string };
  }>;
  readonly maxTokens?: number;
  readonly systemPrompt?: string;
  readonly temperature?: number;
}

export interface SamplingResponse {
  readonly role: 'assistant';
  readonly content: { readonly type: 'text'; readonly text: string };
  readonly model?: string;
  readonly stopReason?: string;
}

export interface SamplingHelper {
  requestSampling(request: SamplingRequest): Promise<SamplingResponse>;
}

export function createSamplingHelper(server: McpServer): SamplingHelper {
  return {
    async requestSampling(request: SamplingRequest): Promise<SamplingResponse> {
      const params: {
        messages: Array<{
          role: 'user' | 'assistant';
          content: { type: 'text'; text: string };
        }>;
        maxTokens: number;
        systemPrompt?: string;
        temperature?: number;
      } = {
        messages: [...request.messages],
        maxTokens: request.maxTokens ?? 1024,
      };

      if (request.systemPrompt !== undefined) {
        params.systemPrompt = request.systemPrompt;
      }

      if (request.temperature !== undefined) {
        params.temperature = request.temperature;
      }

      const result: CreateMessageResult = await server.server.createMessage(params);

      const textContent = result.content.type === 'text' ? result.content.text : '';

      return {
        role: 'assistant',
        content: { type: 'text', text: textContent },
        model: result.model,
        stopReason: result.stopReason,
      };
    },
  };
}
