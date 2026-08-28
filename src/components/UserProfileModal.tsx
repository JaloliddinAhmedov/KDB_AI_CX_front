import React, { useState } from 'react';
import { X, ShieldCheck, User, Mail, Building, Check, RefreshCw, LogOut } from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import { updateUserProfileInDb, updateUserRoleInDb } from '../lib/firestoreService';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
  allUsers: UserProfile[];
  onSignOut: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  setCurrentUser,
  allUsers,
  onSignOut
}) => {
  const [displayName, setDisplayName] = useState(currentUser.displayName);
  const [department, setDepartment] = useState(currentUser.department);
  const [role, setRole] = useState<UserRole>(currentUser.role);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const updated = {
      ...currentUser,
      displayName,
      department,
      role
    };

    await updateUserProfileInDb(currentUser.uid, { displayName, department, role });
    setCurrentUser(updated);
    setIsSaving(false);
    onClose();
  };

  const handleSwitchAccount = (user: UserProfile) => {
    setCurrentUser(user);
    setDisplayName(user.displayName);
    setDepartment(user.department);
    setRole(user.role);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${currentUser.avatarColor || 'bg-indigo-600'} text-white flex items-center justify-center font-bold text-lg shadow-sm`}>
              {currentUser.displayName.charAt(0)}
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-lg">{currentUser.displayName}</h2>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase ${
                  currentUser.role === 'admin' 
                    ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' 
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}>
                  {currentUser.role === 'admin' ? '🛡️ Admin' : '👤 User'}
                </span>
                <span className="text-xs text-slate-500">{currentUser.email}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Demo Switcher */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
              Quick Switch User Session (Test Permissions):
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {allUsers.map((u) => {
              const isSelected = u.uid === currentUser.uid;
              return (
                <button
                  key={u.uid}
                  type="button"
                  onClick={() => handleSwitchAccount(u)}
                  className={`p-2.5 rounded-lg border text-left text-xs transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/70 font-semibold shadow-2xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate font-bold text-slate-900">{u.displayName.split(' ')[0]}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                      u.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {u.role}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 truncate mt-1">{u.department}</span>
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" /> Full Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-slate-400" /> Department / Position
            </label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> System Access Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
            >
              <option value="admin">Admin (Full Control: Train AI, Manage Users & Data)</option>
              <option value="user">Standard User (Read Only: Query Assistant & View Reports)</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              {role === 'admin' 
                ? '✅ Admin users have full authority to upload training files, crawl websites, and manage user roles.'
                : '⚠️ Standard users can query the AI Assistant, but cannot train models or upload documents.'}
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                onClose();
                onSignOut();
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out (Tizimdan chiqish)</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Close
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-5 rounded-xl text-xs transition-all shadow-xs flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
