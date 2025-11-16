'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

type ToastItem = {
  id: number;
  message: string;
};

type ToastContextType = {
  toast: (message: string) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = (): ToastContextType => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
};

export const ToastProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string) => {
    setToasts((prev) => {
      const id = Date.now();
      const next = [...prev, { id, message }];
      // auto-dismiss each toast after 2.5s
      setTimeout(() => {
        setToasts((list) => list.filter((t) => t.id !== id));
      }, 2500);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto select-none rounded-lg border border-white/10 bg-[rgba(20,20,25,0.9)] px-4 py-3 text-sm text-white shadow-lg backdrop-blur-md',
              'animate-in fade-in slide-in-from-bottom-2 duration-200',
            )}
            role="status"
            aria-live="polite"
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};


