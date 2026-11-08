'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { AiDemoInput, AiDemoResult } from '@/lib/ai/demo-schema';

/** Shared request lifecycle; task-specific parameters and rendering live in cards. */
export function useAiDemo<K extends AiDemoResult['kind']>(kind: K) {
  const t = useTranslations('AiDemo');
  const [result, setResult] = useState<Extract<AiDemoResult, { kind: K }>>();
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  function clearResult() {
    setResult(undefined);
    setError(undefined);
  }
  async function submit(input: AiDemoInput) {
    setPending(true);
    clearResult();
    try {
      const response = await fetch('/api/ai/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? t('error'));
      if (payload.kind !== kind) throw new Error(t('error'));
      setResult(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error'));
    } finally {
      setPending(false);
    }
  }
  return { result, error, pending, clearResult, setError, submit };
}
