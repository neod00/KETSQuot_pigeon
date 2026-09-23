'use client';

import { FormEvent, useState } from 'react';
import { CbamApplicationInput, StoredCbamApplication } from '@/lib/cbam';
import { generateP1173EnquiryDocx } from '@/utils/cbamEnquiryDocxGenerator';

interface P1173EnquiryEditorProps {
  application: StoredCbamApplication;
  onClose: () => void;
  onSave: (reference: string, input: CbamApplicationInput) => Promise<void>;
}

export function P1173EnquiryEditor({ application, onClose, onSave }: P1173EnquiryEditorProps) {
  const [form, setForm] = useState<CbamApplicationInput>(() => ({ ...application }));
  const [saving, setSaving] = useState(false);
  const [wordBusy, setWordBusy] = useState(false);
  const [error, setError] = useState('');
  const [viewTab, setViewTab] = useState<'form' | 'print'>('form');

  const update = <K extends keyof CbamApplicationInput>(key: K, value: CbamApplicationInput[K]) =>
    setForm(current => ({ ...current, [key]: value }));

  const toggleArrayItem = <K extends 'verificationYears' | 'cbamGoods' | 'managementSystems'>(
    key: K,
    item: string
  ) => {
    setForm(current => {
      const arr = (current[key] as string[]) || [];
      const next = arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item];
      return { ...current, [key]: next };
    });
  };

  const handleDownloadDocx = async () => {
    setWordBusy(true);
    setError('');
    try {
      // Merge current form changes with application stats for preview
      const merged: StoredCbamApplication = {
        ...application,
        ...form,
      };
      await generateP1173EnquiryDocx(merged);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Word 문서 생성에 실패했습니다.');
    } finally {
      setWordBusy(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave(application.reference, form);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '신청서를 저장하지 못했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const check = (cond: boolean) => (cond ? '☒' : '☐');

  const tableHeaderStyle = "bg-[#002060] text-white px-4 py-2.5 text-sm font-bold tracking-wide uppercase";
  const subHeaderStyle = "bg-[#d9e1f2] text-[#002060] px-4 py-2 text-xs font-bold uppercase tracking-wider";
  const labelColStyle = "w-1/3 bg-[#f2f4f8] p-3 text-xs font-bold text-slate-800 border border-slate-300 align-middle leading-snug";
  const inputColStyle = "p-2.5 text-xs text-slate-900 border border-slate-300 align-middle bg-white";
  const inputClass = "w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 outline-none focus:border-[#002060] focus:ring-1 focus:ring-[#002060]";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 p-2 sm:p-6 backdrop-blur-sm print:p-0 print:bg-white print:static print:inset-auto">
      <form onSubmit={submit} className="mx-auto max-w-5xl rounded-xl bg-white shadow-2xl overflow-hidden print:shadow-none print:max-w-none print:rounded-none">
        
        {/* Top Header / Actions Bar */}
        <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur print:hidden">
          <div className="flex items-center gap-3">
            <div className="h-9 w-1.5 rounded-full bg-[#002060]"></div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-widest text-[#002060]">P1173 Standard Form</span>
                <span className="rounded bg-teal-100 px-2 py-0.5 text-[11px] font-black text-teal-800">{application.reference}</span>
              </div>
              <h2 className="text-xl font-black text-slate-900">CBAM Client Information and Enquiry Form</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadDocx}
              disabled={wordBusy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#002060] bg-white px-3.5 py-2 text-xs font-bold text-[#002060] shadow-sm hover:bg-[#f0f4fb] disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              {wordBusy ? 'Word 생성 중...' : 'P1173 Word 다운로드'}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              인쇄 / PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              닫기
            </button>
          </div>
        </div>

        {/* Document Content conforming to P1173 Layout */}
        <div className="p-6 sm:p-10 space-y-8 bg-white print:p-2">
          
          {/* Document Header Logo / Title */}
          <div className="flex items-center justify-between border-b-2 border-[#002060] pb-4">
            <div>
              <p className="text-[11px] font-bold tracking-widest text-[#002060]">LRQA KOREA · SUSTAINABILITY &amp; CLIMATE CHANGE</p>
              <h1 className="mt-1 text-2xl font-black text-slate-900 tracking-tight">P1173 CBAM Client Information and Enquiry Form</h1>
              <p className="text-xs text-slate-500 mt-0.5">탄소국경조정제도(EU CBAM) 검증 서비스 고객 정보 및 신청서</p>
            </div>
            <img src="/lrqa-logo.png" alt="LRQA" className="h-10 w-auto bg-slate-950 p-1.5 rounded" />
          </div>

          {/* TABLE 0: Client Details & Service Required */}
          <div className="overflow-hidden border border-slate-300 rounded shadow-sm">
            <div className={tableHeaderStyle}>Client details / 고객 세부사항</div>
            <table className="w-full border-collapse">
              <tbody>
                <tr>
                  <td className={labelColStyle}>
                    Client&apos;s name:<br />
                    <span className="text-slate-500 font-normal">고객명: *</span>
                  </td>
                  <td className={inputColStyle} colSpan={2}>
                    <input
                      required
                      className={inputClass}
                      value={form.companyName}
                      onChange={e => update('companyName', e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td className={labelColStyle}>
                    Contact for correspondence:<br />
                    <span className="text-slate-500 font-normal">서신/연락 담당자: *</span>
                  </td>
                  <td className={inputColStyle} colSpan={2}>
                    <input
                      required
                      className={inputClass}
                      value={form.contactName}
                      onChange={e => update('contactName', e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td className={labelColStyle}>
                    Contact address:<br />
                    <span className="text-slate-500 font-normal">연락 주소:</span>
                  </td>
                  <td className={inputColStyle} colSpan={2}>
                    <input
                      className={inputClass}
                      value={form.address}
                      onChange={e => update('address', e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td className={labelColStyle}>
                    Country where the Client is registered:<br />
                    <span className="text-slate-500 font-normal">고객 등록 국가:</span>
                  </td>
                  <td className={inputColStyle} colSpan={2}>
                    <input
                      className={inputClass}
                      value={form.country}
                      onChange={e => update('country', e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td className={labelColStyle}>
                    Contact phone number:<br />
                    <span className="text-slate-500 font-normal">연락처 전화번호: *</span>
                  </td>
                  <td className={inputColStyle} colSpan={2}>
                    <input
                      required
                      className={inputClass}
                      value={form.phone}
                      onChange={e => update('phone', e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td className={labelColStyle}>
                    Contact email:<br />
                    <span className="text-slate-500 font-normal">연락처 이메일: *</span>
                  </td>
                  <td className={inputColStyle} colSpan={2}>
                    <input
                      required
                      type="email"
                      className={inputClass}
                      value={form.email}
                      onChange={e => update('email', e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td className={labelColStyle}>
                    Site(s) to be verified:<br />
                    <span className="text-slate-500 font-normal">검증 대상 사업장:</span>
                  </td>
                  <td className={inputColStyle} colSpan={2}>
                    <input
                      className={inputClass}
                      value={form.sites}
                      onChange={e => update('sites', e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td className={labelColStyle}>
                    Consultant if any:<br />
                    <span className="text-slate-500 font-normal">컨설턴트(해당 시):</span>
                  </td>
                  <td className={inputColStyle} colSpan={2}>
                    <input
                      className={inputClass}
                      placeholder="컨설팅 기관 또는 담당자명 (없을 시 N/A)"
                      value={form.notes?.includes('컨설턴트') ? form.notes : ''}
                      onChange={e => update('notes', e.target.value)}
                    />
                  </td>
                </tr>

                {/* Section Header: Service required */}
                <tr>
                  <td colSpan={3} className={subHeaderStyle}>
                    Service required / 요청 서비스
                  </td>
                </tr>
                <tr>
                  <td className={labelColStyle}>
                    Objective of the engagement:<br />
                    <span className="text-slate-500 font-normal">업무 목적:</span>
                  </td>
                  <td className={inputColStyle} colSpan={2}>
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="clientType"
                          checked={form.clientType === 'importer'}
                          onChange={() => update('clientType', 'importer')}
                        />
                        <span>To verify the Importer’s CBAM Declaration / 수입자의 CBAM 신고서 검증</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="clientType"
                          checked={form.clientType === 'operator'}
                          onChange={() => update('clientType', 'operator')}
                        />
                        <span>To verify the third country Operator’s CBAM report / 제3국 생산자의 CBAM 보고서 검증</span>
                      </label>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className={labelColStyle}>
                    Service required:<br />
                    <span className="text-slate-500 font-normal">요청 서비스:</span>
                  </td>
                  <td className={inputColStyle} colSpan={2}>
                    <div className="flex flex-wrap gap-4">
                      {[
                        { key: 'pre_verification', label: 'Pre-Verification (Gap analysis)' },
                        { key: 'verification', label: 'Verification (본검증)' },
                        { key: 'other', label: 'Other (기타 자문)' },
                      ].map(item => (
                        <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="serviceType"
                            checked={form.serviceType === item.key}
                            onChange={() => update('serviceType', item.key as any)}
                          />
                          <span>{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className={labelColStyle}>
                    Scope (tick the year(s) upon which the data to be verified derive):<br />
                    <span className="text-slate-500 font-normal">범위(검증 대상 데이터 발생 연도):</span>
                  </td>
                  <td className={inputColStyle}>
                    <div className="grid grid-cols-2 gap-2">
                      {['2024', '2025', '2026', '2027'].map(year => (
                        <label key={year} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.verificationYears.includes(year)}
                            onChange={() => toggleArrayItem('verificationYears', year)}
                          />
                          <span>{year}</span>
                        </label>
                      ))}
                    </div>
                  </td>
                  <td className={inputColStyle}>
                    <div className="grid grid-cols-2 gap-2">
                      {['2028', '2029', '2030', '2031'].map(year => (
                        <label key={year} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.verificationYears.includes(year)}
                            onChange={() => toggleArrayItem('verificationYears', year)}
                          />
                          <span>{year}</span>
                        </label>
                      ))}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className={labelColStyle}>
                    Nature of CBAM goods:<br />
                    <span className="text-slate-500 font-normal">CBAM 상품의 유형:</span>
                  </td>
                  <td className={inputColStyle}>
                    <div className="space-y-1.5">
                      {['Cement / 시멘트', 'Fertilisers / 비료', 'Aluminium / 알루미늄'].map(item => {
                        const raw = item.split('/')[1]?.trim() || item;
                        return (
                          <label key={item} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={form.cbamGoods.includes(raw) || form.cbamGoods.includes(item.split('/')[0]?.trim())}
                              onChange={() => toggleArrayItem('cbamGoods', raw)}
                            />
                            <span>{item}</span>
                          </label>
                        );
                      })}
                    </div>
                  </td>
                  <td className={inputColStyle}>
                    <div className="space-y-1.5">
                      {['Iron & Steel / 철강', 'Hydrogen / 수소', 'Electricity / 전력'].map(item => {
                        const raw = item.split('/')[1]?.trim() || item;
                        return (
                          <label key={item} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={form.cbamGoods.includes(raw) || form.cbamGoods.includes(item.split('/')[0]?.trim())}
                              onChange={() => toggleArrayItem('cbamGoods', raw)}
                            />
                            <span>{item}</span>
                          </label>
                        );
                      })}
                    </div>
                  </td>
                </tr>

                {/* Section Header: Data management */}
                <tr>
                  <td colSpan={3} className={subHeaderStyle}>
                    Data management / 데이터 관리
                  </td>
                </tr>
                <tr>
                  <td className={labelColStyle}>
                    Location where data is retained:<br />
                    <span className="text-slate-500 font-normal">데이터 보관 위치:</span>
                  </td>
                  <td className={inputColStyle} colSpan={2}>
                    <input
                      className={inputClass}
                      placeholder="e.g. Headquarters location / 본사 서버, ERP 등"
                      value={form.dataLocation}
                      onChange={e => update('dataLocation', e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td className={labelColStyle}>
                    Is data digitalized and remotely accessible?<br />
                    <span className="text-slate-500 font-normal">데이터가 디지털화되어 원격 접근이 가능합니까?</span>
                  </td>
                  <td className={inputColStyle} colSpan={2}>
                    <div className="flex gap-6">
                      {[
                        { val: 'yes', label: 'Yes' },
                        { val: 'partial', label: 'Partially' },
                        { val: 'no', label: 'No' },
                      ].map(opt => (
                        <label key={opt.val} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="remoteAccess"
                            checked={form.remoteAccess === opt.val}
                            onChange={() => update('remoteAccess', opt.val as any)}
                          />
                          <span>{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className={labelColStyle}>
                    Management system in place and certified:<br />
                    <span className="text-slate-500 font-normal">구축 및 인증된 경영시스템:</span>
                  </td>
                  <td className={inputColStyle} colSpan={2}>
                    <div className="flex flex-wrap gap-4">
                      {['ISO 9001', 'ISO 14001', 'ISO 45001', 'ISO 50001', 'ISO 27001', '기타'].map(std => (
                        <label key={std} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.managementSystems?.includes(std)}
                            onChange={() => toggleArrayItem('managementSystems', std)}
                          />
                          <span>{std}</span>
                        </label>
                      ))}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className={labelColStyle}>
                    How many persons in charge of raw data, processing, reporting?<br />
                    <span className="text-slate-500 font-normal">원자료 수집, 처리, 보고 담당 인원 수:</span>
                  </td>
                  <td className={inputColStyle} colSpan={2}>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        className="w-24 rounded border border-slate-300 px-2 py-1 text-xs"
                        value={form.dataPersonnel}
                        onChange={e => update('dataPersonnel', e.target.value)}
                      />
                      <span className="text-slate-600">명</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* TABLE 1: Size of Datasets, Fuel streams & Emissions */}
          <div className="overflow-hidden border border-slate-300 rounded shadow-sm">
            <div className={tableHeaderStyle}>Size of datasets &amp; Emissions / 데이터 규모 및 배출량</div>
            <table className="w-full border-collapse">
              <tbody>
                <tr>
                  <td className={labelColStyle}>
                    How many CBAM goods operators do you deal with?<br />
                    <span className="text-slate-500 font-normal">거래 또는 관련되는 CBAM 상품 사업자 수는 몇 곳입니까?</span>
                  </td>
                  <td className={inputColStyle} colSpan={2}>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        className="w-28 rounded border border-slate-300 px-2.5 py-1 text-xs"
                        value={form.operatorCount}
                        onChange={e => update('operatorCount', e.target.value)}
                      />
                      <span className="text-[11px] text-slate-500">개 사업자 (e.g. As an importer deal with 3 operators)</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className={labelColStyle}>
                    How many production processes are involved?<br />
                    <span className="text-slate-500 font-normal">관련 생산공정은 몇 개입니까?</span>
                  </td>
                  <td className={inputColStyle} colSpan={2}>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        className="w-28 rounded border border-slate-300 px-2.5 py-1 text-xs"
                        value={form.processCount}
                        onChange={e => update('processCount', e.target.value)}
                      />
                      <span className="text-[11px] text-slate-500">개 공정</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className={labelColStyle}>
                    How many CBAM goods are involved?<br />
                    <span className="text-slate-500 font-normal">관련 CBAM 상품은 몇 개입니까?</span>
                  </td>
                  <td className={inputColStyle} colSpan={2}>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        className="w-28 rounded border border-slate-300 px-2.5 py-1 text-xs"
                        value={form.goodsCount}
                        onChange={e => update('goodsCount', e.target.value)}
                      />
                      <span className="text-[11px] text-slate-500">개 품목</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className={labelColStyle}>
                    Specify 8 digits CN codes of CBAM goods (Regulation 2023/956):<br />
                    <span className="text-slate-500 font-normal">관련 CBAM 상품의 8자리 CN 코드를 기재하십시오:</span>
                  </td>
                  <td className={inputColStyle} colSpan={2}>
                    <textarea
                      rows={2}
                      className={inputClass}
                      placeholder="e.g. 7318 16 92, 7318 16 99"
                      value={form.cnCodes}
                      onChange={e => update('cnCodes', e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td className={labelColStyle}>
                    If you are a CBAM Operator, is the MMD provided?<br />
                    <span className="text-slate-500 font-normal">CBAM 상품 생산자인 경우 MMD(모니터링 방법론 문서)가 수립되었습니까?</span>
                  </td>
                  <td className={inputColStyle} colSpan={2}>
                    <div className="flex gap-6">
                      {[
                        { val: 'clear', label: 'Yes (명확함)' },
                        { val: 'complex', label: 'Partially / Complex (복잡·불명확)' },
                        { val: 'none', label: 'No (미제공)' },
                        { val: 'not_applicable', label: 'N/A (수입자)' },
                      ].map(opt => (
                        <label key={opt.val} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="mmdStatus"
                            checked={form.mmdStatus === opt.val}
                            onChange={() => update('mmdStatus', opt.val as any)}
                          />
                          <span>{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className={labelColStyle}>
                    Is information on a carbon price due in the jurisdiction relevant?<br />
                    <span className="text-slate-500 font-normal">해당 관할권에서 부담해야 하는 탄소가격(ETS 등) 정보가 관련됩니까?</span>
                  </td>
                  <td className={inputColStyle} colSpan={2}>
                    <div className="flex gap-6">
                      {[
                        { val: 'yes', label: 'Yes (있음)' },
                        { val: 'no', label: 'No (없음 / 미확인)' },
                      ].map(opt => (
                        <label key={opt.val} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="carbonPrice"
                            checked={form.carbonPrice === opt.val}
                            onChange={() => update('carbonPrice', opt.val as any)}
                          />
                          <span>{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className={labelColStyle}>
                    Are embedded emissions already verified by an accredited body?<br />
                    <span className="text-slate-500 font-normal">인정 검증기관을 통해 내재배출량이 이미 제3자 검증을 완료하였습니까?</span>
                  </td>
                  <td className={inputColStyle} colSpan={2}>
                    <div className="flex gap-6">
                      {[
                        { val: 'yes', label: 'Yes' },
                        { val: 'no', label: 'No' },
                      ].map(opt => (
                        <label key={opt.val} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="previouslyVerified"
                            checked={form.previouslyVerified === opt.val}
                            onChange={() => update('previouslyVerified', opt.val as any)}
                          />
                          <span>{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </td>
                </tr>

                {/* Section Header: Fuel streams and Emissions */}
                <tr>
                  <td colSpan={3} className={subHeaderStyle}>
                    Fuel streams and Emissions / 연료흐름 및 배출량
                  </td>
                </tr>
                <tr>
                  <td className={labelColStyle}>
                    Estimated size of embedded emissions:<br />
                    <span className="text-slate-500 font-normal">예상 내재배출량 규모:</span>
                  </td>
                  <td className={inputColStyle} colSpan={2}>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.01"
                        className="w-36 rounded border border-slate-300 px-2.5 py-1 text-xs"
                        value={form.embeddedEmissionsKt}
                        onChange={e => update('embeddedEmissionsKt', e.target.value)}
                      />
                      <span className="text-xs font-semibold text-slate-700">kT of CO₂e</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className={labelColStyle}>
                    Specify production processes:<br />
                    <span className="text-slate-500 font-normal">생산공정을 기재하십시오:</span>
                  </td>
                  <td className={inputColStyle} colSpan={2}>
                    <textarea
                      rows={2}
                      className={inputClass}
                      placeholder="생산 공정 단계 및 설비 설명"
                      value={form.productionProcesses}
                      onChange={e => update('productionProcesses', e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td className={labelColStyle}>
                    Specify fuel streams:<br />
                    <span className="text-slate-500 font-normal">연료흐름을 기재하십시오:</span>
                  </td>
                  <td className={inputColStyle} colSpan={2}>
                    <input
                      className={inputClass}
                      placeholder="e.g. LNG, 전력, 코크스, 유류 등 투입 에너지원"
                      value={form.fuelStreams}
                      onChange={e => update('fuelStreams', e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td className={labelColStyle}>
                    CBAM goods are simple or complex:<br />
                    <span className="text-slate-500 font-normal">CBAM 상품이 단순상품, 복합상품 또는 둘 다에 해당합니까?</span>
                  </td>
                  <td className={inputColStyle} colSpan={2}>
                    <div className="flex gap-6">
                      {[
                        { val: 'simple', label: 'Simple good / 단순상품' },
                        { val: 'complex', label: 'Complex good / 복합상품' },
                        { val: 'both', label: 'Both / 단순 + 복합상품' },
                      ].map(opt => (
                        <label key={opt.val} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="goodsComplexity"
                            checked={form.goodsComplexity === opt.val}
                            onChange={() => update('goodsComplexity', opt.val as any)}
                          />
                          <span>{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className={labelColStyle}>
                    Biomass fuel streams:<br />
                    <span className="text-slate-500 font-normal">바이오매스 연료흐름:</span>
                  </td>
                  <td className={inputColStyle} colSpan={2}>
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="biomass"
                          checked={form.biomass === 'none'}
                          onChange={() => update('biomass', 'none')}
                        />
                        <span>No biomass fuel streams / 바이오매스 연료흐름 없음</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="biomass"
                          checked={form.biomass === 'used_red_compliant'}
                          onChange={() => update('biomass', 'used_red_compliant')}
                        />
                        <span>Utilisation of biomass / RED II 지속가능성 및 감축기준 충족 증빙 보유</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="biomass"
                          checked={form.biomass === 'used_review_needed'}
                          onChange={() => update('biomass', 'used_review_needed')}
                        />
                        <span>Utilisation of biomass / 검토 필요</span>
                      </label>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Additional Notes & Checkboxes */}
          <div className="grid sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.chp}
                onChange={e => update('chp', e.target.checked)}
              />
              <span>열병합발전(CHP) 설비 포함</span>
            </label>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.knownClient}
                onChange={e => update('knownClient', e.target.checked)}
              />
              <span>기존 검증팀이 공정을 파악하고 있는 고객</span>
            </label>
          </div>

        </div>

        {/* Bottom Save Bar */}
        <div className="sticky bottom-0 z-20 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 bg-white/95 px-6 py-4 backdrop-blur print:hidden">
          {error ? (
            <p className="text-xs font-bold text-red-600">{error}</p>
          ) : (
            <p className="text-xs text-slate-500">
              수정 후 저장 시 입력값을 기준으로 공수 산정(SARA, 검증일수 등)이 다시 계산됩니다.
            </p>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[#002060] px-5 py-2 text-xs font-black text-white hover:bg-[#001848] disabled:opacity-50 shadow-sm"
            >
              {saving ? '저장 및 재산정 중...' : 'P1173 서식 저장 및 공수 재계산'}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}
