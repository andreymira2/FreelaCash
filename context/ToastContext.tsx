import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  }, [removeToast]);

  const showSuccess = useCallback((message: string) => showToast(message, 'success'), [showToast]);
  const showError = useCallback((message: string) => showToast(message, 'error'), [showToast]);
  const showWarning = useCallback((message: string) => showToast(message, 'warning'), [showToast]);

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success': return <CheckCircle size={20} className="text-green-400" />;
      case 'error': return <XCircle size={20} className="text-red-400" />;
      case 'warning': return <AlertCircle size={20} className="text-amber-400" />;
    }
  };

  const getBgColor = (type: ToastType) => {
    switch (type) {
      case 'success': return 'bg-green-900/90 border-green-700';
      case 'error': return 'bg-red-900/90 border-red-700';
      case 'warning': return 'bg-amber-900/90 border-amber-700';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning }}>
      {children}
      <div className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:w-80 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`${getBgColor(toast.type)} border rounded-xl p-4 shadow-lg flex items-start gap-3 animate-in slide-in-from-bottom-4 duration-300 pointer-events-auto`}
          >
            {getIcon(toast.type)}
            <p className="flex-1 text-sm text-white font-medium">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={14} className="text-white/60" />
            </button>
          </div>
        ))}
      </div>
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
