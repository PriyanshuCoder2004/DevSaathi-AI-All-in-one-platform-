import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, History, Languages } from 'lucide-react';
import Sidebar from './Sidebar';
import { useLanguage } from '../../contexts/LanguageContext';
import { cn } from '../../lib/utils';
import { ROUTES } from '../../constants/routes';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const { language, setLanguage } = useLanguage();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.toLowerCase().trim();
    if (!query) return;

    if (query === 'learn') {
      navigate(ROUTES.LEARN);
    } else if (query === 'dashboard' || query === 'home') {
      navigate(ROUTES.DASHBOARD);
    } else if (query === 'progress') {
      navigate(ROUTES.PROGRESS);
    } else if (query === 'notes') {
      navigate(ROUTES.NOTES);
    } else if (query.includes('setting')) {
      navigate(ROUTES.SETTINGS);
    } else if (query.includes('history') || query.includes('activity')) {
      navigate(ROUTES.ACTIVITY);
    } else if (query.includes('quiz')) {
      navigate(ROUTES.QUIZ_HISTORY);
    } else if (query.includes('doc')) {
      navigate(ROUTES.DOCS);
    } else if (query.includes('code')) {
      navigate(ROUTES.CODE);
    } else {
      navigate(ROUTES.LEARN, { state: { initialTopic: searchQuery } });
    }
    setSearchQuery('');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-bg-primary text-text-primary">
      {/* Sidebar - fixed width */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 ml-[240px] flex flex-col h-screen overflow-hidden relative">
        {/* GLOBAL HEADER */}
        <header className="flex items-center justify-between h-14 border-b border-border/40 px-8 bg-[#0A0F1E]/80 backdrop-blur-md flex-shrink-0 z-20">
          <form onSubmit={handleSearch} className="bg-bg-elevated border border-border/40 rounded-xl px-4 py-1.5 flex items-center gap-2 w-80 group focus-within:border-primary/40 transition-all">
            <button type="submit">
              <Search size={14} className="text-text-muted group-focus-within:text-primary transition-colors" />
            </button>
            <input 
              type="text" 
              placeholder="Search lessons, documentation..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none text-white text-sm outline-none w-full placeholder:text-text-muted"
            />
          </form>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 text-text-muted">
              {/* Language Switcher */}
              <div className="flex items-center bg-bg-elevated border border-border/40 rounded-xl p-1 gap-1">
                <button 
                  onClick={() => setLanguage('en')}
                  className={cn(
                    "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                    language === 'en' ? "bg-primary text-white shadow-lg shadow-primary/20" : "hover:text-white"
                  )}
                >
                  EN
                </button>
                <button 
                  onClick={() => setLanguage('hi')}
                  className={cn(
                    "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                    language === 'hi' ? "bg-primary text-white shadow-lg shadow-primary/20" : "hover:text-white"
                  )}
                >
                  HI
                </button>
              </div>

            </div>
            <div className="h-6 w-px bg-border/40"></div>
            <button 
              onClick={() => navigate(ROUTES.DASHBOARD)}
              className="text-white text-sm font-black tracking-tight hover:text-primary transition-all active:scale-95 cursor-pointer"
            >
              Dashboard Overview
            </button>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto relative custom-scrollbar">
          {/* Subtle background glow effects */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px] pointer-events-none -z-10" />
          
          <div className="min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
