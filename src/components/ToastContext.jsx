import { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastCtx = createContext(null);
export function useToast() {
  const ctx = useContext(ToastCtx);
  // Safe no-op fallback if provider is missing
  return ctx || { showToast: () => {} };
}

let nextId = 1;

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    if (timers.current[id]) { clearTimeout(timers.current[id]); delete timers.current[id]; }
  }, []);

  const showToast = useCallback((message, opts = {}) => {
    const id = nextId++;
    const duration = opts.duration ?? (opts.actionLabel ? 5000 : 2600);
    const toast = {
      id,
      message,
      type: opts.type || 'info',
      icon: opts.icon,
      actionLabel: opts.actionLabel,
      onAction: opts.onAction,
    };
    setToasts(prev => [...prev.slice(-2), toast]); // keep max 3
    timers.current[id] = setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  return (
    <ToastCtx.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[400] flex flex-col items-center gap-2 pointer-events-none w-full max-w-md px-4">
        {toasts.map(t => (
          <div
            key={t.id}
            className="pointer-events-auto w-full flex items-center gap-3 px-4 py-2.5 rounded-xl shadow-lg border bg-gray-900 border-gray-700 text-white animate-in slide-in-from-bottom-2 fade-in duration-200"
          >
            <span className="text-base shrink-0">
              {t.icon || (t.type === 'success' ? '✓' : t.type === 'undo' ? '🗑️' : t.type === 'error' ? '⚠️' : 'ℹ️')}
            </span>
            <span className="text-sm flex-1 min-w-0 truncate">{t.message}</span>
            {t.actionLabel && (
              <button
                onClick={() => { t.onAction?.(); dismiss(t.id); }}
                className="text-sm font-bold text-indigo-300 hover:text-indigo-200 shrink-0 px-1"
              >
                {t.actionLabel}
              </button>
            )}
            <button
              onClick={() => dismiss(t.id)}
              className="text-gray-400 hover:text-white shrink-0"
              aria-label="Stäng"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
