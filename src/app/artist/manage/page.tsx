'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import AppShell from '@/components/AppShell';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/PageHeader';
import TrackCard from '@/components/TrackCard';
import { useAuth } from '@/context/AuthContext';
import { canManageWorks, canSeeAnalytics } from '@/lib/rules';
import { getCollection, newId, setCollection } from '@/lib/storage';
import { formatCurrency, formatNumber } from '@/lib/format';
import { createEarlyAccessMeta, syncExpiredEarlyAccess } from '@/lib/earlyAccess';
import type { Album, Artist, Track } from '@/types/domain';

export default function ArtistManagePage() {
  const { currentUser } = useAuth();
  const [tracks, setTracks] = useState<Track[]>(getCollection('tracks'));
  const [albums, setAlbums] = useState<Album[]>(getCollection('albums'));
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const artists = getCollection('artists') as Artist[];
  const [releaseType, setReleaseType] = useState<'single' | 'album'>('single');

  useEffect(() => {
    const syncReleases = () => {
      const synced = syncExpiredEarlyAccess();
      setTracks(synced.tracks);
      setAlbums(synced.albums);
    };

    syncReleases();
    const timer = window.setInterval(syncReleases, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const [albumTracks, setAlbumTracks] = useState([
    {
      title: '',
      genre: '',
      lyrics: '',
      collaborators: '',
      audio: null as File | null,
      cover: null as File | null,
      releaseDate: ''
    }
  ]);
  const artist = currentUser?.artistId
    ? artists.find((item) => item.id === currentUser.artistId)
    : null;

  const artistTracks = useMemo(
    () => (artist ? tracks.filter((track) => track.artistId === artist.id) : []),
    [artist, tracks]
  );
  
  const addAlbumTrack = () => {
    setAlbumTracks((prev) => [
      ...prev,
      {
        title: '',
        genre: '',
        lyrics: '',
        collaborators: '',
        audio: null,
        cover: null,
        releaseDate: ''
      }
    ]);
  };
  
  const totalStreams = artistTracks.reduce((sum, track) => sum + track.streams, 0);
  const totalListeners = artistTracks.reduce((sum, track) => sum + track.listeners, 0);
  const mockIncome = totalStreams * 900;
  const showAnalytics = currentUser
  ? canSeeAnalytics(
      currentUser.role,
      currentUser.subscription
    )
  : false;

  const editTrack = (track: Track) => {
    setEditingTrack(track);
  };

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

    const type = String(form.get('type')) as 'album' | 'single';
    const earlyAccessMeta = createEarlyAccessMeta();

    const fileToBase64 = (file: File): Promise<string> =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
      });

    const getAudioDuration = (url: string): Promise<number> =>
      new Promise((resolve) => {
        const audio = new Audio(url);
        audio.onloadedmetadata = () => {
          resolve(Math.round(audio.duration));
        };
        audio.onerror = () => resolve(0);
      });

    // =========================
    // EDIT MODE
    // =========================
    if (editingTrack) {
      const title = String(form.get('title'));
      const genre = String(form.get('genre'));
      const lyrics = String(form.get('lyrics'));
      const collaborators = String(form.get('collaborators'))
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean);
      const releaseDate = String(form.get('releaseDate')) || new Date().toISOString().slice(0, 10);
      const audioFile = form.get('audio');
      const coverFile = form.get('cover');

      let newCoverUrl = editingTrack.coverUrl;
      let newAudioUrl = editingTrack.audioUrl;
      let newDuration = editingTrack.duration;

      if (coverFile instanceof File && coverFile.size > 0) {
        newCoverUrl = await fileToBase64(coverFile);
      }

      if (audioFile instanceof File && audioFile.size > 0) {
        newAudioUrl = URL.createObjectURL(audioFile);
        newDuration = await getAudioDuration(newAudioUrl);
      }

      const updatedTracks = tracks.map((t) =>
        t.id === editingTrack.id
          ? {
              ...t,
              title,
              genre,
              lyrics,
              collaborators,
              releaseDate,
              coverUrl: newCoverUrl,
              audioUrl: newAudioUrl,
              duration: newDuration,
            }
          : t
      );

      setTracks(updatedTracks);
      setCollection("tracks", updatedTracks);

      setEditingTrack(null);
      formElement.reset();
      return;
    }
    
    // =========================
    // NEW ALBUM
    // =========================
    if (type === "album") {
      const albumId = newId("album");
      const albumTitle = String(form.get('albumTitle'));
      const albumGenre = String(form.get('albumGenre'));
      const albumReleaseDate = String(form.get('albumReleaseDate')) || new Date().toISOString().slice(0, 10);
      const albumCoverFile = form.get('albumCover');
      const albumCoverUrl = albumCoverFile instanceof File ? await fileToBase64(albumCoverFile) : "";

      const createdTracks: Track[] = [];

      for (let i = 0; i < albumTracks.length; i++) {
        const trackTitle = String(form.get(`trackTitle-${i}`));
        const trackGenre = String(form.get(`trackGenre-${i}`));
        const trackLyrics = String(form.get(`trackLyrics-${i}`));

        const trackCollaborators = String(
          form.get(`trackCollaborators-${i}`)
        )
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean);

        const trackReleaseDate =
          String(form.get(`trackReleaseDate-${i}`)) ||
          albumReleaseDate;

        const audio = form.get(`trackAudio-${i}`);
        const cover = form.get(`trackCover-${i}`);

        const trackAudioUrl =
          audio instanceof File
            ? URL.createObjectURL(audio)
            : "";

        const trackDuration =
          trackAudioUrl
            ? await getAudioDuration(trackAudioUrl)
            : 0;

        const trackCoverUrl =
          cover instanceof File
            ? await fileToBase64(cover)
            : albumCoverUrl;

        createdTracks.push({
          id: newId("track"),
          albumId,
          artistId: artist.id,
          title: trackTitle,
          genre: trackGenre,
          lyrics: trackLyrics,
          collaborators: trackCollaborators,
          coverUrl: trackCoverUrl,
          audioUrl: trackAudioUrl,
          duration: trackDuration,
          releaseDate: trackReleaseDate,
          ...earlyAccessMeta,
          listeners: 0,
          streams: 0
        });
      }

      const album: Album = {
        id: albumId,
        title: albumTitle,
        artistId: artist.id,
        coverUrl: albumCoverUrl,
        releaseDate: albumReleaseDate,
        ...earlyAccessMeta,
        genre: albumGenre,
        type: "album",
        trackIds: createdTracks.map((t) => t.id)
      };

      const nextTracks = [...tracks, ...createdTracks];
      const nextAlbums = [...albums, album];

      setTracks(nextTracks);
      setAlbums(nextAlbums);

      setCollection("tracks", nextTracks);
      setCollection("albums", nextAlbums);

      formElement.reset();
      setAlbumTracks([
        {
          title: "",
          genre: "",
          lyrics: "",
          collaborators: "",
          audio: null,
          cover: null,
          releaseDate: ""
        }
      ]);

      return;
    }
    
    // =========================
    // NEW SINGLE
    // =========================
    const title = String(form.get('title'));
    const genre = String(form.get('genre'));
    const lyrics = String(form.get('lyrics'));
    const collaborators = String(form.get('collaborators'))
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
    const releaseDate = String(form.get('releaseDate')) || new Date().toISOString().slice(0, 10);
    const audioFile = form.get('audio');
    const coverFile = form.get('cover');

    const audioUrl = audioFile instanceof File ? URL.createObjectURL(audioFile) : "";
    const duration = audioUrl ? await getAudioDuration(audioUrl) : 0;
    const coverUrl = coverFile instanceof File ? await fileToBase64(coverFile) : "";

    const track: Track = {
      id: newId('track'),
      title,
      artistId: artist.id,
      coverUrl,
      audioUrl,
      duration,
      releaseDate,
      ...earlyAccessMeta,
      listeners: 0,
      streams: 0,
      lyrics,
      genre,
      collaborators,
    };

    const nextTracks = [...tracks, track];

    setTracks(nextTracks);
    setCollection('tracks', nextTracks);

    formElement.reset();
    setEditingTrack(null);
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
              <label className="label">Album / Single title</label>
              <input className="input" name="albumTitle" />
            </div>

            <div className="form-row">
              <label className="label">Release type</label>
              <select
                className="select"
                name="type"
                value={releaseType}
                onChange={(e) =>
                  setReleaseType(e.target.value as 'single' | 'album')
                }
              >
                <option value="single">Single</option>
                <option value="album">Album</option>
              </select>
            </div>

            {releaseType === 'single' ? (
              // Single form
              <>
                <div className="form-row">
                  <label className="label">Track title</label>
                  <input
                    className="input"
                    name="title"
                    defaultValue={editingTrack?.title}
                  />
                </div>

                <div className="form-row">
                  <label className="label">Genre</label>
                  <input
                    className="input"
                    name="genre"
                    defaultValue={editingTrack?.genre}
                  />
                </div>

                <div className="form-row">
                  <label className="label">Release date</label>
                  <input className="input" name="releaseDate" type="date" />
                </div>

                <div className="form-row">
                  <label className="label">Cover image</label>
                  <input
                    className="input"
                    name="cover"
                    type="file"
                    accept="image/*"
                  />
                </div>

                <div className="form-row">
                  <label className="label">Audio file</label>
                  <input
                    className="input"
                    name="audio"
                    type="file"
                    accept="audio/*"
                  />
                </div>

                <div className="form-row">
                  <label className="label">Lyrics</label>
                  <textarea
                    className="textarea"
                    name="lyrics"
                    defaultValue={editingTrack?.lyrics}
                  />
                </div>

                <div className="form-row">
                  <label className="label">Collaborators</label>
                  <input
                    className="input"
                    name="collaborators"
                    defaultValue={editingTrack?.collaborators?.join(', ') ?? ''}
                  />
                </div>
              </>
            ) : (
              // Album form
              <>
                <div className="form-row">
                  <label className="label">Genre</label>
                  <input
                    className="input"
                    name="albumGenre"
                    defaultValue={editingTrack?.genre}
                  />
                </div>

                <div className="form-row">
                  <label className="label">Release date</label>
                  <input className="input" name="albumReleaseDate" type="date" />
                </div>

                <div className="form-row">
                  <label className="label">Album Cover</label>
                  <input
                    className="input"
                    name="albumCover"
                    type="file"
                    accept="image/*"
                  />
                </div>

                <h3 style={{ marginTop: 20 }}>Tracks</h3>

                {albumTracks.map((track, index) => (
                  <div
                    key={index}
                    className="card"
                    style={{ marginBottom: 20 }}
                  >
                    <h4>Track {index + 1}</h4>

                    <div className="form-grid">
                      <div className="form-row">
                        <label className="label">Title</label>
                        <input
                          className="input"
                          name={`trackTitle-${index}`}
                        />
                      </div>

                      <div className="form-row">
                        <label className="label">Genre</label>
                        <input
                          className="input"
                          name={`trackGenre-${index}`}
                        />
                      </div>

                      <div className="form-row">
                        <label className="label">Release date</label>
                        <input
                          className="input"
                          type="date"
                          name={`trackReleaseDate-${index}`}
                        />
                      </div>

                      <div className="form-row">
                        <label className="label">Collaborators</label>
                        <input
                          className="input"
                          name={`trackCollaborators-${index}`}
                        />
                      </div>

                      <div className="form-row">
                        <label className="label">Lyrics</label>
                        <textarea
                          className="textarea"
                          name={`trackLyrics-${index}`}
                        />
                      </div>

                      <div className="form-row">
                        <label className="label">Audio file</label>
                        <input
                          className="input"
                          type="file"
                          accept="audio/*"
                          name={`trackAudio-${index}`}
                        />
                      </div>

                      <div className="form-row">
                        <label className="label">Track Cover</label>
                        <input
                          className="input"
                          type="file"
                          accept="image/*"
                          name={`trackCover-${index}`}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  className="btn"
                  onClick={addAlbumTrack}
                >
                  + Add Track
                </button>
              </>
            )}
          </div>

          <button className="btn primary" style={{ marginTop: 20 }}>
            {editingTrack ? "Save changes" : "Publish"}
          </button>
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
                <>
                  <button
                    className="btn"
                    onClick={() => editTrack(track)}
                  >
                    Edit
                  </button>

                  <button
                    className="btn danger"
                    onClick={() => removeTrack(track.id)}
                  >
                    Delete / unpublish
                  </button>
                </>
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