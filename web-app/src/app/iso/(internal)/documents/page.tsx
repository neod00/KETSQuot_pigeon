import { listIsoDocuments } from '@/lib/isoDocuments';

export const dynamic = 'force-dynamic';

const typeLabel = { quote: '견적서', contract: '계약서' };

export default async function IsoDocumentsPage() {
  const documents = await listIsoDocuments();

  return (
    <main className="mx-auto max-w-7xl px-5 py-6">
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-slate-900">생성 문서</h2>
        <p className="mt-1 text-sm text-slate-600">견적 초안에서 생성해 내부 저장한 Word 문서입니다.</p>
      </div>
      <section className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold text-slate-600">
              <tr>
                <th className="border-b border-slate-200 px-4 py-3">생성일</th>
                <th className="border-b border-slate-200 px-4 py-3">종류</th>
                <th className="border-b border-slate-200 px-4 py-3">회사명</th>
                <th className="border-b border-slate-200 px-4 py-3">표준</th>
                <th className="border-b border-slate-200 px-4 py-3">파일</th>
                <th className="border-b border-slate-200 px-4 py-3 text-right">작업</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((document) => (
                <tr key={document.id}>
                  <td className="border-b border-slate-100 px-4 py-3 whitespace-nowrap">{new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(document.createdAt))}</td>
                  <td className="border-b border-slate-100 px-4 py-3 font-bold">{typeLabel[document.documentType]}</td>
                  <td className="border-b border-slate-100 px-4 py-3">{document.companyName}</td>
                  <td className="border-b border-slate-100 px-4 py-3">{document.standards.join(', ')}</td>
                  <td className="max-w-xs truncate border-b border-slate-100 px-4 py-3" title={document.fileName}>{document.fileName}</td>
                  <td className="border-b border-slate-100 px-4 py-3 text-right">
                    <a href={`/api/iso/documents/${document.id}/download`} className="inline-flex rounded-md border border-slate-300 px-3 py-1.5 font-bold text-slate-700 hover:bg-slate-50">다운로드</a>
                  </td>
                </tr>
              ))}
              {documents.length === 0 && <tr><td colSpan={6} className="px-4 py-14 text-center text-slate-500">저장된 문서가 없습니다.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
