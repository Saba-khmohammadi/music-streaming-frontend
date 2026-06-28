'use client';

import { useEffect, useState } from 'react';
import AlbumCard from '@/components/AlbumCard';
import AppShell from '@/components/AppShell';
import PageHeader from '@/components/PageHeader';
import TrackCard from '@/components/TrackCard';
import { useAuth } from '@/context/AuthContext';
import { canSeeAnalytics } from '@/lib/rules';
import { getPublicAlbums, getPublicTracks, syncExpiredEarlyAccess } from '@/lib/earlyAccess';
import { getCollection, setCollection } from '@/lib/storage';
import { formatNumber } from '@/lib/format';
import type { Album, Track } from '@/types/domain';

export default function ArtistProfilePage({ params }: { params: { id: string } }) {
  const { currentUser, updateCurrentUser, artists, refreshUsers, isReady } = useAuth();
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
  const tracks = getCollection('tracks') as Track[];
  const artist = artists.find((item) => item.id === params.id);
  const publicAlbums = getPublicAlbums(albums, now);
  const publicTracks = getPublicTracks(tracks, albums, now);

  if (!isReady) return <AppShell><PageHeader title="Loading artist..." /></AppShell>;
  if (!artist) return <AppShell><PageHeader title="Artist not found" /></AppShell>;
  const artistAlbums = publicAlbums.filter((album) => album.artistId === artist.id);
  const artistTracks = publicTracks.filter((track) => track.artistId === artist.id);
  const followedArtistIds = currentUser?.followedArtistIds ?? [];
  const followed = followedArtistIds.includes(artist.id);
  const isOwnArtistProfile = currentUser?.artistId === artist.id;
  const showAnalytics = currentUser ? canSeeAnalytics(currentUser.role, currentUser.subscription) : false;

  const toggleFollow = () => {
    if (!currentUser || isOwnArtistProfile) return;
    const nextFollowedArtistIds = followed
      ? followedArtistIds.filter((id) => id !== artist.id)
      : [...followedArtistIds, artist.id];
    const nextArtists = artists.map((item) => {
      if (item.id !== artist.id) return item;
      const nextFollowers = followed ? Math.max(0, item.followers - 1) : item.followers + 1;
      return { ...item, followers: nextFollowers };
    });

    setCollection('artists', nextArtists);
    updateCurrentUser({
      followedArtistIds: nextFollowedArtistIds,
      following: Math.max(0, currentUser.following + (followed ? -1 : 1))
    });
    refreshUsers();
  };

  return (
    <AppShell>
      <section className="card profile-hero">
        <img src={artist.avatarUrl} alt={artist.name} />
        <div>
          <h1 className="page-title">{artist.name}</h1>
          <p className="page-description">{artist.bio}</p>
          {artist.verified ? <span className="badge success">✓ Verified Artist Badge</span> : <span className="badge warning">Pending approval</span>}
        </div>
        <button className="btn primary" onClick={toggleFollow} disabled={!currentUser || isOwnArtistProfile}>
          {isOwnArtistProfile ? 'Your artist profile' : followed ? 'Unfollow' : 'Follow artist'}
        </button>
      </section>

      <section className="stats" style={{ marginTop: 18 }}>
        <div className="stat"><strong>{formatNumber(artist.followers)}</strong><span className="muted">Followers</span></div>
        {showAnalytics ? (
          <>
            <div className="stat"><strong>{formatNumber(artist.monthlyListeners)}</strong><span className="muted">Monthly listeners</span></div>
            <div className="stat"><strong>{formatNumber(artist.monthlyStreams)}</strong><span className="muted">Monthly streams</span></div>
          </>
        ) : (
          <>
            <div className="stat"><strong>Gold only</strong><span className="muted">Monthly listeners</span></div>
            <div className="stat"><strong>Gold only</strong><span className="muted">Monthly streams</span></div>
          </>
        )}
        <div className="stat"><strong>{artist.status}</strong><span className="muted">Verification status</span></div>
      </section>

      {showAnalytics ? (
        <div className="card highlight" style={{ marginTop: 18 }}>
          <h2>Gold user analytics</h2>
          <p className="muted">Listener and stream statistics for this artist are visible.</p>
        </div>
      ) : null}

      <div className="section-title"><h2>Albums and Singles</h2></div>
      <div className="grid cols-3">{artistAlbums.map((album) => <AlbumCard key={album.id} album={album} artist={artist} />)}</div>

      <div className="section-title"><h2>All Tracks</h2></div>
      <div className="grid">{artistTracks.map((track) => <TrackCard key={track.id} track={track} queueIds={artistTracks.map((item) => item.id)} />)}</div>
    </AppShell>
  );
}
