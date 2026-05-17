import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { 
  Clock, 
  CheckCircle, 
  ChevronLeft, 
  ChevronRight,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import type { QuizQuestion, TopicExplanation } from '../types';
import Button from '../components/ui/Button';
import { addQuizResult } from '../services/statsService';
import { useGenerateQuiz, useSaveQuiz } from '../hooks/useAiHooks';

// Mock function to generate quiz questions

const QuizPage: React.FC = () => {
  const { topicId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const passedExplanation = location.state?.explanation as TopicExplanation | undefined;

  const { mutateAsync: generateQuizApi } = useGenerateQuiz();
  const { mutate: saveQuiz } = useSaveQuiz();

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initQuiz = async () => {
      try {
        const data = await generateQuizApi({ 
          topic: topicId || 'Topic', 
          explanation: passedExplanation?.explanation || '' 
        });
        const generatedQuestions = data.questions || [];
        setQuestions(generatedQuestions);
        setTimeLeft(generatedQuestions.length * 60); // 1 minute per question
        setIsLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to generate quiz. Please try again.');
        setIsLoading(false);
      }
    };
    initQuiz();
  }, [topicId, passedExplanation, generateQuizApi]);

  useEffect(() => {
    if (isLoading || questions.length === 0 || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isLoading, questions, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = () => {
    const score = Math.round((Object.entries(answers).filter(([qIdx, selectedIdx]) => {
      const q = questions[Number(qIdx)];
      if (!q) return false;
      // Handle multiple possible formats from AI
      const correctIdx = q.correctIndex !== undefined ? q.correctIndex : 
                        q.correctAnswer !== undefined ? q.correctAnswer : 
                        q.answerIndex !== undefined ? q.answerIndex : 
                        q.answer;
      
      // Compare as numbers or strings
      return Number(correctIdx) === Number(selectedIdx) || String(correctIdx) === String(selectedIdx);
    }).length / (questions.length || 1)) * 100);

    const results = {
      topic: topicId,
      score,
      totalQuestions: questions.length,
      answers: questions.map((q, idx) => {
        const correctIdx = q.correctIndex !== undefined ? q.correctIndex : 
                          q.correctAnswer !== undefined ? q.correctAnswer : 
                          q.answerIndex !== undefined ? q.answerIndex : 
                          q.answer;
        const isCorrect = Number(answers[idx]) === Number(correctIdx) || String(answers[idx]) === String(correctIdx);
        
        return {
          questionId: q.id || `q-${idx}`,
          selectedIndex: answers[idx],
          correct: isCorrect,
          topic: q.question.substring(0, 30) + '...'
        };
      }),
      timeTaken: (questions.length * 60) - timeLeft
    };

    // Format time taken for history (e.g. 05m 22s)
    const minutes = Math.floor(results.timeTaken / 60);
    const seconds = results.timeTaken % 60;
    const formattedTime = `${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;

    // Save the result to our backend
    saveQuiz({
      topic: topicId,
      score,
      totalQuestions: questions.length,
      timeTaken: formattedTime,
      answers: results.answers
    });

    navigate(`/quiz/${topicId}/results`, { state: { results } });
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#0A0F1E] text-center">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <Loader2 className="absolute inset-0 m-auto text-primary animate-pulse" size={32} />
        </div>
        <h2 className="text-white text-2xl font-bold mt-8">Generating Quiz</h2>
        <p className="text-text-secondary mt-2">Crafting challenging questions based on your learning...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#0A0F1E] text-center p-8">
        <AlertCircle size={48} className="text-error mb-4" />
        <h2 className="text-white text-2xl font-bold">{error}</h2>
        <Button onClick={() => window.location.reload()} className="mt-6">Retry Generation</Button>
      </div>
    );
  }

  const currentQuestion = questions[currentQ];
  const progress = ((currentQ + 1) / questions.length) * 100;

  return (
    <div className="h-full flex flex-col bg-[#0A0F1E]">
      {/* TOPBAR */}
      <header className="px-8 py-6 border-b border-border/40">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-white text-2xl font-bold">Quiz: {decodeURIComponent(topicId || '')}</h2>
            <p className="text-text-secondary text-sm mt-1">Question {currentQ + 1} of {questions.length}</p>
          </div>
          
          <div className={cn(
            "flex items-center gap-3 bg-[#1A2333]/50 border border-border/40 rounded-full px-5 py-2.5 transition-colors",
            timeLeft < 30 ? "border-error/50 bg-error/5" : ""
          )}>
            <Clock size={18} className={cn("text-primary", timeLeft < 30 && "text-error")} />
            <span className={cn(
              "font-mono text-white font-bold text-lg",
              timeLeft < 30 && "text-error animate-pulse"
            )}>
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>
        
        <div className="w-full bg-[#1A2333] h-2 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-out shadow-[0_0_10px_rgba(79,70,229,0.5)]" 
            style={{ width: `${progress}%` }} 
          />
        </div>
      </header>

      {/* QUESTION AREA */}
      <main className="flex-1 overflow-y-auto px-8 py-12 custom-scrollbar">
        <div className="max-w-3xl mx-auto">
          <div className="bg-[#1A2333]/30 border border-border/40 rounded-3xl p-10 shadow-2xl relative overflow-hidden">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />
            
            <div className="relative z-10">
              <div className="inline-flex items-center justify-center bg-primary/10 text-primary text-[11px] font-bold px-3 py-1 rounded-lg mb-6 tracking-wider">
                QUESTION {currentQ + 1}
              </div>
              
              <h3 className="text-white text-2xl font-bold leading-tight mb-10">
                {currentQuestion.question}
              </h3>
              
              <div className="space-y-4">
                {currentQuestion.options.map((option, idx) => {
                  const label = String.fromCharCode(65 + idx);
                  const isSelected = answers[currentQ] === idx;
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => setAnswers({ ...answers, [currentQ]: idx })}
                      className={cn(
                        "w-full flex items-center gap-5 p-5 rounded-2xl border text-left transition-all duration-300 group",
                        isSelected 
                          ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(79,70,229,0.1)]" 
                          : "border-border/40 bg-[#1A2333]/30 hover:border-primary/40 hover:bg-primary/5"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all",
                        isSelected 
                          ? "bg-primary text-white scale-110" 
                          : "bg-[#0D1626] border border-border/40 text-text-secondary group-hover:text-white"
                      )}>
                        {label}
                      </div>
                      <span className={cn(
                        "flex-1 text-[15px] font-medium transition-colors",
                        isSelected ? "text-white" : "text-text-secondary group-hover:text-white"
                      )}>
                        {option}
                      </span>
                      {isSelected && <CheckCircle size={20} className="text-primary animate-in zoom-in" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* NAVIGATION */}
          <div className="flex items-center justify-between mt-10">
            <button 
              onClick={() => setCurrentQ(q => q - 1)} 
              disabled={currentQ === 0}
              className="flex items-center gap-2 px-6 py-3 rounded-xl border border-border/40 text-text-secondary font-bold hover:text-white hover:border-border transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={18} /> Previous
            </button>
            
            <button className="text-text-muted hover:text-white text-sm font-medium transition-colors">
              Skip Question
            </button>
            
            {currentQ < questions.length - 1 ? (
              <button 
                onClick={() => setCurrentQ(q => q + 1)}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 active:scale-95"
              >
                Next Question <ChevronRight size={18} />
              </button>
            ) : (
              <button 
                onClick={handleSubmit}
                className="px-10 py-3 rounded-xl bg-success hover:bg-success-dark text-white font-bold transition-all shadow-lg shadow-success/20 active:scale-95"
              >
                Submit Quiz
              </button>
            )}
          </div>
          
          <p className="text-center text-text-muted text-xs mt-12 flex items-center justify-center gap-2">
            <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
            Your response is automatically saved.
          </p>
        </div>
      </main>
    </div>
  );
};

export default QuizPage;
