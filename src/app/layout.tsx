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
        {/* تزریق مستقیم CDN فونت‌آوسوم نسخه ۶ برای کل پروژه */}
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" 
          integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" 
          crossOrigin="anonymous" 
          referrerPolicy="no-referrer" 
        />

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