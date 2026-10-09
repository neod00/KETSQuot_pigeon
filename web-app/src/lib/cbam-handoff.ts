import type { CbamApplicationInput } from './cbam-input';
import { object, parseNavigator, GOODS } from './cbam-intake-schema';
import type { CbamNavigatorData } from './cbam-navigator';

export const CBAM_APPLICATION_URL = 'https://ketsquot-pigeon.netlify.app/cbam';
export type ApplicantInfo = Pick<CbamApplicationInput, 'companyName' | 'contactName' | 'email' | 'phone'>;
export type NavigatorHandoff = { version: 1; createdAt: number; prefill: Partial<CbamApplicationInput>; navigatorData: CbamNavigatorData };
function parse(value: unknown, now: number): NavigatorHandoff {
  const v = object(value), raw = object(v.prefill);
  if (v.version !== 1 || typeof v.createdAt !== 'number' || !Number.isFinite(v.createdAt) || v.createdAt > now + 60000 || now - v.createdAt > 30 * 60000) throw new Error('진단정보 연결이 만료되었습니다. Navigator에서 검증 신청을 다시 눌러 주세요.');
  const prefill: Partial<CbamApplicationInput> = {};
  const contactLimits = { companyName: 160, contactName: 120, email: 254, phone: 40 } as const;
  for (const key of Object.keys(contactLimits) as (keyof ApplicantInfo)[]) {
    if (typeof raw[key] === 'string' && raw[key].length <= contactLimits[key] && raw[key].trim()) prefill[key] = raw[key].trim();
  }
  if (typeof raw.notes === 'string' && raw.notes.length <= 8000 && raw.notes.trim()) prefill.notes = raw.notes.trim();
  if (Array.isArray(raw.verificationYears)) prefill.verificationYears = [...new Set(raw.verificationYears.filter((year): year is string => typeof year === 'string' && /^20(?:2[4-9]|3[01])$/.test(year)))];
  for (const key of ['country', 'sites', 'cnCodes', 'productionProcesses'] as const) {
    if (typeof raw[key] === 'string' && raw[key].length <= 500 && raw[key].trim()) prefill[key] = raw[key].trim();
  }
  if (raw.clientType === 'operator' || raw.clientType === 'importer') prefill.clientType = raw.clientType;
  if (Array.isArray(raw.cbamGoods)) prefill.cbamGoods = [...new Set(raw.cbamGoods.filter((x): x is string => typeof x === 'string' && GOODS.includes(x)))];
  return { version: 1, createdAt: v.createdAt, prefill, navigatorData: parseNavigator(v.navigatorData) };
}
export function encodeHandoff(value: NavigatorHandoff, now = Date.now()): string {
  const bytes = new TextEncoder().encode(JSON.stringify(parse(value, now)));
  const encoded = btoa(Array.from(bytes, b => String.fromCharCode(b)).join('')).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  if (encoded.length > 24000) throw new Error('진단정보가 너무 큽니다. 입력 내용을 줄여 주세요.');
  return encoded;
}
export function decodeHandoff(encoded: string, now = Date.now()): NavigatorHandoff {
  if (!encoded || encoded.length > 24000 || !/^[A-Za-z0-9_-]+$/.test(encoded)) throw new Error('진단정보 연결 형식이 올바르지 않습니다.');
  const bytes = Uint8Array.from(atob(encoded.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
  return parse(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)), now);
}
export function handoffUrl(value: NavigatorHandoff): string {
  return `${CBAM_APPLICATION_URL}#navigator=${encodeHandoff(value)}`;
}
