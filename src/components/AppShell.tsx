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
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  if (!currentUser) return null;
  const notifications = getCollection('notifications') as AppNotification[];
  const unreadNotifications = notifications.some(
    (item) => !item.isRead && (item.role === currentUser.role || item.role === 'all' || item.userId === currentUser.id)
  );
  const language = currentUser.preferences.language;
  const navItems = navItemsForRole(currentUser.role, language).filter(
    (item) => item.href !== '/profile' && item.href !== '/settings'
  );

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(true); // این را بالای بدنه Shell اضافه کن اگر قبلاً نگذاشتی

  const Nav = () => {
    // ۴ آیتمِ ساب‌منو که قرار است زیر منوی ادمین لود شوند
    const adminSubItems = [
      { id: 'verification', label: language === 'fa' ? 'درخواست‌های تایید' : 'Verification requests' },
      { id: 'tickets', label: language === 'fa' ? 'تیکت‌های پشتیبانی' : 'Support tickets' },
      { id: 'audit', label: language === 'fa' ? 'حسابرسی' : 'Audit' },
      { id: 'pricing', label: language === 'fa' ? 'اشتراک‌ها و گزارش‌ها' : 'Subscriptions and reports' },
    ];

    return (
      <nav className="premium-nav-list">
        {navItems.map((item) => {
          const isNotifications = item.href === '/notifications';
          const isAdminMenu = item.href === '/dashboard' || item.href === '/admin'; // تشخیص منوی ادمین
          const isActive = pathname.startsWith(item.href);

          return (
            <div key={item.href} className="nav-item-group" style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
              {/* لینک اصلی منو */}
              <Link 
                href={item.href} 
                className={`premium-nav-link ${isActive ? 'active' : ''}`} 
                onClick={() => {
                  setOpen(false);
                  if (isAdminMenu) {
                    setIsAdminMenuOpen(!isAdminMenuOpen); // اگر روی ادمین زد، ساب‌منو باز و بسته شود
                  }
                }}
              >
                <span className="nav-label-wrapper" style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                  <span className="nav-text">{item.label}</span>
                  {isNotifications && unreadNotifications ? <span className="notif-dot-glow" /> : null}
                  
                  {/* فلشِ کوچک برای منوی ادمین */}
                  {isAdminMenu && (
                    <i className={`fas fa-chevron-${isAdminMenuOpen ? 'up' : 'down'}`} style={{ fontSize: '10px', opacity: 0.5 }}></i>
                  )}
                </span>
              </Link>

              {/* رندر کردن ۴ زیرمنو دقیقاً زیرِ گزینه‌ی ادمین */}
              {isAdminMenu && isAdminMenuOpen && (
                <div className="sidebar-sub-menu">
                  {adminSubItems.map((sub) => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => {
                        // شلیک کاستوم ایونت به صفحه داشبورد برای عوض کردن سکشن فعال
                        window.dispatchEvent(new CustomEvent('change-admin-section', { detail: sub.id }));
                        router.push('/dashboard');
                      }}
                      className="sidebar-sub-item"
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    );
  };

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
      </aside>

      <main className="main-area">
        <header className="premium-topbar">
          <button className="mobile-toggle-btn" onClick={() => setOpen(!open)}>
            <i className={`fas ${open ? 'fa-times' : 'fa-bars'}`}></i>
          </button>
          <div style={{ flexGrow: 1 }} />
          <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '40px' }}></div>
          
          <button 
            className="btn ghost" 
            onClick={() => router.push('/support')} // یا هر مسیری که چت پشتیبانی داره
            title="Support"
            style={{ 
              padding: '0', 
              borderRadius: '50%', 
              width: '42px', 
              height: '42px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <i className="fas fa-headset"></i> {/* آیکون ساپورت */}
          </button>
          <div className="profile-menu-container">
            <button 
              className="user-profile-pill" 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
              <img src={currentUser.avatarUrl} alt="profile" className="avatar-img" />
              <span className="user-name">{currentUser.displayName}</span>
              <i className={`fas fa-chevron-${isProfileOpen ? 'up' : 'down'} profile-chevron`}></i>
            </button>

            {isProfileOpen && (
              <div className="profile-dropdown-glass" onClick={() => setIsProfileOpen(false)}>
                <Link href="/profile" className="dropdown-item">
                  <i className="fas fa-user"></i> {language === 'fa' ? 'پروفایل' : 'Profile'}
                </Link>
                <Link href="/settings" className="dropdown-item">
                  <i className="fas fa-cog"></i> {language === 'fa' ? 'تنظیمات' : 'Settings'}
                </Link>
                
                <div className="dropdown-divider"></div>
                
                <button onClick={handleLogout} className="dropdown-item danger">
                  <i className="fas fa-sign-out-alt"></i> {language === 'fa' ? 'خروج' : 'Log out'}
                </button>
              </div>
            )}
          </div>
        </header>

        {open && <div className="mobile-nav-backdrop" onClick={() => setOpen(false)} />}
        <div className="content-area">{children}</div>
      </main>
      <MiniPlayer />
    </div>
  );
}