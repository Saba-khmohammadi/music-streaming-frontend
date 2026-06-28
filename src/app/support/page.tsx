'use client';

import { FormEvent, useMemo, useState } from 'react';
import AppShell from '@/components/AppShell';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { formatDate } from '@/lib/format';
import { getCollection, newId, setCollection } from '@/lib/storage';
import type { AppNotification, Ticket, UserPreferences } from '@/types/domain';

type Language = UserPreferences['language'];

const statusLabels: Record<Language, Record<Ticket['status'], string>> = {
  fa: {
    open: 'باز',
    answered: 'پاسخ داده شده',
    closed: 'بسته شده'
  },
  en: {
    open: 'Open',
    answered: 'Answered',
    closed: 'Closed'
  }
};

const supportText = {
  fa: {
    title: 'چت پشتیبانی',
    description: 'از این بخش می‌توانید به پشتیبان پیام بدهید و پاسخ‌های ارسال‌شده را ببینید.',
    newTicket: 'شروع گفت‌وگوی جدید',
    subject: 'موضوع پیام',
    subjectPlaceholder: 'مثلاً مشکل اشتراک، پخش آهنگ یا حساب هنرمند',
    message: 'متن پیام',
    messagePlaceholder: 'پیام خود را برای پشتیبانی بنویسید...',
    create: 'ارسال پیام به پشتیبان',
    conversations: 'گفت‌وگوهای من',
    noTicketsTitle: 'هنوز پیامی برای پشتیبان ارسال نکرده‌اید',
    noTicketsDescription: 'اولین پیام را از فرم سمت چپ ارسال کنید.',
    selectedChat: 'جزئیات گفت‌وگو',
    chooseTicket: 'یک گفت‌وگو را انتخاب کنید',
    chooseTicketDescription: 'برای دیدن پیام‌ها و پاسخ‌ها روی یکی از تیکت‌ها کلیک کنید.',
    support: 'پشتیبان',
    you: 'شما',
    status: 'وضعیت',
    reply: 'پاسخ/پیام جدید',
    replyPlaceholder: 'ادامه گفت‌وگو را اینجا بنویسید...',
    sendReply: 'ارسال پیام',
    closedNotice: 'این گفت‌وگو بسته شده است. برای موضوع جدید، تیکت جدید بسازید.',
    ticketCreatedTitle: 'تیکت جدید پشتیبانی',
    ticketCreatedMessage: (name: string, subject: string) => `${name} یک پیام جدید برای پشتیبانی ارسال کرد: ${subject}`
  },
  en: {
    title: 'Support Chat',
    description: 'Send a message to support and view replies from the support team in one place.',
    newTicket: 'Start a new conversation',
    subject: 'Subject',
    subjectPlaceholder: 'For example: subscription, playback, or artist account issue',
    message: 'Message',
    messagePlaceholder: 'Write your message to support...',
    create: 'Send message to support',
    conversations: 'My conversations',
    noTicketsTitle: 'You have not sent any support messages yet',
    noTicketsDescription: 'Use the form on the left to send your first message.',
    selectedChat: 'Conversation details',
    chooseTicket: 'Select a conversation',
    chooseTicketDescription: 'Click one of your tickets to view messages and replies.',
    support: 'Support',
    you: 'You',
    status: 'Status',
    reply: 'Reply / new message',
    replyPlaceholder: 'Continue the conversation here...',
    sendReply: 'Send message',
    closedNotice: 'This conversation is closed. Create a new ticket for a new topic.',
    ticketCreatedTitle: 'New support ticket',
    ticketCreatedMessage: (name: string, subject: string) => `${name} sent a new support message: ${subject}`
  }
} satisfies Record<Language, unknown>;

const matchesCurrentUser = (ticket: Ticket, userId: string, displayName: string) =>
  ticket.userId === userId || (!ticket.userId && ticket.userName === displayName);

const ticketNumber = (tickets: Ticket[]) => {
  const numericIds = tickets
    .map((ticket) => Number(ticket.id.replace(/\D/g, '')))
    .filter((value) => Number.isFinite(value));
  return Math.max(1000, ...numericIds) + 1;
};

export default function SupportPage() {
  const { currentUser } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>(getCollection('tickets'));
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [createdNotice, setCreatedNotice] = useState('');

  const language = currentUser?.preferences.language ?? 'en';
  const t = supportText[language];
  const statusLabel = statusLabels[language];

  const myTickets = useMemo(
    () => currentUser ? tickets.filter((ticket) => matchesCurrentUser(ticket, currentUser.id, currentUser.displayName)) : [],
    [currentUser, tickets]
  );
  const selectedTicket = myTickets.find((ticket) => ticket.id === selectedTicketId) ?? myTickets[0];

  if (!currentUser) return <AppShell><div /></AppShell>;

  const persistTickets = (nextTickets: Ticket[]) => {
    setTickets(nextTickets);
    setCollection('tickets', nextTickets);
  };

  const notifySupportTeam = (subject: string) => {
    const notifications = getCollection('notifications') as AppNotification[];
    const now = new Date().toISOString();
    const message = t.ticketCreatedMessage(currentUser.displayName, subject);
    const supportNotification: AppNotification = {
      id: newId('notif'),
      role: 'support',
      title: t.ticketCreatedTitle,
      message,
      link: '/dashboard',
      isRead: false,
      createdAt: now
    };
    const adminNotification: AppNotification = {
      ...supportNotification,
      id: newId('notif'),
      role: 'admin'
    };
    setCollection('notifications', [supportNotification, adminNotification, ...notifications]);
  };

  const createTicket = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const subject = String(form.get('subject') ?? '').trim();
    const body = String(form.get('message') ?? '').trim();
    if (!subject || !body) return;

    const createdAt = new Date().toISOString();
    const nextTicket: Ticket = {
      id: `TCK-${ticketNumber(tickets)}`,
      userId: currentUser.id,
      userName: currentUser.displayName,
      subject,
      status: 'open',
      createdAt,
      messages: [{ from: 'user', body, createdAt }]
    };

    persistTickets([nextTicket, ...tickets]);
    setSelectedTicketId(nextTicket.id);
    setCreatedNotice(subject);
    notifySupportTeam(subject);
    event.currentTarget.reset();
  };

  const sendMessage = () => {
    const body = reply.trim();
    if (!selectedTicket || !body || selectedTicket.status === 'closed') return;
    const createdAt = new Date().toISOString();
    const nextTickets = tickets.map((ticket) => ticket.id === selectedTicket.id ? {
      ...ticket,
      status: 'open' as const,
      messages: [...ticket.messages, { from: 'user' as const, body, createdAt }]
    } : ticket);
    persistTickets(nextTickets);
    setReply('');
    notifySupportTeam(selectedTicket.subject);
  };

  return (
    <AppShell>
      <PageHeader title={t.title} description={t.description} />

      <div className="grid cols-2">
        <section className="card">
          <h2>{t.newTicket}</h2>
          <form className="form" onSubmit={createTicket}>
            <div className="form-row">
              <label className="label">{t.subject}</label>
              <input className="input" name="subject" placeholder={t.subjectPlaceholder} required />
            </div>
            <div className="form-row">
              <label className="label">{t.message}</label>
              <textarea className="textarea" name="message" placeholder={t.messagePlaceholder} required />
            </div>
            <button className="btn primary" type="submit">{t.create}</button>
            {createdNotice ? <span className="badge success">{createdNotice}</span> : null}
          </form>
        </section>

        <section className="card">
          <div className="section-title" style={{ marginTop: 0 }}>
            <h2>{t.conversations}</h2>
            <span className="badge">{myTickets.length}</span>
          </div>

          {!myTickets.length ? <EmptyState title={t.noTicketsTitle} description={t.noTicketsDescription} /> : (
            <div className="dashboard-menu">
              {myTickets.map((ticket) => (
                <button
                  key={ticket.id}
                  className={`dashboard-menu-item ${selectedTicket?.id === ticket.id ? 'active' : ''}`}
                  type="button"
                  onClick={() => setSelectedTicketId(ticket.id)}
                >
                  <span>{ticket.subject}</span>
                  <small>{ticket.id} · {formatDate(ticket.createdAt)} · {statusLabel[ticket.status]}</small>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="card highlight" style={{ marginTop: 18 }}>
        <h2>{t.selectedChat}</h2>
        {selectedTicket ? (
          <div className="chatbox">
            <div>
              <span className={`badge ${selectedTicket.status === 'closed' ? 'success' : selectedTicket.status === 'open' ? 'warning' : ''}`}>{t.status}: {statusLabel[selectedTicket.status]}</span>
              <h3>{selectedTicket.subject}</h3>
              <p className="muted">{selectedTicket.id} · {formatDate(selectedTicket.createdAt)}</p>
            </div>

            <div className="chat-messages">
              {selectedTicket.messages.map((message, index) => (
                <div className={`chat-message ${message.from === 'support' ? 'support' : 'user'}`} key={`${message.createdAt}-${index}`}>
                  <strong>{message.from === 'support' ? t.support : t.you}</strong>
                  <p>{message.body}</p>
                  <small>{formatDate(message.createdAt)}</small>
                </div>
              ))}
            </div>

            {selectedTicket.status === 'closed' ? (
              <span className="badge warning">{t.closedNotice}</span>
            ) : (
              <div className="form-row">
                <label className="label">{t.reply}</label>
                <textarea className="textarea" value={reply} onChange={(event) => setReply(event.target.value)} placeholder={t.replyPlaceholder} />
                <button className="btn primary" type="button" disabled={!reply.trim()} onClick={sendMessage}>{t.sendReply}</button>
              </div>
            )}
          </div>
        ) : <EmptyState title={t.chooseTicket} description={t.chooseTicketDescription} />}
      </section>
    </AppShell>
  );
}
