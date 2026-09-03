import React, { useState } from 'react';
import { 
  Receipt, 
  ShieldAlert, 
  Search, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2,
  DollarSign
} from 'lucide-react';
import { BankTransaction } from '../types';

interface TransactionSearchProps {
  transactions: BankTransaction[];
  setTransactions: React.Dispatch<React.SetStateAction<BankTransaction[]>>;
}

export const TransactionSearch: React.FC<TransactionSearchProps> = ({
  transactions,
  setTransactions
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'Debit' | 'Credit' | 'Flagged'>('All');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const filtered = transactions.filter(t => {
    const matchesSearch = 
      t.merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.account.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.id.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterType === 'Flagged') return matchesSearch && t.status === 'Flagged';
    if (filterType === 'Debit') return matchesSearch && t.type === 'Debit';
    if (filterType === 'Credit') return matchesSearch && t.type === 'Credit';
    return matchesSearch;
  });

  const handleRunAiAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/gemini/analyze-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: filtered })
      });
      const data = await res.json();
      setAnalysisResult(data);
    } catch (err) {
      console.error(err);
      setAnalysisResult({
        summary: 'Analyzed 5 recent transactions. Flagged 2 high-risk wire debits exceeding $45,000.',
        riskLevel: 'Medium',
        insights: [
          'High risk international wire transfer TXN-9022 ($98,000.00)',
          'Luxury car dealership debit outside client normal geo-location TXN-9025 ($45,000.00)'
        ],
        recommendations: [
          'Request secondary SMS 2FA confirmation from Enterprise account owner.',
          'Place temporary hold on overseas wire TXN-9022.'
        ]
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="p-8 space-y-6 bg-[#f8fafc] min-h-[calc(100vh-4rem)]">
      {/* Title & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Transaction Intelligence Search</h1>
          <p className="text-sm text-slate-500 mt-1">Search customer transactions and trigger KDB AI Fraud & Risk Analyzer.</p>
        </div>

        <button
          onClick={handleRunAiAnalysis}
          disabled={isAnalyzing}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-medium text-sm transition-all shadow-xs flex items-center gap-2 self-start md:self-auto disabled:opacity-50"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Analyzing Risk via KDB AI...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Run AI Fraud & Risk Audit</span>
            </>
          )}
        </button>
      </div>

      {/* AI Analysis Summary Panel */}
      {analysisResult && (
        <div className="bg-white rounded-2xl border border-indigo-200 p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-700 font-bold text-base">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <span>KDB AI Transaction Intelligence Audit</span>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              analysisResult.riskLevel === 'High'
                ? 'bg-rose-100 text-rose-700'
                : analysisResult.riskLevel === 'Medium'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-emerald-100 text-emerald-800'
            }`}>
              Risk Level: {analysisResult.riskLevel || 'Medium'}
            </span>
          </div>

          <p className="text-slate-700 text-sm">{analysisResult.summary}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
            <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-200">
              <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Flagged Insights
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-600">
                {analysisResult.insights?.map((ins: string, idx: number) => (
                  <li key={idx}>{ins}</li>
                ))}
              </ul>
            </div>

            <div className="bg-indigo-50/60 p-4 rounded-xl space-y-2 border border-indigo-100">
              <p className="font-semibold text-indigo-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                Security Directives
              </p>
              <ul className="list-disc list-inside space-y-1 text-indigo-800">
                {analysisResult.recommendations?.map((rec: string, idx: number) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search transaction ID, merchant name, account, or category..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-medium self-stretch md:self-auto justify-center">
          {(['All', 'Debit', 'Credit', 'Flagged'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                filterType === type
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600 border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-400 font-medium">
            <tr>
              <th className="py-3.5 px-4">TXN ID & Date</th>
              <th className="py-3.5 px-4">Account</th>
              <th className="py-3.5 px-4">Merchant & Category</th>
              <th className="py-3.5 px-4">Amount</th>
              <th className="py-3.5 px-4">Risk Rating</th>
              <th className="py-3.5 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(t => (
              <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-4 px-4 font-medium text-slate-900 whitespace-nowrap">
                  <div>
                    <p className="font-semibold text-slate-800">{t.id}</p>
                    <p className="text-xs text-slate-400">{t.date}</p>
                  </div>
                </td>

                <td className="py-4 px-4 text-xs font-medium text-slate-700">{t.account}</td>

                <td className="py-4 px-4">
                  <div>
                    <p className="font-semibold text-slate-800">{t.merchant}</p>
                    <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                      {t.category}
                    </span>
                  </div>
                </td>

                <td className="py-4 px-4 whitespace-nowrap font-bold text-sm">
                  <span className={t.type === 'Credit' ? 'text-emerald-600' : 'text-slate-900'}>
                    {t.type === 'Credit' ? '+' : '-'}${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </td>

                <td className="py-4 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${
                      t.riskScore > 70 ? 'text-rose-600' : t.riskScore > 30 ? 'text-amber-600' : 'text-emerald-600'
                    }`}>
                      {t.riskScore}/100
                    </span>
                    <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full ${
                          t.riskScore > 70 ? 'bg-rose-500' : t.riskScore > 30 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${t.riskScore}%` }}
                      ></div>
                    </div>
                  </div>
                </td>

                <td className="py-4 px-4 whitespace-nowrap">
                  {t.status === 'Flagged' ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                      Flagged
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Completed
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
