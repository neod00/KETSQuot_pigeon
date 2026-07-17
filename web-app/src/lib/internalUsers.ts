import 'server-only';

import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { deleteIsoValue, getIsoJson, listIsoJson, setIsoJson } from './isoStorage';

const STORE = 'internal-auth';
const USER_PREFIX = 'users';
const INVITE_PREFIX = 'invitations';
const INVITE_VALIDITY_MS = 7 * 24 * 60 * 60 * 1000;
const scryptAsync = promisify(scrypt);

export type InternalRole = 'admin' | 'member';

interface InternalUserRecord {
  email: string;
  passwordSalt: string;
  passwordHash: string;
  role: InternalRole;
  active: boolean;
  createdAt: string;
  createdBy: string;
}

interface InternalInvitationRecord {
  email: string;
  tokenHash: string;
  invitedAt: string;
  invitedBy: string;
  expiresAt: string;
}

export interface InternalUserSummary {
  email: string;
  role: InternalRole;
  active: boolean;
  createdAt: string;
  createdBy: string;
}

export interface InternalInvitationSummary {
  email: string;
  invitedAt: string;
  invitedBy: string;
  expiresAt: string;
}

export const normalizeLrqaEmail = (value: string) => value.trim().toLowerCase();

export const isLrqaEmail = (value: string) => {
  const email = normalizeLrqaEmail(value);
  return /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@lrqa\.com$/.test(email);
};

const emailId = (email: string) => createHash('sha256').update(normalizeLrqaEmail(email)).digest('hex');
const userKey = (email: string) => `${USER_PREFIX}/${emailId(email)}.json`;
const invitationKey = (email: string) => `${INVITE_PREFIX}/${emailId(email)}.json`;
const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

const validatePassword = (password: string) => {
  if (password.length < 10) throw new Error('비밀번호는 10자 이상이어야 합니다.');
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    throw new Error('비밀번호에는 영문과 숫자가 모두 포함되어야 합니다.');
  }
};

async function hashPassword(password: string) {
  validatePassword(password);
  const salt = randomBytes(16).toString('base64url');
  const derived = await scryptAsync(password, salt, 64) as Buffer;
  return { salt, hash: derived.toString('base64url') };
}

async function passwordMatches(password: string, record: InternalUserRecord) {
  const derived = await scryptAsync(password, record.passwordSalt, 64) as Buffer;
  const expected = Buffer.from(record.passwordHash, 'base64url');
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

export async function createInternalInvitation(emailInput: string, invitedBy: string) {
  const email = normalizeLrqaEmail(emailInput);
  if (!isLrqaEmail(email)) throw new Error('@lrqa.com 이메일만 초대할 수 있습니다.');

  const token = randomBytes(32).toString('base64url');
  const invitedAt = new Date();
  const record: InternalInvitationRecord = {
    email,
    tokenHash: hashToken(token),
    invitedAt: invitedAt.toISOString(),
    invitedBy,
    expiresAt: new Date(invitedAt.getTime() + INVITE_VALIDITY_MS).toISOString(),
  };
  await setIsoJson(STORE, invitationKey(email), record);
  return { token, invitation: record };
}

export async function completeInternalInvitation(token: string, password: string) {
  if (!token) throw new Error('유효한 초대 링크가 필요합니다.');
  validatePassword(password);
  const tokenHash = hashToken(token);
  const invitations = await listIsoJson<InternalInvitationRecord>(STORE, INVITE_PREFIX);
  const invitation = invitations.find((item) => item.tokenHash === tokenHash);
  if (!invitation || new Date(invitation.expiresAt).getTime() <= Date.now()) {
    throw new Error('초대 링크가 유효하지 않거나 만료되었습니다.');
  }
  if (!isLrqaEmail(invitation.email)) throw new Error('@lrqa.com 이메일만 가입할 수 있습니다.');

  const passwordData = await hashPassword(password);
  const user: InternalUserRecord = {
    email: invitation.email,
    passwordSalt: passwordData.salt,
    passwordHash: passwordData.hash,
    role: 'member',
    active: true,
    createdAt: new Date().toISOString(),
    createdBy: invitation.invitedBy,
  };
  await setIsoJson(STORE, userKey(user.email), user);
  await deleteIsoValue(STORE, invitationKey(invitation.email));
  return { email: user.email };
}

export async function verifyInternalUserCredentials(emailInput: string, password: string) {
  const email = normalizeLrqaEmail(emailInput);
  if (!isLrqaEmail(email) || !password) return null;
  const user = await getIsoJson<InternalUserRecord>(STORE, userKey(email));
  if (!user?.active || !await passwordMatches(password, user)) return null;
  return { username: user.email, role: user.role };
}

export async function listInternalUsers(): Promise<InternalUserSummary[]> {
  const users = await listIsoJson<InternalUserRecord>(STORE, USER_PREFIX);
  return users
    .map(({ email, role, active, createdAt, createdBy }) => ({ email, role, active, createdAt, createdBy }))
    .sort((a, b) => a.email.localeCompare(b.email));
}

export async function listInternalInvitations(): Promise<InternalInvitationSummary[]> {
  const invitations = await listIsoJson<InternalInvitationRecord>(STORE, INVITE_PREFIX);
  return invitations
    .filter((item) => new Date(item.expiresAt).getTime() > Date.now())
    .map(({ email, invitedAt, invitedBy, expiresAt }) => ({ email, invitedAt, invitedBy, expiresAt }))
    .sort((a, b) => b.invitedAt.localeCompare(a.invitedAt));
}

export async function removeInternalUser(emailInput: string) {
  const email = normalizeLrqaEmail(emailInput);
  if (!isLrqaEmail(email)) throw new Error('유효한 LRQA 이메일이 필요합니다.');
  await Promise.all([
    deleteIsoValue(STORE, userKey(email)),
    deleteIsoValue(STORE, invitationKey(email)),
  ]);
}
