import React, { useState } from 'react';
import { 
  CreditCard, 
  ArrowUpRight, 
  ShieldCheck, 
  Wallet, 
  RefreshCw, 
  Eye, 
  EyeOff,
  History,
  TrendingDown,
  TrendingUp,
  Minus,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { BankAccount } from '../../types';
import { formatCurrency } from '../../utils/conversationalBanking';

interface BalanceWidgetData {
  snapshotAccounts?: BankAccount[];
  snapshotTime?: string;
  snapshotTimestamp?: number;
}

interface BalanceWidgetProps {
  data?: BalanceWidgetData | BankAccount[];
  accounts?: BankAccount[]; // Fallback or current live accounts
  currentAccounts?: BankAccount[]; // For real-time comparison
  onSelectTransfer?: (account: BankAccount) => void;
  onRefresh?: () => void;
}

export const BalanceWidget: React.FC<BalanceWidgetProps> = ({
  data,
  accounts: fallbackAccounts = [],
  currentAccounts = [],
  onSelectTransfer,
  onRefresh
}) => {
  const [showNumbers, setShowNumbers] = useState(true);
  const [showComparison, setShowComparison] = useState(false);

  // Extract snapshot accounts if available, otherwise use provided list
  let snapshotAccounts: BankAccount[] = [];
  let snapshotTime: string | undefined;

  if (Array.isArray(data)) {
    snapshotAccounts = data;
  } else if (data && typeof data === 'object' && 'snapshotAccounts' in data && data.snapshotAccounts) {
    snapshotAccounts = data.snapshotAccounts;
    snapshotTime = data.snapshotTime;
  } else if (fallbackAccounts.length > 0) {
    snapshotAccounts = fallbackAccounts;
  }

  // Active accounts to display
  const displayedAccounts = snapshotAccounts.length > 0 ? snapshotAccounts : fallbackAccounts;
  const liveList = currentAccounts.length > 0 ? currentAccounts : displayedAccounts;

  const totalUzs = displayedAccounts.reduce((acc, curr) => {
    if (curr.currency === 'UZS') return acc + curr.balance;
    if (curr.currency === 'USD') return acc + curr.balance * 12850;
    return acc;
  }, 0);

  const liveTotalUzs = liveList.reduce((acc, curr) => {
    if (curr.currency === 'UZS') return acc + curr.balance;
    if (curr.currency === 'USD') return acc + curr.balance * 12850;
    return acc;
  }, 0);

  const totalDeltaUzs = liveTotalUzs - totalUzs;

  return (
    <div className="mt-3 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-4 max-w-xl text-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900">KDB Account Balances</h4>
              {snapshotTime ? (
                <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-600" />
                  <span>Snapshot @ {snapshotTime}</span>
                </span>
              ) : (
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Live</span>
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400">
              {snapshotTime 
                ? `Historical balance state preserved from your past inquiry (${snapshotTime})` 
                : 'Real-time synchronized banking balances'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Compare with current balance button */}
          {snapshotTime && (
            <button
              onClick={() => setShowComparison(!showComparison)}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-colors flex items-center gap-1 cursor-pointer ${
                showComparison
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
              }`}
              title="Compare historical snapshot with current balances"
            >
              <History className="w-3.5 h-3.5" />
              <span>{showComparison ? 'Hide Comparison' : 'Compare with Now'}</span>
            </button>
          )}

          <button
            onClick={() => setShowNumbers(!showNumbers)}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            title={showNumbers ? "Hide numbers" : "Show numbers"}
          >
            {showNumbers ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors"
              title="Refresh balances"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Total Balance Card */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-xl p-4 text-white shadow-xs">
        <div className="flex items-center justify-between text-[10px] uppercase font-semibold tracking-wider text-indigo-300">
          <span>{snapshotTime ? `Snapshot Total (${snapshotTime})` : 'Total Net Worth (UZS Eq.)'}</span>
          {showComparison && (
            <span className="text-amber-300 font-bold">vs Live Today</span>
          )}
        </div>

        <div className="flex items-baseline justify-between mt-1">
          <div className="text-lg sm:text-2xl font-black tracking-tight">
            {showNumbers ? formatCurrency(totalUzs, 'UZS') : '•••••••• UZS'}
          </div>

          {showComparison && showNumbers && (
            <div className="text-right">
              <span className="text-xs text-slate-400 block font-normal">Current Live:</span>
              <span className="text-sm font-bold text-white font-mono">
                {formatCurrency(liveTotalUzs, 'UZS')}
              </span>
              <div className="flex items-center justify-end gap-1 text-[10px] font-bold mt-0.5">
                {totalDeltaUzs < 0 ? (
                  <span className="text-rose-400 flex items-center gap-0.5">
                    <TrendingDown className="w-3 h-3" />
                    {formatCurrency(totalDeltaUzs, 'UZS')}
                  </span>
                ) : totalDeltaUzs > 0 ? (
                  <span className="text-emerald-400 flex items-center gap-0.5">
                    <TrendingUp className="w-3 h-3" />
                    +{formatCurrency(totalDeltaUzs, 'UZS')}
                  </span>
                ) : (
                  <span className="text-slate-400 flex items-center gap-0.5">
                    <Minus className="w-3 h-3" />
                    No Change
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 mt-2 text-[10px] text-emerald-400 font-medium">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            KDB Central Bank Protected
          </span>
          <span className="text-slate-400">• {displayedAccounts.length} accounts recorded</span>
        </div>
      </div>

      {/* Account Items List */}
      <div className="space-y-2.5">
        {displayedAccounts.map((acc) => {
          const currentLiveAcc = liveList.find(a => a.id === acc.id);
          const currentBalance = currentLiveAcc ? currentLiveAcc.balance : acc.balance;
          const delta = currentBalance - acc.balance;

          return (
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
                <div className="flex items-baseline justify-end gap-2">
                  {showComparison && showNumbers && (
                    <div className="text-right mr-1">
                      <span className="text-[9px] text-slate-400 block">Now:</span>
                      <span className="text-xs font-bold text-slate-700 font-mono">
                        {formatCurrency(currentBalance, acc.currency)}
                      </span>
                    </div>
                  )}

                  <div>
                    <span className="text-[9px] text-slate-400 block">
                      {snapshotTime ? 'Snapshot:' : 'Balance:'}
                    </span>
                    <p className="text-xs sm:text-sm font-bold text-slate-900 font-mono">
                      {showNumbers ? formatCurrency(acc.balance, acc.currency) : '••••••'}
                    </p>
                  </div>
                </div>

                {/* Delta Badge if comparison active */}
                {showComparison && showNumbers && (
                  <div className="flex items-center justify-end gap-1 text-[9px] font-bold mt-0.5">
                    {delta < 0 ? (
                      <span className="text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200 flex items-center gap-0.5">
                        <TrendingDown className="w-2.5 h-2.5" />
                        {formatCurrency(delta, acc.currency)}
                      </span>
                    ) : delta > 0 ? (
                      <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 flex items-center gap-0.5">
                        <TrendingUp className="w-2.5 h-2.5" />
                        +{formatCurrency(delta, acc.currency)}
                      </span>
                    ) : (
                      <span className="text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                        Unchanged
                      </span>
                    )}
                  </div>
                )}

                {onSelectTransfer && (
                  <button
                    type="button"
                    onClick={() => onSelectTransfer(acc)}
                    className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 ml-auto mt-0.5 group-hover:underline cursor-pointer"
                  >
                    <span>Send</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
