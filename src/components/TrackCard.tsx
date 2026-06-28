'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { usePlayer } from '@/context/PlayerContext';
import { formatNumber } from '@/lib/format';
import { canSeeAnalytics } from '@/lib/rules';
import { isEarlyAccessActive } from '@/lib/earlyAccess';
import { getCollection } from '@/lib/storage';
import type { Artist, Album, Track } from '@/types/domain';

export default function TrackCard({ track, queueIds = [], action }: { track: Track; queueIds?: string[]; action?: React.ReactNode }) {
  const { currentUser } = useAuth();
  const { playTrack, addToQueue } = usePlayer();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // تابع دانلود مخصوص کاربران گولد
  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (track.audioUrl) {
      const link = document.createElement('a');
      link.href = track.audioUrl; 
      link.download = `${track.title}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // بستن منو با کلیک خارج از آن
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showAnalytics = currentUser ? canSeeAnalytics(currentUser.role, currentUser.subscription) : false;
  const isEarly = isEarlyAccessActive(track);

  // 🌟 گرفتن همزمان اطلاعات خواننده و آلبوم به صورت بهینه
  const { artist, album } = useMemo(() => {
    const artists = getCollection('artists') as Artist[];
    const albums = getCollection('albums') as Album[];
    return {
      artist: artists.find((item) => item.id === track.artistId),
      album: albums.find((item) => item.id === track.albumId)
    };
  }, [track.artistId, track.albumId]);

  return (
    <div className="premium-track-card" onClick={() => playTrack(track.id, queueIds)}>
      {/* بخش اطلاعات ترک */}
      <div className="track-left-section">
        <div className="track-cover-wrapper">
          <img src={track.coverUrl} alt={track.title} className="track-cover" />
        </div>
        <div className="track-info">
          <strong className="track-title">{track.title}</strong>
          {isEarly && <span className="premium-card-early-badge"><i className="fas fa-bolt"></i> Early</span>}
          
          <div className="track-meta" onClick={(e) => e.stopPropagation()}>
             {/* اسم خواننده */}
             {artist ? <Link href={`/artists/${artist.id}`} className="meta-link">{artist.name}</Link> : 'Unknown'}
             
             {/* 🌟 اسم آلبوم (اگر وجود داشته باشه با یک جداکننده نشون داده میشه) */}
             {album && (
               <>
                 <span className="meta-separator">•</span>
                 <Link href={`/albums/${album.id}`} className="meta-link album-name-link">{album.title}</Link>
               </>
             )}
          </div>
        </div>
      </div>

      {/* بخش منوی سه نقطه و دانلود */}
      <div className="track-right-section" onClick={(e) => e.stopPropagation()}>
        {showAnalytics && <span className="analytics-pill"><i className="fas fa-chart-line"></i> {formatNumber(track.listeners)}</span>}
        
        {/* دکمه دانلود طلایی برای کاربرای گولد */}
        {currentUser?.subscription === 'gold' && (
          <button className="download-btn-premium" onClick={handleDownload} title="Download MP3" style={{ marginRight: '8px' }}>
            <i className="fas fa-download"></i>
          </button>
        )}

        <div className="menu-container" ref={menuRef}>
          <button className="icon-btn" onClick={() => setShowMenu(!showMenu)}>
            <i className="fas fa-ellipsis-v"></i>
          </button>
          
          {showMenu && (
            <div className="premium-dropdown-menu">
              <button onClick={() => { playTrack(track.id, queueIds); setShowMenu(false); }}>Play</button>
              <button onClick={() => { addToQueue(track.id); setShowMenu(false); }}>Add to queue</button>
              {action}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}