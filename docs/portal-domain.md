# 포털 주소

주 운영 주소는 https://lrqa-korea-portal.netlify.app 이다. 2026-10-28 기존 Netlify 프로젝트의 이름을 변경했으며, 프로젝트 ID `0e8094dc-c1d1-4100-848e-f37af61c8388`와 고객 데이터 저장소는 동일하다. 주소별 브라우저 쿠키가 분리되므로 새 주소에서 다시 로그인한다.

- 기존고객: https://lrqa-korea-portal.netlify.app/hyundai-ghg/existing
- 신규고객: https://lrqa-korea-portal.netlify.app/hyundai-ghg/new
- 내부 관리: https://lrqa-korea-portal.netlify.app/hyundai-ghg/admin

예전 주소 `ketsquot-pigeon.netlify.app`는 별도 호환 프로젝트 `2b634915-77fb-44b8-85e9-f5bd8606ba45`가 보관한다. 이 프로젝트는 고객 데이터나 로그인 키를 저장하지 않는다. 일반 페이지는 동일 경로의 새 주소로 301 이동하며 쿼리를 유지한다. `/api/*`는 200 프록시로 전달해 기존 Outlook 수집기의 POST 본문과 사용자 정의 인증 헤더를 유지한다. 실제 인증과 데이터 저장은 원래 운영 프로젝트에서 처리한다. 새로 공유하는 링크와 수집기 설정에는 새 주소를 사용한다.

호환 프로젝트의 배포 소스는 `deployment/legacy-redirect`다. 변경할 때는 해당 폴더에서 `netlify deploy --no-build --prod --dir public --site 2b634915-77fb-44b8-85e9-f5bd8606ba45`를 실행한다. 주 포털의 Next.js 빌드와 함수는 이 프로젝트에 배포하지 않는다.

새 주소에서 `web-app/tools/verify-hyundai-deployment.mjs` 검사 통과. 예전 주소의 홈·기존/신규 신청서·P827·CBAM 이동 및 쿼리 보존, 필수값이 빠진 API 요청의 400 반환을 확인했다. 유효한 신청서를 운영에 시험 제출하지 않았다.

내부 링크 변경분의 운영 배포 ID는 `6ae0bcb9062fa640263933be`, 호환 프로젝트의 배포 ID는 `6ae0bbc0d329722860df388b`다. 코드에 있는 CBAM 신청 및 알림 링크와 Outlook 수집기 예시 설정은 새 주소를 사용한다.

## 분야별 접이식 메뉴 배포 (2026-11-04 KST)

운영 배포 ID는 `6ae9ff7ae42f74e74490e6e1`이다. 홈·상세 화면의 공통 접이식 메뉴, 권한별 영업·관리 메뉴, CBAM 내부 탭 연결과 계정의 화면 설정을 반영했다. 미리보기 검증을 통과한 배포본을 `restoreSiteDeploy`로 운영에 게시했으며 운영 주소에서도 같은 검사를 통과했다.

읽기 전용 검증: 저장소 루트에서 `node web-app/tools/verify-portal-navigation-deployment.mjs https://lrqa-korea-portal.netlify.app`. 공개 페이지 5개, 보호된 화면 4개, 비인증 API 2개와 메뉴 번들 2개의 SHA-256 일치를 확인한다. 고객 데이터를 쓰지 않는다.

Windows Netlify CLI 배포 주의: 루트에서 빌드하면 Edge 산출물은 `web-app/.netlify/edge-functions-dist`에 생성되지만 CLI 업로드는 실행 폴더의 `.netlify/edge-functions-dist`를 읽는다. 최신 산출물의 실제 `.eszip` 파일과 `manifest.json`을 업로드 경로에 함께 포함해야 한다. Windows Junction은 이 CLI의 업로드 탐색에서 제외되므로 사용하지 않는다. 업로드 로그에 `edge functions`가 포함되고, 미리보기에서 보호된 화면이 307·API가 401·공개 신청서가 200인지 확인한 뒤에만 게시한다. `--no-build`로 원시 `.next` 폴더를 올리면 서버 산출물이 포함되거나 함수 패키징이 달라질 수 있으므로 전체 빌드 미리보기 검증을 우선한다.

## SAM 메일 업로드 배포 (2026-11-04 KST)

운영 배포 ID는 `6aeb377c03553872a4742340`이다. Account별 .eml/.msg 파일 업로드와 AI 초안 기능을 배포했다. 미리보기 및 운영에서 공개·보호 경로, 메뉴 번들, SAM 업로드 번들 일치를 검증했다. 실제 회사 Outlook 드래그와 고객 메일 업로드는 수행하지 않았다.

## SAM Outlook 추가기능 배포 (2026-11-08 KST)

운영 배포 ID는 `6af063cb4574526ade3ad352`이다. `/outlook/sam-outlook.xml` 설치 파일과 `/outlook/sam` 작업 패널을 배포했다. Office.js 메일 드래그, 포털 관리자 로그인 대화상자, 제한 토큰, Account 선택, 기존 AI 초안 처리를 연결했다. XML은 Microsoft 매니페스트 검사를 통과했으며 클릭하면 파일로 저장되도록 Netlify 헤더를 지정했다.

검증 배포를 게시한 뒤 운영에서 `verify-sam-outlook-deployment.mjs`와 `verify-portal-navigation-deployment.mjs`를 모두 통과했다. 실제 회사 Outlook 설치와 고객 메일 업로드는 수행하지 않았다. 설치·구현·테스트 범위는 `docs/sam-outlook-addin.md`에 정리했다.

## 현대차 GHG 견적 PDF 정렬 수정 (2026-11-09 KST)

운영 배포 ID는 `6af14db950882e96c1c4f4df`이다. P827 견적 PDF 4페이지의 숫자와 비고를 배경 이미지의 실제 표 행 경계에 맞춰 세로 중앙 정렬했다. Additional Notes의 고정 배경 문구를 포함한 안내문을 하나의 목록으로 배치하고, 견적 유효기간 문구도 제목 아래에 배치해 기존 문구와의 겹침을 제거했다.

표준 금액/VAT 별도와 긴 금액/VAT 포함의 9페이지 PDF를 생성해 4페이지를 렌더링·검수했다. 실제 배경 가로선과 PDF 텍스트 좌표를 비교해 표 안의 모든 텍스트가 행 안에 들어감을 확인했다. 현대차 GHG 테스트 10개 통과(기존 선택적 HTTP 테스트 1개 건너뜀), ESLint 및 운영 빌드 통과. 검증 배포와 운영 주소 모두 `verify-p827-quote-deployment.mjs`, `verify-hyundai-deployment.mjs`를 통과했다. 운영 고객 데이터는 읽거나 쓰지 않았다.

## 견적 마지막 페이지 및 비고 글꼴 수정 (2026-11-09 KST)

운영 배포 ID는 `6af15227a5264cad8d8782c6`이다. 9페이지 담당자 영역을 배경의 ‘인증문의·사업개발실’ 아래로 옮기고 이름·전화·휴대전화·이메일을 문서 흐름으로 배치했다. 4페이지 비고 열은 원본 Word 템플릿의 ‘기술검토 포함’과 같은 맑은 고딕 9pt 보통 굵기로 통일했다. 고정 배경 문구를 셀 안에서 가리고 네 비고 문구를 동일한 HTML 서식으로 출력하므로 VAT의 영문도 같은 글꼴을 사용한다.

표준·긴 연락처 및 금액 조건에서 PDF를 생성해 4·9페이지를 렌더링 검수했다. 연락처의 제목 영역 침범·줄 겹침과 비고 서식 일치를 자동 검사했다. 현대차 GHG 테스트 10개, ESLint, 운영 빌드가 통과했고 검증 배포와 운영에서 출력 번들의 SHA-256 일치와 현대차 GHG 경로 검사를 통과했다. 첫 배포의 Netlify 정적 파일 게시 오류는 재배포로 해결했다. 운영 고객 데이터는 읽거나 쓰지 않았다.
