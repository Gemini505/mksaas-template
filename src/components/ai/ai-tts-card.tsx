'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AI_MODELS, AI_VOICES } from '@/lib/ai/ai-models';
import { Label } from '@/components/ui/label';
import { DemoSelect } from './demo-select';
import { DemoCardLayout } from './demo-card-layout';
import { DemoModelField, DemoTextField } from './demo-fields';
import { useAiDemo } from './use-ai-demo';
export function AiTtsCard() {
  const t = useTranslations('AiDemo');
  const models = AI_MODELS.speech;
  const [model, setModel] = useState<(typeof models)[number]>(models[0]);
  const [text, setText] = useState(t('speech.sample'));
  const demo = useAiDemo('audio');
  const [voice, setVoice] = useState<(typeof AI_VOICES)[number]>(AI_VOICES[0]);
  return (
    <DemoCardLayout
      task="speech"
      pending={demo.pending}
      error={demo.error}
      disabled={text.trim().length < 1}
      onSubmit={() => demo.submit({ task: 'speech', model, text, voice })}
      result={
        demo.result && (
          <audio
            data-testid="ai-speech-output"
            controls
            src={demo.result.url}
            className="w-full"
          >
            <track kind="captions" />
          </audio>
        )
      }
    >
      <DemoModelField
        task="speech"
        model={model}
        models={models}
        onChange={(value) => {
          setModel(value as typeof model);
          demo.clearResult();
        }}
      />
      <div className="space-y-2">
        <Label htmlFor="ai-speech-voice">{t('voice')}</Label>
        <DemoSelect
          id="ai-speech-voice"
          testId="ai-speech-voice"
          value={voice}
          values={AI_VOICES}
          onChange={(value) => {
            setVoice(value as typeof voice);
            demo.clearResult();
          }}
        />
      </div>
      <DemoTextField
        task="speech"
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
