import { KnowledgeItem, BankTransaction, SupportTicket } from '../types';

export const INITIAL_KNOWLEDGE_ITEMS: KnowledgeItem[] = [
  {
    id: 'kb-1',
    sourceName: '2024 Mortgage FAQs',
    type: 'Document',
    fileFormat: 'PDF',
    dateAdded: 'Oct 12, 2023',
    status: 'Completed',
    faqCount: 420,
    summary: 'Fixed-rate mortgages, refinancing requirements, down-payment qualifications, and APR breakdowns.',
    faqs: [
      { id: 'f1', question: 'What is the minimum down payment for a 30-year mortgage?', answer: 'KDB Bank Uzbekistan requires a minimum down payment of 3.5% for standard 30-year fixed mortgages with private mortgage insurance (PMI).', category: 'Mortgages', confidence: 0.98 },
      { id: 'f2', question: 'What are current fixed mortgage interest rates?', answer: 'As of 2026, 30-year fixed rate mortgage APR starts at 6.25%, and 15-year fixed starts at 5.50%.', category: 'Mortgages', confidence: 0.96 }
    ]
  },
  {
    id: 'kb-2',
    sourceName: 'Standard Savings Rates',
    type: 'URL',
    fileFormat: 'LINK',
    dateAdded: 'Nov 05, 2023',
    status: 'Completed',
    faqCount: 310,
    url: 'https://kdb.uz/savings-rates',
    summary: 'High-yield savings APY tiers, certificate of deposit terms, and compounding interest schedules.',
    faqs: [
      { id: 'f3', question: 'What is the APY for high-yield savings accounts?', answer: 'KDB Bank Uzbekistan High-Yield Savings offers 4.85% APY compounded daily with no minimum balance requirement.', category: 'Savings', confidence: 0.99 }
    ]
  },
  {
    id: 'kb-3',
    sourceName: 'Wealth Management Terms',
    type: 'Document',
    fileFormat: 'CSV',
    dateAdded: 'Jan 20, 2024',
    status: 'Completed',
    faqCount: 280,
    summary: 'Private banking portfolios, asset management compliance, risk tolerance definitions, and tax advisory.'
  },
  {
    id: 'kb-4',
    sourceName: 'Card Security & Fraud Policy',
    type: 'Document',
    fileFormat: 'PDF',
    dateAdded: 'Mar 14, 2024',
    status: 'Completed',
    faqCount: 230,
    summary: 'Chargeback protocols, international transaction locks, stolen card replacement timelines.',
    faqs: [
      { id: 'f4', question: 'How do I lock a lost or stolen card?', answer: 'You can immediately freeze your debit or credit card in the KDB Mobile app under Cards > Security, or call 24/7 hotline +998 (78) 120-8000.', category: 'Security', confidence: 0.99 }
    ]
  }
];

export const INITIAL_TRANSACTIONS: BankTransaction[] = [
  {
    id: 'TXN-9021',
    date: '2026-07-22 14:32',
    account: 'ACC-7892 (Enterprise Main)',
    merchant: 'Global Cloud Infrastructure Inc.',
    category: 'IT Services',
    amount: 14250.00,
    type: 'Debit',
    status: 'Completed',
    riskScore: 12,
  },
  {
    id: 'TXN-9022',
    date: '2026-07-22 18:05',
    account: 'ACC-4412 (Premium Business)',
    merchant: 'Unknown Merchant - Overseas Wire',
    category: 'Wire Transfer',
    amount: 98000.00,
    type: 'Debit',
    status: 'Flagged',
    riskScore: 88,
    flagReason: 'High amount wire transfer to new unverified international account'
  },
  {
    id: 'TXN-9023',
    date: '2026-07-23 09:12',
    account: 'ACC-1102 (Consumer Checking)',
    merchant: 'KDB Credit Payment',
    category: 'Loan Payment',
    amount: 2450.00,
    type: 'Debit',
    status: 'Completed',
    riskScore: 5
  },
  {
    id: 'TXN-9024',
    date: '2026-07-23 11:45',
    account: 'ACC-7892 (Enterprise Main)',
    merchant: 'Client Direct Wire Credit',
    category: 'Deposit',
    amount: 320000.00,
    type: 'Credit',
    status: 'Completed',
    riskScore: 2
  },
  {
    id: 'TXN-9025',
    date: '2026-07-23 12:01',
    account: 'ACC-3319 (Business Debit)',
    merchant: 'Luxury Auto Dealership Dubai',
    category: 'Automotive',
    amount: 45000.00,
    type: 'Debit',
    status: 'Flagged',
    riskScore: 76,
    flagReason: 'Rapid sequence debit outside usual geo-location parameters'
  }
];

export const INITIAL_TICKETS: SupportTicket[] = [
  {
    id: 'TCK-401',
    customerName: 'Sardor Rakhimov',
    accountTier: 'Enterprise',
    subject: 'International Wire Transfer Delay',
    issue: 'My wire transfer of $50,000 to London was submitted yesterday but is still pending verification.',
    status: 'Open',
    priority: 'High',
    date: '2026-07-23 08:30'
  },
  {
    id: 'TCK-402',
    customerName: 'Elena Rostova',
    accountTier: 'Gold',
    subject: 'Mortgage Rate Adjustment Clarification',
    issue: 'I want to know if my fixed-rate 30-year mortgage can be refinanced with current rates.',
    status: 'In Progress',
    priority: 'Medium',
    date: '2026-07-22 16:15'
  },
  {
    id: 'TCK-403',
    customerName: 'Akmal Toshpulat',
    accountTier: 'Enterprise',
    subject: 'API Integration for Merchant Payments',
    issue: 'We need documentation on KDB Bank Uzbekistan REST API Webhooks for automatic transaction sync.',
    status: 'Open',
    priority: 'Medium',
    date: '2026-07-23 10:05'
  }
];
