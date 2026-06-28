import type { Album, Track, User } from '@/types/domain';
import { getCollection, setCollection } from '@/lib/storage';

export const EARLY_ACCESS_DURATION_MS = 2 * 60 * 1000;

type EarlyAccessItem = {
  isEarlyAccess?: boolean;
  earlyAccessStartedAt?: string;
  releaseDate?: string;
};

const getStartTime = (item: EarlyAccessItem) => {
  const raw = item.earlyAccessStartedAt ?? (item.releaseDate?.includes('T') ? item.releaseDate : undefined);
  if (!raw) return Number.NaN;
  return new Date(raw).getTime();
};

export const createEarlyAccessMeta = () => ({
  isEarlyAccess: true,
  earlyAccessStartedAt: new Date().toISOString()
});

export const getEarlyAccessRemainingMs = (item: EarlyAccessItem, now = Date.now()) => {
  if (!item.isEarlyAccess) return 0;
  const start = getStartTime(item);
  if (Number.isNaN(start)) return 0;
  return Math.max(0, EARLY_ACCESS_DURATION_MS - (now - start));
};

export const isEarlyAccessActive = (item: EarlyAccessItem, now = Date.now()) =>
  Boolean(item.isEarlyAccess) && getEarlyAccessRemainingMs(item, now) > 0;

export const canUserAccessEarlyRelease = (user: Pick<User, 'subscription'> | null | undefined) =>
  user?.subscription === 'gold';

const expireItem = <T extends EarlyAccessItem>(item: T, now: number) => {
  if (!item.isEarlyAccess || isEarlyAccessActive(item, now)) return { item, changed: false };
  return {
    item: {
      ...item,
      isEarlyAccess: false
    },
    changed: true
  };
};

export const expireEarlyAccessItems = <T extends EarlyAccessItem>(items: T[], now = Date.now()) => {
  let changed = false;
  const nextItems = items.map((item) => {
    const result = expireItem(item, now);
    if (result.changed) changed = true;
    return result.item as T;
  });

  return { items: nextItems, changed };
};

export const syncExpiredEarlyAccess = (now = Date.now()) => {
  const tracks = getCollection('tracks') as Track[];
  const albums = getCollection('albums') as Album[];

  const nextTracks = expireEarlyAccessItems(tracks, now);
  const nextAlbums = expireEarlyAccessItems(albums, now);

  if (nextTracks.changed) setCollection('tracks', nextTracks.items);
  if (nextAlbums.changed) setCollection('albums', nextAlbums.items);

  return {
    tracks: nextTracks.items,
    albums: nextAlbums.items
  };
};

export const getActiveEarlyAlbums = (albums: Album[], now = Date.now()) =>
  albums.filter((album) => isEarlyAccessActive(album, now));

export const getActiveEarlyTracks = (tracks: Track[], now = Date.now()) =>
  tracks.filter((track) => isEarlyAccessActive(track, now));

export const getPublicAlbums = (albums: Album[], now = Date.now()) =>
  albums.filter((album) => !isEarlyAccessActive(album, now));

export const getPublicTracks = (tracks: Track[], albums: Album[], now = Date.now()) => {
  const activeEarlyAlbumIds = new Set(getActiveEarlyAlbums(albums, now).map((album) => album.id));

  return tracks.filter((track) => {
    if (isEarlyAccessActive(track, now)) return false;
    if (track.albumId && activeEarlyAlbumIds.has(track.albumId)) return false;
    return true;
  });
};

export const formatEarlyAccessRemaining = (item: EarlyAccessItem, now = Date.now()) => {
  const remaining = getEarlyAccessRemainingMs(item, now);
  const seconds = Math.ceil(remaining / 1000);
  if (seconds <= 0) return 'Available now';
  const minutes = Math.floor(seconds / 60);
  const restSeconds = seconds % 60;
  return `${minutes}:${String(restSeconds).padStart(2, '0')}`;
};
