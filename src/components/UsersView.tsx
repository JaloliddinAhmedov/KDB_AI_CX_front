import React, { useState } from 'react';
import { 
  Users, 
  ShieldCheck, 
  UserPlus, 
  User, 
  Mail, 
  Building, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  Lock,
  LayoutGrid,
  Check,
  X,
  Sliders
} from 'lucide-react';
import { UserProfile, UserRole, NavTab } from '../types';
import { 
  updateUserRoleInDb, 
  createNewUserInDb, 
  updateUserAllowedTabsInDb,
  deleteUserFromDb
} from '../lib/firestoreService';

interface UsersViewProps {
  users: UserProfile[];
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
}

const NAV_TABS_CONFIG: { id: NavTab; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'assistant', label: 'AI Assistant', icon: '🤖' },
  { id: 'training', label: 'AI Knowledge Center', icon: '🧠' },
  { id: 'transactions', label: 'Transaction Search', icon: '💳' },
  { id: 'support', label: 'Support Operations', icon: '🎧' },
  { id: 'users', label: 'Users & Roles (Admin)', icon: '👥' }
];

export const UsersView: React.FC<UsersViewProps> = ({
  users,
  currentUser,
  setCurrentUser
}) => {
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editingMenuUser, setEditingMenuUser] = useState<UserProfile | null>(null);
  const [selectedTabs, setSelectedTabs] = useState<NavTab[]>([]);

  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newDepartment, setNewDepartment] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('user');

  const isAdmin = currentUser.role === 'admin';

  const handleToggleRole = async (targetUser: UserProfile) => {
    if (!isAdmin) {
      alert('Tizim ogohlantirishi: Faqat Admin rollari foydalanuvchi huquqlarini o`zgartirishi mumkin!');
      return;
    }
    const updatedRole: UserRole = targetUser.role === 'admin' ? 'user' : 'admin';
    await updateUserRoleInDb(targetUser.uid, updatedRole);
    if (targetUser.uid === currentUser.uid) {
      setCurrentUser({ ...currentUser, role: updatedRole });
    }
  };

  const handleOpenMenuPermissions = (user: UserProfile) => {
    setEditingMenuUser(user);
    setSelectedTabs(user.allowedTabs || ['dashboard', 'assistant', 'transactions', 'support']);
  };

  const handleToggleTabChoice = (tabId: NavTab) => {
    setSelectedTabs(prev => 
      prev.includes(tabId)
        ? prev.filter(t => t !== tabId)
        : [...prev, tabId]
    );
  };

  const handleSaveMenuPermissions = async () => {
    if (!editingMenuUser) return;
    await updateUserAllowedTabsInDb(editingMenuUser.uid, selectedTabs);
    if (editingMenuUser.uid === currentUser.uid) {
      setCurrentUser({ ...currentUser, allowedTabs: selectedTabs });
    }
    setEditingMenuUser(null);
  };

  const handleDeleteUser = async (user: UserProfile) => {
    if (!isAdmin) return;
    if (user.uid === currentUser.uid) {
      alert("O'zingizning hisobingizni o'chira olmaysiz!");
      return;
    }
    if (confirm(`${user.displayName} foydalanuvchisini o'chirishni tasdiqlaysizmi?`)) {
      await deleteUserFromDb(user.uid);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newName) return;

    const defaultTabs: NavTab[] = newRole === 'admin'
      ? ['dashboard', 'assistant', 'training', 'transactions', 'support', 'users']
      : ['dashboard', 'assistant', 'transactions', 'support'];

    const newUser: UserProfile = {
      uid: `usr-${Date.now()}`,
      email: newEmail,
      displayName: newName,
      department: newDepartment || 'Banking Operations',
      role: newRole,
      avatarColor: newRole === 'admin' ? 'bg-indigo-600' : 'bg-emerald-600',
      allowedTabs: defaultTabs,
      createdAt: new Date().toISOString().split('T')[0]
    };

    await createNewUserInDb(newUser);
    setNewEmail('');
    setNewName('');
    setNewDepartment('');
    setIsAddingUser(false);
  };

  const adminCount = users.filter(u => u.role === 'admin').length;
  const standardCount = users.filter(u => u.role === 'user').length;

  return (
    <div className="p-8 space-y-6 bg-[#f8fafc] min-h-[calc(100vh-4rem)]">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Foydalanuvchilar va Menular Huquqi</h1>
            <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-md border border-indigo-200">
              Firestore Database Synced
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Foydalanuvchi rollari hamda har bir xodimga alohida menularni biriktirish (Admin access control).
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsAddingUser(!isAddingUser)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-xs flex items-center gap-2 self-start"
          >
            <UserPlus className="w-4 h-4" />
            <span>Yangi Foydalanuvchi Qo'shish</span>
          </button>
        )}
      </div>

      {!isAdmin && (
        <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-4 flex items-center gap-3 text-xs text-amber-900">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <span className="font-bold">Siz Standart (User) rolida kirgansiz.</span> Siz foydalanuvchilar ro'yxatini ko'rishingiz mumkin, lekin menularni biriktirish yoki rollarni o'zgartirish faqat <span className="font-extrabold text-amber-950">ADMIN</span> hisobiga ruxsat etilgan.
          </div>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Jami Foydalanuvchilar</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{users.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Admin Rollari (Full Admin)</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{adminCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Standart User (Restricted)</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{standardCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <User className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Add User Form Drawer */}
      {isAddingUser && (
        <form onSubmit={handleCreateUser} className="bg-white rounded-2xl border border-indigo-200 p-6 shadow-md space-y-4 animate-in fade-in duration-200">
          <h3 className="font-bold text-slate-900 text-base">Yangi Foydalanuvchi Qo'shish</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">To'liq Ismi</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Masalan: Dilshod Rahimov"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Manzili</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="d.rahimov@kdb.uz"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bo'lim / Lavozim</label>
              <input
                type="text"
                value={newDepartment}
                onChange={(e) => setNewDepartment(e.target.value)}
                placeholder="Kredit Analitigi"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Roli</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-semibold"
              >
                <option value="user">User (Standard Access)</option>
                <option value="admin">Admin (Train Access)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingUser(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-xs font-medium hover:bg-indigo-700"
            >
              Saqlash va Qo'shish
            </button>
          </div>
        </form>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-base">Foydalanuvchilar va Birlashgan Menular</h3>
          <span className="text-xs text-slate-500 font-medium">Har bir xodimga tegishli bo'lim va menularni belgilang</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-6">Foydalanuvchi</th>
                <th className="py-3.5 px-6">Bo'lim</th>
                <th className="py-3.5 px-6">Rol</th>
                <th className="py-3.5 px-6">Biriktirilgan Menular (Tabs)</th>
                <th className="py-3.5 px-6 text-right">Boshqaruv (Admin Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-800 font-medium">
              {users.map((u) => {
                const isSelf = u.uid === currentUser.uid;
                const isUserAdmin = u.role === 'admin';
                const userTabs = u.allowedTabs || ['dashboard', 'assistant', 'transactions', 'support'];

                return (
                  <tr key={u.uid} className={`hover:bg-slate-50/70 transition-colors ${isSelf ? 'bg-indigo-50/30' : ''}`}>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl ${u.avatarColor || 'bg-indigo-600'} text-white flex items-center justify-center font-bold text-sm shadow-2xs`}>
                          {u.displayName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 flex items-center gap-1.5">
                            {u.displayName}
                            {isSelf && (
                              <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded font-extrabold">
                                (Siz)
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-slate-400 font-normal">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6 text-slate-600">
                      {u.department}
                    </td>

                    <td className="py-4 px-6">
                      <button
                        onClick={() => isAdmin && handleToggleRole(u)}
                        disabled={!isAdmin}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide uppercase transition-all ${
                          isUserAdmin
                            ? 'bg-indigo-100 text-indigo-700 border border-indigo-200 hover:bg-indigo-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200'
                        }`}
                      >
                        {isUserAdmin ? '🛡️ Admin' : '👤 Standard User'}
                      </button>
                    </td>

                    {/* ALLOWED MENUS DISPLAY */}
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1.5 items-center max-w-xs">
                        {NAV_TABS_CONFIG.map(tab => {
                          const isAllowed = userTabs.includes(tab.id);
                          return (
                            <span
                              key={tab.id}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all flex items-center gap-1 ${
                                isAllowed
                                  ? 'bg-slate-100 text-slate-800 border-slate-300'
                                  : 'bg-slate-50 text-slate-300 border-slate-100 line-through'
                              }`}
                            >
                              <span>{tab.icon}</span>
                              <span>{tab.label.split(' ')[0]}</span>
                            </span>
                          );
                        })}
                      </div>
                    </td>

                    <td className="py-4 px-6 text-right">
                      {isAdmin ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenMenuPermissions(u)}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-semibold border border-indigo-200 transition-all flex items-center gap-1.5"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                            <span>Menularni biriktirish</span>
                          </button>

                          {!isSelf && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Userni o'chirish"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No admin rights</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MENU PERMISSIONS ASSIGNMENT MODAL */}
      {editingMenuUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-6 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-indigo-600" />
                  <span>Menularni Foydalanuvchiga Biriktirish</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  <span className="font-bold text-indigo-700">{editingMenuUser.displayName}</span> ({editingMenuUser.email}) uchun ruxsat berilgan menular
                </p>
              </div>

              <button
                onClick={() => setEditingMenuUser(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700 mb-2">Quyidagi menulardan ruxsat beriladiganlarini belgilang:</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {NAV_TABS_CONFIG.map((tab) => {
                  const isChecked = selectedTabs.includes(tab.id);
                  return (
                    <div
                      key={tab.id}
                      onClick={() => handleToggleTabChoice(tab.id)}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                        isChecked
                          ? 'bg-indigo-50/80 border-indigo-300 text-indigo-950 font-bold shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-400 font-medium hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">{tab.icon}</span>
                        <span className="text-xs">{tab.label}</span>
                      </div>

                      <div className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all ${
                        isChecked ? 'bg-indigo-600 text-white' : 'border border-slate-300 bg-white'
                      }`}>
                        {isChecked && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>O'zgarishlar saqlangach, ushbu foydalanuvchining chap menusi darhol yangilanadi.</span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingMenuUser(null)}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleSaveMenuPermissions}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20"
              >
                Saqlash va Biriktirish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

