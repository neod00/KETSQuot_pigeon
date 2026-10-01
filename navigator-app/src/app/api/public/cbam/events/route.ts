import { NextRequest } from "next/server";
import { EVENTS } from "@/shared/cbam-navigator";
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
    requireSession(request);
    await rateLimit(request, "events", 180);
    const value = (await body(request, 300)) as { event?: string };
    if (!value || !EVENTS.includes(value.event as (typeof EVENTS)[number]))
      throw new HttpError(400, "이벤트 형식을 확인해 주세요.");
    // No identity, product text, email, IP or session ID in analytics logs.
    console.info(
      JSON.stringify({ event: value.event, at: new Date().toISOString() }),
    );
    return json({ recorded: true });
  } catch (e) {
    return failure(e);
  }
}
