'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { navItemsForRole, roleLabels, subscriptionLabels } from '@/lib/rules';
import MiniPlayer from './MiniPlayer';
import RequireAuth from './RequireAuth';

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <Shell>{children}</Shell>
    </RequireAuth>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const { currentUser, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (!currentUser) return null;
  const navItems = navItemsForRole(currentUser.role);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const Nav = () => (
    <nav className="nav-list" aria-label="main navigation">
      {navItems.map((item) => (
        <Link key={item.href} href={item.href} className={`nav-link ${pathname.startsWith(item.href) ? 'active' : ''}`} onClick={() => setOpen(false)}>
          <span>{item.label}</span>
          <span>›</span>
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">♫</div>
          <div>
            <strong>Music Stream</strong>
            <small>Phase 1 Frontend</small>
          </div>
        </div>
        <Nav />
        <div className="sidebar-footer">
          <button className="btn ghost block" onClick={handleLogout}>Log out</button>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <button className="btn ghost mobile-menu-btn" onClick={() => setOpen((value) => !value)}>{open ? 'Close Menu' : 'Menu'}</button>
          <div>
            <strong>{roleLabels[currentUser.role]}</strong>
            <div className="muted">Subscription: {subscriptionLabels[currentUser.subscription]}</div>
          </div>
          <Link className="user-pill" href="/profile">
            <img src={currentUser.avatarUrl} alt="profile" className="avatar" />
            <span>{currentUser.displayName}</span>
          </Link>
        </header>
        {open ? <div className="mobile-nav"><Nav /></div> : null}
        <div className="content">{children}</div>
      </main>
      <MiniPlayer />
    </div>
  );
}
