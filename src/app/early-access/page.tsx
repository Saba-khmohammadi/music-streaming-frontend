'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import AlbumCard from '@/components/AlbumCard';
import AppShell from '@/components/AppShell';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/PageHeader';
import TrackCard from '@/components/TrackCard';
import { useAuth } from '@/context/AuthContext';
import {
  canUserAccessEarlyRelease,
  formatEarlyAccessRemaining,
  getActiveEarlyAlbums,
  getActiveEarlyTracks,
  syncExpiredEarlyAccess
} from '@/lib/earlyAccess';
import { getCollection } from '@/lib/storage';
import type { Album, Artist, Track } from '@/types/domain';

export default function EarlyAccessPage() {
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

  const earlyAlbums = useMemo(() => getActiveEarlyAlbums(albums, now), [albums, now]);
  const earlySingles = useMemo(
    () => getActiveEarlyTracks(tracks, now).filter((track) => !track.albumId),
    [now, tracks]
  );

  if (!currentUser) return <AppShell><div /></AppShell>;

  if (!canUserAccessEarlyRelease(currentUser)) {
    return (
      <AppShell>
        <PageHeader
          title="Early Access"
          description="New songs and albums are available here for Gold users only during the first two minutes after upload."
        />
        <div className="premium-upgrade-card">
          <div className="upgrade-icon"><i className="fas fa-crown"></i></div>
          <div className="upgrade-content">
            <h2>Gold membership required</h2>
            <p>Upgrade to Gold to see new uploads before they appear in the public music library.</p>
          </div>
          <Link className="premium-btn-upgrade" href="/settings">Upgrade Now</Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="Early Access"
        description="Gold users can see new uploads here for exactly two minutes. After that, the release moves automatically to the public Albums and Singles list."
        actions={<span className="premium-badge-early">Gold Only</span>}
      />

      {earlyAlbums.length || earlySingles.length ? (
        <>
          {earlyAlbums.length ? (
            <>
              <div className="section-title"><h2>Early Access Albums</h2></div>
              <div className="grid cols-4">
                {earlyAlbums.map((album) => (
                  <div key={album.id}>
                    <AlbumCard album={album} artist={artists.find((artist) => artist.id === album.artistId)} />
                    <p className="muted" style={{ marginTop: 8 }}>Moves to library in {formatEarlyAccessRemaining(album, now)}</p>
                  </div>
                ))}
              </div>
            </>
          ) : null}

          {earlySingles.length ? (
            <>
              <div className="section-title"><h2>Early Access Singles</h2></div>
              <div className="grid">
                {earlySingles.map((track) => (
                  <div key={track.id}>
                    <TrackCard track={track} queueIds={earlySingles.map((item) => item.id)} />
                    <p className="muted" style={{ marginTop: 8 }}>Moves to library in {formatEarlyAccessRemaining(track, now)}</p>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </>
      ) : (
        <EmptyState
          title="No active Early Access releases"
          description="When an artist uploads a new song or album, Gold users will see it here for the first two minutes."
        />
      )}
    </AppShell>
  );
}
