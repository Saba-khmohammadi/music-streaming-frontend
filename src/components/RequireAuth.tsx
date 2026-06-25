'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { currentUser, isReady } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isReady && !currentUser) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [currentUser, isReady, pathname, router]);

  if (!isReady) return <div className="auth-page"><div className="card">Preparing...</div></div>;
  if (!currentUser) return null;
  return <>{children}</>;
}
