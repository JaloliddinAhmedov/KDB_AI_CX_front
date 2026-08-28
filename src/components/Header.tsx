import React from 'react';
import { Search, Bell, Settings, UserCheck, LogOut, ShieldCheck } from 'lucide-react';
import { NavTab, UserProfile } from '../types';

interface HeaderProps {
  activeTab: NavTab;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  currentUser: UserProfile;
  onOpenProfileModal: () => void;
  onSignOut: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  searchQuery,
  setSearchQuery,
  currentUser,
  onOpenProfileModal,
  onSignOut
}) => {
  const titles: Record<NavTab, string> = {
    training: 'Knowledge Base & AI Training',
    assistant: 'AI Customer Assistant',
    dashboard: 'Banking Intelligence Dashboard',
    transactions: 'Transaction Search & Security',
    support: 'Customer Support Co-Pilot',
    users: 'User Management & Permissions',
  };

  const isAdmin = currentUser.role === 'admin';

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between sticky top-0 z-10">
      <h2 className="text-xl font-semibold text-slate-800 tracking-tight">
        {titles[activeTab] || 'Banking Assistant'}
      </h2>

      <div className="flex items-center gap-3">
        {/* Search Input */}
        <div className="relative w-64 hidden md:block">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documentation..."
            className="w-full bg-slate-50 border border-slate-200 rounded-full pl-10 pr-4 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        {/* User profile badge & switcher button */}
        <button
          onClick={onOpenProfileModal}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-slate-200 hover:border-slate-300 bg-slate-50/60 hover:bg-slate-100/80 transition-all text-left shadow-2xs cursor-pointer"
          title="Foydalanuvchi profili va rollarni o'zgartirish"
        >
          <div className={`w-7 h-7 rounded-full ${currentUser.avatarColor || 'bg-indigo-600'} text-white flex items-center justify-center font-bold text-xs shadow-2xs`}>
            {currentUser.displayName.charAt(0)}
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-bold text-slate-900 leading-none">{currentUser.displayName}</p>
            <span className={`text-[9px] font-extrabold uppercase ${isAdmin ? 'text-indigo-600' : 'text-slate-500'}`}>
              {isAdmin ? '🛡️ Admin' : '👤 User'}
            </span>
          </div>
        </button>

        {/* Sign Out Button */}
        <button
          onClick={onSignOut}
          className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-full border border-slate-200 transition-all cursor-pointer"
          title="Tizimdan chiqish (Sign Out)"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

