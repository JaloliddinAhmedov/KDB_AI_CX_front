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
  HelpCircle
} from 'lucide-react';
import { ChatMessage, KnowledgeItem } from '../types';
import { generateClientSideAnswer } from '../utils/aiFallback';

interface AIAssistantProps {
  knowledgeItems?: KnowledgeItem[];
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ knowledgeItems = [] }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-1',
      sender: 'assistant',
      text: 'Hello! I am KDB AI-CX Assistant, KDB Bank Uzbekistan\'s AI-driven customer experience assistant. I am connected to your trained knowledge base. How can I assist you today?',
      timestamp: '09:00 AM',
      sources: ['KDB Bank Uzbekistan Knowledge Base'],
      suggestedActions: [
        'Calculate Mortgage & Credit Terms',
        'Compare Deposit & Savings Rates',
        'Report Lost or Stolen Card',
        'Uzbek: KDB Bank hizmatlari haqida'
      ]
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      const historyPayload = messages
        .filter(m => m.id !== '1')
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
        // Backend not reachable on static hosts (e.g. Netlify without custom server)
        console.warn('Backend server not reachable, using client-side AI engine:', networkErr);
      }

      // If backend was not reached or returned empty, execute client-side knowledge synthesis
      if (!answerText) {
        answerText = generateClientSideAnswer(query, dynamicContext);
      }

      const topSources = knowledgeItems.length > 0 
        ? knowledgeItems.slice(0, 3).map(k => k.sourceName)
        : ['KDB Bank AI Knowledge Base', 'Official Tariffs & Guidelines'];

      const assistantMessage: ChatMessage = {
        id: `msg-ai-${Date.now()}`,
        sender: 'assistant',
        text: answerText || 'KDB Bank O\'zbekiston: So\'rovingiz qabul qilindi.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: topSources,
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

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-4 sm:p-6 text-white shadow-lg flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
            <span className="text-[10px] sm:text-xs font-semibold tracking-wider uppercase text-indigo-300">KDB Bank AI-CX Co-Pilot</span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold">KDB Bank Uzbekistan AI-CX Assistant</h1>
          <p className="text-xs text-slate-300 max-w-xl">
            Trained on real KDB Bank Uzbekistan Credit FAQs, Deposit Rates, and Banking Compliance documents. Supports English & Uzbek inquiries.
          </p>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>256-bit Encrypted</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl text-xs flex items-center gap-2">
            <Globe2 className="w-4 h-4 text-indigo-400" />
            <span>Multi-lingual</span>
          </div>
        </div>
      </div>

      {/* Preset Category Chips */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => handleSendMessage("What are current mortgage interest rates and down payment terms?")}
          className="bg-white border border-slate-200/90 hover:border-indigo-500 rounded-xl p-3.5 text-left transition-all hover:shadow-xs group"
        >
          <Building2 className="w-4 h-4 text-indigo-600 mb-1.5 group-hover:scale-110 transition-transform" />
          <p className="text-xs font-semibold text-slate-800">Mortgage Rates</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Fixed 30-year & Refinancing</p>
        </button>

        <button
          onClick={() => handleSendMessage("How do high-yield savings interest rates compound?")}
          className="bg-white border border-slate-200/90 hover:border-indigo-500 rounded-xl p-3.5 text-left transition-all hover:shadow-xs group"
        >
          <CreditCard className="w-4 h-4 text-indigo-600 mb-1.5 group-hover:scale-110 transition-transform" />
          <p className="text-xs font-semibold text-slate-800">Savings APY</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Yield breakdown & CD terms</p>
        </button>

        <button
          onClick={() => handleSendMessage("Sitora xonim, KDB Bank Uzbekistan kredit va ipoteka shartlari haqida ma'lumot bera olasizmi?")}
          className="bg-white border border-slate-200/90 hover:border-indigo-500 rounded-xl p-3.5 text-left transition-all hover:shadow-xs group"
        >
          <Globe2 className="w-4 h-4 text-indigo-600 mb-1.5 group-hover:scale-110 transition-transform" />
          <p className="text-xs font-semibold text-slate-800">Uzbek Language</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Kredit va Omonatlar</p>
        </button>

        <button
          onClick={() => handleSendMessage("What should I do if I suspect fraudulent charge on my debit card?")}
          className="bg-white border border-slate-200/90 hover:border-indigo-500 rounded-xl p-3.5 text-left transition-all hover:shadow-xs group"
        >
          <HelpCircle className="w-4 h-4 text-indigo-600 mb-1.5 group-hover:scale-110 transition-transform" />
          <p className="text-xs font-semibold text-slate-800">Card Fraud Alert</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Lock card & report claim</p>
        </button>
      </div>

      {/* Main Chat Box */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col h-[520px]">
        {/* Messages Container */}
        <div className="flex-1 p-6 overflow-y-auto space-y-5">
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
              <div className="space-y-2">
                <div
                  className={`p-4 rounded-2xl text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-slate-50 border border-slate-200/80 text-slate-800 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
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
                        title="Read out loud"
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

                {/* Suggested Actions chips */}
                {msg.suggestedActions && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {msg.suggestedActions.map((action, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendMessage(action)}
                        className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full font-medium transition-colors"
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
                <span>Gemini is synthesizing knowledge base answer...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
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
              placeholder="Ask about KDB Bank Uzbekistan accounts, credits, deposits, or Uzbek translation..."
              className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-medium text-sm transition-all duration-150 flex items-center gap-2 shadow-xs disabled:opacity-50"
            >
              <span>Send</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
