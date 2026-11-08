'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AI_MODELS } from '@/lib/ai/ai-models';
import { DemoCardLayout } from './demo-card-layout';
import { DemoModelField, DemoTextField } from './demo-fields';
import { useAiDemo } from './use-ai-demo';
export function AiTaglineCard() {
  const t = useTranslations('AiDemo');
  const models = AI_MODELS.text;
  const [model, setModel] = useState<(typeof models)[number]>(models[0]);
  const [text, setText] = useState(t('tagline.sample'));
  const demo = useAiDemo('taglines');

  return (
    <DemoCardLayout
      task="tagline"
      pending={demo.pending}
      error={demo.error}
      disabled={text.trim().length < 10}
      onSubmit={() => demo.submit({ task: 'tagline', model, text })}
      result={
        demo.result && (
          <ol className="list-decimal space-y-2 pl-5">
            {demo.result.taglines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
        )
      }
    >
      <DemoModelField
        task="tagline"
        model={model}
        models={models}
        onChange={(value) => {
          setModel(value as typeof model);
          demo.clearResult();
        }}
      />

      <DemoTextField
        task="tagline"
        text={text}
        limit={400}
        onChange={(value) => {
          setText(value);
          demo.clearResult();
        }}
      />
    </DemoCardLayout>
  );
}
