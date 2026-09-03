export type NavTab = 'dashboard' | 'assistant' | 'training' | 'transactions' | 'support' | 'users';

export type UserRole = 'admin' | 'user';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  department: string;
  avatarColor?: string;
  allowedTabs?: NavTab[];
  createdAt?: string;
}

export type KnowledgeStatus = 'Completed' | 'Syncing' | 'Processing' | 'Failed';

export interface KnowledgeItem {
  id: string;
  sourceName: string;
  type: 'Document' | 'URL' | 'Raw Text';
  fileFormat?: 'PDF' | 'CSV' | 'TXT' | 'LINK' | 'JSON';
  dateAdded: string;
  status: KnowledgeStatus;
  faqCount?: number;
  url?: string;
  summary?: string;
  faqs?: FAQPair[];
  contentSnippet?: string;
  createdBy?: string;
}

export interface FAQPair {
  id: string;
  question: string;
  answer: string;
  category: string;
  confidence: number;
}

export interface SavedBeneficiary {
  id: string;
  name: string;
  cardOrAccount: string;
  type: 'Uzcard' | 'Humo' | 'Visa' | 'MasterCard' | 'Account' | 'Other';
  bankName?: string;
  avatarColor?: string;
  lastUsed?: string;
}

export interface BankAccount {
  id: string;
  name: string;
  accountNumber: string;
  balance: number;
  currency: 'UZS' | 'USD' | 'EUR';
  type: 'Checking' | 'Savings' | 'Card' | 'Corporate';
  cardMask?: string;
  color?: string;
}

export interface ComplianceCheckData {
  beneficiary: string;
  amount: number;
  currency: string;
  riskScore: number;
  amlStatus: 'Passed' | 'Review' | 'Flagged';
  sanctionCheck: 'Clean' | 'Match Found';
  kycLevel: 'Verified' | 'Basic';
  limitStatus: 'Approved' | 'Exceeded';
  notes: string[];
}

export interface TransferPayload {
  id: string;
  fromAccount: string;
  toBeneficiary: string;
  toCardOrAccount: string;
  amount: number;
  currency: 'UZS' | 'USD';
  purpose: string;
  commission: number;
  status: 'Draft' | 'Processing' | 'Completed' | 'Failed';
  currentStep?: number;
  compliance?: ComplianceCheckData;
  receiptId?: string;
  timestamp?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  sources?: string[];
  suggestedActions?: string[];
  widget?: 'balance' | 'transfer' | 'compliance' | 'receipt' | 'exchange' | 'history';
  widgetData?: any;
}

export interface BankTransaction {
  id: string;
  date: string;
  account: string;
  merchant: string;
  category: string;
  amount: number;
  type: 'Debit' | 'Credit';
  status: 'Completed' | 'Pending' | 'Flagged';
  riskScore: number; // 0-100
  flagReason?: string;
}

export interface SupportTicket {
  id: string;
  customerName: string;
  accountTier: 'Standard' | 'Gold' | 'Enterprise';
  subject: string;
  issue: string;
  status: 'Open' | 'In Progress' | 'Resolved';
  priority: 'Low' | 'Medium' | 'High';
  date: string;
  aiSuggestedReply?: string;
}
