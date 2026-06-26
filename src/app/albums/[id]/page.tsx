'use client';

import Link from 'next/link';
import AppShell from '@/components/AppShell';
import PageHeader from '@/components/PageHeader';
import TrackCard from '@/components/TrackCard';
import { useAuth } from '@/context/AuthContext';
import { getCollection } from '@/lib/storage';
import { formatDate, formatNumber } from '@/lib/format';
import { canSeeAnalytics } from '@/lib/rules';
import type { Album, Artist, Track } from '@/types/domain';

export default function AlbumPage({ params }: { params: { id: string } }) {
  const { currentUser } = useAuth();
  const albums = getCollection('albums') as Album[];
  const artists = getCollection('artists') as Artist[];
  const tracks = getCollection('tracks') as Track[];
  const album = albums.find((item) => item.id === params.id);

  if (!album) {
    return <AppShell><PageHeader title="Album not found" /><Link className="btn" href="/library">Back to Library</Link></AppShell>;
  }
  const artist = artists.find((item) => item.id === album.artistId);
  const albumTracks = album.trackIds.map((id) => tracks.find((track) => track.id === id)).filter(Boolean) as Track[];
  const showAnalytics = currentUser ? canSeeAnalytics(currentUser.subscription) : false;
  const totalListeners = albumTracks.reduce((sum, track) => sum + track.listeners, 0);
  const totalStreams = albumTracks.reduce((sum, track) => sum + track.streams, 0);

  return (
    <AppShell>
      <section className="card profile-hero">
        <img src={album.coverUrl} alt={album.title} />
        <div>
          <span className="badge">{album.type === 'album' ? 'Album' : 'Single'}</span>
          {album.isEarlyAccess ? <span className="badge warning" style={{ marginInlineStart: 8 }}>Early Access</span> : null}
          <h1 className="page-title">{album.title}</h1>
          <p className="muted">{artist ? <Link href={`/artists/${artist.id}`}>{artist.name}</Link> : 'Unknown artist'} · {album.genre} · {formatDate(album.releaseDate)}</p>
          {showAnalytics ? <p className="muted">{formatNumber(totalListeners)} listeners · {formatNumber(totalStreams)} streams</p> : null}
        </div>
        <Link href="/library" className="btn ghost">Back</Link>
      </section>
      <div className="section-title"><h2>Tracks in this release</h2></div>
      <div className="grid">
        {albumTracks.map((track) => <TrackCard key={track.id} track={track} queueIds={albumTracks.map((item) => item.id)} />)}
      </div>
    </AppShell>
  );
}
