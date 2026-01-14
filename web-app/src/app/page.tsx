'use client';

import Link from 'next/link';

export default function LandingPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 p-8">
            <div className="mb-12 text-center">
                <h1 className="text-4xl font-black text-slate-800 mb-4">LRQA Quotation Portal</h1>
                <p className="text-slate-500">원하시는 견적 시스템을 선택해 주세요.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
                {/* Legacy Generator Card */}
                <Link href="/generator" className="group">
                    <div className="bg-white p-10 rounded-3xl shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border-2 border-transparent hover:border-gray-200 h-full flex flex-col">
                        <div className="mb-6 bg-gray-100 w-16 h-16 rounded-2xl flex items-center justify-center text-3xl">
                            📄
                        </div>
                        <h2 className="text-2xl font-bold text-gray-700 mb-2 group-hover:text-gray-900 transition-colors">
                            LRQA 견적서 생성기
                        </h2>
                        <span className="inline-block bg-gray-100 text-gray-500 text-xs font-bold px-3 py-1 rounded-full w-fit mb-4">
                            Legacy (v1.7)
                        </span>
                        <p className="text-gray-500 leading-relaxed">
                            기존에 사용하던 심플한 입력 폼 방식의 견적서 생성기입니다.
                        </p>
                    </div>
                </Link>

                {/* New System Card */}
                <Link href="/system" className="group">
                    <div className="bg-white p-10 rounded-3xl shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border-2 border-transparent hover:border-blue-200 h-full flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-bl-2xl">
                            RECOMMENDED
                        </div>
                        <div className="mb-6 bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center text-3xl">
                            🚀
                        </div>
                        <h2 className="text-2xl font-bold text-blue-600 mb-2 group-hover:text-blue-700 transition-colors">
                            LRQA Quotation System
                        </h2>
                        <span className="inline-block bg-blue-50 text-blue-500 text-xs font-bold px-3 py-1 rounded-full w-fit mb-4">
                            New System
                        </span>
                        <p className="text-slate-500 leading-relaxed">
                            새로운 대시보드 UI와 통합 관리 기능을 제공하는 차세대 시스템입니다.
                        </p>
                    </div>
                </Link>
            </div>

            <footer className="mt-20 text-slate-400 text-sm">
                © 2026 LRQA. All rights reserved.
            </footer>
        </div>
    );
}
