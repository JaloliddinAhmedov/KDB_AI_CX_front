import React, { useState } from 'react';
import { 
  Headphones, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Send, 
  Loader2, 
  MessageSquare,
  UserCheck
} from 'lucide-react';
import { SupportTicket } from '../types';

interface SupportViewProps {
  tickets: SupportTicket[];
  setTickets: React.Dispatch<React.SetStateAction<SupportTicket[]>>;
}

export const SupportView: React.FC<SupportViewProps> = ({ tickets, setTickets }) => {
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket>(tickets[0]);
  const [draftText, setDraftText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

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
        `Dear ${ticket.customerName},\n\nThank you for reaching out to KDB Bank Uzbekistan Support regarding your inquiry: "${ticket.subject}".\n\nOur AI compliance engine has reviewed your ${ticket.accountTier} account parameters. A dedicated banking specialist is verifying the pending transaction logs and will issue an update within 30 minutes.\n\nWarm regards,\nKDB Bank Uzbekistan Customer Success Team`
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendReply = () => {
    if (!draftText) return;
    setTickets(prev =>
      prev.map(t =>
        t.id === selectedTicket.id
          ? { ...t, status: 'Resolved', aiSuggestedReply: draftText }
          : t
      )
    );
    setSelectedTicket(prev => ({ ...prev, status: 'Resolved' }));
    alert('Support resolution sent to customer!');
  };

  return (
    <div className="p-8 space-y-6 bg-[#f8fafc] min-h-[calc(100vh-4rem)]">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customer Support AI Co-Pilot</h1>
        <p className="text-sm text-slate-500 mt-1">Review incoming support tickets and generate AI compliance response drafts.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Ticket List (Span 5) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3">
          <h3 className="font-semibold text-slate-900 text-sm mb-3">Escalation Queue</h3>

          <div className="space-y-2.5">
            {tickets.map(ticket => (
              <button
                key={ticket.id}
                onClick={() => {
                  setSelectedTicket(ticket);
                  setDraftText(ticket.aiSuggestedReply || '');
                }}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedTicket.id === ticket.id
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                    : 'border-slate-200/80 hover:border-slate-300 bg-slate-50/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">{ticket.customerName}</span>
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
                  <span>{ticket.date}</span>
                  <span className={`font-semibold ${
                    ticket.status === 'Resolved' ? 'text-emerald-600' : 'text-amber-600'
                  }`}>
                    {ticket.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Ticket Detail & Co-pilot Generator (Span 7) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                  {selectedTicket.id}
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-1">{selectedTicket.subject}</h2>
                <p className="text-xs text-slate-500">
                  From: {selectedTicket.customerName} ({selectedTicket.accountTier} Tier) • {selectedTicket.date}
                </p>
              </div>

              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                selectedTicket.status === 'Resolved'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {selectedTicket.status}
              </span>
            </div>

            {/* Customer issue statement */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-xs text-slate-800 space-y-1">
              <p className="font-semibold text-slate-500">Customer Statement:</p>
              <p className="text-slate-800 text-sm">{selectedTicket.issue}</p>
            </div>

            {/* AI Co-Pilot Response Draft */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  KDB AI Support Co-Pilot Draft Response:
                </label>

                <button
                  onClick={() => handleGenerateDraft(selectedTicket)}
                  disabled={isGenerating}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Drafting...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Auto-Generate Draft
                    </>
                  )}
                </button>
              </div>

              <textarea
                rows={7}
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                placeholder="Click 'Auto-Generate Draft' or write response..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono text-xs leading-relaxed"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={handleSendReply}
              disabled={!draftText}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-xl text-sm transition-all shadow-xs flex items-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>Approve & Send Support Response</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
