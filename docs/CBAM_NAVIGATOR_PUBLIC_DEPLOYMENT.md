> 2026-09-30 신청 흐름 변경: Navigator 검증 신청 버튼은 https://ketsquot-pigeon.netlify.app/cbam 으로 연결됩니다. URL fragment로 제품·CN 코드·사업장·생산공정·진단 답변·증빙 상태를 전달하고, 기존 신청서에서 검증 후 자동 입력하며 fragment를 제거합니다. 연락처와 동의는 기존 신청서에서 입력하며 접수 시 진단정보도 저장합니다. 서버가 점수를 재계산합니다. 링크 유효기간 30분, 최대 24,000자. 진단정보는 자기신고 자료입니다. 새로고침하면 메모리의 진단정보가 사라지므로 Navigator에서 다시 이동해야 합니다. 운영 연결에는 두 앱 모두 배포가 필요합니다. 아래 기존 독립 신청서·서명 릴레이 설명은 유지된 대체 API의 과거 설계이며 현재 기본 사용자 흐름에는 적용하지 않습니다. 공개 번들에서 신청서 호스트는 허용됩니다.

# Public and Internal Netlify deployment

This workspace prepares two independently buildable apps. No Netlify site was created or deployed by this implementation. The local folder has no `.git`; use the normal repository checkout/review process before publishing changes.

## PUBLIC

| Setting | Value |
| --- | --- |
| Project | new project; target `lrqa-cbam-navigator` if available |
| Repository | neod00/KETSQuot_pigeon |
| Package directory (Netlify UI) | **navigator-app** |
| Configuration | **navigator-app/netlify.toml**, verify this exact file in build logs |
| Base | navigator-app (in that configuration) |
| Build | npm ci && npm run build && npm run audit:public |
| Publish | .next relative to base |
| Framework plugin | @netlify/plugin-nextjs |
| Domain | https://lrqa-cbam-navigator.netlify.app if the name is available |

Set the **package directory**, not only the base directory: the existing repository-root configuration targets `web-app`. Netlify searches the package directory first. See [Netlify monorepo configuration](https://docs.netlify.com/build/configure-builds/monorepos/). If the resolved configuration is the root `netlify.toml`, stop the public deployment and correct project settings; do not deploy the internal app to the customer domain.

The build needs the complete repository because it copies only selected shared source from `web-app/src/lib`. Rebuild the public project when shared regulatory/schema code changes, even if changes are outside its base folder. Disable default changed-files skipping for shared changes or explicitly trigger both projects. Do not add internal templates, functions or asset directories to the public configuration.

Required server variables (never NEXT_PUBLIC):

- `NAVIGATOR_SESSION_SECRET`: independently generated random secret, minimum 32 characters.
- `NAVIGATOR_INTAKE_SECRET`: matching random secret on public and internal sites.
- `NAVIGATOR_INTAKE_URL`: HTTPS URL ending `/api/cbam/navigator-intake` on the existing internal site.
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`: managed Redis REST endpoint/credential for atomic distributed limits. Without these, hosted Netlify requests fail closed. In-memory counters are for local runs only.
- `NAVIGATOR_PRIVACY_RETENTION`, `NAVIGATOR_PRIVACY_PROCESSORS`, `NAVIGATOR_PRIVACY_CONTACT`: actual approved retention, processor/overseas-processing explanation and privacy contact. Intake is disabled until all three are supplied; do not use test text in a real deployment.
- Optional `OPENAI_API_KEY`, `OPENAI_CBAM_MODEL`: server-only product candidate discovery. The existing dictionary works without them.

The public site needs no admin credentials, pricing settings, Netlify Blobs token or internal document assets. It has no ability to list or edit stored applications. Provision secrets in Netlify environment settings, not Git. Do not copy local test credentials.

Public pages: `/`, `/cn-search`, `/applicability`, `/product-map`, `/readiness`, `/evidence`, `/application`, `/privacy`, `/legal`.

Blocked/absent: `/admin`, `/cbam/admin`, `/documents`, `/cbam/documents`, `/iso`, `/iso/login`, `/iso/setup`, `/system`, `/generator`, `/kets-contract`, `/internal`, internal APIs and templates. These should return 404, without a login redirect.

## INTERNAL

| Setting | Value |
| --- | --- |
| Project and domain | existing KETSQuot project; preserve its actual current name/domain |
| Base / package | web-app, existing configuration |
| Build | existing root: npm install && npm run build; nested configuration: npm run build |
| Publish | .next |
| Added variable | NAVIGATOR_INTAKE_SECRET, matching the public site |
| Existing variables | ISO_ADMIN_USERNAME, ISO_ADMIN_PASSWORD_SHA256, ISO_SESSION_SECRET and current service settings remain |
| Persistence | existing cbam-applications store in the internal site context |
| Policy | existing session-protected list/update/pricing/documents; signed create-only intake added |

Blobs are site-scoped. The public project must **not** create its own application store and assume the internal site can see it. All application creation happens on the internal site. The internal intake route has no GET, PUT, list or pricing response.

## Release order and pilot check

1. Review source changes in the actual Git checkout. Recommend changing the public repository to private before formal service operation; repository visibility was not changed automatically.
2. Deploy internal changes first with the new signing secret; verify existing admin, legacy applications, pricing, P1173 and documents.
3. Create/configure the new public project with package directory `navigator-app`. Check resolved configuration and route/bundle audit output. Confirm the desired site name in Netlify; alternatives: lrqa-cbam-korea, lrqa-korea-cbam, cbam-navigator-korea.
4. Configure secrets, distributed rate limiting and approved privacy information. Do a deploy preview first.
5. Submit an approved synthetic pilot application; confirm only a reference is returned and exactly one record is visible internally after retry. Verify diagnosis, source, metadata preservation after editing and quote/contract generation.
6. Verify the blocked routes and assets on the real public domain. Confirm forwarded client-IP behavior and 429 responses; verify AI credentials only if optional discovery is enabled.
7. Publish the verified public deployment. For rollback, restore the previous deployment of the affected site; optional fields remain compatible with legacy data. Do not delete the internal store.

Custom domain support uses relative links and request-origin checks. Add the approved domain in Netlify and update DNS/TLS; no hardcoded public hostname needs changing. The private relay URL changes only if the internal domain changes.

## Local checks

```powershell
cd web-app
npm ci
npm run build
cd ../navigator-app
npm ci
npm test
npm run build
npm run audit:public
npx tsx tests/integration.ts
```

Integration starts two localhost production servers (3100/3101), generates temporary test-only secrets in memory, submits synthetic data only to local memory, and launches headless Edge. It writes logs, results and screenshots under `tmp/navigator-qa`, closes its browser/servers and does not modify hosted records. Headless Edge must be installed; alternatively adapt the browser channel for an installed Playwright browser. Hosted persistence and Redis still require the pilot check above.

For a local UI preview, set a random `NAVIGATOR_SESSION_SECRET` and run `npm run dev` in navigator-app. Without configured relay/privacy information, the application step clearly indicates that online intake is not yet enabled.

Alternatively, after a build run `npm run preview`. This starts `http://localhost:3100` with an ephemeral local session key and explicitly disables relay, AI and personal-data intake. Stop it with Ctrl+C. It does not use hosted application credentials.
