'use client';

import { useState } from 'react';
import AlbumCard from '@/components/AlbumCard';
import AppShell from '@/components/AppShell';
import PageHeader from '@/components/PageHeader';
import TrackCard from '@/components/TrackCard';
import { useAuth } from '@/context/AuthContext';
import { canSeeAnalytics } from '@/lib/rules';
import { getCollection } from '@/lib/storage';
import { formatNumber } from '@/lib/format';
import type { Album, Artist, Track } from '@/types/domain';

export default function ArtistProfilePage({ params }: { params: { id: string } }) {
  const { currentUser } = useAuth();
  const [followed, setFollowed] = useState(false);
  const artists = getCollection('artists') as Artist[];
  const albums = getCollection('albums') as Album[];
  const tracks = getCollection('tracks') as Track[];
  const artist = artists.find((item) => item.id === params.id);

  if (!artist) return <AppShell><PageHeader title="Artist not found" /></AppShell>;
  const artistAlbums = albums.filter((album) => album.artistId === artist.id);
  const artistTracks = tracks.filter((track) => track.artistId === artist.id);

  return (
    <AppShell>
      <section className="card profile-hero">
        <img src={artist.avatarUrl} alt={artist.name} />
        <div>
          <h1 className="page-title">{artist.name}</h1>
          <p className="page-description">{artist.bio}</p>
          {artist.verified ? <span className="badge success">✓ Verified Artist Badge</span> : <span className="badge warning">Pending approval</span>}
        </div>
        <button className="btn primary" onClick={() => setFollowed((value) => !value)}>{followed ? 'Unfollow' : 'Follow artist'}</button>
      </section>

      <section className="stats" style={{ marginTop: 18 }}>
        <div className="stat"><strong>{formatNumber(artist.followers + (followed ? 1 : 0))}</strong><span className="muted">Followers</span></div>
        <div className="stat"><strong>{formatNumber(artist.monthlyListeners)}</strong><span className="muted">Monthly listeners</span></div>
        <div className="stat"><strong>{formatNumber(artist.monthlyStreams)}</strong><span className="muted">Monthly streams</span></div>
        <div className="stat"><strong>{artist.status}</strong><span className="muted">Verification status</span></div>
      </section>

      {currentUser && canSeeAnalytics(currentUser.subscription) ? (
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
