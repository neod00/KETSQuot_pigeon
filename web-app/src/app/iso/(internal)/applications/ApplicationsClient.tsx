'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { IsoApplication } from '@/lib/isoTypes';

const statusLabel: Record<IsoApplication['status'], string> = {
  new: '신규',
  in_review: '검토 중',
  needs_information: '정보 보완',
  quote_ready: '견적 준비',
  completed: '완료',
};

const statusClass: Record<IsoApplication['status'], string> = {
  new: 'bg-blue-50 text-blue-700',
  in_review: 'bg-amber-50 text-amber-700',
  needs_information: 'bg-red-50 text-red-700',
  quote_ready: 'bg-emerald-50 text-emerald-700',
  completed: 'bg-slate-100 text-slate-600',
};

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value || '-' : new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(date);
};

const PAGE_SIZE = 12;

export default function ApplicationsClient({ applications }: { applications: IsoApplication[] }) {
  const [items, setItems] = useState(applications);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return items.filter((application) => {
      const matchesStatus = status === 'all' || application.status === status;
      const haystack = [
        application.companyName,
        application.companyNameEn,
        application.contactName,
        application.contactEmail,
        application.contactPhone,
        application.standards.join(' '),
        application.scope,
      ].join(' ').toLowerCase();
      return matchesStatus && (!term || haystack.includes(term));
    });
  }, [items, query, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const allVisibleSelected = visible.length > 0 && visible.every((application) => selectedSet.has(application.id));

  const resetSelection = () => {
    setSelectedIds([]);
    setDeleteError('');
  };

  const toggleOne = (applicationId: string) => {
    setSelectedIds((current) => current.includes(applicationId)
      ? current.filter((id) => id !== applicationId)
      : [...current, applicationId]);
  };

  const toggleVisible = () => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allVisibleSelected) visible.forEach((application) => next.delete(application.id));
      else visible.forEach((application) => next.add(application.id));
      return [...next];
    });
  };

  const deleteSelected = async () => {
    if (selectedIds.length === 0 || isDeleting) return;
    const confirmed = window.confirm(`선택한 신청서 ${selectedIds.length}건을 접수함에서 삭제하시겠습니까? 고객이 제출한 원본 데이터는 보존됩니다.`);
    if (!confirmed) return;

    setIsDeleting(true);
    setDeleteError('');
    try {
      const response = await fetch('/api/iso/applications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationIds: selectedIds }),
      });
      const payload = await response.json().catch(() => ({})) as { error?: string; deletedIds?: string[] };
      if (!response.ok) throw new Error(payload.error || '신청서를 삭제하지 못했습니다.');
      const deleted = new Set(payload.deletedIds || selectedIds);
      setItems((current) => current.filter((application) => !deleted.has(application.id)));
      setSelectedIds([]);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : '신청서를 삭제하지 못했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-3 border-b border-slate-200 bg-white p-4 md:flex-row md:items-end">
        <div className="flex-1">
          <label htmlFor="application-search" className="mb-1 block text-xs font-bold text-slate-600">신청서 검색</label>
          <input id="application-search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); resetSelection(); }} placeholder="회사명, 담당자, 연락처, 표준" className="w-full rounded-md border border-slate-300 px-3 py-2" />
        </div>
        <div className="md:w-48">
          <label htmlFor="application-status" className="mb-1 block text-xs font-bold text-slate-600">상태</label>
          <select id="application-status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); resetSelection(); }} className="w-full rounded-md border border-slate-300 px-3 py-2">
            <option value="all">전체</option>
            <option value="new">신규</option>
            <option value="quote_ready">견적 준비</option>
            <option value="in_review">검토 중</option>
            <option value="completed">완료</option>
          </select>
        </div>
        <div className="flex items-center gap-3 md:pb-0.5">
          <span className="whitespace-nowrap text-sm font-semibold text-slate-600">총 {filtered.length}건</span>
          <button type="button" onClick={deleteSelected} disabled={selectedIds.length === 0 || isDeleting} className="whitespace-nowrap rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm font-bold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40">
            {isDeleting ? '삭제 중' : `선택 삭제${selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}`}
          </button>
        </div>
      </div>

      {deleteError && <p role="alert" className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{deleteError}</p>}

      <div className="overflow-x-auto bg-white">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-600">
            <tr>
              <th className="w-12 border-b border-slate-200 px-4 py-3 text-center">
                <input type="checkbox" checked={allVisibleSelected} onChange={toggleVisible} aria-label="현재 페이지 전체 선택" className="h-4 w-4 accent-teal-700" />
              </th>
              <th className="border-b border-slate-200 px-4 py-3">신청일</th>
              <th className="border-b border-slate-200 px-4 py-3">회사명</th>
              <th className="border-b border-slate-200 px-4 py-3">담당자</th>
              <th className="border-b border-slate-200 px-4 py-3">표준</th>
              <th className="border-b border-slate-200 px-4 py-3">상태</th>
              <th className="border-b border-slate-200 px-4 py-3 text-right">작업</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((application) => (
              <tr key={application.id} className={selectedSet.has(application.id) ? 'bg-teal-50' : 'hover:bg-slate-50'}>
                <td className="border-b border-slate-100 px-4 py-3 text-center">
                  <input type="checkbox" checked={selectedSet.has(application.id)} onChange={() => toggleOne(application.id)} aria-label={`${application.companyName} 선택`} className="h-4 w-4 accent-teal-700" />
                </td>
                <td className="whitespace-nowrap border-b border-slate-100 px-4 py-3">{formatDate(application.submittedAt)}</td>
                <td className="border-b border-slate-100 px-4 py-3">
                  <p className="font-bold text-slate-900">{application.companyName}</p>
                  {application.companyNameEn && <p className="mt-0.5 text-xs text-slate-500">{application.companyNameEn}</p>}
                </td>
                <td className="border-b border-slate-100 px-4 py-3">
                  <p>{application.contactName || '-'}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{application.contactEmail || application.contactPhone || '-'}</p>
                </td>
                <td className="border-b border-slate-100 px-4 py-3">{application.standards.join(', ') || application.otherStandards || '-'}</td>
                <td className="border-b border-slate-100 px-4 py-3">
                  <span className={`inline-flex rounded px-2 py-1 text-xs font-bold ${statusClass[application.status]}`}>{statusLabel[application.status]}</span>
                </td>
                <td className="border-b border-slate-100 px-4 py-3 text-right">
                  <Link href={`/iso/applications/${application.id}`} target="_blank" rel="noreferrer" className="inline-flex rounded-md border border-slate-300 px-3 py-1.5 font-bold text-slate-700 hover:bg-slate-100">검토</Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} className="px-4 py-14 text-center text-slate-500">조건에 맞는 신청서가 없습니다.</td></tr>}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
        <div className="flex flex-col gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="whitespace-nowrap text-sm text-slate-600">총 {pageCount}페이지</p>
          <nav aria-label="신청서 목록 페이지" className="flex flex-wrap items-center justify-center gap-1">
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber, index) => (
              <span key={pageNumber} className="inline-flex items-center">
                {index > 0 && <span aria-hidden="true" className="px-1 text-slate-300">|</span>}
                <button type="button" onClick={() => setPage(pageNumber)} aria-label={`${pageNumber}페이지로 이동`} aria-current={currentPage === pageNumber ? 'page' : undefined} className={`h-8 min-w-8 px-2 text-sm font-bold ${currentPage === pageNumber ? 'rounded bg-teal-700 text-white' : 'text-slate-600 hover:text-teal-700'}`}>
                  {pageNumber}
                </button>
              </span>
            ))}
          </nav>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={currentPage === 1} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40">이전</button>
            <button type="button" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={currentPage === pageCount} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40">다음</button>
          </div>
        </div>
      )}
    </>
  );
}