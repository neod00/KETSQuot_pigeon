import { NextResponse } from 'next/server';
import { createSamAccount, listSamAccounts, saveSamDocument, updateSamAccount } from '@/lib/samRecords';
import { getIsoRequestSession } from '@/lib/isoAuth';
import { parseSamWorkbook } from '@/lib/samWorkbook';
import type { SamAccountInput, SamBilingualText } from '@/lib/samTypes';

export const runtime = 'nodejs';

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9가-힣]+/g, '');
const approved = (ko: string, en: string): SamBilingualText => ({ ko, en, status: 'approved' });

export async function POST(request: Request) {
  const session = getIsoRequestSession(request);
  if (session?.role !== 'admin') return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File) || !file.name.toLowerCase().endsWith('.xlsx')) {
    return NextResponse.json({ error: 'Excel .xlsx 파일을 선택해 주세요.' }, { status: 400 });
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const rows = await parseSamWorkbook(bytes);
  const existing = await listSamAccounts();
  let created = 0;
  let updated = 0;
  for (const row of rows) {
    const normalizedRowName = normalize(row.accountName);
    const matched = existing.find((account) => [
      account.name.ko,
      account.name.en,
      ...account.affiliates.flatMap((affiliate) => [affiliate.nameKo, affiliate.nameEn, ...affiliate.aliases]),
    ].some((candidate) => normalize(candidate) === normalizedRowName));
    const input: SamAccountInput = {
      country: row.country || 'Korea',
      name: approved(matched?.name.ko || row.accountName, row.accountName),
      sector: approved(matched?.sector.ko || row.sector, row.sector),
      manager: row.manager,
      internalSponsor: approved(matched?.internalSponsor.ko || row.internalSponsor, row.internalSponsor),
      clientSponsor: approved(matched?.clientSponsor.ko || row.clientSponsor, row.clientSponsor),
      lastQbrDate: row.lastQbrDate,
      qbrOutcome: approved(matched?.qbrOutcome.ko || row.qbrOutcome, row.qbrOutcome),
      nextQbrDate: row.nextQbrDate,
      lastVisitDate: row.lastVisitDate,
      attendees: approved(matched?.attendees.ko || row.attendees, row.attendees),
      visitOutcome: approved(matched?.visitOutcome.ko || row.visitOutcome, row.visitOutcome),
      opportunity: approved(matched?.opportunity.ko || row.opportunity, row.opportunity),
      dealStage: approved(matched?.dealStage.ko || row.dealStage, row.dealStage),
      estimatedCloseDate: row.estimatedCloseDate,
      dealValueNote: approved(matched?.dealValueNote.ko || row.dealValueNote, row.dealValueNote),
      atRisk: /^y\b/i.test(row.atRisk),
      risk: approved(matched?.risk.ko || row.atRisk, row.atRisk.replace(/^[yn]\s*-?\s*/i, '')),
      growthStrategy: approved(matched?.growthStrategy.ko || row.growthStrategy, row.growthStrategy),
      crossSell: approved(matched?.crossSell.ko || row.crossSell, row.crossSell),
      notes: approved(matched?.notes.ko || row.notes, row.notes),
    };
    if (matched) {
      await updateSamAccount(matched.id, input, session.username);
      updated += 1;
    } else {
      await createSamAccount(input, session.username);
      created += 1;
    }
  }
  await saveSamDocument(bytes, {
    accountName: 'Korea Strategic Accounts',
    kind: 'source-excel',
    fileName: file.name,
    contentType: file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    createdBy: session.username,
  });
  return NextResponse.json({ imported: rows.length, created, updated });
}
