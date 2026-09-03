import React from 'react';
import { ShieldAlert, X, Lock } from 'lucide-react';
import { UserProfile } from '../types';

interface PermissionDeniedModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onSwitchToAdmin: () => void;
}

export const PermissionDeniedModal: React.FC<PermissionDeniedModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSwitchToAdmin
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-amber-600 font-bold text-base">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            <span>Huquq Cheklangan (Permission Denied)</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs text-slate-600">
          <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-sm text-amber-950">
              <Lock className="w-4 h-4 text-amber-700" /> Faqat ADMIN lar Train qila oladi!
            </p>
            <p className="leading-relaxed">
              Siz hozirda <span className="font-bold">{currentUser.displayName}</span> ({currentUser.email}) hisobi bilan <span className="font-bold uppercase text-amber-800">Standard User</span> rolida turibsiz.
            </p>
          </div>

          <p className="leading-relaxed text-slate-700">
            KDB Bank Uzbekistan AI-CX xavfsizlik va muvofiqlik siyosatiga ko'ra, AI modeliga yangi fayl va hujjatlar yuklash yoki veb-saytlarni scrape qilish huquqi <strong>faqat ADMIN rollariga berilgan</strong>.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
          >
            Tushundim
          </button>
          
          <button
            onClick={() => {
              onSwitchToAdmin();
              onClose();
            }}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs"
          >
            <span>Admin Roliga O'tish (Test)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
