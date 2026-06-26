'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePlayer } from '@/context/PlayerContext';
import { formatDuration, formatNumber } from '@/lib/format';
import { canSeeAnalytics } from '@/lib/rules';
import { getCollection } from '@/lib/storage';
import type { Album, Artist, Track } from '@/types/domain';

export default function TrackCard({ track, queueIds, action }: { track: Track; queueIds?: string[]; action?: React.ReactNode }) {
  const { currentUser } = useAuth();
  const { playTrack, addToQueue } = usePlayer();
  const showAnalytics = currentUser ? canSeeAnalytics(currentUser.subscription) : false;
  const { artist, album } = useMemo(() => {
    const artists = getCollection('artists') as Artist[];
    const albums = getCollection('albums') as Album[];
    return {
      artist: artists.find((item) => item.id === track.artistId),
      album: albums.find((item) => item.id === track.albumId)
    };
  }, [track.albumId, track.artistId]);

  return (
    <div className="track-row">
      <img src={track.coverUrl} alt={track.title} />
      <div style={{ minWidth: 0 }}>
        <strong className="truncate">{track.title}</strong>
        <div className="muted truncate">
          {artist ? <Link href={`/artists/${artist.id}`}>{artist.name}</Link> : 'Unknown artist'}
          {album ? <> · <Link href={`/albums/${album.id}`}>{album.title}</Link></> : null}
        </div>
        <small className="muted">
          {formatDuration(track.duration)}
          {showAnalytics ? <> · {formatNumber(track.listeners)} listeners · {formatNumber(track.streams)} streams</> : null}
        </small>
      </div>
      <div className="actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className="btn primary" onClick={() => playTrack(track.id, queueIds)}>Play</button>
        <button className="btn ghost" onClick={() => addToQueue(track.id)}>Add to queue</button>
        {action}
      </div>
    </div>
  );
}
