import type { SubscriptionTier, User, UserRole } from '@/types/domain';

export const subscriptionLabels: Record<SubscriptionTier, string> = {
  base: 'Base',
  silver: 'Silver',
  gold: 'Gold'
};

export const roleLabels: Record<UserRole, string> = {
  listener: 'Listener',
  artist: 'Artist',
  support: 'Support',
  admin: 'System Admin'
};

export const playlistLimit = (tier: SubscriptionTier): number => {
  if (tier === 'base') return 6;
  if (tier === 'silver') return 100;
  return Number.POSITIVE_INFINITY;
};

export const canCreatePlaylist = (tier: SubscriptionTier, currentCount: number) => currentCount < playlistLimit(tier);

export const canUploadProfileImage = (tier: SubscriptionTier) => tier !== 'base';

export const canDownloadTrack = (tier: SubscriptionTier) => tier !== 'base';

export const canSeeAnalytics = (tier: SubscriptionTier) => tier === 'gold';

export const canAccessEarlyRelease = (tier: SubscriptionTier) => tier === 'gold';

export const canManageWorks = (user: Pick<User, 'role' | 'verifiedArtist'>) => user.role === 'artist' && Boolean(user.verifiedArtist);

export const canUseAdminPricing = (role: UserRole) => role === 'admin';

export const canUseSupportDashboard = (role: UserRole) => role === 'support' || role === 'admin';

export const navItemsForRole = (role: UserRole) => {
  const base = [
    { href: '/home', label: 'Home' },
    { href: '/library', label: 'Albums and Singles' },
    { href: '/playlists', label: 'Playlists' },
    { href: '/notifications', label: 'Notifications' },
    { href: '/profile', label: 'User Profile' },
    { href: '/settings', label: 'Settings' }
  ];
  if (role === 'artist') return [...base, { href: '/artist/manage', label: 'Work Management' }];
  if (role === 'support' || role === 'admin') return [...base, { href: '/dashboard', label: 'Support/Admin Dashboard' }];
  return base;
};

export const calculateArtistReward = (uniqueListeners: number, streams: number) => {
  const listenerWeight = uniqueListeners * 4500;
  const streamWeight = streams * 900;
  return Math.round(listenerWeight + streamWeight);
};
