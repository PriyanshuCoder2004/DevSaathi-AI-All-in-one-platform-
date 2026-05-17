import React, { useState } from 'react';
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  ChevronRight, 
  Search, 
  Bell, 
  Settings, 
  Zap, 
  FileText, 
  ExternalLink, 
  Download, 
  Bookmark,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Lightbulb,
  Check,
  Info,
  Loader2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '../lib/utils';
import { ROUTES } from '../constants/routes';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../lib/translations';
import Skeleton from '../components/ui/Skeleton';
import Badge from '../components/ui/Badge';
import type { DocSummary } from '../types';
import { useDocSummary, useSummarizeDoc, useCreateNote } from '../hooks/useNoteDocsHooks';
import { useToast } from '../components/ui/ToastProvider';
import { useEffect } from 'react';



const DocSummaryPage: React.FC = () => {
  const { docId } = useParams<{ docId: string }>();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const t = translations[language].docs;
  const commonT = translations[language].common;
  const dashboardT = translations[language].dashboard;

  const labels = {
    en: {
      navigation: 'NAVIGATION',
      aiStats: 'AI Analysis Stats',
      scanDepth: 'Scan Depth',
      comprehensive: 'Comprehensive',
      officialGuide: 'OFFICIAL GUIDE',
      updated: 'Updated',
      pages: 'pages',
      minRead: 'min read',
      originalSource: 'View Original Source',
      keyPoints: 'Key Points',
      warnings: 'Important Warnings',
      exportPdf: 'Export as PDF',
      saveNotes: 'Save Summary to Notes',
      aiGenerated: 'AI summary generated from your uploaded document.',
    },
    hi: {
      navigation: 'नेविगेशन',
      aiStats: 'AI विश्लेषण आँकड़े',
      scanDepth: 'स्कैन गहराई',
      comprehensive: 'व्यापक',
      officialGuide: 'आधिकारिक गाइड',
      updated: 'अपडेट किया गया',
      pages: 'पेज',
      minRead: 'मिनट पढ़ने में',
      originalSource: 'मूल स्रोत देखें',
      keyPoints: 'मुख्य बिंदु',
      warnings: 'महत्वपूर्ण चेतावनियाँ',
      exportPdf: 'PDF के रूप में एक्सपोर्ट करें',
      saveNotes: 'सारांश को नोट्स में सहेजें',
      aiGenerated: 'आपके अपलोड किए गए दस्तावेज़ से उत्पन्न AI सारांश।',
    }
  };

  const l = labels[language];
  const [activeSection, setActiveSection] = useState('Introduction');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const mainRef = React.useRef<HTMLDivElement>(null);

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/docs/summary/search-result?lang=${language}&q=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Remove local translations variable as we use the labels and translations object
  // const t = translations[language];

  const { data: existingSummary, isLoading: isDocLoading } = useDocSummary(docId || '');
  const summarizeMutation = useSummarizeDoc();
  
  const [newSummary, setNewSummary] = useState<DocSummary | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  useEffect(() => {
    const s3Key = searchParams.get('s3Key');
    const filename = searchParams.get('filename') || existingSummary?.filename;
    
    // Trigger re-summarization if language changes or if it's a new upload
    if (s3Key || (docId !== 'new' && existingSummary)) {
      const targetS3Key = s3Key || existingSummary?.s3Key;
      const targetFilename = filename || existingSummary?.filename;

      if (targetS3Key && targetFilename) {
        setIsSummarizing(true);
        summarizeMutation.mutateAsync({ 
          s3Key: targetS3Key, 
          filename: targetFilename, 
          language,
          docId: docId !== 'new' ? docId : undefined
        })
          .then(res => {
            setNewSummary(res);
            setIsSummarizing(false);
          })
          .catch(() => setIsSummarizing(false));
      }
    }
  }, [docId, searchParams, language, existingSummary?.id]);

  const summary = (docId === 'new' ? newSummary : existingSummary) as DocSummary;
  const isLoading = docId === 'new' ? isSummarizing : isDocLoading;

  useEffect(() => {
    if (summary?.sections?.[0]?.heading) {
      setActiveSection(summary.sections[0].heading);
    }
  }, [summary]);

  const getRelativeTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600));
    
    if (diffInHours < 1) return language === 'hi' ? 'अभी-अभी' : 'Just now';
    if (diffInHours < 24) return language === 'hi' ? `आज, ${date.toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' })}` : `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    if (diffInHours < 48) return language === 'hi' ? 'कल' : 'Yesterday';
    return language === 'hi' ? `${Math.floor(diffInHours / 24)} दिन पहले` : `${Math.floor(diffInHours / 24)} days ago`;
  };

  // ScrollSpy logic to highlight active section on scroll
  React.useEffect(() => {
    if (!summary) return;

    // Find the closest scrollable ancestor (likely AppLayout's main)
    const scrollContainer = document.querySelector('main.overflow-y-auto');

    const observerOptions = {
      root: scrollContainer, // Use the actual scrollable element
      rootMargin: '-20% 0px -60% 0px', 
      threshold: [0, 0.5, 1.0]
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio > 0) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    
    // Select all sections with an ID and the scroll-mt-24 class
    const sections = document.querySelectorAll('div[id].scroll-mt-24');
    sections.forEach(section => observer.observe(section));

    return () => observer.disconnect();
  }, [summary]); // Re-run when summary data loads

  const saveToNotesMutation = useCreateNote();
  const { showToast } = useToast();

  const handleSaveToNotes = () => {
    if (!summary) return;
    
    // Construct rich markdown content from summary
    let content = `### Analysis of ${summary.title}\n\n`;
    
    summary.sections.forEach(s => {
      content += `#### ${s.heading}\n${s.content}\n\n`;
    });
    
    content += `### Key Insights\n`;
    summary.keyPoints.forEach(p => content += `- ${p}\n`);
    content += `\n`;
    
    if (summary.warnings && summary.warnings.length > 0) {
      content += `### Important Considerations\n`;
      summary.warnings.forEach(w => content += `> **${w.label}**: ${w.description}\n`);
    }

    saveToNotesMutation.mutate({
      title: summary.title,
      content,
      topic: summary.title,
      tags: ['documentation', 'ai-summary'],
      isAI: true
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['notes'] });
        queryClient.invalidateQueries({ queryKey: ['stats'] });
        // Toast is handled in the hook
      }
    });
  };

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    const scrollContainer = document.querySelector('main.overflow-y-auto');
    
    if (element && scrollContainer) {
      // Calculate position relative to the scroll container
      const containerRect = scrollContainer.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      const relativeTop = elementRect.top - containerRect.top;
      
      // Scroll with an offset for the sticky header (14rem = 56px approx)
      scrollContainer.scrollBy({
        top: relativeTop - 80, // 80px offset for the header and some breathing room
        behavior: 'smooth'
      });
    } else if (element) {
      // Fallback
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex h-full bg-bg-primary overflow-hidden">
        <div className="w-64 border-r border-border/40 p-6 space-y-6">
          <Skeleton className="h-4 w-24 mb-8" />
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
        </div>
        <div className="flex-1 p-12 space-y-8 overflow-y-auto">
          <div className="flex gap-4">
            <Skeleton className="h-6 w-32 rounded-full" />
            <Skeleton className="h-6 w-32 rounded-full" />
          </div>
          <Skeleton className="h-16 w-3/4 rounded-xl" />
          <div className="flex gap-4">
            <Skeleton className="h-12 w-64 rounded-xl" />
            <Skeleton className="h-12 w-64 rounded-xl" />
          </div>
          <div className="space-y-4 pt-12">
            <Skeleton className="h-8 w-1/4 rounded-lg" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-bg-primary p-8">
        <div className="bg-error/10 p-6 rounded-3xl mb-6">
          <AlertTriangle size={48} className="text-error" />
        </div>
        <h2 className="text-white text-2xl font-bold mb-2">Failed to load summary</h2>
        <p className="text-text-secondary text-center max-w-md mb-8">
          We couldn't retrieve the documentation analysis. It might have been deleted or there was a connection error.
        </p>
        <Link 
          to={ROUTES.DOCS}
          className="bg-primary text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-light transition-all"
        >
          Back to Documentation
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-bg-primary min-h-full">
      {/* PRINT-ONLY STYLES */}
      <style>
        {`
          @media print {
            /* Reset layout constraints for multi-page printing */
            html, body, #root, .flex.h-screen, [class*="h-screen"], [class*="overflow-hidden"], [class*="overflow-y-auto"] {
              height: auto !important;
              overflow: visible !important;
              position: static !important;
              display: block !important;
              background: white !important;
            }

            /* Hide all UI chrome and non-summary elements */
            header, aside, .sticky-bottom-bar, .no-print, [class*="-z-10"], .bg-primary/5, .bg-accent/5 {
              display: none !important;
            }

            /* Reset sidebar margin in AppLayout */
            .ml-\\[240px\\], [class*="ml-[240px]"] {
              margin-left: 0 !important;
            }

            main {
              padding: 0 !important;
              margin: 0 !important;
              background: white !important;
              overflow: visible !important;
              width: 100% !important;
              max-width: 100% !important;
              display: block !important;
            }

            .max-w-4xl {
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
            }

            .text-white {
              color: black !important;
            }

            .text-text-secondary, .text-text-muted {
              color: #1f2937 !important;
            }

            .bg-bg-primary, .bg-bg-card, .bg-bg-elevated {
              background: white !important;
              border-color: #e5e7eb !important;
            }

            .border-border, .border-primary/20, .border-error/20 {
              border-color: #d1d5db !important;
            }

            h1 { 
              font-size: 32pt !important; 
              color: black !important;
              margin-bottom: 30pt !important;
              border-bottom: 2pt solid #eee;
              padding-bottom: 10pt;
            }

            h2 { 
              font-size: 20pt !important; 
              margin-top: 30pt !important; 
              color: black !important;
              display: flex !important;
              align-items: center !important;
              gap: 10pt !important;
            }

            h2 span {
              background: #3b82f6 !important;
              height: 4pt !important;
              width: 20pt !important;
            }

            p { 
              font-size: 12pt !important; 
              line-height: 1.6 !important; 
              color: #374151 !important;
            }

            .grid { 
              display: block !important; 
              margin-top: 40pt !important;
            }

            .grid > div { 
              margin-top: 30pt !important; 
              page-break-inside: avoid; 
              border: 1pt solid #eee !important;
              background: #f9fafb !important;
            }

            .rounded-[2rem], .rounded-2xl { 
              border-radius: 12pt !important; 
            }

            .shadow-2xl, .shadow-lg { 
              box-shadow: none !important; 
            }

            .badge { 
              border: 1px solid #ccc !important; 
              color: black !important;
            }

            .scroll-mt-24 { 
              scroll-margin-top: 0 !important; 
            }
          }
        `}
      </style>

      {/* TOPBAR - Sticky at the very top of DocSummaryPage */}
      <header className="sticky top-0 flex justify-between items-center px-8 h-14 border-b border-border/40 bg-bg-primary/90 backdrop-blur-md flex-shrink-0 z-30 no-print">
        <nav className="flex items-center gap-3">
          <Link to={ROUTES.DOCS} className="text-text-muted hover:text-white text-sm transition-colors flex items-center gap-1.5">
            <FileText size={14} />
            {t.title}
          </Link>
          <ChevronRight size={14} className="text-text-muted" />
          <span className="text-white text-sm font-semibold truncate max-w-[300px]">{summary.title}</span>
        </nav>
        
        <div className="flex items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="bg-bg-card border border-border/40 rounded-xl px-4 py-1.5 flex items-center gap-2 w-72">
            <Search size={14} className="text-text-muted" />
            <input 
              type="text" 
              placeholder={commonT.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              className="bg-transparent border-none text-white text-sm outline-none w-full placeholder:text-text-muted"
            />
          </div>
          <div className="flex items-center gap-4 text-text-muted">
            <button className="hover:text-white transition-colors"><Settings size={18} /></button>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold text-white text-xs border border-white/10">
              PA
            </div>
          </div>
        </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* LEFT NAVIGATION - Sticky below the topbar */}
        <aside className="w-64 border-r border-border/40 p-6 flex flex-col flex-shrink-0 no-print sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto custom-scrollbar">
          <div className="mb-6">
            <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] mb-4">{l.navigation}</p>
            <div className="space-y-1">
              {summary.sections.map((section) => (
                <button
                  key={section.heading}
                  onClick={() => scrollToSection(section.heading)}
                  className={cn(
                    "w-full flex items-center justify-between py-2.5 px-4 rounded-xl text-sm font-medium transition-all group",
                    activeSection === section.heading 
                      ? "bg-primary/10 text-white border border-primary/20 shadow-lg shadow-primary/5" 
                      : "text-text-secondary hover:text-white hover:bg-white/5"
                  )}
                >
                  <span className="truncate mr-2">{section.heading}</span>
                  {activeSection === section.heading && (
                    <div className="flex items-center justify-center w-4 h-4 bg-primary rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)] flex-shrink-0">
                      <Check size={10} className="text-white font-bold" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-auto pt-8 border-t border-border/20">
            <div className="bg-bg-elevated/40 border border-border/40 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-white text-[10px] font-black uppercase tracking-widest">{l.aiStats}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] mb-2">
                <span className="text-text-secondary">{l.scanDepth}</span>
                <span className="text-primary font-bold">{l.comprehensive}</span>
              </div>
              <div className="w-full bg-bg-card rounded-full h-1.5 border border-border/20">
                <div className="bg-primary h-full rounded-full w-[85%] shadow-[0_0_12px_rgba(59,130,246,0.3)]"></div>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT - Scrolls normally with the AppLayout's main container */}
        <main className="flex-1 p-12 relative">
          <div className="max-w-4xl mx-auto">
            {/* Header Area */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6 no-print">
                <Badge variant="primary" className="text-[10px] font-black tracking-widest uppercase py-1 px-3">
                  {l.officialGuide}
                </Badge>
                <div className="w-1 h-1 bg-border/60 rounded-full"></div>
                <span className="text-text-muted text-xs flex items-center gap-1.5">
                  <Clock size={12} />
                  {l.updated} {getRelativeTime(summary.createdAt)}
                </span>
              </div>
              
              <h1 className="text-white text-5xl font-black tracking-tight mb-8 leading-tight">
                {summary.title}
              </h1>

              <div className="flex flex-wrap gap-4 no-print">
                <div className="bg-bg-card/50 border border-border/40 rounded-xl px-5 py-3 flex items-center gap-3 shadow-lg group hover:border-primary/30 transition-colors">
                  <div className="p-2 bg-primary/10 rounded-lg group-hover:scale-110 transition-transform">
                    <FileText size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-bold">{summary.pageCount} {l.pages}</p>
                    <p className="text-text-muted text-[10px] font-medium uppercase">~ {summary.readTime} {l.minRead}</p>
                  </div>
                </div>

                {summary.originalUrl && (
                  <a 
                    href={summary.originalUrl} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-bg-card/50 border border-border/40 rounded-xl px-6 py-3 flex items-center gap-2 text-text-secondary text-sm font-bold hover:text-white hover:border-white/20 transition-all shadow-lg hover:-translate-y-0.5"
                  >
                    <ExternalLink size={16} />
                    {l.originalSource}
                  </a>
                )}
              </div>
            </div>

            {/* Content Sections */}
            <div className="space-y-16 pb-24">
              {summary.sections.map((section) => (
                <div key={section.heading} id={section.heading} className="scroll-mt-24">
                  <h2 className="text-white text-2xl font-bold mb-6 flex items-center gap-3 group">
                    <span className="w-8 h-1 bg-primary rounded-full group-hover:w-12 transition-all"></span>
                    {section.heading}
                  </h2>
                  <p className="text-text-secondary text-lg leading-relaxed font-medium opacity-90">
                    {section.content}
                  </p>
                </div>
              ))}

              {/* Summary Cards Grid */}
              <div className="grid grid-cols-2 gap-8 mt-12">
                {/* Key Points */}
                <div className="bg-bg-card/30 border border-primary/20 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[40px] -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors"></div>
                  
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-2.5 bg-primary/10 rounded-2xl border border-primary/20">
                      <Lightbulb size={24} className="text-primary" />
                    </div>
                    <h3 className="text-white text-xl font-bold">{l.keyPoints}</h3>
                  </div>
                  
                  <ul className="space-y-4">
                    {summary.keyPoints.map((point, idx) => (
                      <li key={idx} className="flex gap-3 text-text-secondary text-sm leading-relaxed font-medium">
                        <CheckCircle2 size={16} className="text-primary flex-shrink-0 mt-0.5" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Warnings */}
                <div className="bg-bg-card/30 border border-error/20 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-error/5 rounded-full blur-[40px] -mr-16 -mt-16 group-hover:bg-error/10 transition-colors"></div>
                  
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-2.5 bg-error/10 rounded-2xl border border-error/20">
                      <AlertTriangle size={24} className="text-error" />
                    </div>
                    <h3 className="text-white text-xl font-bold">{l.warnings}</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {summary.warnings.map((warning, idx) => (
                      <div key={idx} className="bg-bg-elevated/40 border border-border/40 rounded-2xl p-5 hover:border-error/30 transition-colors">
                        <p className="text-error uppercase text-[10px] font-black tracking-widest mb-1">{warning.label}</p>
                        <p className="text-text-secondary text-xs leading-relaxed font-medium">{warning.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* STICKY BOTTOM BAR */}
          <div className="sticky bottom-8 left-0 right-0 mx-auto max-w-4xl z-20 px-8 no-print">
            <div className="bg-[#111827]/90 backdrop-blur-xl border border-border/40 rounded-3xl p-4 flex justify-between items-center shadow-2xl shadow-black/40 sticky-bottom-bar">
              <p className="text-text-muted text-xs italic flex items-center gap-2">
                <Info size={14} className="text-primary" />
                {l.aiGenerated}
              </p>
              
              <div className="flex gap-4">
                <button 
                  onClick={handleExportPDF}
                  className="bg-bg-card hover:bg-bg-elevated border border-border/40 rounded-xl px-6 py-2.5 text-text-secondary text-sm font-bold flex items-center gap-2 transition-all hover:-translate-y-0.5"
                >
                  <Download size={16} />
                  {l.exportPdf}
                </button>
                <button 
                  onClick={handleSaveToNotes}
                  disabled={saveToNotesMutation.isPending}
                  className="bg-primary hover:bg-primary-light rounded-xl px-6 py-2.5 text-white text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/20 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {saveToNotesMutation.isPending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Bookmark size={16} />
                  )}
                  {l.saveNotes}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DocSummaryPage;
