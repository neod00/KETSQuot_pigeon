export interface IsoQuoteCostValues {
  standard: string;
  stage1Days: number;
  stage2Days: number;
  surveillanceDays: number;
  recertDays: number;
  dayRate: number;
}

export const isRenewalQuote = (auditType: string) => auditType.includes('갱신');
export const isSurveillanceQuote = (auditType: string) => auditType.includes('사후');
export const isTransferQuote = (auditType: string) => auditType.includes('전환') || auditType.includes('인수');
export const isCurrentCycleQuote = (auditType: string) => isRenewalQuote(auditType) || isSurveillanceQuote(auditType);

const isIso50001 = (standard: string) => /^ISO\s*50001(?:\b|:)/i.test(standard.trim());

export const calculateIsoQuoteCost = (input: IsoQuoteCostValues, auditType: string) => {
  const renewalQuote = isRenewalQuote(auditType);
  const surveillanceQuote = isSurveillanceQuote(auditType);
  const transferQuote = isTransferQuote(auditType);
  const freeTransfer = transferQuote && isIso50001(input.standard);

  const stage1Fee = input.stage1Days * input.dayRate;
  const stage2Fee = input.stage2Days * input.dayRate;
  const initialAuditFee = stage1Fee + stage2Fee;
  const annualSurveillanceFee = input.surveillanceDays * input.dayRate;
  const recertificationFee = input.recertDays * input.dayRate;

  let activeAuditDays = input.stage1Days + input.stage2Days;
  let activeAuditFee = initialAuditFee;

  if (renewalQuote) {
    activeAuditDays = input.recertDays;
    activeAuditFee = recertificationFee;
  } else if (surveillanceQuote) {
    activeAuditDays = input.surveillanceDays;
    activeAuditFee = annualSurveillanceFee;
  } else if (freeTransfer) {
    activeAuditDays = 1;
    activeAuditFee = 0;
  }

  return {
    stage1Fee,
    stage2Fee,
    initialAuditFee,
    annualSurveillanceFee,
    recertificationFee,
    activeAuditDays,
    activeAuditFee,
    freeTransfer,
    singleLineAudit: isCurrentCycleQuote(auditType) || freeTransfer,
    futureAuditDays: isCurrentCycleQuote(auditType)
      ? null
      : transferQuote
        ? input.recertDays
        : input.surveillanceDays,
    note: renewalQuote ? '3년 주기 갱신' : surveillanceQuote ? '12개월 주기' : '-',
  };
};

export const futureAuditHeader = (auditType: string) => isTransferQuote(auditType)
  ? { title: '갱신 심사', cycle: '3년 주기' }
  : { title: '사후관리 심사', cycle: '12개월 주기' };
