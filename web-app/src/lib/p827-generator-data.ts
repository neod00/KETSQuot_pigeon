import { P827_SCOPE3_CATEGORIES } from './p827-application';

export const P827_GENERATOR_DEFAULTS = {
        companyName: '',
        proposalNo: '',
        proposalDate: '',
        serviceDesc: '온실가스 배출량 Scope 1,2 제3자 검증',
        adminName: '권대근',
        hqAddress: '',
        targetSites: '본사 및 대상 사업장',
        vYear: '2025',
        ghgDeclarationPeriod: '2025년 01월 01일~2025년 12월 31일',
        assuranceLevel: '제한적 보증수준 (Limited level of assurance)',
        materialityLevel: '전문적 판단',
        verificationStandard: 'isae' as 'isae' | 'iso14064',
        scope3Categories: Array(P827_SCOPE3_CATEGORIES.length).fill(false) as boolean[],
        auditRate: 1350000,
        s1Days: 1.0,
        s2Days: 3.0,
        s3Days: 2.0,
        expenses: 400000,
        appFeeType: 'exempt',
        appFeeAmount: 720000,
        vatType: '별도',
        validity: 90,
        clientRepName: '',
        clientRepTitle: '대표이사',
        reportingDeadline: '2026년 12월 31일',
        manualFinalCost: 0,
        isManualCost: false,
    };

export type P827GeneratorData = typeof P827_GENERATOR_DEFAULTS;

export function parseVerificationYears(value: string): string[] {
    if (!/^20\d{2}(?:\s*,\s*20\d{2})*$/.test(value.trim())) return [];
    return [...new Set(value.split(',').map(year => year.trim()))].sort();
}

export function verificationPeriodFull(value: string) {
    const years = parseVerificationYears(value);
    if (years.length > 1) return `${years.map(year => `${year}년 1월 ~ 12월`).join('; ')} (총 ${years.length * 12}개월)`;
    return `${value}년 1월 ~ 12월 (12개월)`;
}

export function verificationYearDuration(value: string) {
    const count = parseVerificationYears(value).length;
    return count > 1 ? `${count}개년` : '1년';
}

export function p827DocumentError(data: P827GeneratorData, kind: 'quote' | 'contract') {
    const numbers = [data.s1Days, data.s2Days, data.s3Days, data.auditRate, data.expenses, data.appFeeAmount, data.manualFinalCost];
    if (numbers.some(value => !Number.isFinite(value) || value < 0) || data.s1Days + data.s2Days + data.s3Days <= 0 || data.manualFinalCost <= 0) return '검증일수와 최종 제안 금액을 입력하고, 음수 입력값이 없는지 확인해 주세요.';
    if (!data.companyName.trim() || !data.targetSites.trim() || !parseVerificationYears(data.vYear).length || !data.proposalDate || !data.proposalNo.trim()) return '회사명, 대상 사업장, 검증대상년도, 발행일자, 제안서 번호를 확인해 주세요.';
    if (kind === 'contract' && (!data.hqAddress.trim() || !data.clientRepName.trim())) return '계약서에 사용할 회사 주소와 계약 대표자명을 입력해 주세요.';
    return '';
}

export function formatP827PrintValue(value: unknown) {
    return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/ /g, '\u00a0').replace(/\n/g, '<br/>');
}

export function parseP827GeneratorDraft(value: unknown): Record<string, unknown> | null {
    if (value === null) return null;
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('견적 조건을 확인해 주세요.');
    const raw = value as Record<string, unknown>;
    const draft: Record<string, unknown> = {};
    for (const [key, defaultValue] of Object.entries(P827_GENERATOR_DEFAULTS)) {
        const input = raw[key];
        if (input === undefined) continue;
        if (Array.isArray(defaultValue)) {
            if (!Array.isArray(input) || input.length !== 15 || !input.every(item => typeof item === 'boolean')) throw new Error('견적서의 Scope 3 범위를 확인해 주세요.');
        } else if (typeof input !== typeof defaultValue ||
            (typeof input === 'number' && (!Number.isFinite(input) || input < 0 || input > 1_000_000_000_000)) ||
            (typeof input === 'string' && input.length > 5000)) throw new Error('견적 조건의 형식과 범위를 확인해 주세요.');
        draft[key] = input;
    }
    if (draft.verificationStandard !== undefined && !['isae', 'iso14064'].includes(String(draft.verificationStandard))) throw new Error('검증기준을 확인해 주세요.');
    return draft;
}
