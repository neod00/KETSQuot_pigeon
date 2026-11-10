import assert from 'node:assert/strict';
import test from 'node:test';
import { parseSamMailFile, MAX_SAM_MAIL_FILE_BYTES } from '../src/lib/samMailFiles';
import { burn } from '@kenjiuno/msgreader/lib/Burner';
import { TypeEnum } from '@kenjiuno/msgreader/lib/Reader';
const eml = (body: string, extra = '') => `From: sender@example.test\r\nTo: owner@example.test\r\nSubject: =?UTF-8?B?${Buffer.from('견적 요청').toString('base64')}?=\r\n${extra}\r\n${body}`;
test('Korean MIME headers and quoted-printable body retain correct Unicode', async () => {
  const body = Array.from(Buffer.from('견적 회신 부탁드립니다.')).map(byte => '=' + byte.toString(16)).join('');
  const parsed = await parseSamMailFile(new File([eml(body, 'Content-Type: text/plain; charset=utf-8\r\nContent-Transfer-Encoding: quoted-printable\r\nMessage-ID: <a@test>\r\n')], '메일.eml'));
  assert.equal(parsed.subject, '견적 요청');
  assert.equal(parsed.body, '견적 회신 부탁드립니다.');
  assert.equal(parsed.id, '<a@test>');
});
test('renamed copies without Message-ID have the same stable identity', async () => {
  const raw = eml('본문', 'Content-Type: text/plain; charset=utf-8\r\n');
  const a = await parseSamMailFile(new File([raw], 'a.eml', { lastModified: 1 }));
  const b = await parseSamMailFile(new File([raw], 'renamed.eml', { lastModified: 2 }));
  assert.equal(a.id, b.id);
});
test('multipart attachment text is excluded from the analysed body', async () => {
  const raw = eml('--part\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n업무 본문\r\n--part\r\nContent-Type: text/plain\r\nContent-Disposition: attachment; filename="secret.txt"\r\n\r\nATTACHMENT_ONLY\r\n--part--', 'Content-Type: multipart/mixed; boundary=part\r\n');
  const parsed = await parseSamMailFile(new File([raw], 'parts.eml'));
  assert.match(parsed.body, /업무 본문/);
  assert.doesNotMatch(parsed.body, /ATTACHMENT_ONLY/);
  assert.equal(parsed.warnings.length, 1);
});
test('HTML mail is converted to text without executing or retaining script', async () => {
  const parsed = await parseSamMailFile(new File([eml('<p>업무</p><script>alert(1)</script><p>확인</p>', 'Content-Type: text/html; charset=utf-8\r\n')], 'html.eml'));
  assert.match(parsed.body, /업무/);
  assert.doesNotMatch(parsed.body, /alert|script|<p>/);
});
test('unsupported, empty, oversized and broken MSG files fail explicitly', async () => {
  await assert.rejects(parseSamMailFile(new File(['text'], 'x.txt')), /eml/);
  await assert.rejects(parseSamMailFile(new File([], 'x.eml')), /비어/);
  await assert.rejects(parseSamMailFile(new File([new Uint8Array(MAX_SAM_MAIL_FILE_BYTES + 1)], 'x.eml')), /10MB/);
  await assert.rejects(parseSamMailFile(new File(['invalid MSG'], 'x.msg')));
});

test('a real binary MSG container preserves Korean subject and body', async () => {
  const fields = [['0037001F', 'MSG 견적 요청'], ['1000001F', '수정 견적서를 보내 주세요.'], ['1035001F', '<msg@test>']];
  const binary = burn([
    { name: 'Root Entry', type: TypeEnum.ROOT, length: 0, children: [1, 2, 3] },
    ...fields.map(([tag, value]) => {
      const bytes = new Uint8Array(Buffer.from(value + '\0', 'utf16le'));
      return { name: `__substg1.0_${tag}`, type: TypeEnum.DOCUMENT, length: bytes.length, binaryProvider: () => bytes };
    }),
  ]);
  const parsed = await parseSamMailFile(new File([new Uint8Array(binary)], 'test.msg'));
  assert.equal(parsed.subject, 'MSG 견적 요청');
  assert.equal(parsed.body, '수정 견적서를 보내 주세요.');
  assert.equal(parsed.id, '<msg@test>');
});
