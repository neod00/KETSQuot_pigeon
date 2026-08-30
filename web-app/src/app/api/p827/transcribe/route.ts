import { NextResponse } from 'next/server';
import { getIsoRequestSession } from '@/lib/isoAuth';

export const runtime = 'nodejs';
export const maxDuration = 45;

export async function POST(request: Request) {
  if (!getIsoRequestSession(request)) {
    return NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 });
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ message: '음성 입력을 사용하려면 Netlify 환경변수 OPENAI_API_KEY가 필요합니다.' }, { status: 503 });
  }

  const formData = await request.formData().catch(() => null);
  const audio = formData?.get('audio');
  if (!(audio instanceof File) || !audio.size) {
    return NextResponse.json({ message: '녹음 파일을 확인하지 못했습니다.' }, { status: 400 });
  }
  if (audio.size > 25 * 1024 * 1024) {
    return NextResponse.json({ message: '음성 파일은 25MB 이하로 올려 주세요.' }, { status: 413 });
  }

  const upstream = new FormData();
  upstream.append('file', audio, audio.name || 'p827-voice.webm');
  upstream.append('model', process.env.OPENAI_TRANSCRIBE_MODEL || 'gpt-transcribe');
  upstream.append('language', 'ko');
  upstream.append('response_format', 'json');
  upstream.append('prompt', 'LRQA P827 Data and Information Verification, GHG Protocol, Scope 1, Scope 2, Scope 3, ISAE 3000, ISAE 3410, ISO 14064-3, man-day, verification, assurance statement');

  try {
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: upstream,
    });
    const payload = await response.json() as { text?: string; error?: { message?: string } };
    if (!response.ok || !payload.text) {
      console.error('P827 transcription failed', response.status, payload.error?.message);
      return NextResponse.json({ message: '음성을 텍스트로 변환하지 못했습니다.' }, { status: 502 });
    }
    return NextResponse.json({ text: payload.text });
  } catch (error) {
    console.error('P827 transcription failed', error);
    return NextResponse.json({ message: '음성 변환 연결이 지연되었습니다.' }, { status: 502 });
  }
}
