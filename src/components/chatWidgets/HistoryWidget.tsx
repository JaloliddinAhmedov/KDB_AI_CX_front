import React from 'react';
import { History, ArrowDownLeft, ArrowUpRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { BankTransaction } from '../../types';
import { formatCurrency } from '../../utils/conversationalBanking';

interface HistoryWidgetProps {
  transactions: BankTransaction[];
}

export const HistoryWidget: React.FC<HistoryWidgetProps> = ({ transactions }) => {
  const recent = transactions.slice(0, 5);

  return (
    <div className="mt-3 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-4 max-w-xl text-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900">KDB So'nggi Tranzaksiyalar</h4>
            <p className="text-[10px] text-slate-400">Oxirgi amalga oshirilgan to'lov va tushumlar</p>
          </div>
        </div>

        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
          {transactions.length} ta tranzaksiya
        </span>
      </div>

      {/* List */}
      <div className="space-y-2">
        {recent.map((txn) => (
          <div
            key={txn.id}
            className="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between gap-3 hover:bg-slate-100/60 transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                txn.type === 'Credit' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-700'
              }`}>
                {txn.type === 'Credit' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">{txn.merchant}</p>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <span>{txn.date}</span>
                  <span>•</span>
                  <span>{txn.category}</span>
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <p className={`text-xs font-bold ${
                txn.type === 'Credit' ? 'text-emerald-600' : 'text-slate-900'
              }`}>
                {txn.type === 'Credit' ? '+' : '-'}{formatCurrency(txn.amount, 'UZS')}
              </p>
              <div className="flex items-center justify-end gap-1 text-[9px] font-bold text-slate-500 mt-0.5">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Risk: {txn.riskScore}/100</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
