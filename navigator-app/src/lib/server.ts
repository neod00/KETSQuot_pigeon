import "server-only";
import { getStore } from "@netlify/blobs";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const COOKIE = "cbam_navigator";
export function secret() {
  const value = process.env.NAVIGATOR_SESSION_SECRET;
  if (!value || value.length < 32)
    throw new HttpError(
      503,
      "서비스를 준비 중입니다. 잠시 후 다시 이용해 주세요.",
    );
  return value;
}
const hmac = (value: string) =>
  createHmac("sha256", secret()).update(value).digest("hex");
export function newSession() {
  const id = `NAV-${randomUUID()}`;
  const payload = `${id}.${Date.now() + 86_400_000}`;
  return { id, token: `${payload}.${hmac(payload)}` };
}
export function session(request: NextRequest) {
  const token = request.cookies.get(COOKIE)?.value || "";
  const [id, expires, signature] = token.split(".");
  if (
    !/^NAV-[0-9a-f-]{36}$/.test(id || "") ||
    !/^\d{13}$/.test(expires || "") ||
    Number(expires) < Date.now() ||
    !/^[a-f0-9]{64}$/.test(signature || "")
  )
    return null;
  return timingSafeEqual(
    Buffer.from(signature, "hex"),
    Buffer.from(hmac(`${id}.${expires}`), "hex"),
  )
    ? id
    : null;
}
export function requireSession(request: NextRequest) {
  const id = session(request);
  if (!id)
    throw new HttpError(
      401,
      "세션이 만료되었습니다. 페이지를 새로고침해 주세요.",
    );
  return id;
}
export function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  const siteOrigin = "https://lrqa-cbam-navigator.netlify.app";
  if (
    request.headers.get("sec-fetch-site") === "cross-site" ||
    (origin && origin !== request.nextUrl.origin && origin !== siteOrigin)
  )
    throw new HttpError(403, "허용되지 않은 요청입니다.");
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new HttpError(415, "요청 형식을 확인해 주세요.");
}
export async function body(request: Request, limit = 32_000) {
  if (Number(request.headers.get("content-length")) > limit)
    throw new HttpError(413, "입력 내용이 너무 깁니다.");
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "입력 내용이 없습니다.");
  let length = 0;
  const parts: Uint8Array[] = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > limit) {
      await reader.cancel();
      throw new HttpError(413, "입력 내용이 너무 깁니다.");
    }
    parts.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(parts).toString("utf8")) as unknown;
  } catch {
    throw new HttpError(400, "요청 형식을 확인해 주세요.");
  }
}
const localCounters = new Map<string, { count: number; expires: number }>();
export async function rateLimit(
  request: NextRequest,
  scope: string,
  max: number,
  seconds = 3600,
  id?: string,
) {
  const ip =
    request.headers.get("x-nf-client-connection-ip") ||
    (process.env.NODE_ENV !== "production" ? "local" : "unknown");
  const bucket = Math.floor(Date.now() / (seconds * 1000));
  const key = `nav:${scope}:${bucket}:${hmac(id || ip).slice(0, 32)}`;
  const url = process.env.UPSTASH_REDIS_REST_URL,
    token = process.env.UPSTASH_REDIS_REST_TOKEN;
  let count: number;
  if (url && token) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        "EVAL",
        "local n=redis.call('INCR',KEYS[1]);if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]) end;return n",
        1,
        key,
        seconds,
      ]),
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    const result = await response.json();
    if (!response.ok || typeof result.result !== "number")
      throw new HttpError(503, "잠시 후 다시 이용해 주세요.");
    count = result.result;
  } else {
    if (process.env.SITE_ID === "27f6b7d1-7eab-48aa-a135-2b3da10aa028") {
      if (ip === "unknown") throw new HttpError(503, "잠시 후 다시 이용해 주세요.");
      const store = getStore("cbam-navigator-rate-limit");
      const recordKey = `nav:${scope}:${hmac(id || ip).slice(0, 32)}`;
      for (let attempt = 0; attempt < 8; attempt++) {
        const current = await store.getWithMetadata(recordKey, { type: "json", consistency: "strong" });
        const old = current?.data as { bucket?: number; count?: number } | undefined;
        const next = old?.bucket === bucket ? (old.count || 0) + 1 : 1;
        if (next > max) throw new HttpError(429, "요청이 많습니다. 잠시 후 다시 이용해 주세요.");
        const result = await store.setJSON(recordKey, { bucket, count: next }, current?.etag ? { onlyIfMatch: current.etag } : { onlyIfNew: true });
        if (result.modified) return;
      }
      throw new HttpError(503, "잠시 후 다시 이용해 주세요.");
    }
    if (process.env.NODE_ENV === "production" && !(process.env.NAVIGATOR_LOCAL_PREVIEW === "1" && request.nextUrl.hostname === "localhost"))
      throw new HttpError(503, "잠시 후 다시 이용해 주세요.");
    for (const [k, v] of localCounters)
      if (v.expires < Date.now()) localCounters.delete(k);
    const current = localCounters.get(key) || {
      count: 0,
      expires: Date.now() + seconds * 1000,
    };
    count = ++current.count;
    localCounters.set(key, current);
  }
  if (count > max)
    throw new HttpError(429, "요청이 많습니다. 잠시 후 다시 이용해 주세요.");
}
export function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
export function failure(error: unknown) {
  const status = error instanceof HttpError ? error.status : 503;
  const response = json(
    {
      message:
        error instanceof HttpError
          ? error.message
          : "서비스 연결이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.",
    },
    status,
  );
  if (status === 429) response.headers.set("Retry-After", "3600");
  return response;
}
