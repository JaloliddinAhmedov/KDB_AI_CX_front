import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  Loader2, 
  Receipt, 
  Copy, 
  Check, 
  Send, 
  UserCheck, 
  Building2, 
  CreditCard,
  PlusCircle,
  Users,
  BookmarkCheck,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Wallet
} from 'lucide-react';
import { BankAccount, TransferPayload, SavedBeneficiary } from '../../types';
import { 
  formatCurrency, 
  getSavedBeneficiaries, 
  saveBeneficiary, 
  detectCardOrAccountType, 
  formatCardOrAccount, 
  runComplianceCheck 
} from '../../utils/conversationalBanking';

interface TransferWidgetProps {
  initialPayload: TransferPayload;
  accounts: BankAccount[];
  onCompleteTransfer: (payload: TransferPayload) => void;
  onCancel?: () => void;
}

export const TransferWidget: React.FC<TransferWidgetProps> = ({
  initialPayload,
  accounts,
  onCompleteTransfer,
  onCancel
}) => {
  const [savedBeneficiaries, setSavedBeneficiaries] = useState<SavedBeneficiary[]>(() => getSavedBeneficiaries());
  
  // Beneficiary details
  const [beneficiaryName, setBeneficiaryName] = useState<string>(initialPayload.toBeneficiary || 'Akmal Karimov');
  const [cardOrAccount, setCardOrAccount] = useState<string>(initialPayload.toCardOrAccount || '8600 4912 3018 7741');
  const [selectedBenId, setSelectedBenId] = useState<string>('');
  const [saveToContacts, setSaveToContacts] = useState<boolean>(true);
  const [isManualInput, setIsManualInput] = useState<boolean>(false);

  // Amount & Account details
  const [amount, setAmount] = useState<number>(initialPayload.amount || 1500000);
  const [currency, setCurrency] = useState<'UZS' | 'USD'>(initialPayload.currency || 'UZS');
  const [selectedAccountId, setSelectedAccountId] = useState<string>(initialPayload.fromAccount || accounts[0]?.id || 'ACC-UZS-01');
  const [purpose, setPurpose] = useState<string>(initialPayload.purpose || "Tezkor to'lov");

  // State management
  const [status, setStatus] = useState<'Draft' | 'Processing' | 'Completed'>('Draft');
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [completedPayload, setCompletedPayload] = useState<TransferPayload | null>(null);
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  // Selected account
  const selectedAccount = accounts.find(a => a.id === selectedAccountId) || accounts[0];
  const hasInsufficientFunds = amount > (selectedAccount?.balance || 0);

  // Auto-detect card type
  const detectedCardType = detectCardOrAccountType(cardOrAccount);

  // Live dynamic compliance
  const currentCompliance = runComplianceCheck(beneficiaryName, amount, currency);

  // On mount: check if initial matches a saved beneficiary
  useEffect(() => {
    const list = getSavedBeneficiaries();
    setSavedBeneficiaries(list);
    const matched = list.find(b => 
      b.cardOrAccount.replace(/\s+/g, '') === cardOrAccount.replace(/\s+/g, '') ||
      b.name.toLowerCase() === beneficiaryName.toLowerCase()
    );
    if (matched) {
      setSelectedBenId(matched.id);
    }
  }, []);

  const handleSelectSavedBeneficiary = (ben: SavedBeneficiary) => {
    setSelectedBenId(ben.id);
    setBeneficiaryName(ben.name);
    setCardOrAccount(ben.cardOrAccount);
    setIsManualInput(false);
  };

  const handleSwitchToManual = () => {
    setSelectedBenId('custom');
    setIsManualInput(true);
    if (selectedBenId !== 'custom') {
      setBeneficiaryName('');
      setCardOrAccount('');
    }
  };

  const handleCardInputChange = (val: string) => {
    const formatted = formatCardOrAccount(val);
    setCardOrAccount(formatted);
    // If typing manually, mark as custom
    setSelectedBenId('custom');
    setIsManualInput(true);
  };

  const handleQuickAddAmount = (addValue: number) => {
    setAmount(prev => (prev || 0) + addValue);
  };

  const handleSetMaxAmount = () => {
    if (selectedAccount) {
      setAmount(selectedAccount.balance);
    }
  };

  const steps = [
    { num: 1, text: "1/4 Benefisiar bank rekvizitlari va karta holati tekshirilmoqda..." },
    { num: 2, text: `2/4 KDB Bank Compliance, AML va Sanctions screening: Ma'qullandi (Risk: ${currentCompliance.riskScore}/100)...` },
    { num: 3, text: "3/4 Markaziy Bank va KDB kliring shlyuzi orqali tranzaksiya yuborilmoqda..." },
    { num: 4, text: "4/4 Muvaffaqiyatli yakunlandi! Mablag' qabul qiluvchi hisobiga o'tkazildi." }
  ];

  const handleStartTransfer = () => {
    if (amount <= 0 || !beneficiaryName.trim() || !cardOrAccount.trim()) return;

    setStatus('Processing');
    setCurrentStep(1);

    // Save to beneficiaries list if requested or custom
    if (saveToContacts && beneficiaryName.trim() && cardOrAccount.trim()) {
      const saved = saveBeneficiary({
        name: beneficiaryName.trim(),
        cardOrAccount: cardOrAccount.trim(),
        type: detectedCardType
      });
      setSavedBeneficiaries(getSavedBeneficiaries());
    }

    // Step 1 -> Step 2
    setTimeout(() => {
      setCurrentStep(2);
    }, 600);

    // Step 2 -> Step 3
    setTimeout(() => {
      setCurrentStep(3);
    }, 1300);

    // Step 3 -> Step 4 (Complete)
    setTimeout(() => {
      setCurrentStep(4);
      const donePayload: TransferPayload = {
        id: `TRX-${Date.now().toString().slice(-6)}`,
        fromAccount: selectedAccountId,
        toBeneficiary: beneficiaryName.trim(),
        toCardOrAccount: cardOrAccount.trim(),
        amount,
        currency,
        purpose: purpose.trim() || `${beneficiaryName} hisobiga to'lov`,
        commission: 0,
        status: 'Completed',
        receiptId: `KDB-TRX-${Math.floor(100000 + Math.random() * 900000)}`,
        timestamp: new Date().toLocaleString('uz-UZ', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit',
          second: '2-digit'
        }),
        compliance: currentCompliance
      };
      setCompletedPayload(donePayload);
      setStatus('Completed');
      onCompleteTransfer(donePayload);
    }, 2200);
  };

  const handleCopyReceipt = () => {
    if (!completedPayload?.receiptId) return;
    const text = `KDB Bank O'zbekiston Tranzaksiya Cheki\nChek ID: #${completedPayload.receiptId}\nQabul qiluvchi: ${completedPayload.toBeneficiary}\nKarta/Hisob: ${completedPayload.toCardOrAccount}\nSumma: ${formatCurrency(completedPayload.amount, completedPayload.currency)}\nKomissiya: 0 UZS\nHolati: Muvaffaqiyatli (Success)\nSana: ${completedPayload.timestamp}`;
    navigator.clipboard.writeText(text);
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2000);
  };

  return (
    <div className="mt-3 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-4 max-w-xl text-slate-800">
      {/* 1. DRAFT STATE: EDITABLE INPUTS & PREVIEW */}
      {status === 'Draft' && (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Send className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900">KDB Pul O'tkazmasi</h4>
                <p className="text-[10px] text-slate-400">Qabul qiluvchi va summani tahrirlashingiz mumkin</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>AML: {currentCompliance.riskScore}/100 ({currentCompliance.amlStatus})</span>
            </div>
          </div>

          {/* SENDER ACCOUNT SELECTOR */}
          <div className="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/60">
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              Yuboruvchi hisob (Chiqim)
            </label>
            <select
              value={selectedAccountId}
              onChange={(e) => {
                setSelectedAccountId(e.target.value);
                const found = accounts.find(a => a.id === e.target.value);
                if (found) {
                  setCurrency(found.currency as 'UZS' | 'USD');
                }
              }}
              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} — {formatCurrency(acc.balance, acc.currency)} ({acc.cardMask || acc.accountNumber.slice(-6)})
                </option>
              ))}
            </select>
          </div>

          {/* SAVED BENEFICIARIES QUICK CHIPS */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3 text-indigo-600" />
                Saqlangan kontaktlar
              </span>
              <button
                type="button"
                onClick={handleSwitchToManual}
                className="text-indigo-600 hover:text-indigo-800 lowercase first-letter:uppercase font-bold flex items-center gap-0.5 cursor-pointer"
              >
                <PlusCircle className="w-3 h-3" />
                <span>Yangi karta kiritish</span>
              </button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {savedBeneficiaries.map((ben) => {
                const isSelected = selectedBenId === ben.id;
                return (
                  <button
                    key={ben.id}
                    type="button"
                    onClick={() => handleSelectSavedBeneficiary(ben)}
                    className={`shrink-0 px-2.5 py-1.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-950 ring-1 ring-indigo-500 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-lg ${ben.avatarColor || 'bg-indigo-600'} text-white flex items-center justify-center font-bold text-[10px]`}>
                      {ben.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold truncate max-w-[110px]">{ben.name}</p>
                      <p className="text-[9px] text-slate-400 font-mono truncate">{ben.cardOrAccount.slice(-9)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* BENEFICIARY NAME & CARD INPUTS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            {/* Beneficiary Name */}
            <div className="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-1">
              <label className="block text-[10px] font-bold uppercase text-slate-400">
                Qabul qiluvchi (F.I.SH / Nomi)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={beneficiaryName}
                  onChange={(e) => {
                    setBeneficiaryName(e.target.value);
                    setSelectedBenId('custom');
                    setIsManualInput(true);
                  }}
                  placeholder="Masalan: Jasur Rahimov"
                  className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <UserCheck className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            {/* Card / Account Number */}
            <div className="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-1">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400">
                <span>Karta / Hisob raqami</span>
                <span className="text-indigo-600 font-semibold">{detectedCardType}</span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={cardOrAccount}
                  onChange={(e) => handleCardInputChange(e.target.value)}
                  placeholder="8600 •••• •••• •••• yoki 20208..."
                  className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <CreditCard className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>

          {/* SAVE BENEFICIARY CHECKBOX */}
          <div className="flex items-center gap-2 px-1">
            <input
              type="checkbox"
              id="saveBeneficiaryCheck"
              checked={saveToContacts}
              onChange={(e) => setSaveToContacts(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
            />
            <label htmlFor="saveBeneficiaryCheck" className="text-[11px] text-slate-600 cursor-pointer flex items-center gap-1 select-none">
              <BookmarkCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Ushbu qabul qiluvchini kelgusi to'lovlar uchun saqlab qolish</span>
            </label>
          </div>

          {/* AMOUNT INPUT & QUICK BUTTONS */}
          <div className="bg-gradient-to-br from-indigo-50/70 to-slate-50 border border-indigo-100 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                O'tkazma Summasi
              </span>
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setCurrency('UZS')}
                  className={`px-2 py-0.5 rounded-md font-bold text-xs transition-colors cursor-pointer ${
                    currency === 'UZS' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  UZS
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency('USD')}
                  className={`px-2 py-0.5 rounded-md font-bold text-xs transition-colors cursor-pointer ${
                    currency === 'USD' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  USD
                </button>
              </div>
            </div>

            <div className="relative">
              <input
                type="number"
                value={amount || ''}
                onChange={(e) => setAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-xl sm:text-2xl font-black text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                placeholder="0"
              />
              <span className="absolute right-4 top-3 text-sm font-bold text-slate-400">
                {currency}
              </span>
            </div>

            {/* Quick Amount Add Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {currency === 'UZS' ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleQuickAddAmount(100000)}
                    className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 text-[10px] font-bold text-slate-700 cursor-pointer shadow-2xs"
                  >
                    +100 000
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAddAmount(500000)}
                    className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 text-[10px] font-bold text-slate-700 cursor-pointer shadow-2xs"
                  >
                    +500 000
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAddAmount(1000000)}
                    className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 text-[10px] font-bold text-slate-700 cursor-pointer shadow-2xs"
                  >
                    +1 000 000
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAddAmount(5000000)}
                    className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 text-[10px] font-bold text-slate-700 cursor-pointer shadow-2xs"
                  >
                    +5 000 000
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleQuickAddAmount(50)}
                    className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 text-[10px] font-bold text-slate-700 cursor-pointer shadow-2xs"
                  >
                    +$50
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAddAmount(100)}
                    className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 text-[10px] font-bold text-slate-700 cursor-pointer shadow-2xs"
                  >
                    +$100
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAddAmount(500)}
                    className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 text-[10px] font-bold text-slate-700 cursor-pointer shadow-2xs"
                  >
                    +$500
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={handleSetMaxAmount}
                className="px-2 py-1 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-[10px] font-bold text-indigo-700 cursor-pointer ml-auto"
              >
                Barchasi (Max)
              </button>
            </div>

            {hasInsufficientFunds && (
              <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 text-[11px] font-medium">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                <span>Tanlangan hisobda yetarli mablag' mavjud emas ({formatCurrency(selectedAccount.balance, selectedAccount.currency)})</span>
              </div>
            )}

            <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1 border-t border-indigo-100/60">
              <span>Mavjud qoldiq: <strong>{formatCurrency(selectedAccount.balance, selectedAccount.currency)}</strong></span>
              <span>Komissiya: <strong className="text-emerald-600 font-bold">0 UZS (0% KDB)</strong></span>
            </div>
          </div>

          {/* Purpose Input */}
          <div className="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-1 text-xs">
            <label className="block text-[10px] font-bold uppercase text-slate-400">
              To'lov Maqsadi (Ixtiyoriy)
            </label>
            <input
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Masalan: Xizmat haqi, qarz to'lovi..."
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Compliance Assurance Box */}
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 flex items-start gap-2.5 text-[11px] text-emerald-900">
            <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <div className="space-y-0.5">
              <p className="font-bold text-emerald-950">Avtomatlashtirilgan Xavfsizlik Skriningi: O'tdi</p>
              <p className="text-emerald-800 leading-relaxed text-[10px]">
                OFAC, BMT va Markaziy Bank sanksiya ro'yxatlariga ko'ra {beneficiaryName} nomiga tranzaksiya to'liq ruxsat etilgan.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Bekor qilish
              </button>
            )}

            <button
              type="button"
              onClick={handleStartTransfer}
              disabled={amount <= 0 || !beneficiaryName.trim() || !cardOrAccount.trim() || hasInsufficientFunds}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Tasdiqlash va Yuborish</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. PROCESSING STATE (Step-by-Step animation) */}
      {status === 'Processing' && (
        <div className="py-6 px-3 space-y-6 text-center animate-in fade-in">
          <div className="relative w-14 h-14 mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-sm animate-pulse">
              <Loader2 className="w-7 h-7 animate-spin text-indigo-600" />
            </div>
          </div>

          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-900">
              Tranzaksiya Bajarilmoqda...
            </h4>
            <p className="text-xs text-slate-500">
              {formatCurrency(amount, currency)} ➔ {beneficiaryName}
            </p>
          </div>

          {/* Progress Steps List */}
          <div className="space-y-2 text-left max-w-md mx-auto">
            {steps.map((s) => {
              const isDone = currentStep > s.num;
              const isCurrent = currentStep === s.num;
              return (
                <div
                  key={s.num}
                  className={`p-2.5 rounded-xl border text-xs flex items-center gap-2.5 transition-all ${
                    isDone
                      ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900 font-semibold'
                      : isCurrent
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 text-indigo-600 animate-spin shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center text-[10px] text-slate-400 shrink-0">
                      {s.num}
                    </div>
                  )}
                  <span className="leading-snug">{s.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. COMPLETED STATE (Official Bank Receipt) */}
      {status === 'Completed' && completedPayload && (
        <div className="space-y-4 animate-in zoom-in-95 duration-200">
          {/* Header Success Badge */}
          <div className="bg-emerald-600 rounded-xl p-4 text-white text-center shadow-xs space-y-1">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center mx-auto mb-1">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-sm sm:text-base font-black tracking-tight">
              Muvaffaqiyatli O'tkazildi!
            </h4>
            <p className="text-[11px] text-emerald-100">
              Tranzaksiya KDB Bank kliringi orqali tasdiqlandi va saqlandi
            </p>
          </div>

          {/* Official Receipt Card */}
          <div className="border border-dashed border-slate-300 rounded-xl p-4 bg-slate-50/60 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-800">Rasmiy Bank Cheki</span>
              </div>
              <span className="font-mono text-[10px] font-bold text-slate-500">
                #{completedPayload.receiptId}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Yuborilgan summa:</span>
                <span className="font-black text-slate-900 text-sm">
                  {formatCurrency(completedPayload.amount, completedPayload.currency)}
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-600">
                <span>Qabul qiluvchi:</span>
                <span className="font-bold text-slate-800">{completedPayload.toBeneficiary}</span>
              </div>

              <div className="flex justify-between items-center text-slate-600">
                <span>Karta / Rekvizit:</span>
                <span className="font-mono text-slate-700">{completedPayload.toCardOrAccount}</span>
              </div>

              <div className="flex justify-between items-center text-slate-600">
                <span>Chiqim hisobi:</span>
                <span className="font-medium text-slate-700">{selectedAccount.name}</span>
              </div>

              <div className="flex justify-between items-center text-slate-600">
                <span>Bank komissiyasi:</span>
                <span className="font-bold text-emerald-600">0 UZS (0%)</span>
              </div>

              <div className="flex justify-between items-center text-slate-600">
                <span>Sana va vaqt:</span>
                <span className="text-slate-500 font-mono text-[11px]">{completedPayload.timestamp}</span>
              </div>

              <div className="flex justify-between items-center text-slate-600">
                <span>AML & Compliance Status:</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Tasdiqlangan (Risk: {completedPayload.compliance?.riskScore || 2}/100)
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={handleCopyReceipt}
              className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedReceipt ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedReceipt ? 'Nusxalandi' : 'Chekni nusxalash'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setStatus('Draft');
                setCompletedPayload(null);
                setSavedBeneficiaries(getSavedBeneficiaries());
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer ml-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Yangi O'tkazma</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
