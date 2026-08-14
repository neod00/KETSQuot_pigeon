import type { AuditDurationResult, CoreIsoStandard } from './auditDurationEngine';

export type AuditDurationAdjustmentDirection = 'increase' | 'decrease';

export type AuditDurationAdjustment = {
  id: string;
  standard: CoreIsoStandard | 'all';
  factor: string;
  direction: AuditDurationAdjustmentDirection;
  percent: number;
  justification: string;
  evidenceConfirmed: boolean;
};

export const AUDIT_DURATION_ADJUSTMENT_FACTORS = [
  '고위험 공정 또는 법규·규제 복잡성',
  '임시 사업장·계절성 활동 또는 잦은 현장 변경',
  '원격지·출장·물류 제약',
  '다국어 운영 또는 통역 필요',
  '외주 공정·공급망 통제의 복잡성',
  '유사·반복 활동',
  '고객 현장 중심 활동',
  '기타 담당자 판단',
] as const;

const roundHalf = (value: number) => Math.round(value * 2) / 2;

const splitInitialDays = (standard: CoreIsoStandard, total: number) => {
  if (standard === 'ISO 9001') {
    return { stage1Days: Math.ceil((total / 3) * 2) / 2, stage2Days: Math.ceil(((total * 2) / 3) * 2) / 2 };
  }
  if (standard === 'ISO 14001') {
    return { stage1Days: Math.ceil((total / 3) * 2) / 2, stage2Days: roundHalf((total * 2) / 3) };
  }
  return { stage1Days: roundHalf(total / 3), stage2Days: Math.ceil(((total * 2) / 3) * 2) / 2 };
};

const applicableAdjustments = (standard: CoreIsoStandard, adjustments: AuditDurationAdjustment[]) =>
  adjustments.filter((adjustment) => adjustment.standard === 'all' || adjustment.standard === standard);

/**
 * ADJ adjustment factors require assessor evidence. This helper only applies
 * confirmed, documented entries and leaves all others as visible warnings.
 */
export const applyAuditDurationAdjustments = (
  result: AuditDurationResult,
  adjustments: AuditDurationAdjustment[],
): AuditDurationResult => {
  if (adjustments.length === 0) return result;

  const warnings = [...result.warnings];
  const rationale = [...result.rationale];
  const perStandard = result.perStandard.map((row) => {
    const requested = applicableAdjustments(row.standard, adjustments);
    const applicable = requested.filter((adjustment) => {
      const percent = Number(adjustment.percent);
      if (!adjustment.evidenceConfirmed || !adjustment.justification.trim() || !Number.isFinite(percent) || percent <= 0) {
        warnings.push(`${row.standard}: ${adjustment.factor} 증감은 증빙 확인, 비율 및 근거를 입력한 뒤 적용됩니다.`);
        return false;
      }
      if (percent > 50) {
        warnings.push(`${row.standard}: ${adjustment.factor} ${percent}%는 50% 초과이므로 적용하지 않았습니다. ADJ에서 별도 검토하세요.`);
        return false;
      }
      return true;
    });
    const netPercent = applicable.reduce((total, adjustment) => (
      total + (adjustment.direction === 'increase' ? Number(adjustment.percent) : -Number(adjustment.percent))
    ), 0);
    if (applicable.length === 0) return row;

    const adjustedInitialDays = Math.max(0.5, roundHalf(row.adjustedInitialDays * (1 + netPercent / 100)));
    const split = splitInitialDays(row.standard, adjustedInitialDays);
    rationale.push(
      `${row.standard}: 담당자 선택 증감요인 ${netPercent > 0 ? '+' : ''}${netPercent.toFixed(1)}%를 통합심사 감축 후 일수에 적용했습니다.`,
    );
    return {
      ...row,
      adjustedInitialDays,
      ...split,
      surveillanceDays: Math.max(1, roundHalf(adjustedInitialDays / 3)),
      recertDays: Math.max(1, roundHalf((adjustedInitialDays * 2) / 3)),
      rationale: [
        ...row.rationale,
        ...applicable.map((adjustment) => `${adjustment.direction === 'increase' ? '증가' : '감소'} ${adjustment.percent}%: ${adjustment.factor} - ${adjustment.justification}`),
      ],
    };
  });

  return {
    ...result,
    status: result.status === 'insufficient' ? 'insufficient' : 'review_required',
    perStandard,
    combinedAdjustedInitialDays: roundHalf(perStandard.reduce((total, row) => total + row.stage1Days + row.stage2Days, 0)),
    warnings: [...new Set(warnings)],
    rationale: [...new Set(rationale)],
  };
};
