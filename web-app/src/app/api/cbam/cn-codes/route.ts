import { NextRequest, NextResponse } from 'next/server';
import { getIsoRequestSession } from '@/lib/isoAuth';
import {
  CBAM_CN_VERSION,
  CBAM_SCOPE_RULE_SUMMARY,
  CBAM_SCOPE_VERSION,
  assessCnCode,
  normalizeCnCode,
  parseCnCodeInput,
  searchProductCatalog,
  type CbamProductCandidate,
} from '@/lib/cbam-cn';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ProductSearchInput = {
  kind: 'product';
  productName: string;
  material?: string;
  form?: string;
  use?: string;
};

type CodeSearchInput = {
  kind: 'codes';
  codes: string;
};

type AiCandidate = {
  code: string;
  titleKo: string;
  titleEn: string;
  reasoning: string;
  confidence: 'high' | 'medium' | 'low';
  missingInformation: string[];
};

function extractOutputText(response: Record<string, unknown>) {
  if (typeof response.output_text === 'string') return response.output_text;
  const output = Array.isArray(response.output) ? response.output : [];
  for (const item of output) {
    if (!item || typeof item !== 'object') continue;
    const content = Array.isArray((item as { content?: unknown[] }).content) ? (item as { content: unknown[] }).content : [];
    for (const part of content) {
      if (part && typeof part === 'object' && (part as { type?: string }).type === 'output_text' && typeof (part as { text?: string }).text === 'string') {
        return (part as { text: string }).text;
      }
    }
  }
  return '';
}

async function searchWithAi(input: ProductSearchInput): Promise<{ candidates: CbamProductCandidate[]; model: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { candidates: [], model: '' };

  const model = process.env.OPENAI_CBAM_MODEL || 'gpt-5.4-mini';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25_000);

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        store: false,
        max_output_tokens: 1800,
        instructions: [
          'You assist an internal CBAM reviewer with EU Combined Nomenclature candidate discovery.',
          'Return candidate CN codes only. Never decide legal CBAM scope yourself; deterministic application rules will do that.',
          'Use the supplied product name, material, form and use. Prefer 8-digit EU CN codes when evidence is sufficient; otherwise return a 4- or 6-digit heading and explain what is missing.',
          'Do not invent certainty. Keep Korean titles and reasoning concise. Return at most five candidates.',
        ].join(' '),
        input: JSON.stringify({
          product: {
            productName: input.productName,
            material: input.material || '',
            form: input.form || '',
            use: input.use || '',
          },
          currentCbamAnnexIRules: CBAM_SCOPE_RULE_SUMMARY,
          legalVersion: CBAM_SCOPE_VERSION,
          cnVersion: CBAM_CN_VERSION,
        }),
        text: {
          format: {
            type: 'json_schema',
            name: 'cbam_cn_candidates',
            strict: true,
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                candidates: {
                  type: 'array',
                  maxItems: 5,
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                      code: { type: 'string', pattern: '^[0-9 ]{2,11}$' },
                      titleKo: { type: 'string' },
                      titleEn: { type: 'string' },
                      reasoning: { type: 'string' },
                      confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
                      missingInformation: { type: 'array', items: { type: 'string' }, maxItems: 5 },
                    },
                    required: ['code', 'titleKo', 'titleEn', 'reasoning', 'confidence', 'missingInformation'],
                  },
                },
              },
              required: ['candidates'],
            },
          },
        },
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error('OpenAI CBAM candidate search failed.', response.status, detail.slice(0, 500));
      throw new Error('AI 후보 검색을 완료하지 못했습니다.');
    }

    const raw = await response.json() as Record<string, unknown>;
    const outputText = extractOutputText(raw);
    const parsed = JSON.parse(outputText) as { candidates?: AiCandidate[] };
    const seen = new Set<string>();
    const candidates = (parsed.candidates || []).flatMap(candidate => {
      const code = normalizeCnCode(candidate.code);
      if (![2, 4, 5, 6, 8].includes(code.length) || seen.has(code)) return [];
      seen.add(code);
      return [{
        code,
        titleKo: candidate.titleKo,
        titleEn: candidate.titleEn,
        reasoning: candidate.reasoning,
        confidence: candidate.confidence,
        missingInformation: candidate.missingInformation,
        source: 'ai' as const,
        assessment: assessCnCode(code),
      }];
    });
    return { candidates, model };
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(request: NextRequest) {
  if (!getIsoRequestSession(request)) return NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 });

  try {
    const input = await request.json() as ProductSearchInput | CodeSearchInput;
    if (input.kind === 'codes') {
      const codes = parseCnCodeInput(input.codes);
      if (!codes.length) return NextResponse.json({ message: '확인할 CN 코드를 입력해 주세요.' }, { status: 400 });
      return NextResponse.json({
        assessments: codes.map(assessCnCode),
        scopeVersion: CBAM_SCOPE_VERSION,
        cnVersion: CBAM_CN_VERSION,
      });
    }

    if (input.kind !== 'product' || !input.productName?.trim()) {
      return NextResponse.json({ message: '제품명을 입력해 주세요.' }, { status: 400 });
    }

    const fallbackCandidates = searchProductCatalog(input);
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        candidates: fallbackCandidates,
        aiUsed: false,
        aiStatus: 'not_configured',
        message: fallbackCandidates.length
          ? '기본 품목 사전에서 후보를 찾았습니다. OPENAI_API_KEY를 설정하면 AI가 재질·형태·용도를 함께 분석합니다.'
          : '기본 품목 사전에서 후보를 찾지 못했습니다. 재질·형태·용도를 더 구체적으로 입력해 주세요.',
        scopeVersion: CBAM_SCOPE_VERSION,
        cnVersion: CBAM_CN_VERSION,
      });
    }

    try {
      const ai = await searchWithAi(input);
      return NextResponse.json({
        candidates: ai.candidates.length ? ai.candidates : fallbackCandidates,
        aiUsed: ai.candidates.length > 0,
        aiStatus: ai.candidates.length ? 'completed' : 'empty',
        model: ai.model,
        message: ai.candidates.length
          ? 'AI가 후보 코드를 제안했으며, 각 코드의 CBAM 범위는 법령 규칙 엔진이 별도로 판정했습니다.'
          : 'AI 후보가 없어 기본 품목 사전 결과를 표시합니다.',
        scopeVersion: CBAM_SCOPE_VERSION,
        cnVersion: CBAM_CN_VERSION,
      });
    } catch (error) {
      console.error('AI product search fallback activated.', error);
      return NextResponse.json({
        candidates: fallbackCandidates,
        aiUsed: false,
        aiStatus: 'fallback',
        message: 'AI 연결이 지연되어 기본 품목 사전 결과를 표시합니다.',
        scopeVersion: CBAM_SCOPE_VERSION,
        cnVersion: CBAM_CN_VERSION,
      });
    }
  } catch {
    return NextResponse.json({ message: '조회 요청 형식을 확인해 주세요.' }, { status: 400 });
  }
}
