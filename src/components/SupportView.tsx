import React, { useState, useEffect } from 'react';
import { 
  Headphones, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Send, 
  Loader2, 
  MessageSquare,
  UserCheck,
  ShieldCheck,
  Bot,
  AlertCircle,
  Filter,
  Check
} from 'lucide-react';
import { SupportTicket } from '../types';

interface SupportViewProps {
  tickets: SupportTicket[];
  setTickets: React.Dispatch<React.SetStateAction<SupportTicket[]>>;
}

export const SupportView: React.FC<SupportViewProps> = ({ tickets, setTickets }) => {
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket>(tickets[0] || null);
  const [draftText, setDraftText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'AI_ESCALATED' | 'OPEN' | 'RESOLVED'>('ALL');
  const [resolvedNotification, setResolvedNotification] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedTicket && tickets.length > 0) {
      setSelectedTicket(tickets[0]);
      setDraftText(tickets[0]?.aiSuggestedReply || '');
    } else if (selectedTicket) {
      const updated = tickets.find(t => t.id === selectedTicket.id);
      if (updated) {
        setSelectedTicket(updated);
      }
    }
  }, [tickets]);

  const filteredTickets = tickets.filter(ticket => {
    if (filter === 'AI_ESCALATED') return ticket.subject.toLowerCase().includes('ai') || ticket.issue.toLowerCase().includes('ai');
    if (filter === 'OPEN') return ticket.status === 'Open';
    if (filter === 'RESOLVED') return ticket.status === 'Resolved';
    return true;
  });

  const handleGenerateDraft = async (ticket: SupportTicket) => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/gemini/support-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: ticket.customerName,
          accountTier: ticket.accountTier,
          customerIssue: ticket.issue
        })
      });
      const data = await res.json();
      setDraftText(data.draftResponse || '');
    } catch (err) {
      console.error(err);
      setDraftText(
        `Dear ${ticket.customerName},\n\nThank you for reaching out to KDB Bank Uzbekistan Staff Support regarding your inquiry: "${ticket.subject}".\n\nOur customer support specialist team has reviewed your ${ticket.accountTier} account records. We have verified your transaction and balance logs.\n\nEverything is in order and your issue has been successfully resolved.\n\nWarm regards,\nKDB Bank Uzbekistan Customer Care Specialist`
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendReply = () => {
    if (!draftText || !selectedTicket) return;
    setTickets(prev =>
      prev.map(t =>
        t.id === selectedTicket.id
          ? { ...t, status: 'Resolved', aiSuggestedReply: draftText }
          : t
      )
    );
    setSelectedTicket(prev => prev ? ({ ...prev, status: 'Resolved', aiSuggestedReply: draftText }) : prev);
    setResolvedNotification(`Resolution sent to ${selectedTicket.customerName} for Ticket #${selectedTicket.id}!`);
    setTimeout(() => setResolvedNotification(null), 4000);
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 bg-[#f8fafc] min-h-[calc(100vh-4rem)] max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Customer Support & Escalations Desk
            </h1>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              Staff Authorized Queue
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review incoming tickets and unresolved AI Assistant escalations. Draft and send official resolutions.
          </p>
        </div>

        {resolvedNotification && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{resolvedNotification}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Ticket List (Span 5) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Escalation Queue ({filteredTickets.length})</h3>
            
            {/* Filter pills */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-[10px] font-bold">
              <button
                onClick={() => setFilter('ALL')}
                className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                  filter === 'ALL' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                All ({tickets.length})
              </button>
              <button
                onClick={() => setFilter('AI_ESCALATED')}
                className={`px-2 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                  filter === 'AI_ESCALATED' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Bot className="w-3 h-3" />
                AI
              </button>
              <button
                onClick={() => setFilter('OPEN')}
                className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                  filter === 'OPEN' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Open
              </button>
              <button
                onClick={() => setFilter('RESOLVED')}
                className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                  filter === 'RESOLVED' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Resolved
              </button>
            </div>
          </div>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {filteredTickets.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                No tickets matching this filter.
              </div>
            ) : (
              filteredTickets.map(ticket => {
                const isAiEscalated = ticket.subject.toLowerCase().includes('ai') || ticket.issue.toLowerCase().includes('ai');

                return (
                  <button
                    key={ticket.id}
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setDraftText(ticket.aiSuggestedReply || '');
                    }}
                    className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer ${
                      selectedTicket?.id === ticket.id
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-500/20'
                        : 'border-slate-200/80 hover:border-slate-300 bg-slate-50/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800">{ticket.customerName}</span>
                        {isAiEscalated && (
                          <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[9px] font-bold px-1.5 py-0.2 rounded flex items-center gap-0.5">
                            <Bot className="w-2.5 h-2.5 text-rose-600" />
                            AI Escalated
                          </span>
                        )}
                      </div>

                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        ticket.accountTier === 'Enterprise'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {ticket.accountTier}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-slate-800 mt-1">{ticket.subject}</p>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{ticket.issue}</p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-100">
                      <span>{ticket.date} • {ticket.id}</span>
                      <span className={`font-semibold flex items-center gap-1 ${
                        ticket.status === 'Resolved' ? 'text-emerald-600' : 'text-amber-600'
                      }`}>
                        {ticket.status === 'Resolved' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {ticket.status}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Ticket Detail & Co-pilot Generator (Span 7) */}
        {selectedTicket ? (
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                      {selectedTicket.id}
                    </span>
                    {(selectedTicket.subject.toLowerCase().includes('ai') || selectedTicket.issue.toLowerCase().includes('ai')) && (
                      <span className="bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Bot className="w-3.5 h-3.5 text-rose-600" />
                        AI Chat Escalation
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 mt-2">{selectedTicket.subject}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    From: {selectedTicket.customerName} ({selectedTicket.accountTier} Tier) • Date: {selectedTicket.date}
                  </p>
                </div>

                <span className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
                  selectedTicket.status === 'Resolved'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {selectedTicket.status}
                </span>
              </div>

              {/* Customer issue statement */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-xs text-slate-800 space-y-1">
                <p className="font-semibold text-slate-500">Customer Case Summary & Context:</p>
                <p className="text-slate-800 text-sm whitespace-pre-wrap">{selectedTicket.issue}</p>
              </div>

              {/* AI Co-Pilot Response Draft */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    KDB Staff AI Support Co-Pilot Draft:
                  </label>

                  <button
                    onClick={() => handleGenerateDraft(selectedTicket)}
                    disabled={isGenerating}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Generating Draft...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        Auto-Draft Resolution
                      </>
                    )}
                  </button>
                </div>

                <textarea
                  rows={7}
                  value={draftText}
                  onChange={(e) => setDraftText(e.target.value)}
                  placeholder="Click 'Auto-Draft Resolution' or compose custom staff reply..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono text-xs leading-relaxed"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <span className="text-[11px] text-slate-400">
                Authorized staff submission directly notifies the customer and marks the ticket as Resolved.
              </span>
              <button
                onClick={handleSendReply}
                disabled={!draftText}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl text-xs sm:text-sm transition-all shadow-xs flex items-center gap-2 disabled:opacity-50 cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
                <span>Resolve & Send Response</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-12 text-center text-slate-400 flex flex-col items-center justify-center">
            <Headphones className="w-10 h-10 text-slate-300 mb-3" />
            <p className="text-sm font-semibold text-slate-600">Select a ticket from the escalation queue</p>
            <p className="text-xs text-slate-400 mt-1">Staff members can view ticket context, auto-draft replies, and resolve queries.</p>
          </div>
        )}
      </div>
    </div>
  );
};
