'use client';

import { useEffect, useState } from 'react';
import {
  CBAM_SCOPE_SOURCE,
  TARIC_SOURCE,
  type CbamCnAssessment,
  type CbamCnStatus,
  type CbamProductCandidate,
} from '@/lib/cbam-cn';

type Props = {
  adminKey: string;
  initialCodes?: string;
  applicationReference?: string;
  companyName?: string;
};

type CodeResponse = {
  assessments: CbamCnAssessment[];
  scopeVersion: string;
  cnVersion: string;
  message?: string;
};

type ProductResponse = {
  candidates: CbamProductCandidate[];
  aiUsed: boolean;
  aiStatus: 'completed' | 'not_configured' | 'empty' | 'fallback';
  model?: string;
  message: string;
  scopeVersion: string;
  cnVersion: string;
};

export default function CnCodeChecker({ adminKey, initialCodes = '', applicationReference, companyName }: Props) {
  const [mode, setMode] = useState<'codes' | 'product'>('codes');
  const [codes, setCodes] = useState(initialCodes);
  const [codeResult, setCodeResult] = useState<CodeResponse | null>(null);
  const [productResult, setProductResult] = useState<ProductResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [product, setProduct] = useState({ productName: '', material: '', form: '', use: '' });

  useEffect(() => {
    setCodes(initialCodes);
    setCodeResult(null);
  }, [initialCodes, applicationReference]);

  async function post<T>(body: object) {
    const response = await fetch('/api/cbam/cn-codes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(adminKey ? { 'x-cbam-admin-key': adminKey } : {}),
      },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || '조회하지 못했습니다.');
    return result as T;
  }

  async function checkCodes() {
    setLoading(true);
    setError('');
    try {
      setCodeResult(await post<CodeResponse>({ kind: 'codes', codes }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'CN 코드를 확인하지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function searchProduct() {
    setLoading(true);
    setError('');
    try {
      setProductResult(await post<ProductResponse>({ kind: 'product', ...product }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '제품 후보를 검색하지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5 sm:p-6">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-teal-700">Scope assessment tool</p>
          <h2 className="mt-2 text-2xl font-black">CBAM 대상 여부 조회</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">CN 코드는 법령 규칙으로 판정하고, 제품명은 AI와 기본 품목 사전으로 가능한 CN 코드 후보를 찾습니다.</p>
          <div className="mt-5 inline-flex rounded-xl bg-slate-100 p-1" role="tablist" aria-label="검색 방식">
            <TabButton selected={mode === 'codes'} onClick={() => setMode('codes')}>CN 코드 검색</TabButton>
            <TabButton selected={mode === 'product'} onClick={() => setMode('product')}>제품명 검색</TabButton>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          {mode === 'codes' ? (
            <div>
              <label className="text-sm font-black text-slate-800" htmlFor="cbam-cn-codes">CN 코드 입력</label>
              <textarea id="cbam-cn-codes" value={codes} onChange={event => setCodes(event.target.value)} rows={5} placeholder={'예: 7326 90 98\n7204 49 90\n2507 00 80'} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-mono text-sm leading-6 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100" />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs leading-5 text-slate-500">여러 코드는 줄바꿈·쉼표로 구분할 수 있으며 공백과 하이픈은 자동으로 정리됩니다.</p>
                <button type="button" onClick={checkCodes} disabled={loading} className="rounded-xl bg-teal-700 px-5 py-3 text-sm font-black text-white transition hover:bg-teal-800 disabled:cursor-wait disabled:opacity-60">{loading ? '확인 중...' : '대상 여부 확인'}</button>
              </div>
              {codeResult && <CodeResults result={codeResult} />}
            </div>
          ) : (
            <div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="제품명" required value={product.productName} onChange={value => setProduct(current => ({ ...current, productName: value }))} placeholder="예: 산업용 육각 볼트" />
                <Field label="주요 재질·조성" value={product.material} onChange={value => setProduct(current => ({ ...current, material: value }))} placeholder="예: 탄소강, 스테인리스, 알루미늄" />
                <Field label="형태·규격" value={product.form} onChange={value => setProduct(current => ({ ...current, form: value }))} placeholder="예: M12, 나사산 있음, 판 두께 2mm" />
                <Field label="용도·기능" value={product.use} onChange={value => setProduct(current => ({ ...current, use: value }))} placeholder="예: 산업용 구조물 체결" />
              </div>
              <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-950">
                <strong>AI의 역할:</strong> 제품 설명으로 CN 후보를 좁힙니다. AI가 직접 대상 여부를 결정하지 않으며, 후보 코드는 법령 규칙 엔진으로 다시 판정됩니다.
              </div>
              <div className="mt-4 flex justify-end">
                <button type="button" onClick={searchProduct} disabled={loading || !product.productName.trim()} className="rounded-xl bg-teal-700 px-5 py-3 text-sm font-black text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50">{loading ? 'AI 분석 중...' : '후보 CN 코드 찾기'}</button>
              </div>
              {productResult && <ProductResults result={productResult} onCheckCode={(code) => { setCodes(code); setMode('codes'); setCodeResult(null); }} />}
            </div>
          )}

          {error && <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800">{error}</div>}
        </div>
      </section>

      <aside className="space-y-5 xl:sticky xl:top-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-wider text-slate-500">선택된 신청서</p>
          {applicationReference ? (
            <div className="mt-3">
              <p className="font-mono text-xs font-bold text-teal-700">{applicationReference}</p>
              <h3 className="mt-2 text-xl font-black">{companyName}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">신청서에 입력된 CN 코드를 가져왔습니다. 조회 결과는 현재 저장되지 않습니다.</p>
              <button type="button" onClick={() => { setCodes(initialCodes); setMode('codes'); setCodeResult(null); }} className="mt-4 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-black hover:bg-slate-50">신청서 코드 다시 가져오기</button>
            </div>
          ) : <p className="mt-3 text-sm leading-6 text-slate-500">신청서 관리에서 업체를 선택하면 해당 CN 코드를 바로 불러올 수 있습니다.</p>}
        </section>

        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h3 className="font-black text-amber-950">판정 시 주의사항</h3>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-amber-900">
            <li>제품 범위와 수입자의 실제 CBAM 의무는 별도입니다.</li>
            <li><code>ex</code> 코드는 제품 속성 확인이 필요합니다.</li>
            <li>최종 세관 분류는 EU TARIC·CLASS 또는 관세당국 확인이 우선합니다.</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 text-sm shadow-sm">
          <h3 className="font-black">공식 근거</h3>
          <div className="mt-3 space-y-2">
            <a href={CBAM_SCOPE_SOURCE} target="_blank" rel="noreferrer" className="block font-bold text-teal-700 underline underline-offset-4">CBAM Regulation Annex I</a>
            <a href={TARIC_SOURCE} target="_blank" rel="noreferrer" className="block font-bold text-teal-700 underline underline-offset-4">EU TARIC 코드 확인</a>
          </div>
        </section>
      </aside>
    </div>
  );
}

function CodeResults({ result }: { result: CodeResponse }) {
  return (
    <div className="mt-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h3 className="text-lg font-black">코드 판정 결과</h3><p className="mt-1 text-xs text-slate-500">{result.scopeVersion} · {result.cnVersion}</p></div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">{result.assessments.length}개 코드</span>
      </div>
      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-[820px] w-full text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-4 py-3">CN 코드</th><th className="px-4 py-3">설명</th><th className="px-4 py-3">판정</th><th className="px-4 py-3">근거</th></tr></thead>
          <tbody>{result.assessments.map((assessment, index) => <tr key={`${assessment.normalized}-${index}`} className="border-t border-slate-100"><td className="px-4 py-4 align-top"><code className="font-black">{assessment.displayCode || assessment.input}</code>{assessment.sector && <span className="mt-1 block text-xs text-slate-500">{assessment.sector} · {assessment.greenhouseGases.join(', ')}</span>}</td><td className="px-4 py-4 align-top"><strong className="block">{assessment.descriptionKo}</strong>{assessment.descriptionEn && <span className="mt-1 block text-xs leading-5 text-slate-500">{assessment.descriptionEn}</span>}</td><td className="px-4 py-4 align-top"><StatusBadge status={assessment.status}>{assessment.statusLabel}</StatusBadge></td><td className="px-4 py-4 align-top"><strong className="block text-xs text-slate-700">{assessment.matchedRule || 'Annex I 미포함'}</strong><span className="mt-1 block text-xs leading-5 text-slate-500">{assessment.explanation}</span></td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}

function ProductResults({ result, onCheckCode }: { result: ProductResponse; onCheckCode: (code: string) => void }) {
  return (
    <div className="mt-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h3 className="text-lg font-black">제품명 검색 결과</h3><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">{result.message}</p></div>
        <span className={`rounded-full px-3 py-1 text-xs font-black ${result.aiUsed ? 'bg-violet-100 text-violet-800' : 'bg-slate-100 text-slate-700'}`}>{result.aiUsed ? `AI 후보 · ${result.model || '활성'}` : '기본 품목 사전'}</span>
      </div>
      {result.candidates.length === 0 ? <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">후보를 찾지 못했습니다. 재질·형태·용도를 더 구체적으로 입력해 주세요.</div> : <div className="mt-4 divide-y divide-slate-200 rounded-xl border border-slate-200">{result.candidates.map((candidate, index) => <article key={`${candidate.code}-${index}`} className="p-4 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><code className="font-black text-teal-800">{candidate.assessment.displayCode}</code><StatusBadge status={candidate.assessment.status}>{candidate.assessment.statusLabel}</StatusBadge><span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-black text-slate-600">신뢰도 {confidenceLabel(candidate.confidence)}</span></div><h4 className="mt-3 font-black">{candidate.titleKo}</h4>{candidate.titleEn && <p className="mt-1 text-xs text-slate-500">{candidate.titleEn}</p>}</div><button type="button" onClick={() => onCheckCode(candidate.code)} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-black hover:bg-slate-50">코드 판정으로 이동</button></div><p className="mt-3 text-sm leading-6 text-slate-700">{candidate.reasoning}</p>{candidate.missingInformation.length > 0 && <p className="mt-2 text-xs leading-5 text-amber-800"><strong>추가 확인:</strong> {candidate.missingInformation.join(', ')}</p>}<p className="mt-2 text-xs leading-5 text-slate-500">법령 판정: {candidate.assessment.explanation}</p></article>)}</div>}
      <p className="mt-3 text-xs text-slate-500">{result.scopeVersion} · {result.cnVersion}</p>
    </div>
  );
}

function TabButton({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" role="tab" aria-selected={selected} onClick={onClick} className={`rounded-lg px-4 py-2 text-sm font-black transition ${selected ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>{children}</button>;
}

function Field({ label, required = false, value, onChange, placeholder }: { label: string; required?: boolean; value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="text-sm font-black text-slate-800">{label}{required && <span className="ml-1 text-red-600">*</span>}<input value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-normal outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100" /></label>;
}

function StatusBadge({ status, children }: { status: CbamCnStatus; children: React.ReactNode }) {
  const styles: Record<CbamCnStatus, string> = {
    in_scope: 'bg-emerald-100 text-emerald-800',
    out_of_scope: 'bg-rose-100 text-rose-800',
    partial: 'bg-amber-100 text-amber-800',
    conditional: 'bg-orange-100 text-orange-800',
    invalid: 'bg-slate-200 text-slate-700',
  };
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-black ${styles[status]}`}>{children}</span>;
}

function confidenceLabel(value: CbamProductCandidate['confidence']) {
  return ({ high: '높음', medium: '보통', low: '낮음' }[value]);
}
