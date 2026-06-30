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
import {
  getCollection,
  readStore,
  writeStore,
  setCollection
} from '@/lib/storage';
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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const countedTrackRef = useRef<string | null>(null);

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
    if (!audioRef.current || !currentTrack) return;

    audioRef.current.pause();
    audioRef.current.src = currentTrack.audioUrl ?? '';
    audioRef.current.load();

    if (isPlaying) {
      audioRef.current.play().catch(() => {});
    }
  }, [currentTrack, isPlaying]);

  // FIX: Listen to audio timeupdate event for accurate progress
  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;

    const updateProgress = () => {
      setProgress(audio.currentTime);
    };

    audio.addEventListener("timeupdate", updateProgress);

    return () => {
      audio.removeEventListener("timeupdate", updateProgress);
    };
  }, []);

  useEffect(() => {
    writeStore('player', { currentTrackId, queueIds, volume, repeatMode, shuffle });
  }, [currentTrackId, queueIds, repeatMode, shuffle, volume]);

  const playTrack = useCallback((trackId: string, nextQueueIds?: string[]) => {
    const latestTracks = getCollection('tracks');

    let updatedTracks = latestTracks;

    if (countedTrackRef.current !== trackId) {
      updatedTracks = latestTracks.map(track =>
        track.id === trackId
          ? {
              ...track,
              listeners: (track.listeners ?? 0) + 1,
              streams: (track.streams ?? 0) + 1,
            }
          : track
      );

      countedTrackRef.current = trackId;

      setCollection("tracks", updatedTracks);
    }

    setTracks(updatedTracks);

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

  const setVolume = useCallback((value: number) => {
    const volumeValue = Math.max(0, Math.min(100, value));
    setPlayerVolume(volumeValue);
    if (audioRef.current) {
      audioRef.current.volume = volumeValue / 100;
    }
  }, []);

  // FIX: Seek now actually moves the audio to the correct position
  const seek = useCallback((value: number) => {
    const newTime = Math.max(0, value);

    setProgress(newTime);

    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  }, []);
  
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