'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AI_MODELS, AI_LANGUAGES } from '@/lib/ai/ai-models';
import { Label } from '@/components/ui/label';
import { DemoSelect } from './demo-select';
import { DemoCardLayout } from './demo-card-layout';
import { DemoModelField, DemoTextField } from './demo-fields';
import { useAiDemo } from './use-ai-demo';
export function AiTranslationCard() {
  const t = useTranslations('AiDemo');
  const models = AI_MODELS.translation;
  const [model, setModel] = useState<(typeof models)[number]>(models[0]);
  const [text, setText] = useState(t('translation.sample'));
  const demo = useAiDemo('text');
  const [sourceLang, setSourceLang] =
    useState<(typeof AI_LANGUAGES)[number]>('English');
  const [targetLang, setTargetLang] =
    useState<(typeof AI_LANGUAGES)[number]>('Chinese');
  return (
    <DemoCardLayout
      task="translation"
      pending={demo.pending}
      error={demo.error}
      disabled={text.trim().length < 1 || sourceLang === targetLang}
      onSubmit={() =>
        demo.submit({
          task: 'translation',
          model,
          text,
          sourceLang,
          targetLang,
        })
      }
      result={
        demo.result && <p className="whitespace-pre-wrap">{demo.result.text}</p>
      }
    >
      <DemoModelField
        task="translation"
        model={model}
        models={models}
        onChange={(value) => {
          setModel(value as typeof model);
          demo.clearResult();
        }}
      />
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="ai-translation-source">{t('sourceLang')}</Label>
          <DemoSelect
            id="ai-translation-source"
            testId="ai-translation-source"
            value={sourceLang}
            values={AI_LANGUAGES}
            onChange={(value) => {
              setSourceLang(value as typeof sourceLang);
              demo.clearResult();
            }}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ai-translation-target">{t('targetLang')}</Label>
          <DemoSelect
            id="ai-translation-target"
            testId="ai-translation-target"
            value={targetLang}
            values={AI_LANGUAGES}
            onChange={(value) => {
              setTargetLang(value as typeof targetLang);
              demo.clearResult();
            }}
          />
        </div>
      </div>
      <DemoTextField
        task="translation"
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
