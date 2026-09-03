export type CoordinationPriority = 'P0' | 'P1' | 'P2';
export type CoordinationCategory = 'urgent' | 'reply' | 'deadline' | 'waiting' | 'reference' | 'newsletter' | 'personal';
export type CoordinationItemStatus = 'new' | 'reviewed' | 'done' | 'ignored';

export interface CoordinationMessageInput {
  id: string;
  conversationId?: string;
  subject: string;
  from: string;
  receivedAt: string;
  webLink?: string;
  content: string;
}

export interface CoordinationAnalysis {
  sourceId: string;
  subject: string;
  sender: string;
  receivedAt: string;
  priority: CoordinationPriority;
  category: CoordinationCategory;
  summary: string;
  dueDate: string;
  recommendedAction: string;
  draftReply: string;
}

export interface CoordinationItem extends Omit<CoordinationAnalysis, 'sourceId'> {
  id: string;
  messageIdHash: string;
  conversationIdHash?: string;
  webLink?: string;
  status: CoordinationItemStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface CoordinationSyncStatus {
  attemptedAt: string;
  completedAt?: string;
  messagesSeen: number;
  itemsCreated: number;
  error?: string;
}
