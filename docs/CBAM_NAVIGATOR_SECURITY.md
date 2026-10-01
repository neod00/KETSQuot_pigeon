> 2026-09-30 신청 흐름 변경: Navigator 검증 신청 버튼은 https://ketsquot-pigeon.netlify.app/cbam 으로 연결됩니다. URL fragment로 제품·CN 코드·사업장·생산공정·진단 답변·증빙 상태를 전달하고, 기존 신청서에서 검증 후 자동 입력하며 fragment를 제거합니다. 연락처와 동의는 기존 신청서에서 입력하며 접수 시 진단정보도 저장합니다. 서버가 점수를 재계산합니다. 링크 유효기간 30분, 최대 24,000자. 진단정보는 자기신고 자료입니다. 새로고침하면 메모리의 진단정보가 사라지므로 Navigator에서 다시 이동해야 합니다. 운영 연결에는 두 앱 모두 배포가 필요합니다. 아래 기존 독립 신청서·서명 릴레이 설명은 유지된 대체 API의 과거 설계이며 현재 기본 사용자 흐름에는 적용하지 않습니다. 공개 번들에서 신청서 호스트는 허용됩니다.

# Navigator security review

## Baseline findings

- GitHub metadata checked on 2026-09-29: repository is **public**. Recommendation: owner-controlled private conversion before formal customer operation. Visibility was not changed.
- Source snapshot contains internal quote/contract/P1173 templates and calculation details. They must not be copied to public build assets. Public Git history can still expose these independent of HTTP route protection.
- The old public application POST returned the full stored record including internal calculated values. The response now contains only the receipt in its existing `application.reference` shape.
- No known plaintext API/private-key patterns were found by the scoped source scan. This is not a complete history/secret audit: the local snapshot lacks `.git`, and hosted environment values were not read. Never print secret values; report any discovered leak as `SECRET_ROTATION_REQUIRED` and rotate at the owner/provider.
- Required source imports were missing from package.json; dependencies and lockfiles were repaired without changing the calculation formula.

## Controls

1. Separate application/build root. Public route manifests and generated client bundles are audited. Only the LRQA logo is copied from public assets.
2. No customer browser calls to the internal hostname. Private relay endpoint and secret stay server-side. Public API responses use explicit DTOs and do not echo storage records.
3. Create-only internal endpoint checks HMAC-SHA256, five-minute freshness and bounded request bodies. POST is the only method exempted from proxy session requirements. The handler itself authenticates every request.
4. Idempotency uses a keyed reference and Blobs atomic `onlyIfNew`; duplicate requests cannot overwrite earlier data. Different content with the same request ID is rejected.
5. Signed random HttpOnly/SameSite session cookies; production Secure cookies. Session ID contains no contact information. Same-origin checks and no permissive CORS headers.
6. Distributed Redis INCR/EXPIRE counters with bounded lifetimes. Search: 120/IP/hour, 60/session/hour. AI: 10/IP/day and 5/session/day. Intake: 12/IP/hour and 6/session/hour. Events: 180/IP/hour. New session requests: 60/IP/hour. Netlify's trusted `x-nf-client-connection-ip` is used, not arbitrary `x-forwarded-for`. If unavailable, requests share an unknown-IP bucket. Provider failure fails closed.
7. Dictionary first, bounded in-process result cache, optional AI only on dictionary miss. No model names, keys or diagnostic/provider errors in public responses. AI does not decide legal scope; returned candidates are assessed by the deterministic engine.
8. Bounded streamed request bodies, explicit field types/lengths/enums, server score recomputation. Unknown properties are dropped. React renders customer text without HTML injection.
9. Separate required privacy and optional marketing consent. No contact fields in anonymous event logs. Free-text diagnostics and contacts are kept only in React memory before submission; codes/answers can persist in the current tab.
10. No background emails or CRM records. Event payloads accept only allowlisted names. CSP denies object embedding, framing, external form submissions and unexpected connection origins.

## Remaining operational work

- Approve LRQA brand usage, service wording, actual privacy retention/processor/overseas-processing terms and contact channel. The app deliberately does not invent these values.
- Configure and smoke-test real Netlify/Redis environments. The implementation's local memory test is not a hosted-data acceptance test.
- Audit Netlify default access-log retention and any organization analytics; application logs themselves omit contact/search data.
- Review hosted project access and repository history. Public routes alone do not secure a public source repository containing internal business material.
- Protect environment secrets, rotate relay/session/Redis credentials using the organization's process. Rotating the relay key changes derived reference keys; avoid retries across a key rotation without reviewing receipts.
- Unknown counts remain empty in saved applications. Existing preliminary estimator behavior remains; scope and final prices require internal review.

No request to change repository visibility, purchase services, send messages or publish production content was executed.
