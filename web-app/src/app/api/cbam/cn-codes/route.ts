import { NextRequest, NextResponse } from 'next/server';
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

function authenticate(request: NextRequest) {
  const adminKey = process.env.CBAM_ADMIN_KEY;
  const suppliedKey = request.headers.get('x-cbam-admin-key');
  if (process.env.NETLIFY && !adminKey) return NextResponse.json({ message: 'CBAM_ADMIN_KEY ?댁쁺 ?ㅼ젙???꾩슂?⑸땲??' }, { status: 503 });
  if (adminKey && suppliedKey !== adminKey) return NextResponse.json({ message: '?대? 愿由??몄쬆???꾩슂?⑸땲??' }, { status: 401 });
  return null;
}

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
      throw new Error('AI ?꾨낫 寃?됱쓣 ?꾨즺?섏? 紐삵뻽?듬땲??');
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
  const authError = authenticate(request);
  if (authError) return authError;

  try {
    const input = await request.json() as ProductSearchInput | CodeSearchInput;
    if (input.kind === 'codes') {
      const codes = parseCnCodeInput(input.codes);
      if (!codes.length) return NextResponse.json({ message: '?뺤씤??CN 肄붾뱶瑜??낅젰??二쇱꽭??' }, { status: 400 });
      return NextResponse.json({
        assessments: codes.map(assessCnCode),
        scopeVersion: CBAM_SCOPE_VERSION,
        cnVersion: CBAM_CN_VERSION,
      });
    }

    if (input.kind !== 'product' || !input.productName?.trim()) {
      return NextResponse.json({ message: '?쒗뭹紐낆쓣 ?낅젰??二쇱꽭??' }, { status: 400 });
    }

    const fallbackCandidates = searchProductCatalog(input);
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        candidates: fallbackCandidates,
        aiUsed: false,
        aiStatus: 'not_configured',
        message: fallbackCandidates.length
          ? '湲곕낯 ?덈ぉ ?ъ쟾?먯꽌 ?꾨낫瑜?李얠븯?듬땲?? OPENAI_API_KEY瑜??ㅼ젙?섎㈃ AI媛 ?ъ쭏쨌?뺥깭쨌?⑸룄瑜??④퍡 遺꾩꽍?⑸땲??'
          : '湲곕낯 ?덈ぉ ?ъ쟾?먯꽌 ?꾨낫瑜?李얠? 紐삵뻽?듬땲?? ?ъ쭏쨌?뺥깭쨌?⑸룄瑜???援ъ껜?곸쑝濡??낅젰??二쇱꽭??',
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
          ? 'AI媛 ?꾨낫 肄붾뱶瑜??쒖븞?덉쑝硫? 媛?肄붾뱶??CBAM 踰붿쐞??踰뺣졊 洹쒖튃 ?붿쭊??蹂꾨룄濡??먯젙?덉뒿?덈떎.'
          : 'AI ?꾨낫媛 ?놁뼱 湲곕낯 ?덈ぉ ?ъ쟾 寃곌낵瑜??쒖떆?⑸땲??',
        scopeVersion: CBAM_SCOPE_VERSION,
        cnVersion: CBAM_CN_VERSION,
      });
    } catch (error) {
      console.error('AI product search fallback activated.', error);
      return NextResponse.json({
        candidates: fallbackCandidates,
        aiUsed: false,
        aiStatus: 'fallback',
        message: 'AI ?곌껐??吏?곕릺??湲곕낯 ?덈ぉ ?ъ쟾 寃곌낵瑜??쒖떆?⑸땲??',
        scopeVersion: CBAM_SCOPE_VERSION,
        cnVersion: CBAM_CN_VERSION,
      });
    }
  } catch {
    return NextResponse.json({ message: '議고쉶 ?붿껌 ?뺤떇???뺤씤??二쇱꽭??' }, { status: 400 });
  }
}

