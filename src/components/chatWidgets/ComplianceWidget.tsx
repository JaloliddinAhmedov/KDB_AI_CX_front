import React from 'react';
import { ShieldCheck, ShieldAlert, CheckCircle2, AlertTriangle, Scale, Lock, Search } from 'lucide-react';
import { ComplianceCheckData } from '../../types';

interface ComplianceWidgetProps {
  data: ComplianceCheckData;
  onProceedTransfer?: (data: ComplianceCheckData) => void;
}

export const ComplianceWidget: React.FC<ComplianceWidgetProps> = ({
  data,
  onProceedTransfer
}) => {
  const isSafe = data.riskScore < 30;

  return (
    <div className="mt-3 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-4 max-w-xl text-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
            isSafe ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
          }`}>
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900">KDB Bank Compliance & AML Screening</h4>
            <p className="text-[10px] text-slate-400">International sanctions and automated security screening</p>
          </div>
        </div>

        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
          isSafe 
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
            : 'bg-amber-50 text-amber-700 border-amber-200'
        }`}>
          {isSafe ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
          {isSafe ? 'Passed (Approved)' : 'Manual Review'}
        </span>
      </div>

      {/* Risk Gauge Bar */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold text-slate-700">Risk Assessment Index:</span>
          <span className={`font-black text-xs sm:text-sm ${
            isSafe ? 'text-emerald-600' : 'text-amber-600'
          }`}>
            {data.riskScore}/100 ({isSafe ? 'LOW RISK' : 'MODERATE RISK'})
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${
              data.riskScore < 20 
                ? 'bg-emerald-500' 
                : data.riskScore < 50 
                ? 'bg-blue-500' 
                : 'bg-amber-500'
            }`}
            style={{ width: `${Math.max(5, data.riskScore)}%` }}
          />
        </div>
      </div>

      {/* Grid of 4 Checks */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50">
          <span className="text-[10px] font-bold text-slate-400 block">OFAC & UN Sanctions</span>
          <span className="font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            {data.sanctionCheck}
          </span>
        </div>

        <div className="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50">
          <span className="text-[10px] font-bold text-slate-400 block">AML Status</span>
          <span className="font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            {data.amlStatus}
          </span>
        </div>

        <div className="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50">
          <span className="text-[10px] font-bold text-slate-400 block">KYC Verification</span>
          <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
            <Lock className="w-3.5 h-3.5 text-indigo-600" />
            {data.kycLevel} Level
          </span>
        </div>

        <div className="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50">
          <span className="text-[10px] font-bold text-slate-400 block">Daily Limit Status</span>
          <span className="font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
            <Scale className="w-3.5 h-3.5 text-emerald-600" />
            {data.limitStatus}
          </span>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1 bg-slate-50 border border-slate-200/60 rounded-xl p-3 text-[11px] text-slate-600">
        <p className="font-bold text-slate-800 text-xs mb-1">Security protocols summary:</p>
        {data.notes.map((note, idx) => (
          <div key={idx} className="flex items-start gap-1.5">
            <span className="text-emerald-600 font-bold">•</span>
            <span>{note}</span>
          </div>
        ))}
      </div>

      {/* Action Button */}
      {onProceedTransfer && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => onProceedTransfer(data)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <span>Proceed to Transfer to this Beneficiary</span>
            <CheckCircle2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

