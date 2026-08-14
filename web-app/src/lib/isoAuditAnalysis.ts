import 'server-only';

import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { AuditDurationInput } from './auditDurationEngine';
import { getIsoJson, setIsoJson } from './isoStorage';
import type { IsoApplication, IsoAuditAnalysis } from './isoTypes';

const STORE = 'iso-audit-analysis';
const keyFor = (applicationId: string) => `applications/${applicationId}.json`;
const model = () => process.env.OPENAI_AUDIT_ANALYSIS_MODEL || process.env.OPENAI_SAM_MODEL || 'gpt-5-mini';

const cleanJson = (value: string) => value.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
const list = (value: unknown, limit = 8) => Array.isArray(value)
  ? value.map((item) => String(item ?? '').trim()).filter(Boolean).slice(0, limit)
  : [];
const optionalBoolean = (value: unknown) => typeof value === 'boolean' ? value : undefined;
const percentage = (value: unknown) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(0, Math.min(100, Math.round(numeric / 20) * 20)) : undefined;
};

type EaCatalogItem = {
  code?: string;
  title?: string;
  naceHeading?: string;
  naceDescription?: string;
  oldCodes?: string[];
};

const eaCatalogForPrompt = async () => {
  try {
    const raw = await readFile(path.join(process.cwd(), 'public', 'adj', 'ea-code-data.json'), 'utf8');
    const parsed = JSON.parse(raw) as { codes?: EaCatalogItem[] };
    return (parsed.codes || []).slice(0, 50).map((item) => ({
      code: String(item.code || ''),
      title: String(item.title || ''),
      naceHeading: String(item.naceHeading || ''),
      oldCodes: Array.isArray(item.oldCodes) ? item.oldCodes.slice(0, 12) : [],
    })).filter((item) => item.code && item.title);
  } catch {
    return [];
  }
};

const eaCandidates = (value: unknown): IsoAuditAnalysis['eaCandidates'] => Array.isArray(value)
  ? value.slice(0, 3).flatMap((item) => {
    const record = item && typeof item === 'object' ? item as Record<string, unknown> : {};
    const code = String(record.code || '').trim().toUpperCase();
    const title = String(record.title || '').trim();
    if (!/^EA\d{2}$/.test(code) || !title) return [];
    return [{
      code,
      title: title.slice(0, 180),
      applicableStandards: list(record.applicableStandards, 3),
      rationale: String(record.rationale || '').trim().slice(0, 800),
    }];
  })
  : [];

const toSuggestedInput = (value: unknown): IsoAuditAnalysis['suggestedInput'] => {
  const record = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const complexityRecord = record.complexity && typeof record.complexity === 'object'
    ? record.complexity as Record<string, unknown>
    : {};
  const complexity = Object.fromEntries(
    Object.entries(complexityRecord)
      .filter(([standard, level]) => ['ISO 9001', 'ISO 14001', 'ISO 45001'].includes(standard)
        && ['high', 'medium', 'low', 'limited'].includes(String(level)))
      .map(([standard, level]) => [standard, String(level) as 'high' | 'medium' | 'low' | 'limited']),
  );
  const multiSite = record.multiSite && typeof record.multiSite === 'object'
    ? record.multiSite as Record<string, unknown>
    : {};
  const integration = record.integration && typeof record.integration === 'object'
    ? record.integration as Record<string, unknown>
    : {};
  return {
    ...(Object.keys(complexity).length ? { complexity } : {}),
    multiSite: {
      eligible: optionalBoolean(multiSite.eligible),
      samplingAllowed: optionalBoolean(multiSite.samplingAllowed),
      effectiveCycle: optionalBoolean(multiSite.effectiveCycle),
    },
    integration: { level: percentage(integration.level), teamAbility: percentage(integration.teamAbility) },
    overrideJustification: String(record.overrideJustification ?? '').trim().slice(0, 1000),
  };
};

const outputText = (payload: { output?: Array<{ content?: Array<{ type?: string; text?: string }> }> }) =>
  payload.output?.flatMap((item) => item.content || []).find((item) => item.type === 'output_text')?.text || '{}';

export class IsoAuditAnalysisError extends Error {
  constructor(message: string, readonly status = 502) {
    super(message);
  }
}

export const getIsoAuditAnalysis = (applicationId: string) => getIsoJson<IsoAuditAnalysis>(STORE, keyFor(applicationId));

export async function approveIsoAuditAnalysis(applicationId: string) {
  const current = await getIsoAuditAnalysis(applicationId);
  if (!current) return null;
  const next: IsoAuditAnalysis = { ...current, status: 'approved' };
  await setIsoJson(STORE, keyFor(applicationId), next);
  return next;
}

/** Applies only an explicitly approved recommendation to a deterministic baseline. */
export const applyApprovedAuditAnalysis = (input: AuditDurationInput, analysis: IsoAuditAnalysis | null): AuditDurationInput => {
  if (!analysis || analysis.status !== 'approved') return input;
  const suggestion = analysis.suggestedInput;
  const integration = Object.fromEntries(Object.entries(suggestion.integration || {}).filter(([, value]) => typeof value === 'number'));
  return {
    ...input,
    complexity: { ...input.complexity, ...suggestion.complexity },
    // An AI application review cannot supply the documentary evidence required for MD1/MD22.
    // Multi-site sampling is therefore set only in the quote screen after a reviewer records it.
    multiSite: input.multiSite,
    integration: {
      level: typeof integration.level === 'number' ? integration.level : input.integration?.level || 0,
      teamAbility: typeof integration.teamAbility === 'number' ? integration.teamAbility : input.integration?.teamAbility || 0,
    },
    ...(suggestion.overrideJustification ? { overrideJustification: suggestion.overrideJustification } : {}),
  };
};

export async function analyseIsoApplication({
  application,
  auditInput,
  username,
}: {
  application: IsoApplication;
  auditInput: AuditDurationInput;
  username: string;
}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new IsoAuditAnalysisError('OPENAI_API_KEY is not configured.', 503);

  const sourceFields = Object.fromEntries(
    Object.entries(application.sourceFields).map(([key, value]) => [key.slice(0, 160), String(value ?? '').slice(0, 2000)]).slice(0, 160),
  );
  const activityCodeCatalog = await eaCatalogForPrompt();
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model(),
      input: [
        {
          role: 'system',
          content: `You are assisting an LRQA ISO certification assessor. Review the full submitted application only as an advisory review against IAF MD1, MD5, MD11, MD22 for ISO 45001 multi-site OH&S systems, LRMS03-03-04A certification scope guidance, and the LRQA product procedure. Do not invent facts, audit time, legal eligibility, employee reductions, multi-site eligibility, integration evidence, sector codes or competence. The deterministic calculation is provided separately and remains the baseline. Identify missing evidence and customer questions. Suggest complexity only when the written activity supports it; otherwise omit it. For multi-site sampling, require evidence of a common management system, legal or contractual link, central function control, internal audit, management review, a complete site list, and rationale. For ISO 45001, sampling is not appropriate where sites do not have comparable activities, processes and OH&S risks; require site-specific risk evidence. A certification scope draft is advisory only. EA candidates must be selected only from the provided catalog and are recommendations for an authorised reviewer, never an automatic decision. Return Korean and only this JSON object: {"summary":"","missingInformation":[""],"questionsForClient":[""],"riskFlags":[""],"clientEmailDraft":"","suggestedScope":"","scopeConcerns":[""],"eaCandidates":[{"code":"EA01","title":"","applicableStandards":["ISO 9001"],"rationale":""}],"suggestedInput":{"complexity":{"ISO 9001":"medium","ISO 14001":"medium","ISO 45001":"medium"},"multiSite":{"eligible":false,"samplingAllowed":false,"effectiveCycle":false},"integration":{"level":0,"teamAbility":0},"overrideJustification":""}}.`,
        },
        {
          role: 'user',
          content: JSON.stringify({
            application: {
              companyName: application.companyName,
              companyNameEn: application.companyNameEn,
              contactName: application.contactName,
              contactEmail: application.contactEmail,
              standards: application.standards,
              otherStandards: application.otherStandards,
              scope: application.scope,
              activityDescription: application.activityDescription,
              siteCount: application.siteCount,
              siteList: application.siteList,
              siteAddress: application.siteAddress,
              employeeCount: application.employeeCount,
              auditType: application.auditType,
              existingCertification: application.existingCertification,
              transferRequested: application.transferRequested,
              sourceFields,
            },
            deterministicAuditInput: auditInput,
            eaCatalog: activityCodeCatalog,
          }),
        },
      ],
    }),
  });
  const payload = await response.json() as { output?: Array<{ content?: Array<{ type?: string; text?: string }> }>; error?: { message?: string } };
  if (!response.ok) throw new IsoAuditAnalysisError(payload.error?.message || 'OpenAI application analysis failed.');
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleanJson(outputText(payload))) as Record<string, unknown>;
  } catch {
    throw new IsoAuditAnalysisError('The AI response was not valid JSON.');
  }
  const analysis: IsoAuditAnalysis = {
    id: `AIA-${randomUUID().replace(/-/g, '').slice(0, 16).toUpperCase()}`,
    applicationId: application.id,
    createdAt: new Date().toISOString(),
    createdBy: username,
    status: 'proposed',
    model: model(),
    summary: String(parsed.summary ?? '').trim().slice(0, 3000),
    missingInformation: list(parsed.missingInformation),
    questionsForClient: list(parsed.questionsForClient),
    riskFlags: list(parsed.riskFlags),
    clientEmailDraft: String(parsed.clientEmailDraft ?? '').trim().slice(0, 5000),
    suggestedScope: String(parsed.suggestedScope ?? '').trim().slice(0, 1800),
    scopeConcerns: list(parsed.scopeConcerns),
    eaCandidates: eaCandidates(parsed.eaCandidates),
    suggestedInput: toSuggestedInput(parsed.suggestedInput),
  };
  await setIsoJson(STORE, keyFor(application.id), analysis);
  return analysis;
}
