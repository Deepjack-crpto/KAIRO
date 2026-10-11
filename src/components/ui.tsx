import { createContext, useCallback, useContext, useState } from "react";

// ---- Logo -----------------------------------------------------------------
export function Logo({ size = 32 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2 font-extrabold tracking-tight text-fg">
      <img src="/logo.svg" width={size} height={size} alt="" />
      <span style={{ fontSize: size * 0.56 }}>KAIRO</span>
    </span>
  );
}

// ---- Spinner / skeleton ---------------------------------------------------
export function Spinner({ label }: { label?: string }) {
  return (
    <div role="status" className="flex items-center gap-3 text-fg/60 text-sm">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-fg/20 border-t-accent" />
      {label ?? "Loading…"}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden />;
}

// ---- Empty state ----------------------------------------------------------
export function EmptyState({
  title, hint, action,
}: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="card flex flex-col items-center gap-3 p-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-accent text-xl">◇</div>
      <p className="font-semibold">{title}</p>
      {hint && <p className="max-w-sm text-sm text-fg/60">{hint}</p>}
      {action}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    ready: "bg-green-100 text-green-800",
    suspended: "bg-amber-100 text-amber-800",
    processing: "bg-blue-100 text-blue-800",
    uploaded: "bg-blue-100 text-blue-800",
    queued: "bg-blue-100 text-blue-800",
    deactivated: "bg-fg/10 text-fg/60",
    archived: "bg-fg/10 text-fg/60",
    failed: "bg-accent-soft text-accent",
  };
  return <span className={`badge ${map[status] ?? "chip"}`}>{status}</span>;
}

// ---- Toasts ---------------------------------------------------------------
type Toast = { id: number; kind: "success" | "error" | "info"; msg: string };
const ToastCtx = createContext<(kind: Toast["kind"], msg: string) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((kind: Toast["kind"], msg: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`card px-4 py-3 text-sm shadow-lg border-l-4 ${
              t.kind === "success" ? "border-l-green-500"
              : t.kind === "error" ? "border-l-accent" : "border-l-blue-500"
            }`}
          >
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

// ---- Confirm dialog -------------------------------------------------------
export function ConfirmDialog({
  open, title, body, confirmLabel = "Confirm", onConfirm, onCancel, danger,
}: {
  open: boolean; title: string; body?: string; confirmLabel?: string;
  onConfirm: () => void; onCancel: () => void; danger?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-fg/40 p-4" role="dialog" aria-modal="true">
      <div className="card w-full max-w-md p-6">
        <h3 className="text-lg font-semibold">{title}</h3>
        {body && <p className="mt-2 text-sm text-fg/70">{body}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button className="btn-outline" onClick={onCancel}>Cancel</button>
          <button className={danger ? "btn-danger" : "btn-primary"} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
