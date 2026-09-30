> 2026-09-30 신청 흐름 변경: Navigator 검증 신청 버튼은 https://ketsquot-pigeon.netlify.app/cbam 으로 연결됩니다. URL fragment로 제품·CN 코드·사업장·생산공정·진단 답변·증빙 상태를 전달하고, 기존 신청서에서 검증 후 자동 입력하며 fragment를 제거합니다. 연락처와 동의는 기존 신청서에서 입력하며 접수 시 진단정보도 저장합니다. 서버가 점수를 재계산합니다. 링크 유효기간 30분, 최대 24,000자. 진단정보는 자기신고 자료입니다. 새로고침하면 메모리의 진단정보가 사라지므로 Navigator에서 다시 이동해야 합니다. 운영 연결에는 두 앱 모두 배포가 필요합니다. 아래 기존 독립 신청서·서명 릴레이 설명은 유지된 대체 API의 과거 설계이며 현재 기본 사용자 흐름에는 적용하지 않습니다. 공개 번들에서 신청서 호스트는 허용됩니다.

# Implementation and validation report

Implementation completed locally; final integration run: **2026-09-30**. Regulatory review date remains **2026-09-29**, when the cited sources and supplied PDF were reviewed. This report does not claim a hosted deployment.

## Delivered

- Independent `navigator-app` with nine Korean public pages and a mobile layout; existing LRQA logo reused.
- Existing CN engine reused; data separated into an immutable dated snapshot and a selectable data facade. Master records carry regulatory provenance and version fields.
- Dictionary-first product discovery and optional server-only AI fallback; product suggestions are always candidates. Scope remains deterministic.
- Transaction applicability, Article 4 functional-unit/product-process information, 24-question readiness, evidence status tracking and integrated application submission.
- Shared existing application types, signed server-to-server create-only intake, existing internal Blobs store, idempotent creation and optional lead/diagnostic metadata.
- Existing admin lead summary, pricing edits that preserve diagnostics, unchanged day/cost calculation functions and existing quote/contract generation.
- Public route/assets/bundle audit, distributed rate-limit configuration, consent separation and the five requested architecture/data/deployment/security/regulatory documents.

## Tests completed

| Check | Result |
| --- | --- |
| Navigator domain/AI tests | **26 passed, 0 failed** |
| Navigator TypeScript and production build | PASS |
| Existing web-app production build | PASS |
| Public manifest/client-bundle/asset audit | PASS; no internal pricing/admin/templates in public bundle |
| Public pages | 9 routes return HTTP 200 |
| Internal routes and assets on public app | 13 tested paths return HTTP 404, no login redirect |
| CN tests | 4/6/8 digits, spaces, hyphens, included/excluded/partial/conditional/invalid |
| Product tests | Korean/English, multiple candidates, material/form/use, no API key, mocked provider/JSON errors, deterministic scope of AI suggestions |
| Applicability | importer-wide 50t boundary, missing quantity, origin exclusions, electricity/hydrogen exception |
| Input/security | invalid types/consent, forged internal properties, expired/altered signatures, missing session, cross-origin and oversized requests |
| Application integration | real local public API -> signed internal API -> existing memory store -> admin |
| Retry behavior | identical retry returns same receipt and creates one record |
| Metadata regression | source/readiness/idempotency metadata survives internal pricing edits |
| Browser end-to-end | search -> applicability -> process -> readiness -> evidence -> prefilled form -> submission success |
| Contact persistence | retained during client navigation, absent from tab storage |
| Mobile | 320px and 390px on seven workflow pages, no document overflow |
| Browser errors | none during tested workflow |
| Documents | existing quote and contract render submitted company; actual Word downloads succeed |
| Legacy direct application | 2024 and optional site/country accepted; injected source/price removed; receipt-only response |
| Rate limiting | repeated searches return HTTP 429 |

The first extended browser run found a test-locator mismatch: exact text lookup included select-option text. Inspection confirmed the browser's accessible combobox names were correct. The test now uses the accessible role/name; the complete flow passed afterward.

## Evidence and reproduction

Commands and hosted pilot checks are in `CBAM_NAVIGATOR_PUBLIC_DEPLOYMENT.md`. Test scripts live under `navigator-app/tests`. Local results, build logs, desktop/mobile screenshots and synthetic Word outputs are under ignored `tmp/navigator-qa` and `tmp/navigator-*.log`. Source backups made before edits are under `tmp/navigator-baseline`.

The original `calculateCbamDays()` and cost-helper source was compared with the saved baseline and is unchanged. Existing P1173 and document generator source files were not rewritten. No real customer data or hosted records were used for tests.

## Deployment status / remaining inputs

**Not deployed.** No Netlify project was created, no live storage was written, and no repository was pushed. The current source directory has no `.git` metadata.

Before a pilot, configure the new Netlify project using package directory `navigator-app`, the private relay URL and shared signing key, session secret, managed Redis limits, and actual approved privacy retention/processor/contact text. The code disables hosted intake while required configuration is absent. Verify the real Netlify-to-Netlify relay, durable Blobs creation and trusted-IP/distributed-limit behavior in the pilot; local memory tests cannot validate those hosted settings.

The target public name is `lrqa-cbam-navigator`; availability is to be checked in Netlify. The existing internal site configuration remains. The source repository is public; private conversion is recommended before formal service operation and is an owner decision.

`CN CBAM codes.xlsx` was not present; no import from it was claimed. The scope master is not a full customs tariff and does not certify the existence of every syntactically valid CN code. Actual classification and final verification scope remain subject to confirmation.

## 2026-09-30 신청서 연결 검증

두 앱 production build, 단위 테스트 28개, 공개 번들 감사와 브라우저 통합검증 통과. 외부 신청 URL, 자동 입력, fragment 제거, 동의 후 접수, NAVIGATOR 출처·준비도·제품명 저장 확인. 기존 관리자와 Word 견적서·계약서 다운로드 및 320/390px 화면 검증 통과. 운영 배포는 수행하지 않음.
