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
  Globe2,
  ShieldCheck,
  CreditCard,
  Building2,
  HelpCircle,
  Wallet,
  ArrowRightLeft,
  History,
  ShieldAlert,
  ArrowUpRight,
  TrendingUp,
  Lock
} from 'lucide-react';
import { ChatMessage, KnowledgeItem, BankAccount, BankTransaction, TransferPayload, ComplianceCheckData } from '../types';
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

interface AIAssistantProps {
  knowledgeItems?: KnowledgeItem[];
  transactions?: BankTransaction[];
  setTransactions?: React.Dispatch<React.SetStateAction<BankTransaction[]>>;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ 
  knowledgeItems = [],
  transactions = [],
  setTransactions
}) => {
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
      text: "Assalomu alaykum! Men KDB Bank Uzbekistan AI-CX Copilot yordamchingizman.\n\nMen orqali chatning o'zida:\n• Hisob va kartalaringiz balansini ko'rishingiz\n• Xavfsiz pul o'tkazmalarini amalga oshirishingiz (AML/Compliance tekshiruvi bilan)\n• Valyutani konvertatsiya qilishingiz\n• Kredit, depozit va bank qoidalari bo'yicha savollaringizga rasmiy javob olishingiz mumkin.",
      timestamp: '09:00',
      sources: ['KDB Bank Core Banking & Knowledge Base'],
      suggestedActions: [
        '💳 Balansimni ko\'rsat',
        '💸 Akmal Karimovga 1 500 000 so\'m o\'tkaz',
        '🛡️ Compliance tekshiruvi: Apex Logistics',
        '💱 100$ ni so\'mga ayirboshla',
        '📜 So\'nggi tranzaksiyalar tarixi'
      ]
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

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
      // 1. Check for interactive conversational banking intents
      const parsedIntent = parseBankingIntent(query);

      if (parsedIntent.intent === 'balance') {
        setTimeout(() => {
          const assistantMessage: ChatMessage = {
            id: `msg-ai-${Date.now()}`,
            sender: 'assistant',
            text: "KDB Bank hisoblaringiz va kartalaringiz bo'yicha joriy qoldiqlar:",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sources: ['KDB Core Banking API', 'Account Balance Registry'],
            widget: 'balance',
            widgetData: accounts,
            suggestedActions: [
              '💸 Pul o\'tkazish (Transfer)',
              '💱 Valyuta ayirboshlash',
              '📜 So\'nggi tranzaksiyalar'
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
            text: `So'rovingiz qabul qilindi. ${payload.toBeneficiary} nomiga ${formatCurrency(payload.amount, payload.currency)} miqdorida pul o'tkazish tayyorlandi.\n\n🛡️ **Compliance & AML tekshiruvi:** BMT va Markaziy Bank sanksiya ro'yxatlari bo'yicha risk darajasi juda past (2/100). Quyidagi kartadan tranzaksiyani tasdiqlang:`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sources: ['KDB Instant Payments Gateway', 'AML/Sanctions Screen Engine'],
            widget: 'transfer',
            widgetData: payload,
            suggestedActions: [
              '💳 Balansimni tekshirish',
              '🛡️ Kengaytirilgan Compliance ko\'rik',
              'Bekor qilish'
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
            text: `KDB Bank Avtomatlashtirilgan Xavfsizlik & AML Compliance Tahlili (${compData.beneficiary}):\n\n• Sanctions Screening (OFAC/UN/CB): Toza (Clean)\n• AML Risk Ko'rsatkichi: ${compData.riskScore}/100 (Past xavf)\n• Tranzaksiya Limiti: Tasdiqlangan`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sources: ['OFAC & UN Sanctions DB', 'KDB AML Compliance Matrix'],
            widget: 'compliance',
            widgetData: compData,
            suggestedActions: [
              `💸 ${compData.beneficiary}ga pul o'tkazish`,
              '💳 Balansni ko\'rish'
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
            text: `KDB Bank rasmiy valyuta kursi:\n• 1 USD = ${EXCHANGE_RATES.USD_UZS_BUY.toLocaleString()} UZS (Sotib olish)\n• 1 USD = ${EXCHANGE_RATES.USD_UZS_SELL.toLocaleString()} UZS (Sotish)\n\nQuyidagi interaktiv kalkulyatordan to'g'ridan-to'g'ri ayirboshlashni amalga oshirishingiz mumkin:`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sources: ['KDB FX Trading Desk', 'Central Bank of Uzbekistan Rates'],
            widget: 'exchange',
            widgetData: { defaultAmount: amount },
            suggestedActions: [
              '💳 Balansimni tekshirish',
              '💸 Pul o\'tkazish'
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
            text: "KDB Bank hisoblaringiz bo'yicha so'nggi amalga oshirilgan to'lov va operatsiyalar tarixi:",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sources: ['KDB Core Transaction Ledger'],
            widget: 'history',
            widgetData: transactions,
            suggestedActions: [
              '💳 Balansimni ko\'rsat',
              '💸 Yangi pul o\'tkazish'
            ]
          };
          setMessages(prev => [...prev, assistantMessage]);
          setIsLoading(false);
        }, 400);
        return;
      }

      // 2. Standard Knowledge Base / Gemini AI Query
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
        text: answerText || "KDB Bank O'zbekiston: So'rovingiz qabul qilindi.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: topSources,
        suggestedActions: [
          '💳 Balansimni ko\'rsat',
          '💸 Akmalga 1.5M so\'m o\'tkaz',
          '💱 Valyuta kursi'
        ]
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      const fallback = generateClientSideAnswer(query, buildKnowledgeContext());
      setMessages(prev => [
        ...prev,
        {
          id: `msg-err-${Date.now()}`,
          sender: 'assistant',
          text: fallback,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // When a transfer completes in the widget
  const handleCompleteTransfer = (payload: TransferPayload) => {
    // Deduct amount from selected account
    setAccounts(prev => prev.map(acc => {
      if (acc.id === payload.fromAccount || (payload.currency === 'USD' && acc.currency === 'USD') || (payload.currency === 'UZS' && acc.id === 'ACC-UZS-01')) {
        return {
          ...acc,
          balance: Math.max(0, acc.balance - payload.amount)
        };
      }
      return acc;
    }));

    // Add to transactions list
    const newTxn: BankTransaction = {
      id: payload.receiptId || `TXN-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      account: payload.fromAccount || 'ACC-UZS-01 (Checking)',
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
        // Giving USD, getting UZS
        if (acc.currency === 'USD') return { ...acc, balance: Math.max(0, acc.balance - usdAmount) };
        if (acc.currency === 'UZS' && acc.id === 'ACC-UZS-01') return { ...acc, balance: acc.balance + uzsAmount };
      } else {
        // Giving UZS, getting USD
        if (acc.currency === 'UZS' && acc.id === 'ACC-UZS-01') return { ...acc, balance: Math.max(0, acc.balance - uzsAmount) };
        if (acc.currency === 'USD') return { ...acc, balance: acc.balance + usdAmount };
      }
      return acc;
    }));
  };

  const handleSpeak = (id: string, text: string) => {
    if ('speechSynthesis' in window) {
      if (speakingId === id) {
        window.speechSynthesis.cancel();
        setSpeakingId(null);
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setSpeakingId(null);
      utterance.onerror = () => setSpeakingId(null);
      setSpeakingId(id);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const totalUzs = accounts.reduce((acc, curr) => {
    if (curr.currency === 'UZS') return acc + curr.balance;
    if (curr.currency === 'USD') return acc + curr.balance * 12850;
    return acc;
  }, 0);

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header Banner with Live Stats */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-4 sm:p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
            <span className="text-[10px] sm:text-xs font-semibold tracking-wider uppercase text-indigo-300">
              KDB Mega-Chat Conversational Banking
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold">KDB Bank Uzbekistan AI-CX Assistant</h1>
          <p className="text-xs text-slate-300 max-w-xl">
            Chatda to'g'ridan-to'g'ri balansni ko'rish, AML/Compliance xavfsizlik tekshiruvi va tezkor tranzaksiyalarni amalga oshiring.
          </p>
        </div>

        {/* Live Balance Summary Chips */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl text-xs border border-white/10">
            <span className="text-[10px] text-slate-300 block">Jami Aktivlar (UZS)</span>
            <span className="font-bold text-emerald-400 font-mono text-sm">
              {formatCurrency(totalUzs, 'UZS')}
            </span>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl text-xs border border-white/10 hidden sm:block">
            <span className="text-[10px] text-slate-300 block">USD Hisob</span>
            <span className="font-bold text-white font-mono text-sm">
              ${accounts.find(a => a.currency === 'USD')?.balance.toLocaleString() || '3,850'}
            </span>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 border border-white/10 text-emerald-300 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>AML Clean</span>
          </div>
        </div>
      </div>

      {/* Preset Category Quick Action Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <button
          onClick={() => handleSendMessage("Mening hisob balansimni ko'rsat")}
          className="bg-white border border-slate-200/90 hover:border-indigo-500 rounded-xl p-3 text-left transition-all hover:shadow-xs group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
            <Wallet className="w-4 h-4" />
          </div>
          <p className="text-xs font-bold text-slate-800">Balansni Ko'rish</p>
          <p className="text-[10px] text-slate-400 mt-0.5">UZS, USD & Humo</p>
        </button>

        <button
          onClick={() => handleSendMessage("Akmal Karimovga 1 500 000 so'm o'tkaz")}
          className="bg-white border border-slate-200/90 hover:border-indigo-500 rounded-xl p-3 text-left transition-all hover:shadow-xs group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
            <ArrowUpRight className="w-4 h-4" />
          </div>
          <p className="text-xs font-bold text-slate-800">Pul O'tkazish</p>
          <p className="text-[10px] text-slate-400 mt-0.5">1.5M so'm Akmalga</p>
        </button>

        <button
          onClick={() => handleSendMessage("Apex Logistics kompaniyasini compliancedan tekshir")}
          className="bg-white border border-slate-200/90 hover:border-indigo-500 rounded-xl p-3 text-left transition-all hover:shadow-xs group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <p className="text-xs font-bold text-slate-800">Compliance & AML</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Sanksiya & Xavf tahlili</p>
        </button>

        <button
          onClick={() => handleSendMessage("100$ ni so'mga ayirboshlash kursi qancha?")}
          className="bg-white border border-slate-200/90 hover:border-indigo-500 rounded-xl p-3 text-left transition-all hover:shadow-xs group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
            <ArrowRightLeft className="w-4 h-4" />
          </div>
          <p className="text-xs font-bold text-slate-800">Valyuta Kursi</p>
          <p className="text-[10px] text-slate-400 mt-0.5">1 USD = {EXCHANGE_RATES.USD_UZS_BUY.toLocaleString()} UZS</p>
        </button>

        <button
          onClick={() => handleSendMessage("Oxirgi to'lovlar va tranzaksiyalarim tarixini ko'rsat")}
          className="bg-white border border-slate-200/90 hover:border-indigo-500 rounded-xl p-3 text-left transition-all hover:shadow-xs group cursor-pointer col-span-2 sm:col-span-1"
        >
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
            <History className="w-4 h-4" />
          </div>
          <p className="text-xs font-bold text-slate-800">To'lovlar Tarixi</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Kvitansiyalar & Cheklar</p>
        </button>
      </div>

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
                      accounts={accounts} 
                      onSelectTransfer={(acc) => {
                        handleSendMessage(`${acc.name} hisobidan pul o'tkazish`);
                      }}
                      onRefresh={() => {
                        handleSendMessage("Balansimni ko'rsat");
                      }}
                    />
                  )}

                  {msg.widget === 'transfer' && msg.widgetData && (
                    <TransferWidget
                      initialPayload={msg.widgetData}
                      accounts={accounts}
                      onCompleteTransfer={handleCompleteTransfer}
                      onCancel={() => {
                        handleSendMessage("O'tkazma bekor qilindi");
                      }}
                    />
                  )}

                  {msg.widget === 'compliance' && msg.widgetData && (
                    <ComplianceWidget
                      data={msg.widgetData}
                      onProceedTransfer={(comp) => {
                        handleSendMessage(`${comp.beneficiary}ga 1 500 000 so'm o'tkaz`);
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

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleSpeak(msg.id, msg.text)}
                        title="Ovozli eshitish"
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
                        title="Matnni nusxalash"
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

                {/* Suggested Actions chips */}
                {msg.suggestedActions && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {msg.suggestedActions.map((action, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendMessage(action)}
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
                <span>KDB AI bank kliring va tahlil tizimi javob tayyorlamoqda...</span>
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
              placeholder="Masalan: 'Balansimni ko'rsat', 'Akmalga 1.5M so'm o'tkaz', 'Valyuta kursi'..."
              className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-medium text-xs sm:text-sm transition-all duration-150 flex items-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <span>Yuborish</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
