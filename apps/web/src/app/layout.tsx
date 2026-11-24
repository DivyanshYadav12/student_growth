import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/layout/app-shell';
import { AuthProvider } from '@/lib/auth';
import { Toaster } from '@/components/ui/sonner';
export const metadata: Metadata={title:'Student Growth | Learn, Practice, Grow',description:'Your connected space for academic learning, technical practice, and career growth.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" className="dark"><body><AuthProvider><AppShell>{children}</AppShell></AuthProvider><Toaster/></body></html>}
