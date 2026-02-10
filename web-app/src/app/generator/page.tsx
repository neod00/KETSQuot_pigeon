'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import GenerationHistory, { saveHistoryRecord } from '../../components/GenerationHistory';

const STANDARD_RATE = 1050000;
const EXPENSES_DEFAULT = 600000;

export default function GeneratorPage() {
    const [quotType, setQuotType] = useState('3');
    const [companyName, setCompanyName] = useState('');
    const [contactPerson, setContactPerson] = useState('');
    const [docId, setDocId] = useState('');
    const [issueDate, setIssueDate] = useState('');

    // Inventory data
    const [invYear, setInvYear] = useState('2025년');
    const [invS1Days, setInvS1Days] = useState('1.0');
    const [invS2Days, setInvS2Days] = useState('5.0');
    const [invS3Days, setInvS3Days] = useState('3.0');
    const [invExpenses, setInvExpenses] = useState(EXPENSES_DEFAULT);
    const [invFinalCost, setInvFinalCost] = useState(0);

    // Monitoring Plan data
    const [mpYear, setMpYear] = useState('2026년');
    const [mpS1Days, setMpS1Days] = useState('1.0');
    const [mpS2Days, setMpS2Days] = useState('5.0');
    const [mpS3Days, setMpS3Days] = useState('3.0');
    const [mpExpenses, setMpExpenses] = useState(EXPENSES_DEFAULT);
    const [mpFinalCost, setMpFinalCost] = useState(0);
    const [vatType, setVatType] = useState('별도'); // '별도' or '포함'

    useEffect(() => {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        setIssueDate(`${yyyy}-${mm}-${dd}`);

        const YYMMDD = now.toISOString().slice(2, 10).replace(/-/g, '');
        setDocId(`QR.001/DK/G${YYMMDD}`);
    }, []);

    const calculateAuto = (s1: string, s2: string, s3: string, exp: number) => {
        return Math.floor((parseFloat(s1) || 0) * STANDARD_RATE + (parseFloat(s2) || 0) * STANDARD_RATE + (parseFloat(s3) || 0) * STANDARD_RATE + exp);
    };

    useEffect(() => {
        setInvFinalCost(calculateAuto(invS1Days, invS2Days, invS3Days, invExpenses));
    }, [invS1Days, invS2Days, invS3Days, invExpenses]);

    useEffect(() => {
        setMpFinalCost(calculateAuto(mpS1Days, mpS2Days, mpS3Days, mpExpenses));
    }, [mpS1Days, mpS2Days, mpS3Days, mpExpenses]);

    const formatCurrency = (val: number) => val.toLocaleString();

    // 개별 단계 일수: 소수점 둘째자리가 0이 아니면 유지 (0.75 → 0.75, 6 → 6.0)
    const formatStageDays = (val: string) => {
        const num = parseFloat(val);
        const fixed2 = num.toFixed(2);
        return fixed2.endsWith('0') ? num.toFixed(1) : fixed2;
    };

    // 합계 일수: 소수점 둘째자리가 0이면 제외 (9.50 → 9.5, 9.25 → 9.25)
    const formatTotalDays = (num: number) => {
        const fixed2 = num.toFixed(2);
        return fixed2.endsWith('0') ? num.toFixed(1) : fixed2;
    };

    const formatDateKorean = (dateStr: string) => {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length !== 3) return dateStr;
        const [y, m, d] = parts;
        return `${y}년 ${parseInt(m)}월 ${parseInt(d)}일`;
    };

    const handlePrint = () => {
        const originalTitle = document.title;
        let fileName = "LRQA_온실가스 ";
        if (showInv && showMp) fileName += "명세서 및 배출량 산정계획서 ";
        else if (showInv) fileName += "명세서 ";
        else fileName += "배출량 산정계획서 ";
        fileName += `검증 비용 제안서_${companyName || "회사명"}`;

        document.title = fileName;
        window.print();
        document.title = originalTitle;

        // 이력 저장
        const totalFinal = (showInv ? invFinalCost : 0) + (showMp ? mpFinalCost : 0);
        saveHistoryRecord(
            'generator', 'K-ETS 견적서',
            companyName, totalFinal, vatType,
            { quotType, companyName, contactPerson, docId, issueDate, invYear, invS1Days, invS2Days, invS3Days, invExpenses, invFinalCost, mpYear, mpS1Days, mpS2Days, mpS3Days, mpExpenses, mpFinalCost, vatType },
            { s1Days: parseFloat(invS1Days) || 0, s2Days: parseFloat(invS2Days) || 0, s3Days: parseFloat(invS3Days) || 0, expenses: invExpenses, auditRate: STANDARD_RATE }
        );
    };

    // 이력에서 불러오기 (폼 채움)
    const handleHistoryRestore = (savedData: any) => {
        setQuotType(savedData.quotType || '3');
        setCompanyName(savedData.companyName || '');
        setContactPerson(savedData.contactPerson || '');
        setDocId(savedData.docId || '');
        setIssueDate(savedData.issueDate || '');
        setInvYear(savedData.invYear || '2025년');
        setInvS1Days(savedData.invS1Days || '1.0');
        setInvS2Days(savedData.invS2Days || '5.0');
        setInvS3Days(savedData.invS3Days || '3.0');
        setInvExpenses(savedData.invExpenses || EXPENSES_DEFAULT);
        setInvFinalCost(savedData.invFinalCost || 0);
        setMpYear(savedData.mpYear || '2026년');
        setMpS1Days(savedData.mpS1Days || '1.0');
        setMpS2Days(savedData.mpS2Days || '5.0');
        setMpS3Days(savedData.mpS3Days || '3.0');
        setMpExpenses(savedData.mpExpenses || EXPENSES_DEFAULT);
        setMpFinalCost(savedData.mpFinalCost || 0);
        setVatType(savedData.vatType || '별도');
    };

    // 이력에서 다시 생성 (폼 채우고 자동 인쇄)
    const handleHistoryRegenerate = (savedData: any) => {
        handleHistoryRestore(savedData);
        setTimeout(() => {
            window.print();
        }, 500);
    };

    const showInv = quotType === '1' || quotType === '3';
    const showMp = quotType === '2' || quotType === '3';

    const invTotalDays = (parseFloat(invS1Days) || 0) + (parseFloat(invS2Days) || 0) + (parseFloat(invS3Days) || 0);
    const invCalculatedTotal = calculateAuto(invS1Days, invS2Days, invS3Days, invExpenses);

    const mpTotalDays = (parseFloat(mpS1Days) || 0) + (parseFloat(mpS2Days) || 0) + (parseFloat(mpS3Days) || 0);
    const mpCalculatedTotal = calculateAuto(mpS1Days, mpS2Days, mpS3Days, mpExpenses);

    let scopeText = "";
    if (showInv && showMp) {
        scopeText = `${invYear} 온실가스 명세서 및 ${mpYear} 배출량산정계획서`;
    } else if (showInv) {
        scopeText = `${invYear} 온실가스 명세서`;
    } else {
        scopeText = `${mpYear} 배출량산정계획서`;
    }

    let title = "온실가스 ";
    if (showInv && showMp) title += "명세서 및 배출량산정계획서 ";
    else if (showInv) title += "명세서 ";
    else title += "배출량산정계획서 ";
    title += "검증비용 제안서";

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center">
            {/* Input Section */}
            <div className="no-print w-full max-w-4xl p-8 bg-white shadow-lg my-8 rounded-xl border border-gray-100">
                <div className="flex justify-between items-center mb-6 border-b pb-2">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="text-gray-500 hover:text-blue-600 transition-colors">
                            ← Home
                        </Link>
                        <h1 className="text-2xl font-bold text-blue-600">LRQA 견적서 생성기</h1>
                    </div>
                    <span className="text-sm text-gray-400">v1.7 (Table Break Fix)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <section className="space-y-4">
                        <h2 className="font-semibold text-lg text-gray-700">1. 기본 설정</h2>
                        <div>
                            <label className="block text-sm font-medium text-gray-600">견적 유형</label>
                            <select
                                className="mt-1 block w-full p-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                value={quotType}
                                onChange={e => setQuotType(e.target.value)}
                            >
                                <option value="3">명세서 + 계획서 통합 견적</option>
                                <option value="1">명세서 검증만</option>
                                <option value="2">배출량산정계획서 검증만</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600">회사명</label>
                            <input
                                type="text" className="mt-1 block w-full p-2 border rounded-md"
                                value={companyName} onChange={e => setCompanyName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600">담당자명</label>
                            <input
                                type="text" className="mt-1 block w-full p-2 border rounded-md"
                                value={contactPerson} onChange={e => setContactPerson(e.target.value)}
                            />
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="font-semibold text-lg text-gray-700">&nbsp;</h2>
                        <div>
                            <label className="block text-sm font-medium text-gray-600">문서 번호</label>
                            <input
                                type="text" className="mt-1 block w-full p-2 border rounded-md"
                                value={docId} onChange={e => setDocId(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600">발행 일자 (달력)</label>
                            <input
                                type="date" className="mt-1 block w-full p-2 border rounded-md"
                                value={issueDate} onChange={e => setIssueDate(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600">부가가치세 (VAT) 구분</label>
                            <div className="mt-1 flex gap-4">
                                <label className="inline-flex items-center">
                                    <input
                                        type="radio" className="form-radio text-blue-600"
                                        name="vatType" value="별도" checked={vatType === '별도'}
                                        onChange={e => setVatType(e.target.value)}
                                    />
                                    <span className="ml-2">VAT 별도 (기본)</span>
                                </label>
                                <label className="inline-flex items-center">
                                    <input
                                        type="radio" className="form-radio text-blue-600"
                                        name="vatType" value="포함" checked={vatType === '포함'}
                                        onChange={e => setVatType(e.target.value)}
                                    />
                                    <span className="ml-2">VAT 포함</span>
                                </label>
                            </div>
                        </div>
                    </section>
                </div>

                {showInv && (
                    <div className="mt-8 pt-6 border-t">
                        <h2 className="font-semibold text-lg text-indigo-600 mb-4">2-1. 명세서 검증 데이터</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500">대상 연도</label>
                                <input type="text" className="w-full p-2 border rounded" value={invYear} onChange={e => setInvYear(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500">1단계 일수</label>
                                <input type="text" className="w-full p-2 border rounded" value={invS1Days} onChange={e => setInvS1Days(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500">2단계 일수</label>
                                <input type="text" className="w-full p-2 border rounded" value={invS2Days} onChange={e => setInvS2Days(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500">3단계 일수</label>
                                <input type="text" className="w-full p-2 border rounded" value={invS3Days} onChange={e => setInvS3Days(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500">제경비</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded"
                                    value={invExpenses.toLocaleString()}
                                    onChange={e => {
                                        const val = e.target.value.replace(/[^0-9]/g, '');
                                        setInvExpenses(parseInt(val) || 0);
                                    }}
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-xs font-medium text-gray-500">자동 계산 합계</label>
                                <input type="text" className="w-full p-2 border rounded bg-gray-100 text-gray-500 cursor-not-allowed" value={formatCurrency(invCalculatedTotal) + "원"} readOnly />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-blue-600">최종 제안 금액 (조정 가능)*</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border-2 border-blue-400 rounded bg-blue-50 font-bold"
                                    value={invFinalCost.toLocaleString()}
                                    onChange={e => {
                                        const val = e.target.value.replace(/[^0-9]/g, '');
                                        setInvFinalCost(parseInt(val) || 0);
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {showMp && (
                    <div className="mt-8 pt-6 border-t">
                        <h2 className="font-semibold text-lg text-emerald-600 mb-4">2-2. 배출량산정계획서 검증 데이터</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500">대상 연도</label>
                                <input type="text" className="w-full p-2 border rounded" value={mpYear} onChange={e => setMpYear(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500">1단계 일수</label>
                                <input type="text" className="w-full p-2 border rounded" value={mpS1Days} onChange={e => setMpS1Days(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500">2단계 일수</label>
                                <input type="text" className="w-full p-2 border rounded" value={mpS2Days} onChange={e => setMpS2Days(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500">3단계 일수</label>
                                <input type="text" className="w-full p-2 border rounded" value={mpS3Days} onChange={e => setMpS3Days(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500">제경비</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded"
                                    value={mpExpenses.toLocaleString()}
                                    onChange={e => {
                                        const val = e.target.value.replace(/[^0-9]/g, '');
                                        setMpExpenses(parseInt(val) || 0);
                                    }}
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-xs font-medium text-gray-500">자동 계산 합계</label>
                                <input type="text" className="w-full p-2 border rounded bg-gray-100 text-gray-500 cursor-not-allowed" value={formatCurrency(mpCalculatedTotal) + "원"} readOnly />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-green-600">최종 제안 금액 (조정 가능)*</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border-2 border-green-400 rounded bg-green-50 font-bold"
                                    value={mpFinalCost.toLocaleString()}
                                    onChange={e => {
                                        const val = e.target.value.replace(/[^0-9]/g, '');
                                        setMpFinalCost(parseInt(val) || 0);
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                <button
                    onClick={handlePrint}
                    className="mt-8 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-colors flex items-center justify-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                    견적서 인쇄 / PDF 저장
                </button>

                {/* 생성 이력 */}
                <GenerationHistory
                    pageType="generator"
                    pageLabel="K-ETS 견적서"
                    onRestore={handleHistoryRestore}
                    onRegenerate={handleHistoryRegenerate}
                />
            </div>

            {/* Preview Section - The actual Invoice */}
            <div className="bg-white invoice-container shadow-2xl mb-20" style={{ width: '210mm', minHeight: '297mm' }}>
                <table className="print-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <td>
                                <div className="header-space" style={{ height: '15mm' }}></div>
                            </td>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                <div className="page-content" style={{ padding: '0 15mm' }}>
                                    <div style={{ clear: 'both' }}>
                                        <div style={{ textAlign: 'right' }}>
                                            <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAqQAAAAECAYAAABYxS1uAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABFSURBVGhD7daxDcAwDANB7eUdPWJWcQxIRQq1SnUPXMcBGGs/BwAA/hTfugEAAEyqK5p1AwAAmFRXNOsGAAAwqa7oLeIFcQTbLvA45s8AAAAASUVORK5CYII=" width="100%" height="4" alt="" />
                                        </div>
                                    </div>

                                    <div style={{ textAlign: 'center', margin: '20px 0', width: '100%', overflow: 'hidden' }}>
                                        <h1 style={{
                                            fontSize: title.length > 25 ? '18pt' : title.length > 20 ? '21pt' : '24pt',
                                            fontWeight: 'bold',
                                            whiteSpace: 'nowrap',
                                            display: 'inline-block'
                                        }}>
                                            {title}
                                        </h1>
                                    </div>

                                    <div style={{ width: '100%' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px' }}>
                                            <tbody>
                                                <tr>
                                                    <td style={{ width: '40px', fontSize: '10pt' }}>수신:</td>
                                                    <td style={{ fontSize: '11pt', fontWeight: 'bold' }}>{companyName}</td>
                                                    <td style={{ textAlign: 'right', fontSize: '11pt' }}>{docId}</td>
                                                </tr>
                                                <tr>
                                                    <td style={{ fontSize: '10pt' }}>참조:</td>
                                                    <td style={{ fontSize: '11pt' }}>{contactPerson} 귀하</td>
                                                    <td></td>
                                                </tr>
                                                <tr>
                                                    <td style={{ fontSize: '10pt' }}>발신:</td>
                                                    <td style={{ fontSize: '11pt' }}>로이드인증원(LRQA)</td>
                                                    <td style={{ textAlign: 'right', fontSize: '11pt' }}>{formatDateKorean(issueDate)}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                        <hr style={{ border: '0.5pt solid black' }} />
                                    </div>

                                    <div style={{ padding: '15px 0 5px 0' }}>
                                        <ol style={{ paddingLeft: '20px', fontSize: '11pt', lineHeight: '1.5' }}>
                                            <li>귀 사의 지속가능한 발전을 기원합니다.</li>
                                            <li>귀 사에 대한 온실가스 {showInv && showMp ? '명세서 및 배출량산정계획서' : showInv ? '명세서' : '배출량산정계획서'} 검증과 관련하여, 예상되는 검증 심사 내역을 아래와 같이 송부드리오니, 업무 참조하시기 바랍니다.</li>
                                        </ol>
                                        <p style={{ textAlign: 'center', margin: '15px 0', fontSize: '11pt' }}>- 아&nbsp;&nbsp;래 -</p>

                                        <div style={{ paddingLeft: '20px', fontSize: '11pt', lineHeight: '1.5' }}>
                                            <p>(1) 검증 범위: <strong><u>{scopeText}</u></strong></p>
                                            <p>(2) 심사 기준: 온실가스 배출권거래제의 배출량 보고 및 인증에 관한 지침</p>
                                            <p>(3) 검증 비용</p>
                                        </div>

                                        {showInv && (
                                            <div className="avoid-break" style={{ marginBottom: '20px' }}>
                                                <p style={{ paddingLeft: '40px', fontSize: '10pt', margin: '5px 0' }}>{showInv && showMp ? '1) 명세서 검증' : '1) 명세서 검증'}</p>
                                                <table style={{ width: '90%', marginLeft: '5%', border: '1.2pt solid black', borderCollapse: 'collapse', textAlign: 'center', fontSize: '9pt' }}>
                                                    <thead>
                                                        <tr style={{ background: '#f8f9fa' }}>
                                                            <th style={{ border: '0.5pt solid black', padding: '6px', width: '35%' }}>구 분</th>
                                                            <th style={{ border: '0.5pt solid black', padding: '6px', width: '20%' }}>검증 일수</th>
                                                            <th style={{ border: '0.5pt solid black', padding: '6px', width: '25%' }}>검증 비용</th>
                                                            <th style={{ border: '0.5pt solid black', padding: '6px', width: '20%' }}>비 고</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr>
                                                            <td style={{ border: '0.5pt solid black', padding: '6px' }}>신 청 비</td>
                                                            <td style={{ border: '0.5pt solid black', padding: '6px' }}>N/A</td>
                                                            <td style={{ border: '0.5pt solid black', padding: '6px', textAlign: 'right', paddingRight: '8px' }}>면제(720,000원)</td>
                                                            <td style={{ border: '0.5pt solid black', padding: '6px' }}></td>
                                                        </tr>
                                                        <tr>
                                                            <td style={{ border: '0.5pt solid black', padding: '6px' }}>1단계(개요파악, 계획수립)</td>
                                                            <td style={{ border: '0.5pt solid black', padding: '6px' }}>{formatStageDays(invS1Days)} Manday</td>
                                                            <td style={{ border: '0.5pt solid black', padding: '6px', textAlign: 'right', paddingRight: '8px' }}>{formatCurrency(Math.floor(parseFloat(invS1Days) * STANDARD_RATE * (vatType === '포함' ? 1.1 : 1)))}원</td>
                                                            <td rowSpan={4} style={{ border: '0.5pt solid black', padding: '6px' }}></td>
                                                        </tr>
                                                        <tr>
                                                            <td style={{ border: '0.5pt solid black', padding: '6px' }}>2단계(문서검토, 현장검증)</td>
                                                            <td style={{ border: '0.5pt solid black', padding: '6px' }}>{formatStageDays(invS2Days)} Manday</td>
                                                            <td style={{ border: '0.5pt solid black', padding: '6px', textAlign: 'right', paddingRight: '8px' }}>{formatCurrency(Math.floor(parseFloat(invS2Days) * STANDARD_RATE * (vatType === '포함' ? 1.1 : 1)))}원</td>
                                                        </tr>
                                                        <tr>
                                                            <td style={{ border: '0.5pt solid black', padding: '6px' }}>3단계(검증결과 정리/평가 등)</td>
                                                            <td style={{ border: '0.5pt solid black', padding: '6px' }}>{formatStageDays(invS3Days)} Manday</td>
                                                            <td style={{ border: '0.5pt solid black', padding: '6px', textAlign: 'right', paddingRight: '8px' }}>{formatCurrency(Math.floor(parseFloat(invS3Days) * STANDARD_RATE * (vatType === '포함' ? 1.1 : 1)))}원</td>
                                                        </tr>
                                                        <tr>
                                                            <td style={{ border: '0.5pt solid black', padding: '6px' }}>제경비</td>
                                                            <td style={{ border: '0.5pt solid black', padding: '6px' }}>-</td>
                                                            <td style={{ border: '0.5pt solid black', padding: '6px', textAlign: 'right', paddingRight: '8px' }}>{formatCurrency(Math.floor(invExpenses * (vatType === '포함' ? 1.1 : 1)))}원</td>
                                                        </tr>
                                                        <tr style={{ background: '#e0ffff', fontWeight: 'bold' }}>
                                                            <td style={{ border: '1pt solid black', padding: '7px' }}>합 계</td>
                                                            <td style={{ border: '1pt solid black', padding: '7px' }}>{formatTotalDays(invTotalDays)} Manday</td>
                                                            <td style={{ border: '1pt solid black', padding: '7px', textAlign: 'right', paddingRight: '8px' }}>{formatCurrency(vatType === '포함' ? Math.floor(invCalculatedTotal * 1.1) : invCalculatedTotal)}원</td>
                                                            <td style={{ border: '1pt solid black', padding: '7px' }}>VAT {vatType}</td>
                                                        </tr>
                                                        <tr style={{ background: '#000080', color: 'white', fontWeight: 'bold' }}>
                                                            <td style={{ border: '1pt solid black', padding: '7px' }}>최종 제안금액</td>
                                                            <td style={{ border: '1pt solid black', padding: '7px' }}>{formatTotalDays(invTotalDays)} Manday</td>
                                                            <td style={{ border: '1pt solid black', padding: '7px', textAlign: 'right', paddingRight: '8px' }}>{formatCurrency(vatType === '포함' ? Math.floor(invFinalCost * 1.1) : invFinalCost)}원</td>
                                                            <td style={{ border: '1pt solid black', padding: '7px' }}>VAT {vatType}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}

                                        {showMp && (
                                            <div className="avoid-break" style={{ marginBottom: '20px' }}>
                                                <p style={{ paddingLeft: '40px', fontSize: '10pt', margin: '5px 0' }}>{showInv ? '2) 배출량산정계획서' : '1) 배출량산정계획서'}</p>
                                                <table style={{ width: '90%', marginLeft: '5%', border: '1.2pt solid black', borderCollapse: 'collapse', textAlign: 'center', fontSize: '9pt', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                                                    <thead>
                                                        <tr style={{ background: '#f8f9fa' }}>
                                                            <th style={{ border: '0.5pt solid black', padding: '6px', width: '35%' }}>구 분</th>
                                                            <th style={{ border: '0.5pt solid black', padding: '6px', width: '20%' }}>검증 일수</th>
                                                            <th style={{ border: '0.5pt solid black', padding: '6px', width: '25%' }}>검증 비용</th>
                                                            <th style={{ border: '0.5pt solid black', padding: '6px', width: '20%' }}>비 고</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr>
                                                            <td style={{ border: '0.5pt solid black', padding: '6px' }}>신 청 비</td>
                                                            <td style={{ border: '0.5pt solid black', padding: '6px' }}>N/A</td>
                                                            <td style={{ border: '0.5pt solid black', padding: '6px', textAlign: 'right', paddingRight: '8px' }}>면제(720,000원)</td>
                                                            <td style={{ border: '0.5pt solid black', padding: '6px' }}></td>
                                                        </tr>
                                                        <tr>
                                                            <td style={{ border: '0.5pt solid black', padding: '6px' }}>1단계(개요파악, 계획수립)</td>
                                                            <td style={{ border: '0.5pt solid black', padding: '6px' }}>{formatStageDays(mpS1Days)} Manday</td>
                                                            <td style={{ border: '0.5pt solid black', padding: '6px', textAlign: 'right', paddingRight: '8px' }}>{formatCurrency(Math.floor(parseFloat(mpS1Days) * STANDARD_RATE * (vatType === '포함' ? 1.1 : 1)))}원</td>
                                                            <td rowSpan={4} style={{ border: '0.5pt solid black', padding: '6px' }}></td>
                                                        </tr>
                                                        <tr>
                                                            <td style={{ border: '0.5pt solid black', padding: '6px' }}>2단계(문서검토, 현장검증)</td>
                                                            <td style={{ border: '0.5pt solid black', padding: '6px' }}>{formatStageDays(mpS2Days)} Manday</td>
                                                            <td style={{ border: '0.5pt solid black', padding: '6px', textAlign: 'right', paddingRight: '8px' }}>{formatCurrency(Math.floor(parseFloat(mpS2Days) * STANDARD_RATE * (vatType === '포함' ? 1.1 : 1)))}원</td>
                                                        </tr>
                                                        <tr>
                                                            <td style={{ border: '0.5pt solid black', padding: '6px' }}>3단계(검증결과 정리/평가 등)</td>
                                                            <td style={{ border: '0.5pt solid black', padding: '6px' }}>{formatStageDays(mpS3Days)} Manday</td>
                                                            <td style={{ border: '0.5pt solid black', padding: '6px', textAlign: 'right', paddingRight: '8px' }}>{formatCurrency(Math.floor(parseFloat(mpS3Days) * STANDARD_RATE * (vatType === '포함' ? 1.1 : 1)))}원</td>
                                                        </tr>
                                                        <tr>
                                                            <td style={{ border: '0.5pt solid black', padding: '6px' }}>제경비</td>
                                                            <td style={{ border: '0.5pt solid black', padding: '6px' }}>-</td>
                                                            <td style={{ border: '0.5pt solid black', padding: '6px', textAlign: 'right', paddingRight: '8px' }}>{formatCurrency(Math.floor(mpExpenses * (vatType === '포함' ? 1.1 : 1)))}원</td>
                                                        </tr>
                                                        <tr style={{ background: '#e0ffff', fontWeight: 'bold' }}>
                                                            <td style={{ border: '1pt solid black', padding: '7px' }}>합 계</td>
                                                            <td style={{ border: '1pt solid black', padding: '7px' }}>{formatTotalDays(mpTotalDays)} Manday</td>
                                                            <td style={{ border: '1pt solid black', padding: '7px', textAlign: 'right', paddingRight: '8px' }}>{formatCurrency(vatType === '포함' ? Math.floor(mpCalculatedTotal * 1.1) : mpCalculatedTotal)}원</td>
                                                            <td style={{ border: '1pt solid black', padding: '7px' }}>VAT {vatType}</td>
                                                        </tr>
                                                        <tr style={{ background: '#000080', color: 'white', fontWeight: 'bold' }}>
                                                            <td style={{ border: '1pt solid black', padding: '7px' }}>최종 제안금액</td>
                                                            <td style={{ border: '1pt solid black', padding: '7px' }}>{formatTotalDays(mpTotalDays)} Manday</td>
                                                            <td style={{ border: '1pt solid black', padding: '7px', textAlign: 'right', paddingRight: '8px' }}>{formatCurrency(vatType === '포함' ? Math.floor(mpFinalCost * 1.1) : mpFinalCost)}원</td>
                                                            <td style={{ border: '1pt solid black', padding: '7px' }}>VAT {vatType}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}

                                        {(showInv && showMp) && (
                                            <div className="avoid-break" style={{ width: '90%', marginLeft: '5%', marginTop: '20px' }}>
                                                <table style={{ width: '100%', border: '2pt solid #000080', borderCollapse: 'collapse' }}>
                                                    <tbody>
                                                        <tr style={{ background: '#000080', color: 'white' }}>
                                                            <td style={{
                                                                padding: '12px 5px',
                                                                fontSize: '10pt',
                                                                fontWeight: 'bold',
                                                                textAlign: 'center',
                                                                width: '55%',
                                                                border: '1pt solid #000080',
                                                                whiteSpace: 'nowrap'
                                                            }}>
                                                                전체 최종 제안금액 (명세서 + 계획서)
                                                            </td>
                                                            <td style={{
                                                                padding: '12px 10px',
                                                                fontSize: '12pt',
                                                                fontWeight: 'bold',
                                                                textAlign: 'right',
                                                                border: '1pt solid #000080',
                                                                whiteSpace: 'nowrap'
                                                            }}>
                                                                {formatCurrency(vatType === '포함' ? Math.floor((invFinalCost + mpFinalCost) * 1.1) : (invFinalCost + mpFinalCost))}원 (VAT {vatType})
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}

                                        <div style={{ marginTop: '20px', paddingLeft: '20px', fontSize: '9pt', lineHeight: '1.4' }}>
                                            <p style={{ fontWeight: 'bold' }}>(4) 기타</p>
                                            <p style={{ marginLeft: '10px' }}>1) 심사 요율은 {vatType === '포함' ? '1,155,000' : '1,050,000'}원/ Manday 이며 상기 금액은 부가가치세(VAT)가 {vatType === '포함' ? '포함된' : '제외된'} 금액입니다.</p>
                                            <p style={{ marginLeft: '10px' }}>2) 교통비, 숙박비, 심사원 일비 등의 제경비는 상기 제안금액에 포함되어 있습니다.</p>
                                            <p style={{ marginLeft: '10px' }}>3) 상기 검증비용은 업체의 상황에 따라 상호 협의 하에 조정될 수 있습니다.</p>
                                            <p style={{ marginLeft: '10px' }}>4) 제안서 유효기간은 제안 발행일로부터 30일 이내 입니다.</p>
                                            <p style={{ marginLeft: '10px' }}>5) 자세한 사항은 권대근 과장(02-3703-7514)에게 문의 바랍니다. 끝.</p>
                                        </div>

                                        <div className="avoid-break" style={{ marginTop: '20px', textAlign: 'right', marginBottom: '20px' }}>
                                            <p style={{ fontSize: '10pt' }}>감사합니다.</p>
                                            <p style={{ fontSize: '11pt', fontWeight: 'bold', marginTop: '5px' }}>로이드인증원</p>
                                        </div>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr>
                            <td>
                                <div className="footer-space" style={{ height: '35mm' }}></div>
                            </td>
                        </tr>
                    </tfoot>
                </table>

                {/* Fixed Footer for Print */}
                <div className="invoice-footer">
                    <table style={{ width: '100%' }}>
                        <tbody>
                            <tr>
                                <td style={{ width: '85px', verticalAlign: 'middle', padding: '5px 0' }}>
                                    <img
                                        src="https://www.lrqa.com/cdn-cgi/image/width=300,format=auto/globalassets/logos/lrqa-white-logo---dark-background-cropped.png"
                                        style={{ width: '85px', height: 'auto', display: 'block', backgroundColor: '#000', padding: '5px' }}
                                        alt="LRQA Logo"
                                    />
                                </td>
                                <td style={{ verticalAlign: 'top', paddingLeft: '10px' }}>
                                    <p style={{ margin: 0, fontSize: '11pt', color: '#3b8ede', fontWeight: 'bold' }}>YOUR FUTURE. OUR FOCUS.</p>
                                    <p style={{ margin: 0, fontSize: '8pt' }}>for more information or call <strong>+82 (0)2 736 6231</strong></p>
                                </td>
                                <td style={{ textAlign: 'right', verticalAlign: 'top', fontSize: '9pt', color: '#666' }}>
                                    <p style={{ margin: 0, fontWeight: 'bold' }}>로이드인증원</p>
                                    <p style={{ margin: 0 }}>서울특별시 중구 소월로2길 30, 2층 남산트라팰리스 (우) 04637</p>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <style jsx>{`
        .invoice-container {
          background: white;
          position: relative;
        }
        .invoice-footer {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 35mm;
          background: white;
          border-top: 1px solid #ddd;
          padding: 10px 15mm 0 15mm;
          box-sizing: border-box;
        }
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
          .invoice-container {
            margin: 0 !important;
            box-shadow: none !important;
            width: 210mm !important;
            padding: 0 !important;
          }
          .header-space, .footer-space {
            display: block;
          }
          .invoice-footer {
            position: fixed !important;
            bottom: 0 !important;
            left: 0 !important;
            z-index: 9999;
          }
          .avoid-break {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          /* This is the magic for table-based page breaking */
          .print-table {
            page-break-after: auto;
          }
          .print-table > tbody > tr {
            page-break-inside: auto;
            page-break-after: auto;
          }
        }
      `}</style>
        </div>
    );
}
