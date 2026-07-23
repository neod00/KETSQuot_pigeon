import AccessRequestForm from './AccessRequestForm';

export default function RequestAccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <section className="w-full max-w-md rounded-md border border-slate-200 bg-white p-7 shadow-sm">
        <p className="text-sm font-bold text-teal-700">LRQA INTERNAL</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">팀원 사용 신청</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          LRQA 이메일과 사용할 비밀번호를 입력해 주세요. 관리자가 재직 여부를 확인하고 승인하면 모든 업무 기능을 이용할 수 있습니다.
        </p>
        <AccessRequestForm />
      </section>
    </main>
  );
}
