import { aiDemoSchema } from '@/lib/ai/demo-schema';
import { runAiDemo } from '@/lib/ai/gateway-demo';

export const runtime = 'nodejs';
export const maxDuration = 120;

/** Public, on-demand demos. Validate task/model pairs before any billed call. */
export async function POST(request: Request) {
  const body = await request.text();
  if (Buffer.byteLength(body) > 1_000_000)
    return Response.json({ error: 'Request is too large.' }, { status: 413 });
  let input: unknown;
  try {
    input = JSON.parse(body);
  } catch {
    return Response.json({ error: 'Invalid JSON.' }, { status: 400 });
  }
  const parsed = aiDemoSchema.safeParse(input);
  if (!parsed.success)
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input.' },
      { status: 400 }
    );
  try {
    return Response.json(await runAiDemo(parsed.data), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    let message =
      error instanceof Error ? error.message : 'AI generation failed.';
    const key = process.env.AI_GATEWAY_API_KEY;
    if (key) message = message.replaceAll(key, '[redacted]');
    return Response.json(
      { error: message.slice(0, 500) },
      { status: 502, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
