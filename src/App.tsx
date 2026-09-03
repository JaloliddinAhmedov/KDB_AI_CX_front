import React, { useState, useEffect } from 'react';
import { NavTab, KnowledgeItem, BankTransaction, SupportTicket, UserProfile } from './types';
import { 
  INITIAL_KNOWLEDGE_ITEMS, 
  INITIAL_TRANSACTIONS, 
  INITIAL_TICKETS 
} from './data/mockData';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { AITrainingCenter } from './components/AITrainingCenter';
import { AIAssistant } from './components/AIAssistant';
import { DashboardView } from './components/DashboardView';
import { TransactionSearch } from './components/TransactionSearch';
import { SupportView } from './components/SupportView';
import { UsersView } from './components/UsersView';
import { NewTrainingJobModal } from './components/NewTrainingJobModal';
import { UserProfileModal } from './components/UserProfileModal';
import { PermissionDeniedModal } from './components/PermissionDeniedModal';
import { AuthModal } from './components/AuthModal';
import { 
  subscribeKnowledgeItems, 
  subscribeUsers, 
  INITIAL_USERS 
} from './lib/firestoreService';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('training');
  const [searchQuery, setSearchQuery] = useState('');
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>(INITIAL_KNOWLEDGE_ITEMS);
  const [transactions, setTransactions] = useState<BankTransaction[]>(INITIAL_TRANSACTIONS);
  const [tickets, setTickets] = useState<SupportTicket[]>(INITIAL_TICKETS);
  const [users, setUsers] = useState<UserProfile[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<UserProfile>(INITIAL_USERS[0]);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isNewJobModalOpen, setIsNewJobModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Firestore real-time subscriptions
  useEffect(() => {
    const unsubscribeKnowledge = subscribeKnowledgeItems((items) => {
      setKnowledgeItems(items);
    });

    const unsubscribeUsers = subscribeUsers((fetchedUsers) => {
      setUsers(fetchedUsers);
      // Keep active user synchronized if updated in db
      setCurrentUser(prev => {
        const found = fetchedUsers.find(u => u.uid === prev.uid);
        return found || prev;
      });
    });

    return () => {
      unsubscribeKnowledge();
      unsubscribeUsers();
    };
  }, []);

  // Validate active tab access whenever currentUser or activeTab changes
  useEffect(() => {
    const allowed = currentUser.allowedTabs || (
      currentUser.role === 'admin'
        ? ['dashboard', 'assistant', 'training', 'transactions', 'support', 'users']
        : ['dashboard', 'assistant', 'transactions', 'support']
    );

    if (!allowed.includes(activeTab)) {
      if (allowed.length > 0) {
        setActiveTab(allowed[0] as NavTab);
      }
    }
  }, [currentUser, activeTab]);

  const handleAddKnowledgeItem = (newItem: KnowledgeItem) => {
    setKnowledgeItems(prev => [newItem, ...prev]);
  };

  const handleSwitchToAdmin = () => {
    const adminUser = users.find(u => u.role === 'admin') || {
      ...currentUser,
      role: 'admin' as const
    };
    setCurrentUser(adminUser);
  };

  const handleSignOut = () => {
    setIsAuthenticated(false);
    setIsAuthModalOpen(true);
  };

  const handleSuccessLogin = (user: UserProfile) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    setIsAuthModalOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-800 antialiased selection:bg-indigo-100 selection:text-indigo-900 font-sans">
      {/* Left Sidebar (Desktop + Mobile Drawer) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewJobModal={() => setIsNewJobModalOpen(true)}
        currentUser={currentUser}
        onPermissionDenied={() => setIsPermissionModalOpen(true)}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <Header
          activeTab={activeTab}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          currentUser={currentUser}
          onOpenProfileModal={() => setIsProfileModalOpen(true)}
          onSignOut={handleSignOut}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
        />

        <main className="flex-1">
          <div className={activeTab === 'training' ? 'block' : 'hidden'}>
            <AITrainingCenter
              knowledgeItems={knowledgeItems}
              setKnowledgeItems={setKnowledgeItems}
              onOpenNewJobModal={() => setIsNewJobModalOpen(true)}
              searchQuery={searchQuery}
              currentUser={currentUser}
              onPermissionDenied={() => setIsPermissionModalOpen(true)}
            />
          </div>

          <div className={activeTab === 'assistant' ? 'block' : 'hidden'}>
            <AIAssistant 
              knowledgeItems={knowledgeItems} 
              transactions={transactions}
              setTransactions={setTransactions}
            />
          </div>

          <div className={activeTab === 'dashboard' ? 'block' : 'hidden'}>
            <DashboardView />
          </div>

          <div className={activeTab === 'transactions' ? 'block' : 'hidden'}>
            <TransactionSearch
              transactions={transactions}
              setTransactions={setTransactions}
            />
          </div>

          <div className={activeTab === 'support' ? 'block' : 'hidden'}>
            <SupportView
              tickets={tickets}
              setTickets={setTickets}
            />
          </div>

          <div className={activeTab === 'users' ? 'block' : 'hidden'}>
            <UsersView
              users={users}
              currentUser={currentUser}
              setCurrentUser={setCurrentUser}
            />
          </div>
        </main>
      </div>

      {/* Auth Modal (Sign In / Sign Up) */}
      <AuthModal
        isOpen={!isAuthenticated || isAuthModalOpen}
        onClose={() => {
          if (isAuthenticated) setIsAuthModalOpen(false);
        }}
        onSuccessLogin={handleSuccessLogin}
        allUsers={users}
      />

      {/* New Training Job Modal */}
      <NewTrainingJobModal
        isOpen={isNewJobModalOpen}
        onClose={() => setIsNewJobModalOpen(false)}
        onAddKnowledgeItem={handleAddKnowledgeItem}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        allUsers={users}
        onSignOut={handleSignOut}
      />

      {/* Permission Denied Alert Modal */}
      <PermissionDeniedModal
        isOpen={isPermissionModalOpen}
        onClose={() => setIsPermissionModalOpen(false)}
        currentUser={currentUser}
        onSwitchToAdmin={handleSwitchToAdmin}
      />
    </div>
  );
}

