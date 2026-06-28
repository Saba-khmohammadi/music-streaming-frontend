import { albums, artists, auditRows, notifications, playlists, subscriptionPricing, tickets, tracks, users } from '@/data/mockData';
import type { Album, AppNotification, Artist, AuditRow, Playlist, SubscriptionPricing, Ticket, Track, User } from '@/types/domain';

const PREFIX = 'phase1-music-en:';

export interface AppData {
  users: User[];
  artists: Artist[];
  albums: Album[];
  tracks: Track[];
  playlists: Playlist[];
  notifications: AppNotification[];
  tickets: Ticket[];
  auditRows: AuditRow[];
  pricing: SubscriptionPricing;
}

export const seedData: AppData = {
  users,
  artists,
  albums,
  tracks,
  playlists,
  notifications,
  tickets,
  auditRows,
  pricing: subscriptionPricing
};

const canUseStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export function readStore<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;
  const value = window.localStorage.getItem(PREFIX + key);
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function writeStore<T>(key: string, value: T) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
}

export function getCollection<K extends keyof AppData>(key: K): AppData[K] {
  return readStore(String(key), seedData[key]);
}

export function setCollection<K extends keyof AppData>(key: K, value: AppData[K]) {
  writeStore(String(key), value);
  
  // Dispatch event to notify all components about storage update
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('storage-update', {
        detail: {
          key,
          value,
        },
      })
    );
  }
}

export function resetMockData() {
  if (!canUseStorage()) return;
  Object.keys(seedData).forEach((key) => window.localStorage.removeItem(PREFIX + key));
  window.localStorage.removeItem(PREFIX + 'currentUserId');
  
  // Dispatch event for reset
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('storage-update', { detail: { key: 'reset', value: null } }));
  }
}

export function getCurrentUserId() {
  return readStore<string | null>('currentUserId', null);
}

export function setCurrentUserId(id: string | null) {
  writeStore('currentUserId', id);
}

export const newId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;