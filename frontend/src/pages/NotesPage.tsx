import React, { useState } from 'react';
import { 
  Search, Plus, BookOpen, MoreVertical, Edit2, Trash2, 
  Download, Bell, HelpCircle, Share2, Filter, 
  ChevronDown, Calendar, ArrowUpDown, Clock
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useNotes } from '../hooks/useNotes';
import { useDeleteNote, useUpdateNote } from '../hooks/useNoteDocsHooks';
import { cn } from '../lib/utils';
import { type Note } from '../services/noteService';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import Skeleton from '../components/ui/Skeleton';
import { ROUTES } from '../constants/routes';
import { useLanguage } from '../contexts/LanguageContext';
import { translations as allTranslations } from '../lib/translations';

const noteColors: Record<string, string> = {
  PYTHON: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  ALGORITHMS: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  REACT: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  DEVOPS: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  'SYSTEM DESIGN': 'bg-green-500/10 text-green-500 border-green-500/20',
  POSTGRESQL: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
  DEFAULT: 'bg-primary/10 text-primary border-primary/20'
};

const NotesPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'ai' | 'mine' | 'bookmarked'>('all');
  const [sort, setSort] = useState<'recent' | 'oldest' | 'alpha'>('recent');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { language } = useLanguage();
  const t = allTranslations[language].notes;
  const commonT = allTranslations[language].common;
  const [copied, setCopied] = useState(false);

  const { data: notesRaw = [], isLoading } = useNotes(filter === 'all' ? undefined : filter, search);
  
  // Apply Sort locally for UI responsiveness or handle it in backend
  const notes = React.useMemo(() => {
    let sorted = [...(notesRaw as any[])];
    if (sort === 'alpha') sorted.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === 'oldest') {
      sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return sorted;
  }, [notesRaw, sort]);

  const deleteMutation = useDeleteNote();
  const updateMutation = useUpdateNote();

  const handleShare = async () => {
    const shareUrl = window.location.href;

    try {
      if (navigator.share) {
        // Sending ONLY the URL can sometimes force apps to recognize it as clickable
        await navigator.share({
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Error sharing:', err);
      }
    }
  };

  const translateNote = (note: Note) => {
    if (language === 'en') return { title: note.title, content: note.content.replace(/<[^>]*>/g, '') };
    
    // Simple mock translation for demo purposes
    const translations: Record<string, { title: string, content: string }> = {
      'Advanced Asyncio Patterns': {
        title: 'उन्नत Asyncio पैटर्न्स',
        content: 'पायथन अनुप्रयोगों के लिए समवर्ती मॉडल और इवेंट लूप प्रबंधन की खोज...'
      },
      'Graph Traversal Optimization': {
        title: 'ग्राफ ट्रैवर्सल ऑप्टिमाइज़ेशन',
        content: 'बड़े पैमाने पर सामाजिक नेटवर्क विश्लेषण के लिए BFS और DFS का अनुकूलन...'
      },
      'Custom Hook Lifecycle': {
        title: 'कस्टम हुक लाइफसाइकिल',
        content: 'जटिल राज्य प्रबंधन में निर्भरता सरणी और क्लोजर बासीपन को समझना...'
      }
    };

    const t = translations[note.title];
    if (t) return t;

    return {
      title: `[HI] ${note.title}`,
      content: `यह नोट अब हिंदी मोड में है। मूल सामग्री: ${note.content.replace(/<[^>]*>/g, '').substring(0, 50)}...`
    };
  };

  const getTopicColor = (topic: string) => noteColors[topic.toUpperCase()] || noteColors.DEFAULT;

  return (
    <div className="min-h-screen bg-[#0A0F1E] p-8 pb-24 overflow-y-auto custom-scrollbar">
      <div className="max-w-7xl mx-auto">
        
        {/* Topbar/Breadcrumb row */}
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-2 text-text-muted text-xs font-bold uppercase tracking-widest">
            <Link to={ROUTES.DASHBOARD} className="hover:text-primary transition-colors">DevSaathi</Link>
            <span>/</span>
            <span className="text-white">{t.title}</span>
          </div>
          <div className="flex items-center gap-4">

            <button 
              onClick={handleShare}
              className={cn(
                "bg-[#111827] border border-border/40 rounded-xl px-5 py-2.5 text-white text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all",
                copied ? "border-green-500/50 bg-green-500/10 text-green-500" : "hover:bg-bg-elevated"
              )}
            >
              {copied ? (
                <Clock size={16} className="animate-pulse" /> // Using Clock as a checkmark fallback if needed or just Check
              ) : (
                <Share2 size={16} className="text-primary" />
              )}
              {copied ? t.copied : t.share}
            </button>
          </div>
        </div>

        {/* Title and New Note button */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-white text-4xl font-black tracking-tight mb-2">
              {t.title}
            </h1>
            <p className="text-text-secondary text-sm font-medium tracking-wide">
              {t.desc}
            </p>
          </div>
          <Link to="/notes/new">
            <button className="bg-primary hover:bg-primary-light rounded-2xl px-8 py-4 text-white text-sm font-black uppercase tracking-[0.1em] flex items-center gap-3 transition-all shadow-xl shadow-primary/25 hover:-translate-y-1 active:translate-y-0">
              <Plus size={20} />
              {t.newNote}
            </button>
          </Link>
        </div>

        {/* Filter row */}
        <div className="bg-[#111827]/80 backdrop-blur-md border border-border/40 rounded-2xl p-4 flex flex-wrap items-center gap-4 mb-10 shadow-2xl">
          <div className="flex-1 min-w-[300px] relative group">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder={t.search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0A0F1E] border border-border/40 rounded-xl py-2.5 pl-11 pr-4 text-white text-sm outline-none focus:border-primary/50 transition-all placeholder:text-text-muted"
            />
          </div>

          <div className="flex items-center gap-2 p-1 bg-[#0A0F1E] border border-border/40 rounded-xl overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: t.all },
              { id: 'ai', label: t.ai },
              { id: 'mine', label: t.mine },
              { id: 'bookmarked', label: t.bookmarked }
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setFilter(p.id as any)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap",
                  filter === p.id 
                    ? "bg-primary text-white shadow-lg shadow-primary/20" 
                    : "text-text-muted hover:text-white"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <select 
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
              className="appearance-none bg-[#0A0F1E] border border-border/40 rounded-xl pl-4 pr-10 py-2.5 text-text-secondary text-xs font-bold hover:text-white hover:border-white/20 transition-all cursor-pointer outline-none focus:border-primary/50"
            >
              <option value="recent">{t.recent}</option>
              <option value="oldest">{t.oldest}</option>
              <option value="alpha">{t.alpha}</option>
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          </div>
        </div>

        {/* Notes Grid or Empty State */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-64 w-full rounded-[2rem]" />)}
          </div>
        ) : notes.length === 0 ? (
          <div className="py-20 flex justify-center">
            <EmptyState
              icon={BookOpen}
              title={search ? "No notes found" : "No notes yet"}
              description={search 
                ? "Try a different search term or category"
                : "Your AI-generated and personal notes will appear here. Start by exploring a topic!"}
              ctaLabel={!search ? "Explore a Topic" : undefined}
              ctaRoute={!search ? ROUTES.LEARN : undefined}
            />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {notes.map((note) => (
                <div 
                  key={note.id}
                  onClick={() => navigate(`/notes/${note.id}`)}
                  className="bg-bg-card border border-border/40 rounded-[2rem] p-6 cursor-pointer hover:border-primary/50 transition-all hover:shadow-2xl hover:shadow-primary/5 group relative overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-2">
                      <span className={cn("px-3 py-1 rounded-lg text-[10px] font-black tracking-widest border", getTopicColor(note.topic))}>
                        {note.topic}
                      </span>
                      {note.isAI && (
                        <Badge variant="primary" className="text-[10px] py-1">
                          <ArrowUpDown size={10} className="mr-1 inline" /> AI
                        </Badge>
                      )}
                    </div>
                  </div>

                  <h3 className="text-white text-xl font-black mb-3 group-hover:text-primary transition-colors leading-tight">
                    {translateNote(note).title}
                  </h3>
                  <p className="text-text-secondary text-sm font-medium line-clamp-3 mb-8 leading-relaxed">
                    {translateNote(note).content}
                  </p>

                  <div className="flex items-center justify-between pt-6 border-t border-border/10">
                    <div className="flex items-center gap-4 text-text-muted text-[10px] font-bold uppercase tracking-wider">
                      <span className="flex items-center gap-1.5"><Clock size={12} /> {note.wordCount} {t.words}</span>
                      <span>{note.createdAt}</span>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          updateMutation.mutate({ id: note.id, isBookmarked: !note.isBookmarked });
                        }}
                        className={cn("p-2 transition-colors", note.isBookmarked ? "text-yellow-500" : "text-text-muted hover:text-white")}
                        title={note.isBookmarked ? "Remove Bookmark" : "Add Bookmark"}
                      >
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="16" 
                          height="16" 
                          viewBox="0 0 24 24" 
                          fill={note.isBookmarked ? "currentColor" : "none"} 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        >
                          <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
                        </svg>
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/notes/${note.id}`);
                        }}
                        className="p-2 text-text-muted hover:text-white transition-colors"
                        title="Edit Note"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteId(note.id);
                        }}
                        className="p-2 text-text-muted hover:text-error transition-colors"
                        title="Delete Note"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {notes.length >= 9 && (
              <div className="flex justify-center">
                <button className="text-text-muted hover:text-white text-xs font-black uppercase tracking-widest flex items-center gap-2 group transition-all">
                  {language === 'en' ? 'Load more notes' : 'अधिक नोट्स लोड करें'}
                  <ChevronDown size={16} className="group-hover:translate-y-1 transition-transform" />
                </button>
              </div>
            )}
          </>
        )}

        {/* Delete Modal */}
        <Modal
          isOpen={!!deleteId}
          onClose={() => setDeleteId(null)}
          title={language === 'en' ? "Delete this note?" : "क्या यह नोट हटाना है?"}
        >
          <div className="p-6">
            <p className="text-text-secondary mb-8">
              {language === 'en' 
                ? "This action cannot be undone. This note will be permanently removed from your library."
                : "यह कार्रवाई वापस नहीं ली जा सकती। यह नोट आपकी लाइब्रेरी से स्थायी रूप से हटा दिया जाएगा।"}
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setDeleteId(null)}
                className="flex-1 px-6 py-3 rounded-xl bg-bg-elevated text-white font-black uppercase tracking-widest text-xs hover:bg-bg-elevated/80 transition-all"
              >
                {language === 'en' ? 'Cancel' : 'रद्द करें'}
              </button>
              <button 
                onClick={() => deleteId && deleteMutation.mutate(deleteId, {
                  onSuccess: () => setDeleteId(null)
                })}
                className="flex-1 px-6 py-3 rounded-xl bg-error text-white font-black uppercase tracking-widest text-xs hover:bg-error/80 transition-all shadow-lg shadow-error/20"
              >
                {language === 'en' ? 'Yes, delete' : 'हाँ, हटाएँ'}
              </button>
            </div>
          </div>
        </Modal>

      </div>
    </div>
  );
};

export default NotesPage;
