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
      <PageHeader title="Notifications" description="Unread notifications are highlighted, with actions to read all, delete, and navigate directly." actions={<button className="btn secondary" onClick={readAll}>Read all notifications</button>} />
      {!visible.length ? <EmptyState title="No notifications" description="This section will update when a new notification arrives." /> : (
        <div className="grid">
          {visible.map((item) => (
            <article key={item.id} className={`notification ${item.isRead ? '' : 'unread'}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div><strong>{item.title}</strong><p className="muted">{item.message}</p></div>
                {!item.isRead ? <span className="badge secondary">Unread</span> : <span className="badge">Read</span>}
              </div>
              <small className="muted">{formatDate(item.createdAt)}</small>
              <div className="notification-actions">
                {item.link ? <Link className="btn ghost" href={item.link}>View</Link> : null}
                {!item.isRead ? <button className="btn secondary" onClick={() => markRead(item.id)}>Mark as read</button> : null}
                <button className="btn danger" onClick={() => deleteItem(item.id)}>Delete notification</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </AppShell>
  );
}
