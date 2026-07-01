'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import AppShell from '@/components/AppShell';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { calculateArtistReward, canUseAdminPricing, canUseSupportDashboard, displayRoleLabel } from '@/lib/rules';
import { formatCurrency, formatDate, formatNumber } from '@/lib/format';
import { getCollection, newId, setCollection } from '@/lib/storage';
import type { AppNotification, Artist, AuditRow, SubscriptionPricing, Ticket, Track, UserPreferences } from '@/types/domain';

type DashboardSection = 'verification' | 'tickets' | 'audit' | 'pricing';
type Language = UserPreferences['language'];

const ticketStatusLabels: Record<Language, Record<Ticket['status'], string>> = {
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

const paymentStatusLabels: Record<Language, Record<AuditRow['status'], string>> = {
  fa: {
    pending: 'در انتظار پرداخت',
    paid: 'تسویه شده'
  },
  en: {
    pending: 'Pending payment',
    paid: 'Paid'
  }
};

const dashboardText = {
  fa: {
    pageTitle: 'داشبورد پشتیبان و مدیر سامانه',
    currentRole: 'نقش فعلی',
    unauthorizedTitle: 'دسترسی غیرمجاز',
    unauthorizedDescription: 'این صفحه فقط برای پشتیبان و مدیر سامانه قابل مشاهده است.',
    sidebarTitle: 'بخش‌های داشبورد',
    sidebarDescription: 'از این سایدبار برای جابه‌جایی بین بخش‌های مجاز استفاده کنید.',
    sections: {
      verification: {
        title: 'درخواست‌های تایید هنرمندان',
        description: 'بررسی نمونه‌کار و تایید یا رد حساب هنرمند'
      },
      tickets: {
        title: 'تیکت‌های پشتیبانی',
        description: 'مشاهده مکالمه و پاسخ به کاربران'
      },
      audit: {
        title: 'حسابرسی',
        description: 'محاسبات مالی و تسویه هنرمندان'
      },
      pricing: {
        title: 'اشتراک‌ها و گزارش‌ها',
        description: 'تغییر قیمت و گزارش درآمدی'
      }
    },
    verification: {
      intro: 'فقط هنرمندانی که وضعیت «در انتظار تایید» دارند در این جدول نمایش داده می‌شوند.',
      requestCount: 'درخواست',
      emptyTitle: 'درخواستی برای بررسی وجود ندارد',
      artistName: 'نام هنری',
      email: 'ایمیل',
      samples: 'نمونه کارها',
      viewSamples: 'مشاهده نمونه کارها',
      detailTitle: 'جزئیات درخواست',
      pending: 'در انتظار تایید',
      noSamples: 'نمونه کاری ثبت نشده است.',
      playSample: 'پخش/بررسی نمونه',
      rejectionReason: 'دلیل رد درخواست',
      rejectionPlaceholder: 'در صورت رد درخواست، دلیل را اینجا بنویسید.',
      approve: 'تایید',
      reject: 'رد درخواست',
      selectTitle: 'یک درخواست را انتخاب کنید',
      selectDescription: 'با کلیک روی «مشاهده نمونه کارها»، جزئیات درخواست در این بخش باز می‌شود.'
    },
    tickets: {
      intro: 'جدول شامل شناسه، کاربر، موضوع، تاریخ ارسال و وضعیت تیکت است.',
      count: 'تیکت',
      ticketId: 'شناسه تیکت',
      userName: 'نام کاربر',
      subject: 'موضوع',
      sentDate: 'تاریخ ارسال',
      status: 'وضعیت',
      chatTitle: 'چت‌باکس پاسخگویی',
      userPrefix: 'کاربر',
      support: 'پشتیبان',
      replyLabel: 'پاسخ پشتیبان',
      replyPlaceholder: 'پاسخ خود را اینجا تایپ کنید...',
      sendReply: 'ارسال پاسخ',
      closeTicket: 'بستن تیکت',
      emptyTitle: 'تیکتی وجود ندارد'
    },
    audit: {
      title: 'جدول محاسبات مالی ماهانه',
      intro: 'نمایش حسابرسی هنرمندان، شنوندگان منحصربه‌فرد، استریم‌ها، پاداش و وضعیت پرداخت.',
      adminOnly: 'ویژه مدیر سامانه',
      artistInfo: 'نام و شناسه تخصصی هنرمند',
      month: 'ماه',
      uniqueListeners: 'شنوندگان منحصربه‌فرد',
      streams: 'استریم‌های ثبت شده',
      reward: 'مبلغ پاداش محاسبه شده',
      rewardFormula: 'فرمول محاسبه پاداش',
      paymentStatus: 'وضعیت پرداخت',
      paymentAction: 'عملیات پرداخت',
      unknownArtist: 'هنرمند نامشخص',
      markPaid: 'تایید تسویه حساب'
    },
    pricing: {
      controlTitle: 'پنل کنترل قیمت‌ها',
      controlDescription: 'مدیر سامانه می‌تواند قیمت اشتراک‌های نقره‌ای و طلایی را بدون تغییر کد بروزرسانی کند.',
      silverPrice: 'قیمت اشتراک نقره‌ای',
      goldPrice: 'قیمت اشتراک طلایی',
      updatePrices: 'بروزرسانی قیمت‌ها',
      saved: 'قیمت‌ها در سامانه بروزرسانی شد.',
      reportsTitle: 'نمودارها و گزارش‌های درآمدی',
      chartLabel: 'نمودار دایره‌ای توزیع کاربران بر اساس اشتراک',
      base: 'پایه',
      silver: 'نقره‌ای',
      gold: 'طلایی',
      subscriptionRevenue: 'درآمد اشتراک ماه جاری',
      paidRewards: 'پاداش‌های تسویه شده',
      pendingRewards: 'پاداش‌های در انتظار پرداخت'
    },
    notifications: {
      approvedTitle: 'درخواست هنرمندی تایید شد',
      rejectedTitle: 'درخواست هنرمندی رد شد',
      approvedMessage: (name: string) => `حساب هنرمندی ${name} تایید شد و اکنون امکان مدیریت آثار فعال است.`,
      rejectedMessage: (name: string, reason: string) => `درخواست هنرمندی ${name} رد شد. دلیل: ${reason || 'دلیل ثبت نشده است.'}`
    }
  },
  en: {
    pageTitle: 'Support and System Admin Dashboard',
    currentRole: 'Current role',
    unauthorizedTitle: 'Unauthorized access',
    unauthorizedDescription: 'This page is only available to support staff and the system admin.',
    sidebarTitle: 'Dashboard sections',
    sidebarDescription: 'Use this sidebar to switch between the sections available to your role.',
    sections: {
      verification: {
        title: 'Artist verification requests',
        description: 'Review sample works and approve or reject artist accounts'
      },
      tickets: {
        title: 'Support tickets',
        description: 'View conversations and reply to users'
      },
      audit: {
        title: 'Audit',
        description: 'Monthly financial calculations and artist payouts'
      },
      pricing: {
        title: 'Subscriptions and reports',
        description: 'Update prices and view revenue reports'
      }
    },
    verification: {
      intro: 'Only artists with a pending verification status are shown in this table.',
      requestCount: 'requests',
      emptyTitle: 'No requests to review',
      artistName: 'Artist name',
      email: 'Email',
      samples: 'Sample works',
      viewSamples: 'View sample works',
      detailTitle: 'Request details',
      pending: 'Pending approval',
      noSamples: 'No sample works have been submitted.',
      playSample: 'Play/review sample',
      rejectionReason: 'Rejection reason',
      rejectionPlaceholder: 'If rejecting the request, write the reason here.',
      approve: 'Approve',
      reject: 'Reject request',
      selectTitle: 'Select a request',
      selectDescription: 'Click “View sample works” to open the request details here.'
    },
    tickets: {
      intro: 'The table includes ticket ID, user, subject, sent date, and ticket status.',
      count: 'tickets',
      ticketId: 'Ticket ID',
      userName: 'User name',
      subject: 'Subject',
      sentDate: 'Sent date',
      status: 'Status',
      chatTitle: 'Reply chatbox',
      userPrefix: 'User',
      support: 'Support',
      replyLabel: 'Support reply',
      replyPlaceholder: 'Type your reply here...',
      sendReply: 'Send reply',
      closeTicket: 'Close ticket',
      emptyTitle: 'No tickets found'
    },
    audit: {
      title: 'Monthly financial calculation table',
      intro: 'Shows artist audit data, unique listeners, streams, calculated reward, and payment status.',
      adminOnly: 'System admin only',
      artistInfo: 'Artist name and specialist ID',
      month: 'Month',
      uniqueListeners: 'Unique listeners',
      streams: 'Registered streams',
      reward: 'Calculated reward',
      rewardFormula: 'Reward formula',
      paymentStatus: 'Payment status',
      paymentAction: 'Payment action',
      unknownArtist: 'Unknown artist',
      markPaid: 'Confirm settlement'
    },
    pricing: {
      controlTitle: 'Price control panel',
      controlDescription: 'The system admin can update Silver and Gold subscription prices without changing the code.',
      silverPrice: 'Silver subscription price',
      goldPrice: 'Gold subscription price',
      updatePrices: 'Update prices',
      saved: 'Prices were updated in the system.',
      reportsTitle: 'Charts and revenue reports',
      chartLabel: 'Pie chart showing user distribution by subscription tier',
      base: 'Base',
      silver: 'Silver',
      gold: 'Gold',
      subscriptionRevenue: 'Current month subscription revenue',
      paidRewards: 'Paid rewards',
      pendingRewards: 'Pending rewards'
    },
    notifications: {
      approvedTitle: 'Artist request approved',
      rejectedTitle: 'Artist request rejected',
      approvedMessage: (name: string) => `The artist account for ${name} has been approved and work management is now enabled.`,
      rejectedMessage: (name: string, reason: string) => `The artist request for ${name} was rejected. Reason: ${reason || 'No reason was provided.'}`
    }
  }
} satisfies Record<Language, unknown>;

export default function DashboardPage() {
  const { currentUser, users, refreshUsers } = useAuth();
  const [activeSection, setActiveSection] = useState<DashboardSection>('verification');
  const [artists, setArtists] = useState<Artist[]>(getCollection('artists'));
  const [tickets, setTickets] = useState<Ticket[]>(getCollection('tickets'));
  const [tracks, setTracks] = useState<Track[]>(getCollection('tracks'));
  const [storedAuditRows, setStoredAuditRows] = useState<AuditRow[]>(getCollection('auditRows'));
  const [pricing, setPricing] = useState<SubscriptionPricing>(getCollection('pricing'));
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [ticketReplies, setTicketReplies] = useState<Record<string, string>>({});
  const [pricingSaved, setPricingSaved] = useState(false);

  const language = currentUser?.preferences.language ?? 'en';
  const t = dashboardText[language];
  const ticketStatusLabel = ticketStatusLabels[language];
  const paymentStatusLabel = paymentStatusLabels[language];
  const isAdmin = currentUser ? canUseAdminPricing(currentUser.role) : false;
  const dashboardTitle = currentUser?.role === 'admin' ? 'admin' : 'support';

  useEffect(() => {
    const refreshFinancialData = () => {
      setTracks(getCollection('tracks'));
      setStoredAuditRows(getCollection('auditRows'));
    };

    const handleStorageUpdate = (event: Event) => {
      const detail = (event as CustomEvent<{ key?: string }>).detail;
      if (!detail?.key || detail.key === 'tracks' || detail.key === 'auditRows' || detail.key === 'reset') {
        refreshFinancialData();
      }
    };

    refreshFinancialData();
    window.addEventListener('focus', refreshFinancialData);
    window.addEventListener('storage-update', handleStorageUpdate);

    return () => {
      window.removeEventListener('focus', refreshFinancialData);
      window.removeEventListener('storage-update', handleStorageUpdate);
    };
  }, []);

  const auditRows = useMemo<AuditRow[]>(() => {
    const currentMonth = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date());

    return artists.map((artist) => {
      const artistTracks = tracks.filter((track) => track.artistId === artist.id);
      const storedRow = storedAuditRows.find((row) => row.artistId === artist.id);
      const uniqueStreamerIds = new Set<string>();
      let hasTrackedUniqueStreamers = false;

      artistTracks.forEach((track) => {
        if (track.uniqueStreamerIds?.length) {
          hasTrackedUniqueStreamers = true;
          track.uniqueStreamerIds.forEach((streamerId) => uniqueStreamerIds.add(streamerId));
        }
      });

      const trackStreamTotal = artistTracks.reduce((sum, track) => sum + (track.streams ?? 0), 0);
      const streamers = artistTracks.length ? trackStreamTotal : storedRow?.streams ?? artist.monthlyStreams ?? 0;
      const uniqueStreamers = hasTrackedUniqueStreamers
        ? uniqueStreamerIds.size
        : storedRow?.uniqueListeners ?? artist.monthlyListeners ?? 0;

      return {
        id: storedRow?.id ?? `audit-${artist.id}`,
        artistId: artist.id,
        month: storedRow?.month ?? currentMonth,
        uniqueListeners: uniqueStreamers,
        streams: streamers,
        reward: calculateArtistReward(uniqueStreamers, streamers),
        status: storedRow?.status ?? 'pending'
      };
    });
  }, [artists, storedAuditRows, tracks]);

  const availableSections = useMemo(
    () => [
      { id: 'verification' as const, title: t.sections.verification.title },
      { id: 'tickets' as const, title: t.sections.tickets.title },
      { id: 'audit' as const, title: t.sections.audit.title },
      ...(isAdmin ? [{ id: 'pricing' as const, title: t.sections.pricing.title }] : [])
    ],
    [isAdmin, t]
  );

  if (!currentUser) return <AppShell><div /></AppShell>;
  if (!canUseSupportDashboard(currentUser.role)) {
    return <AppShell><PageHeader title={dashboardTitle} /><EmptyState title={t.unauthorizedTitle} description={t.unauthorizedDescription} /></AppShell>;
  }

  const safeSection = availableSections.some((section) => section.id === activeSection) ? activeSection : 'verification';
  const pendingArtists = artists.filter((artist) => artist.status === 'pending');
  const selectedArtist = artists.find((artist) => artist.id === selectedArtistId) ?? pendingArtists[0];
  const selectedTicket = tickets.find((ticket) => ticket.id === selectedTicketId) ?? tickets[0];
  const persistArtists = (next: Artist[]) => {
    setArtists(next);
    setCollection('artists', next);
  };

  const persistTickets = (next: Ticket[]) => {
    setTickets(next);
    setCollection('tickets', next);
  };

  const pushArtistNotification = (artist: Artist, approved: boolean, reason?: string) => {
    const owner = users.find((user) => user.artistId === artist.id);
    const ownerLanguage = owner?.preferences.language ?? language;
    const notificationText = dashboardText[ownerLanguage].notifications;
    const notifications = getCollection('notifications') as AppNotification[];
    const nextNotification: AppNotification = {
      id: newId('notif'),
      role: 'artist',
      userId: owner?.id,
      title: approved ? notificationText.approvedTitle : notificationText.rejectedTitle,
      message: approved ? notificationText.approvedMessage(artist.name) : notificationText.rejectedMessage(artist.name, reason ?? ''),
      link: approved ? '/artist/manage' : '/notifications',
      isRead: false,
      createdAt: new Date().toISOString()
    };
    setCollection('notifications', [nextNotification, ...notifications]);
  };

  const approveArtist = (artistId: string) => {
    const artist = artists.find((item) => item.id === artistId);
    if (!artist) return;
    persistArtists(artists.map((item) => item.id === artistId ? { ...item, status: 'approved', verified: true, rejectionReason: undefined } : item));
    setCollection('users', users.map((user) => user.artistId === artistId ? { ...user, verifiedArtist: true } : user));
    pushArtistNotification(artist, true);
    setSelectedArtistId(null);
    setRejectionReason('');
    refreshUsers();
  };

  const rejectArtist = (artistId: string) => {
    const reason = rejectionReason.trim();
    if (!reason) return;
    const artist = artists.find((item) => item.id === artistId);
    if (!artist) return;
    persistArtists(artists.map((item) => item.id === artistId ? { ...item, status: 'rejected', verified: false, rejectionReason: reason } : item));
    pushArtistNotification(artist, false, reason);
    setSelectedArtistId(null);
    setRejectionReason('');
  };

  const answerTicket = (ticketId: string) => {
    const body = ticketReplies[ticketId]?.trim();
    const ticket = tickets.find((item) => item.id === ticketId);
    if (!body || !ticket) return;

    const createdAt = new Date().toISOString();
    persistTickets(tickets.map((item) => item.id === ticketId ? {
      ...item,
      status: 'answered',
      messages: [...item.messages, { from: 'support', body, createdAt }]
    } : item));

    const owner = users.find((user) => user.id === ticket.userId) ?? users.find((user) => user.displayName === ticket.userName);
    if (owner) {
      const ownerLanguage = owner.preferences.language;
      const notifications = getCollection('notifications') as AppNotification[];
      const nextNotification: AppNotification = {
        id: newId('notif'),
        role: owner.role,
        userId: owner.id,
        title: ownerLanguage === 'fa' ? 'پاسخ پشتیبانی' : 'Support reply',
        message: ownerLanguage === 'fa' ? `پشتیبان به تیکت «${ticket.subject}» پاسخ داد.` : `Support replied to your ticket “${ticket.subject}”.`,
        link: '/support',
        isRead: false,
        createdAt
      };
      setCollection('notifications', [nextNotification, ...notifications]);
    }

    setTicketReplies((current) => ({ ...current, [ticketId]: '' }));
  };

  const closeTicket = (ticketId: string) => {
    persistTickets(tickets.map((ticket) => ticket.id === ticketId ? { ...ticket, status: 'closed' } : ticket));
  };

  const markAuditRowPaid = (row: AuditRow) => {
    if (!isAdmin || row.status === 'paid') return;

    const paidRow: AuditRow = {
      ...row,
      status: 'paid'
    };

    const hasExistingRow = storedAuditRows.some((item) => item.artistId === row.artistId && item.month === row.month);
    const nextAuditRows = hasExistingRow
      ? storedAuditRows.map((item) => item.artistId === row.artistId && item.month === row.month ? { ...item, ...paidRow } : item)
      : [paidRow, ...storedAuditRows];

    setStoredAuditRows(nextAuditRows);
    setCollection('auditRows', nextAuditRows);
  };

  const savePricing = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isAdmin) return;
    const form = new FormData(event.currentTarget);
    const next: SubscriptionPricing = {
      silver: Math.max(0, Number(form.get('silver'))),
      gold: Math.max(0, Number(form.get('gold')))
    };
    setPricing(next);
    setCollection('pricing', next);
    setPricingSaved(true);
  };

  const goldCount = users.filter((user) => user.subscription === 'gold').length;
  const silverCount = users.filter((user) => user.subscription === 'silver').length;
  const baseCount = users.filter((user) => user.subscription === 'base').length;
  const totalSubscriptions = Math.max(baseCount + silverCount + goldCount, 1);
  const baseDeg = (baseCount / totalSubscriptions) * 360;
  const silverDeg = baseDeg + (silverCount / totalSubscriptions) * 360;
  const subscriptionRevenue = (silverCount * pricing.silver) + (goldCount * pricing.gold);
  const paidRewards = auditRows.filter((row) => row.status === 'paid').reduce((sum, row) => sum + row.reward, 0);
  const pendingRewards = auditRows.filter((row) => row.status === 'pending').reduce((sum, row) => sum + row.reward, 0);

  return (
    <AppShell>
      <PageHeader
        title={dashboardTitle}
        actions={<span className="badge">{t.currentRole}: {displayRoleLabel(currentUser.role, language)}</span>}
      />

      <div className="dashboard-shell">
        <aside className="dashboard-sidebar card">
          <strong>{t.sidebarTitle}</strong>
          <div className="dashboard-menu">
            {availableSections.map((section) => (
              <button
                key={section.id}
                className={`dashboard-menu-item ${safeSection === section.id ? 'active' : ''}`}
                type="button"
                onClick={() => setActiveSection(section.id)}
              >
                <span>{section.title}</span>
              </button>
            ))}
          </div>
        </aside>

        <main className="dashboard-content">
          {safeSection === 'verification' ? (
            <div className="grid cols-2">
              <section className="card">
                <div className="section-title" style={{ marginTop: 0 }}>
                  <div>
                    <h2>{t.sections.verification.title}</h2>
                  </div>
                  <span className="badge warning">{formatNumber(pendingArtists.length)} {t.verification.requestCount}</span>
                </div>

                {!pendingArtists.length ? <EmptyState title={t.verification.emptyTitle} /> : (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>{t.verification.artistName}</th>
                          <th>{t.verification.email}</th>
                          <th>{t.verification.samples}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingArtists.map((artist) => (
                          <tr key={artist.id}>
                            <td>{artist.name}</td>
                            <td>{artist.email}</td>
                            <td><button className="btn secondary" type="button" onClick={() => setSelectedArtistId(artist.id)}>{t.verification.viewSamples}</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className="card highlight">
                <h2>{t.verification.detailTitle}</h2>
                {selectedArtist && selectedArtist.status === 'pending' ? (
                  <div className="detail-panel">
                    <div>
                      <span className="badge warning">{t.verification.pending}</span>
                      <h3>{selectedArtist.name}</h3>
                      <p className="muted">{selectedArtist.email}</p>
                      <p>{selectedArtist.bio}</p>
                    </div>
                    <div className="sample-list">
                      {selectedArtist.sampleWorks.length ? selectedArtist.sampleWorks.map((sample) => (
                        <div className="sample-item" key={sample}>
                          <span>{sample}</span>
                          <button className="btn ghost" type="button">{t.verification.playSample}</button>
                        </div>
                      )) : <p className="muted">{t.verification.noSamples}</p>}
                    </div>
                    <div className="form-row">
                      <label className="label">{t.verification.rejectionReason}</label>
                      <textarea className="textarea" value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} placeholder={t.verification.rejectionPlaceholder} />
                    </div>
                    <div className="notification-actions">
                      <button className="btn primary" type="button" onClick={() => approveArtist(selectedArtist.id)}>{t.verification.approve}</button>
                      <button className="btn danger" type="button" disabled={!rejectionReason.trim()} onClick={() => rejectArtist(selectedArtist.id)}>{t.verification.reject}</button>
                    </div>
                  </div>
                ) : <EmptyState title={t.verification.selectTitle} description={t.verification.selectDescription} />}
              </section>
            </div>
          ) : null}

          {safeSection === 'tickets' ? (
            <div className="grid cols-2">
              <section className="card">
                <div className="section-title" style={{ marginTop: 0 }}>
                  <div>
                    <h2>{t.sections.tickets.title}</h2>
                  </div>
                  <span className="badge">{formatNumber(tickets.length)} {t.tickets.count}</span>
                </div>

                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>{t.tickets.ticketId}</th>
                        <th>{t.tickets.userName}</th>
                        <th>{t.tickets.subject}</th>
                        <th>{t.tickets.sentDate}</th>
                        <th>{t.tickets.status}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tickets.map((ticket) => (
                        <tr className="clickable-row" key={ticket.id} onClick={() => setSelectedTicketId(ticket.id)}>
                          <td>{ticket.id}</td>
                          <td>{ticket.userName}</td>
                          <td>{ticket.subject}</td>
                          <td>{formatDate(ticket.createdAt)}</td>
                          <td><span className={`badge ${ticket.status === 'closed' ? 'success' : ticket.status === 'open' ? 'warning' : ''}`}>{ticketStatusLabel[ticket.status]}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="card highlight">
                <h2>{t.tickets.chatTitle}</h2>
                {selectedTicket ? (
                  <div className="chatbox">
                    <div>
                      <span className="badge">{selectedTicket.id}</span>
                      <h3>{selectedTicket.subject}</h3>
                      <p className="muted">{t.tickets.userPrefix}: {selectedTicket.userName} · {t.tickets.status}: {ticketStatusLabel[selectedTicket.status]}</p>
                    </div>
                    <div className="chat-messages">
                      {selectedTicket.messages.map((message, index) => (
                        <div className={`chat-message ${message.from === 'support' ? 'support' : 'user'}`} key={`${message.createdAt}-${index}`}>
                          <strong>{message.from === 'support' ? t.tickets.support : selectedTicket.userName}</strong>
                          <p>{message.body}</p>
                          <small>{formatDate(message.createdAt)}</small>
                        </div>
                      ))}
                    </div>
                    <div className="form-row">
                      <label className="label">{t.tickets.replyLabel}</label>
                      <textarea
                        className="textarea"
                        value={ticketReplies[selectedTicket.id] ?? ''}
                        onChange={(event) => setTicketReplies((current) => ({ ...current, [selectedTicket.id]: event.target.value }))}
                        placeholder={t.tickets.replyPlaceholder}
                        disabled={selectedTicket.status === 'closed'}
                      />
                    </div>
                    <div className="notification-actions">
                      <button className="btn primary" type="button" disabled={selectedTicket.status === 'closed' || !(ticketReplies[selectedTicket.id] ?? '').trim()} onClick={() => answerTicket(selectedTicket.id)}>{t.tickets.sendReply}</button>
                      <button className="btn danger" type="button" disabled={selectedTicket.status === 'closed'} onClick={() => closeTicket(selectedTicket.id)}>{t.tickets.closeTicket}</button>
                    </div>
                  </div>
                ) : <EmptyState title={t.tickets.emptyTitle} />}
              </section>
            </div>
          ) : null}

          {safeSection === 'audit' ? (
            <section className="card">
              <div className="section-title" style={{ marginTop: 0 }}>
                <div>
                  <h2>{t.audit.title}</h2>
                </div>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>{t.audit.artistInfo}</th>
                      <th>{t.audit.uniqueListeners}</th>
                      <th>{t.audit.streams}</th>
                      <th>{t.audit.reward}</th>
                      <th>{t.audit.rewardFormula}</th>
                      <th>{t.audit.paymentStatus}</th>
                      {isAdmin ? <th>{t.audit.paymentAction}</th> : null}
                    </tr>
                  </thead>
                  <tbody>
                    {auditRows.map((row) => {
                      const artist = artists.find((item) => item.id === row.artistId);
                      return (
                        <tr key={row.id}>
                          <td><strong>{artist?.name ?? t.audit.unknownArtist}</strong><br /><small className="muted">{row.artistId}</small></td>
                          <td>{formatNumber(row.uniqueListeners)}</td>
                          <td>{formatNumber(row.streams)}</td>
                          <td>{formatCurrency(row.reward)}</td>
                          <td>
                            <code>{`(${formatNumber(row.uniqueListeners)} × 30) + (${formatNumber(row.streams)} × 10)`}</code>
                          </td>
                          <td><span className={`badge ${row.status === 'paid' ? 'success' : 'warning'}`}>{paymentStatusLabel[row.status]}</span></td>
                          {isAdmin ? (
                            <td>
                              <button
                                className={`btn ${row.status === 'paid' ? 'secondary' : 'primary'}`}
                                type="button"
                                disabled={row.status === 'paid'}
                                onClick={() => markAuditRowPaid(row)}
                              >
                                {row.status === 'paid' ? paymentStatusLabel.paid : t.audit.markPaid}
                              </button>
                            </td>
                          ) : null}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {safeSection === 'pricing' && isAdmin ? (
            <div className="grid cols-2">
              <section className="card">
                <h2>{t.pricing.controlTitle}</h2>
                <form className="form" onSubmit={savePricing}>
                  <div className="form-row">
                    <label className="label">{t.pricing.silverPrice}</label>
                    <input className="input" name="silver" type="number" min="0" defaultValue={pricing.silver} />
                  </div>
                  <div className="form-row">
                    <label className="label">{t.pricing.goldPrice}</label>
                    <input className="input" name="gold" type="number" min="0" defaultValue={pricing.gold} />
                  </div>
                  <button className="btn primary" type="submit">{t.pricing.updatePrices}</button>
                  {pricingSaved ? <span className="badge success">{t.pricing.saved}</span> : null}
                </form>
              </section>

              <section className="card highlight">
                <h2>{t.pricing.reportsTitle}</h2>
                <div className="subscription-chart-wrap">
                  <div
                    className="subscription-pie"
                    aria-label={t.pricing.chartLabel}
                    style={{ background: `conic-gradient(var(--primary-2) 0deg ${baseDeg}deg, var(--subtle) ${baseDeg}deg ${silverDeg}deg, var(--warning) ${silverDeg}deg 360deg)` }}
                  />
                  <div className="chart-legend">
                    <span><i className="legend-dot base" /> {t.pricing.base}: {formatNumber(baseCount)}</span>
                    <span><i className="legend-dot silver" /> {t.pricing.silver}: {formatNumber(silverCount)}</span>
                    <span><i className="legend-dot gold" /> {t.pricing.gold}: {formatNumber(goldCount)}</span>
                  </div>
                </div>
                <div className="stats dashboard-stats">
                  <div className="stat"><strong>{formatCurrency(subscriptionRevenue)}</strong><span className="muted">{t.pricing.subscriptionRevenue}</span></div>
                  <div className="stat"><strong>{formatCurrency(paidRewards)}</strong><span className="muted">{t.pricing.paidRewards}</span></div>
                  <div className="stat"><strong>{formatCurrency(pendingRewards)}</strong><span className="muted">{t.pricing.pendingRewards}</span></div>
                </div>
              </section>
            </div>
          ) : null}
        </main>
      </div>
    </AppShell>
  );
}
