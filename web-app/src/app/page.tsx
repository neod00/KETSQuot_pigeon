'use client';

import Link from 'next/link';

export default function LandingPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/50 p-8 font-sans selection:bg-blue-100">
            <div className="mb-16 text-center space-y-3">
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                    LRQA <span className="text-blue-600">Quotation & Contract</span> Portal
                </h1>
                <p className="text-slate-500 text-lg font-medium">원하시는 견적 및 계약 시스템을 선택해 주세요.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl w-full px-4">
                {/* Legacy Generator Card */}
                <Link href="/generator" className="group">
                    <div className="bg-white p-10 rounded-[2rem] shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-slate-100 h-full flex flex-col relative overflow-hidden group-hover:border-slate-300">
                        {/* Soft background decoration */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-slate-100"></div>

                        <div className="mb-8 w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-600 group-hover:bg-slate-900 group-hover:text-white transition-colors duration-300 shadow-inner">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                        </div>

                        <div className="flex items-center gap-3 mb-3">
                            <h2 className="text-2xl font-bold text-slate-700 group-hover:text-slate-900 transition-colors">
                                K-ETS 검증 견적서 생성기
                            </h2>
                        </div>

                        <div className="mb-6">
                            <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500 ring-1 ring-inset ring-slate-500/10">
                                Legacy (v1.7)
                            </span>
                        </div>

                        <p className="text-slate-500 leading-relaxed text-sm">
                            기존에 사용하던 심플한 입력 폼 방식의 견적서 생성기입니다. 빠른 견적 산출이 필요할 때 사용하세요.
                        </p>
                    </div>
                </Link>

                {/* New System Card */}
                <Link href="/system" className="group">
                    <div className="bg-white p-10 rounded-[2rem] shadow-lg shadow-blue-900/5 hover:shadow-2xl hover:shadow-blue-900/10 hover:-translate-y-1 transition-all duration-300 border border-blue-50 h-full flex flex-col relative overflow-hidden group-hover:border-blue-200">
                        {/* Gradient background decoration */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-60 group-hover:opacity-100 transition-opacity"></div>

                        <div className="absolute top-6 right-6">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                            </span>
                        </div>

                        <div className="absolute top-0 right-0 m-0">
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-bold px-4 py-1.5 rounded-bl-2xl shadow-sm tracking-wider uppercase">
                                Recommended
                            </div>
                        </div>

                        <div className="mb-8 w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-blue-100 shadow-inner">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
                            </svg>
                        </div>

                        <div className="flex flex-col mb-3">
                            <h2 className="text-2xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                                P827 Data & Information
                            </h2>
                            <h2 className="text-xl font-bold text-slate-600 group-hover:text-blue-500 transition-colors">
                                계약서 생성기
                            </h2>
                        </div>

                        <div className="mb-6">
                            <span className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600 ring-1 ring-inset ring-blue-600/20">
                                New System (v2.0)
                            </span>
                        </div>

                        <p className="text-slate-500 leading-relaxed text-sm">
                            새로운 대시보드 UI와 통합 관리 기능을 제공하는 차세대 시스템입니다. 데이터 기반의 정확한 계약서 작성을 지원합니다.
                        </p>
                    </div>
                </Link>
            </div>

            <footer className="mt-24 text-slate-400 text-xs font-medium tracking-wide">
                © 2026 LRQA. All rights reserved.
            </footer>
        </div>
    );
}
