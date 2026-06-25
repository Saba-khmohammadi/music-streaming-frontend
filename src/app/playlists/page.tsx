'use client';

import { FormEvent, useState } from 'react';
import AppShell from '@/components/AppShell';
import EmptyState from '@/components/EmptyState';
import Modal from '@/components/Modal';
import PageHeader from '@/components/PageHeader';
import TrackCard from '@/components/TrackCard';
import { useAuth } from '@/context/AuthContext';
import { canCreatePlaylist, playlistLimit } from '@/lib/rules';
import { getCollection, newId, setCollection } from '@/lib/storage';
import { formatDate, formatNumber } from '@/lib/format';
import type { Playlist, Track } from '@/types/domain';

export default function PlaylistsPage() {
  const { currentUser } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>(getCollection('playlists'));
  const [editing, setEditing] = useState<Playlist | null>(null);
  const tracks = getCollection('tracks') as Track[];

  if (!currentUser) return <AppShell><div /></AppShell>;
  const myPlaylists = playlists.filter((playlist) => playlist.ownerId === currentUser.id);
  const limit = playlistLimit(currentUser.subscription);
  const canCreate = canCreatePlaylist(currentUser.subscription, myPlaylists.length);

  const persist = (next: Playlist[]) => {
    setPlaylists(next);
    setCollection('playlists', next);
  };

  const createPlaylist = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canCreate) return;
    const form = new FormData(event.currentTarget);
    const title = String(form.get('title'));
    const coverUrl = `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><rect width="600" height="600" rx="80" fill="#7c3aed"/><text x="300" y="330" text-anchor="middle" font-size="60" font-family="Arial" fill="white">${title}</text></svg>`)}`;
    persist([...playlists, { id: newId('playlist'), ownerId: currentUser.id, title, coverUrl, trackIds: [], updatedAt: new Date().toISOString() }]);
    event.currentTarget.reset();
  };

  const renamePlaylist = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing) return;
    const form = new FormData(event.currentTarget);
    persist(playlists.map((playlist) => playlist.id === editing.id ? { ...playlist, title: String(form.get('title')), updatedAt: new Date().toISOString() } : playlist));
    setEditing(null);
  };

  const deletePlaylist = (id: string) => persist(playlists.filter((playlist) => playlist.id !== id));
  const removeTrack = (playlistId: string, trackId: string) => persist(playlists.map((playlist) => playlist.id === playlistId ? { ...playlist, trackIds: playlist.trackIds.filter((id) => id !== trackId) } : playlist));

  return (
    <AppShell>
      <PageHeader
        title="Playlists"
        description="Create, delete, rename, and view tracks inside each playlist. Playlist limits are enforced by subscription type."
        actions={<span className="badge">Limit: {Number.isFinite(limit) ? formatNumber(limit) : 'Unlimited'}</span>}
      />

      <section className="card" style={{ marginBottom: 22 }}>
        <form className="form-grid" onSubmit={createPlaylist}>
          <div className="form-row"><label className="label">New playlist name</label><input className="input" name="title" placeholder="e.g. Study tracks" required /></div>
          <div className="form-row" style={{ justifyContent: 'end' }}><button className="btn primary" disabled={!canCreate}>Create playlist</button></div>
        </form>
        {!canCreate ? <p className="muted">You have reached the playlist limit for your current subscription.</p> : null}
      </section>

      {!myPlaylists.length ? (
        <EmptyState title="You do not have any playlists yet" description="Use the button above to create your first playlist." />
      ) : (
        <div className="grid cols-2">
          {myPlaylists.map((playlist) => {
            const playlistTracks = playlist.trackIds.map((id) => tracks.find((track) => track.id === id)).filter(Boolean) as Track[];
            return (
              <article className="card" key={playlist.id}>
                <div className="profile-hero" style={{ gridTemplateColumns: '90px 1fr auto' }}>
                  <img src={playlist.coverUrl} alt={playlist.title} style={{ width: 90, height: 90, borderRadius: 22 }} />
                  <div><h2>{playlist.title}</h2><p className="muted">{playlistTracks.length} tracks · updated {formatDate(playlist.updatedAt)}</p></div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    <button className="btn ghost" onClick={() => setEditing(playlist)}>Rename</button>
                    <button className="btn danger" onClick={() => deletePlaylist(playlist.id)}>Delete</button>
                  </div>
                </div>
                <div className="grid" style={{ marginTop: 16 }}>
                  {playlistTracks.length ? playlistTracks.map((track) => (
                    <TrackCard key={track.id} track={track} queueIds={playlistTracks.map((item) => item.id)} action={<button className="btn danger" onClick={() => removeTrack(playlist.id, track.id)}>Remove from playlist</button>} />
                  )) : <EmptyState title="This playlist is still empty" description="Add tracks from the Albums and Singles page." />}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {editing ? (
        <Modal title="Rename playlist" onClose={() => setEditing(null)}>
          <form className="form" onSubmit={renamePlaylist}>
            <div className="form-row"><label className="label">New name</label><input className="input" name="title" defaultValue={editing.title} required /></div>
            <button className="btn primary">Save</button>
          </form>
        </Modal>
      ) : null}
    </AppShell>
  );
}
