import React from 'react';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

export type ToastVariant = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  variant?: ToastVariant;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ 
  message, 
  variant = 'info', 
  onClose 
}) => {
  const icons = {
    success: <CheckCircle2 className="text-success" size={20} />,
    error: <AlertCircle className="text-error" size={20} />,
    info: <Info className="text-primary" size={20} />,
  };

  const variants = {
    success: 'border-success/20 bg-success/5',
    error: 'border-error/20 bg-error/5',
    info: 'border-primary/20 bg-primary/5',
  };

  return (
    <div className={cn(
      "flex items-center gap-3 p-4 rounded-xl border backdrop-blur-md shadow-2xl animate-in slide-in-from-right-full duration-300 pointer-events-auto min-w-[300px]",
      variants[variant]
    )}>
      <div className="flex-shrink-0">{icons[variant]}</div>
      <p className="text-sm font-medium text-white flex-1">{message}</p>
      <button 
        onClick={onClose}
        className="p-1 rounded-lg hover:bg-white/10 text-text-muted hover:text-white transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default Toast;
