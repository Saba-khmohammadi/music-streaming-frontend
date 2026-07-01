'use client';

import { FormEvent, useState, useEffect } from 'react';
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
import { canSeeAnalytics } from '@/lib/rules';

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
    const coverUrl = `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#7c3aed"/><stop offset="100%" stop-color="#22d3ee"/></linearGradient></defs><rect width="600" height="600" rx="120" fill="url(#grad)"/><text x="300" y="320" text-anchor="middle" font-size="70" font-family="system-ui, sans-serif" font-weight="bold" fill="white">${title.slice(0, 15)}</text></svg>`)}`;
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
      

      <section className="premium-playlist-creator-card">
        {!canCreate && (
          <div className="premium-limit-alert">
            <i className="fas fa-exclamation-triangle alert-icon-neon"></i>
            <span>You have reached the maximum limit of {limit} playlists for your current subscription. Please upgrade your plan to create more.</span>
          </div>
        )}

        <form className="premium-form-grid" onSubmit={createPlaylist}>
          <div className="premium-input-wrapper">
            <label className="premium-label">New playlist name</label>
            <input 
              className="premium-glass-input" 
              name="title" 
              placeholder="" 
              required 
              disabled={!canCreate} 
            />
          </div>
          <button className="premium-action-submit-btn" disabled={!canCreate}>
            <i className="fas fa-plus"></i> 
          </button>
        </form>
      </section>

      {!myPlaylists.length ? (
        <EmptyState title="You do not have any playlists yet" description="Use the button above to create your first playlist." />
      ) : (
        <div className="premium-playlists-layout">
          {myPlaylists.map((playlist) => {
            const playlistTracks = playlist.trackIds.map((id) => tracks.find((track) => track.id === id)).filter(Boolean) as Track[];
            return (
              <article className="premium-playlist-card" key={playlist.id}>
                <div className="premium-playlist-hero">
                  <div className="premium-playlist-cover-container">
                    <img src={playlist.coverUrl} alt={playlist.title} className="premium-playlist-img" />
                  </div>
                  <div className="premium-playlist-details">
                    <h2 className="premium-playlist-title">{playlist.title}</h2>
                    <p className="premium-playlist-meta">
                      <i className="fas fa-music"></i> {playlistTracks.length} tracks 
                      <span className="meta-dot">·</span> 
                      <i className="fas fa-calendar-alt"></i> updated {formatDate(playlist.updatedAt)}
                    </p>
                  </div>
                  <div className="premium-playlist-actions">
                    <button className="premium-row-btn rename-btn" onClick={() => setEditing(playlist)} title="Rename">
                      <i className="fas fa-edit"></i>
                    </button>
                    <button className="premium-row-btn delete-btn" onClick={() => deletePlaylist(playlist.id)} title="Delete">
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>
                </div>
                <div className="premium-playlist-tracks-zone">
                  {playlistTracks.length ? playlistTracks.map((track) => (
                    <TrackCard 
                      key={track.id} 
                      track={track} 
                      queueIds={playlistTracks.map((item) => item.id)} 
                      action={
                        <button className="premium-track-remove-btn" onClick={() => removeTrack(playlist.id, track.id)}>
                          <i className="fas fa-minus-circle"></i> Remove
                        </button>
                      } 
                    />
                  )) : (
                    <div className="premium-empty-inside">
                      <i className="fas fa-compact-disc fa-spin"></i>
                      <p>This playlist is still empty. Add tracks from the Albums and Singles page.</p>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {editing ? (
        <Modal title="Rename playlist" onClose={() => setEditing(null)}>
          <form className="premium-modal-form" onSubmit={renamePlaylist}>
            <div className="premium-input-wrapper">
              <label className="premium-label">New name</label>
              <input className="premium-glass-input" name="title" defaultValue={editing.title} required />
            </div>
            <button className="premium-action-submit-btn modal-btn">Save Changes</button>
          </form>
        </Modal>
      ) : null}
    </AppShell>
  );
}