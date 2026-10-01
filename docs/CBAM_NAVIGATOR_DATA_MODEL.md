> 2026-09-30 신청 흐름 변경: Navigator 검증 신청 버튼은 https://ketsquot-pigeon.netlify.app/cbam 으로 연결됩니다. URL fragment로 제품·CN 코드·사업장·생산공정·진단 답변·증빙 상태를 전달하고, 기존 신청서에서 검증 후 자동 입력하며 fragment를 제거합니다. 연락처와 동의는 기존 신청서에서 입력하며 접수 시 진단정보도 저장합니다. 서버가 점수를 재계산합니다. 링크 유효기간 30분, 최대 24,000자. 진단정보는 자기신고 자료입니다. 새로고침하면 메모리의 진단정보가 사라지므로 Navigator에서 다시 이동해야 합니다. 운영 연결에는 두 앱 모두 배포가 필요합니다. 아래 기존 독립 신청서·서명 릴레이 설명은 유지된 대체 API의 과거 설계이며 현재 기본 사용자 흐름에는 적용하지 않습니다. 공개 번들에서 신청서 호스트는 허용됩니다.

# Navigator data and API contracts

## Existing application

`CbamApplicationInput` is preserved and re-exported from `cbam.ts`; its definition is isolated in `cbam-input.ts` so the public app cannot accidentally import the price/day engine. Existing default applications and calculations are unchanged.

Optional `StoredCbamApplication` additions:

| Field | Meaning |
| --- | --- |
| `source` | DIRECT or NAVIGATOR; absent on legacy records |
| `navigatorSessionId` | `NAV-` plus random UUID v4 |
| `leadStage` | NAVIGATOR / APPLICATION_STARTED / APPLICATION_SUBMITTED / QUOTE / CONTRACT |
| `navigatorData` | product, searched codes, responses, computed readiness, gaps, evidence statuses, timestamps |
| `marketingConsent` | separate optional consent, default unchecked in UI |
| `privacyNoticeVersion`, `consentedAt` | version and server receipt time |
| `intakeDigest` | canonical content digest used to reject changed content with the same request ID |

No migration, separate CRM or new application store is needed. QUOTE and CONTRACT are supported type values, not an assertion that merely opening/printing a draft completes that business stage. This MVP records APPLICATION_SUBMITTED after successful creation.

## Mapping

| Earlier answer | Application field |
| --- | --- |
| Selected CN | cnCodes |
| CN rule sector | cbamGoods |
| Confirmed origin country | country (OTHER requires actual input) |
| Applicant role | clientType |
| Site and process text | sites, productionProcesses |
| Application contact, year and quantities | existing corresponding fields |

Product name, search history, readiness and evidence status remain in Navigator metadata. Counts are never derived from the number of search suggestions. All boolean/enum calculation answers require explicit customer selection. Optional numerical values may remain blank. No contact data is sent when simply searching.

## Public APIs

All paths begin `/api/public/cbam/`, have no GET/list/update handlers, use `Cache-Control: no-store`, bounded JSON bodies and same-origin checks.

| POST path | Request | Response |
| --- | --- | --- |
| session | empty JSON | sessionId; signed HttpOnly cookie |
| cn-search | kind=codes with codes, or kind=product with productName/material/form/use | assessment DTOs/candidates and fixed regulatory review date |
| application | application, navigatorData, marketingConsent, privacyNoticeVersion; `Idempotency-Key` header | reference only |
| events | one allowlisted event name | recorded flag |

`parseIntake` is called independently on both public and internal servers. It constructs a whitelist DTO, rejects malformed types/limits and recalculates readiness. Client-provided prices, scores, source and arbitrary internal properties are not trusted.

## Server relay

`NAVIGATOR_INTAKE_URL` is private server configuration. The public server POSTs canonical JSON with a random request ID, a timestamp and HMAC-SHA256 signature. The internal endpoint accepts a five-minute timestamp window and validates signatures in constant time. The derived receipt key is stable for the session/request pair. Netlify Blobs `onlyIfNew` makes concurrent retries create at most one record; a content digest prevents different payloads reusing the key. The shared signing secret must be at least 32 characters.

Internal PUT always preserves source, diagnostic/consent metadata and idempotency digest from the existing record. It keeps the existing manual price calculation path.

## Events and persistence

All 12 required event names are allowlisted. Anonymous event logs contain only event name and timestamp, no session ID, contact information, product/search text or IP. They are operational counts rather than a person-level analytics database. No unsent personal lead is persisted. Browser contacts remain in memory until submission or tab closure; diagnostic-only tab storage is best-effort and survives navigation/reload within the valid anonymous session.
