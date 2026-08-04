export type SamTranslationStatus = 'approved' | 'review';
export type SamReviewCadence = 'weekly' | 'biweekly' | 'monthly';
export type SamProgressStatus = 'on-track' | 'watch' | 'at-risk';

export interface SamBilingualText {
  ko: string;
  en: string;
  status: SamTranslationStatus;
}

export interface SamAffiliate {
  id: string;
  nameKo: string;
  nameEn: string;
  aliases: string[];
  d365AccountId?: string;
}

export interface SamContact {
  id: string;
  department: SamBilingualText;
  name: string;
  role: SamBilingualText;
  supportStatus: 'champion' | 'supporter' | 'neutral' | 'detractor';
  influence: 'high' | 'medium' | 'low';
  action: SamBilingualText;
}

export interface SamTeamMember {
  id: string;
  role: SamBilingualText;
  name: string;
}

export interface SamAction {
  id: string;
  goal: SamBilingualText;
  ambitionUsd: number;
  milestone: SamBilingualText;
  owner: string;
  dueDate: string;
  status: SamProgressStatus | 'not-started' | 'done';
  risk: SamBilingualText;
}

export interface SamProgressUpdate {
  id: string;
  date: string;
  status: SamProgressStatus;
  sourceMemo?: string;
  briefing?: SamBilingualText;
  accomplishments: SamBilingualText;
  customerMeetings: SamBilingualText;
  pipelineChanges: SamBilingualText;
  blockers: SamBilingualText;
  nextActions: SamBilingualText;
  owner: string;
  dueDate: string;
  managerSupport: SamBilingualText;
  uncategorized?: SamBilingualText;
  createdAt: string;
  createdBy: string;
}

export interface SamAccount {
  id: string;
  name: SamBilingualText;
  sector: SamBilingualText;
  country: string;
  manager: string;
  internalSponsor: SamBilingualText;
  clientSponsor: SamBilingualText;
  lastQbrDate: string;
  qbrOutcome: SamBilingualText;
  nextQbrDate: string;
  lastVisitDate: string;
  attendees: SamBilingualText;
  visitOutcome: SamBilingualText;
  opportunity: SamBilingualText;
  dealStage: SamBilingualText;
  estimatedCloseDate: string;
  dealValueUsd: number;
  dealValueNote: SamBilingualText;
  atRisk: boolean;
  risk: SamBilingualText;
  growthStrategy: SamBilingualText;
  crossSell: SamBilingualText;
  notes: SamBilingualText;
  reviewCadence: SamReviewCadence;
  nextReviewDate: string;
  affiliates: SamAffiliate[];
  manualSalesRecordIds: string[];
  contacts: SamContact[];
  team: SamTeamMember[];
  actions: SamAction[];
  updates: SamProgressUpdate[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface SamPipelineRecord {
  id: string;
  companyName: string;
  opportunityName: string;
  product: string;
  stage: string;
  amount: number;
  quotedAt: string;
  matchedBy: 'account' | 'affiliate' | 'alias' | 'manual';
}

export interface SamAccountView extends SamAccount {
  pipeline: SamPipelineRecord[];
  activePipelineUsd: number;
}

export interface SamDocument {
  id: string;
  accountId?: string;
  accountName: string;
  kind: 'excel' | 'pptx' | 'source-excel';
  fileName: string;
  contentType: string;
  storageKey: string;
  version: number;
  createdAt: string;
  createdBy: string;
}

export type SamAccountInput = Partial<Omit<
  SamAccount,
  'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'
>>;
