import { NextRequest } from "next/server";
import { parseIntake } from "@/shared/cbam-intake-schema";
import { signIntake } from "@/shared/cbam-intake-signature";
import {
  body,
  sameOrigin,
  requireSession,
  rateLimit,
  json,
  failure,
  HttpError,
} from "@/lib/server";
export async function POST(request: NextRequest) {
  try {
    sameOrigin(request);
    const id = requireSession(request);
    await rateLimit(request, "intake-ip", 12);
    await rateLimit(request, "intake-session", 6, 3600, id);
    if (
      !process.env.NAVIGATOR_PRIVACY_RETENTION ||
      !process.env.NAVIGATOR_PRIVACY_PROCESSORS ||
      !process.env.NAVIGATOR_PRIVACY_CONTACT
    )
      throw new HttpError(
        503,
        "신청 서비스를 준비 중입니다. LRQA 공식 문의 채널을 이용해 주세요.",
      );
    const raw = await body(request);
    let parsed;
    try {
      parsed = parseIntake(raw);
    } catch (e) {
      throw new HttpError(
        400,
        e instanceof Error ? e.message : "입력값을 확인해 주세요.",
      );
    }
    if (parsed.navigatorData.sessionId !== id)
      throw new HttpError(400, "진단 세션을 확인해 주세요.");
    const key = request.headers.get("idempotency-key") || "";
    if (!/^[0-9a-f-]{36}$/.test(key))
      throw new HttpError(400, "접수 요청번호를 확인해 주세요.");
    const secret = process.env.NAVIGATOR_INTAKE_SECRET,
      endpoint = process.env.NAVIGATOR_INTAKE_URL;
    if (!secret || secret.length < 32 || !endpoint)
      throw new HttpError(503, "신청 서비스를 준비 중입니다.");
    const url = new URL(endpoint);
    if (
      url.protocol !== "https:" &&
      !(url.hostname === "localhost" && !process.env.NETLIFY)
    )
      throw new HttpError(503, "신청 서비스를 준비 중입니다.");
    const payload = JSON.stringify({ ...parsed, requestId: key });
    const timestamp = String(Date.now());
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-navigator-timestamp": timestamp,
        "x-navigator-signature": signIntake(payload, timestamp, secret),
      },
      body: payload,
      signal: AbortSignal.timeout(15000),
      redirect: "error",
      cache: "no-store",
    });
    if (!response.ok)
      throw new HttpError(
        503,
        "접수 확인이 지연되고 있습니다. 입력 내용을 유지한 채 다시 시도해 주세요.",
      );
    const result = await response.json();
    if (
      typeof result.reference !== "string" ||
      !/^CBAM-N-[A-F0-9]{24}$/.test(result.reference)
    )
      throw new HttpError(503, "접수 결과를 확인하지 못했습니다.");
    return json({ reference: result.reference }, 201);
  } catch (e) {
    return failure(e);
  }
}
