export type ParsedSamEml = {
  id: string;
  subject: string;
  from: string;
  to: string;
  receivedAt: string;
  body: string;
};

const decodeQuotedPrintable = (value: string) => value
  .replace(/=\r?\n/g, '')
  .replace(/=([0-9A-F]{2})/gi, (_, hex: string) => String.fromCharCode(Number.parseInt(hex, 16)));

const decodeBase64 = (value: string) => {
  try {
    return decodeURIComponent(Array.from(atob(value.replace(/\s/g, ''))).map((character) => `%${character.charCodeAt(0).toString(16).padStart(2, '0')}`).join(''));
  } catch {
    return value;
  }
};

const decodeHeader = (value: string) => value.replace(/=\?([^?]+)\?([bqBQ])\?([^?]*)\?=/g, (_, charset: string, encoding: string, encoded: string) => {
  const decoded = encoding.toLowerCase() === 'b'
    ? decodeBase64(encoded)
    : decodeQuotedPrintable(encoded.replace(/_/g, ' '));
  try {
    return new TextDecoder(charset).decode(new TextEncoder().encode(decoded));
  } catch {
    return decoded;
  }
});

const unfold = (value: string) => value.replace(/\r?\n[ \t]+/g, ' ');

const headerValue = (headers: string, name: string) => {
  const match = unfold(headers).match(new RegExp(`^${name}:\\s*(.+)$`, 'im'));
  return decodeHeader(match?.[1]?.trim() || '');
};

const stripHtml = (value: string) => value
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<\/p>|<\/div>|<\/li>|<\/tr>/gi, '\n')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>')
  .replace(/&#39;/gi, "'")
  .replace(/&quot;/gi, '"')
  .replace(/\n\s*\n\s*\n+/g, '\n\n')
  .replace(/[ \t]{2,}/g, ' ')
  .trim();

const splitParts = (body: string, boundary: string) => body
  .split(new RegExp(`(?:^|\\r?\\n)--${boundary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:--)?(?:\\r?\\n|$)`))
  .filter((part) => part.trim());

type MimeBodyPart = { kind: 'plain' | 'html'; content: string };

const bodyFromPart = (part: string): MimeBodyPart | null => {
  const separator = part.search(/\r?\n\r?\n/);
  if (separator < 0) return null;
  const headers = part.slice(0, separator);
  const rawBody = part.slice(separator).replace(/^\r?\n\r?\n/, '');
  const contentType = headerValue(headers, 'content-type').toLowerCase();
  const boundary = contentType.match(/boundary=["']?([^"';\s]+)["']?/i)?.[1];
  if (contentType.startsWith('multipart/') && boundary) {
    const parts = splitParts(rawBody, boundary).map(bodyFromPart).filter((item): item is MimeBodyPart => Boolean(item));
    return parts.find((item) => item.kind === 'plain') || parts.find((item) => item.kind === 'html') || null;
  }
  const encoding = headerValue(headers, 'content-transfer-encoding').toLowerCase();
  if (!contentType.startsWith('text/plain') && !contentType.startsWith('text/html')) return null;
  const decoded = encoding === 'base64'
    ? decodeBase64(rawBody)
    : encoding === 'quoted-printable'
      ? decodeQuotedPrintable(rawBody)
      : rawBody;
  return { kind: contentType.startsWith('text/html') ? 'html' : 'plain', content: decoded };
};

export async function parseSamEml(file: File): Promise<ParsedSamEml> {
  const raw = await file.text();
  const separator = raw.search(/\r?\n\r?\n/);
  const headers = separator < 0 ? raw : raw.slice(0, separator);
  const rawBody = separator < 0 ? '' : raw.slice(separator).replace(/^\r?\n\r?\n/, '');
  const contentType = headerValue(headers, 'content-type');
  const boundary = contentType.match(/boundary=["']?([^"';\s]+)["']?/i)?.[1];
  const parts = boundary
    ? splitParts(rawBody, boundary).map(bodyFromPart).filter((part): part is MimeBodyPart => Boolean(part))
    : [bodyFromPart(`${headers}\n\n${rawBody}`)].filter((part): part is MimeBodyPart => Boolean(part));
  const best = parts.find((part) => part.kind === 'plain') || parts.find((part) => part.kind === 'html');
  const body = best?.kind === 'html' ? stripHtml(best.content) : (best?.content || '').replace(/\r\n/g, '\n').trim();
  const messageId = headerValue(headers, 'message-id') || `${file.name}:${file.size}:${file.lastModified}`;
  return {
    id: messageId,
    subject: headerValue(headers, 'subject') || file.name.replace(/\.eml$/i, ''),
    from: headerValue(headers, 'from'),
    to: headerValue(headers, 'to'),
    receivedAt: headerValue(headers, 'date'),
    body,
  };
}
