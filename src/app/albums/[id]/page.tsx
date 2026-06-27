'use client';

import Link from 'next/link';
import AppShell from '@/components/AppShell';
import PageHeader from '@/components/PageHeader';
import TrackCard from '@/components/TrackCard';
import { useAuth } from '@/context/AuthContext';
import { getCollection } from '@/lib/storage';
import { formatDate, formatNumber } from '@/lib/format';
import type { Album, Artist, Track } from '@/types/domain';
import { canSeeAnalytics } from '@/lib/rules';

export default function AlbumPage({ params }: { params: { id: string } }) {
  const { currentUser } = useAuth();
  const albums = getCollection('albums') as Album[];
  const artists = getCollection('artists') as Artist[];
  const tracks = getCollection('tracks') as Track[];
  const album = albums.find((item) => item.id === params.id);

  if (!album) {
    return (
      <AppShell>
        <PageHeader title="Album not found" />
        <Link className="premium-back-btn" href="/library">
          <i className="fas fa-arrow-left"></i> Back to Library
        </Link>
      </AppShell>
    );
  }

  const artist = artists.find((item) => item.id === album.artistId);
  const albumTracks = album.trackIds.map((id) => tracks.find((track) => track.id === id)).filter(Boolean) as Track[];
  const totalListeners = albumTracks.reduce((sum, track) => sum + track.listeners, 0);
  const totalStreams = albumTracks.reduce((sum, track) => sum + track.streams, 0);

  return (
    <AppShell>
      <section className="premium-album-hero-card">
        <div className="premium-album-cover-container">
          <img src={album.coverUrl} alt={album.title} className="premium-album-img" />
        </div>
        
        <div className="premium-album-info">
          <div className="premium-badge-row">
            <span className="premium-type-badge">{album.type === 'album' ? 'Album' : 'Single'}</span>
            {album.isEarlyAccess && (
              <span className="premium-early-badge">
                <i className="fas fa-bolt"></i> Early Access
              </span>
            )}
          </div>
          
          <h1 className="premium-album-title">{album.title}</h1>
          
          <p className="premium-album-meta">
            {artist ? (
              <Link href={`/artists/${artist.id}`} className="premium-artist-link">
                {artist.name}
              </Link>
            ) : (
              <span className="unknown-premium">Unknown artist</span>
            )}
            <span className="meta-dot">·</span> 
            <span className="genre-tag">{album.genre}</span> 
            <span className="meta-dot">·</span> 
            <i className="far fa-calendar-alt"></i> {formatDate(album.releaseDate)}
          </p>

          {currentUser && canSeeAnalytics(currentUser.role, currentUser.subscription) ? (
            <div className="premium-album-stats-badge">
              <div className="stats-icon-glow">
                <i className="fas fa-chart-bar"></i>
              </div>
              <div className="stats-data">
                <span>{formatNumber(totalListeners)} listeners</span>
                <span className="dot-divider"></span>
                <span>{formatNumber(totalStreams)} streams</span>
              </div>
            </div>
          ) : null}
        </div>

        <Link href="/library" className="premium-back-circle-btn" title="Back">
          <i className="fas fa-chevron-left"></i>
        </Link>
      </section>

      <div className="premium-section-title">
        <h2>Tracks in this release</h2>
        <span className="tracks-count-glow">{albumTracks.length} Songs</span>
      </div>

      <div className="premium-tracks-grid">
        {albumTracks.map((track) => (
          <TrackCard key={track.id} track={track} queueIds={albumTracks.map((item) => item.id)} />
        ))}
      </div>
    </AppShell>
  );
}