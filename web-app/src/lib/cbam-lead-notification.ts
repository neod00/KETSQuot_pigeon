import { mutateLead } from './cbam-lead-store';
import { scoreReadiness } from './cbam-navigator';
export async function requestLeadNotification(reference: string) {
  let claimed = false;
  const lead = await mutateLead(reference, old => {
    claimed = false;
    if (!old?.consultationRequestedAt || old.notificationStatus === 'requested' || (old.notificationStatus === 'sending' && Date.now() - Date.parse(old.notificationAttemptAt || '') < 300000)) return null;
    claimed = true;
    return { ...old, notificationStatus:'sending', notificationAttemptAt:new Date().toISOString() };
  });
  if (!claimed || !lead) return;
  try {
    const scored = scoreReadiness(lead.navigatorData.readinessAnswers || {});
    const form = new URLSearchParams({ 'form-name':'cbam-consultation', 'bot-field':'', subject:`[CBAM 상담 요청] ${lead.companyName.replace(/[\r\n]/g,' ')} / ${lead.contactName.replace(/[\r\n]/g,' ')}`,
      company:lead.companyName, name:lead.contactName, email:lead.email, phone:lead.phone, reference:lead.reference,
      product:lead.navigatorData.productName || '', cn_codes:lead.navigatorData.searchedCnCodes?.join(', ') || '', sites:lead.sites,
      readiness:scored.complete ? `${scored.readinessScore}%` : `진단 미완료 (${scored.answered}/24)`,
      message:lead.consultationMessage || lead.decisionRequest || '진단 결과 상담을 요청합니다.',
      admin_url:`https://ketsquot-pigeon.netlify.app/cbam/admin?view=leads&lead=${encodeURIComponent(lead.reference)}` });
    const response = await fetch('https://lrqa-cbam-navigator.netlify.app/__forms.html', { method:'POST', headers:{ 'Content-Type':'application/x-www-form-urlencoded' }, body:form.toString(), signal:AbortSignal.timeout(12000), redirect:'error' });
    if (!response.ok) throw new Error('Form notification rejected');
    await mutateLead(reference, old => old ? { ...old, notificationStatus:'requested', notificationRequestedAt:new Date().toISOString() } : null);
  } catch { await mutateLead(reference, old => old ? { ...old, notificationStatus:'failed' } : null); }
}
