import { NextResponse } from 'next/server';
import { getIsoRequestSession } from '@/lib/isoAuth';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const session = getIsoRequestSession(request);
  if (session?.role !== 'admin') return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      error: '영문 자동 초안 기능을 사용하려면 Netlify 환경변수 OPENAI_API_KEY를 설정한 뒤 사이트를 재배포해 주세요. 직접 영문 입력과 승인은 지금도 가능합니다.',
    }, { status: 503 });
  }
  const body = await request.json().catch(() => ({})) as { fields?: Array<{ key: string; ko: string }> };
  const fields = (body.fields || []).filter((field) => field.ko.trim()).slice(0, 30);
  if (!fields.length) return NextResponse.json({ translations: {} });
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.OPENAI_TRANSLATION_MODEL || 'gpt-4.1-mini',
      input: [
        { role: 'system', content: 'Translate Korean strategic account management text into concise professional UK business English for LRQA headquarters. Preserve names, acronyms, dates and numbers. Return only a JSON object keyed by the supplied keys.' },
        { role: 'user', content: JSON.stringify(Object.fromEntries(fields.map((field) => [field.key, field.ko]))) },
      ],
    }),
  });
  const payload = await response.json() as { output?: Array<{ content?: Array<{ type?: string; text?: string }> }>; error?: { message?: string } };
  if (!response.ok) return NextResponse.json({ error: payload.error?.message || '영문 초안을 생성하지 못했습니다.' }, { status: 502 });
  const output = payload.output?.flatMap((item) => item.content || []).find((item) => item.type === 'output_text')?.text || '{}';
  try {
    const cleaned = output.replace(/^\`\`\`json\s*/i, '').replace(/\s*\`\`\`$/, '');
    return NextResponse.json({ translations: JSON.parse(cleaned) });
  } catch {
    return NextResponse.json({ error: '영문 초안 응답 형식을 읽지 못했습니다.' }, { status: 502 });
  }
}
