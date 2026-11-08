'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AI_MODELS } from '@/lib/ai/ai-models';
import { Label } from '@/components/ui/label';
import { DemoSelect } from './demo-select';
import { DemoCardLayout } from './demo-card-layout';
import { DemoModelField, DemoTextField } from './demo-fields';
import { useAiDemo } from './use-ai-demo';
export function AiImageCard() {
  const t = useTranslations('AiDemo');
  const models = AI_MODELS.image;
  const [model, setModel] = useState<(typeof models)[number]>(models[0]);
  const [text, setText] = useState(t('image.sample'));
  const demo = useAiDemo('image');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16'>(
    '1:1'
  );
  return (
    <DemoCardLayout
      task="image"
      pending={demo.pending}
      error={demo.error}
      disabled={text.trim().length < 5}
      onSubmit={() => demo.submit({ task: 'image', model, text, aspectRatio })}
      result={
        demo.result && (
          <img
            data-testid="ai-image-output"
            src={demo.result.url}
            alt={t('generatedImage')}
            className="w-full rounded-md"
          />
        )
      }
    >
      <DemoModelField
        task="image"
        model={model}
        models={models}
        onChange={(value) => {
          setModel(value as typeof model);
          demo.clearResult();
        }}
      />
      <div className="space-y-2">
        <Label htmlFor="ai-image-ratio">{t('aspectRatio')}</Label>
        <DemoSelect
          id="ai-image-ratio"
          testId="ai-image-ratio"
          value={aspectRatio}
          values={['1:1', '16:9', '9:16']}
          onChange={(value) => {
            setAspectRatio(value as typeof aspectRatio);
            demo.clearResult();
          }}
        />
      </div>
      <DemoTextField
        task="image"
        text={text}
        limit={1000}
        onChange={(value) => {
          setText(value);
          demo.clearResult();
        }}
      />
    </DemoCardLayout>
  );
}
