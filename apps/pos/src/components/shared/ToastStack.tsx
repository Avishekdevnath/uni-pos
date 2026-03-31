import { useToastStore, type Toast, type ToastVariant } from '../../store/toast-store';

const ICONS: Record<ToastVariant, React.ReactNode> = {
  success: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  error: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  warning: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  info: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  ),
};

const STYLES: Record<ToastVariant, string> = {
  success: 'bg-surface border-pos-green/40 text-text1 [&_.toast-icon]:text-pos-green [&_.toast-icon]:bg-pos-green/10',
  error:   'bg-surface border-pos-red/40   text-text1 [&_.toast-icon]:text-pos-red   [&_.toast-icon]:bg-pos-red/10',
  warning: 'bg-surface border-pos-amber/40 text-text1 [&_.toast-icon]:text-pos-amber [&_.toast-icon]:bg-pos-amber/10',
  info:    'bg-surface border-accent/40     text-text1 [&_.toast-icon]:text-accent     [&_.toast-icon]:bg-accent/10',
};

function ToastItem({ toast }: { toast: Toast }) {
  const { dismiss } = useToastStore();

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-2xl min-w-[280px] max-w-[380px] ${STYLES[toast.variant]}`}
      style={{ animation: 'toastIn 200ms ease-out' }}
    >
      <div className={`toast-icon w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5`}>
        {ICONS[toast.variant]}
      </div>
      <span className="text-[13px] leading-snug flex-1 pt-0.5">{toast.message}</span>
      <button
        onClick={() => dismiss(toast.id)}
        className="text-text3 hover:text-text1 transition-colors flex-shrink-0 mt-0.5 cursor-pointer"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  );
}

export function ToastStack() {
  const { toasts } = useToastStore();
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-10 right-5 z-[200] flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} />
        </div>
      ))}
    </div>
  );
}
