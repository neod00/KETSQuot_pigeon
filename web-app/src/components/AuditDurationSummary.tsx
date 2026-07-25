import type { AuditDurationResult } from '@/lib/auditDurationEngine';

const statusStyle = {
  calculated: 'border-teal-200 bg-teal-50 text-teal-800',
  review_required: 'border-amber-200 bg-amber-50 text-amber-900',
  insufficient: 'border-red-200 bg-red-50 text-red-800',
} as const;

const statusLabel = {
  calculated: '자동 산정 완료',
  review_required: '담당자 검토 필요',
  insufficient: '산정 정보 부족',
} as const;

export default function AuditDurationSummary({
  result,
  compact = false,
}: {
  result: AuditDurationResult;
  compact?: boolean;
}) {
  return (
    <section className="border border-slate-200 bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div>
          <h3 className="font-bold text-slate-900">심사일수 자동 산정</h3>
          <p className="mt-1 text-xs text-slate-500">{result.rulesetVersion}</p>
        </div>
        <span className={`border px-2 py-1 text-xs font-bold ${statusStyle[result.status]}`}>
          {statusLabel[result.status]}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <th className="border-b border-slate-200 px-4 py-2">규격</th>
              <th className="border-b border-slate-200 px-3 py-2 text-right">기준</th>
              <th className="border-b border-slate-200 px-3 py-2 text-right">Stage 1</th>
              <th className="border-b border-slate-200 px-3 py-2 text-right">Stage 2</th>
              <th className="border-b border-slate-200 px-3 py-2 text-right">사후관리</th>
              <th className="border-b border-slate-200 px-4 py-2 text-right">갱신</th>
            </tr>
          </thead>
          <tbody>
            {result.perStandard.map((row) => (
              <tr key={row.standard}>
                <td className="border-b border-slate-100 px-4 py-2 font-bold text-slate-800">{row.standard}</td>
                <td className="border-b border-slate-100 px-3 py-2 text-right">{row.adjustedInitialDays.toFixed(1)}</td>
                <td className="border-b border-slate-100 px-3 py-2 text-right">{row.stage1Days.toFixed(1)}</td>
                <td className="border-b border-slate-100 px-3 py-2 text-right">{row.stage2Days.toFixed(1)}</td>
                <td className="border-b border-slate-100 px-3 py-2 text-right">{row.surveillanceDays.toFixed(1)}</td>
                <td className="border-b border-slate-100 px-4 py-2 text-right">{row.recertDays.toFixed(1)}</td>
              </tr>
            ))}
            {result.perStandard.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-5 text-center text-slate-500">
                  ISO 9001, ISO 14001 또는 ISO 45001과 유효 인원을 입력하세요.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 px-4 py-3 text-sm sm:grid-cols-3">
        <div>
          <p className="text-xs text-slate-500">유효 인원</p>
          <p className="mt-1 font-bold text-slate-900">{result.effectiveEmployees.toLocaleString()}명</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">통합심사 감축</p>
          <p className="mt-1 font-bold text-slate-900">{result.integrationReductionPercent}%</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">최초심사 합계</p>
          <p className="mt-1 font-bold text-slate-900">{result.combinedAdjustedInitialDays.toFixed(1)} MD</p>
        </div>
      </div>

      {!compact && result.rationale.length > 0 && (
        <details className="border-t border-slate-200 px-4 py-3">
          <summary className="cursor-pointer text-sm font-bold text-slate-700">산정 근거 보기</summary>
          <ul className="mt-3 space-y-1 text-sm text-slate-600">
            {result.rationale.map((item) => <li key={item}>- {item}</li>)}
          </ul>
        </details>
      )}

      {result.warnings.length > 0 && (
        <div className="border-t border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-xs font-bold uppercase text-amber-800">확인 사항</p>
          <ul className="mt-2 space-y-1 text-sm text-amber-900">
            {result.warnings.map((warning) => <li key={warning}>- {warning}</li>)}
          </ul>
        </div>
      )}
    </section>
  );
}
