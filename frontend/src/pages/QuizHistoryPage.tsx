import React, { useState } from 'react';
import { 
  Search, 
  Calendar, 
  Filter, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  ClipboardList,
  RotateCcw,
  BarChart2,
  Clock,
  LayoutGrid,
  ExternalLink,
  ChevronDown,
  Trophy,
  Activity,
  Percent,
  Settings,
  ArrowUpRight
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import Badge from '../components/ui/Badge';
import { ROUTES } from '../constants/routes';
import { getStats } from '../services/statsService';

import { useQuizHistory } from '../hooks/useQuizHistory';

const QuizHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [dateRange, setDateRange] = useState<'all' | '30' | '7'>('all');
  const [scoreFilter, setScoreFilter] = useState<'all' | 'high' | 'mid' | 'low'>('all');

  const { data: historyData, isLoading } = useQuizHistory();
  
  const history = React.useMemo(() => {
    const rawData = Array.isArray(historyData) ? historyData : (historyData as any)?.history || [];
    return rawData.map((item: any) => ({
      ...item,
      // Map backend fields to frontend expected fields if they differ
      date: item.completedAt ? new Date(item.completedAt).toLocaleDateString() : (item.date || 'Unknown'),
      questions: item.totalQuestions || item.questions || 0,
      timeTaken: item.timeTaken || '00m 00s'
    }));
  }, [historyData]);

  const summary = React.useMemo(() => {
    if (!history.length) return { highestScore: 0, bestTopic: 'None', totalHours: '0.0', averageScore: 0 };
    
    const highestScore = Math.max(...history.map((q: any) => q.score));
    const bestTopic = history.find((q: any) => q.score === highestScore)?.topic || 'None';
    const totalMinutes = history.reduce((acc: number, q: any) => {
      const mins = parseInt(q.timeTaken.split('m')[0]) || 0;
      return acc + mins;
    }, 0);
    const totalHours = (totalMinutes / 60).toFixed(1);
    const averageScore = Math.round(history.reduce((acc: number, q: any) => acc + q.score, 0) / history.length);

    return { highestScore, bestTopic, totalHours, averageScore };
  }, [history]);

  const filteredHistory = history.filter((item: any) => {
    // 1. Search Filter
    const matchesSearch = item.topic.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 2. Score Filter
    let matchesScore = true;
    if (scoreFilter === 'high') matchesScore = item.score >= 85;
    else if (scoreFilter === 'mid') matchesScore = item.score >= 60 && item.score < 85;
    else if (scoreFilter === 'low') matchesScore = item.score < 60;

    // 3. Date Filter (Simplified)
    let matchesDate = true;
    
    return matchesSearch && matchesScore && matchesDate;
  });

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const currentItems = filteredHistory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getIconColor = (icon: string) => {
    switch (icon) {
      case 'js': return 'bg-yellow-500/20 text-yellow-500';
      case 'db': return 'bg-orange-500/20 text-orange-500';
      case 'cloud': return 'bg-blue-500/20 text-blue-500';
      case 'arch': return 'bg-cyan-500/20 text-cyan-500';
      case 'style': return 'bg-purple-500/20 text-purple-500';
      default: return 'bg-primary/20 text-primary';
    }
  };

  const exportCSV = () => {
    if (!filteredHistory.length) return;
    const headers = ['Topic,Date,Questions,Score,Time\n'];
    const rows = filteredHistory.map(q => `${q.topic},${q.date},${q.questions},${q.score}%,${q.timeTaken}\n`);
    const blob = new Blob([...headers, ...rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `quiz_history_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-8 bg-[#0A0F1E] h-full min-h-screen">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="h-full bg-[#0A0F1E] flex items-center justify-center p-8 min-h-screen">
        <EmptyState
          icon={ClipboardList}
          title="No quizzes completed yet"
          description="Take your first quiz to see your history and performance here"
          ctaLabel="Take a Quiz"
          ctaRoute={ROUTES.LEARN}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0F1E] p-8 pb-24 overflow-y-auto custom-scrollbar">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-white text-4xl font-black tracking-tight mb-2">Quiz History</h1>
          <p className="text-text-secondary text-sm font-medium tracking-wide">
            <span className="text-primary font-black">{filteredHistory.length} quizzes found</span> • Review your technical performance
          </p>
        </div>

        {/* Filters and Actions */}
        <div className="bg-[#111827]/80 backdrop-blur-md border border-border/40 rounded-2xl p-4 flex flex-wrap items-center gap-4 mb-10 shadow-2xl">
          <div className="flex-1 min-w-[300px] relative group">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Search by topic..." 
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#0A0F1E] border border-border/40 rounded-xl py-2.5 pl-11 pr-4 text-white text-sm outline-none focus:border-primary/50 transition-all placeholder:text-text-muted"
            />
          </div>

          <div className="relative">
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="appearance-none bg-[#0A0F1E] border border-border/40 rounded-xl pl-10 pr-10 py-2.5 text-text-secondary text-sm font-bold hover:text-white hover:border-white/20 transition-all cursor-pointer outline-none focus:border-primary/50"
            >
              <option value="all">All Time</option>
              <option value="30">Last 30 Days</option>
              <option value="7">Last 7 Days</option>
            </select>
            <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          </div>

          <div className="relative">
            <select 
              value={scoreFilter}
              onChange={(e) => setScoreFilter(e.target.value as any)}
              className="appearance-none bg-[#0A0F1E] border border-border/40 rounded-xl pl-10 pr-10 py-2.5 text-text-secondary text-sm font-bold hover:text-white hover:border-white/20 transition-all cursor-pointer outline-none focus:border-primary/50"
            >
              <option value="all">Score: All</option>
              <option value="high">High (85%+)</option>
              <option value="mid">Mid (60-85%)</option>
              <option value="low">Low (&lt;60%)</option>
            </select>
            <Filter size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          </div>

          <div className="h-8 w-px bg-border/20 hidden md:block"></div>

          <button 
            onClick={exportCSV}
            className="bg-primary hover:bg-primary-light rounded-xl px-6 py-2.5 text-white text-sm font-black uppercase tracking-[0.1em] flex items-center gap-2.5 transition-all shadow-lg shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>

        {/* Quiz History Table */}
        <div className="bg-bg-card border border-border/40 rounded-[2rem] overflow-hidden shadow-2xl relative mb-8">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-border/20">
                  <th className="py-6 px-8 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Topic</th>
                  <th className="py-6 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Date</th>
                  <th className="py-6 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] text-center">Questions</th>
                  <th className="py-6 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] text-center">Score</th>
                  <th className="py-6 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Time Taken</th>
                  <th className="py-6 px-8 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
                {currentItems.map((quiz) => (
                  <tr key={quiz.id} className="group hover:bg-white/5 transition-colors">
                    <td className="py-6 px-8">
                      <div className="flex items-center gap-5">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-inner bg-primary/20 text-primary")}>
                          <LayoutGrid size={18} />
                        </div>
                        <div>
                          <p className="text-white text-sm font-black leading-tight group-hover:text-primary transition-colors">{quiz.topic}</p>
                          <p className="text-text-muted text-[10px] font-bold mt-1 uppercase tracking-wider">Quiz Attempt</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-6 text-sm font-bold text-text-secondary">{quiz.date}</td>
                    <td className="py-6 text-center text-sm font-bold text-white">{quiz.questions}</td>
                    <td className="py-6 text-center">
                      <Badge variant={getScoreColor(quiz.score)} className="text-xs font-black min-w-[60px] py-1">
                        {quiz.score}%
                      </Badge>
                    </td>
                    <td className="py-6 text-sm font-bold text-text-secondary">{quiz.timeTaken}</td>
                    <td className="py-6 px-8 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button 
                          onClick={() => navigate(`/quiz/${quiz.id}/results`)}
                          className="text-text-secondary hover:text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors"
                        >
                          View breakdown <ExternalLink size={14} className="text-primary" />
                        </button>
                        <button 
                          onClick={() => navigate(`/quiz/${quiz.id}`)}
                          className="p-2.5 bg-bg-elevated/40 border border-border/40 rounded-xl text-text-secondary hover:text-primary hover:border-primary/30 transition-all shadow-sm"
                          title="Retake Quiz"
                        >
                          <RotateCcw size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-text-muted text-xs font-medium">
            Showing <span className="text-white font-bold">{(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredHistory.length)}</span> of <span className="text-white font-bold">{filteredHistory.length}</span> quizzes
          </p>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl bg-bg-card border border-border/40 text-text-muted hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={cn(
                  "w-10 h-10 rounded-xl text-xs font-black transition-all",
                  currentPage === i + 1 
                    ? "bg-primary text-white shadow-lg shadow-primary/20" 
                    : "bg-bg-card border border-border/40 text-text-muted hover:text-white hover:border-white/20"
                )}
              >
                {i + 1}
              </button>
            ))}

            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl bg-bg-card border border-border/40 text-text-muted hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Summary stats row at bottom */}
        <div className="grid grid-cols-3 gap-6 mt-16">
          <div className="bg-bg-card/40 border border-border/40 rounded-[2rem] p-8 flex items-center gap-6 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
              <Trophy size={100} className="text-primary" />
            </div>
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shadow-inner">
              <Trophy size={28} className="text-primary" />
            </div>
            <div>
              <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] mb-1">Highest Score</p>
              <h4 className="text-white text-3xl font-black tracking-tighter leading-none mb-1">{summary.highestScore}%</h4>
              <p className="text-success text-[10px] font-bold">{summary.bestTopic}</p>
            </div>
          </div>

          <div className="bg-bg-card/40 border border-border/40 rounded-[2rem] p-8 flex items-center gap-6 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
              <Clock size={100} className="text-primary" />
            </div>
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shadow-inner">
              <Clock size={28} className="text-primary" />
            </div>
            <div>
              <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] mb-1">Total Time Spent</p>
              <h4 className="text-white text-3xl font-black tracking-tighter leading-none mb-1">{summary.totalHours}h</h4>
              <p className="text-text-secondary text-[10px] font-bold">Focused learning hours</p>
            </div>
          </div>

          <div className="bg-bg-card/40 border border-border/40 rounded-[2rem] p-8 flex items-center gap-6 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
              <Activity size={100} className="text-primary opacity-10" />
            </div>
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shadow-inner">
              <Percent size={28} className="text-primary" />
            </div>
            <div>
              <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] mb-1">Success Rate</p>
              <h4 className="text-white text-3xl font-black tracking-tighter leading-none mb-1">{summary.averageScore}%</h4>
              <p className="text-success text-[10px] font-bold flex items-center gap-1">
                <ArrowUpRight size={10} /> Active progress
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizHistoryPage;
