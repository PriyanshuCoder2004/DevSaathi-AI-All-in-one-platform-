import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {createPortal(
        <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={cn(
                "pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border min-w-[320px] max-w-[420px] animate-in slide-in-from-right-8 duration-300",
                toast.type === 'success' && "bg-success/10 border-success/30 text-success",
                toast.type === 'error' && "bg-error/10 border-error/30 text-error",
                toast.type === 'info' && "bg-primary/10 border-primary/30 text-primary"
              )}
            >
              {toast.type === 'success' && <CheckCircle size={18} />}
              {toast.type === 'error' && <AlertCircle size={18} />}
              {toast.type === 'info' && <Info size={18} />}
              
              <p className="flex-1 text-sm font-medium">{toast.message}</p>
              
              <button 
                onClick={() => removeToast(toast.id)}
                className="opacity-60 hover:opacity-100 transition-opacity"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
