# Outlook 조정 에이전트 수집기

개인 전용 조정 에이전트가 Outlook Web의 **전체 받은편지함(중요 + 기타)** 중 오늘 받은 메일만 읽어 요약·분류하고 회신 초안을 만드는 로컬 수집기입니다. 고정 메일은 제외합니다.

## 최초 설정

1. 사이트의 `조정 에이전트` 화면에서 `Outlook 수집기 연결`을 눌러 키를 발급합니다.
2. `outlook-coordination-sync.config.example.json`을 같은 폴더의 `outlook-coordination-sync.config.json`으로 복사하고 발급 키를 입력합니다.
3. 다음 명령을 실행하여 API 연결을 확인합니다.

```powershell
.\tools\outlook-coordination-sync\run-outlook-coordination-sync.cmd --check-api
```

4. 최초 한 번은 Edge 창을 표시해 회사 Outlook 로그인을 완료합니다.

```powershell
.\tools\outlook-coordination-sync\run-outlook-coordination-sync.cmd --visible
```

5. 정상 동작을 확인한 뒤 Windows 작업 스케줄러에 등록합니다.

```powershell
.\tools\outlook-coordination-sync\install-outlook-coordination-schedule.ps1
```

동일 이름의 기존 작업을 명시적으로 교체할 때만 `-Force`를 추가합니다.

## 예약 및 누락 실행

- 평일 `09:00`, `12:30`, `16:30`에 실행합니다.
- PC가 꺼져 있어 예약을 놓친 경우 Windows의 `StartWhenAvailable` 설정으로 가능한 즉시 시작합니다.
- 로그인 트리거도 함께 등록됩니다. 수집기는 마지막 성공 시각과 가장 최근 예약 시각을 비교해 놓친 실행만 보충하므로 중복 분석하지 않습니다.
- 주말에 로그인하면 마지막 평일 예약을 놓친 경우에만 한 번 보충합니다.

## 보안·운영 원칙

- 메일을 보내거나 삭제·이동하지 않고 캘린더를 수정하지 않습니다.
- 메일 본문은 AI 분석 요청에만 사용되며 서버 저장 데이터에는 포함되지 않습니다.
- 서버에는 제목, 발신자, 받은 시각, 요약, 분류, 기한, 추천 행동, 회신 초안, Outlook 링크만 저장합니다.
- 설정 파일의 수집기 키와 전용 Edge 로그인 프로필은 Git에서 제외됩니다.
- Outlook Web UI가 바뀌면 수집기 선택자를 조정해야 할 수 있습니다.
- 메시지를 열어 본문을 수집하므로 Outlook 설정에 따라 읽음 상태가 바뀔 수 있습니다.
