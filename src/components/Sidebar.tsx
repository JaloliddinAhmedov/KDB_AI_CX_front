import React from 'react';
import { 
  LayoutDashboard, 
  Bot, 
  Sparkles, 
  Receipt, 
  HelpCircle, 
  Users,
  Plus,
  Lock,
  ShieldCheck
} from 'lucide-react';
import { NavTab, UserProfile } from '../types';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  onOpenNewJobModal: () => void;
  currentUser: UserProfile;
  onPermissionDenied: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewJobModal,
  currentUser,
  onPermissionDenied
}) => {
  const isAdmin = currentUser.role === 'admin';

  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'assistant' as NavTab, label: 'AI Assistant', icon: Bot },
    { id: 'training' as NavTab, label: 'AI Training', icon: Sparkles },
    { id: 'transactions' as NavTab, label: 'Transaction Search', icon: Receipt },
    { id: 'support' as NavTab, label: 'Support', icon: HelpCircle },
    { id: 'users' as NavTab, label: 'Users & Roles', icon: Users },
  ];

  const userAllowedTabs = currentUser.allowedTabs || (
    isAdmin 
      ? ['dashboard', 'assistant', 'training', 'transactions', 'support', 'users']
      : ['dashboard', 'assistant', 'transactions', 'support']
  );

  const visibleNavItems = navItems.filter(item => userAllowedTabs.includes(item.id));

  const handleNewJobClick = () => {
    if (isAdmin) {
      onOpenNewJobModal();
    } else {
      onPermissionDenied();
    }
  };

  return (
    <aside className="w-64 bg-[#f3f5f8] border-r border-slate-200/80 flex flex-col justify-between h-screen sticky top-0 z-20 select-none">
      <div>
        {/* Brand logo & header */}
        <div className="p-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              KDB
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-sm leading-snug">KDB Bank UZ</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-extrabold uppercase tracking-wide ${
                  isAdmin ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-700'
                }`}>
                  {isAdmin ? 'ADMIN' : 'USER'}
                </span>
                <span className="text-[11px] text-indigo-600 font-bold">AI-CX Platform</span>
              </div>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="px-3 space-y-1.5 mt-1">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-[#e8edff] text-indigo-700 shadow-xs border-r-4 border-indigo-600 font-semibold'
                    : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom sidebar action button */}
      <div className="p-4 space-y-2">
        <button
          onClick={handleNewJobClick}
          className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-medium text-sm transition-all duration-150 shadow-md active:scale-[0.98] ${
            isAdmin
              ? 'bg-[#0c192d] hover:bg-[#152744] text-white'
              : 'bg-slate-300 text-slate-600 cursor-pointer hover:bg-slate-400/80'
          }`}
        >
          {isAdmin ? (
            <Plus className="w-4 h-4 text-white" />
          ) : (
            <Lock className="w-4 h-4 text-slate-600" />
          )}
          <span>{isAdmin ? 'New Training Job' : 'Train AI (Admin Only)'}</span>
        </button>
      </div>
    </aside>
  );
};

