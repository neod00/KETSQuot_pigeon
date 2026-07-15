import type { ReactNode } from 'react';
import type { IsoApplication } from '@/lib/isoTypes';
import styles from './IsoApplicationFormReplica.module.css';

type Fields = Record<string, string>;

const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ');
const isYes = (value: string) => ['yes', 'true', '1', '예', '동의', '신청'].includes(normalize(value));
const isNo = (value: string) => ['no', 'false', '0', '아니요', '미동의'].includes(normalize(value));
const includesChoice = (value: string, choices: string[]) => {
  const source = normalize(value).replace(/[_-]/g, ' ');
  return choices.some((choice) => source.includes(normalize(choice).replace(/[_-]/g, ' ')));
};

function Line({ label, value, size = 'wide', required = false }: { label: string; value: string; size?: 'wide' | 'medium' | 'short'; required?: boolean }) {
  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}{required && <span className={styles.required}> *</span>}</span>
      <span className={`${styles.line} ${styles[size]}`}>{value}</span>
    </div>
  );
}

function Pair({ children }: { children: ReactNode }) {
  return <div className={styles.pair}>{children}</div>;
}

function TextAnswer({ prompt, value, rows = 3 }: { prompt: string; value: string; rows?: number }) {
  return (
    <div className={styles.fullRow}>
      <p className={styles.prompt}>{prompt}</p>
      <div className={styles.textarea} style={{ minHeight: `${Math.max(54, rows * 20)}px` }}>{value}</div>
    </div>
  );
}

function Tick({ checked }: { checked: boolean }) {
  return <span className={`${styles.tick} ${checked ? styles.checked : ''}`}>{checked ? '✓' : ''}</span>;
}

function Choice({ label, checked }: { label: string; checked: boolean }) {
  return <span className={styles.choice}><Tick checked={checked} />{label}</span>;
}

function YesNo({ prompt, value }: { prompt: string; value: string }) {
  return (
    <div className={styles.question}>
      <span>{prompt}</span>
      <span className={styles.yesNo}><Choice label="예" checked={isYes(value)} /><Choice label="아니요" checked={isNo(value)} /></span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <section className={styles.section}><h3 className={styles.sectionTitle}>{title}</h3>{children}</section>;
}

function Footer({ page }: { page: number }) {
  return <footer className={styles.footer}><strong>LRQA</strong><span>인증 심사 신청서 |{page}</span></footer>;
}

function Page({ children }: { children: ReactNode }) {
  return <div className={styles.page}>{children}</div>;
}

export default function IsoApplicationFormReplica({ application }: { application: IsoApplication }) {
  const fields: Fields = application.sourceFields || {};
  const get = (...keys: string[]) => {
    for (const key of keys) {
      const value = fields[key];
      if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
    }
    return '';
  };
  const standardSource = [get('ISO표준', 'ISO 표준', 'isoStandards'), ...application.standards].join(', ');
  const awareness = get('LRQA인지경로', 'howKnowLrqa');
  const documents = get('첨부문서', 'attachedDocuments');
  const desiredDate = [get('희망년도', 'desiredAuditYear'), get('희망월', 'desiredAuditMonth')].filter(Boolean).join('-') || application.desiredAuditDate;
  const siteList = get('사업장목록', 'siteList');

  const awarenessItems = [
    ['광고/홍보', ['advertising', '광고']], ['이메일', ['email', '이메일']], ['소셜 미디어', ['social media', '소셜']],
    ['웨비나', ['webinar', '웨비나']], ['고객 방문', ['customer visit', '고객 방문']], ['이벤트', ['event', '이벤트']],
    ['텔레마케팅', ['telemarketing', '텔레마케팅']], ['자체 평가', ['self assessment', '자체 평가']], ['우편물', ['mail', '우편']],
    ['추천', ['recommendation', 'referral', '추천']], ['도구', ['tools', '도구']], ['웹사이트', ['website', '웹사이트']], ['기타', ['other', '기타']],
  ] as const;

  return (
    <div className={styles.viewport} aria-label="고객 제출 신청서 원본 디자인 읽기 전용 보기">
      <div className={styles.paper}>
        <div className={styles.language}><select aria-label="신청서 언어" value="ko" disabled><option value="ko">KR 한국어</option></select></div>
        <Page>
          <header className={styles.header}>
            <h1>인증 심사 신청서</h1>
            <h2>표준 ISO 9001, 14001, 45001</h2>
          </header>
          <p className={styles.intro}>LRQA의 무료 견적을 받고 싶다면 다음 양식을 완전히 작성하여 제출해 주시기 바랍니다.:</p>
          <Section title="회사 정보">
            <Line label="법인명 (국문/영문)" value={get('법인명(국문)', 'companyNameKo') || get('법인명(영문)', 'companyNameEn') || application.companyName} required />
            <Line label="상호명 (해당되는 경우)" value={get('상호명', 'tradeName')} />
            <Line label="본사 주소" value={get('본사주소', 'headOfficeAddress') || application.siteAddress} required />
            <Pair><Line label="시" value={get('도시', 'city')} size="medium" /><Line label="행정 구역(도)" value={get('행정구역', 'province')} size="medium" /></Pair>
            <Pair><Line label="우편 번호" value={get('우편번호', 'postalCode')} size="medium" /><Line label="국가" value={get('국가', 'country')} size="medium" /></Pair>
            <Pair><Line label="대표 전화 번호" value={get('대표전화번호', 'mainPhone')} size="medium" /><Line label="대표 이메일 주소" value={get('대표이메일', 'mainEmail')} /></Pair>            <YesNo prompt={'현재 위 양식에 기재된 주소와 본인의 실제 우편 주소가 다를 경우, "예"를 체크하고 아래를 입력해주세요.'} value={get('우편주소상이여부', 'address_different')} />
            <Pair><Line label="웹사이트" value={get('웹사이트', 'website')} /><Line label="사업자 등록번호" value={get('사업자등록번호', 'businessRegNumber')} size="medium" /></Pair>
            <Pair><Line label="법인 등록 번호" value={get('법인등록번호', 'corporateRegNumber')} size="medium" /><Line label="과세당국" value={get('과세당국', 'taxAuthority')} size="medium" /></Pair>
            <YesNo prompt="귀사는 그룹 계열사에 속해 있거나 모회사가 소유하고 있습니까?" value={get('모회사/계열사여부', 'groupAffiliation')} />
            <YesNo prompt="두 개 이상의 사이트를 운영하는 경우 경영시스템이 중앙에서 관리되고 있습니까?" value={get('중앙관리시스템여부', 'centralSystem')} />
            <Line label="본 인증에 포함되는 사업장은 몇개 인가요?" value={get('인증포함사업장수', 'siteCount') || String(application.siteCount || '')} size="short" required />
            <p className={styles.prompt}>다음을 포함한 사업장 목록을 첨부하세요.</p>
            <table className={styles.table}><thead><tr><th>주소</th><th>활동</th><th>직원</th></tr></thead><tbody><tr><td colSpan={3}>{siteList}</td></tr><tr><td>&nbsp;</td><td></td><td></td></tr><tr><td>&nbsp;</td><td></td><td></td></tr></tbody></table>
          </Section>
          <Footer page={1} />
        </Page>

        <Page>
          <Section title="연락처 세부 정보">
            <Pair><Line label="담당자 성함 (직급/직책 포함)" value={get('담당자명', 'contactName')} /><Line label="부서" value={get('부서', 'department')} size="medium" /></Pair>
            <Pair><Line label="이메일 주소" value={get('담당자이메일', 'contactEmail')} /><Line label="전화 번호" value={get('담당자전화', 'contactPhone')} size="medium" /></Pair>
            <Line label="휴대폰 번호" value={get('휴대폰번호', 'mobilePhone')} size="medium" />
          </Section>
          <Section title="컨설턴트 정보">
            <p className={styles.prompt}>경영시스템 준비를 위해 컨설턴트의 자문을 받는 경우 세부정보를 입력하세요.</p>
            <Pair><Line label="컨설턴트 이름" value={get('컨설턴트명', 'consultantName')} /><Line label="컨설팅 기관" value={get('컨설팅기관', 'consultingOrg')} /></Pair>
          </Section>
          <p className={styles.prompt}>LRQA에 대해 어떻게 알게 되었습니까?</p>
          <Section title="LRQA 인지 경로">
            <div className={styles.choiceGrid}>{awarenessItems.map(([label, aliases]) => <Choice key={label} label={label} checked={includesChoice(awareness, [...aliases])} />)}</div>
          </Section>
          <YesNo prompt={'향후 LRQA에서 신청 규격 관련한 이벤트에 대한 세부 정보를 받고 싶으시다면 "예"를 눌러주세요.'} value={get('향후이벤트정보수신', 'futureEvents')} />
          <Section title="평가 요구 사항">
            <div className={styles.standardChoices}>
              <Choice label="ISO 9001 - 품질" checked={includesChoice(standardSource, ['iso 9001', 'iso9001'])} />
              <Choice label="ISO 14001 - 환경" checked={includesChoice(standardSource, ['iso 14001', 'iso14001'])} />
              <Choice label="ISO 45001 - 안전보건" checked={includesChoice(standardSource, ['iso 45001', 'iso45001'])} />
            </div>
            <Line label="기타(인증 규격 작성):" value={get('기타표준', 'otherStandards')} />
            <YesNo prompt="2개 이상 인증 신청시 통합심사 진행 여부" value={get('다중표준시스템', 'multiStandardSystem', '표준적용여부')} />
            <Line label="희망하는 심사일정을 선택해주세요." value={desiredDate} size="medium" required />
          </Section>
          <Footer page={2} />
        </Page>

        <Page>
          <Section title="인증 범위 확인"><TextAnswer prompt="인증서에 활동 내용을 어떻게 기재하고 싶으십니까?" value={get('활동내용기재', '인증범위', 'activityDescription', 'certificationScope') || application.scope} rows={4} /></Section>
          <Section title="법적 의무">
            <TextAnswer prompt="조직이 운영하기 위해 필요한 사업장 허가, 라이선스 또는 이와 유사한 규제 기관의 승인이 있습니까?" value={get('규제기관승인여부', 'regulatoryApproval')} />
            <YesNo prompt="법적 의무와 관련하여 해결되지 않은 미해결 문제가 있습니까?" value={get('법적의무미해결문제', 'legalIssues')} />
          </Section>
          <Section title="기존 인증">
            <YesNo prompt="현재 기존 경영시스템 인증을 보유하고 있습니까? 그렇다면 아래에 기재해 주세요:" value={get('기존인증보유여부', 'existingCertification')} />
            <table className={styles.table}><thead><tr><th>표준</th><th>인증 기관</th><th>인증 만료일</th></tr></thead><tbody><tr><td>{get('기존표준', 'existingStandard')}</td><td>{get('기존인증기관', 'existingCertBody')}</td><td>{get('인증만료일', 'certExpiryDate')}</td></tr><tr><td>&nbsp;</td><td></td><td></td></tr><tr><td>&nbsp;</td><td></td><td></td></tr></tbody></table>
          </Section>
          <Footer page={3} />
        </Page>

        <Page>
          <Section title="직원 현황">
            <Line label="총 직원 수" value={get('총직원수', 'totalEmployees') || String(application.employeeCount || '')} size="short" required />
            <Line label="정규직 직원 수" value={get('정규직수', 'permanentEmployees')} size="short" />
            <Line label="비정규직 직원 수" value={get('비정규직수', 'temporaryEmployees')} size="short" />
            <Line label="협력업체 직원 수" value={get('하청업체직원수', 'contractorEmployees')} size="short" />
            <Line label="임시직 직원 수" value={get('임시직수', 'casualEmployees')} size="short" />
            <YesNo prompt="다수 사업장인 경우 사업장별로 직원 수를 표기했습니까?" value={get('다중사업장직원현황', 'multiSiteEmployees')} />
            <TextAnswer prompt="직원 수 또는 사업장이 계절에 따라 변동된다면 설명하세요." value={get('계절변동설명', 'seasonalVariation')} />
            <YesNo prompt="경영시스템 범위에 포함된 활동이 사내외주처리 되는 활동이 있습니까?" value={get('외주프로세스여부', 'outsourcing')} />
            <TextAnswer prompt="만약 예라면 사내외주활동의 세부사항 및 인원을 기술하여 주십시오." value={get('작업성격설명', 'workDescription')} />
            <YesNo prompt="반복적인 작업을 수행하는 직원 그룹이 있습니까?" value={get('반복작업그룹여부', 'repeatGroup')} />
            <p className={styles.prompt}>그렇다면 아래 개요에 작업의 성격과 작업당 인원을 표시해 주세요.</p>
            <table className={styles.table}><thead><tr><th>작업의 성격과 설명</th><th>총 참여 직원 수</th></tr></thead><tbody><tr><td>{get('작업성격설명', 'workDescription')}</td><td></td></tr><tr><td>&nbsp;</td><td></td></tr><tr><td>&nbsp;</td><td></td></tr></tbody></table>
            <YesNo prompt="오전 9시부터 오후 6시까지 시간(일 근무 8시간) 외에만 진행되는 승인에 중요한 활동이 있습니까?" value={get('시간외승인활동여부', 'overtimeActivities')} />
          </Section>
          <Footer page={4} />
        </Page>

        <Page>
          <p className={styles.prompt}>조직의 교대 근무 방식에 대해 전반적으로 설명하며, 각 교대 근무 방식에 해당하는 근무 시간 또는 인원을 표시하세요. 아래 항목에 적합하지 않은 경우 교대 근무 방식에 대한 별도의 설명을 추가하세요.</p>
          <table className={styles.table}><thead><tr><th>교대 근무 횟수</th><th>교대 근무 시간</th><th>총 직원 수</th></tr></thead><tbody>
            {[1, 2, 3, 4].map((number) => <tr key={number}><td>교대조 {number}</td><td>{number === 1 ? get('교대근무시간', 'shiftHours') : ''}</td><td>{get(`교대조${number}`, `shift${number}`) || (number === 1 ? get('교대총직원수', 'shiftTotalEmployees') : '')}</td></tr>)}
          </tbody></table>
          <YesNo prompt="임시 사업장이 있나요?" value={get('임시사업장여부', 'temporarySite')} />
          <YesNo prompt="고객사 위치에서 서비스를 제공하나요, 제공한다면 어떤 유형의 서비스를 제공합니까?" value={get('고객사위치서비스', 'customerLocationService')} />
          <Section title="인증 변경">
            <YesNo prompt="기존 인증을 LRQA로 전환하기 위해 견적을 요청하십니까?" value={get('기존인증LRQA이전요청', 'transferToLrqa')} />
            <YesNo prompt="현재 보유한 인증이 인정기관(KAB, UKAS, ANAB 등)에서 인정받은 인증입니까?" value={get('공식인정인증여부', 'officialAccreditation')} />
            <TextAnswer prompt="현재 인증 기관에서 LRQA로 전환하려는 이유를 알려주세요." value={get('인증기관이전사유', 'transferReason')} />
            <Line label="LRQA 마지막 방문 일자" value={get('LRQA마지막방문일자', 'lastLrqaVisit')} size="medium" />
            <p className={styles.prompt}>아래 문서를 첨부하세요.</p>
            <div className={styles.documents}>
              <Choice label="회사의 현재 인증서(모든 사이트 포함)" checked={includesChoice(documents, ['current cert', '인증서'])} />
              <Choice label="미해결된 부적합 상태 관련 문서" checked={includesChoice(documents, ['nonconformity', '부적합'])} />
              <Choice label="최근 심사보고서" checked={includesChoice(documents, ['last visit', 'audit report', '심사보고서'])} />
              <Choice label="기타 다른 관련 문서" checked={includesChoice(documents, ['other', '기타'])} />
            </div>
            <TextAnswer prompt="유효한 인증을 위한 심사 프로그램 또는 첨부 문서 참고사항" value={get('첨부문서', 'attachmentNote')} rows={2} />
            <YesNo prompt="LRQA가 현재 인증 기관에 연락하는 것에 동의하십니까?" value={get('LRQA인증기관연락동의', 'lrqaContactConsent')} />
          </Section>
          <Footer page={5} />
        </Page>

        <Page>
          <Section title="ISO 14001 인증을 신청한 경우에만 작성">
            <TextAnswer prompt="조직이 운영하는 사업 분야(예: 화학 또는 엔지니어링 분야 등)와 사업장 위치(공단 지역, 상업 지역 등)를 간략하게 설명하세요. 또한 조직이 보유하고 있는 환경 관련 법적 허가가 있는지 여부와 종류를 기재하세요." value={get('ISO14001사업분야', 'iso14001Business')} rows={5} />
            <TextAnswer prompt="주요 프로세스를 나열하고 각 프로세스와 관련된 주요 환경 위험을 간략하게 설명하세요." value={get('ISO14001환경위험', 'iso14001Risks')} rows={5} />
          </Section>
          <Section title="ISO 45001 인증을 신청한 경우에만 작성">
            <TextAnswer prompt="조직이 운영하는 사업 분야(예: 화학 또는 엔지니어링 분야 등)와 현장 위치(공단 지역, 상업 지역 등)를 간략하게 설명하세요." value={get('ISO45001사업분야', 'iso45001Business')} rows={4} />
            <TextAnswer prompt="주요 프로세스를 나열하고 주요 유해 및 위험 요소와 해당 법적 요건/허가 사항을 간략하게 설명하세요." value={get('ISO45001유해위험', 'iso45001Hazards')} rows={5} />
          </Section>
          <Footer page={6} />
        </Page>

        <Page>
          <Section title="추가 정보">
            <p className={styles.prompt}>아래 정보는 인증에 포함될 활동을 더 잘 정의하고 견적을 올바르게 작성하기 위해 필요합니다.</p>
            <YesNo prompt="원격 심사가 가능하다면 원격 심사를 받으시겠습니까?" value={get('원격심사여부', 'remoteAudit')} />
            <YesNo prompt="예비 심사에 대한 견적을 받으시겠습니까?" value={get('예비심사견적수신', 'preAuditQuote')} />
            <YesNo prompt="신청한 인증과 관련된 교육 과정에 대한 정보를 받으시겠습니까?" value={get('교육과정정보수신', 'trainingInfo')} />
            <TextAnswer prompt="추가 참고해야 할 정보를 입력해 주세요." value={get('추가참고정보', 'additionalInfo')} rows={4} />
          </Section>
          <Section title="데이터 수집 및 보존">
            <p className={styles.legalCopy}>적용 가능한 규정에 따라, 데이터 수집의 목적은 필요한 견적을 작성하기 위한 것입니다. 신청자는 자신의 책임 하에 데이터를 제공하지 않을 권리가 있지만, 이는 제안 내용의 정확성에 영향을 미칠 수 있음을 알려드립니다.</p>
            <p className={styles.legalCopy}>작성된 데이터는 전자 아카이브에 저장되고, 가장 엄격한 기밀로 취급되며, 법률에 의해 요구되거나 인증과 관련된 활동을 수행하기 위한 목적으로만 LRQA가 자체적으로 업무를 위임한 제3자와의 거래에 대해서만 보고됩니다.</p>
            <YesNo prompt="LRQA의 데이터 프로세스에 대해 동의하십니까?" value={get('데이터처리동의', 'dataProcessConsent')} />
            <YesNo prompt="마케팅 정보 수신에 동의하십니까?" value={get('마케팅동의', 'marketingConsent')} />
            <div className={styles.signature}><Line label="서명" value={get('서명', 'signature')} size="medium" required /><Line label="날짜" value={get('서명날짜', 'signatureDate')} size="medium" required /></div>
          </Section>
          <Footer page={7} />
        </Page>

        <Page>
          <section className={styles.contact}>
            <div className={styles.contactLeft}><h3>문의하기</h3><div className={styles.contactLine}>로이드인증원(LRQA Korea) 사업개발본부</div><div className={styles.contactLine}>T. +82 2 736 6231</div><div className={styles.contactLine}>E. zzzkorea-sales@lrqa.com</div><p>모든 정보는 정확하고 최신의 상태를 유지하기 위해 최선을 다했으나, 일부 내용의 부정확성이나 변경 사항에 대해 LRQA는 책임을 지지 않습니다. © LRQA Group Limited 2025</p></div>
            <div className={styles.contactRight}><span>YOUR FUTURE. OUR FOCUS.</span><strong>LRQA</strong></div>
          </section>
          <Footer page={8} />
        </Page>
      </div>
    </div>
  );
}