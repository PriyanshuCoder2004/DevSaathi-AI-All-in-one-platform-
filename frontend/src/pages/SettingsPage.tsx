import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Lock, 
  Bell, 
  Globe, 
  Trash2, 
  Download, 
  ShieldCheck, 
  Smartphone,
  HardDrive,
  LogOut,
  Save,
  CheckCircle2,
  Loader2,
  ChevronRight,
  Monitor,
  Settings
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { updateUserAttributes } from 'aws-amplify/auth';
import { cn } from '../lib/utils';
import Badge from '../components/ui/Badge';

const SettingsPage: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const { language: globalLanguage, setLanguage: setGlobalLanguage } = useLanguage();
  const navigate = useNavigate();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Form States
  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState<string | null>(user?.avatar || null);
  const [language, setLanguage] = useState<'en' | 'hi'>(user?.language || 'en');
  const [expLevel, setExpLevel] = useState<'beginner' | 'intermediate' | 'advanced'>(user?.level || 'intermediate');
  const [notifications, setNotifications] = useState(user?.notifications || {
    email: true,
    push: false
  });

  // Password Modal States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Sync local state when global user changes (e.g. on refresh)
  React.useEffect(() => {
    if (user?.avatar !== undefined) setAvatar(user.avatar || null);
    if (user?.name) setName(user.name);
    if (user?.language) setLanguage(user.language);
    if (user?.level) setExpLevel(user.level);
    if (user?.notifications) setNotifications(user.notifications);
  }, [user]);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        
        // Compress image using canvas to avoid DynamoDB size limits
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 256;
          const MAX_HEIGHT = 256;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setAvatar(compressedDataUrl);
          
          if (user?.email) {
            localStorage.setItem('last_user_email', user.email);
          }
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      // 1. Update Cognito attributes (name)
      if (data.name !== user?.name) {
        await updateUserAttributes({
          userAttributes: {
            name: data.name
          }
        });
      }

      // 2. Update DynamoDB preferences via API
      const api = (await import('../lib/api')).default;
      await api.patch('/user/preferences', {
        language: data.language,
        level: data.expLevel,
        notifications: data.notifications,
        avatar: data.avatar
      });

      return data;
    },
    onSuccess: (data) => {
      updateUser({ ...user, name, avatar: data.avatar, language, level: expLevel, notifications });
      setGlobalLanguage(language);
      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 3000);
    },
    onError: (error) => {
      console.error("Failed to save changes:", error);
      alert(`Error: ${error.message}`);
    }
  });

  const handleSave = () => {
    saveMutation.mutate({ name, language, expLevel, notifications, avatar });
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    // Mock password update
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsPasswordModalOpen(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    alert('Password updated successfully! (Mock)');
  };

  const handleLogout = async () => {
    await logout();
    window.location.replace('/');
  };

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      const api = (await import('../lib/api')).default;
      const data = await api.get('/dashboard/export');
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `devsaathi_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export data', err);
      alert('Failed to export data. Please try again later.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    const message = globalLanguage === 'hi' 
      ? 'क्या आप वाकई अपना खाता हटाना चाहते हैं? यह क्रिया वापस नहीं ली जा सकती और आपकी सभी सीखने की प्रगति, नोट्स और गतिविधि मिटा दी जाएगी।'
      : 'Are you absolutely sure you want to delete your account? This action cannot be undone and will erase all your learning progress, notes, and activity.';
      
    if (!window.confirm(message)) {
      return;
    }
    
    try {
      setIsDeleting(true);
      const api = (await import('../lib/api')).default;
      await api.delete('/user/account');
      alert(globalLanguage === 'hi' ? 'खाता सफलतापूर्वक हटा दिया गया।' : 'Account deleted successfully.');
      handleLogout();
    } catch (err) {
      console.error('Failed to delete account', err);
      alert(globalLanguage === 'hi' ? 'खाता हटाने में विफल।' : 'Failed to delete account.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Comprehensive translations
  const t = {
    settings: globalLanguage === 'hi' ? 'सेटिंग्स' : 'Settings',
    description: globalLanguage === 'hi' ? 'अपने खाते, प्राथमिकताओं और डेटा गोपनीयता को प्रबंधित करें।' : 'Manage your account, preferences, and data privacy.',
    account: globalLanguage === 'hi' ? 'खाता' : 'Account',
    preferences: globalLanguage === 'hi' ? 'प्राथमिकताएं' : 'Preferences',
    langLabel: globalLanguage === 'hi' ? 'भाषा' : 'Language',
    langDesc: globalLanguage === 'hi' ? 'अपनी पसंदीदा इंटरफ़ेस भाषा चुनें' : 'Select your preferred interface language',
    fullName: globalLanguage === 'hi' ? 'पूरा नाम' : 'Full Name',
    emailAddr: globalLanguage === 'hi' ? 'ईमेल पता' : 'Email Address',
    changePass: globalLanguage === 'hi' ? 'पासवर्ड बदलें' : 'Change Password',
    expLevel: globalLanguage === 'hi' ? 'अनुभव का स्तर' : 'Experience Level',
    notifChannels: globalLanguage === 'hi' ? 'अधिसूचना चैनल' : 'Notification Channels',
    emailNotif: globalLanguage === 'hi' ? 'ईमेल सूचनाएं' : 'Email Notifications',
    pushNotif: globalLanguage === 'hi' ? 'ब्राउज़र पुश सूचनाएं' : 'Browser Push Notifications',
    data: globalLanguage === 'hi' ? 'डेटा' : 'Data',
    manageWorkspace: globalLanguage === 'hi' ? 'अपना कार्यक्षेत्र प्रबंधित करें' : 'Manage Your Workspace',
    downloadArchive: globalLanguage === 'hi' ? 'अपनी सीखने की प्रगति, कोड स्निपेट्स और कस्टम AI प्रतिक्रियाओं का एक पूरा संग्रह डाउनलोड करें।' : 'Download a full archive of your learning progress, code snippets, and custom AI responses.',
    exportData: globalLanguage === 'hi' ? 'डेटा निर्यात करें' : 'Export Data',
    deleteAccount: globalLanguage === 'hi' ? 'खाता हटाएं' : 'Delete Account',
    signOut: globalLanguage === 'hi' ? 'देवसाथी AI से साइन आउट करें' : 'Sign out of DevSaathi AI',
    unsaved: globalLanguage === 'hi' ? 'बिना सहेजे गए बदलाव मिले' : 'Unsaved changes detected',
    saveChanges: globalLanguage === 'hi' ? 'बदलाव सहेजें' : 'Save Changes',
    saving: globalLanguage === 'hi' ? 'सहेज रहे हैं...' : 'Saving...',
    savedSuccess: globalLanguage === 'hi' ? 'सफलतापूर्वक सहेजा गया ✓' : 'Saved Successfully ✓',
    sysStatus: globalLanguage === 'hi' ? 'सिस्टम स्थिति' : 'System Status',
    storageUsed: globalLanguage === 'hi' ? 'भंडारण उपयोग' : 'Storage Used',
    cloudSync: globalLanguage === 'hi' ? 'क्लाउड सिंक' : 'Cloud Sync',
    editPhoto: globalLanguage === 'hi' ? 'प्रोफ़ाइल फ़ोटो बदलें' : 'Edit profile photo',
    memberSince: globalLanguage === 'hi' ? 'जनवरी 2025 से सदस्य' : 'Member since Jan 2025',
    levels: {
      beginner: globalLanguage === 'hi' ? 'शुरुआती' : 'Beginner',
      intermediate: globalLanguage === 'hi' ? 'मध्यम' : 'Intermediate',
      advanced: globalLanguage === 'hi' ? 'उन्नत' : 'Advanced',
      begDesc: globalLanguage === 'hi' ? 'मानक संकेत और सरलीकृत स्पष्टीकरण।' : 'Standard hints and simplified explanations.',
      intDesc: globalLanguage === 'hi' ? 'अनुकूलित तर्क और संक्षिप्त सारांश।' : 'Optimized logic and concise summaries.',
      advDesc: globalLanguage === 'hi' ? 'न्यूनतम बॉयलरप्लेट और उन्नत तकनीकी जानकारी।' : 'Minimal boilerplate and advanced technical deep-dives.',
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F1E] p-8 pb-32 overflow-y-auto custom-scrollbar relative">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />
      
      {/* Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <div className="bg-bg-card border border-border/40 rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-white text-2xl font-bold mb-6">{t.changePass}</h3>
            <form onSubmit={handlePasswordChange} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">{globalLanguage === 'hi' ? 'वर्तमान पासवर्ड' : 'Current Password'}</label>
                <input 
                  type="password" 
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-[#0A0F1E] border border-border/40 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-primary/50"
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">{globalLanguage === 'hi' ? 'नया पासवर्ड' : 'New Password'}</label>
                <input 
                  type="password" 
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[#0A0F1E] border border-border/40 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-primary/50"
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">{globalLanguage === 'hi' ? 'पासवर्ड की पुष्टि करें' : 'Confirm New Password'}</label>
                <input 
                  type="password" 
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#0A0F1E] border border-border/40 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-primary/50"
                  placeholder="••••••••"
                />
              </div>
              
              {passwordError && <p className="text-error text-xs font-bold">{passwordError}</p>}
              
              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="flex-1 px-6 py-3 bg-[#111827] text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-bg-hover transition-all"
                >
                  {globalLanguage === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-6 py-3 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-primary-light shadow-lg shadow-primary/20 transition-all"
                >
                  {globalLanguage === 'hi' ? 'अपडेट करें' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-white text-4xl font-black tracking-tight mb-2">{t.settings}</h1>
          <p className="text-text-secondary text-sm font-medium tracking-wide">{t.description}</p>
        </div>

        <div className="grid grid-cols-[320px,1fr] gap-10 items-start">
          
          {/* Left Column — User Info & Status */}
          <aside className="space-y-6 sticky top-8">
            {/* User Profile Card */}
            <div className="bg-bg-card border border-border/40 rounded-[2rem] p-8 text-center shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent"></div>
              <div className="relative z-10">
                <div className="w-24 h-24 rounded-3xl bg-primary flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-primary/20 border border-white/10 group-hover:scale-105 transition-transform duration-500 overflow-hidden">
                  {avatar ? (
                    <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white text-3xl font-black tracking-tighter">{(user?.name || 'Priyanshu Arya').substring(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <h2 className="text-white text-2xl font-black tracking-tight mb-1">{user?.name || 'Priyanshu Arya'}</h2>
                <p className="text-text-secondary text-xs font-medium mb-6">{user?.email || 'priyanshu.arya@devsaathi.ai'}</p>
                
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#111827] border border-border/40 rounded-full mb-8">
                  <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{t.memberSince}</span>
                </div>

                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="text-primary text-[10px] font-black uppercase tracking-[0.2em] hover:text-primary-light transition-colors block w-full"
                >
                  {t.editPhoto}
                </button>
              </div>
            </div>

            {/* System Status Card */}
            <div className="bg-[#111827]/50 border border-border/40 rounded-[2rem] p-8 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <ShieldCheck size={18} className="text-primary" />
                <h3 className="text-white text-sm font-black uppercase tracking-widest">{t.sysStatus}</h3>
              </div>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center text-[10px] mb-2 font-bold uppercase tracking-wider">
                    <span className="text-text-secondary">{t.storageUsed}</span>
                    <span className="text-white">12.4 GB / 50 GB</span>
                  </div>
                  <div className="w-full bg-bg-card rounded-full h-1.5 border border-border/20">
                    <div className="bg-primary h-full rounded-full w-[25%] shadow-[0_0_12px_rgba(59,130,246,0.3)]"></div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Monitor size={14} className="text-text-muted" />
                    <span className="text-text-secondary text-xs font-medium">{t.cloudSync}</span>
                  </div>
                  <Badge variant="success" className="text-[8px] font-black px-2 py-0.5">ACTIVE</Badge>
                </div>
              </div>
            </div>
          </aside>

          {/* Right Column — Settings Form */}
          <main className="space-y-8">
            
            {/* Account Section */}
            <section className="bg-bg-card border border-border/40 rounded-[2.5rem] p-10 shadow-2xl">
              <div className="flex items-center gap-3 mb-10">
                <User size={24} className="text-primary" />
                <h3 className="text-white text-xl font-bold tracking-tight leading-none">{t.account}</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-8 mb-10">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{t.fullName}</label>
                  <div className="relative group">
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#0A0F1E] border border-border/40 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-primary/50 transition-all font-medium"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{t.emailAddr}</label>
                  <div className="relative group">
                    <input 
                      type="email" 
                      value={user?.email || 'priyanshu.arya@devsaathi.ai'} 
                      readOnly
                      className="w-full bg-[#0A0F1E]/50 border border-border/20 rounded-xl py-3 px-4 text-text-muted text-sm outline-none cursor-not-allowed font-medium"
                    />
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setIsPasswordModalOpen(true)}
                className="bg-primary hover:bg-primary-light text-white text-xs font-black uppercase tracking-widest px-6 py-3.5 rounded-xl flex items-center gap-2.5 transition-all shadow-lg shadow-primary/10 hover:-translate-y-0.5"
              >
                <Lock size={16} />
                {t.changePass}
              </button>
            </section>

            {/* Preferences Section */}
            <section className="bg-bg-card border border-border/40 rounded-[2.5rem] p-10 shadow-2xl">
              <div className="flex items-center gap-3 mb-10">
                <Settings size={24} className="text-primary" />
                <h3 className="text-white text-xl font-bold tracking-tight leading-none">{t.preferences}</h3>
              </div>

              <div className="space-y-10">
                {/* Language Selection */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-bold text-base mb-1">{t.langLabel}</h4>
                    <p className="text-text-secondary text-xs font-medium">{t.langDesc}</p>
                  </div>
                  <div className="flex bg-[#0A0F1E] border border-border/40 rounded-xl p-1 shadow-inner">
                    <button 
                      onClick={() => setLanguage('en')}
                      className={cn(
                        "px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                        language === 'en' ? "bg-primary text-white shadow-lg" : "text-text-muted hover:text-white"
                      )}
                    >
                      English
                    </button>
                    <button 
                      onClick={() => setLanguage('hi')}
                      className={cn(
                        "px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                        language === 'hi' ? "bg-primary text-white shadow-lg" : "text-text-muted hover:text-white"
                      )}
                    >
                      Hindi
                    </button>
                  </div>
                </div>

                {/* Experience Level */}
                <div>
                  <h4 className="text-white font-bold text-base mb-4">{t.expLevel}</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                      <button
                        key={level}
                        onClick={() => setExpLevel(level)}
                        className={cn(
                          "relative p-6 rounded-2xl border text-left transition-all hover:scale-[1.02] active:scale-[0.98]",
                          expLevel === level 
                            ? "bg-primary/5 border-primary shadow-lg shadow-primary/5" 
                            : "bg-[#0A0F1E] border-border/40 hover:border-primary/30"
                        )}
                      >
                        {expLevel === level && (
                          <span className="absolute top-0 right-4 -translate-y-1/2 bg-primary text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md shadow-lg">{globalLanguage === 'hi' ? 'सक्रिय' : 'Active'}</span>
                        )}
                        <h5 className={cn("font-black text-sm uppercase tracking-wider mb-1", expLevel === level ? "text-white" : "text-text-muted")}>
                          {t.levels[level]}
                        </h5>
                        <p className="text-text-secondary text-[10px] font-medium leading-relaxed">
                          {level === 'beginner' ? t.levels.begDesc : 
                           level === 'intermediate' ? t.levels.intDesc : 
                           t.levels.advDesc}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notifications */}
                <div>
                  <h4 className="text-white font-bold text-base mb-6">{t.notifChannels}</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-5 bg-[#0A0F1E] border border-border/40 rounded-2xl group hover:border-primary/20 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Mail size={18} className="text-primary" />
                        </div>
                        <span className="text-white text-sm font-bold">{t.emailNotif}</span>
                      </div>
                      <button 
                        onClick={() => setNotifications(n => ({ ...n, email: !n.email }))}
                        className={cn(
                          "w-12 h-6 rounded-full relative transition-all duration-300",
                          notifications.email ? "bg-primary shadow-lg shadow-primary/20" : "bg-[#1f2937]"
                        )}
                      >
                        <div className={cn(
                          "absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300",
                          notifications.email ? "left-7" : "left-1 shadow-sm"
                        )}></div>
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-5 bg-[#0A0F1E] border border-border/40 rounded-2xl group hover:border-primary/20 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-text-muted/10 rounded-lg">
                          <Bell size={18} className="text-text-muted" />
                        </div>
                        <span className="text-white text-sm font-bold">{t.pushNotif}</span>
                      </div>
                      <button 
                        onClick={() => setNotifications(n => ({ ...n, push: !n.push }))}
                        className={cn(
                          "w-12 h-6 rounded-full relative transition-all duration-300",
                          notifications.push ? "bg-primary shadow-lg shadow-primary/20" : "bg-[#1f2937]"
                        )}
                      >
                        <div className={cn(
                          "absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300",
                          notifications.push ? "left-7" : "left-1 shadow-sm"
                        )}></div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Data Section */}
            <section className="bg-bg-card border border-border/40 rounded-[2.5rem] p-10 shadow-2xl">
              <div className="flex items-center gap-3 mb-10">
                <HardDrive size={24} className="text-primary" />
                <h3 className="text-white text-xl font-bold tracking-tight leading-none">{t.data}</h3>
              </div>

              <div className="flex items-center justify-between p-8 bg-[#0A0F1E] border border-border/40 rounded-3xl relative overflow-hidden group">
                <div className="relative z-10">
                  <h4 className="text-white text-lg font-bold mb-2">{t.manageWorkspace}</h4>
                  <p className="text-text-secondary text-xs font-medium max-w-sm">{t.downloadArchive}</p>
                </div>
                <div className="flex gap-4 relative z-10">
                  <button 
                    onClick={handleExportData}
                    disabled={isExporting}
                    className="bg-[#111827] hover:bg-bg-elevated border border-border/40 rounded-xl px-6 py-2.5 text-text-secondary hover:text-white text-[10px] font-black uppercase tracking-widest transition-all group/btn flex items-center gap-2 disabled:opacity-50"
                  >
                    {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} className="group-hover/btn:translate-y-0.5 transition-transform" />}
                    {isExporting ? (globalLanguage === 'hi' ? 'निर्यात कर रहे हैं...' : 'Exporting...') : t.exportData}
                  </button>
                  <button 
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    className="flex items-center gap-2 bg-error/5 hover:bg-error/10 border border-error/20 rounded-xl px-6 py-2.5 text-error text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                  >
                    {isDeleting ? <Loader2 size={14} className="animate-spin" /> : null}
                    {isDeleting ? (globalLanguage === 'hi' ? 'हटा रहे हैं...' : 'Deleting...') : t.deleteAccount}
                  </button>
                </div>
              </div>
            </section>

            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 text-text-muted hover:text-error transition-all font-bold text-sm mx-auto group"
            >
              <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
              {t.signOut}
            </button>
          </main>
        </div>
      </div>

      {/* STICKY BOTTOM SAVE BAR */}
      <div className={cn(
        "fixed bottom-10 left-1/2 -translate-x-1/2 z-50 transition-all duration-500",
        (name !== user?.name || avatar !== (user?.avatar || null) || language !== user?.language || expLevel !== user?.level || JSON.stringify(notifications) !== JSON.stringify(user?.notifications || { email: true, push: false }) || saveMutation.isPending || showSavedToast) ? "translate-y-0 opacity-100 scale-100" : "translate-y-20 opacity-0 scale-95 pointer-events-none"
      )}>
        <div className="bg-[#111827]/90 backdrop-blur-xl border border-border/40 rounded-2xl p-3 flex items-center gap-6 shadow-2xl shadow-black/50">
          {showSavedToast ? (
            <div className="flex items-center gap-3 px-4 py-2 text-success font-black text-xs uppercase tracking-widest">
              <CheckCircle2 size={18} />
              {t.savedSuccess}
            </div>
          ) : (
            <>
              <p className="text-text-secondary text-[10px] font-black uppercase tracking-widest pl-4">{t.unsaved}</p>
              <button 
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="bg-primary hover:bg-primary-light rounded-xl px-8 py-3 text-white text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2.5 transition-all shadow-xl shadow-primary/20 disabled:opacity-70"
              >
                {saveMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {saveMutation.isPending ? t.saving : t.saveChanges}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
