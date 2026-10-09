import { QUESTIONS, CATEGORY_LABELS, READINESS_NOTICE, scoreReadiness, type ReadinessAnswer } from '@/shared/cbam-navigator';
import type { Draft } from '@/components/NavigatorContext';

type Guidance = { explanation: string; example: string; owner: string; action: string };
export const QUESTION_GUIDANCE: Record<string, Guidance> = {
  S1: { explanation: '제품명만으로 판단하지 않고 실제 거래에 사용하는 CN 코드와 품목을 대조합니다.', example: '제품 목록에 CN 코드, 제품 규격, 통관 근거를 함께 기록한 표', owner: '무역·통관 담당', action: '제품 목록과 통관 코드를 대조해 최종 CN 코드를 확인하세요.' },
  S2: { explanation: '어느 사업장의 어떤 공정을 이번 자료에 포함할지 설명할 수 있는 상태입니다.', example: '사업장별 제품·공정 목록과 포함 범위를 표시한 공정도', owner: '생산·환경 담당', action: '사업장별 공정도를 모아 검증 범위를 표시하세요.' },
  S3: { explanation: '자료의 대상연도와 집계 시작일·종료일이 일치하는지 확인합니다.', example: '생산기간과 데이터 집계기간을 표시한 월별 생산기록', owner: '생산관리 담당', action: '생산량과 배출량 자료의 대상기간을 맞춰 정리하세요.' },
  S4: { explanation: '연료·공정에서 발생하는 직접배출과 전력 등 관련 간접배출의 범위를 구분합니다.', example: '배출원별 직접·간접 구분표와 포함 여부의 근거', owner: '환경·에너지 담당', action: '배출원 목록을 만들고 제품별 포함 범위를 확인하세요.' },
  M1: { explanation: '사용량을 어떻게 측정하고 자료를 어떻게 관리하는지 설명하는 문서의 준비상태를 확인합니다.', example: '영어 모니터링 계획과 측정·산정 방법, 담당자, 데이터 흐름 설명', owner: '환경·에너지 담당', action: '모니터링 계획의 작성상태와 영어 제출본을 확인하세요.' },
  M2: { explanation: '연료 종류별 사용량과 해당 공정의 배출 관련 원자료를 찾아볼 수 있어야 합니다.', example: '연료 구매·사용 대장, 계량 기록, 공정별 원료 사용기록', owner: '환경·생산·구매 담당', action: '연료 사용량과 공정배출 자료를 대상기간별로 모으세요.' },
  M3: { explanation: '대상기간에 사용한 전력과 필요한 열 자료의 출처·집계범위를 확인합니다.', example: '전력 고지서, 계량기 기록, 해당 시 열 구매·사용 기록', owner: '에너지·시설 담당', action: '전력·열 사용량을 확인하고 사업장·공정별 범위를 표시하세요.' },
  M4: { explanation: '측정에 사용하는 계측기가 무엇인지, 측정 신뢰성을 확인할 기록이 있는지 봅니다.', example: '계측기 번호·설치위치·교정일을 기록한 목록과 교정성적서', owner: '시설·품질 담당', action: '계측기 목록과 교정·점검 기록을 연결하세요.' },
  P1: { explanation: '기능 단위는 제품 자료를 정리하는 기준 단위입니다. 제품별 생산량과 사용하는 단위를 확인합니다.', example: '제품별 월간 생산량과 단위가 표시된 ERP 출력표', owner: '생산관리 담당', action: '제품별 생산량과 적용 단위의 근거를 정리하세요.' },
  P2: { explanation: '생산공정은 개별 작업 단계, 생산경로는 제품을 만드는 단계들의 연결입니다.', example: '냉간단조 → 전조 → 열처리 등 작업 흐름과 경로별 제품 목록', owner: '생산기술 담당', action: '공정도에 생산경로와 각 경로의 제품을 표시하세요.' },
  P3: { explanation: '한 공정의 배출량을 여러 제품에 나눌 때 사용한 자료와 계산 근거를 설명할 수 있어야 합니다.', example: '제품별 배출량 귀속에 사용한 수량·측정값·계산식과 근거 기록', owner: '환경·생산관리 담당', action: '제품별 귀속 계산의 원자료와 판단 근거를 연결하세요.' },
  P4: { explanation: '함께 생산되는 제품이나 공정 간 물질 이동이 있는지 확인하고, 없으면 그 근거를 남깁니다.', example: '공동생산품 목록, 공정 간 이동 대장 또는 해당 없음 검토 기록', owner: '생산관리 담당', action: '공동생산품과 공정 간 이동 자료의 해당 여부를 확인하세요.' },
  R1: { explanation: '전구물질은 최종제품 생산에 사용되는 관련 투입물입니다. 제품에 해당하는 투입물의 범위를 확인합니다.', example: '철강 선재 등 관련 투입물의 품명·공급업체·적용 근거 목록', owner: '구매·생산기술 담당', action: '제품별 관련 전구물질 목록과 해당 여부의 근거를 정리하세요.' },
  R2: { explanation: '관련 투입물을 얼마나 사용했는지 구매·재고·사용량 자료로 확인합니다.', example: '구매량, 기초·기말 재고, 생산 투입량을 연결한 표', owner: '구매·자재 담당', action: '관련 전구물질의 사용량과 재고 기록을 대조하세요.' },
  R3: { explanation: '공급업체의 배출량 자료가 필요한 경우 확보 여부와 제품·기간의 일치 여부를 확인합니다.', example: '공급업체가 제공한 제품별 배출량 자료와 적용기간 설명', owner: '구매·공급망 담당', action: '공급업체에 관련 제품·기간의 배출량 자료를 요청하세요.' },
  R4: { explanation: '사용한 배출량 값이 어디서 왔는지, 어떤 기간과 제품에 적용했는지 추적할 수 있어야 합니다.', example: '값의 출처, 버전, 대상기간과 적용 근거를 정리한 기록', owner: '환경·구매 담당', action: '전구물질 배출량 값의 출처와 적용 근거를 확인하세요.' },
  D1: { explanation: '보고서 숫자 하나를 원자료와 계산파일까지 거슬러 확인할 수 있는 상태입니다.', example: '고지서 → 집계표 → 계산파일 → 보고서의 연결표', owner: '환경·데이터 담당', action: '보고값별 원자료와 계산파일의 연결을 정리하세요.' },
  D2: { explanation: '자료 작성과 검토를 누가 담당하는지, 질의가 생기면 누구에게 확인할지 정합니다.', example: '자료 종류별 작성자·검토자·승인자를 표시한 역할표', owner: '환경·부서 책임자', action: '자료별 작성자와 검토자를 지정하세요.' },
  D3: { explanation: '계산파일이 바뀐 이유와 검토 결과를 나중에도 확인할 수 있어야 합니다.', example: '수정일·수정내용·검토자를 기록한 변경이력과 검토 메모', owner: '환경·품질 담당', action: '계산파일의 버전과 변경·검토 기록을 정리하세요.' },
  D4: { explanation: '필요한 자료를 찾을 수 있고, 접근·백업을 관리하는 절차가 있는지 확인합니다.', example: '자료 폴더 목록, 접근권한표, 백업 절차와 기록', owner: 'IT·문서관리 담당', action: '자료 위치와 접근권한·백업 절차를 확인하세요.' },
  V1: { explanation: '대상 제품과 기간의 배출량을 정리한 보고서의 준비상태와 영어 제출본을 확인합니다.', example: '대상기간·제품·산정 근거가 포함된 영어 배출량 보고서', owner: '환경·CBAM 담당', action: '배출량 보고서 초안과 영어 제출본의 준비 일정을 확인하세요.' },
  V2: { explanation: '보고서 숫자와 원자료·집계표·계산파일의 숫자가 일치하는지 검토합니다.', example: '보고값별 대조 결과와 차이 조치내용을 기록한 검토표', owner: '환경·내부 검토자', action: '보고값을 증빙자료와 대조하고 차이의 원인을 기록하세요.' },
  V3: { explanation: '검증 질문을 접수하고 자료별 담당자에게 연결할 창구를 정합니다.', example: '검증 연락 담당자와 생산·구매·환경 담당자의 연락체계', owner: 'CBAM·부서 책임자', action: '검증 연락 창구와 자료별 담당자를 지정하세요.' },
  V4: { explanation: '자료를 준비·제출할 시점과 현장 확인에 대응할 일정을 검토합니다.', example: '자료 준비, 내부 검토, 제출, 현장 확인을 표시한 일정표', owner: 'CBAM·사업장 담당', action: '자료 제출과 현장 대응 일정을 관련 부서와 협의하세요.' },
};
export const ANSWER_LABELS: Record<ReadinessAnswer, string> = { ready: '준비됨', partial: '일부 준비', missing: '미준비 / 모름' };
export function needsPreparation(answer: ReadinessAnswer | undefined) {
  return answer !== 'ready';
}

export function recommendedActions(draft: Pick<Draft, 'answers'>) {
  const priority = { '중요': 0, '보완 필요': 1, '확인 권장': 2 };
  return QUESTIONS.filter(q => needsPreparation(draft.answers[q.id]))
    .map(q => ({ ...q, ...QUESTION_GUIDANCE[q.id], action: draft.answers[q.id] ? QUESTION_GUIDANCE[q.id].action : `${q.evidence}에 관한 진단 질문에 응답하고 필요한 준비를 확인하세요.` }))
    .sort((a, b) => priority[a.priority] - priority[b.priority] || Number(draft.answers[b.id] === 'missing') - Number(draft.answers[a.id] === 'missing'));
}

// Excel may interpret user-entered cells as formulas. Always quote CSV cells
// and neutralize formula prefixes, including leading whitespace/control chars.
export function csvCell(value: string) {
  const safe = /^[\s\u0000-\u001f]*[=+@-]/.test(value) || /^[\t\r\n]/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}
export function buildChecklistCsv(draft: Draft, now = new Date()) {
  const scored = scoreReadiness(draft.answers);
  const date = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  const rows: string[][] = [
    ['LRQA CBAM Navigator 검증 준비 체크리스트'], ['작성일', date],
    ['제품', draft.productName], ['CN 코드', draft.cnCode], ['사업장', draft.sites],
    ['자가진단', scored.complete ? `${scored.readinessScore}%` : `${scored.answered}/24개 응답 · 미완료`],
    ['안내', READINESS_NOTICE], ['자료 예시·확인 부서는 준비를 위한 참고사항이며 제품과 검증 범위에 따라 달라집니다.'], [],
    ['질문 ID', '영역', '우선순위', '질문', '진단 응답', '필요 자료', '자료 예시', '확인할 부서 (예시)', '다음 조치', '담당자 (작성)', '기한 (작성)', '진행 메모 (작성)'],
    ...QUESTIONS.map(q => [q.id, CATEGORY_LABELS[q.category], q.priority, q.text, ANSWER_LABELS[draft.answers[q.id]] || '미응답', q.evidence, QUESTION_GUIDANCE[q.id].example, QUESTION_GUIDANCE[q.id].owner, needsPreparation(draft.answers[q.id]) ? QUESTION_GUIDANCE[q.id].action : '응답 기준으로 준비됨 · 제출 전 자료의 최신성·범위를 검토하세요.', '', '', '']),
  ];
  return '\uFEFF' + rows.map(row => row.map(csvCell).join(',')).join('\r\n');
}
