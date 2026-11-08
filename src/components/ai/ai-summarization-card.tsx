'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AI_MODELS } from '@/lib/ai/ai-models';
import { DemoCardLayout } from './demo-card-layout';
import { DemoModelField, DemoTextField } from './demo-fields';
import { useAiDemo } from './use-ai-demo';
export function AiSummarizationCard() {
  const t = useTranslations('AiDemo');
  const models = AI_MODELS.summary;
  const [model, setModel] = useState<(typeof models)[number]>(models[0]);
  const [text, setText] = useState(t('summary.sample'));
  const demo = useAiDemo('text');

  return (
    <DemoCardLayout
      task="summary"
      pending={demo.pending}
      error={demo.error}
      disabled={text.trim().length < 50}
      onSubmit={() => demo.submit({ task: 'summary', model, text })}
      result={
        demo.result && <p className="whitespace-pre-wrap">{demo.result.text}</p>
      }
    >
      <DemoModelField
        task="summary"
        model={model}
        models={models}
        onChange={(value) => {
          setModel(value as typeof model);
          demo.clearResult();
        }}
      />

      <DemoTextField
        task="summary"
        text={text}
        limit={4000}
        onChange={(value) => {
          setText(value);
          demo.clearResult();
        }}
      />
    </DemoCardLayout>
  );
}
