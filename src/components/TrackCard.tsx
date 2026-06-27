'use client';

import { useState, useRef, useEffect } from 'react'; // اضافه کردن این‌ها
import Link from 'next/link';
import { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePlayer } from '@/context/PlayerContext';
import { formatDuration, formatNumber } from '@/lib/format';
import { canSeeAnalytics } from '@/lib/rules';
import { getCollection } from '@/lib/storage';
import type { Album, Artist, Track } from '@/types/domain';

export default function TrackCard({ track, queueIds, action }: { track: Track; queueIds?: string[]; action?: React.ReactNode }) {
  const { currentUser } = useAuth();
  const { playTrack, addToQueue } = usePlayer();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // بستن منو با کلیک خارج از آن
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showAnalytics = currentUser ? canSeeAnalytics(currentUser.role, currentUser.subscription) : false;

  const { artist, album } = useMemo(() => {
    const artists = getCollection('artists') as Artist[];
    const albums = getCollection('albums') as Album[];
    return {
      artist: artists.find((item) => item.id === track.artistId),
      album: albums.find((item) => item.id === track.albumId)
    };
  }, [track.albumId, track.artistId]);

  return (
    <div className="premium-track-card" onClick={() => playTrack(track.id, queueIds)}>
      {/* بخش اطلاعات ترک (تغییری نکرده) */}
      <div className="track-left-section">
        <div className="track-cover-wrapper"><img src={track.coverUrl} alt={track.title} className="track-cover" /></div>
        <div className="track-info">
          <strong className="track-title">{track.title}</strong>
          <div className="track-meta" onClick={(e) => e.stopPropagation()}>
             {artist ? <Link href={`/artists/${artist.id}`}>{artist.name}</Link> : 'Unknown'}
          </div>
        </div>
      </div>

      {/* بخش جدید منوی سه نقطه */}
      <div className="track-right-section" onClick={(e) => e.stopPropagation()}>
        {showAnalytics && <span className="analytics-pill"><i className="fas fa-chart-line"></i> {formatNumber(track.listeners)}</span>}
        
        <div className="menu-container" ref={menuRef}>
          <button className="icon-btn" onClick={() => setShowMenu(!showMenu)}><i className="fas fa-ellipsis-v"></i></button>
          
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