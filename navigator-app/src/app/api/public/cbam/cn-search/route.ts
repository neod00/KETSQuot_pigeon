import { NextRequest } from "next/server";
import {
  assessCnCode,
  parseCnCodeInput,
  searchProductCatalog,
  type CbamProductCandidate,
} from "@/shared/cbam-cn";
import { searchWithAi } from "@/shared/cbam-product-search";
import { REGULATORY_DATE } from "@/shared/cbam-navigator";
import { productStructure } from "@/shared/cbam-regulatory";
import {
  body,
  sameOrigin,
  requireSession,
  rateLimit,
  json,
  failure,
  HttpError,
} from "@/lib/server";
function assessmentWithStructure(code: string) {
  const { sourceUrl: calculationSourceUrl, reference: calculationReference, ...structure } = productStructure(code);
  return { ...assessCnCode(code), ...structure, calculationSourceUrl, calculationReference };
}
const cache = new Map<
  string,
  { expires: number; candidates: CbamProductCandidate[] }
>();
export async function POST(request: NextRequest) {
  try {
    sameOrigin(request);
    const id = requireSession(request);
    await rateLimit(request, "search-ip", 120);
    await rateLimit(request, "search-session", 60, 3600, id);
    const input = (await body(request, 3000)) as Record<string, unknown>;
    if (!input || typeof input !== "object")
      throw new HttpError(400, "검색어를 확인해 주세요.");
    if (input.kind === "codes") {
      if (typeof input.codes !== "string" || input.codes.length > 300)
        throw new HttpError(400, "CN 코드를 확인해 주세요.");
      const codes = parseCnCodeInput(input.codes);
      if (!codes.length || codes.length > 20)
        throw new HttpError(400, "CN 코드는 1~20개까지 조회할 수 있습니다.");
      return json({
        assessments: codes.map(assessmentWithStructure),
        lastCheckedAt: REGULATORY_DATE,
      });
    }
    if (
      input.kind !== "product" ||
      typeof input.productName !== "string" ||
      !input.productName.trim()
    )
      throw new HttpError(400, "제품명을 입력해 주세요.");
    for (const key of ["productName", "material", "form", "use"])
      if (
        input[key] !== undefined &&
        (typeof input[key] !== "string" || (input[key] as string).length > 200)
      )
        throw new HttpError(
          400,
          "검색 항목은 각각 200자 이내로 입력해 주세요.",
        );
    const query = {
      kind: "product" as const,
      productName: input.productName.trim(),
      material: ((input.material as string) || "").trim(),
      form: ((input.form as string) || "").trim(),
      use: ((input.use as string) || "").trim(),
    };
    const key = JSON.stringify(query).toLowerCase();
    let candidates =
      cache.get(key)?.expires && cache.get(key)!.expires > Date.now()
        ? cache.get(key)!.candidates
        : searchProductCatalog(query);
    if (!candidates.length && process.env.OPENAI_API_KEY) {
      await rateLimit(request, "ai-ip", 10, 86400);
      await rateLimit(request, "ai-session", 5, 86400, id);
      try {
        candidates = (await searchWithAi(query)).candidates;
      } catch {
        candidates = [];
      }
    }
    if (cache.size >= 300) cache.delete(cache.keys().next().value!);
    if (candidates.length)
      cache.set(key, { candidates, expires: Date.now() + 3600_000 });
    return json({
      candidates: candidates.map((c) => ({
        code: c.code,
        titleKo: c.titleKo,
        titleEn: c.titleEn,
        reasoning: c.reasoning,
        missingInformation: c.missingInformation,
        assessment: assessmentWithStructure(c.code),
      })),
      lastCheckedAt: REGULATORY_DATE,
      message: candidates.length
        ? "가능성이 있는 CN 코드 후보입니다. 실제 통관 코드와 제품 속성을 확인해 주세요."
        : "후보를 찾지 못했습니다. 재질·형태·용도를 보완하거나 통관 CN 코드를 입력해 주세요.",
    });
  } catch (e) {
    return failure(e);
  }
}
