import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Bell, 
  History, 
  Moon, 
  Flame, 
  Sparkles, 
  Brain, 
  BookOpen, 
  Code2, 
  FileText, 
  ClipboardList,
  TrendingUp,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../lib/translations';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useStats } from '../hooks/useStats';
import { useActivity } from '../hooks/useActivity';
import { useRecentTopics } from '../hooks/useRecentTopics';
import { useActivityFeed } from '../hooks/useActivityFeed';
import { ROUTES } from '../constants/routes';
import Skeleton from '../components/ui/Skeleton';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';

const QuickActionCard: React.FC<{ icon: any, label: string, color: string }> = ({ icon: Icon, label, color }) => {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    dark: 'bg-gray-800 text-gray-400 border-border/40',
    teal: 'bg-teal-500/10 text-teal-500 border-teal-500/20',
    orange: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  };

  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-4 rounded-2xl border transition-all hover:scale-105 hover:shadow-lg cursor-pointer h-full",
      colorMap[color] || colorMap.dark
    )}>
      <div className={cn("p-2 rounded-xl mb-2 bg-current/10")}>
        <Icon size={20} />
      </div>
      <span className="text-xs font-bold text-center">{label}</span>
    </div>
  );
};

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const { language } = useLanguage();
  const t = translations[language]?.dashboard || translations['en'].dashboard;

  if (!t) {
    return <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center text-white">Loading translations...</div>;
  }

  const { data: stats, isLoading: statsLoading } = useStats();
  const { data: activity, isLoading: activityLoading } = useActivity();
  const { data: recentTopics, isLoading: topicsLoading } = useRecentTopics();
  const { data: activityFeed, isLoading: feedLoading } = useActivityFeed();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.toLowerCase().trim();
    if (!query) return;

    if (query.includes('setting')) {
      navigate(ROUTES.SETTINGS);
    } else if (query.includes('history') || query.includes('quiz')) {
      navigate(ROUTES.QUIZ_HISTORY);
    } else if (query.includes('doc')) {
      navigate(ROUTES.DOCS);
    } else if (query.includes('code')) {
      navigate(ROUTES.CODE);
    } else {
      // Default to learning a new topic
      navigate(ROUTES.LEARN, { state: { initialTopic: searchQuery } });
    }
  };

  const getGreetingTime = () => {
    const hours = new Date().getHours();
    if (hours < 12) return language === 'en' ? 'morning' : 'प्रातः';
    if (hours < 18) return language === 'en' ? 'afternoon' : 'दोपहर';
    return language === 'en' ? 'evening' : 'संध्या';
  };

  const userName = user?.name?.split(' ')[0] || (language === 'en' ? 'Developer' : 'डेवलपर');

  const isNewUser = !!(stats && stats.topicsLearned === 0 && stats.quizzesCompleted === 0);

  return (
    <div className="flex flex-col h-full bg-[#0A0F1E] overflow-hidden">
      {/* CONTENT */}
      <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-8 pb-12">
          
          {/* Greeting + Streak */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white text-3xl font-black tracking-tight leading-tight">
                {t.greeting.replace('{timeOfDay}', getGreetingTime()).replace('{name}', userName)}
              </h2>
              <p className="text-text-muted text-sm mt-1 font-medium tracking-wide">
                {format(new Date(), 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
            {stats && stats.streak > 0 && (
              <div className="bg-[#1E1B16] border border-orange-500/20 flex items-center gap-2.5 px-6 py-3 rounded-2xl shadow-xl shadow-orange-500/5">
                <Flame size={20} className="text-orange-500 animate-pulse" />
                <span className="text-white font-black text-xs tracking-widest uppercase">{stats.streak}-DAY STREAK</span>
              </div>
            )}
          </div>

          {/* STATS GRID */}
          <div className="grid grid-cols-4 gap-6">
            {statsLoading ? (
              [1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)
            ) : (
              <>
                <div className="bg-bg-card border border-border/40 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-primary/30 transition-colors">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -mr-8 -mt-8"></div>
                  <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] mb-4">{t.topicsLearned}</p>
                  <div className="flex items-end gap-3">
                    <span className="text-white text-4xl font-black tracking-tighter leading-none">{stats?.topicsLearned || 0}</span>
                    {stats && stats.topicsLearnedGrowth > 0 && (
                      <span className="text-green-500 text-[10px] font-bold mb-1 flex items-center gap-0.5">
                        <ArrowUpRight size={10} />
                        +{stats.topicsLearnedGrowth} this week
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-bg-card border border-border/40 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-primary/30 transition-colors">
                  <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] mb-4">{t.quizzesCompleted}</p>
                  <div className="flex items-end gap-3">
                    <span className="text-white text-4xl font-black tracking-tighter leading-none">{stats?.quizzesCompleted || 0}</span>
                    {stats && stats.quizzesCompletedGrowth > 0 && (
                      <span className="text-green-500 text-[10px] font-bold mb-1 flex items-center gap-0.5">
                        <ArrowUpRight size={10} />
                        +{stats.quizzesCompletedGrowth} this week
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-bg-card border border-border/40 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-primary/30 transition-colors">
                  <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] mb-4">{t.averageScore}</p>
                  <div className="flex items-end gap-2">
                    <span className="text-white text-4xl font-black tracking-tighter leading-none">
                      {typeof stats?.averageScore === 'number' ? `${stats.averageScore}%` : '0%'}
                    </span>
                    {stats && stats.averageScore > 0 && (
                      <div className="h-8 w-20 ml-auto mb-1 opacity-50">
                        {/* Placeholder sparkline */}
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={[{v:4}, {v:7}, {v:5}, {v:8}]}>
                            <Bar dataKey="v" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-bg-card border border-border/40 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-primary/30 transition-colors">
                  <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] mb-4">{t.notesSaved}</p>
                  <div className="flex flex-col">
                    <span className="text-white text-4xl font-black tracking-tighter leading-none">{stats?.notesSaved || 0}</span>
                    <span className="text-text-muted text-[10px] font-medium mt-1 italic">Saved {stats?.lastNoteSavedTime || 'N/A'}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* EMPTY NEW USER STATE */}
          {isNewUser && (
            <div className="bg-bg-card/50 border border-dashed border-border/40 rounded-[2rem] p-12 text-center shadow-inner relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-primary/20">
                  <Sparkles size={32} className="text-primary"/>
                </div>
                <h3 className="text-white text-xl font-bold tracking-tight">{t.welcome}</h3>
                <p className="text-text-secondary text-sm mt-3 max-w-sm mx-auto font-medium leading-relaxed">
                  {language === 'en' 
                    ? "Start by asking your AI Tutor a topic, taking a quiz, or analyzing code. Your progress will appear here."
                    : "AI ट्यूटर से एक विषय पूछकर, क्विज़ लेकर या कोड का विश्लेषण करके शुरू करें। आपकी प्रगति यहाँ दिखाई देगी।"}
                </p>
                <Link to={ROUTES.LEARN}>
                  <button className="bg-primary hover:bg-primary-light px-8 py-3.5 rounded-xl text-white font-bold mt-8 flex items-center gap-2.5 mx-auto transition-all shadow-xl shadow-primary/20 hover:-translate-y-0.5">
                    <Brain size={18}/> {t.startLearning}
                  </button>
                </Link>
              </div>
            </div>
          )}

          {/* ACTIVITY CHART */}
          <div className="bg-bg-card border border-border/40 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-white text-lg font-bold tracking-tight">{t.learningActivity}</h3>
                <p className="text-text-muted text-xs font-medium uppercase tracking-widest mt-1">{t.last30Days}</p>
              </div>
              <div className="flex gap-2">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
                <span className="text-text-muted text-[10px] font-bold uppercase tracking-wider">{t.hoursStudied}</span>
              </div>
            </div>

            <div className="h-[300px] w-full">
              {activityLoading ? (
                <Skeleton className="h-full w-full rounded-xl" />
              ) : (isNewUser || !activity || !Array.isArray(activity)) ? (
                <div className="h-full w-full relative group">
                  <div className="absolute inset-0 flex items-center justify-center bg-[#0A0F1E]/60 backdrop-blur-[2px] z-10 rounded-xl border border-border/20">
                    <p className="text-text-muted text-sm font-bold uppercase tracking-[0.2em]">No activity yet</p>
                  </div>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={Array(30).fill({ hours: 0 })}>
                      <Bar dataKey="hours" fill="#1e293b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activity} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                    <XAxis 
                      dataKey="day" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                      contentStyle={{ 
                        backgroundColor: '#111827', 
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)'
                      }}
                    />
                    <Bar dataKey="hours" radius={[6, 6, 0, 0]} barSize={40}>
                      {activity?.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={index === 4 ? '#3b82f6' : '#1e3a8a'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* TWO-COLUMN LAYOUT */}
          <div className="grid grid-cols-[1fr,320px] gap-8">
            
            {/* LEFT — Continue Learning */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-white text-xl font-bold tracking-tight leading-none">{t.continueLearning}</h3>
                <Link to={ROUTES.ACTIVITY}>
                  <button className="text-primary text-xs font-bold uppercase tracking-widest hover:text-primary-light transition-colors">{t.viewAll} →</button>
                </Link>
              </div>

              {topicsLoading ? (
                [1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)
              ) : recentTopics?.length === 0 ? (
                <EmptyState 
                  icon={BookOpen} 
                  title="No topics yet" 
                  description="Topics you've explored will appear here"
                  ctaLabel="Explore a topic"
                  ctaRoute={ROUTES.LEARN}
                />
              ) : (
                <div className="space-y-4">
                  {recentTopics?.map((topic: any) => (
                    <div key={topic.id} className="bg-bg-card border border-border/40 rounded-[1.5rem] p-5 flex items-center justify-between group hover:border-primary/30 transition-all hover:shadow-xl shadow-black/20">
                      <div className="flex items-center gap-5">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-inner",
                          (topic.docId || topic.source === 'documentation') ? "bg-teal-500/20 text-teal-500" : 
                          (topic.noteId || topic.source === 'notes') ? "bg-purple-500/20 text-purple-500" : 
                          topic.source === 'code' ? "bg-orange-500/20 text-orange-500" : "bg-blue-500/20 text-blue-500"
                        )}>
                          {(topic.docId || topic.source === 'documentation') ? <FileText size={24} /> : 
                           (topic.noteId || topic.source === 'notes') ? <BookOpen size={24} /> :
                           topic.source === 'code' ? <Code2 size={24} /> : <Brain size={24} />}
                        </div>
                        <div>
                          <h4 className="text-white font-bold text-base group-hover:text-primary transition-colors line-clamp-1">{topic.topic}</h4>
                          <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest mt-1">
                            {topic.source === 'documentation' ? t.uploadedDocs : 
                             topic.source === 'notes' ? t.notesSaved : 
                             topic.source === 'code' ? t.analyzeCode : 'AI Tutor'} • {topic.lastAccessed || 'Just now'}
                          </p>
                          <div className="flex items-center gap-3 mt-3 w-48">
                            <div className="flex-1 bg-bg-card rounded-full h-1.5 border border-border/20">
                              <div 
                                className="bg-primary h-full rounded-full transition-all duration-1000 ease-out" 
                                style={{ width: `${topic.progress || (topic.type === 'TOPIC' ? 100 : 0)}%` }}
                              ></div>
                            </div>
                            <span className="text-white text-[10px] font-black">{topic.progress || (topic.type === 'TOPIC' ? 100 : 0)}%</span>
                          </div>
                        </div>
                      </div>
                      {topic.docId ? (
                        <Link to={ROUTES.DOCS_SUMMARY.replace(':docId', topic.docId)}>
                          <button className="bg-[#111827] hover:bg-primary border border-border/40 hover:border-primary rounded-xl px-6 py-2.5 text-white text-xs font-black uppercase tracking-widest transition-all shadow-lg hover:shadow-primary/20">
                            {t.resume}
                          </button>
                        </Link>
                      ) : topic.noteId ? (
                        <Link to={ROUTES.NOTE_EDITOR.replace(':id', topic.noteId)}>
                          <button className="bg-[#111827] hover:bg-primary border border-border/40 hover:border-primary rounded-xl px-6 py-2.5 text-white text-xs font-black uppercase tracking-widest transition-all shadow-lg hover:shadow-primary/20">
                            {t.resume}
                          </button>
                        </Link>
                      ) : (
                        <Link to={ROUTES.LEARN} state={{ topic: topic.topic }}>
                          <button className="bg-[#111827] hover:bg-primary border border-border/40 hover:border-primary rounded-xl px-6 py-2.5 text-white text-xs font-black uppercase tracking-widest transition-all shadow-lg hover:shadow-primary/20">
                            {t.resume}
                          </button>
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT — Quick Actions + Recent Activity */}
            <div className="space-y-8">
              {/* Quick Actions */}
              <section>
                <h3 className="text-white text-xl font-bold tracking-tight mb-6">{t.quickActions}</h3>
                <div className="grid grid-cols-2 gap-4 h-64">
                  <Link to={ROUTES.LEARN}><QuickActionCard icon={Brain} label={t.askAiTutor} color="blue"/></Link>
                  <Link to={ROUTES.CODE}><QuickActionCard icon={Code2} label={t.analyzeCode} color="dark"/></Link>
                  <Link to={ROUTES.DOCS}><QuickActionCard icon={FileText} label={t.uploadDocs} color="teal"/></Link>
                  <Link to={ROUTES.LEARN}><QuickActionCard icon={ClipboardList} label={t.takeQuiz} color="orange"/></Link>
                </div>
              </section>

              {/* Recent Activity */}
              <section>
                <h3 className="text-white text-xl font-bold tracking-tight mb-6">{t.recentActivity}</h3>
                {feedLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
                  </div>
                ) : activityFeed?.length === 0 ? (
                  <p className="text-text-muted text-sm italic font-medium">{t.noActivity}</p>
                ) : (
                  <div className="space-y-5 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[1px] before:bg-border/20">
                    {activityFeed?.map((item: any) => (
                      <div key={item.id} className="relative pl-7 group">
                        <div className={cn("absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-[#0A0F1E] shadow-sm z-10 group-hover:scale-125 transition-transform", item.color)}></div>
                        <p className="text-white text-xs font-bold leading-tight group-hover:text-primary transition-colors">{item.text}</p>
                        {item.meta && <p className="text-text-secondary text-[10px] font-medium mt-0.5">{item.meta}</p>}
                        <p className="text-text-muted text-[10px] font-bold uppercase tracking-tighter mt-1">{item.time}</p>
                      </div>
                    ))}
                    <Link to={ROUTES.ACTIVITY}>
                      <button className="w-full mt-2 py-2.5 rounded-xl border border-border/40 text-text-secondary text-[10px] font-black uppercase tracking-widest hover:text-white hover:border-white/20 transition-all">
                        {t.viewAll} Activity →
                      </button>
                    </Link>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      </main>

    </div>
  );
};

export default DashboardPage;
