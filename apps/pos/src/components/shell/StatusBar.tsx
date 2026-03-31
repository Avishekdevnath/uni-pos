import React from 'react';
import { useAuth } from '../../hooks/use-auth';

export function StatusBar() {
  const { branch, user } = useAuth();
  // Simulate online/offline status for UI/UX
  const [online, setOnline] = React.useState(true);
  React.useEffect(() => {
    // Toggle online/offline every 30s for demo
    const id = setInterval(() => setOnline((o) => !o), 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="h-8 flex items-center justify-between px-4 bg-surface2 border-t border-border text-[12px] text-text3 select-none">
      <div>
        <span className="font-semibold text-text1">{branch?.name ?? 'Branch —'}</span>
        <span className="mx-2">|</span>
        <span>Cashier: <span className="font-semibold text-text1">{(user as any)?.fullName ?? (user as any)?.name ?? '—'}</span></span>
      </div>
      <div>
        <span className={online ? 'text-pos-green' : 'text-pos-red'}>
          ● {online ? 'Online' : 'Offline'}
        </span>
        <span className="mx-2">|</span>
        <span>{new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: '2-digit' })}</span>
      </div>
    </div>
  );
}
