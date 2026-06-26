'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { displayRoleLabel, displaySubscriptionLabel, navItemsForRole } from '@/lib/rules';
import { getCollection } from '@/lib/storage';
import type { AppNotification } from '@/types/domain';
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
  const notifications = getCollection('notifications') as AppNotification[];
  const unreadNotifications = notifications.some(
    (item) => !item.isRead && (item.role === currentUser.role || item.role === 'all' || item.userId === currentUser.id)
  );
  const language = currentUser.preferences.language;
  const navItems = navItemsForRole(currentUser.role, language);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const Nav = () => (
    <nav className="nav-list" aria-label="main navigation">
      {navItems.map((item) => {
        const isNotifications = item.href === '/notifications';
        return (
          <Link key={item.href} href={item.href} className={`nav-link ${pathname.startsWith(item.href) ? 'active' : ''}`} onClick={() => setOpen(false)}>
            <span className="nav-label">
              <span>{item.label}</span>
              {isNotifications && unreadNotifications ? <span className="notif-dot" aria-label="Unread notifications" /> : null}
            </span>
            <span>›</span>
          </Link>
        );
      })}
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
          <button className="btn ghost block" onClick={handleLogout}>{language === 'fa' ? 'خروج' : 'Log out'}</button>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <button className="btn ghost mobile-menu-btn" onClick={() => setOpen((value) => !value)}>{open ? (language === 'fa' ? 'بستن منو' : 'Close Menu') : (language === 'fa' ? 'منو' : 'Menu')}</button>
          <div>
            <strong>{displayRoleLabel(currentUser.role, language)}</strong>
            <div className="muted">{language === 'fa' ? 'اشتراک' : 'Subscription'}: {displaySubscriptionLabel(currentUser.subscription, language)}</div>
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
