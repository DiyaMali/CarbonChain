import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

const ToastContext = createContext(null);

function normalizeToastArgs(defaultType, content, extra) {
  if (typeof content === "string") {
    if (typeof extra === "string") {
      return { title: content, message: extra, type: defaultType };
    }
    return {
      message: content,
      type: defaultType,
      ...(typeof extra === "object" && extra !== null ? extra : {}),
    };
  }
  if (typeof content === "object" && content !== null) {
    return { type: defaultType, ...content };
  }
  return { message: String(content ?? ""), type: defaultType };
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((toastInput) => {
    if (!toastInput) return null;
    const config =
      typeof toastInput === "string"
        ? { message: toastInput, type: "info" }
        : toastInput;

    const id = config.id || `toast_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const newToast = {
      id,
      title: config.title || null,
      message: config.message || "",
      type: config.type || "success",
      duration: typeof config.duration === "number" ? config.duration : 5000,
    };

    setToasts((prev) => [...prev, newToast]);

    if (newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }
    return id;
  }, [removeToast]);

  const success = useCallback(
    (content, extra) => addToast(normalizeToastArgs("success", content, extra)),
    [addToast]
  );
  const error = useCallback(
    (content, extra) => addToast(normalizeToastArgs("error", content, extra)),
    [addToast]
  );
  const info = useCallback(
    (content, extra) => addToast(normalizeToastArgs("info", content, extra)),
    [addToast]
  );
  const warning = useCallback(
    (content, extra) => addToast(normalizeToastArgs("warning", content, extra)),
    [addToast]
  );

  const contextValue = useMemo(() => {
    const fn = (content, extra) => addToast(normalizeToastArgs("info", content, extra));
    fn.addToast = addToast;
    fn.removeToast = removeToast;
    fn.success = success;
    fn.error = error;
    fn.info = info;
    fn.warning = warning;
    return fn;
  }, [addToast, removeToast, success, error, info, warning]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {/* Toast Render Area - Fixed bottom-right, non-blocking */}
      <div
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
        aria-live="polite"
      >
        {toasts.map((toast) => {
          const isSuccess = toast.type === "success";
          const isError = toast.type === "error";
          const isWarning = toast.type === "warning";

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
                  : isWarning
                  ? "bg-white border-amber-300 text-stone-900 shadow-amber-950/5"
                  : "bg-white border-stone-200 text-stone-900"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  isSuccess
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : isError
                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                    : isWarning
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-stone-50 text-stone-700 border border-stone-200"
                }`}
              >
                {isSuccess && <CheckCircle2 className="w-4 h-4" />}
                {isError && <AlertCircle className="w-4 h-4" />}
                {isWarning && <AlertTriangle className="w-4 h-4" />}
                {!isSuccess && !isError && !isWarning && <Info className="w-4 h-4" />}
              </div>

              <div className="flex-1 min-w-0 pr-1">
                {toast.title ? (
                  <>
                    <h4
                      className={`text-xs font-semibold leading-tight ${
                        isSuccess
                          ? "text-emerald-900"
                          : isError
                          ? "text-rose-900"
                          : isWarning
                          ? "text-amber-900"
                          : "text-stone-900"
                      }`}
                    >
                      {toast.title}
                    </h4>
                    {toast.message && (
                      <p className="text-[11px] text-stone-600 mt-0.5 leading-relaxed break-words">
                        {toast.message}
                      </p>
                    )}
                  </>
                ) : (
                  <p
                    className={`text-xs font-medium leading-relaxed break-words ${
                      isSuccess
                        ? "text-emerald-950"
                        : isError
                        ? "text-rose-950"
                        : isWarning
                        ? "text-amber-950"
                        : "text-stone-900"
                    }`}
                  >
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

const noop = () => {};
const fallbackToast = (content, extra) => {};
fallbackToast.addToast = noop;
fallbackToast.removeToast = noop;
fallbackToast.success = noop;
fallbackToast.error = noop;
fallbackToast.info = noop;
fallbackToast.warning = noop;

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return fallbackToast;
  }
  return context;
}

export const toast = fallbackToast;
