'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getCollection, readStore, writeStore } from '@/lib/storage';
import type { RepeatMode, Track } from '@/types/domain';

interface PlayerContextValue {
  tracks: Track[];
  currentTrack: Track | null;
  queue: Track[];
  isPlaying: boolean;
  volume: number;
  progress: number;
  repeatMode: RepeatMode;
  shuffle: boolean;
  playTrack: (trackId: string, queueIds?: string[]) => void;
  togglePlay: () => void;
  next: () => void;
  previous: () => void;
  setVolume: (value: number) => void;
  seek: (value: number) => void;
  setRepeatMode: (mode: RepeatMode) => void;
  toggleShuffle: () => void;
  addToQueue: (trackId: string) => void;
  removeFromQueue: (trackId: string) => void;
}

const PlayerContext = createContext<PlayerContextValue | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackId, setCurrentTrackId] = useState<string | undefined>();
  const [queueIds, setQueueIds] = useState<string[]>([]);
  const [isPlaying, setPlaying] = useState(false);
  const [volume, setPlayerVolume] = useState(75);
  const [progress, setProgress] = useState(0);
  const [repeatMode, setRepeat] = useState<RepeatMode>('off');
  const [shuffle, setShuffle] = useState(false);

  useEffect(() => {
    const allTracks = getCollection('tracks');
    setTracks(allTracks);
    const saved = readStore('player', null as null | { currentTrackId?: string; queueIds: string[]; volume: number; repeatMode: RepeatMode; shuffle: boolean });
    if (saved) {
      setCurrentTrackId(saved.currentTrackId);
      setQueueIds(saved.queueIds);
      setPlayerVolume(saved.volume);
      setRepeat(saved.repeatMode);
      setShuffle(saved.shuffle);
    } else if (allTracks[0]) {
      setCurrentTrackId(allTracks[0].id);
      setQueueIds(allTracks.map((item) => item.id));
    }
  }, []);

  useEffect(() => {
    writeStore('player', { currentTrackId, queueIds, volume, repeatMode, shuffle });
  }, [currentTrackId, queueIds, repeatMode, shuffle, volume]);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setProgress((value) => {
        const nextValue = value + 1;
        const current = tracks.find((track) => track.id === currentTrackId);
        if (current && nextValue >= current.duration) {
          return 0;
        }
        return nextValue;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [currentTrackId, isPlaying, tracks]);

  const currentTrack = tracks.find((track) => track.id === currentTrackId) ?? null;
  const queue = queueIds.map((id) => tracks.find((track) => track.id === id)).filter(Boolean) as Track[];

  const playTrack = useCallback((trackId: string, nextQueueIds?: string[]) => {
    setCurrentTrackId(trackId);
    setQueueIds(nextQueueIds && nextQueueIds.length > 0 ? nextQueueIds : (prev) => (prev.includes(trackId) ? prev : [trackId, ...prev]));
    setProgress(0);
    setPlaying(true);
  }, []);

  const togglePlay = useCallback(() => setPlaying((value) => !value), []);

  const next = useCallback(() => {
    if (!queueIds.length || !currentTrackId) return;
    if (repeatMode === 'one') {
      setProgress(0);
      setPlaying(true);
      return;
    }
    const index = queueIds.indexOf(currentTrackId);
    const nextIndex = shuffle ? Math.floor(Math.random() * queueIds.length) : index + 1;
    if (nextIndex >= queueIds.length) {
      if (repeatMode === 'all') setCurrentTrackId(queueIds[0]);
      else setPlaying(false);
    } else {
      setCurrentTrackId(queueIds[nextIndex]);
    }
    setProgress(0);
  }, [currentTrackId, queueIds, repeatMode, shuffle]);

  const previous = useCallback(() => {
    if (!queueIds.length || !currentTrackId) return;
    const index = queueIds.indexOf(currentTrackId);
    setCurrentTrackId(queueIds[Math.max(0, index - 1)]);
    setProgress(0);
  }, [currentTrackId, queueIds]);

  const setVolume = useCallback((value: number) => setPlayerVolume(Math.max(0, Math.min(100, value))), []);
  const seek = useCallback((value: number) => setProgress(Math.max(0, value)), []);
  const setRepeatMode = useCallback((mode: RepeatMode) => setRepeat(mode), []);
  const toggleShuffle = useCallback(() => setShuffle((value) => !value), []);
  const addToQueue = useCallback((trackId: string) => setQueueIds((prev) => (prev.includes(trackId) ? prev : [...prev, trackId])), []);
  const removeFromQueue = useCallback((trackId: string) => setQueueIds((prev) => prev.filter((item) => item !== trackId)), []);

  const value = useMemo<PlayerContextValue>(
    () => ({
      tracks,
      currentTrack,
      queue,
      isPlaying,
      volume,
      progress,
      repeatMode,
      shuffle,
      playTrack,
      togglePlay,
      next,
      previous,
      setVolume,
      seek,
      setRepeatMode,
      toggleShuffle,
      addToQueue,
      removeFromQueue
    }),
    [addToQueue, currentTrack, isPlaying, next, playTrack, previous, progress, queue, removeFromQueue, repeatMode, seek, setRepeatMode, setVolume, shuffle, togglePlay, toggleShuffle, tracks, volume]
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used inside PlayerProvider');
  return context;
}
