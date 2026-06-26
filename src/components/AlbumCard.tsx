'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { formatDate, formatNumber } from '@/lib/format';
import { canSeeAnalytics } from '@/lib/rules';
import { getCollection } from '@/lib/storage';
import type { Album, Artist, Track } from '@/types/domain';

export default function AlbumCard({ album, artist }: { album: Album; artist?: Artist }) {
  const { currentUser } = useAuth();
  const tracks = getCollection('tracks') as Track[];
  const albumTracks = tracks.filter((track) => album.trackIds.includes(track.id));
  const listeners = albumTracks.reduce((sum, track) => sum + track.listeners, 0);
  const streams = albumTracks.reduce((sum, track) => sum + track.streams, 0);
  const showAnalytics = currentUser ? canSeeAnalytics(currentUser.subscription) : false;

  return (
    <Link className={`card ${album.isEarlyAccess ? 'highlight' : ''}`} href={`/albums/${album.id}`}>
      <img className="cover" src={album.coverUrl} alt={album.title} />
      <div className="badge">{album.type === 'album' ? 'Album' : 'Single'}</div>
      {album.isEarlyAccess ? <span className="badge warning" style={{ marginInlineStart: 8 }}>Early Access</span> : null}
      <h3>{album.title}</h3>
      <p className="muted">{artist?.name ?? 'Unknown artist'} · {formatDate(album.releaseDate)}</p>
      {showAnalytics ? <p className="muted">{formatNumber(listeners)} listeners · {formatNumber(streams)} streams</p> : null}
    </Link>
  );
}
