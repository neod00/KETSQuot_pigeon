import type { AuditDurationInput, AuditDurationResult } from './auditDurationEngine';
import type { IsoMultiSiteEvidence } from './isoMultiSiteEvidence';

export type IsoApplicationStatus = 'new' | 'in_review' | 'needs_information' | 'quote_ready' | 'completed';

export interface IsoApplication {
  id: string;
  submittedAt: string;
  status: IsoApplicationStatus;
  sourceStatus: string;
  companyName: string;
  companyNameEn: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  mobilePhone: string;
  standards: string[];
  otherStandards: string;
  scope: string;
  activityDescription: string;
  siteCount: number;
  siteList: string;
  siteAddress: string;
  postalCode: string;
  employeeCount: number;
  auditType: string;
  desiredAuditDate: string;
  existingCertification: boolean;
  existingCertificationBody: string;
  certificationExpiryDate: string;
  transferRequested: boolean;
  consultantName: string;
  consultingOrg: string;
  businessRegistrationNumber: string;
  dataConsent: boolean;
  sourceFields: Record<string, string>;
  missingFields: string[];
  quoteReady: boolean;
}

export type IsoAuditAnalysisStatus = 'proposed' | 'approved';

/** Advisory review of a submitted application. It never replaces assessor approval. */
export interface IsoAuditAnalysis {
  id: string;
  applicationId: string;
  createdAt: string;
  createdBy: string;
  status: IsoAuditAnalysisStatus;
  model: string;
  summary: string;
  missingInformation: string[];
  questionsForClient: string[];
  riskFlags: string[];
  clientEmailDraft: string;
  suggestedScope: string;
  scopeConcerns: string[];
  eaCandidates: Array<{
    code: string;
    title: string;
    applicableStandards: string[];
    rationale: string;
  }>;
  suggestedInput: {
    complexity?: Record<string, 'high' | 'medium' | 'low' | 'limited'>;
    multiSite?: {
      eligible?: boolean;
      samplingAllowed?: boolean;
      effectiveCycle?: boolean;
    };
    integration?: {
      level?: number;
      teamAbility?: number;
    };
    overrideJustification?: string;
  };
}

export interface IsoQuoteInput {
  companyName: string;
  contactPerson: string;
  auditType: string;
  standards: string[];
  customStandard?: string;
  scope: string;
  siteName: string;
  siteAddress: string;
  siteCount: number;
  employeeCount: number;
  customerPhone: string;
  customerEmail: string;
  postalCode: string;
  businessRegistrationNumber: string;
  billingAddress: string;
  standardCosts?: Array<{
    standard: string;
    stage1Days: number;
    stage2Days: number;
    surveillanceDays: number;
    recertDays: number;
    dayRate: number;
  }>;
  expenses?: number;
  certFee?: number;
  discount?: number;
  vatType?: string;
  contractYears?: string;
  paymentTerms?: string;
  validity?: string;
  signerTitle?: string;
  auditCalculation?: {
    input: AuditDurationInput;
    result: AuditDurationResult;
    appliedAt?: string;
    multiSiteEvidence?: IsoMultiSiteEvidence;
  };
}

export type IsoQuoteDraftStatus = 'draft' | 'review_requested' | 'approved';

export interface IsoQuoteDraft {
  id: string;
  applicationId: string;
  status: IsoQuoteDraftStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  quoteInput: IsoQuoteInput;
}

export interface IsoDocumentMeta {
  id: string;
  applicationId: string;
  draftId: string;
  documentType: 'quote' | 'contract';
  version: number;
  fileName: string;
  contentType: string;
  companyName: string;
  standards: string[];
  createdAt: string;
  createdBy: string;
  storageKey: string;
}
