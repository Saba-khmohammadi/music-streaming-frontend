'use client';

import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePlayer } from '@/context/PlayerContext';
import { getCollection } from '@/lib/storage';
import { formatDuration } from '@/lib/format';
import type { Album, Artist } from '@/types/domain';

export default function MiniPlayer() {
  const { currentUser } = useAuth();
  const { currentTrack, queue, isPlaying, progress, volume, repeatMode, shuffle, togglePlay, next, previous, seek, setVolume, setRepeatMode, toggleShuffle, removeFromQueue } = usePlayer();
  const [showQueue, setShowQueue] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

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
      <section className={`player-premium-container ${isExpanded ? 'mobile-expanded' : ''}`} aria-label="music player">
    
      <div className="player-track-premium" onClick={() => window.innerWidth < 768 && setIsExpanded(true)}>
          <div className="cover-wrapper-premium">
            <img className="player-cover-premium" src={currentTrack.coverUrl} alt={currentTrack.title} />
          </div>
          <div className="track-info-premium">
            <strong className="track-title-premium truncate">{currentTrack.title}</strong>
            <div className="track-meta-premium truncate">
              {artist ? <Link href={`/artists/${artist.id}`} className="artist-link-premium">{artist.name}</Link> : <span className="unknown-premium">Unknown artist</span>}
              {album ? <span className="album-separator-premium"> · <Link href={`/albums/${album.id}`} className="album-link-premium">{album.title}</Link></span> : null}
            </div>
            
            {currentUser && currentUser.subscription === 'gold' ? (
              <div className="gold-analytics-badge">
                <div className="crown-glow-icon">
                  <i className="fas fa-crown"></i>
                </div>
                <div className="analytics-data-premium">
                  <span>{currentTrack.listeners.toLocaleString('en-US')} listeners</span>
                  <span className="dot-divider"></span>
                  <span>{currentTrack.streams.toLocaleString('en-US')} streams</span>
                </div>
              </div>
            ) : null}
          </div>

          {isExpanded && (
            <button 
              className="neon-control-btn close-mobile-player" 
              onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
              title="Minimize"
            >
              <div className="neon-control-circle small-circle">
                <i className="fas fa-chevron-down"></i>
              </div>
            </button>
          )}
        </div>

        <div className="player-controls-premium">
          <div className="control-buttons-premium">
            <button 
              className={`neon-control-btn ${shuffle ? 'active' : ''}`} 
              onClick={toggleShuffle} 
              title="Shuffle" 
            >
              <div className="neon-control-circle">
                <i className="fas fa-random"></i>
              </div>
            </button>
            
            <button className="neon-control-btn" onClick={previous} title="Previous">
              <div className="neon-control-circle">
                <i className="fas fa-step-backward"></i>
              </div>
            </button>

            <button className="neon-control-btn active-play" onClick={togglePlay} title="Play/Pause">
              <div className="neon-control-circle play-master-btn">
                {isPlaying ? <i className="fas fa-pause"></i> : <i className="fas fa-play" style={{ transform: 'translateX(2px)' }}></i>}
              </div>
            </button>

            <button className="neon-control-btn" onClick={next} title="Next">
              <div className="neon-control-circle">
                <i className="fas fa-step-forward"></i>
              </div>
            </button>
            
            <button
              className={`neon-control-btn ${repeatMode !== 'off' ? 'active' : ''}`}
              onClick={() => setRepeatMode(repeatMode === 'off' ? 'all' : repeatMode === 'all' ? 'one' : 'off')}
              title={repeatLabel}
              style={{ position: 'relative' }}
            >
              <div className="neon-control-circle">
                <i className="fas fa-redo"></i>
              </div>
              {repeatMode === 'one' && (
                <span className="repeat-badge-one">1</span>
              )}
            </button>

            {!isExpanded && (
              <button 
                className="neon-control-btn mobile-only-expand"
                onClick={(e) => { e.stopPropagation(); setIsExpanded(true); }}
                title="Maximize"
              >
                <div className="neon-control-circle small-circle">
                  <i className="fas fa-chevron-up"></i>
                </div>
              </button>
            )}
          </div>

          <div className="progress-line-premium">
            <small>{formatDuration(progress)}</small>
            <input type="range" min={0} max={duration} value={Math.min(progress, duration)} onChange={(event) => seek(Number(event.target.value))} />
            <small>{formatDuration(duration)}</small>
          </div>
        </div>

        <div className="player-side-premium">
          <button 
            className={`neon-btn ${showLyrics ? 'active' : ''}`} 
            onClick={() => setShowLyrics((value) => !value)}
            title="Lyrics"
          >
            <div className="neon-circle">
              <i className="fas fa-microphone-alt"></i>
            </div>
          </button>

          <button 
            className={`neon-btn ${showQueue ? 'active' : ''}`} 
            onClick={() => setShowQueue((value) => !value)}
            title="Queue"
          >
            <div className="neon-circle">
              <i className="fas fa-list-ul"></i>
            </div>
          </button>

          <div style={{ position: 'relative', display: 'inline-block' }}>
            <button 
              className={`neon-btn ${showVolumeSlider ? 'active' : ''}`} 
              onClick={() => setShowVolumeSlider((value) => !value)}
              title="Volume"
            >
              <div className="neon-circle">
                <i className={`fas ${volume === 0 ? 'fa-volume-mute' : volume < 40 ? 'fa-volume-down' : 'fa-volume-up'}`}></i>
              </div>
            </button>

            {showVolumeSlider && (
              <div className="glass-volume-popup">
                <input 
                  aria-label="volume" 
                  type="range" 
                  min={0} 
                  max={100} 
                  value={volume} 
                  onChange={(event) => setVolume(Number(event.target.value))} 
                  className="premium-volume-slider-vertical"
                />
                <span className="volume-text">{volume}%</span>
              </div>
            )}
          </div>
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