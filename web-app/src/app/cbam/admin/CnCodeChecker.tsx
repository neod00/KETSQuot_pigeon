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
    if (!response.ok) throw new Error(result.message || '議고쉶?섏? 紐삵뻽?듬땲??');
    return result as T;
  }

  async function checkCodes() {
    setLoading(true);
    setError('');
    try {
      setCodeResult(await post<CodeResponse>({ kind: 'codes', codes }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'CN 肄붾뱶瑜??뺤씤?섏? 紐삵뻽?듬땲??');
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
      setError(caught instanceof Error ? caught.message : '?쒗뭹 ?꾨낫瑜?寃?됲븯吏 紐삵뻽?듬땲??');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5 sm:p-6">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-teal-700">Scope assessment tool</p>
          <h2 className="mt-2 text-2xl font-black">CBAM ????щ? 議고쉶</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">CN 肄붾뱶??踰뺣졊 洹쒖튃?쇰줈 ?먯젙?섍퀬, ?쒗뭹紐낆? AI? 湲곕낯 ?덈ぉ ?ъ쟾?쇰줈 媛?ν븳 CN 肄붾뱶 ?꾨낫瑜?李얠뒿?덈떎.</p>
          <div className="mt-5 inline-flex rounded-xl bg-slate-100 p-1" role="tablist" aria-label="寃??諛⑹떇">
            <TabButton selected={mode === 'codes'} onClick={() => setMode('codes')}>CN 肄붾뱶 寃??/TabButton>
            <TabButton selected={mode === 'product'} onClick={() => setMode('product')}>?쒗뭹紐?寃??/TabButton>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          {mode === 'codes' ? (
            <div>
              <label className="text-sm font-black text-slate-800" htmlFor="cbam-cn-codes">CN 肄붾뱶 ?낅젰</label>
              <textarea id="cbam-cn-codes" value={codes} onChange={event => setCodes(event.target.value)} rows={5} placeholder={'?? 7326 90 98\n7204 49 90\n2507 00 80'} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-mono text-sm leading-6 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100" />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs leading-5 text-slate-500">?щ윭 肄붾뱶??以꾨컮轅댟룹돹?쒕줈 援щ텇?????덉쑝硫?怨듬갚怨??섏씠?덉? ?먮룞?쇰줈 ?뺣━?⑸땲??</p>
                <button type="button" onClick={checkCodes} disabled={loading} className="rounded-xl bg-teal-700 px-5 py-3 text-sm font-black text-white transition hover:bg-teal-800 disabled:cursor-wait disabled:opacity-60">{loading ? '?뺤씤 以?..' : '????щ? ?뺤씤'}</button>
              </div>
              {codeResult && <CodeResults result={codeResult} />}
            </div>
          ) : (
            <div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="?쒗뭹紐? required value={product.productName} onChange={value => setProduct(current => ({ ...current, productName: value }))} placeholder="?? ?곗뾽???↔컖 蹂쇳듃" />
                <Field label="二쇱슂 ?ъ쭏쨌議곗꽦" value={product.material} onChange={value => setProduct(current => ({ ...current, material: value }))} placeholder="?? ?꾩냼媛? ?ㅽ뀒?몃━?? ?뚮（誘몃뒆" />
                <Field label="?뺥깭쨌洹쒓꺽" value={product.form} onChange={value => setProduct(current => ({ ...current, form: value }))} placeholder="?? M12, ?섏궗???덉쓬, ???먭퍡 2mm" />
                <Field label="?⑸룄쨌湲곕뒫" value={product.use} onChange={value => setProduct(current => ({ ...current, use: value }))} placeholder="?? ?곗뾽??援ъ“臾?泥닿껐" />
              </div>
              <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-950">
                <strong>AI????븷:</strong> ?쒗뭹 ?ㅻ챸?쇰줈 CN ?꾨낫瑜?醫곹옓?덈떎. AI媛 吏곸젒 ????щ?瑜?寃곗젙?섏? ?딆쑝硫? ?꾨낫 肄붾뱶??踰뺣졊 洹쒖튃 ?붿쭊?쇰줈 ?ㅼ떆 ?먯젙?⑸땲??
              </div>
              <div className="mt-4 flex justify-end">
                <button type="button" onClick={searchProduct} disabled={loading || !product.productName.trim()} className="rounded-xl bg-teal-700 px-5 py-3 text-sm font-black text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50">{loading ? 'AI 遺꾩꽍 以?..' : '?꾨낫 CN 肄붾뱶 李얘린'}</button>
              </div>
              {productResult && <ProductResults result={productResult} onCheckCode={(code) => { setCodes(code); setMode('codes'); setCodeResult(null); }} />}
            </div>
          )}

          {error && <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800">{error}</div>}
        </div>
      </section>

      <aside className="space-y-5 xl:sticky xl:top-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-wider text-slate-500">?좏깮???좎껌??/p>
          {applicationReference ? (
            <div className="mt-3">
              <p className="font-mono text-xs font-bold text-teal-700">{applicationReference}</p>
              <h3 className="mt-2 text-xl font-black">{companyName}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">?좎껌?쒖뿉 ?낅젰??CN 肄붾뱶瑜?媛?몄솕?듬땲?? 議고쉶 寃곌낵???꾩옱 ??λ릺吏 ?딆뒿?덈떎.</p>
              <button type="button" onClick={() => { setCodes(initialCodes); setMode('codes'); setCodeResult(null); }} className="mt-4 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-black hover:bg-slate-50">?좎껌??肄붾뱶 ?ㅼ떆 媛?몄삤湲?/button>
            </div>
          ) : <p className="mt-3 text-sm leading-6 text-slate-500">?좎껌??愿由ъ뿉???낆껜瑜??좏깮?섎㈃ ?대떦 CN 肄붾뱶瑜?諛붾줈 遺덈윭?????덉뒿?덈떎.</p>}
        </section>

        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h3 className="font-black text-amber-950">?먯젙 ??二쇱쓽?ы빆</h3>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-amber-900">
            <li>?쒗뭹 踰붿쐞? ?섏엯?먯쓽 ?ㅼ젣 CBAM ?섎Т??蹂꾨룄?낅땲??</li>
            <li><code>ex</code> 肄붾뱶???쒗뭹 ?띿꽦 ?뺤씤???꾩슂?⑸땲??</li>
            <li>理쒖쥌 ?멸? 遺꾨쪟??EU TARIC쨌CLASS ?먮뒗 愿?몃떦援??뺤씤???곗꽑?⑸땲??</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 text-sm shadow-sm">
          <h3 className="font-black">怨듭떇 洹쇨굅</h3>
          <div className="mt-3 space-y-2">
            <a href={CBAM_SCOPE_SOURCE} target="_blank" rel="noreferrer" className="block font-bold text-teal-700 underline underline-offset-4">CBAM Regulation Annex I</a>
            <a href={TARIC_SOURCE} target="_blank" rel="noreferrer" className="block font-bold text-teal-700 underline underline-offset-4">EU TARIC 肄붾뱶 ?뺤씤</a>
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
        <div><h3 className="text-lg font-black">肄붾뱶 ?먯젙 寃곌낵</h3><p className="mt-1 text-xs text-slate-500">{result.scopeVersion} 쨌 {result.cnVersion}</p></div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">{result.assessments.length}媛?肄붾뱶</span>
      </div>
      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-[820px] w-full text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-4 py-3">CN 肄붾뱶</th><th className="px-4 py-3">?ㅻ챸</th><th className="px-4 py-3">?먯젙</th><th className="px-4 py-3">洹쇨굅</th></tr></thead>
          <tbody>{result.assessments.map((assessment, index) => <tr key={`${assessment.normalized}-${index}`} className="border-t border-slate-100"><td className="px-4 py-4 align-top"><code className="font-black">{assessment.displayCode || assessment.input}</code>{assessment.sector && <span className="mt-1 block text-xs text-slate-500">{assessment.sector} 쨌 {assessment.greenhouseGases.join(', ')}</span>}</td><td className="px-4 py-4 align-top"><strong className="block">{assessment.descriptionKo}</strong>{assessment.descriptionEn && <span className="mt-1 block text-xs leading-5 text-slate-500">{assessment.descriptionEn}</span>}</td><td className="px-4 py-4 align-top"><StatusBadge status={assessment.status}>{assessment.statusLabel}</StatusBadge></td><td className="px-4 py-4 align-top"><strong className="block text-xs text-slate-700">{assessment.matchedRule || 'Annex I 誘명룷??}</strong><span className="mt-1 block text-xs leading-5 text-slate-500">{assessment.explanation}</span></td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}

function ProductResults({ result, onCheckCode }: { result: ProductResponse; onCheckCode: (code: string) => void }) {
  return (
    <div className="mt-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h3 className="text-lg font-black">?쒗뭹紐?寃??寃곌낵</h3><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">{result.message}</p></div>
        <span className={`rounded-full px-3 py-1 text-xs font-black ${result.aiUsed ? 'bg-violet-100 text-violet-800' : 'bg-slate-100 text-slate-700'}`}>{result.aiUsed ? `AI ?꾨낫 쨌 ${result.model || '?쒖꽦'}` : '湲곕낯 ?덈ぉ ?ъ쟾'}</span>
      </div>
      {result.candidates.length === 0 ? <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">?꾨낫瑜?李얠? 紐삵뻽?듬땲?? ?ъ쭏쨌?뺥깭쨌?⑸룄瑜???援ъ껜?곸쑝濡??낅젰??二쇱꽭??</div> : <div className="mt-4 divide-y divide-slate-200 rounded-xl border border-slate-200">{result.candidates.map((candidate, index) => <article key={`${candidate.code}-${index}`} className="p-4 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><code className="font-black text-teal-800">{candidate.assessment.displayCode}</code><StatusBadge status={candidate.assessment.status}>{candidate.assessment.statusLabel}</StatusBadge><span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-black text-slate-600">?좊ː??{confidenceLabel(candidate.confidence)}</span></div><h4 className="mt-3 font-black">{candidate.titleKo}</h4>{candidate.titleEn && <p className="mt-1 text-xs text-slate-500">{candidate.titleEn}</p>}</div><button type="button" onClick={() => onCheckCode(candidate.code)} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-black hover:bg-slate-50">肄붾뱶 ?먯젙?쇰줈 ?대룞</button></div><p className="mt-3 text-sm leading-6 text-slate-700">{candidate.reasoning}</p>{candidate.missingInformation.length > 0 && <p className="mt-2 text-xs leading-5 text-amber-800"><strong>異붽? ?뺤씤:</strong> {candidate.missingInformation.join(', ')}</p>}<p className="mt-2 text-xs leading-5 text-slate-500">踰뺣졊 ?먯젙: {candidate.assessment.explanation}</p></article>)}</div>}
      <p className="mt-3 text-xs text-slate-500">{result.scopeVersion} 쨌 {result.cnVersion}</p>
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
  return ({ high: '?믪쓬', medium: '蹂댄넻', low: '??쓬' }[value]);
}

