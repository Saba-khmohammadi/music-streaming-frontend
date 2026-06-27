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
    <nav className="premium-nav-list">
      {navItems.map((item) => {
        const isNotifications = item.href === '/notifications';
        const isActive = pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className={`premium-nav-link ${isActive ? 'active' : ''}`} onClick={() => setOpen(false)}>
            <span className="nav-label-wrapper">
              <span className="nav-text">{item.label}</span>
              {isNotifications && unreadNotifications ? <span className="notif-dot-glow" /> : null}
            </span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="premium-app-layout">
      <aside className={`sidebar ${open ? 'mobile-show' : ''}`}>
      <div className="brand-zone">
        <div className="brand-logo-glow">
          <i className="fas fa-music"></i>
        </div>
        <span className="brand-text">MusicStream</span>
      </div>
        <Nav />
        <div className="sidebar-footer">
          <button className="premium-logout-btn" onClick={handleLogout}>{language === 'fa' ? 'خروج' : 'Log out'}</button>
        </div>
      </aside>

      <main className="main-area">
        <header className="premium-topbar">
          
          <Link className="user-profile-pill" href="/profile">
            <img src={currentUser.avatarUrl} alt="profile" className="avatar-img" />
            <span className="user-name">{currentUser.displayName}</span>
          </Link>
        </header>

        {open && <div className="mobile-nav-backdrop" onClick={() => setOpen(false)} />}
        <div className="content-area">{children}</div>
      </main>
      <MiniPlayer />
    </div>
  );
}