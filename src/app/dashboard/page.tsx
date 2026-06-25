'use client';

import { FormEvent, useState } from 'react';
import AppShell from '@/components/AppShell';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { canUseAdminPricing, canUseSupportDashboard } from '@/lib/rules';
import { formatCurrency, formatDate, formatNumber } from '@/lib/format';
import { getCollection, setCollection } from '@/lib/storage';
import type { Artist, AuditRow, SubscriptionPricing, Ticket, User } from '@/types/domain';

type Tab = 'verification' | 'tickets' | 'audit' | 'pricing';

export default function DashboardPage() {
  const { currentUser, refreshUsers } = useAuth();
  const [tab, setTab] = useState<Tab>('verification');
  const [artists, setArtists] = useState<Artist[]>(getCollection('artists'));
  const [tickets, setTickets] = useState<Ticket[]>(getCollection('tickets'));
  const [auditRows, setAuditRows] = useState<AuditRow[]>(getCollection('auditRows'));
  const [pricing, setPricing] = useState<SubscriptionPricing>(getCollection('pricing'));
  const users = getCollection('users') as User[];

  if (!currentUser) return <AppShell><div /></AppShell>;
  if (!canUseSupportDashboard(currentUser.role)) {
    return <AppShell><PageHeader title="Dashboard" /><EmptyState title="Access denied" description="This page is for support users and the system admin." /></AppShell>;
  }

  const persistArtists = (next: Artist[]) => { setArtists(next); setCollection('artists', next); };
  const persistTickets = (next: Ticket[]) => { setTickets(next); setCollection('tickets', next); };
  const persistAudit = (next: AuditRow[]) => { setAuditRows(next); setCollection('auditRows', next); };

  const approveArtist = (artistId: string) => {
    persistArtists(artists.map((artist) => artist.id === artistId ? { ...artist, status: 'approved', verified: true, rejectionReason: undefined } : artist));
    const nextUsers = users.map((user) => user.artistId === artistId ? { ...user, verifiedArtist: true } : user);
    setCollection('users', nextUsers);
    refreshUsers();
  };

  const rejectArtist = (artistId: string) => {
    const reason = window.prompt('Enter rejection reason:', 'The sample work quality is not sufficient for approval.');
    persistArtists(artists.map((artist) => artist.id === artistId ? { ...artist, status: 'rejected', verified: false, rejectionReason: reason || undefined } : artist));
  };

  const answerTicket = (ticketId: string) => {
    const body = window.prompt('Support reply:');
    if (!body) return;
    persistTickets(tickets.map((ticket) => ticket.id === ticketId ? { ...ticket, status: 'answered', messages: [...ticket.messages, { from: 'support', body, createdAt: new Date().toISOString() }] } : ticket));
  };

  const closeTicket = (ticketId: string) => persistTickets(tickets.map((ticket) => ticket.id === ticketId ? { ...ticket, status: 'closed' } : ticket));

  const markPaid = (rowId: string) => {
    if (!canUseAdminPricing(currentUser.role)) return;
    persistAudit(auditRows.map((row) => row.id === rowId ? { ...row, status: 'paid' } : row));
  };

  const savePricing = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canUseAdminPricing(currentUser.role)) return;
    const form = new FormData(event.currentTarget);
    const next = { silver: Number(form.get('silver')), gold: Number(form.get('gold')) };
    setPricing(next);
    setCollection('pricing', next);
  };

  const pendingArtists = artists.filter((artist) => artist.status === 'pending');
  const goldCount = users.filter((user) => user.subscription === 'gold').length;
  const silverCount = users.filter((user) => user.subscription === 'silver').length;
  const baseCount = users.filter((user) => user.subscription === 'base').length;

  return (
    <AppShell>
      <PageHeader title="Support and Admin Dashboard" description="Management panel with different access levels: support handles tickets and artist verification; admin handles audits, pricing, and reports." />
      <div className="tabs">
        <button className={`tab ${tab === 'verification' ? 'active' : ''}`} onClick={() => setTab('verification')}>Tickets and Verification</button>
        <button className={`tab ${tab === 'tickets' ? 'active' : ''}`} onClick={() => setTab('tickets')}>Support Tickets</button>
        <button className={`tab ${tab === 'audit' ? 'active' : ''}`} onClick={() => setTab('audit')}>Audit</button>
        <button className={`tab ${tab === 'pricing' ? 'active' : ''}`} onClick={() => setTab('pricing')}>Subscriptions and Reports</button>
      </div>

      {tab === 'verification' ? (
        <section className="card">
          <h2>Artist Verification Requests</h2>
          {!pendingArtists.length ? <EmptyState title="No requests to review" /> : (
            <div className="table-wrap"><table><thead><tr><th>Stage name</th><th>Email</th><th>Sample works</th><th>Actions</th></tr></thead><tbody>{pendingArtists.map((artist) => (
              <tr key={artist.id}><td>{artist.name}</td><td>{artist.email}</td><td>{artist.sampleWorks.join(', ') || '—'}</td><td><button className="btn secondary" onClick={() => approveArtist(artist.id)}>Approve</button> <button className="btn danger" onClick={() => rejectArtist(artist.id)}>Reject</button></td></tr>
            ))}</tbody></table></div>
          )}
        </section>
      ) : null}

      {tab === 'tickets' ? (
        <section className="card">
          <h2>Support Tickets</h2>
          <div className="table-wrap"><table><thead><tr><th>ID</th><th>User</th><th>Subject</th><th>Submitted at</th><th>Status</th><th>Conversation and actions</th></tr></thead><tbody>{tickets.map((ticket) => (
            <tr key={ticket.id}>
              <td>{ticket.id}</td><td>{ticket.userName}</td><td>{ticket.subject}</td><td>{formatDate(ticket.createdAt)}</td><td><span className="badge">{ticket.status}</span></td>
              <td><details><summary className="btn ghost">View conversation</summary><div className="grid" style={{ marginTop: 12 }}>{ticket.messages.map((message, index) => <div className="card" key={index}><strong>{message.from === 'user' ? 'User' : 'Support'}</strong><p>{message.body}</p></div>)}</div></details><button className="btn secondary" onClick={() => answerTicket(ticket.id)}>Send reply</button> <button className="btn danger" onClick={() => closeTicket(ticket.id)}>Close</button></td>
            </tr>
          ))}</tbody></table></div>
        </section>
      ) : null}

      {tab === 'audit' ? (
        <section className="card">
          <h2>Monthly Financial Calculations</h2>
          <div className="table-wrap"><table><thead><tr><th>Artist</th><th>Month</th><th>Unique listeners</th><th>Streams</th><th>Reward</th><th>Status</th><th>Payment action</th></tr></thead><tbody>{auditRows.map((row) => {
            const artist = artists.find((item) => item.id === row.artistId);
            return <tr key={row.id}><td>{artist?.name ?? row.artistId}</td><td>{row.month}</td><td>{formatNumber(row.uniqueListeners)}</td><td>{formatNumber(row.streams)}</td><td>{formatCurrency(row.reward)}</td><td><span className={`badge ${row.status === 'paid' ? 'success' : 'warning'}`}>{row.status === 'paid' ? 'Paid' : 'Pending payment'}</span></td><td><button className="btn secondary" disabled={!canUseAdminPricing(currentUser.role) || row.status === 'paid'} onClick={() => markPaid(row.id)}>Confirm payout</button></td></tr>;
          })}</tbody></table></div>
        </section>
      ) : null}

      {tab === 'pricing' ? (
        <div className="grid cols-2">
          <section className="card">
            <h2>Pricing Control Panel</h2>
            {!canUseAdminPricing(currentUser.role) ? <p className="muted">Only the system admin can change pricing.</p> : null}
            <form className="form" onSubmit={savePricing}>
              <div className="form-row"><label className="label">Silver subscription price</label><input className="input" name="silver" type="number" defaultValue={pricing.silver} disabled={!canUseAdminPricing(currentUser.role)} /></div>
              <div className="form-row"><label className="label">Gold subscription price</label><input className="input" name="gold" type="number" defaultValue={pricing.gold} disabled={!canUseAdminPricing(currentUser.role)} /></div>
              <button className="btn primary" disabled={!canUseAdminPricing(currentUser.role)}>Update prices</button>
            </form>
          </section>
          <section className="card highlight">
            <h2>User Distribution Report</h2>
            <div className="stats" style={{ gridTemplateColumns: '1fr' }}>
              <div className="stat"><strong>{formatNumber(baseCount)}</strong><span className="muted">Base subscription</span></div>
              <div className="stat"><strong>{formatNumber(silverCount)}</strong><span className="muted">Silver subscription</span></div>
              <div className="stat"><strong>{formatNumber(goldCount)}</strong><span className="muted">Gold subscription</span></div>
            </div>
            <p className="muted">In Phase 2, this section can be powered by aggregated backend APIs.</p>
          </section>
        </div>
      ) : null}
    </AppShell>
  );
}
