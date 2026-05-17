import React, { useState } from 'react';
import { 
  Search, 
  Calendar, 
  Filter, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  Activity,
  RotateCcw,
  BarChart2,
  Clock,
  LayoutGrid,
  ExternalLink,
  ChevronDown,
  Trophy,
  Percent,
  Settings,
  ArrowUpRight,
  BookOpen,
  FileText,
  HelpCircle,
  StickyNote,
  Zap,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import Badge from '../components/ui/Badge';
import { ROUTES } from '../constants/routes';
import api from '../lib/api';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../lib/translations';
import { useActivityFeed } from '../hooks/useActivityFeed';

const ActivityPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [typeFilter, setTypeFilter] = useState<'all' | 'TOPIC' | 'QUIZ' | 'NOTE' | 'DOC'>('all');
  const { data: statsData } = useQuery({ queryKey: ['stats'], queryFn: () => api.get('/dashboard/stats') });
  const { language } = useLanguage();
  const t = translations[language].activity;
  const commonT = translations[language].common;

  const { data: activityData, isLoading, error } = useQuery({
    queryKey: ['all-activity-combined'],
    queryFn: async () => {
      try {
        const [feed, quizzes, recent] = await Promise.all([
          api.get('/dashboard/activity-feed?v=3').catch(() => []),
          api.get('/quiz/history?v=3').catch(() => []),
          api.get('/dashboard/recent?v=3').catch(() => [])
        ]);
        
        // Merge and de-duplicate
        const feedArr = Array.isArray(feed) ? feed : [];
        const quizArr = Array.isArray(quizzes) ? quizzes : [];
        const recentArr = Array.isArray(recent) ? recent : [];
        const combined = [...feedArr, ...quizArr, ...recentArr];
        
        // De-duplicate by SK or ID
        const seen = new Set();
        return combined.filter(item => {
          const id = item.SK || item.id;
          if (seen.has(id)) return false;
          seen.add(id);
          return true;
        });
      } catch (err) {
        console.error("Aggregation failed", err);
        return [];
      }
    },
    retry: 3,
    staleTime: 0,
    refetchOnMount: 'always'
  });

  const history = React.useMemo(() => {
    let rawData = [];
    if (Array.isArray(activityData)) {
      rawData = activityData;
    } else if (activityData && typeof activityData === 'object' && Array.isArray((activityData as any).items)) {
      rawData = (activityData as any).items;
    }
    
    return rawData.map((item: any) => {
      try {
        // Safe type derivation for older records
        const sk = item.SK || '';
        let itemType = item.type;
        if (!itemType) {
          if (sk.startsWith('TOPIC#')) itemType = 'TOPIC';
          else if (sk.startsWith('QUIZ#')) itemType = 'QUIZ';
          else if (sk.startsWith('NOTE#')) itemType = 'NOTE';
          else if (sk.startsWith('DOC#')) itemType = 'DOC';
          else itemType = 'TOPIC';
        }

        return {
          ...item,
          type: itemType,
          id: item.SK || item.id || Math.random().toString(),
          title: item.topic || item.filename || (item.text ? item.text.split('—')[0] : 'Untitled Activity'),
          time: item.createdAt || item.completedAt || item.timestamp || Date.now(),
          displayDate: (() => {
            try {
              const d = new Date(item.createdAt || item.completedAt || Date.now());
              if (isNaN(d.getTime())) return 'Previous Activity';
              return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
            } catch (e) { return 'Previous Activity'; }
          })(),
          displayTime: (() => {
            try {
              const d = new Date(item.createdAt || item.completedAt || Date.now());
              if (isNaN(d.getTime())) return '--:--';
              return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
            } catch (e) { return '--:--'; }
          })(),
          status: itemType === 'QUIZ' ? (item.score >= 70 ? 'Completed' : 'Practice Needed') : 'Reviewed'
        };
      } catch (e) {
        console.error("Error processing history item:", item, e);
        return null;
      }
    }).filter(Boolean).sort((a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }, [activityData]);

  const filteredHistory = React.useMemo(() => {
    return history.filter((item: any) => {
      const searchTarget = `${item.topic || ''} ${item.filename || ''} ${item.text || ''}`.toLowerCase();
      const matchesSearch = searchTarget.includes(searchTerm.toLowerCase());
      
      // Super robust type matching
      const currentFilter = typeFilter.toUpperCase();
      const itemType = (item.type || 'TOPIC').toUpperCase();
      const matchesType = typeFilter === 'all' || itemType === currentFilter;
      
      return matchesSearch && matchesType;
    });
  }, [history, searchTerm, typeFilter]);

  // Reset to first page when filtering to avoid "ghost pages"
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter]);

  const stats = React.useMemo(() => {
    if (statsData) {
      return {
        total: (statsData as any).topicsLearned + (statsData as any).quizzesCompleted + (statsData as any).notesSaved,
        topics: (statsData as any).topicsLearned || 0,
        quizzes: (statsData as any).quizzesCompleted || 0,
        notes: (statsData as any).notesSaved || 0,
        docs: (statsData as any).docsAnalyzed || 0,
      };
    }
    return {
      total: history.length,
      topics: history.filter(h => h.type === 'TOPIC').length,
      quizzes: history.filter(h => h.type === 'QUIZ').length,
      notes: history.filter(h => h.type === 'NOTE').length,
      docs: history.filter(h => h.type === 'DOC').length,
    };
  }, [history, statsData]);

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const currentItems = filteredHistory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'TOPIC': return <BookOpen size={20} />;
      case 'QUIZ': return <HelpCircle size={20} />;
      case 'NOTE': return <StickyNote size={20} />;
      case 'DOC': return <FileText size={20} />;
      default: return <Activity size={20} />;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'TOPIC': return 'from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/20';
      case 'QUIZ': return 'from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/20';
      case 'NOTE': return 'from-orange-500/20 to-amber-500/20 text-orange-400 border-orange-500/20';
      case 'DOC': return 'from-cyan-500/20 to-teal-500/20 text-cyan-400 border-cyan-500/20';
      default: return 'from-primary/20 to-primary/10 text-primary border-primary/20';
    }
  };

  const getActivityText = (item: any) => {
    // Priority 1: Use the pre-formatted text from backend if available
    if (item.text) return item.text;

    // Priority 2: Fallback to manual building
    switch (item.type) {
      case 'TOPIC': return language === 'en' ? `Learned about ${item.topic || 'New Topic'}` : `${item.topic || 'नया विषय'} के बारे में सीखा`;
      case 'QUIZ': return language === 'en' ? `Completed quiz on ${item.topic || 'Topic'} — ${item.score}%` : `${item.topic || 'विषय'} पर क्विज़ पूरा किया — ${item.score}%`;
      case 'NOTE': return language === 'en' ? `Saved notes on ${item.topic || 'Topic'}` : `${item.topic || 'विषय'} पर नोट्स सहेजे`;
      case 'DOC': return language === 'en' ? `Analyzed document: ${item.filename || 'File'}` : `दस्तावेज़ का विश्लेषण किया: ${item.filename || 'फ़ाइल'}`;
      default: return item.text || (language === 'en' ? 'General Activity' : 'सामान्य गतिविधि');
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-8 bg-[#0A0F1E] h-full min-h-screen">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="space-y-4">
            <Skeleton className="h-12 w-64 rounded-xl" />
            <Skeleton className="h-6 w-96 rounded-lg" />
          </div>
          <div className="grid grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-3xl" />)}
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full bg-[#0A0F1E] flex flex-col items-center justify-center p-8 min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-500/5 via-transparent to-transparent"></div>
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-24 h-24 bg-red-500/10 rounded-[2.5rem] flex items-center justify-center mb-8 border border-red-500/20 shadow-2xl shadow-red-500/10">
            <Zap size={48} className="text-red-500" />
          </div>
          <h2 className="text-white text-3xl font-black tracking-tight mb-4">Sync Connection Error</h2>
          <p className="text-text-secondary text-base max-w-md mb-2 font-medium leading-relaxed">
            We're having trouble connecting to your learning activity stream.
          </p>
          <p className="text-red-400/60 text-xs mb-10 font-mono bg-red-500/5 px-4 py-2 rounded-lg border border-red-500/10 max-w-lg break-all">
            URL: {import.meta.env.VITE_API_URL}/dashboard/activity-feed<br/>
            Error: {error?.message || 'Unknown Network Error'}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-primary hover:bg-primary-light text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-primary/20 active:scale-95"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="h-full bg-[#0A0F1E] flex items-center justify-center p-8 min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent"></div>
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mb-8 border border-primary/20 shadow-2xl shadow-primary/10 animate-pulse">
            <Sparkles size={48} className="text-primary" />
          </div>
          <h2 className="text-white text-3xl font-black tracking-tight mb-4">{t.emptyTitle}</h2>
          <p className="text-text-secondary text-base max-w-md mb-10 font-medium leading-relaxed">
            {t.emptyDesc}
          </p>
          <button 
            onClick={() => navigate(ROUTES.LEARN)}
            className="bg-primary hover:bg-primary-light text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-primary/20 active:scale-95"
          >
            {t.startLearning}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0F1E] p-8 pb-32 overflow-y-auto custom-scrollbar relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                <TrendingUp size={20} className="text-primary" />
              </div>
              <span className="text-primary font-black text-[10px] uppercase tracking-[0.3em]">{t.analytics}</span>
            </div>
            <h1 className="text-white text-5xl font-black tracking-tight mb-3">{t.title}</h1>
            <p className="text-text-secondary text-sm font-medium tracking-wide">
              {t.subtitle}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                if (filteredHistory.length === 0) return;
                const headers = ['Date', 'Time', 'Type', 'Activity', 'Score/Status'];
                const rows = filteredHistory.map(item => [
                  item.displayDate,
                  item.displayTime,
                  item.type,
                  `"${(getActivityText(item) || '').replace(/"/g, '""')}"`,
                  item.score ? `${item.score}%` : item.status || ''
                ]);
                const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `devsaathi_activity_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-[#111827] border border-border/40 text-white text-[11px] font-black uppercase tracking-widest hover:border-primary transition-all group shadow-xl"
            >
              <Download size={16} className="text-primary group-hover:scale-110 transition-transform" />
              {t.export}
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { label: t.topicsExplored, value: stats.topics, icon: BookOpen, color: 'blue' },
            { label: t.quizzesTaken, value: stats.quizzes, icon: HelpCircle, color: 'purple' },
            { label: t.notesCreated, value: stats.notes, icon: StickyNote, color: 'orange' },
            { label: t.docsAnalyzed, value: stats.docs, icon: FileText, color: 'cyan' },
          ].map((stat, i) => (
            <div key={i} className="bg-[#111827]/40 backdrop-blur-xl border border-border/40 rounded-3xl p-6 shadow-2xl relative overflow-hidden group hover:border-primary/30 transition-all">
              <div className={cn("absolute top-0 right-0 w-20 h-20 bg-current/5 rounded-full blur-2xl -mr-8 -mt-8 transition-colors text-primary", `text-${stat.color}-500`)}></div>
              <p className="text-text-muted text-[10px] font-black uppercase tracking-widest mb-4">{stat.label}</p>
              <div className="flex items-end justify-between">
                <span className="text-white text-4xl font-black tracking-tighter leading-none">{stat.value}</span>
                <div className={cn("p-2.5 rounded-xl bg-current/10 text-current", `text-${stat.color}-500`)}>
                  <stat.icon size={20} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="bg-[#111827]/60 backdrop-blur-2xl border border-border/30 rounded-[2rem] p-6 mb-10 shadow-2xl flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 relative group w-full">
            <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder={t.search} 
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#0A0F1E]/50 border border-border/20 rounded-2xl py-4 pl-14 pr-6 text-white text-base outline-none focus:border-primary/50 transition-all placeholder:text-text-muted font-medium"
            />
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <select 
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="w-full appearance-none bg-[#0A0F1E]/50 border border-border/20 rounded-2xl pl-12 pr-12 py-4 text-white text-sm font-bold hover:border-primary/30 transition-all cursor-pointer outline-none focus:border-primary/50"
              >
                <option value="all">{t.allActivities}</option>
                <option value="TOPIC">{t.topicLearning}</option>
                <option value="QUIZ">{t.quizAssessments}</option>
                <option value="NOTE">{t.studyNotes}</option>
                <option value="DOC">{t.docAnalysis}</option>
              </select>
              <Filter size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-primary pointer-events-none" />
              <ChevronDown size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Activity List */}
        <div className="space-y-5 mb-12">
          {currentItems.length === 0 ? (
            <div className="py-20 text-center bg-[#111827]/40 border border-dashed border-border/40 rounded-[2rem]">
               <Search size={40} className="text-text-muted mx-auto mb-4 opacity-20" />
               <p className="text-text-secondary font-bold">{t.noResults}</p>
            </div>
          ) : (
            currentItems.map((item, idx) => (
              <div 
                key={item.id} 
                className="group bg-[#111827]/40 backdrop-blur-xl border border-border/20 rounded-3xl p-6 hover:bg-white/[0.03] hover:border-primary/30 transition-all duration-500 flex items-center gap-8 animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center border bg-gradient-to-br shadow-2xl shrink-0 transition-transform group-hover:scale-110 duration-500", 
                  getIconColor(item.type)
                )}>
                  {getActivityIcon(item.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border",
                      item.type === 'TOPIC' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                      item.type === 'QUIZ' ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                      item.type === 'NOTE' ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                      "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                    )}>
                      {item.type}
                    </span>
                    <span className="text-text-muted text-[11px] font-bold uppercase tracking-tighter flex items-center gap-1.5">
                      <Clock size={12} />
                      {item.displayTime}
                    </span>
                  </div>
                  <h4 className="text-white text-xl font-bold leading-tight truncate group-hover:text-primary transition-colors">
                    {getActivityText(item)}
                  </h4>
                  <p className="text-text-secondary text-[11px] font-medium mt-1.5 flex items-center gap-2">
                    <Calendar size={12} className="text-text-muted" />
                    {item.displayDate}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  {item.type === 'QUIZ' && (
                    <button 
                      onClick={() => navigate(`/quiz/${item.topicId || item.topic}/results`, { state: { results: item } })}
                      className="px-6 py-3 rounded-xl bg-primary text-white text-[11px] font-black uppercase tracking-widest hover:bg-primary-light transition-all shadow-lg shadow-primary/20"
                    >
                      {t.viewResult}
                    </button>
                  )}
                  {item.type === 'TOPIC' && (
                    <button 
                      onClick={() => {
                        if (item.docId) {
                          navigate(ROUTES.DOCS_SUMMARY.replace(':docId', item.docId));
                        } else if (item.noteId) {
                          navigate(ROUTES.NOTE_EDITOR.replace(':id', item.noteId));
                        } else {
                          navigate(ROUTES.LEARN, { state: { topic: item.topic } });
                        }
                      }}
                      className="px-6 py-3 rounded-xl bg-[#1A2333] border border-border/40 text-blue-400 text-[11px] font-black uppercase tracking-widest hover:border-blue-500/50 hover:bg-blue-500/5 transition-all"
                    >
                      {t.resumeLearning}
                    </button>
                  )}
                  <button 
                    className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#1A2333] border border-border/40 text-text-muted hover:text-white hover:border-white/20 transition-all shadow-lg group-hover:shadow-xl"
                    title="View details"
                  >
                    <ExternalLink size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mt-16 pt-8 border-t border-border/20">
            <p className="text-text-muted text-sm font-medium">
              {language === 'en' ? 'Showing' : 'दिखा रहा है'} <span className="text-white font-black">{(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredHistory.length)}</span> {language === 'en' ? 'of' : 'में से'} <span className="text-white font-black">{filteredHistory.length}</span> {language === 'en' ? 'activities' : 'गतिविधियाँ'}
            </p>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  setCurrentPage(p => Math.max(1, p - 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={currentPage === 1}
                className="w-12 h-12 rounded-2xl bg-[#111827] border border-border/40 text-text-muted hover:text-white hover:border-primary disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-xl flex items-center justify-center"
              >
                <ChevronLeft size={24} />
              </button>
              
              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => {
                      setCurrentPage(i + 1);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={cn(
                      "w-12 h-12 rounded-2xl text-[13px] font-black transition-all shadow-xl",
                      currentPage === i + 1 
                        ? "bg-primary text-white shadow-primary/30" 
                        : "bg-[#111827] border border-border/40 text-text-muted hover:text-white hover:border-primary"
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => {
                  setCurrentPage(p => Math.min(totalPages, p + 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={currentPage === totalPages}
                className="w-12 h-12 rounded-2xl bg-[#111827] border border-border/40 text-text-muted hover:text-white hover:border-primary disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-xl flex items-center justify-center"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityPage;
