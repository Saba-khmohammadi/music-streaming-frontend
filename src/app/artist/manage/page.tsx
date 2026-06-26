'use client';

import { FormEvent, useMemo, useState } from 'react';
import AppShell from '@/components/AppShell';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/PageHeader';
import TrackCard from '@/components/TrackCard';
import { useAuth } from '@/context/AuthContext';
import { canManageWorks, canSeeAnalytics } from '@/lib/rules';
import { getCollection, newId, setCollection } from '@/lib/storage';
import { formatCurrency, formatNumber } from '@/lib/format';
import type { Album, Artist, Track } from '@/types/domain';

export default function ArtistManagePage() {
  const { currentUser } = useAuth();
  const [tracks, setTracks] = useState<Track[]>(getCollection('tracks'));
  const [albums, setAlbums] = useState<Album[]>(getCollection('albums'));
  const artists = getCollection('artists') as Artist[];

  const artist = currentUser?.artistId
    ? artists.find((item) => item.id === currentUser.artistId)
    : null;

  const artistTracks = useMemo(
    () => (artist ? tracks.filter((track) => track.artistId === artist.id) : []),
    [artist, tracks]
  );

  const totalStreams = artistTracks.reduce((sum, track) => sum + track.streams, 0);
  const totalListeners = artistTracks.reduce((sum, track) => sum + track.listeners, 0);
  const mockIncome = totalStreams * 900;
  const showAnalytics = currentUser ? canSeeAnalytics(currentUser.subscription) : false;

  if (!currentUser) return <AppShell><div /></AppShell>;

  if (!canManageWorks(currentUser)) {
    return (
      <AppShell>
        <PageHeader title="Work Management" description="This section is only available to verified artists." />
        <EmptyState title="Access is not active" description="Your artist account must be approved by support or the system admin." />
      </AppShell>
    );
  }

  const publish = async (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();

  if (!artist) return;

  const formElement = event.currentTarget;
  const form = new FormData(formElement);

  const title = String(form.get('title'));
  const type = String(form.get('type')) as 'album' | 'single';

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
    });

  const audioFile = form.get('audio');
  const coverFile = form.get('cover');

  const audioUrl =
  audioFile instanceof File
    ? URL.createObjectURL(audioFile)
    : '';

  const coverUrl =
    coverFile instanceof File ? await fileToBase64(coverFile) : '';

  const track: Track = {
    id: newId('track'),
    title,
    artistId: artist.id,
    coverUrl,
    audioUrl,
    duration: Number(form.get('duration')) || 180,
    releaseDate:
      String(form.get('releaseDate')) ||
      new Date().toISOString().slice(0, 10),
    listeners: 0,
    streams: 0,
    lyrics: String(form.get('lyrics')),
    genre: String(form.get('genre')),
    collaborators: String(form.get('collaborators'))
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean),
  };

  const nextTracks = [...tracks, track];

  setTracks(nextTracks);
  setCollection('tracks', nextTracks);

  // ✅ safe reset (فقط همین)
  formElement.reset();
};
  const removeTrack = (trackId: string) => {
    const nextTracks = tracks.filter((t) => t.id !== trackId);

    const nextAlbums = albums
      .map((album) => ({
        ...album,
        trackIds: album.trackIds.filter((id) => id !== trackId),
      }))
      .filter((album) => album.trackIds.length > 0);

    setTracks(nextTracks);
    setAlbums(nextAlbums);
    setCollection('tracks', nextTracks);
    setCollection('albums', nextAlbums);
  };

  return (
    <AppShell>
      <PageHeader
        title="Artist Work Management"
        description="Dedicated panel for publishing albums or singles, adding lyrics, metadata, cover art, and viewing stats for each release."
      />

      <section className="stats">
        <div className="stat">
          <strong>{formatNumber(artistTracks.length)}</strong>
          <span className="muted">Total works</span>
        </div>

        <div className="stat">
          <strong>
            {showAnalytics ? formatNumber(totalListeners) : 'Gold only'}
          </strong>
          <span className="muted">Total listeners</span>
        </div>

        <div className="stat">
          <strong>
            {showAnalytics ? formatNumber(totalStreams) : 'Gold only'}
          </strong>
          <span className="muted">Total streams</span>
        </div>

        <div className="stat">
          <strong>
            {showAnalytics ? formatCurrency(mockIncome) : 'Gold only'}
          </strong>
          <span className="muted">Estimated income</span>
        </div>
      </section>

      <section className="card" style={{ marginTop: 22 }}>
        <h2>Publish a new release</h2>

        <form className="form" onSubmit={publish}>
          <div className="form-grid">
            <div className="form-row">
              <label className="label">Track title</label>
              <input className="input" name="title" required />
            </div>

            <div className="form-row">
              <label className="label">Album / single title</label>
              <input className="input" name="albumTitle" />
            </div>

            <div className="form-row">
              <label className="label">Release type</label>
              <select className="select" name="type">
                <option value="single">Single</option>
                <option value="album">Album</option>
              </select>
            </div>

            <div className="form-row">
              <label className="label">Genre</label>
              <input className="input" name="genre" required />
            </div>

            <div className="form-row">
              <label className="label">Release date</label>
              <input className="input" name="releaseDate" type="date" />
            </div>

            <div className="form-row">
              <label className="label">Duration</label>
              <input className="input" name="duration" type="number" />
            </div>

            <div className="form-row">
              <label className="label">Audio file</label>
              <input className="input" name="audio" type="file" />
            </div>
          </div>
          <div className="form-row">
          <label className="label">Cover image</label>
          <input className="input" name="cover" type="file" accept="image/*" />
        </div>

          <div className="form-row">
            <label className="label">Collaborators</label>
            <input className="input" name="collaborators" />
          </div>

          <div className="form-row">
            <label className="label">Lyrics</label>
            <textarea className="textarea" name="lyrics" />
          </div>

          <button className="btn primary">Publish mock release</button>
        </form>
      </section>

      <div className="section-title">
        <h2>Published works</h2>
      </div>

      <div className="grid">
        {artistTracks.length ? (
          artistTracks.map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              queueIds={artistTracks.map((item) => item.id)}
              action={
                <button
                  className="btn danger"
                  onClick={() => removeTrack(track.id)}
                >
                  Delete / unpublish
                </button>
              }
            />
          ))
        ) : (
          <EmptyState title="No works have been published yet" />
        )}
      </div>
    </AppShell>
  );
}