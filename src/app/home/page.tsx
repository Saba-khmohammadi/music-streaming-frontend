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
        description="Main showcase with recent playlists, latest albums, popular tracks, and a special section for Gold users."
        actions={<span className="badge warning">Subscription: {subscriptionLabels[currentUser.subscription]}</span>}
      />

      <section className="grid cols-4">
        <div className="stat"><strong>{formatNumber(currentUser.dailyStreams)}</strong><span className="muted">Streams today</span></div>
        <div className="stat"><strong>{formatNumber(currentUser.followers)}</strong><span className="muted">Followers</span></div>
        <div className="stat"><strong>{formatNumber(currentUser.following)}</strong><span className="muted">Following</span></div>
        <div className="stat"><strong>{currentUser.role}</strong><span className="muted">Current role</span></div>
      </section>

      {canAccessEarlyRelease(currentUser.subscription) ? (
        <>
          <div className="section-title"><h2>Early Access Gold</h2><span className="badge warning">Gold Only</span></div>
          <div className="grid cols-3">
            {early.map((album) => <AlbumCard key={album.id} album={album} artist={artists.find((artist) => artist.id === album.artistId)} />)}
          </div>
        </>
      ) : (
        <div className="card highlight" style={{ marginTop: 24 }}>
          <h2>Upgrade for early access</h2>
          <p className="muted">Gold users can see new releases earlier.</p>
          <Link className="btn primary" href="/settings">View subscriptions</Link>
        </div>
      )}

      <div className="section-title"><h2>Recently Played Playlists</h2><Link className="btn ghost" href="/playlists">All playlists</Link></div>
      <div className="grid cols-3">
        {userPlaylists.map((playlist) => (
          <Link className="card" key={playlist.id} href="/playlists">
            <img className="cover" src={playlist.coverUrl} alt={playlist.title} />
            <h3>{playlist.title}</h3>
            <p className="muted">{formatNumber(playlist.trackIds.length)} tracks</p>
          </Link>
        ))}
      </div>

      <div className="section-title"><h2>Latest Albums</h2><Link className="btn ghost" href="/library">Music Library</Link></div>
      <div className="grid cols-4">
        {latestAlbums.map((album) => <AlbumCard key={album.id} album={album} artist={artists.find((artist) => artist.id === album.artistId)} />)}
      </div>

      <div className="section-title"><h2>Popular Tracks</h2></div>
      <div className="grid">
        {popularTracks.map((track) => <TrackCard key={track.id} track={track} queueIds={popularTracks.map((item) => item.id)} />)}
      </div>
    </AppShell>
  );
}
