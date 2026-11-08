'use client';
import { useTranslations } from 'next-intl';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { AiDemoTask } from '@/lib/ai/ai-models';
import { DemoSelect } from './demo-select';
export function DemoModelField({
  task,
  model,
  models,
  onChange,
}: {
  task: AiDemoTask;
  model: string;
  models: readonly string[];
  onChange: (value: string) => void;
}) {
  const t = useTranslations('AiDemo');
  return (
    <div className="space-y-2">
      <Label htmlFor={`ai-${task}-model`}>{t('model')}</Label>
      <DemoSelect
        id={`ai-${task}-model`}
        testId={`ai-${task}-model`}
        value={model}
        values={models}
        onChange={onChange}
      />
    </div>
  );
}
export function DemoTextField({
  task,
  text,
  limit,
  onChange,
}: {
  task: AiDemoTask;
  text: string;
  limit: number;
  onChange: (value: string) => void;
}) {
  const t = useTranslations('AiDemo');
  return (
    <div className="space-y-2">
      <Label htmlFor={`ai-${task}-input`}>{t(`${task}.input`)}</Label>
      <Textarea
        id={`ai-${task}-input`}
        data-testid={`ai-${task}-input`}
        rows={6}
        maxLength={limit}
        value={text}
        onChange={(event) => onChange(event.target.value)}
      />
      <p className="text-xs text-muted-foreground">
        {text.length} / {limit}
      </p>
    </div>
  );
}
