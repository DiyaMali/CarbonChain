import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ title, message, type = "success", duration = 5000 }) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const newToast = { id, title, message, type, duration };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {/* Toast Render Area - Fixed bottom-right, non-blocking */}
      <div
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
        aria-live="polite"
      >
        {toasts.map((toast) => {
          const isSuccess = toast.type === "success";
          const isError = toast.type === "error";

          return (
            <div
              key={toast.id}
              role="alert"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Escape") removeToast(toast.id);
              }}
              className={`pointer-events-auto p-3.5 rounded border shadow-lg flex items-start gap-3 transition-all animate-fade-in ${
                isSuccess
                  ? "bg-white border-emerald-300 text-stone-900 shadow-emerald-950/5"
                  : isError
                  ? "bg-white border-rose-300 text-stone-900 shadow-rose-950/5"
                  : "bg-white border-stone-200 text-stone-900"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  isSuccess
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : isError
                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                    : "bg-stone-50 text-stone-700 border border-stone-200"
                }`}
              >
                {isSuccess && <CheckCircle2 className="w-4 h-4" />}
                {isError && <AlertCircle className="w-4 h-4" />}
                {!isSuccess && !isError && <Info className="w-4 h-4" />}
              </div>

              <div className="flex-1 min-w-0 pr-1">
                {toast.title && (
                  <h4
                    className={`text-xs font-semibold leading-tight ${
                      isSuccess ? "text-emerald-900" : isError ? "text-rose-900" : "text-stone-900"
                    }`}
                  >
                    {toast.title}
                  </h4>
                )}
                {toast.message && (
                  <p className="text-[11px] text-stone-600 mt-0.5 leading-relaxed break-words">
                    {toast.message}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-stone-400 hover:text-stone-700 p-0.5 rounded cursor-pointer shrink-0"
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      addToast: () => {},
      removeToast: () => {},
    };
  }
  return context;
}
