'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePlayer } from '@/context/PlayerContext';
import { getCollection } from '@/lib/storage';
import { formatDuration } from '@/lib/format';
import { canSeeAnalytics } from '@/lib/rules';
import type { Album, Artist } from '@/types/domain';

export default function MiniPlayer() {
  const { currentUser } = useAuth();
  const { currentTrack, queue, isPlaying, progress, volume, repeatMode, shuffle, togglePlay, next, previous, seek, setVolume, setRepeatMode, toggleShuffle, removeFromQueue } = usePlayer();
  const [showQueue, setShowQueue] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);

  const { artist, album } = useMemo(() => {
    const artists = getCollection('artists') as Artist[];
    const albums = getCollection('albums') as Album[];
    return {
      artist: artists.find((item) => item.id === currentTrack?.artistId),
      album: albums.find((item) => item.id === currentTrack?.albumId)
    };
  }, [currentTrack]);

  if (!currentTrack) return null;
  const duration = currentTrack.duration || 1;
  const repeatLabel = repeatMode === 'off' ? 'No repeat' : repeatMode === 'all' ? 'Repeat list' : 'Repeat one';

  return (
    <>
      <section className="player" aria-label="music player">
        <div className="player-track">
          <img src={currentTrack.coverUrl} alt={currentTrack.title} />
          <div style={{ minWidth: 0 }}>
            <strong className="truncate">{currentTrack.title}</strong>
            <div className="muted truncate">
              {artist ? <Link href={`/artists/${artist.id}`}>{artist.name}</Link> : 'Unknown artist'}
              {album ? <> · <Link href={`/albums/${album.id}`}>{album.title}</Link></> : null}
            </div>
            {currentUser && canSeeAnalytics(currentUser.subscription) ? <small className="badge">{currentTrack.listeners.toLocaleString('en-US')} listeners</small> : null}
          </div>
        </div>
        <div className="player-controls">
          <div className="control-buttons">
            <button className={`icon-btn ${shuffle ? 'active' : ''}`} onClick={toggleShuffle} title="Shuffle">🔀</button>
            <button className="icon-btn" onClick={previous} title="Previous">⏮</button>
            <button className="icon-btn active" onClick={togglePlay} title="Play/Pause">{isPlaying ? '⏸' : '▶'}</button>
            <button className="icon-btn" onClick={next} title="Next">⏭</button>
            <button
              className={`icon-btn ${repeatMode !== 'off' ? 'active' : ''}`}
              onClick={() => setRepeatMode(repeatMode === 'off' ? 'all' : repeatMode === 'all' ? 'one' : 'off')}
              title={repeatLabel}
            >🔁</button>
          </div>
          <div className="progress-line">
            <small>{formatDuration(progress)}</small>
            <input type="range" min={0} max={duration} value={Math.min(progress, duration)} onChange={(event) => seek(Number(event.target.value))} />
            <small>{formatDuration(duration)}</small>
          </div>
        </div>
        <div className="player-side">
          <button className="btn ghost" onClick={() => setShowLyrics((value) => !value)}>Lyrics</button>
          <button className="btn ghost" onClick={() => setShowQueue((value) => !value)}>Queue</button>
          <span className="muted">Volume</span>
          <input aria-label="volume" type="range" min={0} max={100} value={volume} onChange={(event) => setVolume(Number(event.target.value))} />
        </div>
      </section>
      {showQueue ? (
        <div className="modal-backdrop" onClick={() => setShowQueue(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="page-header"><h2>Queue</h2><button className="btn ghost" onClick={() => setShowQueue(false)}>Close</button></div>
            <div className="grid">
              {queue.map((track) => (
                <div className="track-row" key={track.id}>
                  <img src={track.coverUrl} alt={track.title} />
                  <div><strong>{track.title}</strong><div className="muted">{formatDuration(track.duration)}</div></div>
                  <button className="btn danger" onClick={() => removeFromQueue(track.id)}>Remove from queue</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
      {showLyrics ? (
        <div className="modal-backdrop" onClick={() => setShowLyrics(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="page-header"><h2>Lyrics</h2><button className="btn ghost" onClick={() => setShowLyrics(false)}>Close</button></div>
            <p style={{ whiteSpace: 'pre-line', lineHeight: 2 }}>{currentTrack.lyrics || 'No lyrics have been added for this track.'}</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
