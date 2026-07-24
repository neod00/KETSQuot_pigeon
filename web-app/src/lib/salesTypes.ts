export type SalesStage = 'new' | 'quote-preparing' | 'quote-sent' | 'follow-up' | 'won' | 'lost' | 'on-hold';

export type D365Status = 'not-ready' | 'ready' | 'running' | 'success' | 'warning' | 'failed';

export type D365AccountMode = 'existing' | 'new';

export interface D365Fields {
  status: D365Status;
  accountMode: D365AccountMode;
  accountUrl: string;
  firstName: string;
  lastName: string;
  leadSource: string;
  areaOfInterest: string;
  primaryBusinessStream: string;
  primaryService: string;
  closeDate: string;
  country: string;
  opportunityRecordType: string;
  opportunityType: string;
  forecastCategory: string;
  clientFacingOffice: string;
  assignTo: string;
  street1: string;
  city: string;
  postalCode: string;
  leadUrl?: string;
  opportunityUrl?: string;
  error?: string;
  lastRunAt?: string;
}

export interface SalesRecord {
  id: string;
  innovation: string;
  product: string;
  category: string;
  sf: string;
  quotedAt: string;
  quoteNumber: string;
  deadline: string;
  companyName: string;
  accountName: string;
  opportunityName: string;
  contactName: string;
  telephone: string;
  mobile: string;
  email: string;
  contactHistory: string;
  nextAction: string;
  consultingFollowUp: string;
  leadSource: string;
  contract: string;
  mpApproval: string;
  quoteMandays: number;
  application6sv: string;
  amountExcludingExpenses: number;
  amountIncludingExpenses: number;
  quoteReviewResult: string;
  originalOwner: string;
  won: boolean;
  d365Matched: boolean;
  retentionExpansion: string;
  stage: SalesStage;
  d365: D365Fields;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export type SalesRecordInput = Omit<
  SalesRecord,
  'id' | 'ownerId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'
> & {
  id?: string;
};

export interface D365AutomationResult {
  success: boolean;
  error?: string;
  sanctionWarning?: boolean;
  warningType?: 'sanction' | 'duplicate' | 'qualify-incomplete';
  warningMessage?: string;
  leadUrl?: string;
  leadName?: string;
  opportunityUrl?: string;
}
