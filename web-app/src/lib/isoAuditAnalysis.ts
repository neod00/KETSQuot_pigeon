import 'server-only';

import { randomUUID } from 'node:crypto';
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
  const multiSite = Object.fromEntries(Object.entries(suggestion.multiSite || {}).filter(([, value]) => typeof value === 'boolean'));
  const integration = Object.fromEntries(Object.entries(suggestion.integration || {}).filter(([, value]) => typeof value === 'number'));
  return {
    ...input,
    complexity: { ...input.complexity, ...suggestion.complexity },
    multiSite: {
      eligible: typeof multiSite.eligible === 'boolean' ? multiSite.eligible : input.multiSite?.eligible || false,
      samplingAllowed: typeof multiSite.samplingAllowed === 'boolean' ? multiSite.samplingAllowed : input.multiSite?.samplingAllowed || false,
      effectiveCycle: typeof multiSite.effectiveCycle === 'boolean' ? multiSite.effectiveCycle : input.multiSite?.effectiveCycle || false,
    },
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
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model(),
      input: [
        {
          role: 'system',
          content: `You are assisting an LRQA ISO certification assessor. Review the full submitted application only as an advisory review against IAF MD1, MD5, MD11 and the LRQA product procedure. Do not invent facts, audit time, legal eligibility, employee reductions, multi-site eligibility, integration evidence, sector codes or competence. The deterministic calculation is provided separately and remains the baseline. Identify missing evidence and customer questions. Suggest complexity only when the written activity supports it; otherwise omit it. Suggest multi-site sampling only when every relevant condition is explicitly evidenced. Return Korean and only this JSON object: {"summary":"","missingInformation":[""],"questionsForClient":[""],"riskFlags":[""],"clientEmailDraft":"","suggestedInput":{"complexity":{"ISO 9001":"medium","ISO 14001":"medium","ISO 45001":"medium"},"multiSite":{"eligible":false,"samplingAllowed":false,"effectiveCycle":false},"integration":{"level":0,"teamAbility":0},"overrideJustification":""}}.`,
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
    suggestedInput: toSuggestedInput(parsed.suggestedInput),
  };
  await setIsoJson(STORE, keyFor(application.id), analysis);
  return analysis;
}
