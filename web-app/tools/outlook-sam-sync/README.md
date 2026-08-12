# Outlook SAM Sync

New Outlook Web의 `SAM-AI 대상` 폴더만 읽어 SAM Business에 AI 진행현황 초안을 만드는 개인용 수집기입니다.

## 최초 설정

1. SAM Account 상세의 `Outlook Web 수집기 연결`에서 키를 만듭니다.
2. `outlook-sam-sync.config.example.json`을 복사해 `outlook-sam-sync.config.json`으로 이름을 바꾸고 키를 입력합니다.
3. 다음 명령을 한 번 실행해 전용 Edge 프로필에 Outlook Web 로그인을 완료합니다.

```powershell
.\tools\outlook-sam-sync\run-outlook-sam-sync.cmd --visible
```

4. 이후에는 창을 보이지 않게 실행합니다.

```powershell
.\tools\outlook-sam-sync\run-outlook-sam-sync.cmd
```

## 운영 원칙

- 수집기는 지정 폴더의 최근 대화만 읽으며 메일을 이동, 삭제, 읽음 처리하지 않습니다.
- 메일 본문은 AI 초안 생성 요청에만 전송되며, 앱에는 원문을 저장하지 않습니다.
- 동일 대화는 로컬 상태 파일과 서버 초안의 메시지 식별자로 중복 제외합니다.
- 로그인 세션이 만료되면 `--visible`로 다시 실행해 Outlook 로그인만 갱신합니다.
- Windows 작업 스케줄러에서 평일 09:00, 13:00, 17:00에 위 명령을 실행하면 됩니다.
