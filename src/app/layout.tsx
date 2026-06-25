import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { PlayerProvider } from '@/context/PlayerContext';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';

export const metadata: Metadata = {
  title: 'Phase 1 Music Stream',
  description: 'Mock frontend for a Spotify-like music streaming service',
  manifest: '/manifest.json'
};

export const viewport: Viewport = {
  themeColor: '#7c3aed'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <body>
        <AuthProvider>
          <PlayerProvider>
            {children}
            <ServiceWorkerRegister />
          </PlayerProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
