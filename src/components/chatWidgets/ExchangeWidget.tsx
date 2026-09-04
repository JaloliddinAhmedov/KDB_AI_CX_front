import React, { useState } from 'react';
import { ArrowLeftRight, CheckCircle2, DollarSign, TrendingUp, Sparkles, ArrowRight } from 'lucide-react';
import { EXCHANGE_RATES, formatCurrency } from '../../utils/conversationalBanking';
import { BankAccount } from '../../types';

interface ExchangeWidgetProps {
  defaultAmount?: number;
  accounts: BankAccount[];
  onExecuteExchange?: (usdAmount: number, uzsAmount: number, direction: 'BUY' | 'SELL') => void;
}

export const ExchangeWidget: React.FC<ExchangeWidgetProps> = ({
  defaultAmount = 100,
  accounts,
  onExecuteExchange
}) => {
  const [direction, setDirection] = useState<'USD_TO_UZS' | 'UZS_TO_USD'>('USD_TO_UZS');
  const [amount, setAmount] = useState<number>(defaultAmount);
  const [isSuccess, setIsSuccess] = useState(false);

  const rate = direction === 'USD_TO_UZS' ? EXCHANGE_RATES.USD_UZS_BUY : EXCHANGE_RATES.USD_UZS_SELL;

  const resultAmount = direction === 'USD_TO_UZS'
    ? amount * rate
    : amount / rate;

  const handleExchange = () => {
    setIsSuccess(true);
    if (onExecuteExchange) {
      if (direction === 'USD_TO_UZS') {
        onExecuteExchange(amount, amount * rate, 'BUY');
      } else {
        onExecuteExchange(amount / rate, amount, 'SELL');
      }
    }
    setTimeout(() => {
      setIsSuccess(false);
    }, 4000);
  };

  return (
    <div className="mt-3 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-4 max-w-xl text-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <ArrowLeftRight className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900">KDB Currency Exchange</h4>
            <p className="text-[10px] text-slate-400">Official Central Bank & KDB live rate</p>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-200 flex items-center gap-1">
          <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
          1 USD = {EXCHANGE_RATES.USD_UZS_BUY.toLocaleString()} UZS
        </span>
      </div>

      {isSuccess ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center space-y-1.5 animate-in zoom-in-95">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-emerald-950">Currency Exchange Completed!</h4>
          <p className="text-xs text-emerald-800">
            Your account balances have been updated in real-time.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Converter Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Input Box */}
            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400">
                {direction === 'USD_TO_UZS' ? 'You Pay (USD)' : 'You Pay (UZS)'}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={amount || ''}
                  onChange={(e) => setAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <span className="text-xs font-bold text-slate-600">
                  {direction === 'USD_TO_UZS' ? 'USD' : 'UZS'}
                </span>
              </div>
            </div>

            {/* Output Box */}
            <div className="p-3 rounded-xl border border-slate-200 bg-indigo-50/40 space-y-1">
              <label className="text-[10px] font-bold uppercase text-indigo-600">
                {direction === 'USD_TO_UZS' ? 'You Receive (UZS)' : 'You Receive (USD)'}
              </label>
              <div className="text-sm sm:text-base font-black text-indigo-950 py-1.5">
                {direction === 'USD_TO_UZS' 
                  ? formatCurrency(resultAmount, 'UZS') 
                  : formatCurrency(resultAmount, 'USD')}
              </div>
            </div>
          </div>

          {/* Switch Button */}
          <div className="flex justify-between items-center text-xs">
            <button
              type="button"
              onClick={() => setDirection(direction === 'USD_TO_UZS' ? 'UZS_TO_USD' : 'USD_TO_UZS')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Switch Direction</span>
            </button>

            <span className="text-[10px] text-slate-400">
              Fee: 0% Free
            </span>
          </div>

          {/* Action button */}
          <button
            type="button"
            onClick={handleExchange}
            disabled={amount <= 0}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <span>Execute Currency Exchange</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

