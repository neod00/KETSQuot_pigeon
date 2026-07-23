import 'server-only';

import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { deleteIsoValue, getIsoJson, listIsoJson, setIsoJson } from './isoStorage';

const STORE = 'internal-auth';
const USER_PREFIX = 'users';
const INVITE_PREFIX = 'invitations';
const ACCESS_REQUEST_PREFIX = 'access-requests';
const INVITE_VALIDITY_MS = 7 * 24 * 60 * 60 * 1000;
const scryptAsync = promisify(scrypt);

export type InternalRole = 'admin' | 'member';
export type InternalAccessRequestStatus = 'pending' | 'approved' | 'rejected';

interface InternalUserRecord {
  email: string;
  displayName?: string;
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

interface InternalAccessRequestRecord {
  email: string;
  displayName: string;
  passwordSalt?: string;
  passwordHash?: string;
  status: InternalAccessRequestStatus;
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface InternalUserSummary {
  email: string;
  displayName?: string;
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

export interface InternalAccessRequestSummary {
  email: string;
  displayName: string;
  status: InternalAccessRequestStatus;
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export const normalizeLrqaEmail = (value: string) => value.trim().toLowerCase();

export const isLrqaEmail = (value: string) => {
  const email = normalizeLrqaEmail(value);
  return /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@lrqa\.com$/.test(email);
};

const emailId = (email: string) => createHash('sha256').update(normalizeLrqaEmail(email)).digest('hex');
const userKey = (email: string) => `${USER_PREFIX}/${emailId(email)}.json`;
const invitationKey = (email: string) => `${INVITE_PREFIX}/${emailId(email)}.json`;
const accessRequestKey = (email: string) => `${ACCESS_REQUEST_PREFIX}/${emailId(email)}.json`;
const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

const validatePassword = (password: string) => {
  if (password.length < 10) throw new Error('비밀번호는 10자 이상이어야 합니다.');
  if (password.length > 128) throw new Error('비밀번호는 128자 이하로 입력해 주세요.');
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

const summarizeAccessRequest = ({
  email,
  displayName,
  status,
  requestedAt,
  reviewedAt,
  reviewedBy,
}: InternalAccessRequestRecord): InternalAccessRequestSummary => ({
  email,
  displayName,
  status,
  requestedAt,
  reviewedAt,
  reviewedBy,
});

const summarizeUser = ({
  email,
  displayName,
  role,
  active,
  createdAt,
  createdBy,
}: InternalUserRecord): InternalUserSummary => ({
  email,
  displayName,
  role,
  active,
  createdAt,
  createdBy,
});

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

export async function createInternalAccessRequest(
  emailInput: string,
  displayNameInput: string,
  password: string,
) {
  const email = normalizeLrqaEmail(emailInput);
  const displayName = displayNameInput.trim().replace(/\s+/g, ' ');
  if (!isLrqaEmail(email)) throw new Error('@lrqa.com 이메일만 사용 신청할 수 있습니다.');
  if (displayName.length < 2 || displayName.length > 60) {
    throw new Error('이름은 2자 이상 60자 이하로 입력해 주세요.');
  }

  const currentUser = await getIsoJson<InternalUserRecord>(STORE, userKey(email));
  if (currentUser?.active) throw new Error('이미 등록된 팀원 계정입니다. 로그인해 주세요.');

  const currentRequest = await getIsoJson<InternalAccessRequestRecord>(STORE, accessRequestKey(email));
  if (currentRequest?.status === 'pending') throw new Error('이미 승인 대기 중인 신청입니다.');

  const passwordData = await hashPassword(password);
  const request: InternalAccessRequestRecord = {
    email,
    displayName,
    passwordSalt: passwordData.salt,
    passwordHash: passwordData.hash,
    status: 'pending',
    requestedAt: new Date().toISOString(),
  };
  await setIsoJson(STORE, accessRequestKey(email), request);
  return summarizeAccessRequest(request);
}

export async function reviewInternalAccessRequest(
  emailInput: string,
  action: 'approve' | 'reject',
  reviewedBy: string,
) {
  const email = normalizeLrqaEmail(emailInput);
  if (!isLrqaEmail(email)) throw new Error('유효한 LRQA 이메일이 필요합니다.');

  const request = await getIsoJson<InternalAccessRequestRecord>(STORE, accessRequestKey(email));
  if (!request || request.status !== 'pending') throw new Error('승인 대기 중인 신청을 찾을 수 없습니다.');

  const reviewedAt = new Date().toISOString();
  if (action === 'reject') {
    const reviewedRequest: InternalAccessRequestRecord = {
      email: request.email,
      displayName: request.displayName,
      status: 'rejected',
      requestedAt: request.requestedAt,
      reviewedAt,
      reviewedBy,
    };
    await setIsoJson(STORE, accessRequestKey(email), reviewedRequest);
    return { request: summarizeAccessRequest(reviewedRequest) };
  }

  if (!request.passwordSalt || !request.passwordHash) {
    throw new Error('신청 비밀번호 정보가 없어 승인할 수 없습니다. 팀원에게 다시 신청하도록 안내해 주세요.');
  }
  const currentUser = await getIsoJson<InternalUserRecord>(STORE, userKey(email));
  if (currentUser?.active) throw new Error('이미 등록된 팀원 계정입니다.');

  const user: InternalUserRecord = {
    email: request.email,
    displayName: request.displayName,
    passwordSalt: request.passwordSalt,
    passwordHash: request.passwordHash,
    role: 'member',
    active: true,
    createdAt: reviewedAt,
    createdBy: reviewedBy,
  };
  await setIsoJson(STORE, userKey(email), user);

  const reviewedRequest: InternalAccessRequestRecord = {
    email: request.email,
    displayName: request.displayName,
    status: 'approved',
    requestedAt: request.requestedAt,
    reviewedAt,
    reviewedBy,
  };
  await setIsoJson(STORE, accessRequestKey(email), reviewedRequest);
  return {
    request: summarizeAccessRequest(reviewedRequest),
    user: summarizeUser(user),
  };
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
  return users.map(summarizeUser).sort((a, b) => a.email.localeCompare(b.email));
}

export async function listInternalInvitations(): Promise<InternalInvitationSummary[]> {
  const invitations = await listIsoJson<InternalInvitationRecord>(STORE, INVITE_PREFIX);
  return invitations
    .filter((item) => new Date(item.expiresAt).getTime() > Date.now())
    .map(({ email, invitedAt, invitedBy, expiresAt }) => ({ email, invitedAt, invitedBy, expiresAt }))
    .sort((a, b) => b.invitedAt.localeCompare(a.invitedAt));
}

export async function listInternalAccessRequests(): Promise<InternalAccessRequestSummary[]> {
  const requests = await listIsoJson<InternalAccessRequestRecord>(STORE, ACCESS_REQUEST_PREFIX);
  return requests.map(summarizeAccessRequest).sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
}

export async function removeInternalUser(emailInput: string) {
  const email = normalizeLrqaEmail(emailInput);
  if (!isLrqaEmail(email)) throw new Error('유효한 LRQA 이메일이 필요합니다.');
  await Promise.all([
    deleteIsoValue(STORE, userKey(email)),
    deleteIsoValue(STORE, invitationKey(email)),
  ]);
}
