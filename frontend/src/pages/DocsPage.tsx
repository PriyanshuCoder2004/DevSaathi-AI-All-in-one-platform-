import React, { useState } from 'react';
import axios from 'axios';

import { 
  UploadCloud, 
  FileText, 
  Search, 
  Bell, 
  Settings, 
  ChevronRight, 
  Upload, 
  Sparkles,
  Loader2,
  Clock,
  Eye
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '../lib/utils';
import { ROUTES } from '../constants/routes';
import EmptyState from '../components/ui/EmptyState';
import Badge from '../components/ui/Badge';
import type { DocSummary } from '../types';
import api from '../lib/api';

import { useDocsHistory } from '../hooks/useDocsHistory';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../lib/translations';
import { useGetUploadUrl } from '../hooks/useNoteDocsHooks';


const DocsPage: React.FC = () => {
  const { language } = useLanguage();
  const t = translations[language].docs;
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFileName, setUploadingFileName] = useState('');
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const commonT = translations[language].common;
  const dashboardT = translations[language].dashboard;

  const labels = {
    en: {
      subtitle: 'Upload any technical doc and get a plain-English summary in seconds.',
      dropzoneTitle: 'Drag & drop your PDF or Markdown file here',
      or: 'or',
      browse: 'Browse files',
      supported: 'SUPPORTED: PDF, .MD, .TXT — MAX SIZE 10MB',
      uploading: 'Uploading document to secure servers...',
      analyzing: 'Analyzing document with DevSaathi AI...',
      recentUploads: 'Recent Uploads',
      historyDesc: 'Your history of analyzed documentation',
      viewAll: 'VIEW ALL',
      summarized: 'SUMMARIZED',
      viewSummary: 'View Summary',
      proTip: 'Pro-Tip: Multi-doc Context',
      proTipDesc: 'You can link multiple uploaded documents in the Learn module to generate comparative analysis or complex architecture summaries across your entire project stack.',
      tryLearn: 'Try in Learn Mode'
    },
    hi: {
      subtitle: 'किसी भी तकनीकी दस्तावेज़ को अपलोड करें और सेकंडों में सरल-हिंदी सारांश प्राप्त करें।',
      dropzoneTitle: 'अपनी PDF या Markdown फ़ाइल को यहाँ ड्रैग और ड्रॉप करें',
      or: 'या',
      browse: 'फ़ाइलें चुनें',
      supported: 'समर्थित: PDF, .MD, .TXT — अधिकतम आकार 10MB',
      uploading: 'सुरक्षित सर्वर पर दस्तावेज़ अपलोड किया जा रहा है...',
      analyzing: 'DevSaathi AI के साथ दस्तावेज़ का विश्लेषण किया जा रहा है...',
      recentUploads: 'हाल के अपलोड',
      historyDesc: 'आपके विश्लेषण किए गए दस्तावेज़ों का इतिहास',
      viewAll: 'सभी देखें',
      summarized: 'सारांशित',
      viewSummary: 'सारांश देखें',
      proTip: 'प्रो-टिप: मल्टी-डॉक संदर्भ',
      proTipDesc: 'आप अपने संपूर्ण प्रोजेक्ट स्टैक में तुलनात्मक विश्लेषण या जटिल आर्किटेक्चर सारांश उत्पन्न करने के लिए लर्न मॉड्यूल में कई अपलोड किए गए दस्तावेज़ों को लिंक कर सकते हैं।',
      tryLearn: 'लर्न मोड में आज़माएं'
    }
  };

  const l = labels[language];
  const { data: docsHistory = [], isLoading } = useDocsHistory();

  const filteredDocs = docsHistory.filter(doc => 
    doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    doc.filename?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim() && filteredDocs.length > 0) {
      navigate(`/docs/summary/${filteredDocs[0].id}?lang=${language}`);
    }
  };
  const getUploadUrlMutation = useGetUploadUrl();

  const handleFileAction = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      alert(language === 'hi' ? 'फ़ाइल 10MB की सीमा से अधिक है' : 'File exceeds 10MB limit');
      return;
    }
    
    setUploadingFileName(file.name);
    setIsUploading(true);
    setUploadProgress(10);
    
    try {
      setUploadProgress(30);
      
      // 2. Upload through our backend proxy (bypasses S3 CORS)
      const reader = new FileReader();
      const fileDataPromise = new Promise<string>((resolve) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(file);
      });

      const fileData = await fileDataPromise;
      setUploadProgress(60);

      const { s3Key } = await api.post('/docs/upload', {
        filename: file.name,
        fileData,
        contentType: file.type || 'application/octet-stream'
      });
      
      setUploadProgress(100);
      
      // 3. Navigate to summary page (which will trigger summarization)
      setIsUploading(false);
      navigate(`/docs/summary/new?s3Key=${s3Key}&filename=${encodeURIComponent(file.name)}&lang=${language}`);
      
    } catch (error: any) {

      setIsUploading(false);
      alert(error.message || 'Upload failed');
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileAction(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileAction(file);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600));
    
    if (diffInHours < 1) return language === 'hi' ? 'अभी-अभी' : 'Just now';
    if (diffInHours < 24) return language === 'hi' ? `आज, ${date.toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' })}` : `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    if (diffInHours < 48) return language === 'hi' ? 'कल' : 'Yesterday';
    return language === 'hi' ? `${Math.floor(diffInHours / 24)} दिन पहले` : `${Math.floor(diffInHours / 24)} days ago`;
  };

  return (
    <div className="flex flex-col h-full bg-bg-primary">
      {/* TOPBAR */}
      <header className="flex justify-between items-center px-8 h-14 border-b border-border/40 bg-bg-primary/80 backdrop-blur-md flex-shrink-0 z-10">
        <h1 className="text-primary font-semibold text-sm">{t.title}</h1>
        
        <div className="flex items-center gap-6">
          <div className="bg-bg-card border border-border/40 rounded-xl px-4 py-1.5 flex items-center gap-2 w-72 focus-within:border-primary/50 transition-all">
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
      </header>

      {/* CONTENT */}
      <main className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h2 className="text-white text-3xl font-bold tracking-tight">{t.uploadTitle}</h2>
            <p className="text-text-secondary text-sm mt-1">
              {l.subtitle}
            </p>
          </div>

          {/* DROPZONE */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
            className={cn(
              "border-2 border-dashed rounded-3xl p-16 flex flex-col items-center justify-center",
              "min-h-[280px] transition-all cursor-pointer relative overflow-hidden",
              isDragging 
                ? "border-primary bg-primary/5 scale-[0.99] shadow-2xl shadow-primary/10" 
                : "border-border/60 bg-bg-card/50 hover:border-primary/50 hover:bg-bg-elevated/50"
            )}
          >
            {/* Animated background blobs for hover effect */}
            <div className="absolute inset-0 pointer-events-none opacity-0 hover:opacity-10 transition-opacity">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary rounded-full blur-[80px]"></div>
            </div>

            <div className="bg-bg-elevated rounded-2xl p-5 mb-6 shadow-xl border border-border/40 group-hover:scale-110 transition-transform">
              <UploadCloud size={36} className={cn("transition-colors", isDragging ? "text-primary" : "text-text-muted")} />
            </div>
            
            <p className="text-white font-semibold text-lg text-center">
              {l.dropzoneTitle}
            </p>
            <p className="text-text-muted text-sm mt-2">{l.or}</p>
            
            <label className="mt-3 relative">
              <span className="text-primary font-bold hover:text-primary-light cursor-pointer transition-colors px-6 py-2 bg-primary/10 rounded-full border border-primary/20 hover:bg-primary/20">
                {l.browse}
              </span>
              <input type="file" accept=".pdf,.md,.txt" className="hidden" onChange={handleFileSelect}/>
            </label>
            
            <div className="mt-8 flex items-center gap-6 text-center">
              <p className="text-text-muted text-[10px] uppercase tracking-[0.2em] font-bold border-t border-border/20 pt-4 px-4">
                {l.supported}
              </p>
            </div>
          </div>

          {/* UPLOAD PROGRESS */}
          {isUploading && (
            <div className="mt-6 bg-bg-card border border-border/40 rounded-2xl p-6 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Upload size={18} className="text-primary animate-pulse" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white font-medium text-sm truncate max-w-[300px]">{uploadingFileName}</span>
                    <span className="text-primary font-bold text-sm">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-bg-elevated rounded-full h-2 overflow-hidden border border-border/20">
                    <div 
                      className="bg-primary h-full rounded-full transition-all duration-300 relative" 
                      style={{width: `${uploadProgress}%`}}
                    >
                      <div className="absolute inset-0 bg-white/20 animate-shimmer" style={{backgroundSize: '200% 100%'}}></div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-text-muted text-xs flex items-center gap-2 italic">
                <Loader2 size={12} className="animate-spin" />
                {uploadProgress < 100 ? l.uploading : l.analyzing}
              </p>
            </div>
          )}

          {/* RECENT UPLOADS */}
          <section className="mt-12 mb-16">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h3 className="text-white text-xl font-bold">{l.recentUploads}</h3>
                <p className="text-text-muted text-xs mt-1">{l.historyDesc}</p>
              </div>
              {docsHistory.length > 3 && (
                <button className="text-primary text-[10px] font-black uppercase tracking-widest hover:text-primary-light flex items-center gap-1 group">
                  {l.viewAll} <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-bg-card/50 border border-border/20 rounded-2xl animate-pulse"></div>
                ))}
              </div>
            ) : docsHistory.length === 0 ? (
              <EmptyState
                icon={FileText}
                title={language === 'hi' ? 'अभी तक कोई दस्तावेज़ अपलोड नहीं किया गया' : 'No documents uploaded yet'}
                description={language === 'hi' ? 'तत्काल AI सारांश प्राप्त करने के लिए अपनी पहली PDF या Markdown फ़ाइल अपलोड करें' : 'Upload your first PDF or Markdown file to get an instant AI summary'}
              />
            ) : filteredDocs.length === 0 ? (
              <EmptyState
                icon={Search}
                title={language === 'hi' ? 'कोई परिणाम नहीं मिला' : 'No results found'}
                description={language === 'hi' ? 'आपके खोज से मेल खाने वाला कोई दस्तावेज़ नहीं मिला' : 'No documents match your search query'}
              />
            ) : (
              <div className="space-y-4">
                {filteredDocs.map((doc) => (
                  <div key={doc.id} className="group bg-bg-card/40 hover:bg-bg-elevated/60 border border-border/40 rounded-2xl p-4 flex items-center gap-4 transition-all hover:shadow-xl hover:shadow-black/20 hover:-translate-y-0.5">
                    <div className={cn(
                      "rounded-xl p-3 flex items-center justify-center transition-transform group-hover:scale-110",
                      doc.filename.endsWith('.pdf') 
                        ? "bg-error/10 text-error border border-error/20" 
                        : "bg-primary/10 text-primary border border-primary/20"
                    )}>
                      <FileText size={20} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-semibold text-sm truncate group-hover:text-primary transition-colors">{doc.title}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-text-muted text-[10px] font-medium uppercase tracking-wider">{formatFileSize(doc.fileSize)}</span>
                        <span className="w-1 h-1 bg-border/60 rounded-full"></span>
                        <span className="text-text-muted text-[10px] flex items-center gap-1">
                          <Clock size={10} />
                          {getRelativeTime(doc.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <Badge variant="success" className="text-[9px] font-black uppercase tracking-widest">
                        {l.summarized}
                      </Badge>
                      <Link 
                        to={`/docs/summary/${doc.id}?lang=${language}`}
                        className="flex items-center gap-1.5 text-primary text-xs font-bold hover:underline bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/10 transition-all hover:bg-primary/10"
                      >
                        {l.viewSummary}
                        <Eye size={12} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* PRO-TIP CARD */}
          <div className="bg-gradient-to-br from-bg-elevated to-bg-card border border-primary/20 rounded-2xl p-6 flex items-start gap-4 shadow-lg relative overflow-hidden group">
            {/* Background design elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[40px] -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors"></div>
            
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 flex-shrink-0">
              <Sparkles size={20} className="text-primary animate-pulse" />
            </div>
            
            <div className="flex-1">
              <h4 className="text-white font-bold text-base flex items-center gap-2">
                {l.proTip}
              </h4>
              <p className="text-text-secondary text-sm mt-1 leading-relaxed max-w-2xl">
                {l.proTipDesc}
              </p>
              <Link to={ROUTES.LEARN} className="inline-flex items-center gap-1.5 text-primary text-xs font-bold mt-4 hover:gap-2 transition-all">
                {l.tryLearn} <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DocsPage;
