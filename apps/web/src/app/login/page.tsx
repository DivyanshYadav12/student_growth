'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GraduationCap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth, authErrorMessage } from '@/lib/auth';

type Mode = 'login' | 'register' | 'verify';

export default function LoginPage() {
  const { login, register, verifyEmail } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [token, setToken] = useState('');
  const [devToken, setDevToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === 'login') {
        await login(email, password);
        router.push('/');
      } else if (mode === 'register') {
        const dev = await register(email, password, fullName);
        if (dev) {
          setDevToken(dev);
          setMode('verify');
        } else {
          setError('Account created. Check your email to verify, then log in.');
          setMode('login');
        }
      } else {
        await verifyEmail(token || devToken || '');
        router.push('/');
      }
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-white"><GraduationCap size={20} /></div>
            <div>
              <h1 className="text-lg font-bold text-foreground">{mode === 'verify' ? 'Verify your email' : mode === 'register' ? 'Create account' : 'Welcome back'}</h1>
              <p className="text-xs text-muted-foreground">{mode === 'verify' ? 'Paste the verification token' : 'Student Growth Platform'}</p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {mode === 'register' && (
              <label className="block text-sm font-medium text-foreground">
                Full name
                <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 h-10 w-full rounded-xl border border-border px-3 text-sm outline-none focus:border-indigo-400 focus:ring-3 focus:ring-indigo-500/30" />
              </label>
            )}
            {mode !== 'verify' && (
              <label className="block text-sm font-medium text-foreground">
                Email
                <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 h-10 w-full rounded-xl border border-border px-3 text-sm outline-none focus:border-indigo-400 focus:ring-3 focus:ring-indigo-500/30" />
              </label>
            )}
            {mode !== 'verify' && (
              <label className="block text-sm font-medium text-foreground">
                Password
                <input required type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 h-10 w-full rounded-xl border border-border px-3 text-sm outline-none focus:border-indigo-400 focus:ring-3 focus:ring-indigo-500/30" />
              </label>
            )}
            {mode === 'verify' && (
              <label className="block text-sm font-medium text-foreground">
                Verification token
                <input required value={token} onChange={(e) => setToken(e.target.value)} placeholder={devToken ?? 'Paste token'} className="mt-1 h-10 w-full rounded-xl border border-border px-3 text-sm outline-none focus:border-indigo-400 focus:ring-3 focus:ring-indigo-500/30" />
              </label>
            )}
            {devToken && mode === 'verify' && (
              <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-800">Dev mode: your verification token is shown above. In production this arrives by email.</p>
            )}
            {error && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p>}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy && <Loader2 size={15} className="mr-2 animate-spin" />}
              {mode === 'login' ? 'Log in' : mode === 'register' ? 'Register' : 'Verify & continue'}
            </Button>
          </form>

          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            {mode !== 'login' ? (
              <button type="button" onClick={() => { setMode('login'); setError(null); }} className="font-medium text-indigo-400 hover:underline">Back to login</button>
            ) : <span />}
            {mode === 'login' && (
              <button type="button" onClick={() => { setMode('register'); setError(null); }} className="font-medium text-indigo-400 hover:underline">Create an account</button>
            )}
            <Link href="/" className="text-muted-foreground hover:text-muted-foreground">Continue browsing</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
