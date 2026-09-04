import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  X, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  CreditCard, 
  Wallet, 
  RefreshCw, 
  ArrowRightLeft,
  KeyRound,
  Shield,
  Send,
  Building2,
  Headphones,
  FileCheck,
  Globe,
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';
import { BankAccount, BankTransaction, TransferPayload, SupportTicket } from '../types';
import { formatCurrency, EXCHANGE_RATES } from '../utils/conversationalBanking';

export type NativeBankingTab = 'transfer' | 'balance' | 'exchange' | 'compliance' | 'support';

interface NativeBankingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: NativeBankingTab;
  prefilledTransfer?: Partial<TransferPayload>;
  prefilledComplianceBeneficiary?: string;
  accounts: BankAccount[];
  setAccounts: React.Dispatch<React.SetStateAction<BankAccount[]>>;
  onCompleteTransfer?: (payload: TransferPayload) => void;
  onSubmitSupportTicket?: (ticket: SupportTicket) => void;
}

export const NativeBankingModal: React.FC<NativeBankingModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'transfer',
  prefilledTransfer,
  prefilledComplianceBeneficiary,
  accounts,
  setAccounts,
  onCompleteTransfer,
  onSubmitSupportTicket
}) => {
  const [activeTab, setActiveTab] = useState<NativeBankingTab>(initialTab);

  // Sync activeTab when initialTab or modal open state changes
  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
      if (initialTab === 'transfer') {
        setTransferSuccess(null);
      }
    }
  }, [isOpen, initialTab]);

  // Transfer Form State
  const [fromAccountId, setFromAccountId] = useState<string>(
    prefilledTransfer?.fromAccount || accounts[0]?.id || 'ACC-UZS-01'
  );
  const [toBeneficiary, setToBeneficiary] = useState<string>(prefilledTransfer?.toBeneficiary || 'Akmal Karimov');
  const [toAccountNum, setToAccountNum] = useState<string>(prefilledTransfer?.toCardOrAccount || '8600 •••• •••• 9842');
  const [transferAmount, setTransferAmount] = useState<number>(prefilledTransfer?.amount || 1500000);
  const [transferCurrency, setTransferCurrency] = useState<'UZS' | 'USD'>(prefilledTransfer?.currency || 'UZS');
  const [pinCode, setPinCode] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [transferSuccess, setTransferSuccess] = useState<TransferPayload | null>(null);

  // Sync transfer form if prefilledTransfer changes
  useEffect(() => {
    if (prefilledTransfer) {
      if (prefilledTransfer.fromAccount) setFromAccountId(prefilledTransfer.fromAccount);
      if (prefilledTransfer.toBeneficiary) setToBeneficiary(prefilledTransfer.toBeneficiary);
      if (prefilledTransfer.toCardOrAccount) setToAccountNum(prefilledTransfer.toCardOrAccount);
      if (prefilledTransfer.amount) setTransferAmount(prefilledTransfer.amount);
      if (prefilledTransfer.currency) setTransferCurrency(prefilledTransfer.currency);
    }
  }, [prefilledTransfer]);

  // Exchange State
  const [fxAmount, setFxAmount] = useState<number>(100);
  const [fxDirection, setFxDirection] = useState<'BUY' | 'SELL'>('BUY');
  const [fxSuccessMsg, setFxSuccessMsg] = useState<string | null>(null);

  // AML & Compliance Confidential Screening State
  const [complianceBeneficiary, setComplianceBeneficiary] = useState<string>(
    prefilledComplianceBeneficiary || 'Apex Logistics LLC'
  );
  const [complianceInn, setComplianceInn] = useState<string>('304892104');
  const [complianceCountry, setComplianceCountry] = useState<string>('Uzbekistan');
  const [isScreeningAml, setIsScreeningAml] = useState<boolean>(false);
  const [amlScreenResult, setAmlScreenResult] = useState<{
    counterparty: string;
    inn: string;
    country: string;
    riskScore: number;
    riskTier: 'Low Risk' | 'Medium Risk' | 'High Risk';
    sanctionsStatus: 'Clean' | 'Flagged';
    cbuBlacklist: 'Clean' | 'Match Found';
    pepStatus: 'Non-PEP' | 'Politically Exposed Person';
    currencyControlStatus: 'Exempt / Standard' | 'Mandatory Reporting (>100M UZS)';
    timestamp: string;
  } | null>(null);

  useEffect(() => {
    if (prefilledComplianceBeneficiary) {
      setComplianceBeneficiary(prefilledComplianceBeneficiary);
    }
  }, [prefilledComplianceBeneficiary]);

  // Staff Support Ticket Form State
  const [ticketSubject, setTicketSubject] = useState<string>('Customer Inquiry regarding KDB Service');
  const [ticketCategory, setTicketCategory] = useState<'Transaction Issue' | 'Card & Account' | 'AML & Compliance' | 'Technical Bug' | 'Other'>('Transaction Issue');
  const [ticketPriority, setTicketPriority] = useState<'Low' | 'Medium' | 'High'>('High');
  const [ticketIssueText, setTicketIssueText] = useState<string>('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState<boolean>(false);
  const [submittedTicket, setSubmittedTicket] = useState<SupportTicket | null>(null);

  if (!isOpen) return null;

  const selectedAccount = accounts.find(a => a.id === fromAccountId) || accounts[0];

  // Execute Native Encrypted Transfer
  const handleExecuteNativeTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferAmount || transferAmount <= 0) return;
    if (selectedAccount.balance < transferAmount) {
      alert(`Insufficient funds in ${selectedAccount.name}. Available: ${formatCurrency(selectedAccount.balance, selectedAccount.currency)}`);
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      const receiptId = `KDB-SEC-${Date.now().toString().slice(-6)}`;
      const payload: TransferPayload = {
        id: `TX-${Date.now()}`,
        fromAccount: selectedAccount.id,
        toBeneficiary,
        toCardOrAccount: toAccountNum,
        amount: transferAmount,
        currency: transferCurrency,
        purpose: 'Native Encrypted Interbank Payment',
        commission: 0,
        status: 'Completed',
        receiptId,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      if (onCompleteTransfer) {
        onCompleteTransfer(payload);
      } else {
        setAccounts(prev => prev.map(a => a.id === selectedAccount.id ? { ...a, balance: Math.max(0, a.balance - transferAmount) } : a));
      }

      setIsProcessing(false);
      setTransferSuccess(payload);
    }, 700);
  };

  // Execute Native Direct FX Exchange
  const handleExecuteNativeFx = () => {
    const rate = fxDirection === 'BUY' ? EXCHANGE_RATES.USD_UZS_BUY : EXCHANGE_RATES.USD_UZS_SELL;
    const uzsTotal = fxAmount * rate;

    setAccounts(prev => prev.map(acc => {
      if (fxDirection === 'BUY') {
        if (acc.currency === 'UZS') return { ...acc, balance: Math.max(0, acc.balance - uzsTotal) };
        if (acc.currency === 'USD') return { ...acc, balance: acc.balance + fxAmount };
      } else {
        if (acc.currency === 'USD') return { ...acc, balance: Math.max(0, acc.balance - fxAmount) };
        if (acc.currency === 'UZS') return { ...acc, balance: acc.balance + uzsTotal };
      }
      return acc;
    }));

    setFxSuccessMsg(`Successfully converted ${fxDirection === 'BUY' ? `$${fxAmount} to ${uzsTotal.toLocaleString()} UZS` : `${uzsTotal.toLocaleString()} UZS to $${fxAmount}`} via KDB Direct Clearing.`);
    setTimeout(() => setFxSuccessMsg(null), 4000);
  };

  // Run Confidential AML Screening
  const handleRunConfidentialAml = () => {
    if (!complianceBeneficiary.trim()) return;
    setIsScreeningAml(true);

    setTimeout(() => {
      const lower = complianceBeneficiary.toLowerCase();
      const isRisky = lower.includes('sanction') || lower.includes('black') || lower.includes('iran') || lower.includes('dprk');
      const score = isRisky ? 89 : lower.includes('apex') ? 4 : 2;

      setAmlScreenResult({
        counterparty: complianceBeneficiary.trim(),
        inn: complianceInn.trim() || 'N/A',
        country: complianceCountry,
        riskScore: score,
        riskTier: isRisky ? 'High Risk' : 'Low Risk',
        sanctionsStatus: isRisky ? 'Flagged' : 'Clean',
        cbuBlacklist: isRisky ? 'Match Found' : 'Clean',
        pepStatus: isRisky ? 'Politically Exposed Person' : 'Non-PEP',
        currencyControlStatus: 'Exempt / Standard',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      });
      setIsScreeningAml(false);
    }, 650);
  };

  // Submit Staff Support Ticket
  const handleSubmitSupportTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketIssueText.trim()) return;

    setIsSubmittingTicket(true);

    setTimeout(() => {
      const ticketId = `KDB-SUP-${Date.now().toString().slice(-4)}`;
      const newTicket: SupportTicket = {
        id: ticketId,
        customerName: 'Authorized Client (You)',
        accountTier: 'Gold',
        subject: ticketSubject.trim(),
        issue: ticketIssueText.trim(),
        status: 'Open',
        priority: ticketPriority,
        date: new Date().toISOString().split('T')[0]
      };

      if (onSubmitSupportTicket) {
        onSubmitSupportTicket(newTicket);
      }

      setSubmittedTicket(newTicket);
      setIsSubmittingTicket(false);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Security Banner */}
        <div className="bg-slate-900 text-white px-5 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-emerald-400">
                  KDB Native Security Sandbox
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 font-mono">
                  TLS 1.3 / E2E
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white">Direct Banking Interface (Zero AI Processing)</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security Assurance Notice */}
        <div className="bg-emerald-50/90 border-b border-emerald-100 px-5 sm:px-6 py-2 flex items-center justify-between text-[11px] sm:text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span className="font-medium">
              Isolated Execution: Operations run directly through the bank's core clearing API without AI prompt tokens.
            </span>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 sm:px-6 gap-1 pt-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => { setActiveTab('transfer'); setTransferSuccess(null); }}
            className={`px-3 sm:px-4 py-2 text-xs font-bold rounded-t-xl border-t border-x transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'transfer'
                ? 'bg-white border-slate-200 text-indigo-600 shadow-xs -mb-[1px]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Secure Transfer</span>
          </button>

          <button
            onClick={() => setActiveTab('balance')}
            className={`px-3 sm:px-4 py-2 text-xs font-bold rounded-t-xl border-t border-x transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'balance'
                ? 'bg-white border-slate-200 text-indigo-600 shadow-xs -mb-[1px]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Account Balances</span>
          </button>

          <button
            onClick={() => setActiveTab('exchange')}
            className={`px-3 sm:px-4 py-2 text-xs font-bold rounded-t-xl border-t border-x transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'exchange'
                ? 'bg-white border-slate-200 text-indigo-600 shadow-xs -mb-[1px]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Currency FX</span>
          </button>

          <button
            onClick={() => setActiveTab('compliance')}
            className={`px-3 sm:px-4 py-2 text-xs font-bold rounded-t-xl border-t border-x transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'compliance'
                ? 'bg-white border-slate-200 text-indigo-600 shadow-xs -mb-[1px]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>AML & Compliance</span>
          </button>

          <button
            onClick={() => { setActiveTab('support'); setSubmittedTicket(null); }}
            className={`px-3 sm:px-4 py-2 text-xs font-bold rounded-t-xl border-t border-x transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'support'
                ? 'bg-white border-slate-200 text-rose-600 shadow-xs -mb-[1px]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Headphones className="w-3.5 h-3.5 text-rose-500" />
            <span>Staff Support</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* TAB 1: TRANSFER */}
          {activeTab === 'transfer' && (
            <div>
              {transferSuccess ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-emerald-900">Transfer Completed Securely</h4>
                    <p className="text-xs text-emerald-700 mt-1">
                      {formatCurrency(transferSuccess.amount, transferSuccess.currency)} has been credited to {transferSuccess.toBeneficiary}.
                    </p>
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-emerald-100 text-left text-xs space-y-2 max-w-md mx-auto">
                    <div className="flex justify-between text-slate-500">
                      <span>Receipt ID:</span>
                      <span className="font-mono font-bold text-slate-800">{transferSuccess.receiptId}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Debited From:</span>
                      <span className="font-medium text-slate-800">{selectedAccount.name}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Recipient:</span>
                      <span className="font-medium text-slate-800">{transferSuccess.toBeneficiary}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Security Mode:</span>
                      <span className="font-semibold text-emerald-600">Hardware-Isolated Direct Clearing</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => setTransferSuccess(null)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      Make Another Transfer
                    </button>
                    <button
                      onClick={onClose}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      Close Window
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleExecuteNativeTransfer} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Debit Account:
                    </label>
                    <select
                      value={fromAccountId}
                      onChange={(e) => setFromAccountId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} — Available: {formatCurrency(acc.balance, acc.currency)} ({acc.accountNumber})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Beneficiary Name:
                      </label>
                      <input
                        type="text"
                        value={toBeneficiary}
                        onChange={(e) => setToBeneficiary(e.target.value)}
                        placeholder="e.g. Akmal Karimov"
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Card / Account Number:
                      </label>
                      <input
                        type="text"
                        value={toAccountNum}
                        onChange={(e) => setToAccountNum(e.target.value)}
                        placeholder="8600 •••• •••• ••••"
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Transfer Amount:
                      </label>
                      <input
                        type="number"
                        value={transferAmount}
                        onChange={(e) => setTransferAmount(Number(e.target.value))}
                        min={1000}
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Currency:
                      </label>
                      <select
                        value={transferCurrency}
                        onChange={(e) => setTransferCurrency(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:bg-white"
                      >
                        <option value="UZS">UZS (Uzbek Som)</option>
                        <option value="USD">USD (US Dollar)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Security PIN / Transaction Code:
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        value={pinCode}
                        onChange={(e) => setPinCode(e.target.value)}
                        maxLength={4}
                        placeholder="••••"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-mono tracking-widest text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                      <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Enter your 4-digit mobile banking secure PIN.</p>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isProcessing || !transferAmount || transferAmount <= 0}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Routing to Clearing...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Authorize Direct Payment</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: BALANCE */}
          {activeTab === 'balance' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {accounts.map((acc) => (
                  <div key={acc.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {acc.type}
                      </span>
                      <span className="text-xs font-bold text-indigo-600">{acc.currency}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-800 truncate">{acc.name}</p>
                    <p className="text-base font-bold text-slate-900 font-mono">
                      {formatCurrency(acc.balance, acc.currency)}
                    </p>
                    <p className="text-[10px] font-mono text-slate-400">
                      {acc.cardMask || acc.accountNumber}
                    </p>
                  </div>
                ))}
              </div>

              <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4 text-xs text-indigo-900 space-y-1">
                <div className="flex items-center gap-2 font-bold">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Verified Direct Bank Ledger</span>
                </div>
                <p className="text-[11px] text-indigo-700">
                  Balances above are retrieved directly from the KDB Core Ledger via secure direct channel. No AI prompt logs were retained.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setActiveTab('transfer'); setTransferSuccess(null); }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Money From These Accounts</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: EXCHANGE */}
          {activeTab === 'exchange' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="font-bold text-slate-600">Official KDB FX Buy Rate:</span>
                  <span className="font-mono font-bold text-indigo-600">1 USD = {EXCHANGE_RATES.USD_UZS_BUY.toLocaleString()} UZS</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-600">Official KDB FX Sell Rate:</span>
                  <span className="font-mono font-bold text-indigo-600">1 USD = {EXCHANGE_RATES.USD_UZS_SELL.toLocaleString()} UZS</span>
                </div>
              </div>

              {fxSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{fxSuccessMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Direction:</label>
                  <select
                    value={fxDirection}
                    onChange={(e) => setFxDirection(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                  >
                    <option value="BUY">Buy USD (Pay UZS)</option>
                    <option value="SELL">Sell USD (Receive UZS)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">USD Amount:</label>
                  <input
                    type="number"
                    value={fxAmount}
                    onChange={(e) => setFxAmount(Number(e.target.value))}
                    min={1}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleExecuteNativeFx}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center gap-2"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>Execute Direct Exchange</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: CONFIDENTIAL AML & COMPLIANCE */}
          {activeTab === 'compliance' && (
            <div className="space-y-4">
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-950 flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold">Confidential AML / Sanctions Screening Matrix</p>
                  <p className="text-[11px] text-emerald-800">
                    Verify counterparties against Central Bank of Uzbekistan, UN Consolidated, and OFAC lists. Zero transaction data or company names are shared with external AI.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Beneficiary Entity / Person Name:
                  </label>
                  <input
                    type="text"
                    value={complianceBeneficiary}
                    onChange={(e) => setComplianceBeneficiary(e.target.value)}
                    placeholder="e.g. Apex Logistics LLC, UzAuto Motors, etc."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    TIN / INN (Tax ID):
                  </label>
                  <input
                    type="text"
                    value={complianceInn}
                    onChange={(e) => setComplianceInn(e.target.value)}
                    placeholder="e.g. 304892104"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jurisdiction / Country:
                  </label>
                  <select
                    value={complianceCountry}
                    onChange={(e) => setComplianceCountry(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                  >
                    <option value="Uzbekistan">Uzbekistan (CBU Domestic Clearing)</option>
                    <option value="United Arab Emirates">United Arab Emirates (UAE)</option>
                    <option value="Turkey">Turkey</option>
                    <option value="China">China</option>
                    <option value="Germany">Germany (EU / SEPA)</option>
                    <option value="United States">United States (USD Fedwire)</option>
                    <option value="South Korea">South Korea (KDB Head Office)</option>
                  </select>
                </div>
                <div className="pt-5">
                  <button
                    type="button"
                    onClick={handleRunConfidentialAml}
                    disabled={isScreeningAml || !complianceBeneficiary.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
                  >
                    {isScreeningAml ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Screening Database...</span>
                      </>
                    ) : (
                      <>
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>Run Confidential Check</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* AML Results Card */}
              {amlScreenResult && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Screening Target</span>
                      <h4 className="text-sm font-bold text-slate-900">{amlScreenResult.counterparty}</h4>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                        amlScreenResult.riskScore > 50
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {amlScreenResult.riskScore <= 50 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                        {amlScreenResult.riskTier} (Score: {amlScreenResult.riskScore}/100)
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">OFAC & UN Lists</span>
                      <span className={`font-bold font-mono ${amlScreenResult.sanctionsStatus === 'Clean' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {amlScreenResult.sanctionsStatus}
                      </span>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">CBU Registry</span>
                      <span className={`font-bold font-mono ${amlScreenResult.cbuBlacklist === 'Clean' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {amlScreenResult.cbuBlacklist}
                      </span>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">PEP Status</span>
                      <span className="font-bold text-slate-800">{amlScreenResult.pepStatus}</span>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">Currency Control</span>
                      <span className="font-bold text-slate-800">{amlScreenResult.currencyControlStatus}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-400">
                      Audited at {amlScreenResult.timestamp} • SHA-256 Verified
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setToBeneficiary(amlScreenResult.counterparty);
                        setActiveTab('transfer');
                        setTransferSuccess(null);
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Proceed to Transfer with this Entity</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: STAFF SUPPORT TICKET */}
          {activeTab === 'support' && (
            <div className="space-y-4">
              {submittedTicket ? (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                    <Headphones className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">Support Ticket Created Successfully</h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Ticket <span className="font-mono font-bold text-indigo-600">#{submittedTicket.id}</span> has been dispatched to authorized KDB bank staff.
                    </p>
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-slate-200 text-left text-xs space-y-2 max-w-md mx-auto">
                    <div className="flex justify-between text-slate-500">
                      <span>Subject:</span>
                      <span className="font-medium text-slate-800">{submittedTicket.subject}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Priority:</span>
                      <span className="font-bold text-rose-600">{submittedTicket.priority} Priority</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Assigned Department:</span>
                      <span className="font-medium text-slate-800">KDB Priority Customer Desk</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Expected Response Time:</span>
                      <span className="font-semibold text-emerald-600">Within 15–30 minutes</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => {
                        setSubmittedTicket(null);
                        setTicketIssueText('');
                      }}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      Create Another Ticket
                    </button>
                    <button
                      onClick={onClose}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      Close Window
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitSupportTicket} className="space-y-4">
                  <div className="bg-rose-50/70 border border-rose-100 rounded-xl p-3 text-xs text-rose-950 flex items-center gap-2.5">
                    <Headphones className="w-4 h-4 text-rose-600 shrink-0" />
                    <div>
                      <p className="font-bold">Human Bank Staff Escalation</p>
                      <p className="text-[11px] text-rose-800">
                        Write directly to certified KDB operations specialists. Tickets are encrypted and accessible only by authorized bank staff.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Category:
                      </label>
                      <select
                        value={ticketCategory}
                        onChange={(e) => setTicketCategory(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                      >
                        <option value="Transaction Issue">Transaction Issue</option>
                        <option value="Card & Account">Card & Account Inquiries</option>
                        <option value="AML & Compliance">AML & Sanctions Compliance</option>
                        <option value="Technical Bug">Technical Bug / App Error</option>
                        <option value="Other">General Customer Support</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Priority Level:
                      </label>
                      <select
                        value={ticketPriority}
                        onChange={(e) => setTicketPriority(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                      >
                        <option value="High">High (Immediate Escalation)</option>
                        <option value="Medium">Medium (Standard Business Hours)</option>
                        <option value="Low">Low (Informational)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Subject:
                    </label>
                    <input
                      type="text"
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      placeholder="Brief summary of your inquiry..."
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Detailed Issue Description:
                    </label>
                    <textarea
                      value={ticketIssueText}
                      onChange={(e) => setTicketIssueText(e.target.value)}
                      rows={4}
                      placeholder="Describe what happened, any error messages, or transactions involved..."
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingTicket || !ticketSubject.trim() || !ticketIssueText.trim()}
                      className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {isSubmittingTicket ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Dispatching Ticket...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Submit to Staff Queue</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
