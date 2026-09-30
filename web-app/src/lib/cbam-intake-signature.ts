import { createHmac, timingSafeEqual } from 'node:crypto';
export function signIntake(body: string, timestamp: string, secret: string) {
  return createHmac('sha256', secret).update(`navigator-intake-v1\n${timestamp}\n${body}`).digest('hex');
}
export function verifyIntake(body: string, timestamp: string, signature: string, secret: string, now = Date.now()) {
  if (secret.length < 32 || !/^\d{13}$/.test(timestamp) || !/^[a-f0-9]{64}$/.test(signature) || Math.abs(now - Number(timestamp)) > 300_000) return false;
  return timingSafeEqual(Buffer.from(signIntake(body, timestamp, secret), 'hex'), Buffer.from(signature, 'hex'));
}
