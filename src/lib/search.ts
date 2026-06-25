import type { Album, Artist, Track } from '@/types/domain';

export type SortMode = 'listeners' | 'releaseDate';

export const normalize = (value: string) => value.trim().toLowerCase();

export const filterTracks = (tracks: Track[], artists: Artist[], query: string) => {
  const q = normalize(query);
  if (!q) return tracks;
  return tracks.filter((track) => {
    const artist = artists.find((item) => item.id === track.artistId);
    return normalize(track.title).includes(q) || normalize(artist?.name ?? '').includes(q) || normalize(track.genre).includes(q);
  });
};

export const filterAlbums = (albums: Album[], artists: Artist[], query: string) => {
  const q = normalize(query);
  if (!q) return albums;
  return albums.filter((album) => {
    const artist = artists.find((item) => item.id === album.artistId);
    return normalize(album.title).includes(q) || normalize(artist?.name ?? '').includes(q) || normalize(album.genre).includes(q);
  });
};

export const sortTracks = (tracks: Track[], sort: SortMode) =>
  [...tracks].sort((a, b) => {
    if (sort === 'listeners') return b.listeners - a.listeners;
    return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
  });

export const sortAlbums = (albums: Album[], sort: SortMode, tracks: Track[]) =>
  [...albums].sort((a, b) => {
    if (sort === 'releaseDate') return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
    const aListeners = a.trackIds.reduce((sum, id) => sum + (tracks.find((track) => track.id === id)?.listeners ?? 0), 0);
    const bListeners = b.trackIds.reduce((sum, id) => sum + (tracks.find((track) => track.id === id)?.listeners ?? 0), 0);
    return bListeners - aListeners;
  });
