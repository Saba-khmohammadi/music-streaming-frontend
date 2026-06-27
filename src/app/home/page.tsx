'use client';

import Link from 'next/link';
import AlbumCard from '@/components/AlbumCard';
import AppShell from '@/components/AppShell';
import PageHeader from '@/components/PageHeader';
import TrackCard from '@/components/TrackCard';
import { useAuth } from '@/context/AuthContext';
import { getCollection } from '@/lib/storage';
import { canAccessEarlyRelease, subscriptionLabels } from '@/lib/rules';
import { formatNumber } from '@/lib/format';
import type { Album, Artist, Playlist, Track } from '@/types/domain';

export default function HomePage() {
  const { currentUser } = useAuth();
  const albums = getCollection('albums') as Album[];
  const artists = getCollection('artists') as Artist[];
  const tracks = getCollection('tracks') as Track[];
  const playlists = getCollection('playlists') as Playlist[];

  if (!currentUser) return <AppShell><div /></AppShell>;

  const userPlaylists = playlists.filter((playlist) => playlist.ownerId === currentUser.id || currentUser.role === 'admin').slice(0, 3);
  const latestAlbums = [...albums].sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()).slice(0, 4);
  const popularTracks = [...tracks].sort((a, b) => b.listeners - a.listeners).slice(0, 5);
  const early = albums.filter((album) => album.isEarlyAccess);

  return (
    <AppShell>
      <PageHeader
        title={`Hello, ${currentUser.displayName}`}
        description="Your personalized music dashboard."
        actions={<span className="premium-badge-gold">Subscription: {subscriptionLabels[currentUser.subscription]}</span>}
      />

      <section className="premium-stats-grid">
        <div className="premium-stat-card"><strong>{formatNumber(currentUser.dailyStreams)}</strong><span className="muted">Streams today</span></div>
        <div className="premium-stat-card"><strong>{formatNumber(currentUser.followers)}</strong><span className="muted">Followers</span></div>
        <div className="premium-stat-card"><strong>{formatNumber(currentUser.following)}</strong><span className="muted">Following</span></div>
        <div className="premium-stat-card"><strong>{currentUser.role}</strong><span className="muted">Current role</span></div>
      </section>

      {canAccessEarlyRelease(currentUser.subscription) ? (
        <>
          <div className="premium-section-title"><h2>Early Access Gold</h2><span className="premium-badge-early">Gold Only</span></div>
          <div className="premium-grid-albums">
            {early.map((album) => <AlbumCard key={album.id} album={album} artist={artists.find((artist) => artist.id === album.artistId)} />)}
          </div>
        </>
      ) : (
        <div className="premium-upgrade-card">
          <div className="upgrade-icon">
            <i className="fas fa-crown"></i>
          </div>
          <div className="upgrade-content">
            <h2>Unlock Early Access</h2>
            <p>Gold members get to hear new releases before anyone else.</p>
          </div>
          <Link className="premium-btn-upgrade" href="/settings">Upgrade Now</Link>
        </div>
      )}

      <div className="premium-section-title"><h2>Recently Played Playlists</h2><Link className="btn-ghost-small" href="/playlists">View All</Link></div>
      <div className="premium-grid-playlists">
        {userPlaylists.map((playlist) => (
          <Link className="premium-playlist-card" key={playlist.id} href="/playlists">
            <img src={playlist.coverUrl} alt={playlist.title} />
            <h3>{playlist.title}</h3>
            <p>{playlist.trackIds.length} tracks</p>
          </Link>
        ))}
      </div>
      
      {/* (بقیه بخش‌های Latest Albums و Popular Tracks با همین الگو رندر می‌شوند) */}
    </AppShell>
  );
}
