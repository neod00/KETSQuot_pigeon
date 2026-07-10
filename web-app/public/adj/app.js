const steps = [
  { id: "client", label: "Client Info" },
  { id: "standards", label: "Standards" },
  { id: "sites", label: "Sites & Employees" },
  { id: "reduction", label: "Reduction" },
  { id: "adjustment", label: "Adjustment" },
  { id: "sampling", label: "Sampling" },
  { id: "review", label: "Review & Export" },
];
const translations = {
  "ADJ Builder": "ADJ 작성 도우미",
  "Needs input": "입력 필요",
  "Export ready": "생성 가능",
  "Reset Draft": "초안 초기화",
  "Workflow": "작성 단계",
  "Client Info": "고객 정보",
  "Standards": "표준",
  "Sites & Employees": "사이트/인원",
  "Reduction": "통합 감축",
  "Adjustment": "조정요인",
  "Sampling": "샘플링",
  "Review & Export": "검토/생성",
  "Client Information": "고객 정보",
  "Basic report data and scope are mapped into the Client Info tab.": "기본 보고 정보와 인증 범위가 ADJ의 Client Info 탭에 입력됩니다.",
  "Client / Account name": "고객 / 계정명",
  "Customer contact person": "고객 담당자",
  "Created by": "작성자",
  "Date created": "작성일",
  "BOS Contract ID": "BOS 계약 ID",
  "Opportunity name / link": "Opportunity 이름 / 링크",
  "Audit frequency": "심사 주기",
  "Scope of approval": "인증 범위",
  "Special comments": "특이사항",
  "Additional flags": "추가 항목",
  "Outsourced processes": "외주 프로세스 있음",
  "ISO 55001 / 56001": "ISO 55001 / 56001",
  "Integrated with other standards": "다른 표준과 통합",
  "Against which standard?": "해당 표준",
  "Other integrated standard(s)": "기타 통합 표준",
  "Standards & Activity Codes": "표준 및 Activity / EA 코드",
  "Select the standards and provide the searchable activity/EA code text used in the ADJ.": "ADJ에 사용할 표준과 검색 가능한 Activity 또는 EA 코드 정보를 입력합니다.",
  "Transfer / Takeover of Approval": "인증 이전 / TOA",
  "Transfer stage": "이전 단계",
  "Change to Approval": "인증 변경 / CTA",
  "What does the CTA cover?": "CTA 변경 내용",
  "Sites & Employees": "사이트/인원",
  "The first site should be the main site. Headcount is sent to the Effective Employees tab.": "첫 번째 사이트는 Main Site로 입력하세요. 인원 정보는 Effective Employees 탭에 반영됩니다.",
  "Add Site": "사이트 추가",
  "Remove": "삭제",
  "Site name / description": "사이트명 / 설명",
  "Type of site": "사이트 유형",
  "Address": "주소",
  "Site scope": "사이트 범위",
  "Full time employees": "정규직 인원",
  "Part time employees": "파트타임 인원",
  "Contractors": "계약직 인원",
  "Risk level justification": "위험도/복잡도 근거",
  "ENP reduction reason": "ENP 감축 사유",
  "Further reduction justification": "추가 감축 근거",
  "Integrated Reduction": "통합심사 감축",
  "Answer conservatively for new clients. If unsure, leave answers as No.": "신규 고객은 보수적으로 답변하세요. 확실하지 않으면 No로 두는 것이 안전합니다.",
  "Integration questions": "통합 수준 질문",
  "Team ability to perform integrated audit": "통합심사 수행 팀 역량",
  "Common documentation structure": "공통 문서 구조",
  "Integrated management review": "통합 경영검토",
  "Integrated internal audit": "통합 내부심사",
  "Common policy and objectives": "공통 방침 및 목표",
  "Integrated process approach": "통합 프로세스 접근",
  "Integrated improvement mechanism": "통합 개선 체계",
  "Integrated audit team evidence available": "통합심사팀 근거 확보",
  "Adjustment Factors": "조정요인",
  "Any decrease, increase, or manual factor should include a clear justification.": "감축, 증가, 수동 조정 요인은 명확한 justification이 필요합니다.",
  "Add Adjustment": "조정요인 추가",
  "Standard": "표준",
  "Factor": "요인",
  "Direction": "방향",
  "Percentage": "비율",
  "Justification": "근거",
  "Sampling deviations and main-site exclusions require a rationale.": "샘플링 편차와 Main Site 제외에는 근거가 필요합니다.",
  "Sampling configuration": "샘플링 설정",
  "Multi-site certification": "멀티사이트 인증",
  "Main site excluded": "Main Site 계산 제외",
  "Use normal sampling": "일반 샘플링 사용",
  "Stage 1 sampling": "Stage 1 샘플링",
  "Stage 2 sampling": "Stage 2 샘플링",
  "Surveillance sampling": "Surveillance 샘플링",
  "Recertification sampling": "Recertification 샘플링",
  "Sampling group / process name": "샘플링 그룹 / 프로세스명",
  "Rounding": "반올림 기준",
  "Sampling rationale": "샘플링 근거",
  "Resolve blocking errors, review warnings, then generate the official ADJ workbook.": "차단 오류를 해결하고 경고를 검토한 뒤 공식 ADJ 파일을 생성합니다.",
  "Completion": "완성도",
  "Errors": "오류",
  "Warnings": "경고",
  "No validation issues found.": "검증 이슈가 없습니다.",
  "Download Input Summary": "입력 요약 다운로드",
  "Generate ADJ_v3.xlsx": "ADJ_v3.xlsx 생성",
  "Generating...": "생성 중...",
  "Generated": "생성 완료",
  "Download Excel file": "엑셀 파일 다운로드",
  "Validation": "검증",
  "Sites": "사이트",
  "Headcount": "총 인원",
  "Adjustments": "조정요인",
  "Ready for review.": "검토 준비 완료.",
  "Back": "이전",
  "Next": "다음",
  "Client name": "고객명",
  "Enter the client/account name.": "고객 / 계정명을 입력하세요.",
  "Enter the preparer or owner.": "작성자 또는 담당자를 입력하세요.",
  "Enter the ADJ creation date.": "ADJ 작성일을 입력하세요.",
  "Enter the proposed or actual scope.": "제안 또는 실제 인증 범위를 입력하세요.",
  "No standard selected": "표준 미선택",
  "Select at least one core standard.": "최소 하나의 core standard를 선택하세요.",
  "Site name is required.": "사이트명은 필수입니다.",
  "Address is recommended for certification scope traceability.": "인증 범위 추적성을 위해 주소 입력을 권장합니다.",
  "Site scope is recommended.": "사이트 범위 입력을 권장합니다.",
  "Enter at least one employee count.": "최소 하나 이상의 인원수를 입력하세요.",
  "ENP justification": "ENP 근거",
  "Reduction reason is selected. Add a clear further justification where needed.": "감축 사유가 선택되었습니다. 필요한 경우 명확한 추가 근거를 입력하세요.",
  "Consider noting whether additional audit time is needed.": "추가 심사시간 필요 여부를 특이사항에 남기는 것을 권장합니다.",
  "Multi-site sampling": "멀티사이트 샘플링",
  "Add a sampling rationale for the ADJ review trail.": "ADJ 검토 이력을 위해 샘플링 근거를 입력하세요.",
  "Main site exclusion requires a justification before export.": "Main Site 계산 제외는 생성 전에 근거가 필요합니다.",
  "Every adjustment factor requires justification.": "모든 조정요인에는 근거가 필요합니다.",
  "30% decrease is high, especially for a new client. Confirm evidence is available.": "30% 감축은 특히 신규 고객에게 높은 수준입니다. 근거가 충분한지 확인하세요.",
  "Potential double reduction": "중복 감축 가능성",
  "Similar/repetitive activities appear in ENP and adjustment factors.": "ENP와 조정요인에 유사/반복 활동 감축이 함께 나타납니다."
};

let language = localStorage.getItem("adj-builder-language") || "en";

function setLanguage(nextLanguage) {
  language = nextLanguage;
  localStorage.setItem("adj-builder-language", language);
  render();
}

function translateText(text) {
  const trimmed = text.trim();
  if (!trimmed) return text;
  if (translations[trimmed]) return text.replace(trimmed, translations[trimmed]);
  let match = trimmed.match(/^Site (\d+)$/);
  if (match) return text.replace(trimmed, `사이트 ${match[1]}`);
  match = trimmed.match(/^Adjustment (\d+)$/);
  if (match) return text.replace(trimmed, `조정요인 ${match[1]}`);
  match = trimmed.match(/^Site (\d+) headcount$/);
  if (match) return text.replace(trimmed, `사이트 ${match[1]} 인원`);
  match = trimmed.match(/^Site (\d+) ENP justification$/);
  if (match) return text.replace(trimmed, `사이트 ${match[1]} ENP 근거`);
  return text;
}

function applyLanguage(root = document) {
  document.documentElement.lang = language === "ko" ? "ko" : "en";
  if (language !== "ko") return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || ["SCRIPT", "STYLE", "TEXTAREA", "OPTION"].includes(parent.tagName)) {
        return NodeFilter.FILTER_REJECT;
      }
      return node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((node) => {
    node.nodeValue = translateText(node.nodeValue);
  });
  document.documentElement.lang = "ko";
}

const defaultState = {
  client: {
    name: "",
    contactPerson: "",
    createdBy: "",
    createdDate: new Date().toISOString().slice(0, 10),
    contractId: "New",
    opportunity: "",
    comments: "",
    scope: "",
    auditFrequency: "12-monthly",
  },
  flags: {
    outsourcedProcesses: false,
    iso55or56: false,
    iso55or56Against: "",
  },
  standards: ["ISO 9001"],
  activityCodes: {
    "ISO 9001": ["", "", ""],
    "ISO 14001": ["", "", ""],
    "ISO 45001": ["", "", ""],
  },
  integration: {
    otherStandards: false,
    otherStandardsText: "",
  },
  transfer: {
    isToa: false,
    stage: "",
  },
  cta: {
    isCta: false,
    covers: "",
  },
  sites: [
    {
      name: "Main Site",
      type: "Permanent",
      address: "",
      scope: "",
      riskJustification: "",
      samplingNote: "",
      headcount: { fullTime: 0, partTime: 0, contractors: 0 },
      employeeReductionReason: "",
      furtherReductionJustification: "",
    },
  ],
  integratedReduction: {
    answers: [false, false, false, false, false, false, false],
    teamAbility: 100,
  },
  adjustments: [],
  sampling: {
    multiSite: false,
    mainSiteExcluded: false,
    grouping: "No Sampling Applicable",
    useNormalSampling: true,
    stage1Sampling: true,
    stage2Sampling: true,
    surveillanceSampling: true,
    recertSampling: true,
    rationale: "",
  },
  rounding: "half",
  manualAdjustments: [],
};

let state = loadState();
let currentStep = "client";
let exportResult = null;
let isExporting = false;
let eaCodeCatalog = { metadata: null, codes: [], oldMappings: [] };
let codeFinderTarget = null;
let codeFinderQuery = "";
let codeFinderMode = "activity";
let codeFinderApplyAll = true;
let codeFinderError = "";
const pinnedEaTranslations = new Set();

function loadPrefill() {
  try {
    const raw = localStorage.getItem("adj-builder-prefill");
    localStorage.removeItem("adj-builder-prefill");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.data || Date.now() - Number(parsed.createdAt || 0) > 15 * 60 * 1000) return null;
    return parsed.data;
  } catch {
    localStorage.removeItem("adj-builder-prefill");
    return null;
  }
}

function loadState() {
  let next = structuredClone(defaultState);
  try {
    const saved = localStorage.getItem("adj-builder-draft");
    if (saved) next = mergeState(next, JSON.parse(saved));
  } catch {
    next = structuredClone(defaultState);
  }
  const prefill = loadPrefill();
  return prefill ? mergeState(next, prefill) : next;
}

function mergeState(base, incoming) {
  if (Array.isArray(base)) return Array.isArray(incoming) ? incoming : structuredClone(base);
  if (base && typeof base === "object") {
    const next = structuredClone(base);
    for (const [key, value] of Object.entries(incoming || {})) {
      next[key] = key in base ? mergeState(base[key], value) : value;
    }
    return next;
  }
  return incoming ?? base;
}

function saveState() {
  localStorage.setItem("adj-builder-draft", JSON.stringify(state));
}

function set(path, value) {
  const keys = path.split(".");
  let ref = state;
  for (const key of keys.slice(0, -1)) ref = ref[key];
  ref[keys.at(-1)] = value;
  saveState();
  render();
}

function updateSite(index, path, value) {
  const keys = path.split(".");
  let ref = state.sites[index];
  for (const key of keys.slice(0, -1)) ref = ref[key];
  ref[keys.at(-1)] = value;
  saveState();
  render();
}

function input(path, label, attrs = {}) {
  const value = path.split(".").reduce((acc, key) => acc?.[key], state) ?? "";
  const type = attrs.type || "text";
  const required = attrs.required ? "required" : "";
  return `
    <div class="field ${attrs.full ? "full" : ""}">
      <label for="${path}">${label}</label>
      <input id="${path}" type="${type}" value="${escapeAttr(value)}" ${required}
        ${attrs.placeholder ? `placeholder="${escapeAttr(attrs.placeholder)}"` : ""}
        data-path="${path}" />
      ${attrs.hint ? `<div class="hint">${attrs.hint}</div>` : ""}
    </div>
  `;
}

function textarea(path, label, attrs = {}) {
  const value = path.split(".").reduce((acc, key) => acc?.[key], state) ?? "";
  return `
    <div class="field ${attrs.full ? "full" : ""}">
      <label for="${path}">${label}</label>
      <textarea id="${path}" data-path="${path}" ${attrs.placeholder ? `placeholder="${escapeAttr(attrs.placeholder)}"` : ""}>${escapeHtml(value)}</textarea>
      ${attrs.hint ? `<div class="hint">${attrs.hint}</div>` : ""}
    </div>
  `;
}

function select(path, label, options, attrs = {}) {
  const value = path.split(".").reduce((acc, key) => acc?.[key], state) ?? "";
  return `
    <div class="field ${attrs.full ? "full" : ""}">
      <label for="${path}">${label}</label>
      <select id="${path}" data-path="${path}">
        ${options
          .map(
            (option) =>
              `<option value="${escapeAttr(option)}" ${option === value ? "selected" : ""}>${escapeHtml(option)}</option>`,
          )
          .join("")}
      </select>
    </div>
  `;
}

function checkbox(path, label) {
  const value = Boolean(path.split(".").reduce((acc, key) => acc?.[key], state));
  return `
    <label class="check-tile">
      <input type="checkbox" data-path="${path}" ${value ? "checked" : ""} />
      <span>${escapeHtml(label)}</span>
    </label>
  `;
}

function standardCheckbox(standard) {
  const checked = state.standards.includes(standard);
  return `
    <label class="check-tile">
      <input type="checkbox" data-standard="${standard}" ${checked ? "checked" : ""} />
      <span>${standard}</span>
    </label>
  `;
}

function renderClient() {
  return `
    <h1 class="page-title">Client Information</h1>
    <p class="page-subtitle">Basic report data and scope are mapped into the Client Info tab.</p>
    <div class="form-grid">
      ${input("client.name", "Client / Account name", { required: true })}
      ${input("client.contactPerson", "Customer contact person")}
      ${input("client.createdBy", "Created by", { required: true })}
      ${input("client.createdDate", "Date created", { type: "date", required: true })}
      ${input("client.contractId", "BOS Contract ID", { placeholder: "New" })}
      ${input("client.opportunity", "Opportunity name / link")}
      ${select("client.auditFrequency", "Audit frequency", ["12-monthly", "6-monthly", "9-monthly"])}
      ${textarea("client.scope", "Scope of approval", { full: true, required: true })}
      ${textarea("client.comments", "Special comments", { full: true })}
      <div class="field full">
        <span class="label">Additional flags</span>
        <div class="checkbox-grid">
          ${checkbox("flags.outsourcedProcesses", "Outsourced processes")}
          ${checkbox("flags.iso55or56", "ISO 55001 / 56001")}
          ${checkbox("integration.otherStandards", "Integrated with other standards")}
        </div>
      </div>
      ${state.flags.iso55or56 ? input("flags.iso55or56Against", "Against which standard?", { placeholder: "ISO 55001" }) : ""}
      ${
        state.integration.otherStandards
          ? input("integration.otherStandardsText", "Other integrated standard(s)", { placeholder: "ISO 50001, ISO 20000" })
          : ""
      }
    </div>
  `;
}

function finderText(en, ko) {
  return language === "ko" ? ko : en;
}

function normalizeFinderText(value) {
  return String(value || "").toLowerCase().replace(/[^0-9a-z가-힣]+/gi, " ").trim();
}

function codeById(code) {
  return eaCodeCatalog.codes.find((item) => item.code === code);
}

function activityCodeResults() {
  const terms = normalizeFinderText(codeFinderQuery).split(/\s+/).filter(Boolean);
  return eaCodeCatalog.codes
    .filter((item) => {
      if (!terms.length) return true;
      const searchable = normalizeFinderText([
        item.code,
        item.number,
        item.title,
        item.titleKo,
        item.naceHeadingKo,
        item.naceSummaryKo,
        item.naceDetailsKo,
        item.koreanKeywords,
        item.naceHeading,
        item.naceDescription,
        ...(item.oldCodes || []),
      ].join(" "));
      return terms.every((term) => searchable.includes(term));
    })
    .sort((a, b) => {
      const query = normalizeFinderText(codeFinderQuery);
      const aStarts = normalizeFinderText(`${a.code} ${a.title} ${a.koreanKeywords}`).startsWith(query) ? 0 : 1;
      const bStarts = normalizeFinderText(`${b.code} ${b.title} ${b.koreanKeywords}`).startsWith(query) ? 0 : 1;
      return aStarts - bStarts || a.number - b.number;
    });
}

function oldCodeResults() {
  const terms = normalizeFinderText(codeFinderQuery).split(/\s+/).filter(Boolean);
  return eaCodeCatalog.oldMappings.filter((item) => {
    if (!terms.length) return false;
    const searchable = normalizeFinderText(`${item.code} ${item.title} ${(item.newCodes || []).join(" ")}`);
    return terms.every((term) => searchable.includes(term));
  });
}

function renderEaCodeResult(item) {
  const description = String(item.naceDescription || "");
  const excerpt = description.length > 270 ? `${description.slice(0, 270)}...` : description;
  const pinned = pinnedEaTranslations.has(item.code);
  return `
    <article class="code-result translatable-code ${pinned ? "translation-pinned" : ""}" data-translation-card="${escapeAttr(item.code)}">
      <div class="code-result-head">
        <div class="translation-copy english-translation-copy">
          <strong>${escapeHtml(item.code)} · ${escapeHtml(item.title)}</strong>
          <p>${escapeHtml(item.naceHeading)}</p>
        </div>
        <div class="translation-copy korean-translation-copy" lang="ko">
          <strong>${escapeHtml(item.code)} · ${escapeHtml(item.titleKo || item.title)}</strong>
          <p>${escapeHtml(item.naceHeadingKo || item.naceHeading)}</p>
        </div>
        <div class="code-result-actions">
          <button class="translation-pin ${pinned ? "active" : ""}" data-action="toggle-ea-translation" data-ea-code="${escapeAttr(item.code)}" aria-pressed="${pinned}" title="${pinned ? "영문 원문으로 전환" : "한글 번역 고정"}">
            ${pinned ? "EN" : "한글"}
          </button>
          <button class="btn primary code-select" data-action="select-ea-code" data-ea-code="${escapeAttr(item.code)}">
            ${finderText("Select", "선택")}
          </button>
        </div>
      </div>
      <div class="translation-copy english-translation-copy">
        <div class="code-keywords">${escapeHtml(item.koreanKeywords)}</div>
        <p class="code-excerpt">${escapeHtml(excerpt)}</p>
        <details>
          <summary>${finderText("View NACE details", "NACE 상세 설명")}</summary>
          <p>${escapeHtml(description)}</p>
        </details>
      </div>
      <div class="translation-copy korean-translation-copy" lang="ko">
        <div class="translation-badge">한글 번역</div>
        <p class="korean-summary">${escapeHtml(item.naceSummaryKo || item.koreanKeywords)}</p>
        <details>
          <summary>한글 NACE 상세 번역</summary>
          <p>${escapeHtml(item.naceDetailsKo || item.naceSummaryKo || item.koreanKeywords)}</p>
        </details>
      </div>
      <div class="code-source">EA/NACE V2 · p.${escapeHtml(item.source?.nacePage || "-")} · ${finderText("Previous codes", "구 코드")} ${(item.oldCodes || []).length}</div>
    </article>
  `;
}
function renderOldCodeResult(item) {
  const multiple = (item.newCodes || []).length > 1;
  return `
    <article class="code-result old-code-result">
      <div class="old-code-title">
        <strong>${escapeHtml(item.code)} · ${escapeHtml(item.title)}</strong>
        <span class="source-badge">New Code Map p.${escapeHtml(item.sourcePage)}</span>
      </div>
      ${multiple ? `<div class="mapping-warning">${finderText("Multiple EA codes are mapped. Confirm the client's actual sector.", "여러 EA 코드가 연결됩니다. 고객의 실제 사업 분야를 확인해 선택하세요.")}</div>` : ""}
      <div class="mapped-code-list">
        ${(item.newCodes || []).map((code) => {
          const ea = codeById(code);
          return `<button class="mapped-code" data-action="select-ea-code" data-ea-code="${escapeAttr(code)}">
            <strong>${escapeHtml(code)}</strong><span>${escapeHtml(ea?.title || "")}<small>${escapeHtml(ea?.titleKo || "")}</small></span>
          </button>`;
        }).join("")}
      </div>
    </article>
  `;
}

function codeFinderResultsHtml() {
  if (codeFinderError) return `<div class="finder-empty error">${escapeHtml(codeFinderError)}</div>`;
  if (!eaCodeCatalog.codes.length) return `<div class="finder-empty">${finderText("Loading EA code guidance...", "EA 코드 가이드를 불러오는 중입니다...")}</div>`;
  const results = codeFinderMode === "old" ? oldCodeResults() : activityCodeResults();
  if (!results.length) {
    return `<div class="finder-empty">${codeFinderMode === "old" && !codeFinderQuery.trim()
      ? finderText("Enter an old six-digit LR code or title.", "기존 6자리 LR 코드 또는 명칭을 입력하세요.")
      : finderText("No matching code found. Try another activity term.", "일치하는 코드가 없습니다. 다른 활동명으로 검색해보세요.")}</div>`;
  }
  return results.slice(0, 40).map((item) => codeFinderMode === "old" ? renderOldCodeResult(item) : renderEaCodeResult(item)).join("");
}

function renderCodeFinder() {
  if (!codeFinderTarget) return "";
  const selectedStandards = state.standards.filter((standard) => ["ISO 9001", "ISO 14001", "ISO 45001"].includes(standard));
  return `
    <button class="code-finder-backdrop" data-action="close-code-finder" aria-label="${finderText("Close code finder", "코드 찾기 닫기")}"></button>
    <aside class="code-finder" role="dialog" aria-modal="true" aria-label="${finderText("EA code finder", "EA 코드 찾기")}">
      <header class="code-finder-header">
        <div>
          <span class="section-title">${escapeHtml(codeFinderTarget.standard)} · Activity ${codeFinderTarget.index + 1}</span>
          <h2>${finderText("EA Code Finder", "EA 코드 찾기")}</h2>
        </div>
        <button class="icon-close" data-action="close-code-finder" title="${finderText("Close", "닫기")}" aria-label="${finderText("Close", "닫기")}">×</button>
      </header>
      <div class="finder-mode" role="tablist">
        <button class="${codeFinderMode === "activity" ? "active" : ""}" data-action="code-finder-mode" data-mode="activity">${finderText("Activity / EA search", "활동 / EA 검색")}</button>
        <button class="${codeFinderMode === "old" ? "active" : ""}" data-action="code-finder-mode" data-mode="old">${finderText("Convert old code", "구 코드 변환")}</button>
      </div>
      <div class="finder-search">
        <label for="ea-code-search">${codeFinderMode === "old" ? finderText("Old LR code or title", "기존 LR 코드 또는 명칭") : finderText("Business activity, EA code or keyword", "사업 활동, EA 코드 또는 키워드")}</label>
        <input id="ea-code-search" data-code-search value="${escapeAttr(codeFinderQuery)}" placeholder="${codeFinderMode === "old" ? "107902, Utilities" : finderText("food manufacturing, software, 병원", "식품 제조, 소프트웨어, 병원")}" autocomplete="off" />
      </div>
      <div class="finder-guidance">
        ${codeFinderMode === "old"
          ? finderText("For existing-client conversion only. Confirm the final sector with the auditor and Client Operations.", "기존 고객 코드 전환용입니다. 최종 업종은 Auditor 및 Client Operations와 확인하세요.")
          : finderText("For new clients, search the EA/NACE description and confirm the actual certified activity.", "신규 고객은 EA/NACE 설명으로 검색한 뒤 실제 인증 활동을 확인하세요.")}
        <strong>${finderText("Risk and complexity must be assessed separately.", "Risk와 Complexity는 별도로 평가해야 합니다.")}</strong>
        <span class="hover-translation-hint">${finderText("Hover over an EA card to view its Korean translation.", "EA 카드에 마우스를 올리면 한글 번역을 볼 수 있습니다.")}</span>
      </div>
      <div class="code-results">${codeFinderResultsHtml()}</div>
      <footer class="code-finder-footer">
        <label class="apply-all-toggle">
          <input type="checkbox" data-code-apply-all ${codeFinderApplyAll ? "checked" : ""} ${selectedStandards.length < 2 ? "disabled" : ""} />
          <span>${finderText("Apply to all selected core standards", "선택된 모든 핵심 표준에 적용")}</span>
        </label>
        <span>${finderText("Maximum 3 entries per standard", "표준별 최대 3개")}</span>
      </footer>
    </aside>
  `;
}

function selectEaCode(code) {
  const item = codeById(code);
  if (!item || !codeFinderTarget) return;
  const targetStandards = codeFinderApplyAll
    ? state.standards.filter((standard) => ["ISO 9001", "ISO 14001", "ISO 45001"].includes(standard))
    : [codeFinderTarget.standard];
  const value = `${item.code} - ${item.title}`;
  for (const standard of targetStandards) {
    const values = state.activityCodes[standard] || ["", "", ""];
    const duplicate = values.some((existing, index) => index !== codeFinderTarget.index && String(existing).startsWith(`${item.code} `));
    if (duplicate) {
      alert(finderText(`${item.code} is already selected for ${standard}.`, `${standard}에 ${item.code}가 이미 선택되어 있습니다.`));
      return;
    }
  }
  for (const standard of targetStandards) {
    state.activityCodes[standard] ||= ["", "", ""];
    state.activityCodes[standard][codeFinderTarget.index] = value;
  }
  saveState();
  codeFinderTarget = null;
  render();
}

function updateCodeFinderResults() {
  const container = document.querySelector(".code-results");
  if (container) container.innerHTML = codeFinderResultsHtml();
}

async function loadEaCodeCatalog() {
  try {
    const response = await fetch("/adj/ea-code-data.json", { cache: "force-cache" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    eaCodeCatalog = await response.json();
    codeFinderError = "";
  } catch (error) {
    codeFinderError = finderText(`Unable to load EA code guidance: ${error.message}`, `EA 코드 가이드를 불러오지 못했습니다: ${error.message}`);
  }
  if (codeFinderTarget) render();
}
function renderStandards() {
  const codeFields = ["ISO 9001", "ISO 14001", "ISO 45001"]
    .filter((standard) => state.standards.includes(standard))
    .map((standard) => {
      const values = state.activityCodes[standard] || ["", "", ""];
      return `
        <div class="item-card">
          <div class="item-header"><h2 class="item-title">${standard} activity / EA code inputs</h2></div>
          <div class="form-grid">
            ${[0, 1, 2]
              .map(
                (idx) => `
                <div class="field">
                  <label>${standard} activity ${idx + 1}</label>
                  <div class="activity-code-row">
                    <input value="${escapeAttr(values[idx] || "")}" data-code-standard="${standard}" data-code-index="${idx}" placeholder="EA code or activity description" />
                    <button class="btn code-finder-open" data-action="open-code-finder" data-code-standard="${standard}" data-code-index="${idx}">${finderText("Find code", "코드 찾기")}</button>
                  </div>
                </div>
              `,
              )
              .join("")}
          </div>
        </div>
      `;
    })
    .join("");
  return `
    <h1 class="page-title">Standards & Activity Codes</h1>
    <p class="page-subtitle">Select the standards and provide the searchable activity/EA code text used in the ADJ.</p>
    <div class="form-grid">
      <div class="field full">
        <span class="label">Standards</span>
        <div class="checkbox-grid">
          ${standardCheckbox("ISO 9001")}
          ${standardCheckbox("ISO 14001")}
          ${standardCheckbox("ISO 45001")}
        </div>
      </div>
      ${checkbox("transfer.isToa", "Transfer / Takeover of Approval")}
      ${state.transfer.isToa ? input("transfer.stage", "Transfer stage") : ""}
      ${checkbox("cta.isCta", "Change to Approval")}
      ${state.cta.isCta ? textarea("cta.covers", "What does the CTA cover?", { full: true }) : ""}
    </div>
    <div class="adjustment-list" style="margin-top:18px">${codeFields}</div>
  `;
}

function renderSites() {
  return `
    <h1 class="page-title">Sites & Employees</h1>
    <p class="page-subtitle">The first site should be the main site. Headcount is sent to the Effective Employees tab.</p>
    <div class="site-list">
      ${state.sites.map(renderSite).join("")}
    </div>
    <div class="button-row">
      <button class="btn" data-action="add-site">Add Site</button>
    </div>
  `;
}

function renderSite(site, index) {
  return `
    <div class="item-card">
      <div class="item-header">
        <h2 class="item-title">Site ${index + 1}</h2>
        ${state.sites.length > 1 ? `<button class="btn danger" data-action="remove-site" data-index="${index}">Remove</button>` : ""}
      </div>
      <div class="form-grid">
        ${siteInput(index, "name", "Site name / description")}
        ${siteSelect(index, "type", "Type of site", ["Permanent", "Temporary", "Virtual"])}
        ${siteInput(index, "address", "Address")}
        ${siteTextarea(index, "scope", "Site scope", true)}
        ${siteInput(index, "headcount.fullTime", "Full time employees", "number")}
        ${siteInput(index, "headcount.partTime", "Part time employees", "number")}
        ${siteInput(index, "headcount.contractors", "Contractors", "number")}
        ${siteTextarea(index, "riskJustification", "Risk level justification", true)}
        ${siteInput(index, "employeeReductionReason", "ENP reduction reason")}
        ${siteTextarea(index, "furtherReductionJustification", "Further reduction justification", true)}
      </div>
    </div>
  `;
}

function siteValue(index, path) {
  return path.split(".").reduce((acc, key) => acc?.[key], state.sites[index]) ?? "";
}

function siteInput(index, path, label, type = "text") {
  return `
    <div class="field">
      <label>${label}</label>
      <input type="${type}" value="${escapeAttr(siteValue(index, path))}" data-site-index="${index}" data-site-path="${path}" />
    </div>
  `;
}

function siteTextarea(index, path, label, full = false) {
  return `
    <div class="field ${full ? "full" : ""}">
      <label>${label}</label>
      <textarea data-site-index="${index}" data-site-path="${path}">${escapeHtml(siteValue(index, path))}</textarea>
    </div>
  `;
}

function siteSelect(index, path, label, options) {
  const value = siteValue(index, path);
  return `
    <div class="field">
      <label>${label}</label>
      <select data-site-index="${index}" data-site-path="${path}">
        ${options.map((option) => `<option ${option === value ? "selected" : ""}>${option}</option>`).join("")}
      </select>
    </div>
  `;
}

function renderReduction() {
  const labels = [
    "Common documentation structure",
    "Integrated management review",
    "Integrated internal audit",
    "Common policy and objectives",
    "Integrated process approach",
    "Integrated improvement mechanism",
    "Integrated audit team evidence available",
  ];
  return `
    <h1 class="page-title">Integrated Reduction</h1>
    <p class="page-subtitle">Answer conservatively for new clients. If unsure, leave answers as No.</p>
    <div class="form-grid">
      <div class="field full">
        <span class="label">Integration questions</span>
        <div class="checkbox-grid">
          ${labels
            .map(
              (label, idx) => `
              <label class="check-tile">
                <input type="checkbox" data-reduction-index="${idx}" ${state.integratedReduction.answers[idx] ? "checked" : ""} />
                <span>${label}</span>
              </label>`,
            )
            .join("")}
        </div>
      </div>
      <div class="field">
        <label>Team ability to perform integrated audit</label>
        <select data-path="integratedReduction.teamAbility">
          ${[100, 80, 60, 40, 20, 0]
            .map((value) => `<option value="${value}" ${Number(state.integratedReduction.teamAbility) === value ? "selected" : ""}>${value}%</option>`)
            .join("")}
        </select>
      </div>
    </div>
  `;
}

function renderAdjustment() {
  return `
    <h1 class="page-title">Adjustment Factors</h1>
    <p class="page-subtitle">Any decrease, increase, or manual factor should include a clear justification.</p>
    <div class="adjustment-list">
      ${state.adjustments.map(renderAdjustmentItem).join("")}
    </div>
    <div class="button-row">
      <button class="btn" data-action="add-adjustment">Add Adjustment</button>
    </div>
  `;
}

function renderAdjustmentItem(item, index) {
  return `
    <div class="item-card">
      <div class="item-header">
        <h2 class="item-title">Adjustment ${index + 1}</h2>
        <button class="btn danger" data-action="remove-adjustment" data-index="${index}">Remove</button>
      </div>
      <div class="form-grid">
        ${adjustSelect(index, "standard", "Standard", ["ISO 9001", "ISO 14001", "ISO 45001"])}
        ${adjustInput(index, "factor", "Factor")}
        ${adjustSelect(index, "direction", "Direction", ["Decrease", "Increase"])}
        ${adjustInput(index, "percent", "Percentage", "number")}
        ${adjustTextarea(index, "justification", "Justification", true)}
      </div>
    </div>
  `;
}

function adjustValue(index, path) {
  return state.adjustments[index]?.[path] ?? "";
}

function adjustInput(index, path, label, type = "text") {
  return `<div class="field"><label>${label}</label><input type="${type}" value="${escapeAttr(adjustValue(index, path))}" data-adjust-index="${index}" data-adjust-path="${path}" /></div>`;
}

function adjustTextarea(index, path, label, full = false) {
  return `<div class="field ${full ? "full" : ""}"><label>${label}</label><textarea data-adjust-index="${index}" data-adjust-path="${path}">${escapeHtml(adjustValue(index, path))}</textarea></div>`;
}

function adjustSelect(index, path, label, options) {
  const value = adjustValue(index, path);
  return `
    <div class="field">
      <label>${label}</label>
      <select data-adjust-index="${index}" data-adjust-path="${path}">
        ${options.map((option) => `<option ${option === value ? "selected" : ""}>${option}</option>`).join("")}
      </select>
    </div>
  `;
}

function renderSampling() {
  return `
    <h1 class="page-title">Sampling</h1>
    <p class="page-subtitle">Sampling deviations and main-site exclusions require a rationale.</p>
    <div class="form-grid">
      <div class="field full">
        <span class="label">Sampling configuration</span>
        <div class="checkbox-grid">
          ${checkbox("sampling.multiSite", "Multi-site certification")}
          ${checkbox("sampling.mainSiteExcluded", "Main site excluded")}
          ${checkbox("sampling.useNormalSampling", "Use normal sampling")}
          ${checkbox("sampling.stage1Sampling", "Stage 1 sampling")}
          ${checkbox("sampling.stage2Sampling", "Stage 2 sampling")}
          ${checkbox("sampling.surveillanceSampling", "Surveillance sampling")}
          ${checkbox("sampling.recertSampling", "Recertification sampling")}
        </div>
      </div>
      ${input("sampling.grouping", "Sampling group / process name")}
      ${select("rounding", "Rounding", ["half", "full"])}
      ${textarea("sampling.rationale", "Sampling rationale", { full: true })}
    </div>
  `;
}

function renderReview() {
  const issues = validate();
  const errors = issues.filter((issue) => issue.level === "error").length;
  const warnings = issues.filter((issue) => issue.level === "warning").length;
  const completion = completionScore(issues);
  return `
    <div class="review">
      <h1 class="page-title">Review & Export</h1>
      <p class="page-subtitle">Resolve blocking errors, review warnings, then generate the official ADJ workbook.</p>
      <div class="review-grid">
        <div class="review-block"><span class="hint">Completion</span><strong>${completion}%</strong></div>
        <div class="review-block"><span class="hint">Errors</span><strong>${errors}</strong></div>
        <div class="review-block"><span class="hint">Warnings</span><strong>${warnings}</strong></div>
      </div>
      <div class="progress"><div class="progress-bar" style="width:${completion}%"></div></div>
      <div class="issue-list">
        ${issues.length ? issues.map(renderIssue).join("") : `<div class="issue info">No validation issues found.</div>`}
      </div>
      <div class="button-row">
        <button class="btn" data-action="download-summary">Download Input Summary</button>
        <button class="btn success" data-action="export" ${errors || isExporting ? "disabled" : ""}>
          ${isExporting ? "Generating..." : "Generate ADJ_v3.xlsx"}
        </button>
      </div>
      ${
        exportResult
          ? `<div class="download-box">
              <div class="status-pill">Generated</div>
              <p><strong>${escapeHtml(exportResult.fileName)}</strong></p>
              <a href="${escapeAttr(exportResult.downloadUrl)}" download="${escapeAttr(exportResult.fileName)}">Download Excel file</a>
            </div>`
          : ""
      }
    </div>
  `;
}

function renderIssue(issue) {
  return `<div class="issue ${issue.level}"><strong>${issue.title}</strong><br />${issue.message}</div>`;
}

function validate() {
  const issues = [];
  const required = [
    [state.client.name, "Client name", "Enter the client/account name."],
    [state.client.createdBy, "Created by", "Enter the preparer or owner."],
    [state.client.createdDate, "Date created", "Enter the ADJ creation date."],
    [state.client.scope, "Scope of approval", "Enter the proposed or actual scope."],
  ];
  for (const [value, title, message] of required) {
    if (!String(value || "").trim()) issues.push({ level: "error", title, message });
  }
  if (!state.standards.length) {
    issues.push({ level: "error", title: "No standard selected", message: "Select at least one core standard." });
  }
  state.sites.forEach((site, idx) => {
    if (!site.name.trim()) issues.push({ level: "error", title: `Site ${idx + 1}`, message: "Site name is required." });
    if (!site.address.trim()) issues.push({ level: "warning", title: `Site ${idx + 1}`, message: "Address is recommended for certification scope traceability." });
    if (!site.scope.trim()) issues.push({ level: "warning", title: `Site ${idx + 1}`, message: "Site scope is recommended." });
    const head = site.headcount;
    const total = Number(head.fullTime || 0) + Number(head.partTime || 0) + Number(head.contractors || 0);
    if (total <= 0) issues.push({ level: "error", title: `Site ${idx + 1} headcount`, message: "Enter at least one employee count." });
    if (site.employeeReductionReason && !site.furtherReductionJustification) {
      issues.push({ level: "warning", title: `Site ${idx + 1} ENP justification`, message: "Reduction reason is selected. Add a clear further justification where needed." });
    }
  });
  if (state.flags.outsourcedProcesses && !state.client.comments.trim()) {
    issues.push({ level: "warning", title: "Outsourced processes", message: "Consider noting whether additional audit time is needed." });
  }
  if (state.sampling.multiSite && !state.sampling.rationale.trim()) {
    issues.push({ level: "warning", title: "Multi-site sampling", message: "Add a sampling rationale for the ADJ review trail." });
  }
  if (state.sampling.mainSiteExcluded && !state.sampling.rationale.trim()) {
    issues.push({ level: "error", title: "Main site excluded", message: "Main site exclusion requires a justification before export." });
  }
  state.adjustments.forEach((adj, idx) => {
    if (!adj.justification?.trim()) {
      issues.push({ level: "error", title: `Adjustment ${idx + 1}`, message: "Every adjustment factor requires justification." });
    }
    if (Number(adj.percent) >= 30 && adj.direction === "Decrease") {
      issues.push({ level: "warning", title: `Adjustment ${idx + 1}`, message: "30% decrease is high, especially for a new client. Confirm evidence is available." });
    }
    if (/similar|repetitive/i.test(adj.factor || "") && state.sites.some((site) => /similar|repetitive/i.test(site.employeeReductionReason || ""))) {
      issues.push({ level: "warning", title: "Potential double reduction", message: "Similar/repetitive activities appear in ENP and adjustment factors." });
    }
  });
  return issues;
}

function completionScore(issues) {
  const errorPenalty = issues.filter((issue) => issue.level === "error").length * 18;
  const warningPenalty = issues.filter((issue) => issue.level === "warning").length * 6;
  return Math.max(0, Math.min(100, 100 - errorPenalty - warningPenalty));
}

function renderInspector() {
  const issues = validate();
  const completion = completionScore(issues);
  const totalHeadcount = state.sites.reduce((sum, site) => {
    const h = site.headcount;
    return sum + Number(h.fullTime || 0) + Number(h.partTime || 0) + Number(h.contractors || 0);
  }, 0);
  return `
    <p class="section-title">Validation</p>
    <div class="progress"><div class="progress-bar" style="width:${completion}%"></div></div>
    <div class="summary-list">
      <div class="metric"><span>Completion</span><strong>${completion}%</strong></div>
      <div class="metric"><span>Standards</span><strong>${state.standards.length}</strong></div>
      <div class="metric"><span>Sites</span><strong>${state.sites.length}</strong></div>
      <div class="metric"><span>Headcount</span><strong>${totalHeadcount}</strong></div>
      <div class="metric"><span>Adjustments</span><strong>${state.adjustments.length}</strong></div>
    </div>
    <div class="issue-list">
      ${issues.slice(0, 7).map(renderIssue).join("") || `<div class="issue info">Ready for review.</div>`}
    </div>
  `;
}

function renderWorkspace() {
  switch (currentStep) {
    case "client":
      return renderClient();
    case "standards":
      return renderStandards();
    case "sites":
      return renderSites();
    case "reduction":
      return renderReduction();
    case "adjustment":
      return renderAdjustment();
    case "sampling":
      return renderSampling();
    case "review":
      return renderReview();
    default:
      return renderClient();
  }
}

function render() {
  const app = document.querySelector("#app");
  const issues = validate();
  app.innerHTML = `
    <div class="shell">
      <header class="topbar">
        <div class="brand"><div class="brand-mark">ADJ</div><span>ADJ Builder</span></div>
        <div class="top-actions">
          <span class="${issues.some((issue) => issue.level === "error") ? "status-pill warn" : "status-pill"}">
            ${issues.some((issue) => issue.level === "error") ? "Needs input" : "Export ready"}
          </span>
          <div class="lang-toggle" aria-label="Language selection">
            <button class="${language === "en" ? "active" : ""}" data-action="lang" data-lang="en">English</button>
            <button class="${language === "ko" ? "active" : ""}" data-action="lang" data-lang="ko">한국어</button>
          </div>
          <button class="btn" data-action="reset">Reset Draft</button>
        </div>
      </header>
      <main class="layout">
        <aside class="steps">
          <p class="section-title">Workflow</p>
          <div class="step-list">
            ${steps
              .map(
                (step, index) => `
                <button class="step-button ${step.id === currentStep ? "active" : ""} ${index < steps.findIndex((item) => item.id === currentStep) ? "done" : ""}" data-step="${step.id}">
                  <span class="step-dot"></span>
                  <span>${step.label}</span>
                </button>
              `,
              )
              .join("")}
          </div>
        </aside>
        <section class="workspace">${renderWorkspace()}${navButtons()}</section>
        <aside class="inspector">${renderInspector()}</aside>
      </main>
    </div>
    ${renderCodeFinder()}
  `;
  applyLanguage(app);
}

function navButtons() {
  const idx = steps.findIndex((step) => step.id === currentStep);
  if (currentStep === "review") return "";
  return `
    <div class="button-row">
      <button class="btn" data-action="prev" ${idx === 0 ? "disabled" : ""}>Back</button>
      <button class="btn primary" data-action="next">Next</button>
    </div>
  `;
}

async function exportAdj() {
  isExporting = true;
  exportResult = null;
  render();
  try {
    const response = await fetch("/api/adj/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new Error(result.detail || result.error || "Export failed");
    }
    const blob = await response.blob();
    const encodedName = response.headers.get("X-ADJ-Filename");
    const fileName = encodedName ? decodeURIComponent(encodedName) : "ADJ_v3.xlsx";
    if (exportResult?.downloadUrl) URL.revokeObjectURL(exportResult.downloadUrl);
    exportResult = { fileName, downloadUrl: URL.createObjectURL(blob) };
  } catch (error) {
    alert(`${language === "ko" ? "생성 실패" : "Export failed"}: ${error.message}`);
  } finally {
    isExporting = false;
    render();
  }
}

function downloadSummary() {
  const issues = validate();
  const summary = {
    generatedAt: new Date().toISOString(),
    validation: issues,
    input: state,
  };
  const blob = new Blob([JSON.stringify(summary, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const client = (state.client.name || "Client").replace(/[\\/:*?"<>|]/g, "_");
  link.href = url;
  link.download = `ADJ_Input_Summary_${client}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

document.addEventListener("input", (event) => {
  const target = event.target;
  if (target.matches("[data-code-search]")) {
    codeFinderQuery = target.value;
    updateCodeFinderResults();
  } else if (target.matches("[data-path]")) {
    const value = target.type === "checkbox" ? target.checked : target.type === "number" ? Number(target.value) : target.value;
    set(target.dataset.path, value);
  } else if (target.matches("[data-site-index]")) {
    const value = target.type === "number" ? Number(target.value) : target.value;
    updateSite(Number(target.dataset.siteIndex), target.dataset.sitePath, value);
  } else if (target.matches("[data-code-standard]")) {
    const standard = target.dataset.codeStandard;
    const idx = Number(target.dataset.codeIndex);
    state.activityCodes[standard][idx] = target.value;
    saveState();
  } else if (target.matches("[data-adjust-index]")) {
    const idx = Number(target.dataset.adjustIndex);
    const value = target.type === "number" ? Number(target.value) : target.value;
    state.adjustments[idx][target.dataset.adjustPath] = value;
    saveState();
  }
});

document.addEventListener("change", (event) => {
  const target = event.target;
  if (target.matches("[data-code-apply-all]")) {
    codeFinderApplyAll = target.checked;
  } else if (target.matches("[data-standard]")) {
    const standard = target.dataset.standard;
    state.standards = target.checked
      ? [...new Set([...state.standards, standard])]
      : state.standards.filter((item) => item !== standard);
    saveState();
    render();
  } else if (target.matches("[data-reduction-index]")) {
    state.integratedReduction.answers[Number(target.dataset.reductionIndex)] = target.checked;
    saveState();
    render();
  } else if (target.matches("[data-path]")) {
    const value = target.type === "checkbox" ? target.checked : target.type === "number" ? Number(target.value) : target.value;
    set(target.dataset.path, value);
  }
});

document.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  const action = button.dataset.action;
  if (action === "open-code-finder") {
    codeFinderTarget = { standard: button.dataset.codeStandard, index: Number(button.dataset.codeIndex) };
    codeFinderQuery = "";
    codeFinderMode = "activity";
    codeFinderApplyAll = true;
    render();
    requestAnimationFrame(() => document.querySelector("[data-code-search]")?.focus());
  } else if (action === "close-code-finder") {
    codeFinderTarget = null;
    render();
  } else if (action === "code-finder-mode") {
    codeFinderMode = button.dataset.mode;
    codeFinderQuery = "";
    render();
    requestAnimationFrame(() => document.querySelector("[data-code-search]")?.focus());
  } else if (action === "toggle-ea-translation") {
    const code = button.dataset.eaCode;
    if (pinnedEaTranslations.has(code)) pinnedEaTranslations.delete(code);
    else pinnedEaTranslations.add(code);
    updateCodeFinderResults();
  } else if (action === "select-ea-code") {
    selectEaCode(button.dataset.eaCode);
  } else if (action === "lang") {
    setLanguage(button.dataset.lang);
  } else if (button.dataset.step) {
    currentStep = button.dataset.step;
    render();
  } else if (action === "next") {
    const idx = steps.findIndex((step) => step.id === currentStep);
    currentStep = steps[Math.min(idx + 1, steps.length - 1)].id;
    render();
  } else if (action === "prev") {
    const idx = steps.findIndex((step) => step.id === currentStep);
    currentStep = steps[Math.max(idx - 1, 0)].id;
    render();
  } else if (action === "add-site") {
    state.sites.push(structuredClone(defaultState.sites[0]));
    state.sites.at(-1).name = `Site ${state.sites.length}`;
    saveState();
    render();
  } else if (action === "remove-site") {
    state.sites.splice(Number(button.dataset.index), 1);
    saveState();
    render();
  } else if (action === "add-adjustment") {
    state.adjustments.push({ standard: state.standards[0] || "ISO 9001", factor: "", direction: "Decrease", percent: 10, justification: "" });
    saveState();
    render();
  } else if (action === "remove-adjustment") {
    state.adjustments.splice(Number(button.dataset.index), 1);
    saveState();
    render();
  } else if (action === "export") {
    exportAdj();
  } else if (action === "download-summary") {
    downloadSummary();
  } else if (action === "reset") {
    if (confirm(language === "ko" ? "현재 ADJ 초안을 초기화할까요?" : "Reset the current ADJ draft?")) {
      state = structuredClone(defaultState);
      exportResult = null;
      saveState();
      render();
    }
  }
});

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("'", "&#39;");
}

render();
loadEaCodeCatalog();
