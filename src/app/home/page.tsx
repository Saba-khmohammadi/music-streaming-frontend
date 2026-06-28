'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import AlbumCard from '@/components/AlbumCard';
import AppShell from '@/components/AppShell';
import PageHeader from '@/components/PageHeader';
import TrackCard from '@/components/TrackCard';
import { useAuth } from '@/context/AuthContext';
import {
  getActiveEarlyAlbums,
  getActiveEarlyTracks,
  getPublicAlbums,
  getPublicTracks,
  syncExpiredEarlyAccess
} from '@/lib/earlyAccess';
import { getCollection } from '@/lib/storage';
import { canAccessEarlyRelease, subscriptionLabels } from '@/lib/rules';
import { formatNumber } from '@/lib/format';
import type { Album, Artist, Playlist, Track } from '@/types/domain';

export default function HomePage() {
  const { currentUser } = useAuth();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    syncExpiredEarlyAccess();
    const timer = window.setInterval(() => {
      syncExpiredEarlyAccess();
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const albums = getCollection('albums') as Album[];
  const artists = getCollection('artists') as Artist[];
  const tracks = getCollection('tracks') as Track[];
  const playlists = getCollection('playlists') as Playlist[];

  const publicAlbums = useMemo(() => getPublicAlbums(albums, now), [albums, now]);
  const publicTracks = useMemo(() => getPublicTracks(tracks, albums, now), [albums, now, tracks]);
  const earlyAlbums = useMemo(() => getActiveEarlyAlbums(albums, now), [albums, now]);
  const earlyTracks = useMemo(
    () => getActiveEarlyTracks(tracks, now).filter((track) => !track.albumId),
    [now, tracks]
  );

  if (!currentUser) return <AppShell><div /></AppShell>;

  const userPlaylists = playlists.filter((playlist) => playlist.ownerId === currentUser.id || currentUser.role === 'admin').slice(0, 3);
  const latestAlbums = [...publicAlbums].sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()).slice(0, 4);
  const popularTracks = [...publicTracks].sort((a, b) => b.listeners - a.listeners).slice(0, 5);

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
          <div className="premium-section-title"><h2>Early Access Gold</h2><Link className="btn-ghost-small" href="/early-access">View All</Link></div>
          {earlyAlbums.length || earlyTracks.length ? (
            <>
              {earlyAlbums.length ? (
                <div className="premium-grid-albums">
                  {earlyAlbums.slice(0, 4).map((album) => <AlbumCard key={album.id} album={album} artist={artists.find((artist) => artist.id === album.artistId)} />)}
                </div>
              ) : null}
              {earlyTracks.length ? (
                <div className="grid" style={{ marginTop: 16 }}>
                  {earlyTracks.slice(0, 4).map((track) => <TrackCard key={track.id} track={track} queueIds={earlyTracks.map((item) => item.id)} />)}
                </div>
              ) : null}
            </>
          ) : (
            <div className="card"><p className="muted">No active Early Access releases right now.</p></div>
          )}
        </>
      ) : (
        <div className="premium-upgrade-card">
          <div className="upgrade-icon">
            <i className="fas fa-crown"></i>
          </div>
          <div className="upgrade-content">
            <h2>Unlock Early Access</h2>
            <p>Gold members can hear new songs and albums for the first two minutes before they become public.</p>
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

      <div className="premium-section-title"><h2>Latest Public Albums</h2><Link className="btn-ghost-small" href="/library">View All</Link></div>
      <div className="premium-grid-albums">
        {latestAlbums.map((album) => <AlbumCard key={album.id} album={album} artist={artists.find((artist) => artist.id === album.artistId)} />)}
      </div>

      <div className="premium-section-title"><h2>Popular Public Tracks</h2><Link className="btn-ghost-small" href="/library">View All</Link></div>
      <div className="grid">
        {popularTracks.map((track) => <TrackCard key={track.id} track={track} queueIds={popularTracks.map((item) => item.id)} />)}
      </div>
    </AppShell>
  );
}
