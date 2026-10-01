export type CbamLeadSource = 'DIRECT' | 'NAVIGATOR';
export type CbamLeadStage = 'NAVIGATOR' | 'APPLICATION_STARTED' | 'APPLICATION_SUBMITTED' | 'QUOTE' | 'CONTRACT';
export const REGULATORY_DATE = '2026-09-29';
export const PRIVACY_VERSION = '2026-09-29';
export const CN_NOTICE = '본 결과는 CBAM 대상 여부의 사전 확인을 지원하기 위한 정보입니다. 최종 CN 분류는 실제 통관정보 및 EU 관세분류를 기준으로 확인해야 합니다.';
export const READINESS_NOTICE = '본 진단은 검증 준비상태를 확인하기 위한 자가진단이며 LRQA의 공식 검증결과 또는 검증의견을 의미하지 않습니다.';
export const CATEGORY_LABELS = { scope: '대상 및 경계', monitoring: '모니터링', production: '생산 및 데이터 귀속', precursors: '전구물질', dataManagement: '데이터 관리', verification: '검증 준비' };
export type ReadinessCategory = keyof typeof CATEGORY_LABELS;
export type ReadinessAnswer = 'ready' | 'partial' | 'missing';
export type EvidenceStatus = 'ready' | 'partial' | 'missing' | 'not_applicable';
export type NavigatorEvent = typeof EVENTS[number];
export const EVENTS = ['NAVIGATOR_VIEW', 'CN_SEARCH', 'CN_RESULT_VIEW', 'APPLICABILITY_START', 'APPLICABILITY_COMPLETE', 'PRODUCT_MAP_VIEW', 'READINESS_START', 'READINESS_COMPLETE', 'EVIDENCE_VIEW', 'LEAD_FORM_OPEN', 'APPLICATION_STARTED', 'APPLICATION_SUBMITTED'] as const;
export type CbamNavigatorData = {
  sessionId: string;
  productName?: string;
  searchedCnCodes?: string[];
  readinessScore?: number;
  readinessCategories?: Partial<Record<ReadinessCategory, number>>;
  readinessAnswers?: Record<string, ReadinessAnswer>;
  gapCodes?: string[];
  evidenceStatus?: Record<string, EvidenceStatus>;
  startedAt?: string;
  completedAt?: string;
};
export const QUESTIONS: { id: string; category: ReadinessCategory; text: string; evidence: string; priority: '중요' | '보완 필요' | '확인 권장' }[] = [
  { id: 'S1', category: 'scope', text: '제품별 CN 코드와 품목군을 확인했나요?', evidence: 'CN 코드 목록', priority: '중요' },
  { id: 'S2', category: 'scope', text: '검증대상 사업장과 생산공정 경계를 정리했나요?', evidence: '사업장 정보·생산공정도', priority: '중요' },
  { id: 'S3', category: 'scope', text: '대상연도와 생산기간을 확인했나요?', evidence: '생산기간 기록', priority: '보완 필요' },
  { id: 'S4', category: 'scope', text: '직접배출량과 해당되는 간접배출량의 범위를 확인했나요?', evidence: '배출원 목록', priority: '중요' },
  { id: 'M1', category: 'monitoring', text: '모니터링 계획의 영어 제출본을 준비했나요?', evidence: '모니터링 계획', priority: '중요' },
  { id: 'M2', category: 'monitoring', text: '연료 사용량과 해당되는 공정배출 자료를 준비했나요?', evidence: '연료·공정배출 데이터', priority: '중요' },
  { id: 'M3', category: 'monitoring', text: '전력 사용량과 필요한 경우 열 흐름 자료를 확보했나요?', evidence: '전력·열 사용 기록', priority: '보완 필요' },
  { id: 'M4', category: 'monitoring', text: '계측기 목록과 교정기록을 관리하나요?', evidence: '계측기 목록·교정자료', priority: '보완 필요' },
  { id: 'P1', category: 'production', text: '제품별 생산량과 기능 단위를 확인했나요?', evidence: '생산량 기록', priority: '중요' },
  { id: 'P2', category: 'production', text: '생산공정과 생산경로를 구분한 자료가 있나요?', evidence: '생산공정도', priority: '보완 필요' },
  { id: 'P3', category: 'production', text: '배출량의 제품 귀속 근거를 설명할 수 있나요?', evidence: '데이터 귀속 근거', priority: '중요' },
  { id: 'P4', category: 'production', text: '공동생산품·공정 간 이동자료 또는 해당 없음의 근거가 있나요?', evidence: '공정 간 이동 기록', priority: '보완 필요' },
  { id: 'R1', category: 'precursors', text: '관련 전구물질 목록 또는 해당 없음의 근거가 있나요?', evidence: '관련 전구물질 목록', priority: '중요' },
  { id: 'R2', category: 'precursors', text: '전구물질 사용량·재고 기록 또는 해당 없음의 근거가 있나요?', evidence: '전구물질 사용량', priority: '중요' },
  { id: 'R3', category: 'precursors', text: '공급업체 배출량 자료 또는 해당 없음의 근거가 있나요?', evidence: '전구물질 배출량 자료', priority: '중요' },
  { id: 'R4', category: 'precursors', text: '전구물질의 실제값·기본값 출처 또는 해당 없음의 근거가 있나요?', evidence: '전구물질 데이터 출처', priority: '보완 필요' },
  { id: 'D1', category: 'dataManagement', text: '원자료부터 보고값까지 데이터 흐름을 추적할 수 있나요?', evidence: '데이터 흐름도', priority: '중요' },
  { id: 'D2', category: 'dataManagement', text: '작성자와 검토자의 역할을 정했나요?', evidence: '담당자 역할표', priority: '보완 필요' },
  { id: 'D3', category: 'dataManagement', text: '계산파일 변경이력과 내부 검토자료가 있나요?', evidence: '변경이력·내부 검토자료', priority: '보완 필요' },
  { id: 'D4', category: 'dataManagement', text: '자료 보관·접근권한·백업 절차가 있나요?', evidence: '자료 관리절차', priority: '확인 권장' },
  { id: 'V1', category: 'verification', text: '배출량 보고서의 영어 제출본을 준비했나요?', evidence: '배출량 보고서', priority: '중요' },
  { id: 'V2', category: 'verification', text: '보고값을 증빙자료와 대조했나요?', evidence: '보고값 대조 기록', priority: '중요' },
  { id: 'V3', category: 'verification', text: '검증 질의에 응답할 담당자를 지정했나요?', evidence: '검증 연락체계', priority: '확인 권장' },
  { id: 'V4', category: 'verification', text: '자료제출과 현장 확인 일정을 검토했나요?', evidence: '검증 준비 일정', priority: '확인 권장' },
];
export function scoreReadiness(answers: Record<string, ReadinessAnswer>) {
  const answered = QUESTIONS.filter(q => ['ready', 'partial', 'missing'].includes(answers[q.id]));
  const score = (items: typeof QUESTIONS) => Math.round(items.reduce((sum, q) => sum + (answers[q.id] === 'ready' ? 1 : answers[q.id] === 'partial' ? 0.5 : 0), 0) / items.length * 100);
  return {
    complete: answered.length === QUESTIONS.length,
    answered: answered.length,
    readinessScore: score(QUESTIONS),
    readinessCategories: Object.fromEntries(Object.keys(CATEGORY_LABELS).map(key => [key, score(QUESTIONS.filter(q => q.category === key))])) as Record<ReadinessCategory, number>,
    gapCodes: QUESTIONS.filter(q => answers[q.id] !== 'ready').map(q => q.id),
  };
}
