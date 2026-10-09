"use client";
import { useState } from 'react';
import { useNavigator } from './NavigatorContext';
import { QUESTIONS, CATEGORY_LABELS } from '@/shared/cbam-navigator';
import { ANSWER_LABELS, QUESTION_GUIDANCE, needsPreparation, recommendedActions } from '@/lib/readiness-guidance';

export function RequiredMaterials({ onReview }: { onReview: (id: string) => void }) {
  const { draft } = useNavigator();
  const [showAll, setShowAll] = useState(false);
  const followup = recommendedActions(draft);
  const questions = showAll ? QUESTIONS : followup;
  const unanswered = QUESTIONS.filter(q => !draft.answers[q.id]).length;
  const gaps = QUESTIONS.filter(q => draft.answers[q.id] && needsPreparation(draft.answers[q.id])).length;
  return <section className="required-materials" id="required-materials" aria-labelledby="required-materials-title">
    <div className="materials-heading"><div><p className="eyebrow">진단에서 다음 업무로</p><h3 id="required-materials-title">준비할 자료와 다음 조치</h3></div><strong>추가 준비 {gaps}개{unanswered > 0 && ` · 미응답 ${unanswered}개`}</strong></div>
    <p className="muted">진단 응답에 따라 필요한 준비를 정리했습니다. 자료 예시와 확인할 부서를 참고해 업무를 진행하세요.</p>
    <label className="check"><input type="checkbox" checked={showAll} onChange={e => setShowAll(e.target.checked)} />준비됨 항목까지 전체 자료 보기</label>
    {questions.length ? <ul className="materials-list">{questions.map(q => {
      const guidance = QUESTION_GUIDANCE[q.id];
      const ready = draft.answers[q.id] === 'ready';
      return <li className="material-item" key={q.id} data-question={q.id}>
        <div className="material-title"><div><p>{CATEGORY_LABELS[q.category]} · {q.priority}</p><h4>{q.evidence}</h4></div><span className={`badge ${ready ? 'in_scope' : ''}`}>{ANSWER_LABELS[draft.answers[q.id]] || '미응답'}</span></div>
        <dl><div><dt>다음 조치</dt><dd>{ready ? '제출 전 자료의 최신성과 대상기간·범위를 검토하세요.' : draft.answers[q.id] ? guidance.action : '해당 진단 질문에 응답하고 필요한 준비를 확인하세요.'}</dd></div><div><dt>자료 예시</dt><dd>{guidance.example}</dd></div><div><dt>확인할 부서</dt><dd>{guidance.owner}</dd></div></dl>
        <button type="button" className="material-review" onClick={() => onReview(q.id)}>{draft.answers[q.id] ? '진단 응답 수정' : '이 질문에 응답하기'} →</button>
      </li>;
    })}</ul> : <p className="materials-empty">진단 응답 기준으로 추가 준비 항목이 없습니다. 검증 범위와 제출 일정을 확인하세요. 전체 자료 목록은 위 옵션으로 볼 수 있습니다.</p>}
    <p className="muted materials-note">자료 예시와 확인할 부서는 참고사항이며 제품과 검증 범위에 따라 달라집니다. 실제 담당자·기한·자료 위치는 아래에서 받을 수 있는 협조요청용 Excel에 정리하세요.</p>
  </section>;
}
