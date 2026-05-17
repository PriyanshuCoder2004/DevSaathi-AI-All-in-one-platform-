import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Editor from '@monaco-editor/react';
import { 
  Code2, 
  FileText, 
  AlertTriangle, 
  Zap, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  HelpCircle,
  Globe,
  Settings,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../lib/translations';
import type { CodeAnalysis } from '../types';
import { ROUTES } from '../constants/routes';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { useExplainCode, useDebugCode, useImproveCode } from '../hooks/useCodeHooks';
import { useToast } from '../components/ui/ToastProvider';

const CodePage: React.FC = () => {
  const [code, setCode] = useState('// Paste your code here to start analysis...');
  const [activeTab, setActiveTab] = useState<'explanation' | 'debug' | 'improvements'>('explanation');
  const { language } = useLanguage();
  const t = translations[language].code;
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [analysis, setAnalysis] = useState<CodeAnalysis | null>(null);
  
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const lineCount = code.split('\n').filter(Boolean).length;

  const explainMutation = useExplainCode();
  const debugMutation = useDebugCode();
  const improveMutation = useImproveCode();

  const getActiveMutation = () => {
    if (activeTab === 'explanation') return explainMutation;
    if (activeTab === 'debug') return debugMutation;
    return improveMutation;
  };

  const mutation = getActiveMutation();

  const handleAction = (type: 'explanation' | 'debug' | 'improve') => {
    if (code.trim() === '' || lineCount > 5000) return;
    const tab = type === 'improve' ? 'improvements' : type === 'debug' ? 'debug' : 'explanation';
    setActiveTab(tab as any);
    
    const activeMut = type === 'explanation' ? explainMutation : 
                    type === 'debug' ? debugMutation : improveMutation;

    activeMut.mutate({ code, language, selectedLanguage }, {
      onSuccess: (data: any) => {
        setAnalysis(data);
        showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} completed`, 'success');
      },
      onError: (error: any) => {
        showToast(error.message || 'Analysis failed', 'error');
      }
    });
  };

  // Re-trigger analysis when language changes
  useEffect(() => {
    if (analysis) {
      const type = activeTab === 'improvements' ? 'improve' : activeTab === 'debug' ? 'debug' : 'explanation';
      handleAction(type as any);
    }
  }, [language]);

  const languages = [
    { id: 'javascript', name: 'JavaScript' },
    { id: 'typescript', name: 'TypeScript' },
    { id: 'python', name: 'Python' },
    { id: 'java', name: 'Java' },
    { id: 'cpp', name: 'C++' },
    { id: 'go', name: 'Go' }
  ];

  return (
    <div className="flex flex-col h-full bg-[#0A0F1E] overflow-hidden">
      {/* TOPBAR */}
      <header className="flex items-center justify-between px-6 h-14 border-b border-border/40 bg-[#0A0F1E]/80 backdrop-blur-md flex-shrink-0 z-10">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <h1 className="text-white font-bold text-lg">{t.title}</h1>
            {code.length > 0 && !code.includes('Paste your code') && (
              <span className="text-text-muted text-xs bg-white/5 px-2 py-0.5 rounded-md font-medium border border-white/5">
                {lineCount} {language === 'en' ? 'lines' : 'लाइनें'}
              </span>
            )}
          </div>

          {/* Programming Language Selector */}
          <div className="flex items-center bg-[#1A2333] border border-border/40 rounded-full px-3 py-1 gap-2 hover:border-success/50 transition-colors group">
            <Code2 size={12} className="text-success" />
            <select 
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-transparent text-success text-[10px] font-mono font-bold outline-none cursor-pointer uppercase min-w-[90px]"
            >
              {languages.map(lang => (
                <option key={lang.id} value={lang.id} className="bg-[#0A0F1E]">{lang.name}</option>
              ))}
            </select>
            <ChevronRight size={10} className="text-text-muted rotate-90 group-hover:text-success transition-colors" />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 text-text-muted">
            <Link to={ROUTES.SETTINGS} className="hover:text-white transition-colors"><Settings size={18} /></Link>
            <Link to={ROUTES.SETTINGS} className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold text-white text-xs border border-white/10">
              PA
            </Link>
          </div>
        </div>
      </header>

      {/* MAIN SPLIT PANEL */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* LEFT PANEL: Editor */}
        <div className="w-1/2 flex flex-col border-r border-border/40 bg-[#0A0F1E] relative">
          <div className="flex-1 overflow-hidden pt-4">
            <Editor
              height="100%"
              theme="vs-dark"
              language={selectedLanguage}
              value={code}
              onMount={(editor) => {
                // Focus editor and handle initial placeholder clear
                editor.onDidFocusEditorText(() => {
                  if (code === '// Paste your code here to start analysis...') {
                    setCode('');
                  }
                });
              }}
              onChange={(val) => setCode(val || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: 'JetBrains Mono, monospace',
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                padding: { top: 16, bottom: 16 },
                overviewRulerBorder: false,
                hideCursorInOverviewRuler: true,
                scrollbar: {
                  vertical: 'visible',
                  horizontal: 'visible',
                  verticalScrollbarSize: 8,
                  horizontalScrollbarSize: 8,
                }
              }}
              onMount={(editor) => {
                // Ensure editor has transparent background to match our theme
                editor.updateOptions({
                  'semanticHighlighting.enabled': true,
                });
              }}
            />
          </div>

          {lineCount > 5000 && (
            <div className="bg-error/10 border-t border-error/30 px-4 py-3 flex items-center gap-3 animate-in slide-in-from-bottom-full duration-300">
              <AlertCircle size={16} className="text-error flex-shrink-0" />
              <span className="text-error text-xs font-medium">Code exceeds 5,000 line limit. Please reduce for analysis.</span>
            </div>
          )}

          {/* BOTTOM ACTION BAR */}
          <div className="border-t border-border/40 bg-[#0A0F1E]/50 backdrop-blur-md p-4 flex items-center gap-3">
            <Button
              onClick={() => handleAction('explanation')}
              className={cn(
                "h-12 px-6 rounded-xl font-bold flex items-center gap-2.5 transition-all shadow-lg",
                activeTab === 'explanation' && analysis ? "bg-primary text-white shadow-primary/20" : "bg-[#1A2333] text-text-secondary border border-border/40 hover:text-white"
              )}
              disabled={code.length === 0 || lineCount > 5000 || mutation.isPending}
            >
              {mutation.isPending && activeTab === 'explanation' ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}
              {t.explainCode}
            </Button>

            <Button
              onClick={() => handleAction('debug')}
              className={cn(
                "h-12 px-6 rounded-xl font-bold flex items-center gap-2.5 transition-all",
                activeTab === 'debug' && analysis ? "bg-warning/20 border-warning text-warning shadow-lg shadow-warning/10" : "bg-[#1A2333] text-text-secondary border border-border/40 hover:text-white"
              )}
              disabled={code.length === 0 || lineCount > 5000 || mutation.isPending}
            >
              {mutation.isPending && activeTab === 'debug' ? <Loader2 className="animate-spin" size={18} /> : <Settings size={18} />}
              {t.findBugs}
            </Button>

            <Button
              onClick={() => handleAction('improve')}
              className={cn(
                "h-12 px-6 rounded-xl font-bold flex items-center gap-2.5 transition-all",
                activeTab === 'improvements' && analysis ? "bg-accent/20 border-accent text-accent shadow-lg shadow-accent/10" : "bg-[#1A2333] text-text-secondary border border-border/40 hover:text-white"
              )}
              disabled={code.length === 0 || lineCount > 5000 || mutation.isPending}
            >
              {mutation.isPending && activeTab === 'improvements' ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}
              {t.improveCode}
            </Button>

            <div className="ml-auto text-text-muted text-[10px] font-medium flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              {language === 'en' ? 'Supports Python, JS, TypeScript, Java, C++, Go' : 'पायथन, JS, टाइपस्क्रिप्ट, जावा, C++, Go को सपोर्ट करता है'}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Analysis */}
        <div className="w-1/2 flex flex-col overflow-hidden bg-[#0A0F1E]">
          {/* TAB BAR */}
          <div className="flex border-b border-border/40 bg-[#0A0F1E]/50 px-8 flex-shrink-0">
            {['explanation', 'debug', 'improvements'].map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab as any)}
                className={cn(
                  "py-4 px-1 mr-8 text-sm font-semibold capitalize border-b-2 transition-all relative",
                  activeTab === (tab === 'improvements' ? 'improvements' : tab)
                    ? "text-white border-primary" 
                    : "text-text-secondary border-transparent hover:text-white"
                )}
              >
                {tab === 'debug' ? t.debugReport : tab === 'improvements' ? t.improvements : t.explainCode}
                {tab === 'debug' && analysis?.bugs && analysis.bugs.length > 0 && (
                  <span className="absolute -top-1 -right-4 bg-warning text-[#0A0F1E] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {analysis.bugs.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* PANEL CONTENT */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            {mutation.isPending ? (
              <div className="space-y-8">
                <div className="space-y-4">
                  <Skeleton className="h-6 w-48 rounded" />
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-4 w-[90%] rounded" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-32 rounded-2xl" />
                  <Skeleton className="h-32 rounded-2xl" />
                </div>
                <div className="space-y-4 pt-4">
                  <Skeleton className="h-6 w-32 rounded" />
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-4">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-40 rounded" />
                        <Skeleton className="h-3 w-full rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : !analysis ? (
              <EmptyState 
                icon={Code2}
                title={language === 'en' ? "No code analyzed yet" : "अभी तक किसी कोड का विश्लेषण नहीं किया गया है"}
                description={language === 'en' 
                  ? "Paste your code in the editor and click an action at the bottom to get started with AI analysis."
                  : "एडिटर में अपना कोड पेस्ट करें और AI विश्लेषण के साथ शुरू करने के लिए नीचे दी गई कार्रवाई पर क्लिक करें।"}
              />
            ) : (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                {activeTab === 'explanation' && (
                  <div className="space-y-8">
                    <section>
                      <h3 className="text-primary font-bold text-lg flex items-center gap-3">
                        <FileText size={20} />
                        {t.whatItDoes}
                      </h3>
                      <p className="text-text-secondary text-sm leading-relaxed mt-4 bg-white/5 p-5 rounded-2xl border border-white/5">
                        {analysis?.explanation || 'No explanation available.'}
                      </p>
                    </section>

                    <section>
                      <div className="flex items-center gap-2 mb-5">
                        <div className="w-2 h-5 bg-primary rounded-full" />
                        <h4 className="text-white font-bold text-base">{t.keyConcepts}</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {analysis?.keyConcepts?.map?.((concept, i) => (
                          <div key={i} className="bg-[#1A2333]/50 border border-border/40 rounded-2xl p-5 hover:border-primary/50 transition-colors group">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                              <span className="text-white font-bold text-sm group-hover:text-primary transition-colors">{concept.name}</span>
                            </div>
                            <p className="text-text-secondary text-xs leading-relaxed">{concept.description}</p>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section>
                      <div className="flex items-center gap-2 mb-6">
                        <div className="w-2 h-5 bg-primary rounded-full" />
                        <h4 className="text-white font-bold text-base">{t.logicFlow}</h4>
                      </div>
                      <div className="space-y-6 ml-3">
                        {analysis?.logicFlow?.map?.((step, i) => (
                          <div key={i} className="flex items-start gap-5 relative group">
                            {i !== analysis.logicFlow.length - 1 && (
                              <div className="absolute left-[11px] top-8 bottom-[-24px] w-0.5 bg-border/20 group-hover:bg-primary/20 transition-colors" />
                            )}
                            <div className="w-6 h-6 bg-[#1A2333] border border-border/40 rounded-full flex items-center justify-center text-[10px] font-bold text-text-muted flex-shrink-0 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all z-10">
                              {step.step}
                            </div>
                            <div>
                              <h5 className="text-white font-bold text-sm mb-1">{step.title}</h5>
                              <p className="text-text-secondary text-xs leading-relaxed">{step.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>

                    {analysis.isValid && (
                      <div className="flex items-center justify-between bg-success/5 border border-success/20 rounded-2xl p-5 mt-10">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-success/20 rounded-xl flex items-center justify-center">
                            <CheckCircle size={22} className="text-success" />
                          </div>
                          <div>
                            <span className="text-success text-sm font-bold block">{t.validCode}</span>
                            <span className="text-success/60 text-xs">
                              {language === 'en' ? 'Ready for deployment' : 'परिनियोजन के लिए तैयार'}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-text-muted text-[10px] font-mono">
                            {language === 'en' ? 'Generated by Saathi-Pro v4' : 'साथी-प्रो v4 द्वारा जनरेट किया गया'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'debug' && (
                  <div className="space-y-6">
                    {analysis.bugs && analysis.bugs.length > 0 ? (
                      <>
                        <div className="flex items-center gap-3 bg-warning/10 border border-warning/20 rounded-2xl px-5 py-4 mb-6">
                          <AlertTriangle size={18} className="text-warning" />
                          <span className="text-warning font-bold text-sm">
                            {language === 'en' 
                              ? `${analysis.bugs.length} issues found in your code` 
                              : `आपके कोड में ${analysis.bugs.length} समस्याएं मिलीं`}
                          </span>
                        </div>

                        {analysis.bugs.map((bug, i) => (
                          <div 
                            key={i} 
                            className={cn(
                              "border-l-4 rounded-r-2xl p-6 relative overflow-hidden",
                              bug.severity === 'critical' ? "border-l-error bg-error/5" : 
                              bug.severity === 'moderate' ? "border-l-warning bg-warning/5" : 
                              "border-l-border bg-white/5"
                            )}
                          >
                            <Badge 
                              variant={bug.severity === 'critical' ? 'error' : bug.severity === 'moderate' ? 'warning' : 'muted'}
                              className="mb-3 uppercase text-[9px] tracking-widest font-black"
                            >
                              {bug.severity}
                            </Badge>
                            <h4 className="text-white font-bold text-base mb-2">{bug.title}</h4>
                            <p className="text-text-secondary text-xs leading-relaxed mb-6">{bug.description}</p>
                            
                            <div className="space-y-2">
                              <p className="text-text-muted text-[10px] font-bold uppercase tracking-wider flex items-center gap-2">
                                <ChevronRight size={12} className="text-primary" />
                                {t.suggestedFix}
                              </p>
                              <div className="bg-[#0A0F1E] border border-white/5 rounded-xl p-4 font-mono text-[11px] text-green-400 overflow-x-auto custom-scrollbar shadow-inner">
                                <pre><code>{bug.fix}</code></pre>
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-20 h-20 bg-success/10 rounded-3xl flex items-center justify-center mb-6">
                          <CheckCircle size={40} className="text-success" />
                        </div>
                        <h3 className="text-white font-bold text-2xl">{language === 'en' ? 'Clean Code!' : 'साफ कोड!'}</h3>
                        <p className="text-text-secondary text-base mt-3 max-w-sm">
                          {language === 'en' 
                            ? 'No major bugs or issues detected. Your code follows standard safety practices.'
                            : 'कोई बड़ी गड़बड़ी या समस्या नहीं मिली। आपका कोड मानक सुरक्षा प्रथाओं का पालन करता है।'}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'improvements' && (
                  <div className="space-y-4">
                    {analysis.improvements?.map((imp, i) => (
                      <div key={i} className="border-l-4 border-l-primary bg-primary/5 rounded-r-2xl p-6 hover:bg-primary/10 transition-all border border-border/20 border-l-primary group">
                        <div className="flex justify-between items-start mb-4">
                          <Badge variant="primary" className="text-[9px] tracking-widest font-black uppercase">
                            {imp.category}
                          </Badge>
                          <Badge variant={imp.priority === 'high' ? 'error' : 'muted'} className="text-[8px] opacity-70">
                            {imp.priority} Priority
                          </Badge>
                        </div>
                        <h4 className="text-white font-bold text-base mb-2 group-hover:text-primary transition-colors">{imp.suggestion}</h4>
                        <div className="flex items-start gap-2 text-text-secondary">
                          <Zap size={14} className="text-primary mt-0.5 flex-shrink-0" />
                          <p className="text-xs leading-relaxed">{imp.benefit}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodePage;
