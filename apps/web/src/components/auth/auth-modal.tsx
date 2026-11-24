'use client';

import { useState } from 'react';
import { GraduationCap, LoaderCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth';

type Mode = 'login' | 'signup';

export function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { login, register, verifyEmail } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [verifyToken, setVerifyToken] = useState('');
  const [devToken, setDevToken] = useState('');
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const reset = () => { setVerifyToken(''); setDevToken(''); setPassword(''); };

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (mode === 'login') {
        await login(email.trim(), password);
        toast.success('Welcome back!');
        onClose();
      } else {
        const token = await register(email.trim(), password, fullName.trim() || email.trim());
        if (token) {
          setDevToken(token);
          toast.message('Account created — check email to verify. Dev mode: use the token below.');
        } else {
          toast.success('Account created — check your email to verify.');
        }
      }
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    if (busy || !verifyToken.trim()) return;
    setBusy(true);
    try {
      await verifyEmail(verifyToken.trim());
      toast.success('Email verified — you are signed in.');
      onClose();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Verification failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" />
      <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <button onClick={onClose} className="absolute right-3 top-3 rounded-lg p-1.5 text-muted-foreground hover:bg-muted" aria-label="Close dialog"><X size={16} /></button>
        <div className="mb-5 flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-white"><GraduationCap size={20} /></div>
          <div>
            <h2 className="font-bold tracking-tight text-foreground">{mode === 'login' ? 'Welcome back' : 'Create account'}</h2>
            <p className="text-xs text-muted-foreground">{mode === 'login' ? 'Sign in to continue learning' : 'Start your growth journey'}</p>
          </div>
        </div>

        {devToken ? (
          <div className="space-y-3">
            <p className="text-xs leading-5 text-muted-foreground">Dev mode: paste this verification token to activate your account.</p>
            <Input value={devToken} readOnly className="font-mono text-xs" onFocus={(e) => e.target.select()} />
            <Input placeholder="Verification token" value={verifyToken} onChange={(e) => setVerifyToken(e.target.value)} />
            <Button className="w-full" onClick={() => void verify()} disabled={busy || !verifyToken.trim()}>{busy ? <LoaderCircle className="animate-spin" /> : null}Verify & sign in</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {mode === 'signup' && <Input placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />}
            <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input type="password" placeholder="Password (min 8 chars)" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void submit(); }} />
            <Button className="w-full" onClick={() => void submit()} disabled={busy || !email.includes('@') || password.length < 8}>
              {busy ? <LoaderCircle className="animate-spin" /> : null}{mode === 'login' ? 'Sign in' : 'Sign up'}
            </Button>
            <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); reset(); }} className="w-full text-center text-xs font-medium text-indigo-400 hover:text-indigo-300">
              {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
