import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  GraduationCap, 
  Code2, 
  FileText, 
  BookOpen, 
  BarChart2, 
  Settings, 
  LogOut,
  History
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../lib/translations';
import { cn } from '../../lib/utils';
import Badge from '../ui/Badge';

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const { language } = useLanguage();
  const t = translations[language].sidebar;

  const navItems = [
    { icon: LayoutDashboard, label: t.dashboard, path: '/dashboard' },
    { icon: GraduationCap, label: t.learn, path: '/learn' },
    { icon: Code2, label: t.code, path: '/code' },
    { icon: FileText, label: t.docs, path: '/docs' },
    { icon: BookOpen, label: t.notes, path: '/notes' },
    { icon: History, label: t.history, path: '/activity' },
    { icon: BarChart2, label: t.progress, path: '/progress' },
  ];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-[240px] bg-bg-secondary border-r border-border flex flex-col z-50">
      {/* TOP: Logo Area */}
      <div className="py-5 px-5 border-b border-border">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-white font-bold text-lg">D</span>
          </div>
          <div className="ml-3">
            <h1 className="text-white font-bold text-sm leading-none">DevSaathi AI</h1>
            <p className="text-[9px] text-text-muted uppercase tracking-[0.15em] mt-1 font-semibold">
              {t.slogan}
            </p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="px-4 py-3 border-b border-border flex items-center gap-3">
        <div className="bg-primary w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-inner overflow-hidden">
          {user?.avatar ? (
            <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            user?.name ? getInitials(user.name) : 'U'
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-white text-sm font-medium truncate">
            {user?.name || 'User'}
          </h2>
          <Badge variant="primary" className="mt-0.5">
            {t.proMember}
          </Badge>
        </div>
      </div>

      {/* MIDDLE NAV */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          const Icon = item.icon;
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-lg cursor-pointer transition-all duration-150 text-sm group',
                isActive 
                  ? 'bg-primary/10 text-white border-l-2 border-primary pl-[14px]' 
                  : 'text-text-secondary hover:bg-bg-hover hover:text-white'
              )}
            >
              <Icon 
                size={18} 
                className={cn(
                  'transition-colors',
                  isActive ? 'text-primary' : 'text-text-muted group-hover:text-white'
                )} 
              />
              <span className="font-medium">
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>

      {/* BOTTOM */}
      <div className="px-3 pb-4 border-t border-border pt-3 space-y-1">
        <NavLink
          to="/settings"
          className={cn(
            'flex items-center gap-3 px-4 py-2.5 rounded-lg cursor-pointer transition-all duration-150 text-sm group',
            location.pathname === '/settings' 
              ? 'bg-primary/10 text-white border-l-2 border-primary pl-[14px]' 
              : 'text-text-secondary hover:bg-bg-hover hover:text-white'
          )}
        >
          <Settings 
            size={18} 
            className={cn(
              'transition-colors',
              location.pathname === '/settings' ? 'text-primary' : 'text-text-muted group-hover:text-white'
            )} 
          />
          <span className="font-medium">{t.settings}</span>
        </NavLink>

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg cursor-pointer transition-all duration-150 text-sm text-text-secondary hover:bg-error/10 hover:text-error group"
        >
          <LogOut 
            size={18} 
            className="text-text-muted group-hover:text-error transition-colors" 
          />
          <span className="font-medium">{t.logout}</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
