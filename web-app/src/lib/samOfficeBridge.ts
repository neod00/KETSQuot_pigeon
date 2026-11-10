export function samOfficeDroppedFiles(event: Office.DragAndDropEventArgs): File[] {
  const data = event.dragAndDropEventData;
  if (data.type !== 'drop') return [];
  return data.dataTransfer.files.map(file => {
    if (!file.fileContent || typeof file.fileContent.arrayBuffer !== 'function') throw new Error('Outlook에서 메일 내용을 받지 못했습니다. 메일을 다시 끌어 넣어 주세요.');
    return new File([file.fileContent], file.name, { type: file.type || 'message/rfc822' });
  });
}

export function readSamOutlookDialogMessage(message: string, origin: string | undefined, expectedOrigin: string, nonce: string) {
  if (origin !== expectedOrigin || message.length > 8192) return null;
  try {
    const data = JSON.parse(message);
    if (data.type !== 'sam-outlook-connected' || data.nonce !== nonce || typeof data.token !== 'string' || !data.token ||
      typeof data.username !== 'string' || !Number.isFinite(data.expiresAt) || data.expiresAt <= Date.now()) return null;
    return { token: data.token as string, expiresAt: data.expiresAt as number, username: data.username as string };
  } catch { return null; }
}

let loading: Promise<typeof Office> | undefined;
export function loadSamOffice(): Promise<typeof Office> {
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const pushState = window.history.pushState;
    const replaceState = window.history.replaceState;
    const timer = window.setTimeout(() => reject(new Error('Outlook 연결을 확인하지 못했습니다. Outlook의 SAM 추가기능에서 패널을 다시 열어 주세요.')), 20_000);
    const ready = () => {
      window.history.pushState = pushState;
      window.history.replaceState = replaceState;
      Office.onReady(() => { window.clearTimeout(timer); resolve(Office); });
    };
    if (typeof Office !== 'undefined') { ready(); return; }
    const script = document.createElement('script');
    script.src = 'https://appsforoffice.microsoft.com/lib/1/hosted/office.js';
    script.onload = ready;
    script.onerror = () => { window.clearTimeout(timer); reject(new Error('Microsoft Outlook 연결 스크립트를 불러오지 못했습니다. 패널을 다시 열어 주세요.')); };
    document.head.appendChild(script);
  });
  return loading;
}
