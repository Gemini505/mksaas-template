import { expect, test } from '@playwright/test';
import path from 'node:path';
import { readFileSync } from 'node:fs';
const source = path.resolve('tests/e2e/fixtures/ai/source.png');
const image = `data:image/png;base64,${readFileSync(source).toString('base64')}`;
const decision = {
  model: 'typesafe-ai/jev',
  answers: {
    urgent: { type: 'boolean', probability: 0.9 },
    team: {
      type: 'choice',
      choice: 'technical',
      probabilities: { billing: 0.05, technical: 0.9, sales: 0.05 },
    },
    severity: {
      type: 'score',
      score: 2.7,
      probabilities: { '0': 0, '1': 0, '2': 0.3, '3': 0.7 },
    },
  },
};

for (const locale of ['en', 'zh']) {
  test(`submits all AI workflows in ${locale} without billed calls`, async ({
    page,
  }) => {
    const requests: Record<string, unknown>[] = [];
    await page.route('**/api/ai/demo', async (route) => {
      const input = route.request().postDataJSON();
      requests.push(input);
      const model = input.model;
      const payload =
        input.task === 'decision'
          ? { kind: 'decision', decision, model }
          : input.task === 'tagline'
            ? {
                kind: 'taglines',
                taglines: [
                  'Ship faster.',
                  'Build simply.',
                  'Launch today.',
                  'Start creating.',
                  'Make it real.',
                ],
                model,
              }
            : input.task === 'speech'
              ? { kind: 'audio', url: 'data:audio/wav;base64,UklGRg==', model }
              : ['image', 'imageChat', 'edit'].includes(input.task)
                ? { kind: 'image', url: image, model }
                : {
                    kind: 'text',
                    text: `Generated ${input.task} content`,
                    model,
                  };
      await route.fulfill({ json: payload });
    });
    await page.goto(locale === 'zh' ? '/zh/ai' : '/ai');
    for (const task of [
      'summary',
      'translation',
      'tagline',
      'speech',
      'caption',
      'image',
    ]) {
      if (['caption', 'edit'].includes(task)) {
        await expect(page.getByTestId(`ai-${task}-submit`)).toBeDisabled();
        await page.getByTestId(`ai-${task}-upload`).setInputFiles(source);
      }
      const text = await page.getByTestId(`ai-${task}-input`).inputValue();
      await page.getByTestId(`ai-${task}-submit`).click();
      const output = page.getByTestId(`ai-${task}-result`);
      await expect(output).toBeVisible();
      await expect(page.getByTestId(`ai-${task}-submit`)).toBeEnabled();
      expect(requests.at(-1)).toMatchObject({ task, text });
      if (['caption', 'edit'].includes(task))
        expect(requests.at(-1)?.image).toBe(image);
      if (task === 'translation')
        expect(requests.at(-1)).toMatchObject({
          sourceLang: 'English',
          targetLang: 'Chinese',
        });
      if (task === 'speech') {
        expect(requests.at(-1)?.voice).toBe('alloy');
        await expect(page.getByTestId('ai-speech-output')).toHaveAttribute(
          'controls',
          ''
        );
        await expect(page.getByTestId('ai-speech-output')).toHaveAttribute(
          'src',
          /^data:audio\/wav;base64,/
        );
      }
      if (['image', 'imageChat', 'edit'].includes(task)) {
        await expect(page.getByTestId(`ai-${task}-output`)).toHaveAttribute(
          'src',
          image
        );
      }
      if (['summary', 'translation', 'caption'].includes(task))
        await expect(output).toContainText(`Generated ${task} content`);
      if (task === 'tagline') await expect(output.locator('li')).toHaveCount(5);
    }
    expect(requests).toHaveLength(6);
  });
}

test('model selection, errors and retries preserve caller inputs', async ({
  page,
}) => {
  let calls = 0;
  await page.route('**/api/ai/demo', async (route) => {
    const input = route.request().postDataJSON();
    expect(input).toMatchObject({
      task: 'tagline',
      model: 'openai/gpt-4o-mini',
      text: 'An app that helps people launch software',
    });
    calls++;
    await route.fulfill(
      calls === 1
        ? { status: 502, json: { error: 'Gateway denied this request' } }
        : {
            json: {
              kind: 'taglines',
              model: input.model,
              taglines: ['A new launch.'],
            },
          }
    );
  });
  await page.goto('/ai');
  await page.getByTestId('ai-tagline-model').click();
  await page
    .getByRole('option', { name: 'openai/gpt-4o-mini', exact: true })
    .click();
  await page
    .getByTestId('ai-tagline-input')
    .fill('An app that helps people launch software');
  await page.getByTestId('ai-tagline-submit').click();
  await expect(page.getByTestId('ai-tagline-error')).toBeVisible();
  await expect(page.getByTestId('ai-tagline-submit')).toBeEnabled();
  await page.getByTestId('ai-tagline-submit').click();
  await expect(page.getByTestId('ai-tagline-result')).toContainText(
    'A new launch.'
  );
  await expect(page.getByTestId('ai-tagline-error')).toHaveCount(0);
});

test('invalid controls and uploaded files do not send model requests', async ({
  page,
  request,
}) => {
  let calls = 0;
  await page.route('**/api/ai/demo', async (route) => {
    calls++;
    await route.fulfill({ status: 500, json: { error: 'Unexpected request' } });
  });
  await page.goto('/ai');
  await page.getByTestId('ai-summary-input').fill('');
  await expect(page.getByTestId('ai-summary-submit')).toBeDisabled();
  await page.getByTestId('ai-translation-target').click();
  await page.getByRole('option', { name: 'English', exact: true }).click();
  await expect(page.getByTestId('ai-translation-submit')).toBeDisabled();
  await page.getByTestId('ai-caption-upload').setInputFiles({
    name: 'document.svg',
    mimeType: 'image/svg+xml',
    buffer: Buffer.from('<svg />'),
  });
  await expect(page.getByTestId('ai-caption-error')).toBeVisible();
  await expect(page.getByTestId('ai-caption-submit')).toBeDisabled();
  expect(calls).toBe(0);
  const response = await request.post('/api/ai/demo', {
    data: {
      task: 'image',
      model: 'unlisted/model',
      text: 'A tiny fox',
      aspectRatio: '1:1',
    },
  });
  expect(response.status()).toBe(400);
});
