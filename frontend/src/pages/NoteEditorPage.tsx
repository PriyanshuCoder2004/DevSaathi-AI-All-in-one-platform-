import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Plus, Clock, Bold, Italic, 
  Heading1, Heading2, List, ListOrdered, Code, Minus,
  LayoutDashboard, BookOpen, Terminal, FileText, ClipboardList, TrendingUp,
  User, ChevronDown, Save, ArrowLeft, MoreVertical, Share2, Bell, Check, Globe,
  Loader
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { useCreateNote, useUpdateNote, useNote } from '../hooks/useNoteDocsHooks';
import { useNotes } from '../hooks/useNotes';
import { ROUTES } from '../constants/routes';
import { cn } from '../lib/utils';
import { useLanguage } from '../contexts/LanguageContext';
import { translations as allTranslations } from '../lib/translations';

const NoteEditorPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isNew = id === 'new' || !id;
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [category, setCategory] = useState('ENGINEERING');
  
  const editorRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);
  const { language } = useLanguage();
  const t = allTranslations[language].notes;
  const commonT = allTranslations[language].common;
  const dashboardT = allTranslations[language].dashboard;
  const [copied, setCopied] = useState(false);

  const { data: existingNote, isLoading: isLoadingNote } = useNote(id || '');
  
  const createNoteMutation = useCreateNote();
  const updateNoteMutation = useUpdateNote();

  // Load existing note or passed content
  useEffect(() => {
    if (!hasInitialized.current && editorRef.current) {
      if (!isNew && existingNote) {
        setTitle(existingNote.title);
        setCategory(existingNote.topic);
        setLastSaved(new Date(existingNote.updatedAt));
        editorRef.current.innerHTML = existingNote.content;
        hasInitialized.current = true;
      } else if (isNew && location.state?.content) {
        const passed = location.state.content;
        const initialHtml = passed.body || passed;
        setTitle(passed.topic || 'Untitled Note');
        if (passed.topic) setCategory(passed.topic.toUpperCase());
        editorRef.current.innerHTML = initialHtml;
        hasInitialized.current = true;
      }
    }
  }, [id, isNew, location.state, existingNote]);


  const handleSave = async () => {
    setIsSaving(true);
    const htmlContent = editorRef.current?.innerHTML || '';
    
    try {
      if (isNew) {
        await createNoteMutation.mutateAsync({
          title: title || 'Untitled Note',
          content: htmlContent,
          topic: category,
          isAI: location.state?.isAI || false
        });
        navigate(ROUTES.NOTES);
      } else {
        await updateNoteMutation.mutateAsync({
          id,
          title: title || 'Untitled Note',
          content: htmlContent,
          topic: category
        });
        setLastSaved(new Date());
      }
    } catch (err) {
      console.error('Failed to save note:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') console.error(err);
    }
  };

  // Auto-save debounced
  useEffect(() => {
    const timer = setTimeout(() => {
      if (title || content) {
        // handleSave(); // Enabled for production, disabled for aggressive local testing
      }
    }, 30000);
    return () => clearTimeout(timer);
  }, [title, content]);

  const execCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const navItems = [
    { label: commonT.dashboard, icon: LayoutDashboard, route: ROUTES.DASHBOARD },
    { label: commonT.learn, icon: BookOpen, route: ROUTES.LEARN },
    { label: commonT.code, icon: Terminal, route: ROUTES.CODE },
    { label: commonT.docs, icon: FileText, route: ROUTES.DOCS },
    { label: commonT.notes, icon: ClipboardList, route: ROUTES.NOTES, active: true },
    { label: commonT.progress, icon: TrendingUp, route: ROUTES.PROGRESS },
  ];

  if (!isNew && isLoadingNote) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#0A0F1E]">
        <Loader className="text-primary animate-spin" size={40} />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0A0F1E] text-white overflow-hidden">
      
      {/* Slim Sidebar */}
      <div className="w-64 border-r border-white/5 flex flex-col bg-[#0A0F1E]">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-black text-white">D</div>
            <div>
              <p className="font-black text-sm tracking-tight">DevSaathi</p>
              <p className="text-[8px] text-text-muted font-black tracking-[0.2em] uppercase">AI Note Companion</p>
            </div>
          </div>

          <Link to="/notes/new">
            <button className="w-full bg-primary hover:bg-primary-light rounded-xl px-4 py-3 text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20 mb-8">
              <Plus size={16} /> {t.newNote}
            </button>
          </Link>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link 
                key={item.label} 
                to={item.route}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all group",
                  item.active 
                    ? "bg-primary/10 text-primary" 
                    : "text-text-muted hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon size={18} className={cn("transition-colors", item.active ? "text-primary" : "text-text-muted group-hover:text-white")} />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center border border-white/10 overflow-hidden">
              <User size={20} />
            </div>
            <div>
              <p className="text-xs font-black">{user?.name || (language === 'en' ? 'Developer Profile' : 'डेवलपर प्रोफाइल')}</p>
              <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">{language === 'en' ? 'Pro Account' : 'प्रो अकाउंट'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header */}
        <header className="h-16 border-b border-white/5 bg-[#0A0F1E] flex items-center justify-between px-6 sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 text-text-muted hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex flex-col items-center justify-center">
              <span className="text-[8px] font-black text-primary leading-none">NOTE</span>
              <span className="text-[10px] font-black text-primary leading-none mt-0.5">{category.substring(0, 3)}</span>
            </div>
            <div className="flex flex-col">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-transparent text-white font-black text-lg focus:outline-none placeholder:text-text-muted/30"
                placeholder={t.untitled}
              />
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
                  {isSaving 
                    ? (language === 'en' ? 'Saving...' : 'सहेज रहा है...') 
                    : (lastSaved ? (language === 'en' ? `Saved ${formatDistanceToNow(lastSaved)} ago` : `${formatDistanceToNow(lastSaved)} पहले सहेजा गया`) : (language === 'en' ? 'Draft' : 'ड्राफ्ट'))}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">

            <button 
              onClick={handleShare}
              className={cn(
                "flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                copied ? "bg-green-500/10 border-green-500/50 text-green-500" : "bg-white/5 border-white/10 text-white hover:bg-white/10"
              )}
            >
              {copied ? <Check size={14} /> : <Share2 size={14} className="text-primary" />}
              {copied ? t.copied : t.share}
            </button>
          </div>
        </header>

        {/* Toolbar */}
        <div className="h-12 border-b border-white/5 flex items-center px-8 justify-between bg-[#0C1224]">
          <div className="flex items-center gap-1">
            {[
              { icon: Bold, cmd: 'bold', label: 'B' },
              { icon: Italic, cmd: 'italic', label: 'I' },
              { icon: Heading1, cmd: 'formatBlock', val: 'H1', label: 'H1' },
              { icon: Heading2, cmd: 'formatBlock', val: 'H2', label: 'H2' },
              { icon: List, cmd: 'insertUnorderedList', label: 'UL' },
              { icon: ListOrdered, cmd: 'insertOrderedList', label: 'OL' },
              { icon: Code, cmd: 'formatBlock', val: 'PRE', label: 'Code' },
            ].map((tool, i) => (
              <button 
                key={i}
                onClick={() => execCommand(tool.cmd, tool.val)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-white hover:bg-white/5 transition-all"
                title={tool.label}
              >
                <tool.icon size={16} />
              </button>
            ))}
            <div className="w-px h-6 bg-white/5 mx-2" />
            <button onClick={() => execCommand('insertHorizontalRule')} className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-white hover:bg-white/5 transition-all">
              <Minus size={16} />
            </button>
          </div>

          <div className="relative group">
            <button className="flex items-center gap-2 px-4 py-2 bg-[#0C1224] border border-white/5 rounded-xl text-primary text-[10px] font-black uppercase tracking-widest hover:border-primary/30 transition-all">
              {category || 'ENGINEERING'}
              <ChevronDown size={14} />
            </button>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0A0F1E]">
          <div className="w-full px-16 py-12">
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={(e) => {
                const html = e.currentTarget.innerHTML;
                setContent(html);
              }}
              className="outline-none text-text-secondary text-base leading-8 min-h-[600px] text-left
                [&_h1]:text-white [&_h1]:text-3xl [&_h1]:font-black [&_h1]:tracking-tight [&_h1]:mt-10 [&_h1]:mb-4
                [&_h2]:text-white [&_h2]:text-2xl [&_h2]:font-black [&_h2]:tracking-tight [&_h2]:mt-8 [&_h2]:mb-3
                [&_strong]:text-white [&_strong]:font-black
                [&_pre]:bg-[#0C1224] [&_pre]:p-6 [&_pre]:rounded-2xl [&_pre]:border [&_pre]:border-white/5 [&_pre]:my-6
                [&_pre]:font-mono [&_pre]:text-sm [&_pre]:text-green-400 [&_pre]:overflow-x-auto
                [&_code]:text-green-400 [&_code]:font-mono
                [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-4 [&_li]:mb-2 [&_li]:text-text-secondary
                [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-4
                [&_hr]:border-white/5 [&_hr]:my-10"
              style={{ direction: 'ltr', textAlign: 'left' }}
            />
          </div>
        </div>

        {/* Floating Save Button */}
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="fixed bottom-10 right-10 bg-primary hover:bg-primary-light px-8 py-4 rounded-2xl text-white text-sm font-black uppercase tracking-widest flex items-center gap-3 transition-all shadow-2xl shadow-primary/30 hover:-translate-y-1 active:translate-y-0 disabled:opacity-50"
        >
          {isSaving ? <Loader className="animate-spin" size={18} /> : <Save size={18} />}
          {isSaving ? (language === 'en' ? 'Saving...' : 'सहेज रहा है...') : (language === 'en' ? 'Save Changes' : 'बदलाव सहेजें')}
        </button>

      </div>
    </div>
  );
};

export default NoteEditorPage;
