import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/use-auth';

export function StatusBar() {
  const { branch, user } = useAuth();

  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  return (
    <div className="h-8 flex items-center justify-between px-4 bg-surface2 border-t border-border text-[12px] text-text3 select-none flex-shrink-0">
      <div>
        <span className="font-semibold text-text1">{branch?.name ?? '—'}</span>
        <span className="mx-2">|</span>
        <span>Cashier: <span className="font-semibold text-text1">{user?.fullName ?? '—'}</span></span>
      </div>
      <div className="flex items-center gap-3">
        <span style={{ color: online ? 'var(--green)' : 'var(--red)' }}>
          ● {online ? 'Online' : 'Offline'}
        </span>
        <span>|</span>
        <span>{new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: '2-digit' })}</span>
      </div>
    </div>
  );
}
