import type { Draft } from '@/components/NavigatorContext';
import { QUESTIONS, CATEGORY_LABELS, scoreReadiness } from '@/shared/cbam-navigator';
import { ANSWER_LABELS, QUESTION_GUIDANCE, recommendedActions } from './readiness-guidance';

export type ReportDetails = { company: string; author: string; reportingPeriod: string; recipient: string; deadline: string; decisionRequest: string };
export const EMPTY_REPORT_DETAILS: ReportDetails = { company: '', author: '', reportingPeriod: '', recipient: '', deadline: '', decisionRequest: '' };
export function businessDocumentData(draft: Draft, details: ReportDetails, now = new Date()) {
  const scored = scoreReadiness(draft.answers);
  const date = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  const rows = QUESTIONS.map(q => ({ ...q, categoryLabel: CATEGORY_LABELS[q.category], ...QUESTION_GUIDANCE[q.id], answer: ANSWER_LABELS[draft.answers[q.id]] || '미응답' }));
  const actions = recommendedActions(draft).map(q => ({ ...rows.find(r => r.id === q.id)!, action: q.action }));
  return { draft, details, date, scored, rows, actions,
    readyAnswers: rows.filter(r => draft.answers[r.id] === 'ready').length,
    scoreLabel: scored.complete ? `${scored.readinessScore}%` : '진단 미완료',
    categories: Object.entries(CATEGORY_LABELS).map(([key, label]) => ({ label, score: scored.readinessCategories[key as keyof typeof CATEGORY_LABELS], answered: QUESTIONS.filter(q => q.category === key && draft.answers[q.id]).length })),
  };
}
export type BusinessDocumentData = ReturnType<typeof businessDocumentData>;
export function documentFilename(kind: 'pdf' | 'xlsx', date: string) { return `LRQA-CBAM-${kind === 'pdf' ? '준비현황보고서' : '자료협조요청서'}-${date}.${kind}`; }
