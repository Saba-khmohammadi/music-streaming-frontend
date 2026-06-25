import { describe, expect, it } from 'vitest';
import { albums, artists, tracks } from '@/data/mockData';
import { filterAlbums, filterTracks, sortAlbums, sortTracks } from './search';

describe('library search and sorting', () => {
  it('finds tracks by track title', () => {
    expect(filterTracks(tracks, artists, 'Morning').map((track) => track.id)).toContain('track-1');
  });

  it('finds tracks by artist name', () => {
    expect(filterTracks(tracks, artists, 'Nila').length).toBeGreaterThan(0);
  });

  it('sorts tracks by listeners descending', () => {
    const sorted = sortTracks(tracks, 'listeners');
    expect(sorted[0].listeners).toBeGreaterThanOrEqual(sorted[1].listeners);
  });

  it('sorts albums by newest release first', () => {
    const sorted = sortAlbums(albums, 'releaseDate', tracks);
    expect(new Date(sorted[0].releaseDate).getTime()).toBeGreaterThanOrEqual(new Date(sorted[1].releaseDate).getTime());
  });

  it('filters albums by genre or title', () => {
    expect(filterAlbums(albums, artists, 'Ambient').map((album) => album.id)).toContain('album-3');
  });
});
