'use client';

import { FormEvent, useMemo, useState } from 'react';
import AppShell from '@/components/AppShell';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/PageHeader';
import TrackCard from '@/components/TrackCard';
import { useAuth } from '@/context/AuthContext';
import { canManageWorks } from '@/lib/rules';
import { getCollection, newId, setCollection } from '@/lib/storage';
import { formatCurrency, formatNumber } from '@/lib/format';
import type { Album, Artist, Track } from '@/types/domain';

export default function ArtistManagePage() {
  const { currentUser } = useAuth();
  const [tracks, setTracks] = useState<Track[]>(getCollection('tracks'));
  const [albums, setAlbums] = useState<Album[]>(getCollection('albums'));
  const artists = getCollection('artists') as Artist[];
  const artist = currentUser?.artistId ? artists.find((item) => item.id === currentUser.artistId) : null;

  const artistTracks = useMemo(() => artist ? tracks.filter((track) => track.artistId === artist.id) : [], [artist, tracks]);
  const totalStreams = artistTracks.reduce((sum, track) => sum + track.streams, 0);
  const totalListeners = artistTracks.reduce((sum, track) => sum + track.listeners, 0);
  const mockIncome = totalStreams * 900;

  if (!currentUser) return <AppShell><div /></AppShell>;
  if (!canManageWorks(currentUser)) {
    return (
      <AppShell>
        <PageHeader title="Work Management" description="This section is only available to verified artists." />
        <EmptyState title="Access is not active" description="Your artist account must be approved by support or the system admin." />
      </AppShell>
    );
  }

  const publish = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!artist) return;
    const form = new FormData(event.currentTarget);
    const title = String(form.get('title'));
    const type = String(form.get('type')) as 'album' | 'single';
    const coverUrl = `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><defs><linearGradient id="g" x1="0" x2="1"><stop stop-color="#8b5cf6"/><stop offset="1" stop-color="#06b6d4"/></linearGradient></defs><rect width="600" height="600" rx="80" fill="url(#g)"/><text x="300" y="330" text-anchor="middle" font-size="54" font-family="Arial" fill="white">${title}</text></svg>`)}`;
    const track: Track = {
      id: newId('track'),
      title,
      artistId: artist.id,
      coverUrl,
      duration: Number(form.get('duration')) || 180,
      releaseDate: String(form.get('releaseDate')) || new Date().toISOString().slice(0, 10),
      listeners: 0,
      streams: 0,
      lyrics: String(form.get('lyrics')),
      genre: String(form.get('genre')),
      collaborators: String(form.get('collaborators')).split(',').map((item) => item.trim()).filter(Boolean),
      audioUrl: String((form.get('audio') as File | null)?.name ?? '')
    };
    let nextTracks = [...tracks, track];
    let nextAlbums = albums;
    if (type === 'album' || type === 'single') {
      const album: Album = {
        id: newId('album'),
        title: String(form.get('albumTitle')) || title,
        artistId: artist.id,
        coverUrl,
        releaseDate: track.releaseDate,
        genre: track.genre,
        trackIds: [track.id],
        type
      };
      track.albumId = album.id;
      nextTracks = [...tracks, track];
      nextAlbums = [...albums, album];
    }
    setTracks(nextTracks);
    setAlbums(nextAlbums);
    setCollection('tracks', nextTracks);
    setCollection('albums', nextAlbums);
    event.currentTarget.reset();
  };

  const removeTrack = (trackId: string) => {
    const nextTracks = tracks.filter((track) => track.id !== trackId);
    const nextAlbums = albums.map((album) => ({ ...album, trackIds: album.trackIds.filter((id) => id !== trackId) })).filter((album) => album.trackIds.length > 0);
    setTracks(nextTracks);
    setAlbums(nextAlbums);
    setCollection('tracks', nextTracks);
    setCollection('albums', nextAlbums);
  };

  return (
    <AppShell>
      <PageHeader title="Artist Work Management" description="Dedicated panel for publishing albums or singles, adding lyrics, metadata, cover art, and viewing stats for each release." />
      <section className="stats">
        <div className="stat"><strong>{formatNumber(artistTracks.length)}</strong><span className="muted">Total works</span></div>
        <div className="stat"><strong>{formatNumber(totalListeners)}</strong><span className="muted">Total listeners</span></div>
        <div className="stat"><strong>{formatNumber(totalStreams)}</strong><span className="muted">Total streams</span></div>
        <div className="stat"><strong>{formatCurrency(mockIncome)}</strong><span className="muted">Estimated income</span></div>
      </section>

      <section className="card" style={{ marginTop: 22 }}>
        <h2>Publish a new release</h2>
        <form className="form" onSubmit={publish}>
          <div className="form-grid">
            <div className="form-row"><label className="label">Track title</label><input className="input" name="title" required /></div>
            <div className="form-row"><label className="label">Album / single title</label><input className="input" name="albumTitle" /></div>
            <div className="form-row"><label className="label">Release type</label><select className="select" name="type"><option value="single">Single</option><option value="album">Album</option></select></div>
            <div className="form-row"><label className="label">Genre</label><input className="input" name="genre" placeholder="Pop, Rock, Ambient" required /></div>
            <div className="form-row"><label className="label">Release year/date</label><input className="input" name="releaseDate" type="date" /></div>
            <div className="form-row"><label className="label">Duration in seconds</label><input className="input" name="duration" type="number" defaultValue={180} /></div>
            <div className="form-row"><label className="label">Audio file MP3/WAV/FLAC</label><input className="input" name="audio" type="file" accept="audio/mp3,audio/wav,audio/flac" /></div>
            <div className="form-row"><label className="label">Cover image</label><input className="input" name="cover" type="file" accept="image/*" /></div>
          </div>
          <div className="form-row"><label className="label">Collaborating artists</label><input className="input" name="collaborators" placeholder="Separate with commas" /></div>
          <div className="form-row"><label className="label">Lyrics</label><textarea className="textarea" name="lyrics" /></div>
          <button className="btn primary">Publish mock release</button>
        </form>
      </section>

      <div className="section-title"><h2>Published works</h2></div>
      <div className="grid">
        {artistTracks.length ? artistTracks.map((track) => <TrackCard key={track.id} track={track} queueIds={artistTracks.map((item) => item.id)} action={<button className="btn danger" onClick={() => removeTrack(track.id)}>Delete / unpublish</button>} />) : <EmptyState title="No works have been published yet" />}
      </div>
    </AppShell>
  );
}
