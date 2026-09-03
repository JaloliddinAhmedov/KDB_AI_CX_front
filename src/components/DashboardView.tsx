import React from 'react';
import { 
  TrendingUp, 
  Users, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  ArrowUpRight, 
  ShieldAlert,
  BarChart2
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  return (
    <div className="p-8 space-y-8 bg-[#f8fafc] min-h-[calc(100vh-4rem)]">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">KDB Bank Uzbekistan AI-CX Overview</h1>
        <p className="text-sm text-slate-500 mt-1">Real-time metrics on customer experience, query resolution, and model engagement.</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">AI Resolution Rate</span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">94.2%</span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center">
              +2.4% <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Resolved without human escalation</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Monthly Inquiries</span>
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">48,290</span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center">
              +14% <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Across web, mobile, & chat</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Avg Response Time</span>
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">0.82s</span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center">
              -0.15s <ArrowUpRight className="w-3.5 h-3.5 rotate-90" />
            </span>
          </div>
          <p className="text-[11px] text-slate-400">AI Engine latency</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">CSAT Rating</span>
            <span className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">4.9 / 5.0</span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center">
              +0.2 <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Based on 12,400 user ratings</p>
        </div>
      </div>

      {/* Main Charts & Intent Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Banking Intents (Span 7) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 text-base flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-600" />
              Top Customer Banking Inquiries
            </h3>
            <span className="text-xs text-slate-400 font-medium">Last 30 days</span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span className="text-slate-800">Mortgage Qualifications & APR Rates</span>
                <span className="text-slate-900 font-bold">34% (16,418 requests)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: '34%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span className="text-slate-800">High-Yield Savings & Certificate of Deposit</span>
                <span className="text-slate-900 font-bold">28% (13,521 requests)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div className="bg-indigo-500 h-2.5 rounded-full" style={{ width: '28%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span className="text-slate-800">International Wire Transfers & Uzbek Support</span>
                <span className="text-slate-900 font-bold">22% (10,623 requests)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div className="bg-indigo-400 h-2.5 rounded-full" style={{ width: '22%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span className="text-slate-800">Debit Card Limits & Fraud Alerts</span>
                <span className="text-slate-900 font-bold">16% (7,728 requests)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div className="bg-indigo-300 h-2.5 rounded-full" style={{ width: '16%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Recommendations & Live Highlights (Span 5) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-slate-900 text-base">KDB AI Intelligence Directives</h3>
          </div>

          <div className="space-y-3.5">
            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 space-y-1">
              <p className="text-xs font-semibold text-indigo-800">Mortgage Knowledge Base Ready</p>
              <p className="text-xs text-slate-600 leading-relaxed">
                2024 Mortgage FAQs source has reduced customer support escalations by 41% since Oct 12.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-100 space-y-1">
              <p className="text-xs font-semibold text-amber-800">Wealth Terms Needs Retraining</p>
              <p className="text-xs text-slate-600 leading-relaxed">
                Coverage for Wealth Management stands at 45%. We recommend launching a new training job for Wealth Terms.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                <span>Multi-lingual Uzbek CX</span>
                <span className="text-emerald-600">Active</span>
              </div>
              <p className="text-xs text-slate-500">
                AI Assistant is successfully processing Uzbek banking requests using localized terminology.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
