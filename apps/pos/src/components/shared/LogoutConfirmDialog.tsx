import { useEffect } from 'react';

interface Props {
  onConfirm: () => void;
  onCancel: () => void;
}

export function LogoutConfirmDialog({ onConfirm, onCancel }: Props) {
  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onCancel}
    >
      <div
        className="rounded-xl p-6 w-[320px] shadow-xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--border2)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-3xl mb-3">🚪</div>
        <h2 className="text-text1 font-semibold text-base mb-2">Log out?</h2>
        <p className="text-text2 text-sm mb-6">
          You will be returned to the login screen. Any unsaved work will be lost.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ background: 'var(--surface2)', color: 'var(--text2)', border: '1px solid var(--border2)' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 rounded-lg text-sm font-semibold transition-colors"
            style={{ background: 'var(--red)', color: '#ffffff' }}
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}
