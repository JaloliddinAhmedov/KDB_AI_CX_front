import React, { useState } from 'react';
import { 
  LogIn, 
  UserPlus, 
  ShieldCheck, 
  Mail, 
  Lock, 
  User, 
  Building, 
  Sparkles, 
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Bot
} from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { UserProfile, UserRole, NavTab } from '../types';
import { createNewUserInDb } from '../lib/firestoreService';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onSuccessLogin: (user: UserProfile) => void;
  allUsers: UserProfile[];
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccessLogin,
  allUsers
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleDemoLogin = (targetUser: UserProfile) => {
    onSuccessLogin(targetUser);
    if (onClose) onClose();
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      // 1. Try Firebase Auth
      let authUid: string | null = null;
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        authUid = userCredential.user.uid;
      } catch (authErr: any) {
        // Fallback to matching email in Firestore users if mock credentials used
        console.log('Firebase auth direct attempt:', authErr.message);
      }

      // Find user profile in Firestore users
      const existingUser = allUsers.find(
        u => u.email.toLowerCase() === email.toLowerCase() || (authUid && u.uid === authUid)
      );

      if (existingUser) {
        onSuccessLogin(existingUser);
        if (onClose) onClose();
      } else if (authUid) {
        // Create profile for authenticated user
        const newProfile: UserProfile = {
          uid: authUid,
          email,
          displayName: email.split('@')[0],
          role: 'user',
          department: 'General Staff',
          avatarColor: 'bg-indigo-600',
          allowedTabs: ['dashboard', 'assistant', 'transactions', 'support'],
          createdAt: new Date().toISOString().split('T')[0]
        };
        await createNewUserInDb(newProfile);
        onSuccessLogin(newProfile);
        if (onClose) onClose();
      } else {
        setErrorMsg('Email yoki parol noto`g`ri! (Quick Demo tugmalardan foydalanishingiz mumkin)');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Kirishda xatolik yuz berdi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !displayName) {
      setErrorMsg('Iltimos, barcha majburiy maydonlarni to`ldiring');
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);

    const defaultTabs: NavTab[] = role === 'admin' 
      ? ['dashboard', 'assistant', 'training', 'transactions', 'support', 'users']
      : ['dashboard', 'assistant', 'transactions', 'support'];

    try {
      let uid = `usr-${Date.now()}`;
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        uid = userCredential.user.uid;
      } catch (authErr) {
        console.log('Creating profile with custom ID');
      }

      const newUser: UserProfile = {
        uid,
        email,
        displayName,
        department: department || 'Banking Staff',
        role,
        avatarColor: role === 'admin' ? 'bg-indigo-600' : 'bg-emerald-600',
        allowedTabs: defaultTabs,
        createdAt: new Date().toISOString().split('T')[0]
      };

      await createNewUserInDb(newUser);
      onSuccessLogin(newUser);
      if (onClose) onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Ro`yxatdan o`tishda xatolik yuz berdi');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col md:flex-row animate-in fade-in zoom-in duration-200">
        
        {/* Left Side Branding */}
        <div className="bg-[#0c192d] p-8 text-white md:w-5/12 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-600/30 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/20 rounded-full blur-2xl"></div>

          <div className="relative z-10 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Bot className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">KDB Bank UZ AI-CX</h2>
              <p className="text-xs text-indigo-200/80 mt-1">AI-Driven Customer Experience Platform</p>
            </div>
          </div>

          <div className="relative z-10 my-6 space-y-2.5 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Role-Based Menu Permissions</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Admin AI Training Authority</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Real-Time Firestore Sync</span>
            </div>
          </div>

          <div className="relative z-10 border-t border-slate-700/60 pt-4 text-[11px] text-slate-400">
            KDB Bank Uzbekistan AI-CX Security Protocol v4.2
          </div>
        </div>

        {/* Right Side Form */}
        <div className="p-8 md:w-7/12 flex flex-col justify-between space-y-6">
          
          {/* Header Switcher */}
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setMode('signin'); setErrorMsg(null); }}
                  className={`text-sm font-bold pb-1 transition-all ${
                    mode === 'signin'
                      ? 'text-indigo-600 border-b-2 border-indigo-600'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Sign In (Kirish)
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setErrorMsg(null); }}
                  className={`text-sm font-bold pb-1 transition-all ${
                    mode === 'signup'
                      ? 'text-indigo-600 border-b-2 border-indigo-600'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Sign Up (Ro'yxatdan o'tish)
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* SIGN IN FORM */}
            {mode === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Manzili</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@kdb.uz"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Parol</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-xl text-xs transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 mt-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{isLoading ? 'Tekshirilmoqda...' : 'Tizimga Kirish'}</span>
                </button>
              </form>
            )}

            {/* SIGN UP FORM */}
            {mode === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">To'liq Ism Sharif</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Masalan: Bekzod Karimov"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="bekzod@kdb.uz"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Parol</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Bo'lim</label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="Marketing / IT"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Rol</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-800 font-semibold"
                    >
                      <option value="user">User (Standard)</option>
                      <option value="admin">Admin (Full Train)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-xl text-xs transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 mt-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isLoading ? 'Yaratilmoqda...' : 'Ro`yxatdan O`tish'}</span>
                </button>
              </form>
            )}
          </div>

          {/* Quick Demo Accounts Selection */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2">
            <p className="text-[11px] font-bold text-slate-600 flex items-center justify-between">
              <span>⚡ Tezkor Demo Account orqali kirish:</span>
            </p>

            <div className="space-y-1.5">
              {allUsers.slice(0, 3).map((u) => (
                <button
                  key={u.uid}
                  type="button"
                  onClick={() => handleDemoLogin(u)}
                  className="w-full p-2 bg-white hover:bg-indigo-50/60 border border-slate-200/80 hover:border-indigo-300 rounded-xl text-left transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className={`w-6 h-6 rounded-lg ${u.avatarColor || 'bg-indigo-600'} text-white font-bold text-[10px] flex items-center justify-center shrink-0`}>
                      {u.displayName.charAt(0)}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-700 truncate">{u.displayName}</p>
                      <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                    </div>
                  </div>

                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase shrink-0 ${
                    u.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {u.role === 'admin' ? '🛡️ Admin' : '👤 User'}
                  </span>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
