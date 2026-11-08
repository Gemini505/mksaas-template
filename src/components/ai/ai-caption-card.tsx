'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AI_MODELS, AI_IMAGE_MAX_BYTES } from '@/lib/ai/ai-models';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { DemoCardLayout } from './demo-card-layout';
import { DemoModelField, DemoTextField } from './demo-fields';
import { useAiDemo } from './use-ai-demo';
export function AiCaptionCard() {
  const t = useTranslations('AiDemo');
  const models = AI_MODELS.caption;
  const [model, setModel] = useState<(typeof models)[number]>(models[0]);
  const [text, setText] = useState(t('caption.sample'));
  const demo = useAiDemo('text');
  const [image, setImage] = useState<string>();
  const [reading, setReading] = useState(false);
  async function upload(file: File | undefined) {
    demo.clearResult();
    setImage(undefined);
    if (!file) return;
    if (
      !['image/png', 'image/jpeg', 'image/webp'].includes(file.type) ||
      file.size > AI_IMAGE_MAX_BYTES
    ) {
      demo.setError(t('uploadError'));
      return;
    }
    setReading(true);
    try {
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error(t('uploadError')));
        reader.readAsDataURL(file);
      });
      setImage(data);
    } catch {
      demo.setError(t('uploadError'));
    } finally {
      setReading(false);
    }
  }
  return (
    <DemoCardLayout
      task="caption"
      pending={demo.pending}
      error={demo.error}
      disabled={text.trim().length < 5 || !image || reading}
      onSubmit={() =>
        demo.submit({ task: 'caption', model, text, image: image! })
      }
      result={
        demo.result && <p className="whitespace-pre-wrap">{demo.result.text}</p>
      }
    >
      <DemoModelField
        task="caption"
        model={model}
        models={models}
        onChange={(value) => {
          setModel(value as typeof model);
          demo.clearResult();
        }}
      />
      <div className="space-y-2">
        <Label htmlFor="ai-caption-upload">{t('upload')}</Label>
        <Input
          id="ai-caption-upload"
          data-testid="ai-caption-upload"
          type="file"
          disabled={reading}
          accept="image/png,image/jpeg,image/webp"
          onChange={(event) => void upload(event.target.files?.[0])}
        />
        <p className="text-xs text-muted-foreground">{t('uploadHint')}</p>
        {image && (
          <img
            src={image}
            alt={t('sourceImage')}
            className="max-h-52 rounded-md object-contain"
          />
        )}
      </div>
      <DemoTextField
        task="caption"
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
