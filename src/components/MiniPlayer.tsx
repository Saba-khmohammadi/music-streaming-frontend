'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePlayer } from '@/context/PlayerContext';
import { getCollection } from '@/lib/storage';
import { formatDuration } from '@/lib/format';
import { canSeeAnalytics } from '@/lib/rules';
import type { Album, Artist } from '@/types/domain';
import { useEffect } from 'react';


export default function MiniPlayer() {
  const { currentUser } = useAuth();
  const { currentTrack, queue, isPlaying, progress, volume, repeatMode, shuffle, togglePlay, next, previous, seek, setVolume, setRepeatMode, toggleShuffle, removeFromQueue } = usePlayer();
  const [showQueue, setShowQueue] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  useEffect(() => {
    if (currentTrack && window.innerWidth < 768) {
      setIsExpanded(true);
    }
  }, [currentTrack]);
  

  const { artist, album } = useMemo(() => {
    const artists = getCollection('artists') as Artist[];
    const albums = getCollection('albums') as Album[];
    return {
      artist: artists.find((item) => item.id === currentTrack?.artistId),
      album: albums.find((item) => item.id === currentTrack?.albumId)
    };
  }, [currentTrack]);

  useEffect(() => {
    const handleExpand = () => setIsExpanded(true);
    window.addEventListener('expand-player', handleExpand);
    return () => window.removeEventListener('expand-player', handleExpand);
  }, []);

  if (!currentTrack) return null;
  const duration = currentTrack.duration || 1;
  const repeatLabel = repeatMode === 'off' ? 'No repeat' : repeatMode === 'all' ? 'Repeat list' : 'Repeat one';

  return (
    <>
      <section className={`player ${isExpanded ? 'mobile-expanded' : ''}`} aria-label="music player">
        
        <div className="player-track" onClick={() => window.innerWidth < 768 && setIsExpanded(true)}>
        <img className="player-cover" src={currentTrack.coverUrl} alt={currentTrack.title} />
          <div style={{ minWidth: 0 }}>
            <strong className="truncate">{currentTrack.title}</strong>
            <div className="muted truncate">
              {artist ? <Link href={`/artists/${artist.id}`}>{artist.name}</Link> : 'Unknown artist'}
              {album ? <> · <Link href={`/albums/${album.id}`}>{album.title}</Link></> : null}
            </div>
           {currentUser &&
canSeeAnalytics(currentUser.role, currentUser.subscription) ? (
  <small className="badge">
    {currentTrack.listeners.toLocaleString('en-US')} listeners ·{" "}
    {currentTrack.streams.toLocaleString("en-US")} streams
  </small>
) : null}
            
            {currentUser && currentUser.subscription === 'gold' ? (
              <small className="badge" style={{ backgroundColor: '#eab308', color: '#000', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <svg viewBox="0 0 576 512" style={{ width: '12px', height: '12px', fill: 'currentColor' }}><path d="M576 136c0 22.1-17.9 40-40 40c-.2 0-.4 0-.6 0l-22.5 135.2c-1.9 11.4-11.8 19.8-23.4 19.8H86.4c-11.6 0-21.5-8.4-23.4-19.8L40.6 176c-.2 0-.4 0-.6 0c-22.1 0-40-17.9-40-40S17.9 96 40 96c14.7 0 27.5 8 34.3 19.8l109.3 54.7c11.2 5.6 24 .5 29-10.7l64-144c5.1-11.5 16.4-18.8 29-18.8s23.9 7.3 29 18.8l64 144c5 11.2 17.8 16.3 29 10.7l109.3-54.7c6.8-11.8 19.6-19.8 34.3-19.8c22.1 0 40 17.9 40 40zM48 464c0 26.5 21.5 48 48 48h384c26.5 0 48-21.5 48-48V416H48v48z"/></svg>
                {currentTrack.listeners.toLocaleString('en-US')} listeners · {currentTrack.streams.toLocaleString('en-US')} streams
              </small>
            ) : null}
          </div>

          {isExpanded && (
            <button 
              className="btn ghost close-mobile-player" 
              onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
              style={{ 
                marginLeft: 'auto', 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                padding: '8px',
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '50%',
                border: 'none',
                cursor: 'pointer',
                color: '#fff'
              }}
              title="Minimize"
            >
              <svg viewBox="0 0 24 24" style={{ width: '20px', height: '20px', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' }}><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>
          )}
        </div>

        <div className="player-controls">
          <div className="control-buttons">
            <button 
                className={`icon-btn ${shuffle ? 'active' : ''}`} 
                onClick={toggleShuffle} 
                title="Shuffle" 
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: shuffle ? '#7c3aed' : '#a3a3a3', opacity: shuffle ? 1 : 0.6 }}
              >
                <svg viewBox="0 0 24 24" style={{ width: '18px', height: '18px', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' }}><polyline points="16 3 21 3 21 8"></polyline><line x1="4" y1="20" x2="21" y2="3"></line><polyline points="21 16 21 21 16 21"></polyline><line x1="15" y1="15" x2="21" y2="21"></line><line x1="4" y1="4" x2="9" y2="9"></line></svg>
              </button>
            
            <button className="icon-btn" onClick={previous} title="Previous" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#a3a3a3' }}>
              <svg viewBox="0 0 24 24" style={{ width: '20px', height: '20px', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' }}><polygon points="19 20 9 12 19 4 19 20"></polygon><line x1="5" y1="19" x2="5" y2="5"></line></svg>
            </button>
            <button className="icon-btn active" onClick={togglePlay} title="Play/Pause" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              {isPlaying ? (
                <svg viewBox="0 0 24 24" style={{ width: '22px', height: '22px', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' }}><line x1="18" y1="4" x2="18" y2="20"></line><line x1="6" y1="4" x2="6" y2="20"></line></svg>
              ) : (
                <svg viewBox="0 0 24 24" style={{ width: '22px', height: '22px', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round', transform: 'translateX(1px)' }}><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              )}
            </button>

            <button className="icon-btn" onClick={next} title="Next" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#a3a3a3' }}>
              <svg viewBox="0 0 24 24" style={{ width: '20px', height: '20px', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' }}><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="19" x2="19" y2="5"></line></svg>
            </button>
            
            <button
              className={`icon-btn ${repeatMode !== 'off' ? 'active' : ''}`}
              onClick={() => setRepeatMode(repeatMode === 'off' ? 'all' : repeatMode === 'all' ? 'one' : 'off')}
              title={repeatLabel}
              style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: repeatMode !== 'off' ? '#7c3aed' : '#a3a3a3', opacity: repeatMode !== 'off' ? 1 : 0.6 }}
            >
              <svg viewBox="0 0 24 24" style={{ width: '18px', height: '18px', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' }}><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>
              {repeatMode === 'one' && (
                <span style={{ fontSize: '9px', position: 'absolute', bottom: '-2px', right: '-2px', background: '#7c3aed', color: '#fff', borderRadius: '50%', width: '13px', height: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>1</span>
              )}
            </button>

            {!isExpanded && (
              <button 
                className="icon-btn mobile-only-expand"
                onClick={(e) => { e.stopPropagation(); setIsExpanded(true); }}
                title="Maximize"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#a3a3a3' }}
              >
                <svg viewBox="0 0 24 24" style={{ width: '18px', height: '18px', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' }}><polyline points="18 15 12 9 6 15"></polyline></svg>
              </button>
                )}
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
