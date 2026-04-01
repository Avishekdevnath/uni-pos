'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

const DEMO_ACCOUNTS = [
  { role: 'Owner', email: 'owner@unimart.demo', branch: 'HQ Flagship' },
  { role: 'Senior Manager', email: 'sr.manager.dhaka@unimart.demo', branch: 'HQ Flagship' },
  { role: 'Manager', email: 'manager.dhkhq@unimart.demo', branch: 'HQ Flagship' },
  { role: 'Cashier', email: 'cashier1.dhkhq@unimart.demo', branch: 'HQ Flagship' },
  { role: 'Senior Staff', email: 'sr.staff.dhkhq@unimart.demo', branch: 'HQ Flagship' },
  { role: 'Staff', email: 'staff.dhkhq@unimart.demo', branch: 'HQ Flagship' },
] as const;

const DEMO_PASSWORD = 'demo1234';

const ROLE_COLORS: Record<string, string> = {
  'Owner': 'bg-violet-100 text-violet-800',
  'Senior Manager': 'bg-blue-100 text-blue-800',
  'Manager': 'bg-sky-100 text-sky-800',
  'Cashier': 'bg-green-100 text-green-800',
  'Senior Staff': 'bg-amber-100 text-amber-800',
  'Staff': 'bg-orange-100 text-orange-800',
};

export default function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch {
      setError('Invalid email or password');
    } finally {
      setSubmitting(false);
    }
  };

  function fillDemo(demoEmail: string) {
    setEmail(demoEmail);
    setPassword(DEMO_PASSWORD);
    setError('');
    setDemoOpen(false);
  }

  if (isLoading) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">uniPOS Admin</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <div className="mt-4">
            <Dialog open={demoOpen} onOpenChange={setDemoOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  View demo accounts
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Demo Accounts</DialogTitle>
                  <DialogDescription>
                    All accounts use password{' '}
                    <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">
                      {DEMO_PASSWORD}
                    </code>
                    . Click any row to fill the login form.
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-2 space-y-2">
                  {DEMO_ACCOUNTS.map((a) => (
                    <button
                      key={a.email}
                      onClick={() => fillDemo(a.email)}
                      className="flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition-colors hover:bg-accent"
                    >
                      <div className="space-y-0.5">
                        <p className="font-medium">{a.email}</p>
                        <p className="text-xs text-muted-foreground">{a.branch}</p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[a.role]}`}
                      >
                        {a.role}
                      </span>
                    </button>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
