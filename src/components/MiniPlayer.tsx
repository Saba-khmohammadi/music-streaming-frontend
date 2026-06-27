'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef
} from 'react';
import { getCollection, readStore, setCollection, writeStore } from '@/lib/storage';
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
  const [streamCounted, setStreamCounted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentTrack = tracks.find((track) => track.id === currentTrackId) ?? null;
  const queue = queueIds.map((id) => tracks.find((track) => track.id === id)).filter(Boolean) as Track[];

  useEffect(() => {
    audioRef.current = new Audio();
  }, []);

  useEffect(() => {
    const refreshTracks = () => {
      setTracks(getCollection('tracks'));
    };

    refreshTracks();

    window.addEventListener('focus', refreshTracks);
    return () => {
      window.removeEventListener('focus', refreshTracks);
    };
  }, []);

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
    if (!audioRef.current || !currentTrack?.audioUrl) return;

    audioRef.current.src = currentTrack.audioUrl;
  }, [currentTrack]);

  // Reset stream counted when track changes
  useEffect(() => {
    setStreamCounted(false);
  }, [currentTrackId]);

  // Count stream after 10 seconds of playback
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;

    const handleTimeUpdate = () => {
      if (streamCounted) return;

      if (audioRef.current!.currentTime >= 10) {
        const tracks = getCollection('tracks');

        const updatedTracks = tracks.map((t: Track) =>
          t.id === currentTrack.id
            ? {
                ...t,
                streams: t.streams + 1,
              }
            : t
        );

        setTracks(updatedTracks);
        setCollection('tracks', updatedTracks);

        setStreamCounted(true);
      }
    };

    audioRef.current.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      audioRef.current?.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [currentTrack, streamCounted]);

  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;

    audioRef.current.pause();
    audioRef.current.src = currentTrack.audioUrl ?? '';
    audioRef.current.load();

    if (isPlaying) {
      audioRef.current.play().catch(() => {});
    }
  }, [currentTrack, isPlaying]);

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

  const playTrack = useCallback((trackId: string, nextQueueIds?: string[]) => {
    const latestTracks = getCollection('tracks');
    setTracks(latestTracks);

    setCurrentTrackId(trackId);

    setQueueIds(
      nextQueueIds && nextQueueIds.length > 0
        ? nextQueueIds
        : (prev) =>
            prev.includes(trackId)
              ? prev
              : [trackId, ...prev]
    );

    setProgress(0);
    setPlaying(true);
    setStreamCounted(false);
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
    setStreamCounted(false);
  }, [currentTrackId, queueIds, repeatMode, shuffle]);

  const previous = useCallback(() => {
    if (!queueIds.length || !currentTrackId) return;
    const index = queueIds.indexOf(currentTrackId);
    setCurrentTrackId(queueIds[Math.max(0, index - 1)]);
    setProgress(0);
    setStreamCounted(false);
  }, [currentTrackId, queueIds]);

  const setVolume = useCallback((value: number) => {
    const volumeValue = Math.max(0, Math.min(100, value));
    setPlayerVolume(volumeValue);
    if (audioRef.current) {
      audioRef.current.volume = volumeValue / 100;
    }
  }, []);

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