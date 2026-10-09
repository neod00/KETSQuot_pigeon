import type { ApplicantInfo, NavigatorHandoff } from '@/shared/cbam-handoff';
import type { Draft } from '@/components/NavigatorContext';
import type { ReportDetails } from './business-document-data';

export function verificationYearsFromPeriod(period: string): string[] {
  const input = period.trim();
  let first: number, last: number;
  if (/^20\d{2}(?:년|년도)?$/.test(input)) first = last = Number(input.slice(0, 4));
  else {
    const match = input.match(/^(20\d{2})[./-](\d{2})[./-](\d{2})\s*[~–]\s*(20\d{2})[./-](\d{2})[./-](\d{2})$/);
    if (!match) return [];
    const validDate = (year: number, month: number, day: number) => {
      const date = new Date(Date.UTC(year, month - 1, day));
      return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
    };
    first = Number(match[1]); last = Number(match[4]);
    if (!validDate(first, Number(match[2]), Number(match[3])) || !validDate(last, Number(match[5]), Number(match[6])) || input.slice(0, 10).replace(/[./]/g, '-') > match.slice(4).join('-')) return [];
  }
  if (first < 2024 || last > 2031 || first > last) return [];
  return Array.from({ length: last - first + 1 }, (_, index) => String(first + index));
}

export function applicationHandoff(draft: Draft, applicant: Partial<ApplicantInfo>, details: ReportDetails, consultationMessage: string, createdAt: number): NavigatorHandoff {
  const notes: string[] = [];
  const add = (label: string, value: string) => { if (value.trim()) notes.push(`${label}: ${value.trim()}`); };
  add('생산경로', draft.productionRoute);
  add('관련 전구물질', draft.precursors);
  add('자료 대상기간', details.reportingPeriod);
  add('회신 요청기한', details.deadline);
  add('보고 대상·수신 부서', details.recipient);
  add('지원·의사결정 요청', details.decisionRequest);
  add('상담 요청 내용', consultationMessage);
  add('관세 원산지', draft.country);
  add('EU 반입 여부', ({ yes: '예', no: '아니요', unknown: '확인 필요' } as Record<string, string>)[draft.euExport] || '');
  if (draft.mass.trim()) add('EU 수입자별 연간 대상 수입량', `${draft.mass}t${draft.allImports ? ' (모든 공급국·공급업체 합산 확인)' : ' (합산 여부 확인 필요)'}`);
  const additionalNotes = notes.join('\n');
  if (additionalNotes.length > 8000) throw new Error('추가 입력내용이 너무 깁니다. 검증 신청으로 이어가기 전에 요청사항을 줄여 주세요.');
  return {
    version: 1, createdAt,
    prefill: {
      ...applicant,
      cnCodes: draft.cnCode, cbamGoods: draft.sector ? [draft.sector] : [],
      country: ({ KR: '대한민국', CN: '중국', JP: '일본', IN: '인도', US: '미국', CH: '스위스', IS: '아이슬란드', LI: '리히텐슈타인', NO: '노르웨이' } as Record<string, string>)[draft.country] || '',
      sites: draft.sites, productionProcesses: draft.productionProcesses,
      clientType: draft.importer === 'importer' ? 'importer' : draft.importer === 'operator' ? 'operator' : undefined,
      verificationYears: verificationYearsFromPeriod(details.reportingPeriod),
      notes: additionalNotes,
    },
    navigatorData: { sessionId: draft.sessionId, productName: draft.productName, searchedCnCodes: draft.searchedCnCodes, readinessAnswers: draft.answers, startedAt: draft.startedAt },
  };
}
