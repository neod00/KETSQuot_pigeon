import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'node:crypto';
import { verifyIntake } from '@/lib/cbam-intake-signature';
import { parseLead, LEAD_STATUSES } from '@/lib/cbam-lead';
import { listLeads, mutateLead, upsertLead } from '@/lib/cbam-lead-store';
import { requestLeadNotification } from '@/lib/cbam-lead-notification';
import { getIsoRequestSession } from '@/lib/isoAuth';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers:{ 'Cache-Control':'no-store' } });
export async function POST(request: NextRequest) {
  try {
    const reader = request.body?.getReader(); if (!reader) return json({ message:'입력 내용이 없습니다.' },400);
    let length = 0; const chunks: Uint8Array[] = [];
    while (true) { const { value, done } = await reader.read(); if (done) break; length += value.byteLength; if (length > 32000) { await reader.cancel(); return json({ message:'요청 크기 초과' },413); } chunks.push(value); }
    const raw = Buffer.concat(chunks).toString('utf8'), secret = process.env.NAVIGATOR_INTAKE_SECRET || '';
    if (!verifyIntake(raw, request.headers.get('x-navigator-timestamp') || '', request.headers.get('x-navigator-signature') || '', secret)) return json({ message:'인증 실패' },401);
    let input; try { input = parseLead(JSON.parse(raw)); } catch { return json({ message:'입력값 오류' },400); }
    const reference = `CBAM-L-${createHmac('sha256',secret).update(`${input.navigatorData.sessionId}:${input.email}`).digest('hex').slice(0,24).toUpperCase()}`;
    await upsertLead(input, reference);
    if (input.intent === 'consultation') await requestLeadNotification(reference);
    return json({ reference },201);
  } catch { return json({ message:'진단 접수를 저장하지 못했습니다.' },503); }
}
export async function GET(request: NextRequest) {
  if (!getIsoRequestSession(request)) return json({ message:'로그인이 필요합니다.' },401);
  try { return json({ leads:await listLeads() }); } catch { return json({ message:'진단 접수를 불러오지 못했습니다.' },503); }
}
export async function PUT(request: NextRequest) {
  if (!getIsoRequestSession(request)) return json({ message:'로그인이 필요합니다.' },401);
  const origin = request.headers.get('origin');
  if (request.headers.get('sec-fetch-site') === 'cross-site' || (origin && origin !== request.nextUrl.origin)) return json({ message:'허용되지 않은 요청입니다.' },403);
  try {
    if (Number(request.headers.get('content-length')) > 8000) return json({ message:'입력 내용이 너무 깁니다.' },413);
    const v = await request.json();
    if (!/^CBAM-L-[A-F0-9]{24}$/.test(v.reference || '')) return json({ message:'접수번호를 확인해 주세요.' },400);
    if (v.action === 'retry-notification') { await requestLeadNotification(v.reference); return json({ leads:await listLeads() }); }
    if (!LEAD_STATUSES.includes(v.status) || typeof v.assignedTo !== 'string' || v.assignedTo.length > 120 || typeof v.managementNotes !== 'string' || v.managementNotes.length > 3000) return json({ message:'관리 항목을 확인해 주세요.' },400);
    const lead = await mutateLead(v.reference, old => old ? { ...old, status:v.status, assignedTo:v.assignedTo.trim(), managementNotes:v.managementNotes.trim(), updatedAt:new Date().toISOString() } : null);
    return lead ? json({ lead }) : json({ message:'접수 내역이 없습니다.' },404);
  } catch { return json({ message:'관리 내용을 저장하지 못했습니다.' },503); }
}
