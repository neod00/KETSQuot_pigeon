import type { Address } from 'postal-mime';

export const MAX_SAM_MAIL_FILES = 30;
export const MAX_SAM_MAIL_FILE_BYTES = 10 * 1024 * 1024;
export type ParsedSamMail = { id: string; subject: string; from: string; to: string; receivedAt: string; body: string; format: 'eml' | 'msg'; warnings: string[] };
const address = (value?: Address): string => !value ? '' : value.group ? value.group.map(address).join(', ') : [value.name, value.address].filter(Boolean).join(' ');
const plainHtml = (value: string) => value.replace(/<(script|style)[\s\S]*?<\/\1>/gi, '').replace(/<br\s*\/?>|<\/(p|div|li|tr)>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/gi, ' ').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#39;/g, "'").replace(/&amp;/gi, '&').trim();

export async function parseSamMailFile(file: File): Promise<ParsedSamMail> {
  const format = file.name.toLowerCase().endsWith('.eml') ? 'eml' : file.name.toLowerCase().endsWith('.msg') ? 'msg' : null;
  if (!format) throw new Error('.eml 또는 .msg 메일 파일을 선택해 주세요.');
  if (!file.size) throw new Error('비어 있는 파일입니다. Outlook에서 메일을 다시 저장해 주세요.');
  if (file.size > MAX_SAM_MAIL_FILE_BYTES) throw new Error('파일당 최대 10MB까지 올릴 수 있습니다.');
  const raw = await file.arrayBuffer();
  let result: ParsedSamMail;
  if (format === 'eml') {
    const { default: PostalMime } = await import('postal-mime');
    const mail = await PostalMime.parse(raw);
    if (!mail.headers.some(header => ['from', 'subject', 'date', 'message-id'].includes(header.key))) throw new Error('메일 형식을 확인할 수 없습니다. Outlook에서 저장한 메일 파일을 올려 주세요.');
    result = { id: mail.messageId || '', subject: mail.subject || file.name, from: address(mail.from), to: (mail.to || []).map(address).join(', '), receivedAt: mail.date || '', body: mail.text?.trim() || plainHtml(mail.html || ''), format, warnings: mail.attachments.length ? ['첨부파일 내용은 분석에서 제외됩니다.'] : [] };
  } else {
    const module = await import('@kenjiuno/msgreader');
    const exported = module.default;
    const MsgReader = typeof exported === 'function' ? exported : (exported as unknown as { default: typeof module.default }).default;
    const mail = new MsgReader(raw).getFileData();
    if (mail.error || mail.dataType !== 'msg') throw new Error('MSG 파일을 읽지 못했습니다. Outlook에서 메일을 다시 저장해 주세요.');
    result = { id: mail.messageId || '', subject: mail.subject || file.name, from: [mail.senderName, mail.senderSmtpAddress || mail.senderEmail].filter(Boolean).join(' '), to: (mail.recipients || []).map(person => [person.name, person.smtpAddress || person.email].filter(Boolean).join(' ')).join(', '), receivedAt: mail.messageDeliveryTime || mail.clientSubmitTime || '', body: mail.body?.trim() || plainHtml(mail.bodyHtml || (mail.html ? new TextDecoder().decode(mail.html) : '')), format, warnings: mail.attachments?.length ? ['첨부파일 내용은 분석에서 제외됩니다.'] : [] };
  }
  if (!result.body) throw new Error('읽을 수 있는 본문이 없습니다. 암호화 또는 RTF 전용 메일은 Outlook에서 본문이 포함된 .eml로 저장해 다시 올려 주세요.');
  if (!result.id) {
    const digest = await crypto.subtle.digest('SHA-256', raw);
    result.id = `sha256:${Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')}`;
  }
  return result;
}
