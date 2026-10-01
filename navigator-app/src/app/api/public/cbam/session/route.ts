import { NextRequest } from "next/server";
import {
  COOKIE,
  session,
  newSession,
  sameOrigin,
  rateLimit,
  json,
  failure,
} from "@/lib/server";
export async function POST(request: NextRequest) {
  try {
    sameOrigin(request);
    await rateLimit(request, "session", 60);
    const existing = session(request);
    if (existing) return json({ sessionId: existing });
    const fresh = newSession();
    const response = json({ sessionId: fresh.id });
    response.cookies.set(COOKIE, fresh.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 86_400,
    });
    return response;
  } catch (e) {
    return failure(e);
  }
}
