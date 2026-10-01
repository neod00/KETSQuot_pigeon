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

import { searchWithAi } from '@/lib/cbam-product-search';
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
