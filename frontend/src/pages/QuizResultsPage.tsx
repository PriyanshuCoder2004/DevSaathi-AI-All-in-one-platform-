import React from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { 
  Zap, 
  Check, 
  X, 
  Sparkles,
  ArrowRight,
  RotateCcw,
  LayoutDashboard
} from 'lucide-react';
import { cn } from '../lib/utils';
import { ROUTES } from '../constants/routes';

const QuizResultsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { topicId } = useParams();
  const results = location.state?.results;

  if (!results) {
    // If no results are found in state, redirect back to learn
    React.useEffect(() => {
      navigate(ROUTES.LEARN);
    }, [navigate]);
    return null;
  }

  const scoreMessage = results.score >= 80 
    ? 'Excellent! 🎉' 
    : results.score >= 60 
      ? 'Good job!' 
      : 'Keep practicing!';

  const circumference = 2 * Math.PI * 60;
  const offset = circumference * (1 - results.score / 100);

  return (
    <div className="h-full flex flex-col bg-[#0A0F1E] overflow-y-auto custom-scrollbar">
      {/* TOPBAR */}
      <header className="px-8 py-4 border-b border-border/40 flex justify-between items-center bg-[#0A0F1E]/80 backdrop-blur-md sticky top-0 z-20">
        <h2 className="text-white text-lg font-bold">Quiz Results</h2>
        
        <div className="flex items-center gap-2 bg-[#1A2333]/50 border border-border/40 rounded-full px-4 py-2">
          <Zap size={14} className="text-primary" />
          <span className="text-text-secondary text-[11px] font-bold tracking-tight">Connected to AI</span>
        </div>
      </header>

      <main className="flex-1 px-8 py-12">
        {/* SCORE CIRCLE */}
        <div className="flex flex-col items-center mb-16 animate-in fade-in zoom-in duration-700">
          <div className="relative w-48 h-48 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90">
              {/* Background Circle */}
              <circle 
                cx="96" cy="96" r="60" 
                fill="none" 
                stroke="#1A2333" 
                strokeWidth="10" 
              />
              {/* Progress Circle */}
              <circle 
                cx="96" cy="96" r="60" 
                fill="none" 
                stroke="url(#gradient)" 
                strokeWidth="10" 
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className="transition-all duration-[1500ms] ease-out"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#4F46E5" />
                  <stop offset="100%" stopColor="#818CF8" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute flex flex-col items-center text-center">
              <span className="text-white text-5xl font-black tracking-tighter">{results.score}%</span>
              <span className="text-text-muted text-[10px] font-bold tracking-[0.2em] mt-1">ACCURACY</span>
            </div>
          </div>
          
          <h1 className="text-white text-3xl font-black mt-8 tracking-tight">{scoreMessage}</h1>
          <p className="text-text-secondary text-base mt-3 max-w-md text-center leading-relaxed font-medium">
            You've shown a solid understanding of <span className="text-white">{results.topic}</span> and 
            related concepts. Just a few areas to refine!
          </p>
        </div>

        {/* BREAKDOWN CARD */}
        <div className="max-w-xl mx-auto">
          <div className="bg-[#1A2333]/30 border border-border/40 rounded-3xl overflow-hidden shadow-2xl">
            <div className="px-8 py-5 border-b border-border/40 flex justify-between items-center">
              <h4 className="text-white font-bold text-sm">Score breakdown</h4>
              <span className="text-text-muted text-xs font-medium">{results.totalQuestions} Questions</span>
            </div>
            
            <div className="p-4 space-y-2">
              {results.answers.map((ans: any, i: number) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-colors group">
                  <div className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all shadow-lg",
                    ans.correct 
                      ? "bg-success/10 text-success shadow-success/10" 
                      : "bg-error/10 text-error shadow-error/10"
                  )}>
                    {ans.correct ? <Check size={18} /> : <X size={18} />}
                  </div>
                  <span className="text-white text-[15px] font-medium flex-1 truncate pr-4">
                    {ans.topic}
                  </span>
                  <button className="text-primary text-sm font-bold opacity-0 group-hover:opacity-100 transition-all hover:underline">
                    Review
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex gap-4 mt-10 justify-center">
            <Link to={`/quiz/${topicId}`} className="flex-1 max-w-[200px]">
              <button className="w-full h-14 rounded-2xl border border-border/40 text-white font-bold hover:bg-white/5 transition-all flex items-center justify-center gap-3 active:scale-95">
                <RotateCcw size={18} /> Retake Quiz
              </button>
            </Link>
            <Link to={ROUTES.LEARN} className="flex-1 max-w-[200px]">
              <button className="w-full h-14 rounded-2xl bg-primary text-white font-bold hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-3 active:scale-95">
                Back to Topic <ArrowRight size={18} />
              </button>
            </Link>
          </div>

          <button className="w-full text-text-muted hover:text-white text-[11px] font-bold tracking-[0.2em] text-center mt-12 transition-colors flex items-center justify-center gap-3 uppercase">
            <div className="w-12 h-px bg-border/40" />
            Save results to dashboard
            <div className="w-12 h-px bg-border/40" />
          </button>

          {/* AI TIP CARD */}
          <div className="mt-12 bg-gradient-to-br from-[#1A2333]/50 to-[#0D1626]/50 border border-border/40 rounded-3xl p-8 text-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-all duration-1000" />
            
            <div className="relative z-10">
              <div className="bg-primary/10 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-primary/10">
                <Sparkles size={24} className="text-primary" />
              </div>
              <p className="text-text-secondary text-[15px] leading-relaxed italic font-medium">
                "Consistent performance detected in <span className="text-white font-bold">{results.topic}</span>. 
                We recommend exploring <span className="text-primary font-bold">'Tail Call Optimization'</span> next for a challenge."
              </p>
            </div>
          </div>
          
          <div className="mt-16 text-center">
            <Link to={ROUTES.DASHBOARD} className="text-text-muted hover:text-white transition-colors flex items-center justify-center gap-2 text-sm font-medium">
              <LayoutDashboard size={14} /> View progress on Dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default QuizResultsPage;
