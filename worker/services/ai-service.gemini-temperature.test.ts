import { describe, expect, it, vi } from 'vitest';

/**
 * The Gemini branch builds the sampling config inside `getGenerativeModel`, so
 * this file stubs the SDK to read it back. Kept separate from
 * `ai-service.test.ts` so the mock cannot leak into the cache tests.
 */
const { modelConfigs } = vi.hoisted(() => ({ modelConfigs: [] as Array<Record<string, unknown>> }));

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel(config: Record<string, unknown>) {
      modelConfigs.push(config);
      return {
        startChat: () => ({
          sendMessage: async () => ({
            response: Promise.resolve({ text: () => '{}', functionCalls: () => [] }),
          }),
        }),
      };
    }
  },
}));

import { AIService } from './ai-service';

function geminiService(): AIService {
  return new AIService({ provider: 'gemini', apiKey: 'test', chatModel: 'gemini-test' });
}

describe('AIService gemini sampling config', () => {
  it('forwards an explicit temperature (the OCR extraction path)', async () => {
    modelConfigs.length = 0;

    await geminiService().generateChatResponse({
      messages: [{ role: 'user', content: 'halo' }],
      temperature: 0,
    });

    expect(modelConfigs).toHaveLength(1);
    expect(modelConfigs[0].generationConfig).toMatchObject({ maxOutputTokens: 65536, temperature: 0 });
  });

  it('leaves the provider default untouched when temperature is omitted', async () => {
    modelConfigs.length = 0;

    await geminiService().generateChatResponse({ messages: [{ role: 'user', content: 'halo' }] });

    expect(modelConfigs).toHaveLength(1);
    expect(modelConfigs[0].generationConfig).not.toHaveProperty('temperature');
  });
});
