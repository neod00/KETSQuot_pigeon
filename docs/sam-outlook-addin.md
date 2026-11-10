# SAM Outlook 추가기능

설치 파일: https://lrqa-korea-portal.netlify.app/outlook/sam-outlook.xml

## 설치 및 사용

1. 위 XML 파일을 PC에 저장합니다. 파일명은 `sam-outlook.xml`입니다.
2. https://aka.ms/olksideload 에 회사 Outlook 계정으로 접속합니다.
3. **내 추가 기능 → 사용자 지정 추가 기능 → 사용자 지정 추가 기능 추가 → 파일에서 추가**에서 XML을 선택하고 설치합니다.
4. 새 Outlook 또는 웹 Outlook에서 메일 한 통을 열고, **앱 / 추가 기능 → SAM → SAM 열기**를 선택합니다. 새 Outlook에 바로 나타나지 않으면 다시 시작합니다.
5. SAM 패널 상단의 고정 핀을 누릅니다. **SAM 연결**에서 기존 LRQA 업무 포털 관리자 계정으로 로그인합니다.
6. Account를 선택하고, 해당 Outlook 폴더의 메일을 SAM 패널 안으로 끌어 넣습니다. 미리보기를 확인한 뒤 **AI로 정리**를 누릅니다.
7. 생성한 초안을 SAM 웹사이트에서 검토·승인하여 이력에 반영합니다.

회사 정책으로 사용자 지정 추가기능 설치가 막혀 있으면 이 XML의 관리자 배포가 필요합니다. 사용자 지정 추가기능 설치가 허용되는지는 사용자의 실제 Outlook 계정에서 확인해야 합니다.

## 구현 범위

- Office.js `DragAndDropEvent`의 Blob을 `.eml` File로 변환하여 기존 EML/MSG 파서 및 중복 확인·AI 초안 API를 재사용합니다.
- 메일 원문은 사용자가 **AI로 정리**를 누를 때 기존 분석 API에 전송합니다. 첨부파일 내용은 분석하지 않습니다.
- Graph, 전달용 메일 주소, 백그라운드 메일함 조회를 사용하지 않습니다. 선택한 Account에 사용자가 가져온 메일만 처리합니다.
- 최대 30개, 파일당 10MB, 분석 본문 한도 24,000자입니다. Account를 바꾸면 준비 목록을 비웁니다.
- 공개 경로 `/outlook/sam`에는 로그인 전 업무 데이터가 없습니다. Office 대화상자에서 포털 관리자로 로그인하면 1시간 유효한 제한 토큰을 발급합니다.
- 토큰은 패널 메모리에만 보관하고, Account 이름 목록과 메일 초안 조회·생성에만 사용합니다. 일반 포털 로그인 쿠키와는 서명을 분리했습니다. 초안 승인·계정 관리·동기화 키 발급에는 사용할 수 없습니다.
- 대화상자의 응답은 원본 도메인과 연결별 nonce를 검증합니다. 기존 포털 쿠키의 SameSite/HttpOnly 정책은 유지합니다.
- 매니페스트 권한은 `ReadItem`이며, 메시지 읽기 화면의 명령과 고정 가능한 패널을 제공합니다.

## 검증

- Microsoft `office-addin-manifest validate`의 XML 스키마 및 필수 요소 검사 통과.
- TypeScript, 변경 코드 ESLint, Next.js 운영 빌드 통과.
- 메일 파싱·중복 확인·접근 제한·토큰 만료/위변조·대화상자 출처 검증 총 17개 테스트 통과.
- `tools/sam-outlook-browser.mjs`: 실제 로컬 인증 API와 테스트 계정으로 로그인, Office 대화상자 연결, Account 선택, Blob 드래그, 업로드 전송, 초안 표시, 연결 해제 검증. 400px 패널에서 가로 넘침과 브라우저 오류 없음.
- 브라우저 테스트의 Office 호스트 및 AI 응답은 모의 처리입니다. 실제 회사 Outlook의 설치 정책과 실제 메일 드래그는 사용자 환경에서 별도 확인해야 합니다.
- `tools/verify-sam-outlook-deployment.mjs <배포 URL>`: 배포된 XML 본문/다운로드 헤더, 패널 페이지, 아이콘 크기, 공개 경로와 인증 제한을 검사합니다. 운영 업무 데이터는 읽거나 쓰지 않습니다.

공식 문서: https://learn.microsoft.com/en-us/office/dev/add-ins/outlook/drag-drop-items

설치 안내: https://learn.microsoft.com/en-us/office/dev/add-ins/outlook/sideload-outlook-add-ins-for-testing
