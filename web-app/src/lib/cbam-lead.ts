import { object, parseNavigator } from './cbam-intake-schema';
import type { CbamNavigatorData } from './cbam-navigator';
export const LEAD_PRIVACY_VERSION = '2026-10-03';
export const LEAD_STATUSES = ['미연락', '연락 완료', '상담 진행', '정식 신청', '보류'] as const;
export type LeadStatus = typeof LEAD_STATUSES[number];
export type LeadIntent = 'pdf' | 'xlsx' | 'csv' | 'consultation';
export type NavigatorLeadInput = {
  companyName: string; contactName: string; phone: string; email: string;
  recipient: string; reportingPeriod: string; deadline: string; decisionRequest: string; consultationMessage: string;
  sites: string; productionProcesses: string; productionRoute: string; precursors: string; country: string;
  navigatorData: CbamNavigatorData; intent: LeadIntent; consent: true; privacyNoticeVersion: typeof LEAD_PRIVACY_VERSION;
};
export type NavigatorLead = Omit<NavigatorLeadInput, 'intent'> & {
  reference: string; createdAt: string; updatedAt: string; consentedAt: string;
  documents: ('pdf' | 'xlsx' | 'csv')[]; consultationRequestedAt?: string;
  status: LeadStatus; assignedTo: string; managementNotes: string;
  applicationReference?: string;
  notificationStatus?: 'sending' | 'requested' | 'failed'; notificationAttemptAt?: string; notificationRequestedAt?: string;
};
export function parseLead(value: unknown): NavigatorLeadInput {
  const v = object(value), out: Record<string, unknown> = {};
  const limits: Record<string, number> = { companyName:160, contactName:120, phone:40, email:254, recipient:160, reportingPeriod:120, deadline:10, decisionRequest:1500, consultationMessage:1500, sites:500, productionProcesses:1000, productionRoute:1000, precursors:1000, country:100 };
  for (const [key, max] of Object.entries(limits)) {
    const raw = v[key] ?? '';
    if (typeof raw !== 'string' || raw.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(raw)) throw new Error('입력값의 형식과 길이를 확인해 주세요.');
    out[key] = raw.trim();
  }
  for (const key of ['companyName','contactName','phone','email']) if (!out[key]) throw new Error('회사명, 담당자명, 전화번호와 이메일을 모두 입력해 주세요.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(out.email)) || /[\r\n]/.test(String(out.email))) throw new Error('이메일 주소를 확인해 주세요.');
  if (!/^[+\d][\d ()-]{6,39}$/.test(String(out.phone)) || String(out.phone).replace(/\D/g, '').length < 8) throw new Error('전화번호를 확인해 주세요.');
  if (out.deadline && (!/^\d{4}-\d{2}-\d{2}$/.test(String(out.deadline)) || new Date(`${out.deadline}T00:00:00Z`).toISOString().slice(0,10) !== out.deadline)) throw new Error('회신기한을 확인해 주세요.');
  if (!['pdf','xlsx','csv','consultation'].includes(String(v.intent))) throw new Error('요청 종류를 확인해 주세요.');
  if (v.consent !== true || v.privacyNoticeVersion !== LEAD_PRIVACY_VERSION) throw new Error('개인정보 수집·이용 안내를 확인하고 동의해 주세요.');
  return { ...out, email: String(out.email).toLowerCase(), intent: v.intent, consent: true, privacyNoticeVersion: LEAD_PRIVACY_VERSION, navigatorData: parseNavigator(v.navigatorData) } as NavigatorLeadInput;
}
export function mergeLead(previous: NavigatorLead | null, input: NavigatorLeadInput, reference: string, now = new Date().toISOString()): NavigatorLead {
  const { intent, ...values } = input;
  return { ...previous, ...values, consultationMessage: intent === 'consultation' ? values.consultationMessage : previous?.consultationMessage || values.consultationMessage, reference, createdAt: previous?.createdAt || now, updatedAt: now, consentedAt: now,
    documents: [...new Set([...(previous?.documents || []), ...(intent === 'consultation' ? [] : [intent])])],
    consultationRequestedAt: previous?.consultationRequestedAt || (intent === 'consultation' ? now : undefined),
    status: previous?.status || '미연락', assignedTo: previous?.assignedTo || '', managementNotes: previous?.managementNotes || '',
  };
}
