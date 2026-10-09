import Link from 'next/link';
import { GUIDE_STEPS } from '@/lib/user-guide';

export default function UserGuide({ from }: { from?: string }) {
  const previous = GUIDE_STEPS.find(step => step.id === (from === 'evidence' ? 'readiness' : from));
  return <div className="page user-guide" id="guide-top">
    <header className="guide-heading">
      <p className="eyebrow">업체 담당자를 위한 안내</p>
      <h1>CBAM Navigator<br />사용 가이드</h1>
      <p>우리 제품 확인부터 자료 준비, 검증 신청까지.<br />각 단계에서 무엇을 입력하고 다음에 무엇을 할지 안내합니다.</p>
      <div className="guide-actions">
        {previous ? <Link className="button" href={`/${previous.id}`}>{previous.title} 화면으로 돌아가기 →</Link> : <Link className="button" href="/cn-search">제품·CN 코드 검색 시작 →</Link>}
        <a className="button secondary" href="#guide-steps">단계별 사용법 보기 ↓</a>
      </div>
    </header>

    <nav className="guide-toc" aria-label="사용 가이드 목차">
      <a href="#guide-start">시작 전 준비</a><a href="#guide-steps">단계별 사용법</a><a href="#guide-faq">막힐 때 확인</a><a href="#guide-terms">용어 풀이</a><a href="#guide-storage">저장·개인정보</a>
    </nav>

    <section id="guide-start" className="guide-section" aria-labelledby="guide-start-title">
      <p className="eyebrow">01 · 시작 전 준비</p>
      <h2 id="guide-start-title">처음에는 제품 정보만 있어도 됩니다</h2>
      <p className="muted">모르는 값은 추측하지 말고 확인할 항목으로 남기세요. 필요한 자료를 담당 부서에 요청하면서 진행할 수 있습니다.</p>
      <div className="guide-prep-grid">
        <article><span className="guide-tag">먼저 준비</span><h3>제품명·재질·용도</h3><p>예: 스테인리스 볼트, 체결용.<br />CN 코드를 모르면 제품명으로 시작하세요.</p><small>확인할 곳: 영업·무역·통관 담당자</small></article>
        <article><span className="guide-tag">거래 확인 시</span><h3>EU 거래·수입자 정보</h3><p>EU 반입 여부, 관세 원산지, 수입자의 연간 대상 수입량을 확인하세요.</p><small>확인할 곳: EU 수입자·고객사</small></article>
        <article><span className="guide-tag">진단 진행 시</span><h3>사업장·공정·자료 현황</h3><p>사업장과 생산공정, 에너지·배출량 자료가 어디에 있는지 확인하세요.</p><small>확인할 곳: 생산·환경·구매 담당자</small></article>
      </div>
      <div className="guide-callout"><strong>먼저 체험해 보고 싶다면</strong><p>제품 검색에서 ‘스테인리스 볼트’를 입력하고 후보의 재질·용도를 비교해 보세요. 이후 거래 정보는 실제 확인한 값으로 작성하세요.</p></div>
    </section>

    <section id="guide-steps" className="guide-section" aria-labelledby="guide-steps-title">
      <p className="eyebrow">02 · 단계별 사용법</p>
      <h2 id="guide-steps-title">확인 → 준비 → 신청, 다섯 단계로 진행하세요</h2>
      <p className="muted">처음이라면 순서대로, 이미 진행 중이라면 필요한 단계부터 보세요.</p>
      <nav className="guide-step-nav" aria-label="단계별 설명 바로가기">{GUIDE_STEPS.map((step, index) => <a key={step.id} href={`#${step.id}`}><span>0{index + 1}</span>{step.title}</a>)}</nav>
      <div className="guide-step-list">{GUIDE_STEPS.map((step, index) => <article key={step.id} id={step.id} className="guide-step" aria-labelledby={`guide-title-${step.id}`}>
        <div className="guide-step-heading"><span className="guide-step-number" aria-hidden="true">0{index + 1}</span><div><p>{step.title}</p><h3 id={`guide-title-${step.id}`}>{step.goal}</h3></div></div>
        <dl className="guide-instructions"><div><dt>준비할 정보</dt><dd>{step.prepare}</dd></div><div><dt>화면에서 할 일</dt><dd>{step.action}</dd></div><div><dt>결과를 본 다음</dt><dd>{step.result}</dd></div></dl>
        <p className="guide-tip"><strong>꼭 확인하세요</strong>{step.tip}</p>
        {step.id === 'applicability' && <details className="guide-detail"><summary>예시: CN ‘72’와 수입량 ‘20,000t’을 넣었다면?</summary><p>‘72’는 철강의 넓은 분류여서 실제 제품을 특정하기 어렵습니다. 수입량이 많아도 제품 분류를 먼저 확인해야 합니다. EU 수입자·통관 담당자에게 실제 8자리 CN 코드를 확인하고 ‘CN 코드 확인·수정’을 눌러 입력한 뒤 다시 판단하세요.</p><p>20,000t이 우리 회사의 생산량·수출량 또는 탄소배출량이라면 해당 칸의 입력 기준과 다릅니다. 수입자별 연간 대상 수입량 합계를 확인하세요.</p></details>}
        <div className="guide-step-bottom"><Link className="button secondary small" href={`/${step.id}`}>{step.title} 화면 열기 →</Link><a href="#guide-steps">단계 목록 ↑</a></div>
      </article>)}</div>
    </section>

    <section id="guide-faq" className="guide-section" aria-labelledby="guide-faq-title">
      <p className="eyebrow">03 · 막힐 때 확인</p><h2 id="guide-faq-title">자주 헷갈리는 상황</h2>
      <div className="guide-faq">
        <details><summary>‘추가 정보 확인 필요’가 나오면 멈춰야 하나요?</summary><p>결과 카드에 표시된 항목부터 확인하세요. ‘확인·수정’ 버튼으로 이동해 값을 고친 뒤 ‘적용 가능성 확인’을 다시 누릅니다. 아직 모르는 정보는 EU 수입자나 담당 부서에 요청하세요. 다른 단계에서 자료 준비를 이어갈 수 있지만, 이 결과가 적용 여부를 확정한 것은 아닙니다.</p><Link href="/applicability">적용 가능성 화면 열기 →</Link></details>
        <details><summary>수입량을 모르는데 0을 입력해도 되나요?</summary><p>모르는 경우에는 비워두세요. 0은 실제 수입량이 0이라는 뜻입니다. 우리 회사의 수출량만으로 채우지 말고 EU 수입자의 모든 공급국·공급업체 대상 수입량 합계를 확인하세요.</p></details>
        <details><summary>CN 코드 검색 결과가 없거나 ‘유효성 미확인’이라고 나와요.</summary><p>검색 결과가 없다고 비대상이 확정되는 것은 아닙니다. 제품명·재질·형태를 구체적으로 입력하고, 실제 EU 통관 코드의 유효성은 EU 수입자·통관 담당자 또는 검색 화면의 EU TARIC 링크에서 확인하세요.</p></details>
        <details><summary>진단 후 준비할 자료는 어디에서 보나요?</summary><p>검증 준비도 결과 화면의 ‘준비할 자료와 다음 조치’에서 볼 수 있습니다. 진단에서 일부 준비·미준비·미응답으로 남은 항목을 먼저 보여줍니다. ‘준비됨 항목까지 전체 자료 보기’를 선택하면 전체 목록을 볼 수 있습니다. 담당자·기한·자료 위치는 협조요청용 Excel에 정리하세요.</p><Link href="/readiness?view=results#required-materials">진단 결과와 준비할 자료 보기 →</Link></details>
        <details><summary>PDF·Excel을 받으면 상담이나 검증 신청도 접수되나요?</summary><p>문서 다운로드 시 입력한 연락처와 진단정보는 진단 접수 관리용으로 저장됩니다. 상담을 원하면 ‘진단 결과 상담 요청’을 별도로 누르세요. 검증을 신청하려면 ‘검증 신청’으로 이동하여 신청서 제출을 완료해야 합니다.</p><p>Excel에서 수정한 담당자·기한·진행상태는 앱으로 자동 반영되지 않습니다.</p></details>
        <details><summary>법적 근거 링크가 열리지 않아요.</summary><p>공식 규정 사이트의 일시적인 장애일 수 있습니다. 결과에 표시된 규정 번호·조항을 확인하고 EU 집행위원회 공식 안내에서 해당 규정을 찾아보세요.</p><a href="https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism/cbam-legislation-and-guidance_en" target="_blank" rel="noopener noreferrer">EU 집행위원회 공식 규정 안내 ↗</a></details>
      </div>
    </section>

    <section id="guide-terms" className="guide-section" aria-labelledby="guide-terms-title">
      <p className="eyebrow">04 · 용어 풀이</p><h2 id="guide-terms-title">화면에 나오는 말, 이렇게 이해하세요</h2>
      <dl className="guide-glossary">
        <div><dt>CN 코드</dt><dd>EU에서 상품을 분류하는 8자리 코드입니다. 제품 이름만 같아도 재질·형태·용도에 따라 달라질 수 있습니다.</dd></div>
        <div><dt>관세 원산지</dt><dd>관세상 제품의 원산지입니다. 물건을 발송한 국가와 다를 수 있으므로 통관 담당자에게 확인하세요.</dd></div>
        <div><dt>제3국 제조사업자</dt><dd>EU 밖에서 대상 제품을 생산하는 사업자입니다. 한국 제조업체가 거래 정보를 작성할 때 확인할 역할입니다.</dd></div>
        <div><dt>전구물질</dt><dd>대상 제품 생산에 투입되고 배출량 산정에 관련되는 원재료·중간재입니다. 제품·공정 화면에서 관련 항목을 확인하세요.</dd></div>
        <div><dt>증빙자료</dt><dd>생산량·에너지 사용량·배출량 등의 입력값을 뒷받침하는 기록입니다. 계량 기록, 구매 자료, 산정 파일 등이 해당합니다.</dd></div>
        <div><dt>t / tCO₂e</dt><dd>t는 제품 무게의 단위인 톤, tCO₂e는 온실가스 배출량 단위입니다. 연간 수입량 칸에는 제품의 순중량(t)을 입력하세요.</dd></div>
      </dl>
    </section>

    <section id="guide-storage" className="guide-section" aria-labelledby="guide-storage-title">
      <p className="eyebrow">05 · 저장·개인정보</p><h2 id="guide-storage-title">작업을 이어가고 결과를 공유하는 방법</h2>
      <ul className="guide-storage-list">
        <li><strong>같은 탭에서 이어가기</strong><p>제품·거래 정보와 준비도 응답은 현재 탭에 자동 저장되어 새로고침 후 복원됩니다. 진단을 완료한 뒤 다시 검증 준비도를 열면 결과 화면을 볼 수 있습니다. 저장 불가 안내가 표시되면 브라우저 저장 기능을 확인하세요.</p></li>
        <li><strong>다음에 다시 방문하기</strong><p>상단의 ‘이 기기에 7일 저장’을 선택하면 마지막 작업 후 7일 동안 같은 기기·브라우저에서 이어갈 수 있습니다. 브라우저 데이터를 삭제하면 복원되지 않으며 다른 기기와 자동 동기화되지 않습니다.</p></li>
        <li><strong>문서 다운로드·상담·신청 전 확인</strong><p>주요 검색·진단은 연락처 없이 이용할 수 있습니다. 문서 다운로드와 상담 요청에는 회사·담당자·연락처 입력 및 동의가 필요하며, 제출한 연락처와 진단정보가 서버에 접수됩니다. 입력한 신청자 정보와 문서·상담 요청 내용은 같은 탭에서 화면을 이동할 때 유지하고 검증 신청서에도 연결합니다. 이 정보는 새로고침하거나 탭을 닫으면 사라지며 ‘이 기기에 7일 저장’ 대상에 포함되지 않습니다. 신청서 동의는 해당 화면에서 직접 선택하세요.</p></li>
      </ul>
      <p className="muted">이 도구는 사전 확인과 준비를 돕습니다. 최종 제품 분류·적용 여부는 실제 거래와 공식 규정을 함께 확인하세요.</p>
      <div className="guide-policy-links"><Link href="/privacy">개인정보 안내 →</Link><Link href="/legal">법적 근거 및 서비스 범위 →</Link></div>
    </section>
    <div className="guide-end"><Link className="button" href={previous ? `/${previous.id}` : '/cn-search'}>{previous ? `${previous.title} 화면으로 돌아가기` : '제품·CN 코드 검색 시작'} →</Link><a href="#guide-top">가이드 맨 위로 ↑</a></div>
  </div>;
}
