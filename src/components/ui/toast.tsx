"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Icons } from "@/lib/icons";

type ToastType = "success" | "error" | "info";

interface IToastInput {
  title: string;
  description?: string;
  type?: ToastType;
  duration?: number;
}

interface IToastItem extends Required<Pick<IToastInput, "title" | "type" | "duration">> {
  id: string;
  description?: string;
}

interface IToastContextValue {
  toast: (input: IToastInput) => string;
  success: (input: Omit<IToastInput, "type">) => string;
  error: (input: Omit<IToastInput, "type">) => string;
  info: (input: Omit<IToastInput, "type">) => string;
  dismiss: (id: string) => void;
}

const DEFAULT_TOAST_DURATION = 3500;

const ToastContext = createContext<IToastContextValue | null>(null);

function createToastId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const TOAST_STYLES: Record<
  ToastType,
  {
    icon: typeof Icons.activate;
    chipKey: string;
    cardClass: string;
    iconWrapClass: string;
    iconClass: string;
    progressClass: string;
  }
> = {
  success: {
    icon: Icons.activate,
    chipKey: "toast.chip.success",
    cardClass:
      "border-emerald-200/90 bg-[linear-gradient(135deg,#ffffff_0%,#f2fff7_100%)] shadow-[0_20px_35px_rgba(16,185,129,0.18)] dark:border-emerald-800/70 dark:bg-[linear-gradient(135deg,#111318_0%,#102019_100%)] dark:shadow-[0_20px_35px_rgba(16,185,129,0.12)]",
    iconWrapClass: "bg-emerald-100/80 ring-1 ring-emerald-200 dark:bg-emerald-950/60 dark:ring-emerald-800/70",
    iconClass: "text-emerald-600 dark:text-emerald-400",
    progressClass: "bg-gradient-to-r from-emerald-400 to-emerald-600",
  },
  error: {
    icon: Icons.deactivate,
    chipKey: "toast.chip.error",
    cardClass:
      "border-rose-200/90 bg-[linear-gradient(135deg,#ffffff_0%,#fff1f3_100%)] shadow-[0_20px_35px_rgba(225,29,72,0.2)] dark:border-rose-800/70 dark:bg-[linear-gradient(135deg,#111318_0%,#241318_100%)] dark:shadow-[0_20px_35px_rgba(225,29,72,0.14)]",
    iconWrapClass: "bg-rose-100/80 ring-1 ring-rose-200 dark:bg-rose-950/60 dark:ring-rose-800/70",
    iconClass: "text-rose-600 dark:text-rose-400",
    progressClass: "bg-gradient-to-r from-rose-400 to-rose-600",
  },
  info: {
    icon: Icons.fileText,
    chipKey: "toast.chip.info",
    cardClass:
      "border-sky-200/90 bg-[linear-gradient(135deg,#ffffff_0%,#eff9ff_100%)] shadow-[0_20px_35px_rgba(14,165,233,0.18)] dark:border-sky-800/70 dark:bg-[linear-gradient(135deg,#111318_0%,#101b22_100%)] dark:shadow-[0_20px_35px_rgba(14,165,233,0.12)]",
    iconWrapClass: "bg-sky-100/80 ring-1 ring-sky-200 dark:bg-sky-950/60 dark:ring-sky-800/70",
    iconClass: "text-sky-600 dark:text-sky-400",
    progressClass: "bg-gradient-to-r from-sky-400 to-sky-600",
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [toasts, setToasts] = useState<IToastItem[]>([]);
  const timeoutMapRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: string) => {
    const timeoutId = timeoutMapRef.current[id];
    if (timeoutId) {
      clearTimeout(timeoutId);
      delete timeoutMapRef.current[id];
    }

    setToasts((previous) => previous.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback(
    (input: IToastInput) => {
      const id = createToastId();
      const nextToast: IToastItem = {
        id,
        title: input.title,
        description: input.description,
        type: input.type ?? "info",
        duration: input.duration ?? DEFAULT_TOAST_DURATION,
      };

      setToasts((previous) => [...previous, nextToast]);

      if (nextToast.duration > 0) {
        timeoutMapRef.current[id] = setTimeout(() => {
          dismiss(id);
        }, nextToast.duration);
      }

      return id;
    },
    [dismiss]
  );

  const success = useCallback(
    (input: Omit<IToastInput, "type">) => toast({ ...input, type: "success" }),
    [toast]
  );

  const error = useCallback(
    (input: Omit<IToastInput, "type">) => toast({ ...input, type: "error" }),
    [toast]
  );

  const info = useCallback(
    (input: Omit<IToastInput, "type">) => toast({ ...input, type: "info" }),
    [toast]
  );

  const value = useMemo<IToastContextValue>(
    () => ({
      toast,
      success,
      error,
      info,
      dismiss,
    }),
    [dismiss, error, info, success, toast]
  );

  useEffect(() => {
    const timeoutMap = timeoutMapRef.current;

    return () => {
      Object.values(timeoutMap).forEach((timeoutId) => clearTimeout(timeoutId));
    };
  }, []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 left-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3">
        {toasts.map((item) => {
          const style = TOAST_STYLES[item.type];
          const Icon = style.icon;

          return (
            <div
              key={item.id}
              role="status"
              aria-live="polite"
              className={cn(
                "pointer-events-auto overflow-hidden rounded-2xl border p-4 backdrop-blur-sm transition-all duration-300 animate-in slide-in-from-bottom-2",
                style.cardClass
              )}
            >
              <div className="flex items-start gap-3.5">
                <div className={cn("mt-0.5 rounded-full p-2.5", style.iconWrapClass)}>
                  <Icon className={cn("h-[18px] w-[18px]", style.iconClass)} />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[var(--black-300)]">{item.title}</p>
                    <span className="rounded-full bg-[var(--white)]/80 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[var(--black-200)] ring-1 ring-black/5 dark:ring-white/10">
                      {t(style.chipKey)}
                    </span>
                  </div>
                  {item.description ? (
                    <p className="text-xs leading-5 text-[var(--black-200)]">
                      {item.description}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(item.id)}
                  className="rounded-md p-1 text-[var(--black-100)] transition-colors hover:bg-[var(--white)]/70 hover:text-[var(--black-300)]"
                  aria-label={t("common.close")}
                >
                  <Icons.close className="h-4 w-4" />
                </button>
              </div>
              {item.duration > 0 ? (
                <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
                  <div
                    className={cn("h-full origin-left animate-[toast-progress_linear_forwards]", style.progressClass)}
                    style={{ animationDuration: `${item.duration}ms` }}
                  />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      <style jsx global>{`
        @keyframes toast-progress {
          from {
            transform: scaleX(1);
          }
          to {
            transform: scaleX(0);
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }

  return context;
}
