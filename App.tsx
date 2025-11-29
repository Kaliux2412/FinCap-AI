
import React, { useEffect, useState } from 'react';
import Dashboard from './components/Dashboard';
import ChatInterface from './components/ChatInterface';
import TransactionForm from './components/TransactionForm';
import ActivityLog from './components/ActivityLog';
import DocumentUpload from './components/DocumentUpload';
import CalendarView from './components/CalendarView';
import LoadingOverlay from './components/LoadingOverlay';
import AuthScreen from './components/AuthScreen';
import { fetchFinancialContext, getCurrentUser, logoutUser, clearUserData } from './services/mockFirebaseService';
import { FinancialContext, Language, User } from './types';
import { getTranslation } from './translations';
import { 
  LayoutDashboard, MessageSquare, PlusCircle, MinusCircle, 
  History, FileText, Moon, Sun, CalendarDays, LogOut
} from 'lucide-react';

type View = 'dashboard' | 'chat' | 'income' | 'expense' | 'activity' | 'import' | 'calendar';
type Theme = 'light' | 'dark';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [financialContext, setFinancialContext] = useState<FinancialContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [lang, setLang] = useState<Language>('en');
  const [theme, setTheme] = useState<Theme>('dark');
  
  const t = (key: any) => getTranslation(lang, key);

  // Theme initialization
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  const initData = async () => {
    try {
      const data = await fetchFinancialContext();
      setFinancialContext(data);
    } catch (e) {
      console.error("Failed to load context", e);
    } finally {
      setLoading(false);
    }
  };

  // Check for session on mount
  useEffect(() => {
    const sessionUser = getCurrentUser();
    if (sessionUser) {
      setUser(sessionUser);
      initData();
    } else {
      setLoading(false);
    }
  }, []);

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    setLoading(true);
    initData();
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
    setFinancialContext(null);
    setActiveView('dashboard');
  };

  const toggleLang = () => setLang(prev => prev === 'en' ? 'es' : 'en');
  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  if (loading) {
    return (
       <LoadingOverlay isVisible={true} message="Loading Financial Context..." />
    );
  }

  // Show Auth Screen if not logged in
  if (!user || !financialContext) {
    return <AuthScreen onAuthSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans overflow-hidden selection:bg-blue-500/30 transition-colors duration-300">
      {/* Sidebar Navigation */}
      <aside className="hidden md:flex w-20 flex-col items-center py-6 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-20">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl mb-8 flex items-center justify-center shadow-lg shadow-blue-900/20 cursor-pointer hover:scale-105 transition-transform" onClick={() => setActiveView('dashboard')}>
          <span className="font-bold text-white text-xl">FC</span>
        </div>

        <nav className="flex flex-col gap-4 w-full px-2">
          <NavButton 
            active={activeView === 'dashboard'} 
            onClick={() => setActiveView('dashboard')} 
            icon={<LayoutDashboard className="w-6 h-6" />} 
            label={t('dashboard')} 
          />
          
          <div className="h-px w-10 bg-slate-200 dark:bg-slate-800 mx-auto my-2"></div>

          <NavButton 
            active={activeView === 'income'} 
            onClick={() => setActiveView('income')} 
            icon={<PlusCircle className="w-6 h-6 text-emerald-500" />} 
            label={t('income')} 
          />
          
          <NavButton 
            active={activeView === 'expense'} 
            onClick={() => setActiveView('expense')} 
            icon={<MinusCircle className="w-6 h-6 text-rose-500" />} 
            label={t('expense')} 
          />

          <div className="h-px w-10 bg-slate-200 dark:bg-slate-800 mx-auto my-2"></div>

          <NavButton 
            active={activeView === 'calendar'} 
            onClick={() => setActiveView('calendar')} 
            icon={<CalendarDays className="w-6 h-6" />} 
            label={t('calendar')} 
          />

          <NavButton 
            active={activeView === 'activity'} 
            onClick={() => setActiveView('activity')} 
            icon={<History className="w-6 h-6" />} 
            label={t('activity')} 
          />

           <NavButton 
            active={activeView === 'import'} 
            onClick={() => setActiveView('import')} 
            icon={<FileText className="w-6 h-6" />} 
            label={t('import')} 
          />

          <NavButton 
            active={activeView === 'chat'} 
            onClick={() => setActiveView('chat')} 
            icon={<MessageSquare className="w-6 h-6" />} 
            label={t('chat')} 
          />
        </nav>

        <div className="mt-auto flex flex-col gap-4 w-full px-2 items-center">
          <button 
            onClick={toggleTheme}
            className="p-3 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 transition-all"
            title={t('theme')}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button 
            onClick={toggleLang}
            className="p-3 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 transition-all flex justify-center font-bold text-xs"
          >
            {lang.toUpperCase()}
          </button>
          <button 
            onClick={handleLogout}
            className="p-3 rounded-xl text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/20 transition-all"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        
        {/* Mobile Header */}
        <div className="md:hidden h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-4 z-20">
           <div className="flex items-center gap-2" onClick={() => setActiveView('dashboard')}>
             <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="font-bold text-white text-sm">FC</span>
             </div>
             <span className="font-semibold text-slate-800 dark:text-slate-100">FinCap</span>
           </div>
           <div className="flex gap-2">
             <button onClick={toggleTheme} className="p-2 rounded-lg text-slate-500 bg-slate-100 dark:bg-slate-800">
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
             </button>
             <button onClick={handleLogout} className="p-2 rounded-lg text-rose-500 bg-slate-100 dark:bg-slate-800">
                <LogOut className="w-4 h-4" />
             </button>
           </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative p-4 md:p-8">
          {/* Views */}
          {activeView === 'dashboard' && (
            <div className="h-full flex flex-col animate-in fade-in duration-300">
              <Header title={t('dashboard')} subtitle={financialContext.companyName}>
                <button
                  onClick={() => {
                    clearUserData();
                    initData();
                  }}
                  className="text-xs bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 px-3 py-1 rounded hover:bg-rose-200 dark:hover:bg-rose-800 transition-colors"
                  title="Clear demo data"
                >
                  Clear Demo Data
                </button>
              </Header>
              <div className="flex-1 overflow-hidden mt-4">
                <Dashboard data={financialContext} lang={lang} isDark={theme === 'dark'} />
              </div>
            </div>
          )}

          {activeView === 'income' && (
            <div className="h-full flex flex-col max-w-4xl mx-auto w-full animate-in slide-in-from-right-4 fade-in duration-300">
              <Header title={t('income')} />
              <div className="mt-8">
                 <TransactionForm 
                   type="income" 
                   lang={lang} 
                   onSuccess={() => {
                     initData();
                     setActiveView('dashboard');
                   }} 
                  />
              </div>
            </div>
          )}

          {activeView === 'expense' && (
            <div className="h-full flex flex-col max-w-4xl mx-auto w-full animate-in slide-in-from-right-4 fade-in duration-300">
              <Header title={t('expense')} />
              <div className="mt-8">
                 <TransactionForm 
                   type="expense" 
                   lang={lang} 
                   onSuccess={() => {
                     initData();
                     setActiveView('dashboard');
                   }} 
                  />
              </div>
            </div>
          )}

          {activeView === 'calendar' && (
             <div className="h-full flex flex-col animate-in fade-in duration-300">
               <Header title={t('calendar')} />
               <div className="flex-1 overflow-hidden mt-4">
                 <CalendarView lang={lang} />
               </div>
             </div>
          )}

          {activeView === 'activity' && (
            <div className="h-full flex flex-col animate-in fade-in duration-300">
              <Header title={t('activity')} />
              <div className="flex-1 overflow-hidden mt-4">
                <ActivityLog lang={lang} />
              </div>
            </div>
          )}
          
          {activeView === 'import' && (
            <div className="h-full flex flex-col animate-in fade-in duration-300">
              <Header title={t('import')} />
              <div className="flex-1 overflow-hidden mt-4">
                <DocumentUpload 
                  lang={lang}
                  onSuccess={() => {
                    initData();
                    setActiveView('dashboard');
                  }}
                />
              </div>
            </div>
          )}

          {activeView === 'chat' && (
            <div className="h-full flex flex-col animate-in zoom-in-95 fade-in duration-300">
              <ChatInterface 
                financialContext={financialContext} 
                lang={lang} 
                onDataUpdate={initData}
              />
            </div>
          )}
        </div>

        {/* Mobile Bottom Nav */}
        <div className="md:hidden h-16 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-around px-2 z-30">
          <MobileNavBtn active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} icon={<LayoutDashboard className="w-5 h-5" />} />
          <MobileNavBtn active={activeView === 'calendar'} onClick={() => setActiveView('calendar')} icon={<CalendarDays className="w-5 h-5" />} />
          <MobileNavBtn active={activeView === 'income'} onClick={() => setActiveView('income')} icon={<PlusCircle className="w-5 h-5" />} />
          <MobileNavBtn active={activeView === 'expense'} onClick={() => setActiveView('expense')} icon={<MinusCircle className="w-5 h-5" />} />
          <MobileNavBtn active={activeView === 'chat'} onClick={() => setActiveView('chat')} icon={<MessageSquare className="w-5 h-5" />} />
        </div>
      </main>
    </div>
  );
};

// Helper Components
const NavButton = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick}
    className={`p-3 rounded-xl transition-all group relative flex items-center justify-center
      ${active ? 'bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/30' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-300'}
    `}
  >
    {icon}
    <span className="absolute left-14 bg-slate-800 text-slate-200 text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-slate-700 z-50 shadow-xl">
      {label}
    </span>
  </button>
);

const MobileNavBtn = ({ active, onClick, icon }: any) => (
  <button 
    onClick={onClick}
    className={`p-2 rounded-lg ${active ? 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}
  >
    {icon}
  </button>
);

const Header = ({ title, subtitle, children }: { title: string, subtitle?: string, children?: React.ReactNode }) => (
  <div className="flex justify-between items-end border-b border-slate-200 dark:border-slate-800/50 pb-4">
    <div>
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{title}</h1>
      {subtitle && <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{subtitle}</p>}
    </div>
    {children && (
      <div className="flex items-center gap-2">
        {children}
      </div>
    )}
  </div>
);

export default App;
