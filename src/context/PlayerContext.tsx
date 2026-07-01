'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import { useAuth } from '@/context/AuthContext';
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
  const { currentUser } = useAuth();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackId, setCurrentTrackId] = useState<string | undefined>();
  const [queueIds, setQueueIds] = useState<string[]>([]);
  const [isPlaying, setPlaying] = useState(false);
  const [volume, setPlayerVolume] = useState(75);
  const [progress, setProgress] = useState(0);
  const [repeatMode, setRepeat] = useState<RepeatMode>('off');
  const [shuffle, setShuffle] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const currentTrack = tracks.find((track) => track.id === currentTrackId) ?? null;
  const queue = queueIds.map((id) => tracks.find((track) => track.id === id)).filter(Boolean) as Track[];

  useEffect(() => {
    setAudioElement(new Audio());
  }, []);

  useEffect(() => {
    const refreshTracks = () => {
      setTracks(getCollection('tracks'));
    };

    const handleStorageUpdate = (event: Event) => {
      const detail = (event as CustomEvent<{ key?: string }>).detail;
      if (!detail?.key || detail.key === 'tracks' || detail.key === 'reset') refreshTracks();
    };

    refreshTracks();

    window.addEventListener('focus', refreshTracks);
    window.addEventListener('storage-update', handleStorageUpdate);
    return () => {
      window.removeEventListener('focus', refreshTracks);
      window.removeEventListener('storage-update', handleStorageUpdate);
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
    if (!audioElement || !currentTrack) return;

    audioElement.pause();
    audioElement.src = currentTrack.audioUrl ?? '';
    audioElement.load();

    if (isPlaying) {
      audioElement.play().catch(() => {});
    }
  }, [audioElement, currentTrack, isPlaying]);

  useEffect(() => {
    if (!audioElement) return;

    const updateProgress = () => {
      setProgress(audioElement.currentTime);
    };

    audioElement.addEventListener('timeupdate', updateProgress);

    return () => {
      audioElement.removeEventListener('timeupdate', updateProgress);
    };
  }, [audioElement]);

  useEffect(() => {
    writeStore('player', { currentTrackId, queueIds, volume, repeatMode, shuffle });
  }, [currentTrackId, queueIds, repeatMode, shuffle, volume]);

  const registerStream = useCallback((trackId: string) => {
    const streamerId = currentUser?.id;
    const latestTracks = getCollection('tracks') as Track[];
    let trackFound = false;

    const updatedTracks = latestTracks.map((track) => {
      if (track.id !== trackId) return track;

      trackFound = true;
      const uniqueStreamerIds = track.uniqueStreamerIds ?? [];
      const shouldAddUniqueStreamer = Boolean(streamerId && !uniqueStreamerIds.includes(streamerId));

      return {
        ...track,
        listeners: (track.listeners ?? 0) + 1,
        streams: (track.streams ?? 0) + 1,
        uniqueStreamerIds: shouldAddUniqueStreamer && streamerId
          ? [...uniqueStreamerIds, streamerId]
          : uniqueStreamerIds
      };
    });

    if (!trackFound) {
      setTracks(latestTracks);
      return latestTracks;
    }

    setCollection('tracks', updatedTracks);
    setTracks(updatedTracks);
    return updatedTracks;
  }, [currentUser?.id]);

  const playTrack = useCallback((trackId: string, nextQueueIds?: string[]) => {
    registerStream(trackId);
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
  }, [registerStream]);

  const togglePlay = useCallback(() => setPlaying((value) => !value), []);

  const next = useCallback(() => {
    if (!queueIds.length || !currentTrackId) return;

    if (repeatMode === 'one') {
      registerStream(currentTrackId);
      setProgress(0);
      setPlaying(true);
      return;
    }

    const index = queueIds.indexOf(currentTrackId);
    const nextIndex = shuffle ? Math.floor(Math.random() * queueIds.length) : index + 1;
    const nextTrackId = nextIndex >= queueIds.length
      ? repeatMode === 'all'
        ? queueIds[0]
        : undefined
      : queueIds[nextIndex];

    if (!nextTrackId) {
      setPlaying(false);
      return;
    }

    registerStream(nextTrackId);
    setCurrentTrackId(nextTrackId);
    setProgress(0);
    setPlaying(true);
  }, [currentTrackId, queueIds, registerStream, repeatMode, shuffle]);

  const previous = useCallback(() => {
    if (!queueIds.length || !currentTrackId) return;
    const index = queueIds.indexOf(currentTrackId);
    const previousTrackId = queueIds[Math.max(0, index - 1)];
    registerStream(previousTrackId);
    setCurrentTrackId(previousTrackId);
    setProgress(0);
    setPlaying(true);
  }, [currentTrackId, queueIds, registerStream]);

  const setVolume = useCallback((value: number) => {
    const volumeValue = Math.max(0, Math.min(100, value));
    setPlayerVolume(volumeValue);
    if (audioElement) {
      audioElement.volume = volumeValue / 100;
    }
  }, [audioElement]);

  const seek = useCallback((value: number) => {
    const newTime = Math.max(0, value);
    setProgress(newTime);
    if (audioElement) {
      audioElement.currentTime = newTime;
    }
  }, [audioElement]);
  
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
