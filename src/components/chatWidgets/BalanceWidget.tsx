import React from 'react';
import { CreditCard, ArrowUpRight, ShieldCheck, Wallet, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { BankAccount } from '../../types';
import { formatCurrency } from '../../utils/conversationalBanking';

interface BalanceWidgetProps {
  accounts: BankAccount[];
  onSelectTransfer?: (account: BankAccount) => void;
  onRefresh?: () => void;
}

export const BalanceWidget: React.FC<BalanceWidgetProps> = ({
  accounts,
  onSelectTransfer,
  onRefresh
}) => {
  const [showNumbers, setShowNumbers] = React.useState(true);

  const totalUzs = accounts.reduce((acc, curr) => {
    if (curr.currency === 'UZS') return acc + curr.balance;
    if (curr.currency === 'USD') return acc + curr.balance * 12850;
    return acc;
  }, 0);

  return (
    <div className="mt-3 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-4 max-w-xl text-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900">KDB Bank Hisoblar & Balans</h4>
            <p className="text-[10px] text-slate-400">Jonli yangilangan bank hisoblari</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNumbers(!showNumbers)}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            title={showNumbers ? "Raqamlarni yashirish" : "Raqamlarni ko'rsatish"}
          >
            {showNumbers ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors"
              title="Yangilash"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Total Balance Card */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-xl p-4 text-white shadow-xs">
        <div className="text-[10px] uppercase font-semibold tracking-wider text-indigo-300">
          Umumiy aktivlar balansi (UZS ekvivalentida)
        </div>
        <div className="text-lg sm:text-2xl font-black mt-1 tracking-tight">
          {showNumbers ? formatCurrency(totalUzs, 'UZS') : '•••••••• UZS'}
        </div>
        <div className="flex items-center gap-3 mt-2 text-[10px] text-emerald-400 font-medium">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            KDB Bank Kafolatlangan
          </span>
          <span className="text-slate-400">• 4 ta faol hisob</span>
        </div>
      </div>

      {/* Account Items List */}
      <div className="space-y-2.5">
        {accounts.map((acc) => (
          <div
            key={acc.id}
            className="p-3 rounded-xl border border-slate-200/80 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/20 transition-all flex items-center justify-between gap-3 group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${acc.color || 'from-indigo-600 to-indigo-800'} text-white flex items-center justify-center shrink-0 shadow-xs`}>
                <CreditCard className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-slate-900 truncate">{acc.name}</p>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 uppercase">
                    {acc.currency}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                  {showNumbers ? (acc.cardMask || acc.accountNumber) : '•••• •••• •••• ••••'}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <p className="text-xs sm:text-sm font-bold text-slate-900">
                {showNumbers ? formatCurrency(acc.balance, acc.currency) : '••••••'}
              </p>
              {onSelectTransfer && (
                <button
                  type="button"
                  onClick={() => onSelectTransfer(acc)}
                  className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 ml-auto mt-0.5 group-hover:underline cursor-pointer"
                >
                  <span>O'tkazish</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
