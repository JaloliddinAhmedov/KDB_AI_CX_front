import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Copy, 
  Check, 
  RotateCw, 
  ShieldCheck, 
  CreditCard, 
  Wallet, 
  ArrowRightLeft, 
  History, 
  Lock, 
  BookOpen, 
  Zap, 
  ShieldAlert, 
  Headphones, 
  ExternalLink,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { 
  ChatMessage, 
  KnowledgeItem, 
  BankAccount, 
  BankTransaction, 
  TransferPayload, 
  ComplianceCheckData, 
  SupportTicket, 
  UserProfile,
  NavTab
} from '../types';
import { generateClientSideAnswer } from '../utils/aiFallback';
import { 
  INITIAL_USER_ACCOUNTS, 
  parseBankingIntent, 
  formatCurrency, 
  runComplianceCheck, 
  EXCHANGE_RATES 
} from '../utils/conversationalBanking';
import { BalanceWidget } from './chatWidgets/BalanceWidget';
import { TransferWidget } from './chatWidgets/TransferWidget';
import { ComplianceWidget } from './chatWidgets/ComplianceWidget';
import { ExchangeWidget } from './chatWidgets/ExchangeWidget';
import { HistoryWidget } from './chatWidgets/HistoryWidget';
import { NativeBankingModal, NativeBankingTab } from './NativeBankingModal';

export type AssistantMode = 'knowledge-only' | 'copilot' | 'security-native';

interface AIAssistantProps {
  knowledgeItems?: KnowledgeItem[];
  transactions?: BankTransaction[];
  setTransactions?: React.Dispatch<React.SetStateAction<BankTransaction[]>>;
  tickets?: SupportTicket[];
  setTickets?: React.Dispatch<React.SetStateAction<SupportTicket[]>>;
  currentUser?: UserProfile;
  onNavigateToTab?: (tab: NavTab) => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ 
  knowledgeItems = [],
  transactions = [],
  setTransactions,
  tickets = [],
  setTickets,
  currentUser,
  onNavigateToTab
}) => {
  const [assistantMode, setAssistantMode] = useState<AssistantMode>('copilot');

  const [accounts, setAccounts] = useState<BankAccount[]>(() => {
    const saved = localStorage.getItem('kdb_user_accounts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_USER_ACCOUNTS;
      }
    }
    return INITIAL_USER_ACCOUNTS;
  });

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-1',
      sender: 'assistant',
      text: "Hello! I am your KDB Bank Uzbekistan AI-CX Copilot assistant.\n\nDirectly within this chat, you can:\n• Check live balances of your accounts and cards (with historical comparison)\n• Execute secure instant money transfers with automated AML & compliance\n• Convert currencies at official Central Bank & KDB rates\n• Switch between 3 Assistant Modes or escalate unresolved issues directly to Staff Support.",
      timestamp: '09:00',
      sources: ['KDB Bank Core Banking & Knowledge Base'],
      suggestedActions: [
        '💳 Check my account balance',
        '💸 Transfer 1,500,000 UZS to Akmal Karimov',
        '🛡️ Compliance check: Apex Logistics',
        '💱 Exchange $100 to UZS',
        '📜 Recent transaction history'
      ]
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  // Native Sandbox Modal State (for Mode 3)
  const [isNativeModalOpen, setIsNativeModalOpen] = useState(false);
  const [nativeModalTab, setNativeModalTab] = useState<NativeBankingTab>('transfer');
  const [prefilledTransfer, setPrefilledTransfer] = useState<Partial<TransferPayload>>({});
  const [prefilledComplianceBeneficiary, setPrefilledComplianceBeneficiary] = useState<string>('Apex Logistics LLC');

  // Helper to open native modal with specific tab and payload
  const openSecurityModal = (
    tab: NativeBankingTab, 
    transferData?: Partial<TransferPayload>, 
    ben?: string
  ) => {
    if (transferData) setPrefilledTransfer(transferData);
    if (ben) setPrefilledComplianceBeneficiary(ben);
    setNativeModalTab(tab);
    setIsNativeModalOpen(true);
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('kdb_user_accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Construct dynamic knowledge context from all trained items
  const buildKnowledgeContext = () => {
    if (!knowledgeItems || knowledgeItems.length === 0) {
      return 'KDB Bank Uzbekistan 2026 Credit FAQs, Standard Deposit Rates, Corporate Banking Terms';
    }

    const contextParts: string[] = [];

    knowledgeItems.forEach((item, index) => {
      let part = `=== SOURCE DOCUMENT [${index + 1}]: ${item.sourceName} (Type: ${item.type}, Format: ${item.fileFormat || 'TXT'}) ===`;
      if (item.summary) {
        part += `\nSummary: ${item.summary}`;
      }
      
      if (item.contentSnippet && item.contentSnippet.trim()) {
        const snippet = item.contentSnippet.trim();
        if (snippet.startsWith('[') || snippet.startsWith('{')) {
          try {
            const parsed = JSON.parse(snippet);
            const list = Array.isArray(parsed) ? parsed : [parsed];
            const cleanLines = list.map((obj, i) => {
              const q = obj.questionUz || obj.question || obj.questionRu || obj.questionEn || '';
              const a = obj.answerUz || obj.answer || obj.answerRu || obj.answerEn || '';
              return q && a ? `${i + 1}. Q: ${q}\n   A: ${a}` : '';
            }).filter(Boolean);
            if (cleanLines.length > 0) {
              part += `\nEXTRACTED Q&A PAIRS:\n${cleanLines.join('\n')}`;
            } else {
              part += `\nFULL DOCUMENT TEXT / SNIPPET:\n${snippet}`;
            }
          } catch {
            part += `\nFULL DOCUMENT TEXT / SNIPPET:\n${snippet}`;
          }
        } else {
          part += `\nFULL DOCUMENT TEXT / SNIPPET:\n${snippet}`;
        }
      }

      if (item.faqs && item.faqs.length > 0) {
        part += `\nEXTRACTED Q&A PAIRS:\n` + item.faqs.map((f, i) => `${i + 1}. Q: ${f.question}\n   A: ${f.answer}`).join('\n');
      }

      contextParts.push(part);
    });

    return contextParts.join('\n\n========================================\n\n');
  };

  // Dedicated function to escalate unresolved queries directly to human Staff Support
  const handleEscalateToSupport = (userQueryText?: string, reason?: string) => {
    const query = userQueryText || inputText || 'Unresolved customer banking query';
    const ticketId = `TICK-${Date.now().toString().slice(-4)}`;
    
    const newTicket: SupportTicket = {
      id: ticketId,
      customerName: currentUser?.displayName || 'Akmal Karimov (Client)',
      accountTier: currentUser?.role === 'admin' ? 'Enterprise' : 'Gold',
      subject: `AI Escalation: ${query.slice(0, 48)}${query.length > 48 ? '...' : ''}`,
      issue: `Customer asked: "${query}".\n\nAI Status: ${reason || 'Escalated by customer request / AI could not resolve automatically with high certainty'}.\nTimestamp: ${new Date().toLocaleString()}`,
      status: 'Open',
      priority: 'High',
      date: new Date().toISOString().slice(0, 10),
      aiSuggestedReply: ''
    };

    if (setTickets) {
      setTickets(prev => [newTicket, ...prev]);
    }

    const escalationMessage: ChatMessage = {
      id: `msg-esc-${Date.now()}`,
      sender: 'assistant',
      text: `📋 **Escalated to KDB Staff Support (Ticket #${ticketId})**\n\nYour request has been forwarded directly to our Human Customer Support specialists queue. Only authorized bank staff will review your case details and reply.\n\n• **Status:** Open in Staff Escalation Queue\n• **Priority:** High Priority\n• **Account Tier:** ${newTicket.accountTier}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sources: ['KDB Core Support Desk & Escalation Queue'],
      suggestedActions: [
        '💳 Check My Balances',
        '🔄 Switch to Copilot Mode',
        '📜 View Transaction History'
      ]
    };

    setMessages(prev => [...prev, escalationMessage]);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    if (!textToSend) setInputText('');
    setIsLoading(true);

    try {
      const lowerQuery = query.toLowerCase();

      // Check for human support / escalation trigger
      if (
        lowerQuery.includes('support') ||
        lowerQuery.includes('operator') ||
        lowerQuery.includes('staff') ||
        lowerQuery.includes('hal qilolmad') ||
        lowerQuery.includes('muammo') ||
        lowerQuery.includes('human') ||
        lowerQuery.includes('yordam berolmad')
      ) {
        if (assistantMode === 'security-native') {
          openSecurityModal('support');
          setTimeout(() => {
            const assistantMessage: ChatMessage = {
              id: `msg-ai-${Date.now()}`,
              sender: 'assistant',
              text: `🔒 **Direct Staff Support Window Opened**\n\nYour confidential Human Staff Support window is open. You can draft and submit your inquiry directly to authorized bank personnel without AI exposure.`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              sources: ['KDB Core Support Desk & Escalation Queue']
            };
            setMessages(prev => [...prev, assistantMessage]);
            setIsLoading(false);
          }, 300);
          return;
        }

        setTimeout(() => {
          handleEscalateToSupport(query, 'Direct customer escalation to human staff');
          setIsLoading(false);
        }, 400);
        return;
      }

      // Check for banking intents
      const parsedIntent = parseBankingIntent(query);

      // =========================================================================
      // MODE 1: KNOWLEDGE-ONLY AI (Trained Files Only, No Transaction Execution)
      // =========================================================================
      if (assistantMode === 'knowledge-only') {
        if (parsedIntent.intent === 'transfer') {
          setTimeout(() => {
            const assistantMessage: ChatMessage = {
              id: `msg-ai-${Date.now()}`,
              sender: 'assistant',
              text: `📚 **Knowledge-Only Mode Active**\n\nIn this mode, direct financial execution in chat is disabled. According to KDB Bank Uzbekistan regulations, interbank transfers can be executed via KDB Mobile Banking, KDB Net, or by switching this assistant to **Full Copilot** or **Security Modal** mode via the menu above.\n\n• Daily transfer limit for verified accounts: 50,000,000 UZS / $5,000\n• Central Bank 0% commission on interbank transfers up to 10M UZS`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              sources: ['KDB Knowledge Base: Interbank Guidelines & Tariffs']
            };
            setMessages(prev => [...prev, assistantMessage]);
            setIsLoading(false);
          }, 400);
          return;
        }

        if (parsedIntent.intent === 'balance') {
          setTimeout(() => {
            const assistantMessage: ChatMessage = {
              id: `msg-ai-${Date.now()}`,
              sender: 'assistant',
              text: `📚 **Knowledge-Only Mode Active**\n\nDirect balance queries and transaction cards are hidden in strict Knowledge mode to preserve pure advisory chat. You can switch to **Full Copilot** (for in-chat balance snapshots) or **Security Modal** (for direct verified balance view) using the mode menu at the top.`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              sources: ['KDB Core Security & Data Privacy Policy']
            };
            setMessages(prev => [...prev, assistantMessage]);
            setIsLoading(false);
          }, 400);
          return;
        }

        if (parsedIntent.intent === 'exchange') {
          setTimeout(() => {
            const assistantMessage: ChatMessage = {
              id: `msg-ai-${Date.now()}`,
              sender: 'assistant',
              text: `📚 **KDB Official Foreign Exchange Rates**:\n\n• **USD/UZS**: Buy ${EXCHANGE_RATES.USD_UZS_BUY.toLocaleString()} UZS | Sell ${EXCHANGE_RATES.USD_UZS_SELL.toLocaleString()} UZS\n• **EUR/UZS**: Buy ${EXCHANGE_RATES.EUR_UZS_BUY.toLocaleString()} UZS | Sell ${EXCHANGE_RATES.EUR_UZS_SELL.toLocaleString()} UZS\n\nTo execute direct currency conversions, select **Full Copilot** or **Security Modal** from the top menu.`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              sources: ['KDB Treasury FX Bulletin']
            };
            setMessages(prev => [...prev, assistantMessage]);
            setIsLoading(false);
          }, 400);
          return;
        }

        if (parsedIntent.intent === 'compliance') {
          setTimeout(() => {
            const assistantMessage: ChatMessage = {
              id: `msg-ai-${Date.now()}`,
              sender: 'assistant',
              text: `📚 **AML & Compliance Regulations**:\n\nAll payments processed through KDB Bank Uzbekistan are screened under Central Bank Law No. ZRU-558 on Combating Money Laundering and Terrorist Financing. Transactions over 100,000,000 UZS or foreign currency equivalents are subject to mandatory monitoring.\n\nTo run counterparty sanctions checks, use **Security Modal** or **Full Copilot**.`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              sources: ['KDB Compliance Department & CBU Guidelines']
            };
            setMessages(prev => [...prev, assistantMessage]);
            setIsLoading(false);
          }, 400);
          return;
        }
      }

      // =========================================================================
      // MODE 3: SECURITY-FIRST / NATIVE APP MODAL MODE (Isolated UI Sandbox)
      // =========================================================================
      if (assistantMode === 'security-native') {
        if (parsedIntent.intent === 'transfer') {
          const payload: TransferPayload = parsedIntent.data;
          openSecurityModal('transfer', payload);

          setTimeout(() => {
            const assistantMessage: ChatMessage = {
              id: `msg-ai-${Date.now()}`,
              sender: 'assistant',
              text: `🔒 **Security Modal Triggered: Secure Transfer**\n\nOpening the native banking transfer window for **${payload.toBeneficiary}** (${formatCurrency(payload.amount, payload.currency)}). Your transaction is routed via isolated direct clearing without AI token exposure.`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              sources: ['KDB Hardware Security Sandbox']
            };
            setMessages(prev => [...prev, assistantMessage]);
            setIsLoading(false);
          }, 300);
          return;
        }

        if (parsedIntent.intent === 'balance') {
          openSecurityModal('balance');

          setTimeout(() => {
            const assistantMessage: ChatMessage = {
              id: `msg-ai-${Date.now()}`,
              sender: 'assistant',
              text: `🔒 **Security Modal Triggered: Account Balances**\n\nOpening your isolated, client-side verified KDB Account Balances modal dialog directly from the core ledger.`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              sources: ['KDB Direct API Sandbox']
            };
            setMessages(prev => [...prev, assistantMessage]);
            setIsLoading(false);
          }, 300);
          return;
        }

        if (parsedIntent.intent === 'exchange') {
          openSecurityModal('exchange');

          setTimeout(() => {
            const assistantMessage: ChatMessage = {
              id: `msg-ai-${Date.now()}`,
              sender: 'assistant',
              text: `🔒 **Security Modal Triggered: Currency FX**\n\nOpening the native KDB Currency FX Exchange modal window for direct interbank conversion.`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              sources: ['KDB Direct Clearing Desk']
            };
            setMessages(prev => [...prev, assistantMessage]);
            setIsLoading(false);
          }, 300);
          return;
        }

        if (parsedIntent.intent === 'compliance') {
          const ben = parsedIntent.data?.beneficiary || 'Apex Logistics LLC';
          openSecurityModal('compliance', undefined, ben);

          setTimeout(() => {
            const assistantMessage: ChatMessage = {
              id: `msg-ai-${Date.now()}`,
              sender: 'assistant',
              text: `🔒 **Security Modal Triggered: Confidential AML Screening**\n\nOpening the confidential AML & Sanctions screening dialog for **${ben}**. Screenings run directly on the core banking compliance matrix without external AI prompt transmission.`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              sources: ['CBU Financial Monitoring & OFAC Screening Matrix']
            };
            setMessages(prev => [...prev, assistantMessage]);
            setIsLoading(false);
          }, 300);
          return;
        }

        if (parsedIntent.intent === 'history') {
          openSecurityModal('balance');

          setTimeout(() => {
            const assistantMessage: ChatMessage = {
              id: `msg-ai-${Date.now()}`,
              sender: 'assistant',
              text: `🔒 **Security Modal Triggered: Ledger Statements**\n\nOpening your verified KDB core account statements and balance register in the isolated dialog.`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              sources: ['KDB Core Transaction Ledger']
            };
            setMessages(prev => [...prev, assistantMessage]);
            setIsLoading(false);
          }, 300);
          return;
        }
      }

      // =========================================================================
      // MODE 2: FULL CONVERSATIONAL COPILOT (In-Chat Interactive Widgets)
      // =========================================================================
      if (parsedIntent.intent === 'balance') {
        const snapshot = JSON.parse(JSON.stringify(accounts));
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        setTimeout(() => {
          const assistantMessage: ChatMessage = {
            id: `msg-ai-${Date.now()}`,
            sender: 'assistant',
            text: `Here is the recorded balance snapshot of your KDB Bank Uzbekistan accounts (captured at ${timeStr}):`,
            timestamp: timeStr,
            sources: ['KDB Core Banking API', 'Account Balance Registry'],
            widget: 'balance',
            widgetData: {
              snapshotAccounts: snapshot,
              snapshotTime: timeStr,
              snapshotTimestamp: Date.now()
            },
            suggestedActions: [
              '💸 Send Money (Transfer)',
              '💱 Exchange Currencies',
              '📜 Transaction History'
            ]
          };
          setMessages(prev => [...prev, assistantMessage]);
          setIsLoading(false);
        }, 400);
        return;
      }

      if (parsedIntent.intent === 'transfer') {
        const payload: TransferPayload = parsedIntent.data;
        setTimeout(() => {
          const assistantMessage: ChatMessage = {
            id: `msg-ai-${Date.now()}`,
            sender: 'assistant',
            text: `Transfer request prepared. Sending ${formatCurrency(payload.amount, payload.currency)} to ${payload.toBeneficiary}.\n\n🛡️ **Compliance & AML Check:** Passed sanctions screening (Risk: 2/100). Please choose your sender account and confirm below:`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sources: ['KDB Instant Payments Gateway', 'AML/Sanctions Screen Engine'],
            widget: 'transfer',
            widgetData: payload,
            suggestedActions: [
              '💳 Check My Balances',
              '🛡️ Full Compliance Screening',
              '📜 View Transaction History'
            ]
          };
          setMessages(prev => [...prev, assistantMessage]);
          setIsLoading(false);
        }, 500);
        return;
      }

      if (parsedIntent.intent === 'compliance') {
        const compData: ComplianceCheckData = parsedIntent.data;
        setTimeout(() => {
          const assistantMessage: ChatMessage = {
            id: `msg-ai-${Date.now()}`,
            sender: 'assistant',
            text: `KDB Bank Automated Security & AML Compliance Report (${compData.beneficiary}):\n\n• Sanctions Screening (OFAC/UN/CB): Clean\n• AML Risk Assessment Score: ${compData.riskScore}/100 (Low Risk)\n• Daily Limit Status: Verified & Approved`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sources: ['OFAC & UN Sanctions DB', 'KDB AML Compliance Matrix'],
            widget: 'compliance',
            widgetData: compData,
            suggestedActions: [
              `💸 Transfer funds to ${compData.beneficiary}`,
              '💳 View Account Balances'
            ]
          };
          setMessages(prev => [...prev, assistantMessage]);
          setIsLoading(false);
        }, 500);
        return;
      }

      if (parsedIntent.intent === 'exchange') {
        const amount = parsedIntent.data?.defaultAmount || 100;
        setTimeout(() => {
          const assistantMessage: ChatMessage = {
            id: `msg-ai-${Date.now()}`,
            sender: 'assistant',
            text: `Official KDB Bank Exchange Rates:\n• 1 USD = ${EXCHANGE_RATES.USD_UZS_BUY.toLocaleString()} UZS (Buy)\n• 1 USD = ${EXCHANGE_RATES.USD_UZS_SELL.toLocaleString()} UZS (Sell)\n\nYou can convert currencies directly using the interactive converter below:`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sources: ['KDB FX Trading Desk', 'Central Bank of Uzbekistan Rates'],
            widget: 'exchange',
            widgetData: { defaultAmount: amount },
            suggestedActions: [
              '💳 Check Balances',
              '💸 Send Money'
            ]
          };
          setMessages(prev => [...prev, assistantMessage]);
          setIsLoading(false);
        }, 400);
        return;
      }

      if (parsedIntent.intent === 'history') {
        setTimeout(() => {
          const assistantMessage: ChatMessage = {
            id: `msg-ai-${Date.now()}`,
            sender: 'assistant',
            text: "Here is your recent banking transaction history across all KDB accounts:",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sources: ['KDB Core Transaction Ledger'],
            widget: 'history',
            widgetData: transactions,
            suggestedActions: [
              '💳 Check My Balances',
              '💸 New Transfer'
            ]
          };
          setMessages(prev => [...prev, assistantMessage]);
          setIsLoading(false);
        }, 400);
        return;
      }

      // =========================================================================
      // Standard Knowledge Base / Gemini AI Query
      // =========================================================================
      const historyPayload = messages
        .filter(m => m.id !== 'm-1')
        .map(m => ({
          role: m.sender === 'user' ? 'user' : 'model',
          text: m.text
        }));

      const dynamicContext = buildKnowledgeContext();
      let answerText = '';

      try {
        const res = await fetch('/api/gemini/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: query,
            history: historyPayload,
            context: dynamicContext
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.text) {
            answerText = data.text;
          }
        }
      } catch (networkErr) {
        console.warn('Backend server not reachable, using client-side AI engine:', networkErr);
      }

      if (!answerText) {
        answerText = generateClientSideAnswer(query, dynamicContext);
      }

      const topSources = knowledgeItems.length > 0 
        ? knowledgeItems.slice(0, 3).map(k => k.sourceName)
        : ['KDB Bank AI Knowledge Base', 'Official Tariffs & Guidelines'];

      const assistantMessage: ChatMessage = {
        id: `msg-ai-${Date.now()}`,
        sender: 'assistant',
        text: answerText || "KDB Bank Uzbekistan: Your request has been processed.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: topSources,
        suggestedActions: assistantMode === 'knowledge-only' 
          ? undefined 
          : [
              '💳 Check Balances',
              '💸 Transfer 1.5M UZS to Akmal',
              '💱 Exchange Rates'
            ]
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      // Automatically escalate to support on unhandled failures
      handleEscalateToSupport(query, 'Unhandled system error in AI inference engine');
    } finally {
      setIsLoading(false);
    }
  };

  // When a transfer completes in the widget - deduct from chosen account
  const handleCompleteTransfer = (payload: TransferPayload) => {
    setAccounts(prev => prev.map(acc => {
      if (acc.id === payload.fromAccount) {
        return {
          ...acc,
          balance: Math.max(0, acc.balance - payload.amount)
        };
      }
      return acc;
    }));

    const senderAcc = accounts.find(a => a.id === payload.fromAccount);
    const accLabel = senderAcc ? `${senderAcc.name} (${senderAcc.cardMask || senderAcc.accountNumber.slice(-6)})` : 'Primary Checking';

    const newTxn: BankTransaction = {
      id: payload.receiptId || `TXN-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      account: accLabel,
      merchant: payload.toBeneficiary,
      category: 'Transfer',
      amount: payload.amount,
      type: 'Debit',
      status: 'Completed',
      riskScore: 2
    };

    if (setTransactions) {
      setTransactions(prev => [newTxn, ...prev]);
    }
  };

  // When currency exchange happens
  const handleExecuteExchange = (usdAmount: number, uzsAmount: number, direction: 'BUY' | 'SELL') => {
    setAccounts(prev => prev.map(acc => {
      if (direction === 'BUY') {
        if (acc.currency === 'UZS' && acc.id === 'ACC-UZS-01') {
          return { ...acc, balance: Math.max(0, acc.balance - uzsAmount) };
        }
        if (acc.currency === 'USD' && acc.id === 'ACC-USD-01') {
          return { ...acc, balance: acc.balance + usdAmount };
        }
      } else {
        if (acc.currency === 'USD' && acc.id === 'ACC-USD-01') {
          return { ...acc, balance: Math.max(0, acc.balance - usdAmount) };
        }
        if (acc.currency === 'UZS' && acc.id === 'ACC-UZS-01') {
          return { ...acc, balance: acc.balance + uzsAmount };
        }
      }
      return acc;
    }));
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = (id: string, text: string) => {
    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[•*#_`]/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'en-US';
    utterance.rate = 1.0;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  const totalUzs = accounts.reduce((acc, curr) => {
    if (curr.currency === 'UZS') return acc + curr.balance;
    if (curr.currency === 'USD') return acc + curr.balance * 12850;
    return acc;
  }, 0);

  return (
    <div className="p-4 sm:p-8 space-y-5 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
            <span className="text-[10px] sm:text-xs font-semibold tracking-wider uppercase text-indigo-300">
              KDB Conversational Banking Copilot
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold">KDB Bank Uzbekistan AI-CX Assistant</h1>
          <p className="text-xs text-slate-300 max-w-xl">
            Live balance snapshots with historical comparison, AML compliance screening, instant transfers, and direct human staff escalation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl text-xs border border-white/10">
            <span className="text-[10px] text-slate-300 block">Total Assets (UZS Eq.)</span>
            <span className="font-bold text-emerald-400 font-mono text-sm">
              {formatCurrency(totalUzs, 'UZS')}
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl text-xs border border-white/10 hidden sm:block">
            <span className="text-[10px] text-slate-300 block">USD MasterCard</span>
            <span className="font-bold text-white font-mono text-sm">
              ${accounts.find(a => a.currency === 'USD')?.balance.toLocaleString() || '3,850'}
            </span>
          </div>
        </div>
      </div>

      {/* 3 ASSISTANT MODES MENU */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 px-1">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Assistant Operation Mode
                </span>
                <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full">
                  Menu Selection
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block">
                {assistantMode === 'knowledge-only' && '1. Knowledge-Only AI: Strict RAG advisory from trained bank files only • Pure chat'}
                {assistantMode === 'copilot' && '2. Full Copilot: Conversational AI with in-chat interactive widgets & balance snapshots'}
                {assistantMode === 'security-native' && '3. Security Modal: Zero-AI direct core banking dialogs • Client-side isolated clearing'}
              </span>
            </div>
          </div>

          {/* 3-Mode Segmented Menu Bar */}
          <div className="inline-flex p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 gap-1 overflow-x-auto no-scrollbar">
            {/* Mode 1 */}
            <button
              onClick={() => setAssistantMode('knowledge-only')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                assistantMode === 'knowledge-only'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>1. Knowledge-Only</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-600 border border-indigo-100">
                Pure Chat
              </span>
            </button>

            {/* Mode 2 */}
            <button
              onClick={() => setAssistantMode('copilot')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                assistantMode === 'copilot'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>2. Full Copilot</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                Widgets
              </span>
            </button>

            {/* Mode 3 */}
            <button
              onClick={() => setAssistantMode('security-native')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                assistantMode === 'security-native'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <ShieldCheck className={`w-3.5 h-3.5 shrink-0 ${assistantMode === 'security-native' ? 'text-white' : 'text-emerald-600'}`} />
              <span>3. Security Modal</span>
              <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                assistantMode === 'security-native' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                Zero-AI
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Preset Category Quick Action Bar (Hidden in Knowledge-Only Mode) */}
      {assistantMode !== 'knowledge-only' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <button
            onClick={() => {
              if (assistantMode === 'security-native') {
                openSecurityModal('balance');
              } else {
                handleSendMessage("Show my account balances");
              }
            }}
            className="bg-white border border-slate-200/90 hover:border-indigo-500 rounded-xl p-3 text-left transition-all hover:shadow-xs group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
              <Wallet className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-slate-800">Check Balances</p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {assistantMode === 'security-native' ? 'Direct Balance Modal' : 'UZS, USD & Snapshot'}
            </p>
          </button>

          <button
            onClick={() => {
              if (assistantMode === 'security-native') {
                openSecurityModal('transfer', {
                  amount: 1500000,
                  currency: 'UZS',
                  toBeneficiary: 'Akmal Karimov',
                  toCardOrAccount: '8600 4912 3018 7741'
                });
              } else {
                handleSendMessage("Transfer 1,500,000 UZS to Akmal Karimov");
              }
            }}
            className="bg-white border border-slate-200/90 hover:border-indigo-500 rounded-xl p-3 text-left transition-all hover:shadow-xs group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
              <CreditCard className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-slate-800">Send Money</p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {assistantMode === 'security-native' ? 'Direct Transfer Modal' : '1.5M UZS to Akmal'}
            </p>
          </button>

          <button
            onClick={() => {
              if (assistantMode === 'security-native') {
                openSecurityModal('compliance', undefined, 'Apex Logistics LLC');
              } else {
                handleSendMessage("Check AML compliance for Apex Logistics");
              }
            }}
            className="bg-white border border-slate-200/90 hover:border-indigo-500 rounded-xl p-3 text-left transition-all hover:shadow-xs group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-slate-800">AML & Compliance</p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {assistantMode === 'security-native' ? 'Direct AML Modal' : 'Sanctions & Risk'}
            </p>
          </button>

          <button
            onClick={() => {
              if (assistantMode === 'security-native') {
                openSecurityModal('exchange');
              } else {
                handleSendMessage("What is the exchange rate for $100 to UZS?");
              }
            }}
            className="bg-white border border-slate-200/90 hover:border-indigo-500 rounded-xl p-3 text-left transition-all hover:shadow-xs group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-slate-800">Exchange Rates</p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {assistantMode === 'security-native' ? 'Direct FX Modal' : `1 USD = ${EXCHANGE_RATES.USD_UZS_BUY.toLocaleString()} UZS`}
            </p>
          </button>

          <button
            onClick={() => {
              if (assistantMode === 'security-native') {
                openSecurityModal('support');
              } else {
                handleEscalateToSupport(undefined, 'Customer initiated manual staff escalation button');
              }
            }}
            className="bg-white border border-rose-200 hover:border-rose-400 rounded-xl p-3 text-left transition-all hover:shadow-xs group cursor-pointer col-span-2 sm:col-span-1"
          >
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
              <Headphones className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-rose-800">Staff Support</p>
            <p className="text-[10px] text-rose-500 mt-0.5">
              {assistantMode === 'security-native' ? 'Direct Ticket Modal' : 'Human Desk'}
            </p>
          </button>
        </div>
      )}

      {/* Main Chat Box */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col h-[560px]">
        {/* Messages Container */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-5">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${
                msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white font-medium text-xs shadow-xs ${
                  msg.sender === 'user'
                    ? 'bg-slate-800'
                    : 'bg-indigo-600'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-5 h-5" />}
              </div>

              {/* Bubble Content */}
              <div className="space-y-2 max-w-full">
                <div
                  className={`p-4 rounded-2xl text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-slate-50 border border-slate-200/80 text-slate-800 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {/* Render Embedded Interactive Widgets */}
                  {msg.widget === 'balance' && (
                    <BalanceWidget 
                      data={msg.widgetData}
                      currentAccounts={accounts}
                      onSelectTransfer={(acc) => {
                        handleSendMessage(`Transfer money from ${acc.name}`);
                      }}
                      onRefresh={() => {
                        handleSendMessage("Show my account balances");
                      }}
                    />
                  )}

                  {msg.widget === 'transfer' && msg.widgetData && (
                    <TransferWidget
                      initialPayload={msg.widgetData}
                      accounts={accounts}
                      onCompleteTransfer={handleCompleteTransfer}
                      onCancel={() => {
                        handleSendMessage("Transfer cancelled");
                      }}
                    />
                  )}

                  {msg.widget === 'compliance' && msg.widgetData && (
                    <ComplianceWidget
                      data={msg.widgetData}
                      onProceedTransfer={(comp) => {
                        handleSendMessage(`Transfer 1,500,000 UZS to ${comp.beneficiary}`);
                      }}
                    />
                  )}

                  {msg.widget === 'exchange' && (
                    <ExchangeWidget
                      defaultAmount={msg.widgetData?.defaultAmount || 100}
                      accounts={accounts}
                      onExecuteExchange={handleExecuteExchange}
                    />
                  )}

                  {msg.widget === 'history' && (
                    <HistoryWidget
                      transactions={transactions}
                    />
                  )}
                </div>

                {/* Sources & Controls for Assistant */}
                {msg.sender === 'assistant' && (
                  <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-slate-400">{msg.timestamp}</span>
                      {msg.sources && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                            Source: {msg.sources[0]}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Escalate to Human Support Action */}
                      <button
                        onClick={() => handleEscalateToSupport(msg.text, 'Escalated from message action menu')}
                        title="Escalate issue to KDB Staff Support"
                        className="text-[11px] font-medium text-slate-400 hover:text-rose-600 px-1.5 py-0.5 rounded hover:bg-rose-50 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Headphones className="w-3 h-3" />
                        <span className="hidden sm:inline">Escalate to Staff</span>
                      </button>

                      <button
                        onClick={() => handleSpeak(msg.id, msg.text)}
                        title="Listen to audio"
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-slate-100 transition-colors"
                      >
                        {speakingId === msg.id ? (
                          <VolumeX className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        onClick={() => handleCopy(msg.id, msg.text)}
                        title="Copy text"
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-slate-100 transition-colors"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Suggested Actions chips (Hidden in Knowledge-Only Mode) */}
                {msg.suggestedActions && assistantMode !== 'knowledge-only' && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {msg.suggestedActions.map((action, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          if (action.includes('Switch to Full Copilot')) {
                            setAssistantMode('copilot');
                          } else if (action.includes('Switch to Security Sandbox') || action.includes('Open Security Sandbox')) {
                            setAssistantMode('security-native');
                            setIsNativeModalOpen(true);
                          } else {
                            handleSendMessage(action);
                          }
                        }}
                        className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full font-medium transition-colors cursor-pointer"
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 max-w-xl">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0">
                <Bot className="w-5 h-5 animate-spin" />
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-500 flex items-center gap-2">
                <RotateCw className="w-4 h-4 text-indigo-600 animate-spin" />
                <span>KDB AI core clearing & intelligence engine is processing your request...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                assistantMode === 'knowledge-only'
                  ? "Ask anything from trained documents, credit terms, tariffs..."
                  : assistantMode === 'security-native'
                  ? "Type transfer, balance, or FX request (opens isolated security modal)..."
                  : "e.g., 'Check balance', 'Transfer 1.5M UZS to Akmal', 'Exchange $100 to UZS'..."
              }
              className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-medium text-xs sm:text-sm transition-all duration-150 flex items-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <span>Send</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Native Security Sandbox Modal (Mode 3) */}
      <NativeBankingModal
        isOpen={isNativeModalOpen}
        onClose={() => setIsNativeModalOpen(false)}
        initialTab={nativeModalTab}
        prefilledTransfer={prefilledTransfer}
        prefilledComplianceBeneficiary={prefilledComplianceBeneficiary}
        accounts={accounts}
        setAccounts={setAccounts}
        onCompleteTransfer={handleCompleteTransfer}
        onSubmitSupportTicket={(newTicket) => {
          if (setTickets) {
            setTickets(prev => [newTicket, ...prev]);
          }
          const ticketMsg: ChatMessage = {
            id: `msg-sup-${Date.now()}`,
            sender: 'assistant',
            text: `📋 **Staff Support Ticket Registered (#${newTicket.id})**\n\nSubject: **${newTicket.subject}**\nPriority: **${newTicket.priority}**\n\nYour inquiry has been submitted directly to authorized KDB bank staff. You can view updates in the **Staff Support Desk** tab.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sources: ['KDB Encrypted Support Gateway']
          };
          setMessages(prev => [...prev, ticketMsg]);
        }}
      />
    </div>
  );
};
