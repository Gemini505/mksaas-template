import Container from '@/components/layout/container';
import { AiSummarizationCard } from '@/components/ai/ai-summarization-card';
import { AiTranslationCard } from '@/components/ai/ai-translation-card';
import { AiTaglineCard } from '@/components/ai/ai-tagline-card';
import { AiTtsCard } from '@/components/ai/ai-tts-card';
import { AiCaptionCard } from '@/components/ai/ai-caption-card';
import { AiImageCard } from '@/components/ai/ai-image-card';
import { constructMetadata } from '@/lib/metadata';
import type { Metadata } from 'next';
import type { Locale } from 'next-intl';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata | undefined> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });

  return constructMetadata({
    title: 'AI Playground | ' + t('title'),
    description:
      'Explore AI Gateway demos for summaries, translation, taglines, speech, image understanding, and generation.',
    locale,
    pathname: '/ai',
  });
}

export default async function AiPage() {
  const t = await getTranslations('AiPage');

  return (
    <Container className="py-16 px-4">
      <div className="mx-auto max-w-5xl space-y-10 pb-16">
        <div className="space-y-4 text-center">
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-lg text-muted-foreground">{t('description')}</p>
        </div>

        <section id="ai-summary" className="scroll-mt-20">
          <AiSummarizationCard />
        </section>
        <section id="ai-translation" className="scroll-mt-20">
          <AiTranslationCard />
        </section>
        <section id="tagline-generator" className="scroll-mt-20">
          <AiTaglineCard />
        </section>
        <section id="ai-speech" className="scroll-mt-20">
          <AiTtsCard />
        </section>
        <section id="ai-caption" className="scroll-mt-20">
          <AiCaptionCard />
        </section>
        <section id="ai-image" className="scroll-mt-20">
          <AiImageCard />
        </section>
      </div>
    </Container>
  );
}
