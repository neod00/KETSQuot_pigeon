"use client";
import Link from "next/link";
import { ApplicationLink } from "./ApplicationLink";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useNavigator } from "./NavigatorContext";
import {
  CN_NOTICE,
  READINESS_NOTICE,
  REGULATORY_DATE,
  PRIVACY_VERSION,
  QUESTIONS,
  CATEGORY_LABELS,
  scoreReadiness,
  type NavigatorEvent,
  type ReadinessAnswer,
  type EvidenceStatus,
} from "@/shared/cbam-navigator";
import {
  REGULATIONS,
  productStructure,
  assessApplicability,
} from "@/shared/cbam-regulatory";
import { assessCnCode, type CbamCnAssessment } from "@/shared/cbam-cn";
type Privacy = { retention: string; processors: string; contact: string };
const titles: Record<string, [string, string]> = {
  "cn-search": [
    "CN 코드 및 제품 검색",
    "우리 제품이 CBAM 대상인지 먼저 확인하세요.",
  ],
  applicability: [
    "CBAM 적용 가능성 확인",
    "제품의 대상 여부와 실제 거래의 적용조건을 함께 확인합니다.",
  ],
  "product-map": [
    "제품·공정 구조 확인",
    "제품에서 생산공정, 관련 전구물질까지 필요한 정보의 연결을 살펴보세요.",
  ],
  readiness: [
    "검증 준비도 진단",
    "6개 영역의 24개 질문으로 현재 준비상태를 확인하세요.",
  ],
  evidence: [
    "검증 준비자료 확인",
    "진단에서 확인된 미비사항과 연결되는 자료를 준비하세요.",
  ],
  application: [
    "CBAM 검증 신청",
    "지금까지 확인한 정보를 바탕으로 LRQA에 검증을 신청하세요.",
  ],
  privacy: [
    "개인정보 안내",
    "개인정보 입력 없이 주요 진단 기능을 이용할 수 있습니다.",
  ],
  legal: [
    "법적 근거 및 면책",
    "공식 EU 규정과 서비스의 제공 범위를 확인하세요.",
  ],
};
function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
function Note({ children }: { children: ReactNode }) {
  return <div className="notice">{children}</div>;
}
function Next({ href, children }: { href: string; children: ReactNode }) {
  return (
    <div className="next">
      <Link className="button" href={href}>
        {children} <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}
export default function Navigator({
  step,
  privacy = { retention: "", processors: "", contact: "" },
}: {
  step: string;
  privacy?: Privacy;
}) {
  const { ready, error, track } = useNavigator();
  useEffect(() => {
    if (!ready) return;
    const events: Record<string, NavigatorEvent> = {
      home: "NAVIGATOR_VIEW",
      applicability: "APPLICABILITY_START",
      "product-map": "PRODUCT_MAP_VIEW",
      readiness: "READINESS_START",
      evidence: "EVIDENCE_VIEW",
      application: "APPLICATION_STARTED",
    };
    if (events[step]) track(events[step]);
    if (step === "application") track("LEAD_FORM_OPEN");
  }, [step, ready]); // eslint-disable-line react-hooks/exhaustive-deps
  if (step === "home") return <Home />;
  return (
    <div
      className={`page ${["privacy", "legal"].includes(step) ? "narrow" : ""}`}
    >
      <div className="page-heading">
        <p className="eyebrow">LRQA CBAM Navigator</p>
        <h1>{titles[step][0]}</h1>
        <p>{titles[step][1]}</p>
      </div>
      {error && (
        <p role="alert" className="error">
          {error} 페이지를 새로고침하여 다시 연결할 수 있습니다.
        </p>
      )}
      {step === "cn-search" && <Search />}
      {step === "applicability" && <Applicability />}
      {step === "product-map" && <ProductMap />}
      {step === "readiness" && <Readiness />}
      {step === "evidence" && <Evidence />}
      {step === "application" && <Application />}
      {step === "privacy" && <PrivacyNotice privacy={privacy} />}
      {step === "legal" && <Legal />}
    </div>
  );
}
function Home() {
  const { draft, setDraft } = useNavigator(),
    router = useRouter();
  const [query, setQuery] = useState(draft.productName || draft.cnCode);
  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <p className="eyebrow">LRQA Korea · 무료 CBAM 준비지원</p>
          <h1>
            CBAM 대상 확인부터
            <br />
            <em>검증 준비까지</em>
          </h1>
          <p className="hero-description">
            복잡한 규정, 필요한 자료.
            <br />
            우리 제품의 다음 단계를 차근차근 확인하세요.
          </p>
          <form
            className="hero-search"
            onSubmit={(e) => {
              e.preventDefault();
              setDraft(
                /^[\d\s-]+$/.test(query)
                  ? { cnCode: query, productName: "" }
                  : { productName: query, cnCode: "" },
              );
              router.push("/cn-search");
            }}
          >
            <label className="sr-only" htmlFor="home-query">
              제품명 또는 CN 코드
            </label>
            <input
              id="home-query"
              maxLength={200}
              placeholder="제품명 또는 CN 코드를 입력하세요"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button className="button" type="submit">
              CBAM 대상 확인 →
            </button>
          </form>
          <div className="hero-meta">
            <span>개인정보 없이 시작</span>
            <span>공식 EU 규정 기반</span>
            <span>한국어 안내</span>
          </div>
        </div>
        <aside className="hero-map" aria-label="검증 준비 흐름">
          <span className="map-tag">검증을 향한 단계</span>
          {[
            "우리 제품은 대상인가요?",
            "무엇을 준비해야 하나요?",
            "어떤 자료가 부족한가요?",
          ].map((t, i) => (
            <div className="map-step" key={t}>
              <span>0{i + 1}</span>
              <strong>{t}</strong>
              <small>
                {
                  [
                    "CN 코드·적용 가능성",
                    "제품·공정·검증 준비도",
                    "증빙자료·검증 신청",
                  ][i]
                }
              </small>
            </div>
          ))}
          <div className="map-end">
            LRQA와 다음 단계로 <span>↗</span>
          </div>
        </aside>
      </section>
      <section className="home-tools">
        <div className="section-heading">
          <div>
            <p className="eyebrow">필요한 단계부터 시작하세요</p>
            <h2>검증 준비를 위한 6가지 도구</h2>
          </div>
          <p>검색과 진단 결과는 신청서로 이어집니다.</p>
        </div>
        <div className="tool-grid">
          {Object.entries(titles)
            .slice(0, 6)
            .map(([key, [title, desc]], i) => (
              key === "application" ? <ApplicationLink className="tool-card" key={key}><span className="tool-number">0{i + 1}</span><h3>{title}</h3><p>{desc}</p><span className="tool-arrow">↗</span></ApplicationLink> : <Link className="tool-card" href={`/${key}`} key={key}>
                <span className="tool-number">0{i + 1}</span>
                <h3>{title}</h3>
                <p>{desc}</p>
                <span className="tool-arrow" aria-hidden="true">
                  ↗
                </span>
              </Link>
            ))}
        </div>
        <Note>
          {CN_NOTICE} 규정 데이터 기준일: {REGULATORY_DATE}
        </Note>
      </section>
    </>
  );
}
function Search() {
  const { draft, setDraft, ready, track } = useNavigator();
  const [mode, setMode] = useState(draft.productName ? "product" : "codes");
  const [codes, setCodes] = useState(draft.cnCode),
    [name, setName] = useState(draft.productName);
  const [extra, setExtra] = useState({ material: "", form: "", use: "" });
  const [results, setResults] = useState<
    (CbamCnAssessment & {
      category?: string;
      unit?: string;
      candidateTitle?: string;
      missing?: string[];
    })[]
  >([]);
  const [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    if (ready) {
      setCodes(draft.cnCode);
      setName(draft.productName);
    }
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps
  async function search(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setResults([]);
    track("CN_SEARCH");
    try {
      const response = await fetch("/api/public/cbam/cn-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "codes"
            ? { kind: "codes", codes }
            : { kind: "product", productName: name, ...extra },
        ),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      const items =
        result.assessments ||
        (result.candidates || []).map(
          (c: {
            assessment: CbamCnAssessment;
            titleKo: string;
            missingInformation: string[];
          }) => ({
            ...c.assessment,
            candidateTitle: c.titleKo,
            missing: c.missingInformation,
          }),
        );
      setResults(items);
      setMessage(result.message || "코드 범위 확인 결과입니다.");
      setDraft({
        productName: mode === "product" ? name : draft.productName,
        searchedCnCodes: [
          ...new Set([
            ...draft.searchedCnCodes,
            ...items
              .filter((r: CbamCnAssessment) => r.status !== "invalid")
              .map((r: CbamCnAssessment) => r.normalized),
          ]),
        ].slice(-20),
      });
      track("CN_RESULT_VIEW");
    } catch (e) {
      setError(e instanceof Error ? e.message : "검색하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <section className="panel">
        <div className="tabs" role="group" aria-label="검색방법">
          <button
            aria-pressed={mode === "codes"}
            onClick={() => setMode("codes")}
          >
            CN 코드로 검색
          </button>
          <button
            aria-pressed={mode === "product"}
            onClick={() => setMode("product")}
          >
            제품명으로 검색
          </button>
        </div>
        <form onSubmit={search}>
          {mode === "codes" ? (
            <Field
              label="CN 코드"
              hint="4·6·8자리 코드, 공백·하이픈을 사용할 수 있습니다. 여러 코드는 쉼표 또는 줄바꿈으로 구분하세요."
            >
              <input
                required
                maxLength={300}
                value={codes}
                onChange={(e) => setCodes(e.target.value)}
                placeholder="예: 7318 15 90"
              />
            </Field>
          ) : (
            <>
              <Field label="제품명">
                <input
                  required
                  maxLength={200}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="예: 스테인리스 선재"
                />
              </Field>
              <div className="grid three">
                {(
                  [
                    ["material", "재질"],
                    ["form", "형태·규격"],
                    ["use", "용도"],
                  ] as const
                ).map(([key, label]) => (
                  <Field key={key} label={`${label} (선택)`}>
                    <input
                      maxLength={200}
                      value={extra[key]}
                      onChange={(e) =>
                        setExtra({ ...extra, [key]: e.target.value })
                      }
                    />
                  </Field>
                ))}
              </div>
            </>
          )}
          <button className="button" disabled={busy || !ready}>
            {busy
              ? "확인 중…"
              : mode === "codes"
                ? "대상 여부 확인"
                : "CN 코드 후보 찾기"}
          </button>
        </form>
      </section>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div aria-live="polite">
        {message && <p>{message}</p>}
        {results.map((r, i) => (
          <article className="panel result" key={`${r.input}-${i}`}>
            <div className="result-top">
              <span className={`badge ${r.status}`}>{r.statusLabel}</span>
              <strong className="code">{r.displayCode}</strong>
            </div>
            <h2>{r.candidateTitle || r.descriptionKo}</h2>
            <p>{r.explanation}</p>
            <dl className="facts">
              <div>
                <dt>산업분야</dt>
                <dd>{r.sector || "해당 없음 / 확인 필요"}</dd>
              </div>
              <div>
                <dt>품목군</dt>
                <dd>{r.category}</dd>
              </div>
              <div>
                <dt>대상 온실가스</dt>
                <dd>{r.greenhouseGases.join(", ") || "해당 없음"}</dd>
              </div>
              <div>
                <dt>법적 근거</dt>
                <dd>
                  <a href={r.sourceUrl}>
                    {r.matchedRule || "2023/956 Annex I"} ↗
                  </a>
                </dd>
              </div>
            </dl>
            {r.missing?.length ? (
              <p>추가 확인: {r.missing.join(", ")}</p>
            ) : null}
            <small>규정 데이터 기준일 {REGULATORY_DATE}</small>
            {r.status !== "invalid" && (
              <button
                className="button secondary"
                onClick={() =>
                  setDraft({ cnCode: r.normalized, sector: r.sector || "" })
                }
              >
                {draft.cnCode === r.normalized
                  ? "선택됨 ✓"
                  : "이 코드로 계속하기"}
              </button>
            )}
          </article>
        ))}
      </div>
      <Note>{CN_NOTICE}</Note>
      <Next href="/applicability">거래 적용 가능성 확인</Next>
    </>
  );
}
const ORIGINS: Record<string, string> = {
  KR: "대한민국",
  CN: "중국",
  JP: "일본",
  IN: "인도",
  US: "미국",
  CH: "스위스",
  IS: "아이슬란드",
  LI: "리히텐슈타인",
  NO: "노르웨이",
  OTHER: "그 외 국가·지역",
};
function Applicability() {
  const { draft, setDraft, track } = useNavigator();
  const [result, setResult] = useState("");
  const update = (value: Parameters<typeof setDraft>[0]) => {
    setDraft(value);
    setResult("");
  };
  return (
    <>
      <form
        className="panel"
        onSubmit={(e) => {
          e.preventDefault();
          setResult(assessApplicability({ ...draft, origin: draft.country }));
          track("APPLICABILITY_COMPLETE");
        }}
      >
        <div className="grid two">
          <Field label="EU로 반입되는 거래인가요?">
            <select
              required
              value={draft.euExport}
              onChange={(e) => update({ euExport: e.target.value })}
            >
              <option value="">선택하세요</option>
              <option value="yes">예</option>
              <option value="no">아니요</option>
              <option value="unknown">확인 필요</option>
            </select>
          </Field>
          <Field label="검토할 CN 코드">
            <input
              maxLength={20}
              required
              value={draft.cnCode}
              onChange={(e) =>
                update({
                  cnCode: e.target.value,
                  sector: assessCnCode(e.target.value).sector || "",
                })
              }
            />
          </Field>
          <Field label="관세 원산지" hint="발송국과 원산지는 다를 수 있습니다.">
            <select
              required
              value={draft.country}
              onChange={(e) => update({ country: e.target.value })}
            >
              <option value="">선택하세요</option>
              {Object.entries(ORIGINS).map(([v, t]) => (
                <option key={v} value={v}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field label="귀사의 역할">
            <select
              required
              value={draft.importer}
              onChange={(e) => update({ importer: e.target.value })}
            >
              <option value="">선택하세요</option>
              <option value="importer">EU 수입자/신고자</option>
              <option value="operator">제3국 제조사업자</option>
            </select>
          </Field>
          <Field
            label="EU 수입자별 연간 대상 수입량 합계(t)"
            hint="시멘트·비료·철강·알루미늄의 합계. 모르면 비워두세요."
          >
            <input
              type="number"
              min="0"
              step="any"
              value={draft.mass}
              onChange={(e) => update({ mass: e.target.value })}
            />
          </Field>
          <Field label="상품분야">
            <input
              readOnly
              value={assessCnCode(draft.cnCode).sector || "CN 코드 확인 필요"}
            />
          </Field>
        </div>
        <label className="check">
          <input
            type="checkbox"
            checked={draft.allImports}
            onChange={(e) => update({ allImports: e.target.checked })}
          />
          입력량은 해당 수입자의 모든 공급국·공급업체의 연간 대상 수입량을
          합산한 값입니다.
        </label>
        <button className="button">적용 가능성 확인</button>
      </form>
      {result && (
        <section className="panel accent" role="status">
          <h2>{result}</h2>
          <p>
            제품과 거래의 추가 제외조건은 EU 수입자와 확인해야 합니다. 이 결과는
            법적 확정 판정이 아닙니다.
          </p>
          <a href={REGULATIONS[1].sourceUrl}>
            근거: 2025/2083 · 제2a조 및 Annex VII 개정 ↗
          </a>
          <p className="muted">규정 데이터 기준일 {REGULATORY_DATE}</p>
        </section>
      )}
      <Next href="/product-map">제품·공정 구조 확인</Next>
    </>
  );
}
function ProductMap() {
  const { draft, setDraft } = useNavigator();
  const a = assessCnCode(draft.cnCode),
    s = productStructure(draft.cnCode);
  return (
    <>
      <section className="panel">
        <div className="grid two">
          <Field label="제품명">
            <input
              maxLength={200}
              value={draft.productName}
              onChange={(e) => setDraft({ productName: e.target.value })}
            />
          </Field>
          <Field label="CN 코드">
            <input
              maxLength={20}
              value={draft.cnCode}
              onChange={(e) =>
                setDraft({
                  cnCode: e.target.value,
                  sector: assessCnCode(e.target.value).sector || "",
                })
              }
            />
          </Field>
        </div>
        <ol className="process-flow">
          {[
            ["CN 코드", a.displayCode || "확인 필요"],
            ["산업분야", a.sector || "확인 필요"],
            ["품목군", s.category],
            ["기능 단위", s.unit],
          ].map(([label, value]) => (
            <li key={label}>
              <small>{label}</small>
              <strong>{value}</strong>
            </li>
          ))}
        </ol>
        <div className="grid two">
          <Field label="생산공정 (확인한 내용만 입력)">
            <textarea
              maxLength={500}
              value={draft.productionProcesses}
              onChange={(e) =>
                setDraft({ productionProcesses: e.target.value })
              }
            />
          </Field>
          <Field label="생산경로 (선택)">
            <textarea
              maxLength={500}
              value={draft.productionRoute}
              onChange={(e) => setDraft({ productionRoute: e.target.value })}
            />
          </Field>
          <Field label="관련 전구물질 (선택)">
            <textarea
              maxLength={500}
              value={draft.precursors}
              onChange={(e) => setDraft({ precursors: e.target.value })}
            />
          </Field>
          <Field label="사업장 (선택)">
            <input
              maxLength={500}
              value={draft.sites}
              onChange={(e) => setDraft({ sites: e.target.value })}
            />
          </Field>
        </div>
        <Note>
          시스템 경계에는 해당 품목군의 직접배출량, 적용되는 간접배출량 및
          전구물질의 내재배출량이 포함됩니다. 생산공정과 생산경로는 같은 개념이
          아닙니다. 같은 기능 단위에 여러 생산경로가 있는 경우 제4조의 요건을
          확인하세요.
        </Note>
        <a href={s.sourceUrl}>{s.reference} ↗</a>
        <p className="muted">규정 데이터 기준일 {REGULATORY_DATE}</p>
      </section>
      <section className="panel">
        <h2>전구물질 데이터는 어떻게 연결되나요?</h2>
        <ol className="process-flow">
          {[
            "최종제품",
            "관련 전구물질",
            "공급업체 데이터",
            "전구물질 내재배출량",
            "최종제품 내재배출량",
          ].map((x) => (
            <li key={x}>
              <strong>{x}</strong>
            </li>
          ))}
        </ol>
        <p>
          아래 흐름은 자료 확인을 위한 설명입니다. 제품별 산정방법이나 데이터
          귀속방법을 대신 설계하지 않습니다.
        </p>
      </section>
      <Next href="/readiness">검증 준비도 진단</Next>
    </>
  );
}
function Readiness() {
  const { draft, setDraft, track } = useNavigator();
  const scored = scoreReadiness(draft.answers);
  const [show, setShow] = useState(false);
  return (
    <>
      <div className="progress-card">
        <strong>{scored.answered} / 24개 응답</strong>
        <progress
          value={scored.answered}
          max={24}
          aria-label="진단 응답 진행률"
        />
        <span>준비됨 · 일부 준비 · 미준비/모름</span>
      </div>
      {Object.entries(CATEGORY_LABELS).map(([key, title], index) => (
        <section className="panel" key={key}>
          <h2>
            <span className="section-number">0{index + 1}</span>
            {title}
          </h2>
          {QUESTIONS.filter((q) => q.category === key).map((q) => (
            <fieldset className="question" key={q.id}>
              <legend>{q.text}</legend>
              <div className="answer-options">
                {(
                  [
                    ["ready", "준비됨"],
                    ["partial", "일부 준비"],
                    ["missing", "미준비/모름"],
                  ] as const
                ).map(([value, label]) => (
                  <label key={value}>
                    <input
                      type="radio"
                      name={q.id}
                      checked={draft.answers[q.id] === value}
                      onChange={() => {
                        setDraft({
                          answers: {
                            ...draft.answers,
                            [q.id]: value as ReadinessAnswer,
                          },
                        });
                        setShow(false);
                      }}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </section>
      ))}
      <button
        className="button"
        disabled={!scored.complete}
        onClick={() => {
          setShow(true);
          track("READINESS_COMPLETE");
        }}
      >
        진단 결과 확인
      </button>
      {!scored.complete && (
        <p>
          전체 질문에 응답하면 준비도를 확인할 수 있습니다. 해당 없는 항목은 그
          근거가 준비되어 있을 때 ‘준비됨’을 선택하세요.
        </p>
      )}
      {show && (
        <section className="panel accent" aria-live="polite">
          <p className="eyebrow">전체 검증 준비도</p>
          <div className="score">
            {scored.readinessScore}
            <small>%</small>
          </div>
          <div className="grid two">
            {Object.entries(scored.readinessCategories).map(([key, value]) => (
              <div key={key}>
                <p>
                  {CATEGORY_LABELS[key as keyof typeof CATEGORY_LABELS]}{" "}
                  <strong>{value}%</strong>
                </p>
                <progress max={100} value={value} />
              </div>
            ))}
          </div>
          <h3>주요 미비사항</h3>
          {scored.gapCodes.length ? (
            <ul className="gap-list">
              {QUESTIONS.filter((q) => scored.gapCodes.includes(q.id)).map(
                (q) => (
                  <li key={q.id}>
                    <span className="badge">{q.priority}</span> {q.evidence}
                  </li>
                ),
              )}
            </ul>
          ) : (
            <p>
              응답 기준으로 미비사항이 없습니다. 실제 증빙자료 검토 결과와 다를
              수 있습니다.
            </p>
          )}
          <p className="muted">
            점수는 동일 가중치의 자가진단 지표입니다. 준비됨 1점, 일부 준비
            0.5점, 미준비/모름 0점.
          </p>
          <Next href="/evidence">필요한 증빙자료 확인</Next>
        </section>
      )}
      <Note>{READINESS_NOTICE}</Note>
    </>
  );
}
function Evidence() {
  const { draft, setDraft } = useNavigator();
  const scored = scoreReadiness(draft.answers);
  const [onlyGaps, setOnlyGaps] = useState(false);
  const questions = QUESTIONS.filter(
    (q) => !onlyGaps || draft.answers[q.id] !== "ready",
  );
  return (
    <>
      <Note>
        자료 파일은 이 화면에서 업로드하지 않습니다. 준비상태만 확인하며 신청 시
        담당자에게 전달할 수 있습니다.
      </Note>
      {!scored.complete && (
        <p>
          진단을 완료하면 필요한 자료를 더 쉽게 확인할 수 있습니다.{" "}
          <Link href="/readiness">준비도 진단하기 →</Link>
        </p>
      )}
      <label className="check">
        <input
          type="checkbox"
          checked={onlyGaps}
          onChange={(e) => setOnlyGaps(e.target.checked)}
        />
        미비사항 관련 자료만 보기
      </label>
      <div className="evidence-grid">
        {questions.map((q) => (
          <article className="panel" key={q.id}>
            <span className="badge">{q.priority}</span>
            <h3>{q.evidence}</h3>
            <p>{CATEGORY_LABELS[q.category]}</p>
            <Field label="자료 준비상태">
              <select
                value={draft.evidence[q.id] || ""}
                onChange={(e) =>
                  setDraft({
                    evidence: {
                      ...draft.evidence,
                      [q.id]: e.target.value as EvidenceStatus,
                    },
                  })
                }
              >
                <option value="">확인 전</option>
                <option value="ready">준비 완료</option>
                <option value="partial">일부 준비</option>
                <option value="missing">미준비</option>
                <option value="not_applicable">
                  해당 없음 (근거 확인 필요)
                </option>
              </select>
            </Field>
          </article>
        ))}
      </div>
      <Note>
        자료 예시는 2025/2547 제5·10조 및 Annex II·IV, 2025/2551의 검증 활동
        요건을 참고한 준비 안내입니다. 실제 요구자료는 제품과 검증 범위에 따라
        달라집니다.
      </Note>
      <div className="next"><ApplicationLink className="button">LRQA 검증 신청</ApplicationLink></div>
    </>
  );
}
function Application() {
  return <section className="panel prose"><h2>LRQA CBAM 검증 신청서로 이동</h2><p>제품, CN 코드, 사업장, 생산공정과 준비도 진단·증빙자료 상태가 신청서에 자동 전달됩니다. 신청서에서 연락처를 입력하고 동의 후 제출해 주세요.</p><ApplicationLink className="button">CBAM 검증 신청 →</ApplicationLink></section>;
}
function PrivacyNotice({ privacy }: { privacy: Privacy }) {
  return (
    <section className="panel prose">
      <h2>수집 시점과 목적</h2>
      <p>
        CN 검색과 검증 준비도 진단은 연락처 입력 없이 사용할 수 있습니다. 검증
        신청 시 필수 동의를 받은 후 담당자 연락과 검증 범위 검토를 위해
        신청정보를 저장합니다.
      </p>
      <h2>수집 항목</h2>
      <p>
        회사명, 담당자명, 이메일, 전화번호, 국가, 사업장, 신청내용 및 함께
        제출한 진단결과. 주소와 추가 전달사항 등 선택 항목은 입력한 경우에
        수집합니다.
      </p>
      <h2>보관·처리 및 문의</h2>
      <p>
        보유기간:{" "}
        {privacy.retention ||
          "검증 신청서의 개인정보 안내를 확인해 주세요."}
      </p>
      <p>위탁·국외 처리: {privacy.processors || "운영 준비 중"}</p>
      <p>
        열람·정정·삭제·동의 철회 문의:{" "}
        {privacy.contact || "LRQA Korea 공식 문의 채널"}
      </p>
      <h2>익명 세션과 이용기록</h2>
      <p>
        필수 세션 쿠키는 24시간 유지됩니다. 현재 탭의 저장소에는 CN 코드와 진단
        응답을 보관하며, 연락처와 자유입력 내용은 저장하지 않습니다.
        이용기록에는 검색어·연락처·세션 ID를 남기지 않습니다. 요청 제한에는
        변환된 접속주소 식별자를 사용하며 최대 24시간 보관합니다. 호스팅
        사업자의 기본 접속기록 처리는 위 운영 안내에 따릅니다.
      </p>
      <h2>동의 선택</h2>
      <p>
        필수 동의를 거부하면 온라인 검증 신청은 제한됩니다. 기본 검색과 진단은
        계속 사용할 수 있습니다. 선택적 마케팅 동의는 이메일 서비스·행사 안내
        목적이며 철회할 수 있고, 미동의해도 검증 신청에 영향을 주지 않습니다.
      </p>
      <p>안내 버전: {PRIVACY_VERSION}</p>
    </section>
  );
}
function Legal() {
  return (
    <>
      <section className="panel prose">
        <h2>서비스 범위</h2>
        <p>{CN_NOTICE}</p>
        <p>{READINESS_NOTICE}</p>
        <p>
          Navigator는 일반적인 자료·요건 안내 도구입니다. 고객별 산정방법 결정,
          데이터 귀속 설계, 모니터링 계획·배출량 보고서 대리 작성 및 검증대상
          데이터 수정을 수행하지 않습니다.
        </p>
        <p>
          8자리 형식이 맞더라도 실제 CN 코드의 존재와 통관 분류는 별도 확인이
          필요합니다. 후보 검색으로 CN 분류가 확정되지 않습니다.
        </p>
        <p>
          준비도는 법령의 합격 기준이 아닌 자체 자가진단 지표입니다. 서비스
          제공은 적용 규정, 인정 범위 및 최종 계약 검토에 따릅니다.
        </p>
      </section>
      <section className="panel prose">
        <h2>공식 규정 출처</h2>
        <p>규정 데이터 기준일 {REGULATORY_DATE}</p>
        <ul>
          {REGULATIONS.map((r) => (
            <li key={r.sourceRegulation}>
              <a href={r.sourceUrl}>Regulation (EU) {r.sourceRegulation} ↗</a>
              <p>{r.legalReference}</p>
            </li>
          ))}
        </ul>
        <p>
          2025/2547의 2026-06-03 독일어 및 2026-09-18 네덜란드어 정정은 영어판에
          해당하지 않습니다. 기본값 수치는 제공하지 않으며 2025/2621과
          2026/1740을 함께 확인하세요.
        </p>
      </section>
    </>
  );
}
