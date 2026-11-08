import { beforeEach, afterEach, describe, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ text: vi.fn(), image: vi.fn() }));
vi.mock('ai', () => ({
  generateText: mocks.text,
  generateImage: mocks.image,
  gateway: Object.assign((id: string) => ({ id }), {
    imageModel: (id: string) => ({ id }),
  }),
}));
import { aiDemoSchema, imageDataSchema } from '@/lib/ai/demo-schema';
import { runAiDemo } from '@/lib/ai/gateway-demo';
import { POST } from '@/app/api/ai/demo/route';

const image =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a5eQAAAAASUVORK5CYII=';
const decision = {
  model: 'typesafe-ai/jev',
  answers: {
    urgent: { type: 'boolean', probability: 0.9 },
    team: {
      type: 'choice',
      choice: 'technical',
      probabilities: { technical: 0.9, billing: 0.05, sales: 0.05 },
    },
    severity: {
      type: 'score',
      score: 2.7,
      probabilities: { '0': 0, '1': 0, '2': 0.3, '3': 0.7 },
    },
  },
};
const request = (input: unknown) =>
  new Request('http://localhost/api/ai/demo', {
    method: 'POST',
    body: JSON.stringify(input),
  });

describe('AI Gateway task contracts', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv('AI_GATEWAY_API_KEY', 'gateway-test-key');
    mocks.text.mockResolvedValue({ text: 'A concise summary.', files: [] });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });
  test('rejects model/task mismatches and same-language translation before any call', async () => {
    for (const input of [
      {
        task: 'image',
        model: 'openai/gpt-4o-mini',
        text: 'A fox illustration',
        aspectRatio: '1:1',
      },
      {
        task: 'translation',
        model: 'google/gemini-2.5-flash-lite',
        text: 'Hello',
        sourceLang: 'English',
        targetLang: 'English',
      },
    ])
      expect((await POST(request(input))).status).toBe(400);
    expect(mocks.text).not.toHaveBeenCalled();
    expect(mocks.image).not.toHaveBeenCalled();
  });
  test('rejects remote URLs, fake MIME signatures, oversized uploads and malformed JSON', async () => {
    expect(imageDataSchema.safeParse(image).success).toBe(true);
    for (const value of [
      'https://example.com/private.png',
      'data:image/svg+xml;base64,PHN2Zz4=',
      'data:image/png;base64,' +
        Buffer.from('not an image at all').toString('base64'),
      image + 'A'.repeat(1_000_000),
    ])
      expect(imageDataSchema.safeParse(value).success).toBe(false);
    expect(
      (
        await POST(
          new Request('http://localhost/api/ai/demo', {
            method: 'POST',
            body: 'invalid',
          })
        )
      ).status
    ).toBe(400);
    expect(
      (
        await POST(
          new Request('http://localhost/api/ai/demo', {
            method: 'POST',
            body: ' '.repeat(1_000_001),
          })
        )
      ).status
    ).toBe(413);
  });
  test('summarization and translation send their actual text and language contract', async () => {
    await runAiDemo({
      task: 'summary',
      model: 'google/gemini-2.5-flash-lite',
      text: 'A long article supplied by the caller.',
    });
    expect(mocks.text.mock.calls[0][0].prompt).toBe(
      'A long article supplied by the caller.'
    );
    await runAiDemo({
      task: 'translation',
      model: 'google/gemini-2.5-flash-lite',
      text: 'Hello',
      sourceLang: 'English',
      targetLang: 'Chinese',
    });
    expect(mocks.text.mock.calls[1][0].system).toContain('English to Chinese');
  });
  test('taglines are parsed and an empty model response fails', async () => {
    mocks.text.mockResolvedValueOnce({
      text: '1. Ship sooner.\n2. Build your idea.\n3. Less setup.\n4. Launch today.\n5. Make it real.',
    });
    expect(
      await runAiDemo({
        task: 'tagline',
        model: 'google/gemini-2.5-flash-lite',
        text: 'An app launch boilerplate',
      })
    ).toMatchObject({
      kind: 'taglines',
      taglines: [
        'Ship sooner.',
        'Build your idea.',
        'Less setup.',
        'Launch today.',
        'Make it real.',
      ],
    });
    mocks.text.mockResolvedValueOnce({ text: '' });
    await expect(
      runAiDemo({
        task: 'summary',
        model: 'google/gemini-2.5-flash-lite',
        text: 'Example',
      })
    ).rejects.toThrow('no text');
  });
  test('Jev uses the evaluation API and rejects invalid probability responses', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(decision)));
    vi.stubGlobal('fetch', fetch);
    expect(
      await runAiDemo({
        task: 'decision',
        model: 'typesafe-ai/jev',
        text: 'Our app is down',
      })
    ).toMatchObject({ kind: 'decision', decision });
    expect(fetch.mock.calls[0][0]).toBe(
      'https://ai-gateway.vercel.sh/v1/evaluate'
    );
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.questions.urgent.type).toBe('boolean');
    expect(body.state).toBe('Our app is down');
    fetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          ...decision,
          answers: {
            ...decision.answers,
            urgent: { type: 'boolean', probability: 9 },
          },
        })
      )
    );
    await expect(
      runAiDemo({
        task: 'decision',
        model: 'typesafe-ai/jev',
        text: 'Our app is down',
      })
    ).rejects.toThrow();
  });
  test('speech forwards the voice and produces a WAV data URL', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ audio: 'UklGRg==' })));
    vi.stubGlobal('fetch', fetch);
    expect(
      await runAiDemo({
        task: 'speech',
        model: 'openai/tts-1',
        text: 'Hello',
        voice: 'echo',
      })
    ).toMatchObject({ kind: 'audio', url: 'data:audio/wav;base64,UklGRg==' });
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
      text: 'Hello',
      voice: 'echo',
      outputFormat: 'wav',
    });
    expect(fetch.mock.calls[0][1].headers['ai-model-id']).toBe('openai/tts-1');
  });
  test('image model generation requests only one image with no retries', async () => {
    mocks.image.mockResolvedValue({
      image: { mediaType: 'image/png', base64: 'abc' },
    });
    expect(
      await runAiDemo({
        task: 'image',
        model: 'bfl/flux-2-klein-4b',
        text: 'An orange fox',
        aspectRatio: '16:9',
      })
    ).toMatchObject({ kind: 'image', url: 'data:image/png;base64,abc' });
    expect(mocks.image).toHaveBeenCalledWith(
      expect.objectContaining({ aspectRatio: '16:9', n: 1, maxRetries: 0 })
    );
  });
  test('caption and editing include source image bytes; multimodal generation extracts image files', async () => {
    await runAiDemo({
      task: 'caption',
      model: 'google/gemini-2.5-flash-lite',
      text: 'Describe this',
      image,
    });
    expect(mocks.text.mock.calls[0][0].messages[0].content[1]).toEqual({
      type: 'image',
      image,
    });
    mocks.text.mockResolvedValue({
      text: '',
      files: [{ mediaType: 'image/png', base64: 'abc' }],
    });
    const edited = await runAiDemo({
      task: 'edit',
      model: 'google/gemini-3.1-flash-lite-image',
      text: 'Make it watercolor',
      image,
    });
    expect(edited.kind).toBe('image');
    expect(mocks.text.mock.calls[1][0].messages[0].content[1].image).toBe(
      image
    );
    await runAiDemo({
      task: 'imageChat',
      model: 'google/gemini-3.1-flash-lite-image',
      text: 'An orange fox',
      aspectRatio: '9:16',
    });
    expect(
      mocks.text.mock.calls[2][0].providerOptions.google.imageConfig.aspectRatio
    ).toBe('9:16');
    mocks.text.mockResolvedValueOnce({ text: 'Cannot draw that', files: [] });
    await expect(
      runAiDemo({
        task: 'edit',
        model: 'google/gemini-3.1-flash-lite-image',
        text: 'Change this',
        image,
      })
    ).rejects.toThrow('no image');
  });
  test('missing credentials fail before provider calls and errors do not leak the key', async () => {
    vi.stubEnv('AI_GATEWAY_API_KEY', '');
    await expect(
      runAiDemo({
        task: 'tagline',
        model: 'google/gemini-2.5-flash-lite',
        text: 'Launch an app',
      })
    ).rejects.toThrow('AI_GATEWAY_API_KEY');
    expect(mocks.text).not.toHaveBeenCalled();
    vi.stubEnv('AI_GATEWAY_API_KEY', 'gateway-test-key');
    mocks.text.mockRejectedValue(
      new Error('Invalid gateway-test-key credential')
    );
    const response = await POST(
      request({
        task: 'tagline',
        model: 'google/gemini-2.5-flash-lite',
        text: 'Launch an app',
      })
    );
    expect(response.status).toBe(502);
    expect(await response.text()).not.toContain('gateway-test-key');
  });
  test('invalid schema input does not accept arbitrary model IDs', () => {
    expect(
      aiDemoSchema.safeParse({
        task: 'decision',
        model: 'arbitrary/expensive-model',
        text: 'Route this support ticket',
      }).success
    ).toBe(false);
  });
});
