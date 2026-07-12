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
  missingFields: string[];
  quoteReady: boolean;
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
