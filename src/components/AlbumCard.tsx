'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { formatDate, formatNumber } from '@/lib/format';
import { getCollection } from '@/lib/storage';
import type { Album, Artist, Track } from '@/types/domain';
import { canSeeAnalytics } from '@/lib/rules';
import { isEarlyAccessActive } from '@/lib/earlyAccess';


export default function AlbumCard({ album, artist }: { album: Album; artist?: Artist }) {
  const { currentUser } = useAuth();
  const tracks = getCollection('tracks') as Track[];
  const albumTracks = tracks.filter((track) => album.trackIds.includes(track.id));
  const listeners = albumTracks.reduce((sum, track) => sum + track.listeners, 0);
  const streams = albumTracks.reduce((sum, track) => sum + track.streams, 0);
  const isEarly = isEarlyAccessActive(album);

  return (
    <Link 
      className={`premium-album-card-item ${isEarly ? 'early-access-highlight' : ''}`} 
      href={`/albums/${album.id}`}
    >
      <div className="card-cover-wrapper">
        <img className="premium-card-cover" src={album.coverUrl} alt={album.title} />
        <div className="card-badge-overlay">
          <span className="premium-card-badge">{album.type === 'album' ? 'Album' : 'Single'}</span>
          {isEarly && (
            <span className="premium-card-early-badge">
              <i className="fas fa-bolt"></i> Early
            </span>
          )}
        </div>
      </div>

      <div className="card-content-premium">
        <h3 className="premium-card-title truncate">{album.title}</h3>
        <p className="premium-card-subtitle truncate">
          {artist?.name ?? 'Unknown artist'} <span className="meta-dot">·</span> {formatDate(album.releaseDate)}
        </p>
        
        {currentUser && canSeeAnalytics(currentUser.role, currentUser.subscription) && (
          <div className="premium-card-analytics">
            <i className="fas fa-headphones-alt"></i>
            <span>{formatNumber(listeners)}</span>
            <span className="analytics-pipe">|</span>
            <i className="fas fa-play"></i>
            <span>{formatNumber(streams)}</span>
          </div>
        )}
      </div>
    </Link>
  );
}