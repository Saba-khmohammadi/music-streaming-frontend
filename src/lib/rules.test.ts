import { describe, expect, it } from 'vitest';
import { calculateArtistReward, canAccessEarlyRelease, canCreatePlaylist, canDownloadTrack, canManageWorks, canSeeAnalytics, canUploadProfileImage, playlistLimit } from './rules';

describe('subscription and access rules', () => {
  it('limits base users to six playlists', () => {
    expect(playlistLimit('base')).toBe(6);
  });

  it('limits silver users to one hundred playlists', () => {
    expect(playlistLimit('silver')).toBe(100);
  });

  it('allows gold users to create unlimited playlists', () => {
    expect(playlistLimit('gold')).toBe(Number.POSITIVE_INFINITY);
  });

  it('blocks playlist creation after base limit', () => {
    expect(canCreatePlaylist('base', 6)).toBe(false);
  });

  it('allows playlist creation under base limit', () => {
    expect(canCreatePlaylist('base', 5)).toBe(true);
  });

  it('blocks profile image upload for base subscription', () => {
    expect(canUploadProfileImage('base')).toBe(false);
  });

  it('allows profile image upload for silver subscription', () => {
    expect(canUploadProfileImage('silver')).toBe(true);
  });

  it('allows download only for paid subscriptions', () => {
    expect(canDownloadTrack('base')).toBe(false);
    expect(canDownloadTrack('gold')).toBe(true);
  });

  it('shows analytics to gold users and artists and early access only to gold users', () => {
    expect(canSeeAnalytics('listener', 'silver')).toBe(false);
    expect(canSeeAnalytics('listener', 'gold')).toBe(true);
    expect(canSeeAnalytics('artist', 'base')).toBe(true);
    expect(canAccessEarlyRelease('base')).toBe(false);
    expect(canAccessEarlyRelease('gold')).toBe(true);
  });

  it('allows only verified artists to manage works', () => {
    expect(canManageWorks({ role: 'artist', verifiedArtist: true })).toBe(true);
    expect(canManageWorks({ role: 'artist', verifiedArtist: false })).toBe(false);
    expect(canManageWorks({ role: 'listener', verifiedArtist: true })).toBe(false);
  });

  it('calculates deterministic artist rewards', () => {
    expect(calculateArtistReward(100, 1000)).toBe(13000);
  });
});
