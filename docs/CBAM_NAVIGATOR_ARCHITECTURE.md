> 2026-09-30 신청 흐름 변경: Navigator 검증 신청 버튼은 https://ketsquot-pigeon.netlify.app/cbam 으로 연결됩니다. URL fragment로 제품·CN 코드·사업장·생산공정·진단 답변·증빙 상태를 전달하고, 기존 신청서에서 검증 후 자동 입력하며 fragment를 제거합니다. 연락처와 동의는 기존 신청서에서 입력하며 접수 시 진단정보도 저장합니다. 서버가 점수를 재계산합니다. 링크 유효기간 30분, 최대 24,000자. 진단정보는 자기신고 자료입니다. 새로고침하면 메모리의 진단정보가 사라지므로 Navigator에서 다시 이동해야 합니다. 운영 연결에는 두 앱 모두 배포가 필요합니다. 아래 기존 독립 신청서·서명 릴레이 설명은 유지된 대체 API의 과거 설계이며 현재 기본 사용자 흐름에는 적용하지 않습니다. 공개 번들에서 신청서 호스트는 허용됩니다.

# LRQA CBAM Navigator architecture

## Scope and baseline

Analysis date: 2026-09-29. The supplied folder is a source snapshot, not a Git checkout. GitHub metadata reports `neod00/KETSQuot_pigeon` as public. No repository visibility or remote deployment was changed.

The existing application is `web-app` (Next.js 16 / React 19 / TypeScript). `/cbam` posts to `/api/cbam/applications`; `calculateCbamDays()` and `estimateCbamCost()` run on the server, and records are saved to the `cbam-applications` Netlify Blobs store. Local development uses the existing process memory fallback. `/cbam/admin` reads and edits applications and pricing; `/cbam/documents` produces quotes/contracts. P1173 editing and document generators are retained.

Before implementation the application, admin, CN checker, P1173 editor, documents, both CBAM APIs, `cbam.ts`, `cbam-cn.ts`, `isoAuth.ts`, `proxy.ts`, and both Netlify configurations were reviewed. The pre-change report was given in chat before modifications.

## Gaps and decisions

| Baseline gap | Implementation |
| --- | --- |
| Public and internal screens in one deployment | Separate `navigator-app` build root |
| Public application response included cost and days | Existing response retains `application.reference` only; Navigator returns `reference` only |
| Internal-only CN API | Dedicated public search handler with an independent DTO |
| Rules mixed with engine | Separate `cbam-cn-data.ts` data module and `cbam-cn.ts` functions |
| Product AI coupled to internal route | Extract existing AI discovery into `cbam-product-search.ts`; public flow uses dictionary first |
| Separate Netlify sites have separate Blobs contexts | Public server relays signed create-only requests to the internal site |
| No Navigator lead context | Optional metadata on existing records; admin summary |
| PUT could discard new metadata | Preserve metadata from current stored record |
| Local PUT inserted duplicate rows | Replace matching reference in the existing memory store |
| Package manifest lacked packages imported by source | Restore actual dependencies and update lockfile |

## Deployment boundary

```text
Browser -> navigator-app Public Site
  /api/public/cbam/cn-search -> shared CN engine and dictionary -> optional AI
  /api/public/cbam/application
     -> server-only signed request
     -> Internal /api/cbam/navigator-intake
     -> existing calculateCbamDays / cbam-applications
     -> existing admin / pricing / quote / contract
```

The public app has no dependency on `cbam.ts`, `isoAuth.ts`, internal routes, pricing modules, templates or the internal store. The build copies a strict allowlist of shared modules and the existing LRQA logo. Generated shared files are ignored in Git and reconstructed before builds; the authoritative implementation remains under `web-app/src/lib`. The build audit checks page/API manifests, browser bundles and public assets.

## Routes

Public: `/`, `/cn-search`, `/applicability`, `/product-map`, `/readiness`, `/evidence`, `/application`, `/privacy`, `/legal`. The dynamic page explicitly checks its finite route list; unknown routes return 404. APIs are POST-only session, search, application and event endpoints under `/api/public/cbam/`.

Internal routes remain in `web-app`: `/cbam/admin`, `/cbam/documents`, ISO, system, generator and contract features. The proxy grants access to the signed intake endpoint only for POST; its handler authenticates the HMAC. Existing authentication is unchanged.

## Customer flow and limits

Korean-first UI, slate/teal styling, existing brand asset, responsive layouts and keyboard controls. Context preserves earlier inputs across navigation; contacts/free text remain in memory. Only diagnostic codes/answers and the anonymous session ID persist in tab storage. Refreshing clears contact fields intentionally. A signed HttpOnly cookie anchors the anonymous session.

Readiness has 24 equally weighted questions in six categories, with 1/0.5/0 points for ready/partial/missing. The server recomputes scores; incomplete questionnaires do not get a completed score. Evidence is status tracking, not file upload. The app provides general preparation information, not individual methods, monitoring plans or reports.

All material calculation inputs are user-selected. Unknown optional quantities remain empty; the existing estimator interprets empty values as before. Admin must confirm scope before final pricing. No claim is made that the preliminary estimate is a verified scope decision.

## Regression risk and verification

Shared CN parsing now preserves `7318 15 90` as one code and rejects letters instead of stripping them. Arrays/exclusions and the day/cost formula are retained. Optional metadata requires no migration. Missing arrays or malicious properties are rejected/stripped at the new intake boundary. P1173 and quote/contract generators are not rewritten.

Run domain tests, both builds, public bundle audit, and the local two-server integration script documented in the deployment guide. Real Netlify-to-Netlify authentication, managed Redis limits and durable Blobs need a pilot smoke test after configuration; local process-memory tests cannot prove hosted configuration.
