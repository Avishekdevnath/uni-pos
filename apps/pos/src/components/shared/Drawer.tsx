import { useEffect } from 'react';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  width?: number;
  children: React.ReactNode;
}

export function Drawer({ open, onClose, title, width = 420, children }: DrawerProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      <div
        className="fixed right-0 top-0 bottom-0 z-50 flex flex-col bg-surface border-l border-border2 transition-transform duration-300"
        style={{
          width,
          transform: open ? 'translateX(0)' : `translateX(${width}px)`,
        }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="text-[15px] font-semibold text-text1">{title}</h3>
          <button
            onClick={onClose}
            className="text-text3 hover:text-text1 text-lg transition-colors no-drag"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </>
  );
}
