'use client';

import Link from 'next/link';
import { useState } from 'react';
import AppShell from '@/components/AppShell';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { getCollection, setCollection } from '@/lib/storage';
import { formatDate } from '@/lib/format';
import type { AppNotification } from '@/types/domain';

export default function NotificationsPage() {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>(getCollection('notifications'));
  if (!currentUser) return <AppShell><div /></AppShell>;

  const visible = notifications.filter((item) => item.role === currentUser.role || item.role === 'all' || item.userId === currentUser.id);
  const persist = (next: AppNotification[]) => { setNotifications(next); setCollection('notifications', next); };
  const markRead = (id: string) => persist(notifications.map((item) => item.id === id ? { ...item, isRead: true } : item));
  const deleteItem = (id: string) => persist(notifications.filter((item) => item.id !== id));
  const readAll = () => persist(notifications.map((item) => visible.some((visibleItem) => visibleItem.id === item.id) ? { ...item, isRead: true } : item));

  return (
    <AppShell>
      {/* هدر صفحه: دکمه Read All رو با استایل تعاملی جدیدمون ست کردیم */}
      <PageHeader 
        title="Notifications" 
        description="Unread notifications are highlighted, with actions to read all, delete, and navigate directly." 
        actions={
          <button className="btn-interactive approve" style={{ height: '40px', padding: '0 16px', fontSize: '13px' }} onClick={readAll}>
            <i className="fas fa-check-double"></i> Read all notifications
          </button>
        } 
      />
      
      {!visible.length ? (
        <EmptyState title="No notifications" description="This section will update when a new notification arrives." />
      ) : (
        <div className="grid" style={{ gap: '14px' }}>
          {visible.map((item) => (
            <article key={item.id} className={`premium-notification-card ${item.isRead ? 'read' : 'unread'}`}>
              
              {/* ردیف اصلی نوتیفیکیشن */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <strong style={{ color: '#fff', fontSize: '16px' }}>{item.title}</strong>
                    {/* بج وضعیت به صورت یک نقطه درخشان یا مینی بج محو */}
                    <span className={`notif-status-tag ${item.isRead ? 'read' : 'unread'}`}>
                      {item.isRead ? 'Read' : 'Unread'}
                    </span>
                  </div>
                  <p className="muted" style={{ margin: '8px 0 12px 0', fontSize: '14px', lineHeight: '1.6' }}>{item.message}</p>
                  <small className="muted" style={{ fontSize: '12px', opacity: 0.5 }}>{formatDate(item.createdAt)}</small>
                </div>
  
                {/* 🌟 دکمه‌های اکشنِ آیکونیک و مینیاتوری در سمت راست برای خلوت شدن فضا */}
                <div className="notif-action-cluster" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {item.link ? (
                    <Link className="notif-mini-btn view" href={item.link} title="View Details">
                      <i className="fas fa-external-link-alt"></i>
                    </Link>
                  ) : null}
                  
                  {!item.isRead ? (
                    <button className="notif-mini-btn check" onClick={() => markRead(item.id)} title="Mark as Read">
                      <i className="fas fa-check"></i>
                    </button>
                  ) : null}
                  
                  <button className="notif-mini-btn delete" onClick={() => deleteItem(item.id)} title="Delete Notification">
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </div>
              </div>
  
            </article>
          ))}
        </div>
      )}
    </AppShell>
  );
}
