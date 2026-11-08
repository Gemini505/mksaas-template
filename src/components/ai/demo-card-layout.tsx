'use client';
import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { AiDemoTask } from '@/lib/ai/ai-models';

export function DemoCardLayout({
  task,
  pending,
  disabled,
  error,
  onSubmit,
  children,
  result,
}: {
  task: AiDemoTask;
  pending: boolean;
  disabled: boolean;
  error?: string;
  onSubmit: () => Promise<void>;
  children: ReactNode;
  result?: ReactNode;
}) {
  const t = useTranslations('AiDemo');
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-5 text-primary" />
          {t(`${task}.title`)}
        </CardTitle>
        <CardDescription>{t(`${task}.description`)}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmit();
          }}
        >
          <fieldset disabled={pending} className="space-y-4">
            {children}
            <Button
              type="submit"
              data-testid={`ai-${task}-submit`}
              disabled={pending || disabled}
            >
              {pending && <Loader2 className="mr-1 size-4 animate-spin" />}
              {pending ? t('pending') : t(`${task}.action`)}
            </Button>
          </fieldset>
        </form>
        <div
          className="min-h-52 space-y-4 rounded-md border bg-muted/30 p-4 text-sm"
          aria-live="polite"
          aria-busy={pending}
        >
          {error ? (
            <p
              role="alert"
              data-testid={`ai-${task}-error`}
              className="break-words text-destructive"
            >
              {error}
            </p>
          ) : result ? (
            <div data-testid={`ai-${task}-result`} className="space-y-4">
              {result}
            </div>
          ) : (
            <p className="text-muted-foreground">{t('empty')}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
