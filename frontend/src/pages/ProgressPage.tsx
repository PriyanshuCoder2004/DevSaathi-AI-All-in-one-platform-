import React, { useState } from 'react';
import { 
  BarChart2, 
  TrendingUp, 
  Target, 
  AlertCircle, 
  Brain, 
  ChevronRight, 
  ArrowUpRight, 
  ArrowDownRight,
  Sparkles,
  Zap,
  BarChart3,
  Calendar,
  Filter,
  Activity
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { cn } from '../lib/utils';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { ROUTES } from '../constants/routes';
import { useProgress } from '../hooks/useProgress';


const ProgressPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'7d'|'30d'|'all'>('7d');
  
  const { data: progress, isLoading, isError } = useProgress(timeRange);

  if (isLoading) {
    return (
      <div className="p-8 space-y-8 bg-[#0A0F1E] h-full min-h-screen">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !progress) {
    return (
      <div className="h-full bg-[#0A0F1E] flex items-center justify-center p-8 min-h-screen">
        <EmptyState
          icon={AlertCircle}
          title="Error loading progress"
          description="We couldn't load your learning data. Please try again later."
          ctaLabel="Back to Dashboard"
          ctaRoute={ROUTES.DASHBOARD}
        />
      </div>
    );
  }

  const hasHistory = progress.topicBreakdown && progress.topicBreakdown.length > 0;

  if (!hasHistory) {
    return (
      <div className="h-full bg-[#0A0F1E] flex items-center justify-center p-8 min-h-screen">
        <EmptyState
          icon={BarChart2}
          title="No progress data yet"
          description="Complete your first quiz to start tracking your learning progress"
          ctaLabel="Take a Quiz"
          ctaRoute={ROUTES.LEARN}
        />
      </div>
    );
  }

  const sortedTopicsDesc = [...progress.topicBreakdown].sort((a: any, b: any) => b.latestScore - a.latestScore);
  const keyStrengths = sortedTopicsDesc.slice(0, 3).map((t: any) => ({ label: t.topic, score: t.latestScore }));
  
  const sortedTopicsAsc = [...progress.topicBreakdown].sort((a: any, b: any) => a.latestScore - b.latestScore);
  const needsFocus = sortedTopicsAsc.slice(0, 3).map((t: any) => ({ label: t.topic, score: t.latestScore }));

  return (
    <div className="min-h-screen bg-[#0A0F1E] p-8 pb-20 overflow-y-auto custom-scrollbar">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <h1 className="text-white text-4xl font-black tracking-tight leading-none mb-3">Your Progress</h1>
            <p className="text-text-secondary text-sm font-medium tracking-wide">Analyze your technical growth and learning trajectory.</p>
          </div>
          <div className="flex bg-[#111827] border border-border/40 rounded-xl p-1 shadow-inner">
            {(['7d', '30d', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                  timeRange === range ? "bg-primary text-white shadow-lg" : "text-text-muted hover:text-white"
                )}
              >
                {range === '7d' ? 'Last 7 days' : range === '30d' ? '30 days' : 'All time'}
              </button>
            ))}
          </div>
        </div>

        {/* Top Stat Cards */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-bg-card border border-border/40 rounded-[1.5rem] p-6 relative overflow-hidden group hover:border-primary/30 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -mr-8 -mt-8"></div>
            <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] mb-4">Topics Mastered</p>
            <div className="flex items-end gap-3 mb-4">
              <span className="text-white text-5xl font-black tracking-tighter leading-none">{progress.stats.topicsMastered}</span>
              <span className="text-text-secondary text-base font-bold mb-1">/ {progress.stats.totalTopics} total</span>
            </div>
            <div className="w-full bg-[#1e293b] rounded-full h-1.5 border border-border/20">
              <div 
                className="bg-primary h-full rounded-full shadow-[0_0_12px_rgba(59,130,246,0.3)]" 
                style={{ width: `${(progress.stats.topicsMastered / progress.stats.totalTopics) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-bg-card border border-border/40 rounded-[1.5rem] p-6 relative overflow-hidden group hover:border-primary/30 transition-all">
            <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] mb-4">Improvement This Month</p>
            <div className="flex items-end gap-3 mb-2">
              <span className="text-primary text-5xl font-black tracking-tighter leading-none">+{progress.stats.improvement}%</span>
              <div className="p-1 bg-primary/10 rounded-lg mb-1">
                <TrendingUp size={20} className="text-primary" />
              </div>
            </div>
            <p className="text-text-muted text-[10px] font-bold uppercase tracking-wider mt-2">Vs. previous month average</p>
          </div>

          <div className="bg-bg-card border border-border/40 rounded-[1.5rem] p-6 relative overflow-hidden group hover:border-error/30 transition-all">
            <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] mb-4">Weakest Area</p>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-error/10 rounded-2xl border border-error/20">
                <AlertCircle size={24} className="text-error" />
              </div>
              <div>
                <h4 className="text-white font-bold text-lg leading-tight">{progress.stats.weakestArea}</h4>
                <p className="text-error text-xs font-black uppercase tracking-widest mt-1">Average score: {progress.stats.weakestAreaScore}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Skill Performance Over Time */}
        <div className="bg-bg-card border border-border/40 rounded-[2rem] p-8 shadow-2xl mb-8">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-white text-xl font-bold tracking-tight">Skill Performance Over Time</h3>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-text-muted text-[10px] font-bold uppercase tracking-wider">Average Score</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-[1px] bg-orange-500 border-t border-dashed border-orange-500"></div>
                <span className="text-text-muted text-[10px] font-bold uppercase tracking-wider">Target 80%</span>
              </div>
            </div>
          </div>

          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={progress.performanceData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                  domain={[0, 100]}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#111827', 
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)'
                  }}
                  itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                  labelStyle={{ color: '#64748b', fontSize: '10px', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 900 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="target" 
                  stroke="#f97316" 
                  strokeDasharray="5 5" 
                  dot={false}
                  strokeWidth={1}
                />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#3b82f6" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorScore)" 
                  dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#0A0F1E' }}
                  activeDot={{ r: 6, strokeWidth: 0, shadow: '0 0 10px rgba(59,130,246,0.5)' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Topic Breakdown Section */}
        <div className="grid grid-cols-[1fr,320px] gap-8 mb-8">
          <div className="bg-bg-card border border-border/40 rounded-[2rem] p-8 shadow-2xl">
            <h3 className="text-white text-xl font-bold tracking-tight mb-8">Topic Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-border/20">
                    <th className="pb-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Topic</th>
                    <th className="pb-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] text-center">Times Practiced</th>
                    <th className="pb-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] text-center">Best Score</th>
                    <th className="pb-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] text-center">Latest</th>
                    <th className="pb-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] text-center">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/10">
                  {progress.topicBreakdown.map((item: any) => (
                    <tr key={item.topic} className="group hover:bg-white/5 transition-colors">
                      <td className="py-5 font-bold text-sm text-white">{item.topic}</td>
                      <td className="py-5 text-center text-sm text-text-secondary font-medium">{item.timesPracticed}</td>
                      <td className="py-5 text-center text-sm font-black text-primary">{item.bestScore}%</td>
                      <td className="py-5 text-center text-sm font-bold text-white">{item.latestScore}%</td>
                      <td className="py-5 text-center">
                        <div className="flex justify-center">
                          {item.trend === 'up' ? <TrendingUp size={16} className="text-green-500" /> : 
                           item.trend === 'down' ? <ArrowDownRight size={16} className="text-error" /> : 
                           <ChevronRight size={16} className="text-text-muted rotate-90" />}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-[#111827]/50 border border-primary/20 rounded-[1.5rem] p-6 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
              <div className="flex items-center gap-3 mb-6">
                <Target size={18} className="text-primary" />
                <h4 className="text-white text-sm font-black uppercase tracking-widest">Key Strengths</h4>
              </div>
              <div className="space-y-3">
                {keyStrengths.map(s => (
                  <div key={s.label} className="bg-bg-card border border-border/40 rounded-xl p-3 flex justify-between items-center hover:border-primary/30 transition-colors">
                    <span className="text-text-secondary text-xs font-bold">{s.label}</span>
                    <span className="text-primary text-xs font-black">{s.score}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#1C1616]/50 border border-error/20 rounded-[1.5rem] p-6 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-error/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
              <div className="flex items-center gap-3 mb-6">
                <AlertCircle size={18} className="text-error" />
                <h4 className="text-white text-sm font-black uppercase tracking-widest">Needs Focus</h4>
              </div>
              <div className="space-y-3">
                {needsFocus.map(s => (
                  <div key={s.label} className="bg-bg-card border border-error/10 rounded-xl p-3 flex justify-between items-center hover:border-error/30 transition-colors">
                    <span className="text-text-secondary text-xs font-bold">{s.label}</span>
                    <span className="text-error text-xs font-black">{s.score}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Learning Recommendations */}
        <div className="mt-12">
          <div className="flex items-center gap-3 mb-8">
            <Brain size={24} className="text-primary" />
            <h3 className="text-white text-xl font-bold tracking-tight">Learning Recommendations</h3>
          </div>
          <div className="grid grid-cols-3 gap-6">
            {progress.recommendations?.map((rec: any) => (
              <div key={rec.id} className="bg-bg-card border border-border/40 rounded-3xl p-8 flex flex-col h-full shadow-2xl hover:border-primary/30 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Sparkles size={60} className="text-primary" />
                </div>
                <div className="flex items-center justify-between mb-6">
                  <span className={cn(
                    "text-[8px] font-black uppercase tracking-[0.3em] px-2.5 py-1 rounded-md border",
                    rec.type === 'CRITICAL' ? "bg-error/10 text-error border-error/20" : 
                    rec.type === 'REINFORCEMENT' ? "bg-orange-500/10 text-orange-500 border-orange-500/20" : 
                    "bg-blue-500/10 text-blue-500 border-blue-500/20"
                  )}>
                    {rec.type}
                  </span>
                  <span className="text-text-muted text-[10px] font-bold uppercase tracking-widest">Topic ID: {rec.topicId}</span>
                </div>
                <h4 className="text-white text-xl font-bold mb-4 leading-tight group-hover:text-primary transition-colors">{rec.title}</h4>
                <p className="text-text-secondary text-sm leading-relaxed font-medium mb-10">{rec.description}</p>
                <div className="mt-auto">
                  <button onClick={() => window.location.href = ROUTES.LEARN} className="flex items-center gap-2 text-white text-[10px] font-black uppercase tracking-[0.2em] group-hover:gap-4 transition-all">
                    Start Now <ChevronRight size={14} className="text-primary" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressPage;
