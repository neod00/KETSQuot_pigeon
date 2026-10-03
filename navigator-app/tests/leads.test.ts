import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseLead, mergeLead, LEAD_PRIVACY_VERSION } from '../src/shared/cbam-lead';
import { upsertLead, listLeads, mutateLead, linkLeadApplication } from '../../web-app/src/lib/cbam-lead-store';
import { requestLeadNotification } from '../../web-app/src/lib/cbam-lead-notification';
const input = { companyName:'시험 회사', contactName:'테스트 담당자', phone:'010-1234-5678', email:'TEST@example.invalid', intent:'pdf', consent:true, privacyNoticeVersion:LEAD_PRIVACY_VERSION, navigatorData:{ sessionId:'NAV-11111111-1111-4111-8111-111111111111', readinessAnswers:{ S1:'ready' }, readinessScore:100, evidenceStatus:{ S1:'ready' } } };
test('lead intake requires all contacts and current explicit consent; scores and fields are sanitized', () => {
  for (const field of ['companyName','contactName','phone','email']) assert.throws(() => parseLead({ ...input,[field]:'' }));
  for (const bad of [{ consent:false },{ privacyNoticeVersion:'old' },{ phone:'123' },{ email:'test\n@example.com' },{ intent:'unknown' }]) assert.throws(() => parseLead({ ...input,...bad }));
  const clean = parseLead({ ...input, internalCost:1234, navigatorData:{ ...input.navigatorData, readinessAnswers:{ S1:'ready', fake:'ready' } } });
  assert.equal(clean.email,'test@example.invalid'); assert.equal(clean.navigatorData.readinessScore,undefined);
  assert.ok(!('internalCost' in clean)); assert.deepEqual(clean.navigatorData.readinessAnswers,{ S1:'ready' });
});
test('document and consultation requests accumulate without losing management state or existing consultation notes', () => {
  const first = mergeLead(null,parseLead(input),'CBAM-L-111111111111111111111111');
  const second = mergeLead({ ...first, status:'연락 완료', managementNotes:'다음 주 연락' },parseLead({ ...input,intent:'consultation',consultationMessage:'상담 요청 내용' }),first.reference);
  const third = mergeLead(second,parseLead({ ...input,intent:'xlsx' }),first.reference);
  assert.deepEqual(third.documents,['pdf','xlsx']); assert.ok(third.consultationRequestedAt);
  assert.equal(third.status,'연락 완료'); assert.equal(third.managementNotes,'다음 주 연락'); assert.equal(third.consultationMessage,'상담 요청 내용');
});
test('stored lead is deduplicated, notification retries survive failures, successful requests do not send twice, and applications link', async () => {
  const ref = 'CBAM-L-222222222222222222222222';
  await upsertLead(parseLead(input),ref); await upsertLead(parseLead({ ...input,intent:'xlsx' }),ref);
  assert.equal((await listLeads()).filter(x => x.reference === ref).length,1);
  const originalFetch = globalThis.fetch; let calls = 0;
  globalThis.fetch = async () => { calls++; return new Response('',{ status:503 }); };
  try {
    await requestLeadNotification(ref); assert.equal(calls,0);
    await upsertLead(parseLead({ ...input,intent:'consultation' }),ref);
    await requestLeadNotification(ref); assert.equal((await listLeads()).find(x => x.reference === ref)?.notificationStatus,'failed');
    globalThis.fetch = async (_url, options) => { calls++; const body = new URLSearchParams(String(options?.body)); assert.equal(body.get('email'),'test@example.invalid'); assert.equal(body.get('form-name'),'cbam-consultation'); return new Response('',{ status:200 }); };
    await requestLeadNotification(ref); await requestLeadNotification(ref); assert.equal(calls,2);
    assert.equal((await listLeads()).find(x => x.reference === ref)?.notificationStatus,'requested');
    await linkLeadApplication(input.navigatorData.sessionId,'test@example.invalid','CBAM-TEST');
    const saved = (await listLeads()).find(x => x.reference === ref)!; assert.equal(saved.status,'정식 신청'); assert.equal(saved.applicationReference,'CBAM-TEST');
    await mutateLead(ref,old => old ? { ...old,assignedTo:'관리자' } : null);
    assert.equal((await listLeads()).find(x => x.reference === ref)?.assignedTo,'관리자');
  } finally { globalThis.fetch = originalFetch; }
});
