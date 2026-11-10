import 'server-only';
import { readSamOutlookToken } from './samOutlookToken';

export function getSamOutlookSession(request: Request) {
  const header = request.headers.get('authorization') || '';
  return header.startsWith('Bearer ')
    ? readSamOutlookToken(header.slice(7), process.env.ISO_SESSION_SECRET || '')
    : null;
}
