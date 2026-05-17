import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, 
  Brain, 
  Loader2, 
  Lightbulb, 
  ClipboardList, 
  Bookmark, 
  MessageSquare, 
  Hash, 
  Settings, 
  Send,
  Zap
} from 'lucide-react';
import { cn } from '../lib/utils';
import type { TopicExplanation } from '../types';
import { ROUTES } from '../constants/routes';
import Badge from '../components/ui/Badge';
import Skeleton from '../components/ui/Skeleton';
import { addLearnedTopic } from '../services/statsService';

import { useExplainTopic, useFollowUpQuestion } from '../hooks/useAiHooks';
import { useCreateNote } from '../hooks/useNoteDocsHooks';
import { useToast } from '../components/ui/ToastProvider';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../lib/translations';

const LearnPage: React.FC = () => {
  const location = useLocation();
  const state = location.state as { topic?: string, initialTopic?: string };
  const [topic, setTopic] = useState('');
  const { language } = useLanguage();
  const t = translations[language].learn;
  const [explanation, setExplanation] = useState<TopicExplanation | null>(null);
  const [charCount, setCharCount] = useState(0);
  const [followUp, setFollowUp] = useState('');
  
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const explainMutation = useExplainTopic();
  const followUpMutation = useFollowUpQuestion();
  const createNoteMutation = useCreateNote();

  const handleExplain = () => {
    if (!topic.trim() || explainMutation.isPending) return;
    
    explainMutation.mutate({ topic, language }, {
      onSuccess: (data: any) => {
        setExplanation(data);
        addLearnedTopic(data.topic);
        queryClient.invalidateQueries({ queryKey: ['stats'] });
        showToast(`Explained: ${data.topic}`, 'success');
      },
      onError: (error: any) => {
        showToast(error.message || 'Failed to explain topic', 'error');
      }
    });
  };

  // Handle topic passed from Dashboard or search box
  useEffect(() => {
    const passedTopic = state?.topic || state?.initialTopic;
    if (passedTopic && passedTopic !== topic && !explainMutation.isPending) {
      setTopic(passedTopic);
      setCharCount(passedTopic.length);
      setExplanation(null);
      
      explainMutation.mutate({ topic: passedTopic, language }, {
        onSuccess: (data: any) => {
          setExplanation(data);
          addLearnedTopic(data.topic);
          queryClient.invalidateQueries({ queryKey: ['stats'] });
        }
      });
    }
  }, [state?.topic, state?.initialTopic, topic, explainMutation.isPending, language, queryClient]);

  // Re-trigger explanation when language changes
  useEffect(() => {
    if (explanation) {
      explainMutation.mutate({ topic: explanation.topic, language }, {
        onSuccess: (data: any) => setExplanation(data)
      });
    }
  }, [language]);

  const handleSaveNotes = () => {
    if (!explanation) return;
    
    createNoteMutation.mutate({
      title: explanation.topic,
      content: typeof explanation.explanation === 'object' 
        ? Object.values(explanation.explanation).join('\n\n') 
        : explanation.explanation,
      topic: explanation.topic,
      isAI: true
    }, {
      onSuccess: () => {
        showToast('Notes saved successfully', 'success');
      }
    });
  };

  const handleFollowUp = () => {
    if (!followUp.trim() || !explanation || followUpMutation.isPending) return;
    
    followUpMutation.mutate({
      topic: explanation.topic,
      currentExplanation: typeof explanation.explanation === 'object' 
        ? Object.values(explanation.explanation).join('\n\n') 
        : explanation.explanation,
      question: followUp,
      language
    }, {
      onSuccess: (data: any) => {
        setExplanation(prev => {
          if (!prev) return prev;
          
          const currentExpl = typeof prev.explanation === 'object' 
            ? Object.values(prev.explanation).join('\n\n') 
            : prev.explanation;
            
          return {
            ...prev,
            explanation: currentExpl + `\n\n---\n\n**Follow-up Question:** ${followUp}\n\n**Answer:** ${data.answer}`,
            codeExample: data.codeExample || prev.codeExample,
            realLifeExample: data.realLifeExample || prev.realLifeExample
          };
        });
        setFollowUp('');
        showToast('Follow-up answered!', 'success');
      }
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#0A0F1E]">
      {/* TOPBAR AREA */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-border/40 bg-[#0A0F1E]/80 backdrop-blur-md">
        <h1 className="text-white text-xl font-semibold">{t.title}</h1>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 text-text-muted">
            <Link to={ROUTES.SETTINGS} className="hover:text-white transition-colors"><Settings size={18} /></Link>
            <Link to={ROUTES.SETTINGS} className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent border border-white/10 flex items-center justify-center overflow-hidden">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Priyanshu" alt="Avatar" className="w-full h-full object-cover" />
            </Link>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex gap-8 px-8 py-8 overflow-y-auto custom-scrollbar">
        {/* LEFT CONTENT */}
        <div className="flex-1 max-w-4xl">
          {/* Search Bar */}
          <div className="relative">
            <div className={cn(
              "flex items-center bg-[#1A2333]/50 border border-border/50 rounded-2xl h-14 px-4 transition-all focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10",
              explainMutation.isPending && "opacity-70 pointer-events-none"
            )}>
              <Search size={18} className="text-text-muted flex-shrink-0" />
              <input
                className="flex-1 bg-transparent ml-3 text-white placeholder:text-text-muted outline-none text-sm"
                placeholder={t.placeholder}
                value={topic}
                onChange={(e) => {
                  setTopic(e.target.value);
                  setCharCount(e.target.value.length);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleExplain()}
                maxLength={500}
              />
              <span className={cn(
                "text-[10px] font-mono mr-4 transition-colors",
                charCount > 450 ? "text-error" : "text-text-muted"
              )}>
                {charCount}/500
              </span>
              <button 
                onClick={handleExplain}
                disabled={!topic.trim() || explainMutation.isPending}
                className="bg-primary hover:bg-primary-dark disabled:opacity-50 text-white px-6 py-2 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 shadow-lg shadow-primary/20 active:scale-95"
              >
                {explainMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : null}
                {t.startLearning}
              </button>
            </div>
            {charCount >= 500 && <p className="text-error text-[10px] mt-1.5 ml-1">Topic query too long (max 500 characters)</p>}
          </div>

          {/* STATES */}
          {explainMutation.isPending ? (
            <div className="mt-8 space-y-6 bg-[#1A2333]/30 border border-border/30 rounded-2xl p-8">
              <Skeleton className="h-8 w-64 rounded-lg" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-[90%] rounded" />
                <Skeleton className="h-4 w-[95%] rounded" />
              </div>
              <Skeleton className="h-40 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          ) : !explanation ? (
            <div className="mt-20 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-6 animate-pulse">
                <Brain size={40} className="text-primary" />
              </div>
              <h3 className="text-white font-bold text-2xl tracking-tight">
                {language === 'en' ? 'Ask anything technical' : 'कुछ भी तकनीकी पूछें'}
              </h3>
              <p className="text-text-secondary text-base mt-3 max-w-sm leading-relaxed">
                {language === 'en' 
                  ? "Enter any topic above — from Python basics to System Design. Your AI tutor will explain it simply with real-life examples."
                  : "ऊपर कोई भी विषय दर्ज करें — पायथन बेसिक से लेकर सिस्टम डिज़ाइन तक। आपका AI ट्यूटर इसे वास्तविक जीवन के उदाहरणों के साथ सरलता से समझाएगा।"}
              </p>
              <div className="flex flex-wrap gap-2.5 mt-10 justify-center">
                {['Recursion', 'REST APIs', 'React Hooks', 'SQL Joins', 'Docker'].map(t => (
                  <button 
                    key={t} 
                    onClick={() => {
                      setTopic(t);
                      setCharCount(t.length);
                    }}
                    className="bg-[#1A2333]/50 border border-border/50 rounded-full px-5 py-2 text-text-secondary text-sm font-medium hover:border-primary hover:text-white hover:bg-primary/5 transition-all cursor-pointer"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-8 bg-[#1A2333]/30 border border-border/40 rounded-3xl p-8 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-white text-3xl font-bold tracking-tight">{explanation.topic}</h2>
                {explanation.codeLanguage && (
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold px-2 py-0.5 rounded-md">
                    {explanation.codeLanguage}
                  </Badge>
                )}
              </div>
              
              <div className="text-text-secondary text-[15px] leading-relaxed mb-8 space-y-4">
                {(typeof explanation?.explanation === 'object' 
                  ? Object.values(explanation.explanation).join('\n\n') 
                  : (explanation?.explanation || 'No explanation available.'))
                  .split('\n\n')
                  .filter(p => p.trim())
                  .map((paragraph, idx) => (
                    <p key={idx}>{paragraph.trim()}</p>
                  ))
                }
              </div>
              
              {explanation.codeExample && (
                <div className="relative group mb-8">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
                  <div className="relative bg-[#0D1626] border border-border/40 rounded-xl p-6 font-mono text-[13px] leading-relaxed overflow-x-auto custom-scrollbar">
                    <pre className="text-gray-300">
                      <code>{explanation.codeExample}</code>
                    </pre>
                  </div>
                </div>
              )}
              
              <div className="bg-gradient-to-br from-[#2A1B0E] to-[#1A1208] border border-orange-900/20 rounded-2xl p-6 mb-8 flex gap-4">
                <div className="bg-[#D97706] rounded-xl w-10 h-10 flex items-center justify-center flex-shrink-0 shadow-lg shadow-orange-900/20">
                  <Lightbulb size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-[#FBBF24] font-bold text-sm">{t.realLifeExample}</p>
                  <p className="text-orange-100/70 text-sm mt-1.5 leading-relaxed font-medium">
                    {explanation?.realLifeExample || 'No example available.'}
                  </p>
                </div>
              </div>
              
              <div className="mb-8">
                <p className="text-text-muted text-[10px] font-bold uppercase tracking-[0.2em] mb-4">SUBTOPICS COVERED</p>
                <div className="flex flex-wrap gap-2.5">
                  {explanation?.subtopics?.map?.(s => (
                    <button 
                      key={s} 
                      onClick={() => {
                        setTopic(s);
                        setCharCount(s.length);
                      }}
                      className="bg-[#1A2333]/50 border border-border/40 rounded-xl px-4 py-2 text-text-secondary text-sm font-medium hover:border-primary hover:text-white transition-all"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-4 pt-4 border-t border-border/30">
                <Link 
                  to={`/quiz/${encodeURIComponent(explanation.topic)}`} 
                  state={{ explanation }}
                  className="flex-1 sm:flex-none"
                >
                  <button className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-white px-8 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2.5 shadow-lg shadow-primary/20 transition-all active:scale-95">
                    <ClipboardList size={18} /> {t.takeQuiz}
                  </button>
                </Link>
                <button 
                  onClick={handleSaveNotes}
                  className="flex-1 sm:flex-none bg-[#1A2333]/50 border border-border/40 hover:border-primary/50 text-text-secondary hover:text-white px-8 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2.5 transition-all active:scale-95"
                >
                  <Bookmark size={18} /> {t.saveToNotes}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL */}
        <aside className="w-80 flex-shrink-0 flex flex-col gap-6">
          {/* Related Topics Card */}
          <div className="bg-[#1A2333]/30 border border-border/40 rounded-3xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <h4 className="text-white font-bold text-sm">{t.subtopics}</h4>
            </div>
            
            <div className="space-y-1">
              {!explanation ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="py-3 flex gap-3">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 flex-1 rounded" />
                  </div>
                ))
              ) : (
                explanation.subtopics.map((s, i) => (
                  <button 
                    key={i}
                    onClick={() => {
                      setTopic(s);
                      setCharCount(s.length);
                    }}
                    className="w-full flex items-center gap-3 py-3 text-text-secondary hover:text-primary transition-all text-sm group text-left"
                  >
                    <div className="bg-[#1A2333] p-1.5 rounded-lg group-hover:bg-primary/10 transition-colors">
                      <Hash size={14} className="text-text-muted group-hover:text-primary" />
                    </div>
                    <span className="font-medium">{s}</span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Ask Follow-up Card */}
          <div className="bg-[#1A2333]/30 border border-border/40 rounded-3xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare size={16} className="text-primary" />
              <h4 className="text-white font-bold text-sm">{language === 'en' ? 'Ask Follow-up' : 'अनुवर्ती प्रश्न पूछें'}</h4>
            </div>
            <p className="text-text-secondary text-xs leading-relaxed mb-5">
              {language === 'en' 
                ? "Confused about a specific part? Ask me to elaborate."
                : "किसी विशिष्ट भाग के बारे में उलझन में हैं? मुझसे विस्तार से बताने के लिए कहें।"}
            </p>
            
            <div className="relative">
              <textarea 
                value={followUp}
                onChange={(e) => setFollowUp(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleFollowUp();
                  }
                }}
                placeholder={language === 'en' ? "e.g. Can you explain tail recursion again with a visual?" : "जैसे: क्या आप विज़ुअल के साथ टेल रिकर्शन को फिर से समझा सकते हैं?"}
                className="w-full bg-[#0D1626] border border-border/40 rounded-2xl p-4 text-xs text-white placeholder:text-text-muted outline-none focus:border-primary/50 min-h-[120px] resize-none transition-all"
              />
              <button 
                onClick={handleFollowUp}
                disabled={!followUp.trim() || !explanation || followUpMutation.isPending}
                className="absolute bottom-3 right-3 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white p-2 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-90"
              >
                {followUpMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </div>
          </div>

          {/* Decorative/Informative AI Core */}
          <div className="mt-auto relative rounded-3xl overflow-hidden aspect-square border border-border/40 group bg-[#0D1626]">
            {/* Pulsating Neural Core (Background / Fallback) */}
            <div className="absolute inset-0 flex items-center justify-center opacity-40 group-hover:opacity-100 transition-opacity">
              <div className="w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-pulse" />
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-full animate-spin-slow opacity-20" />
                <div className="absolute inset-2 bg-gradient-to-tr from-primary to-transparent rounded-full animate-reverse-spin opacity-40" />
              </div>
            </div>

            {/* The Image (Main Visual) */}
            <img 
              src="/src/assets/ai-robot.png" 
              alt="AI Developer Robot" 
              className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-700"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />

            {/* Neural Network "Lines" using CSS Gradients */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
              <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent to-transparent" />
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F1E] via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 z-10">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={14} className="text-primary" />
                <span className="text-primary font-bold text-[10px] uppercase tracking-wider">{language === 'en' ? 'AI Powered' : 'AI संचालित'}</span>
              </div>
              <p className="text-white font-bold text-sm">
                {language === 'en' ? 'Unlock complex concepts in seconds' : 'सेकंडों में जटिल अवधारणाओं को अनलॉक करें'}
              </p>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default LearnPage;
