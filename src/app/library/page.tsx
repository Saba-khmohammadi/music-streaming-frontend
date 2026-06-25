'use client';

import { FormEvent, useMemo, useState } from 'react';
import AlbumCard from '@/components/AlbumCard';
import AppShell from '@/components/AppShell';
import Modal from '@/components/Modal';
import PageHeader from '@/components/PageHeader';
import TrackCard from '@/components/TrackCard';
import { useAuth } from '@/context/AuthContext';
import { filterAlbums, filterTracks, sortAlbums, sortTracks, type SortMode } from '@/lib/search';
import { getCollection, setCollection } from '@/lib/storage';
import type { Album, Artist, Playlist, Track } from '@/types/domain';

export default function LibraryPage() {
  const { currentUser } = useAuth();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortMode>('listeners');
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>(getCollection('playlists'));
  const artists = getCollection('artists') as Artist[];
  const tracks = getCollection('tracks') as Track[];
  const albums = getCollection('albums') as Album[];

  const visibleTracks = useMemo(() => sortTracks(filterTracks(tracks, artists, query), sort), [artists, query, sort, tracks]);
  const visibleAlbums = useMemo(() => sortAlbums(filterAlbums(albums, artists, query), sort, tracks), [albums, artists, query, sort, tracks]);

  const addToPlaylist = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedTrack || !currentUser) return;
    const form = new FormData(event.currentTarget);
    const ids = form.getAll('playlistIds').map(String);
    const next = playlists.map((playlist) =>
      playlist.ownerId === currentUser.id && ids.includes(playlist.id) && !playlist.trackIds.includes(selectedTrack.id)
        ? { ...playlist, trackIds: [...playlist.trackIds, selectedTrack.id], updatedAt: new Date().toISOString() }
        : playlist
    );
    setPlaylists(next);
    setCollection('playlists', next);
    setSelectedTrack(null);
  };

  const myPlaylists = currentUser ? playlists.filter((playlist) => playlist.ownerId === currentUser.id) : [];

  return (
    <AppShell>
      <PageHeader title="Albums and Singles" description="Search by release title, artist name, or genre; sort by listeners or release date." />
      <section className="card form-grid" style={{ marginBottom: 24 }}>
        <div className="form-row"><label className="label">Search</label><input className="input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Track, album, or artist name" /></div>
        <div className="form-row"><label className="label">Sort by</label><select className="select" value={sort} onChange={(event) => setSort(event.target.value as SortMode)}><option value="listeners">Listener count</option><option value="releaseDate">Release date</option></select></div>
      </section>

      <div className="section-title"><h2>Albums</h2></div>
      <div className="grid cols-4">
        {visibleAlbums.map((album) => <AlbumCard key={album.id} album={album} artist={artists.find((artist) => artist.id === album.artistId)} />)}
      </div>

      <div className="section-title"><h2>Singles and Tracks</h2></div>
      <div className="grid">
        {visibleTracks.map((track) => <TrackCard key={track.id} track={track} queueIds={visibleTracks.map((item) => item.id)} action={<button className="btn secondary" onClick={() => setSelectedTrack(track)}>Add to playlist</button>} />)}
      </div>

      {selectedTrack ? (
        <Modal title={`Add "${selectedTrack.title}" to playlist`} onClose={() => setSelectedTrack(null)}>
          <form className="form" onSubmit={addToPlaylist}>
            {myPlaylists.length ? myPlaylists.map((playlist) => (
              <label key={playlist.id} className="card" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <input type="checkbox" name="playlistIds" value={playlist.id} />
                <span>{playlist.title}</span>
                <span className="muted">{playlist.trackIds.length} tracks</span>
              </label>
            )) : <p className="muted">Create a playlist on the Playlists page first.</p>}
            <button className="btn primary" disabled={!myPlaylists.length}>Save</button>
          </form>
        </Modal>
      ) : null}
    </AppShell>
  );
}
