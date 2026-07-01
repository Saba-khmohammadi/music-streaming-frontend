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
  const [isSectionsOpen, setIsSectionsOpen] = useState(true);
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

  useEffect(() => {
    const handleSectionChange = (e: Event) => {
      const customEvent = e as CustomEvent<DashboardSection>;
      if (customEvent.detail) {
        setActiveSection(customEvent.detail); // آپدیت کردن بخش فعال داشبورد
      }
    };

    // گوش دادن به کلیک‌های سایدبار اصلی
    window.addEventListener('change-admin-section', handleSectionChange);
    
    return () => {
      window.removeEventListener('change-admin-section', handleSectionChange);
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
  
      {/* 🌟 ۱. کلاس قدیمی "dashboard-shell" را به "dashboard-main-content-wrapper" تغییر دادیم */}
      <div className="dashboard-main-content-wrapper">
        
        {/* 🌟 ۲. تگ <main> بدون هیچ مزاحمتی تمام‌صفحه و عریض لود می‌شود */}
        <main className="dashboard-content" style={{ width: '100%' }}>
          {safeSection === 'verification' ? (
            <div className="grid cols-2">
              <section className="card">
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
                            <td>
                              <button className="btn-view-action" type="button" onClick={() => setSelectedArtistId(artist.id)} title={t.verification.viewSamples}>
                                <i className="fas fa-eye"></i> 
                              </button>
                            </td>
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
                    {/* 🌟 بج زرد رنگ و آن متن خطی اضافه کلاً حذف شدند تا ظاهر پنل نفس بکشد */}
                    <h3>{selectedArtist.name}</h3>
                    <p className="muted">{selectedArtist.email}</p>
                    <p style={{ marginTop: '12px', lineHeight: '1.6', opacity: 0.85 }}>{selectedArtist.bio}</p>
                  </div>
                
                  <div className="sample-list" style={{ display: 'grid', gap: '10px' }}>
                    {selectedArtist.sampleWorks.length ? selectedArtist.sampleWorks.map((sample) => (
                      <div className="sample-item" key={sample}>
                        <span style={{ fontSize: '14px', fontWeight: 500 }}>
                          <i className="fas fa-music" style={{ marginRight: '8px', opacity: 0.5 }}></i>
                          {sample}
                        </span>
                        <button className="btn-view-action" type="button" title={t.verification.playSample}>
                          <i className="fas fa-play" style={{ fontSize: '11px', marginLeft: '2px' }}></i>
                        </button>
                      </div>
                    )) : <p className="muted">{t.verification.noSamples}</p>}
                  </div>
                
                  <div className="form-row" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label className="label" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.6 }}>
                      {t.verification.rejectionReason}
                    </label>
                    <textarea 
                      className="textarea" 
                      value={rejectionReason} 
                      onChange={(event) => setRejectionReason(event.target.value)} 
                      placeholder={t.verification.rejectionPlaceholder} 
                    />
                  </div>
                
                  <div className="notification-actions" style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                    {/* دکمه تایید */}
                    <button 
                      className="btn-interactive approve" 
                      type="button" 
                      onClick={() => approveArtist(selectedArtist.id)}
                    >
                      <i className="fas fa-check-circle"></i> {t.verification.approve}
                    </button>
                    
                    {/* دکمه رد درخواست */}
                    <button 
                      className="btn-interactive reject" 
                      type="button" 
                      disabled={!rejectionReason.trim()} 
                      onClick={() => rejectArtist(selectedArtist.id)}
                    >
                      <i className="fas fa-times-circle"></i> {t.verification.reject}
                    </button>
                  </div>
                </div>
                ) : <EmptyState title={t.verification.selectTitle} description={t.verification.selectDescription} />}
              </section>
              
            </div>
          ) : null}
  
          {safeSection === 'tickets' ? (
            <div className="grid cols-2">
              <section className="card">
                {/* 🌟 ۱. حذف بجِ تعداد تیکت‌ها و شیک کردن هدر جدول */}
                <div className="verification-header-zone" style={{ marginBottom: '24px' }}>
                  <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>{t.sections.tickets.title}</h2>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--muted)' }}>
                    {language === 'fa' ? `تیکت‌های دریافتی پشتیبانی: ${tickets.length}` : `Received support tickets: ${tickets.length}`}
                  </p>
                </div>

                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>{t.tickets.ticketId}</th>
                        <th>{t.tickets.userName}</th>
                        <th>{t.tickets.subject}</th>
                        <th>{t.tickets.sentDate}</th>
                        {/* 🌟 راست‌چین کردن هدر وضعیت برای تعادل بصری */}
                        <th style={{ textAlign: 'right', paddingRight: '24px' }}>{t.tickets.status}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tickets.map((ticket) => (
                        <tr className="clickable-row" key={ticket.id} onClick={() => setSelectedTicketId(ticket.id)}>
                          <td style={{ fontWeight: 600, color: '#a855f7' }}>{ticket.id}</td>
                          <td>{ticket.userName}</td>
                          <td style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ticket.subject}</td>
                          <td style={{ fontSize: '13px', color: 'var(--muted)' }}>{formatDate(ticket.createdAt)}</td>
                          {/* 🌟 ۲. استفاده از سیستم بج مدرن و مینی برای وضعیت‌ها */}
                          <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                            <span className={`ticket-status-dot ${ticket.status}`}>
                              {ticketStatusLabel[ticket.status]}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
  
              <section className="card highlight">
                {selectedTicket ? (
                  <div className="chatbox">
                    {/* 🌟 ۱. هدرِ جدیدِ چت‌باکس: خلوت، باکلاس و بدون متونِ تکراری مزاحم */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '16px' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>{selectedTicket.subject}</h3>
                        <p className="muted" style={{ margin: '4px 0 0 0', fontSize: '12px' }}>
                          {t.tickets.userPrefix}: {selectedTicket.userName}
                        </p>
                      </div>
                      <span className="badge" style={{ background: 'rgba(168, 85, 247, 0.1)', borderColor: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', fontVariantNumeric: 'tabular-nums' }}>
                        {selectedTicket.id}
                      </span>
                    </div>

                    {/* 🌟 ۲. بخش پیام‌ها با ساختار جدید حبابی (Bubble style) */}
                    <div className="chat-messages">
                      {selectedTicket.messages.map((message, index) => {
                        const isSupport = message.from === 'support';
                        return (
                          <div className={`chat-message-bubble ${isSupport ? 'support' : 'user'}`} key={`${message.createdAt}-${index}`}>
                            <div className="bubble-meta">
                              <strong>{isSupport ? t.tickets.support : selectedTicket.userName}</strong>
                              <small>{formatDate(message.createdAt)}</small>
                            </div>
                            <p>{message.body}</p>
                          </div>
                        );
                      })}
                    </div>

                    {/* 🌟 ۳. فرم ارسال پاسخ ادمین */}
                    <div className="form-row" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                      <label className="label" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.4 }}>
                        {t.tickets.replyLabel}
                      </label>
                      <textarea
                        className="textarea"
                        value={ticketReplies[selectedTicket.id] ?? ''}
                        onChange={(event) => setTicketReplies((current) => ({ ...current, [selectedTicket.id]: event.target.value }))}
                        placeholder={t.tickets.replyPlaceholder}
                        disabled={selectedTicket.status === 'closed'}
                      />
                    </div>

                    <div className="notification-actions" style={{ display: 'flex', gap: '12px' }}>
                      <button 
                        className="btn-interactive approve" 
                        type="button" 
                        disabled={selectedTicket.status === 'closed' || !(ticketReplies[selectedTicket.id] ?? '').trim()} 
                        onClick={() => answerTicket(selectedTicket.id)}
                      >
                        <i className="fas fa-paper-plane"></i> {t.tickets.sendReply}
                      </button>
                      <button 
                        className="btn-interactive reject" 
                        type="button" 
                        disabled={selectedTicket.status === 'closed'} 
                        onClick={() => closeTicket(selectedTicket.id)}
                      >
                        <i className="fas fa-lock"></i> {t.tickets.closeTicket}
                      </button>
                    </div>
                  </div>
                ) : <EmptyState title={t.tickets.emptyTitle} />}
              </section>
            </div>
          ) : null}
  
          {safeSection === 'audit' ? (
            <section className="card">
              <div className="verification-header-zone" style={{ marginBottom: '24px' }}>
                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>{t.audit.title}</h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--muted)' }}>
                  {language === 'fa' ? 'لیست تراکنش‌ها و تسویه حساب هنرمندان' : 'Artists transactions and settlements audit log'}
                </p>
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
                      {isAdmin ? <th style={{ textAlign: 'right', paddingRight: '20px' }}>{t.audit.paymentAction}</th> : null}
                    </tr>
                  </thead>
                  <tbody>
                    {auditRows.map((row) => {
                      const artist = artists.find((item) => item.id === row.artistId);
                      const isPaid = row.status === 'paid';

                      return (
                        <tr key={row.id}>
                          <td>
                            <strong style={{ display: 'block', color: '#fff' }}>{artist?.name ?? t.audit.unknownArtist}</strong>
                            <small className="muted">{row.artistId}</small>
                          </td>
                          <td className="tabular-nums">{formatNumber(row.uniqueListeners)}</td>
                          <td className="tabular-nums">{formatNumber(row.streams)}</td>
                          <td style={{ color: '#22c55e', fontWeight: 600 }} className="tabular-nums">
                            {formatCurrency(row.reward)}
                          </td>
                          <td>
                            <code style={{ background: 'rgba(255,255,255,0.03)', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontVariantNumeric: 'tabular-nums' }}>
                              {`(${formatNumber(row.uniqueListeners)} × 30) + (${formatNumber(row.streams)} × 10)`}
                            </code>
                          </td>
                          {/* 🌟 بج وضعیت پرداخت به نقطه‌های نئونی تبدیل شد */}
                          <td>
                            <span className={`financial-status-dot ${row.status}`}>
                              {paymentStatusLabel[row.status]}
                            </span>
                          </td>
                          {/* 🌟 دکمه عملیات تسویه تعاملی و جمع‌وجور شد */}
                          {isAdmin ? (
                            <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                              {isPaid ? (
                                <span style={{ color: '#34d399', fontSize: '13px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                  <i className="fas fa-check-circle"></i> {paymentStatusLabel.paid}
                                </span>
                              ) : (
                                <button
                                  className="btn-interactive approve"
                                  type="button"
                                  style={{ height: '34px', fontSize: '12px', padding: '0 14px', width: 'auto', minHeight: 'auto', borderRadius: '8px' }}
                                  onClick={() => markAuditRowPaid(row)}
                                >
                                  <i className="fas fa-wallet"></i> {t.audit.markPaid}
                                </button>
                              )}
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
              {/* کارت مدیریت قیمت‌ها */}
              <section className="card">
                <div className="verification-header-zone" style={{ marginBottom: '24px' }}>
                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>{t.pricing.controlTitle}</h2>
                </div>
                <form className="form" onSubmit={savePricing}>
                  <div className="form-row" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="label" style={{ fontSize: '12px', opacity: 0.6 }}>{t.pricing.silverPrice}</label>
                    <input className="input premium-glass-input" name="silver" type="number" min="0" defaultValue={pricing.silver} />
                  </div>
                  <div className="form-row" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="label" style={{ fontSize: '12px', opacity: 0.6 }}>{t.pricing.goldPrice}</label>
                    <input className="input premium-glass-input" name="gold" type="number" min="0" defaultValue={pricing.gold} />
                  </div>
                  <button className="btn-interactive approve" type="submit" style={{ marginTop: '8px', height: '42px' }}>
                    <i className="fas fa-sync-alt"></i> {t.pricing.updatePrices}
                  </button>
                  {pricingSaved ? (
                    <div style={{ marginTop: '8px' }} className="badge success">{t.pricing.saved}</div>
                  ) : null}
                </form>
              </section>

              {/* کارت نمودار و آمارهای کلان سایت */}
              <section className="card highlight">
                <div className="verification-header-zone" style={{ marginBottom: '24px' }}>
                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>{t.pricing.reportsTitle}</h2>
                </div>
                <div className="subscription-chart-wrap" style={{ gap: '24px' }}>
                  <div
                    className="subscription-pie"
                    aria-label={t.pricing.chartLabel}
                    style={{ 
                      background: `conic-gradient(#06b6d4 0deg ${baseDeg}deg, #cbd5e1 ${baseDeg}deg ${silverDeg}deg, #f59e0b ${silverDeg}deg 360deg)`,
                      border: 'none',
                      boxShadow: '0 0 20px rgba(0,0,0,0.3)'
                    }}
                  />
                  <div className="chart-legend" style={{ gap: '12px' }}>
                    <span style={{ fontSize: '14px' }}><i className="legend-dot base" style={{ boxShadow: '0 0 8px #06b6d4' }} /> {t.pricing.base}: <strong className="tabular-nums" style={{ color: '#fff' }}>{formatNumber(baseCount)}</strong></span>
                    <span style={{ fontSize: '14px' }}><i className="legend-dot silver" style={{ boxShadow: '0 0 8px #cbd5e1' }} /> {t.pricing.silver}: <strong className="tabular-nums" style={{ color: '#fff' }}>{formatNumber(silverCount)}</strong></span>
                    <span style={{ fontSize: '14px' }}><i className="legend-dot gold" style={{ boxShadow: '0 0 8px #f59e0b' }} /> {t.pricing.gold}: <strong className="tabular-nums" style={{ color: '#fff' }}>{formatNumber(goldCount)}</strong></span>
                  </div>
                </div>
                
                {/* باکس سه تایی آمارهای مالی انتهای صفحه */}
                <div className="stats dashboard-stats" style={{ marginTop: '24px', gap: '12px' }}>
                  <div className="stat" style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <strong className="tabular-nums" style={{ color: '#fff' }}>{formatCurrency(subscriptionRevenue)}</strong>
                    <span className="muted" style={{ fontSize: '12px' }}>{t.pricing.subscriptionRevenue}</span>
                  </div>
                  <div className="stat" style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <strong className="tabular-nums" style={{ color: '#22c55e' }}>{formatCurrency(paidRewards)}</strong>
                    <span className="muted" style={{ fontSize: '12px' }}>{t.pricing.paidRewards}</span>
                  </div>
                  <div className="stat" style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <strong className="tabular-nums" style={{ color: '#fbbf24' }}>{formatCurrency(pendingRewards)}</strong>
                    <span className="muted" style={{ fontSize: '12px' }}>{t.pricing.pendingRewards}</span>
                  </div>
                </div>
              </section>
            </div>
          ) : null}
  
          
        </main>
      </div>
    </AppShell>
  );
}
