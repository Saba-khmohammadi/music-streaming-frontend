import type { SubscriptionTier, User, UserPreferences, UserRole } from '@/types/domain';

export const subscriptionLabels: Record<SubscriptionTier, string> = {
  base: 'Base',
  silver: 'Silver',
  gold: 'Gold'
};

export const subscriptionLabelsFa: Record<SubscriptionTier, string> = {
  base: 'عادی',
  silver: 'نقره‌ای',
  gold: 'طلایی'
};

export const roleLabels: Record<UserRole, string> = {
  listener: 'Listener',
  artist: 'Artist',
  support: 'support',
  admin: 'admin'
};

export const roleLabelsFa: Record<UserRole, string> = {
  listener: 'شنونده',
  artist: 'هنرمند',
  support: 'support',
  admin: 'admin'
};

export const playlistLimit = (tier: SubscriptionTier): number => {
  if (tier === 'base') return 6;
  if (tier === 'silver') return 100;
  return Number.POSITIVE_INFINITY;
};

export const canCreatePlaylist = (tier: SubscriptionTier, currentCount: number) => currentCount < playlistLimit(tier);

export const canUploadProfileImage = (tier: SubscriptionTier) => tier !== 'base';

export const canDownloadTrack = (tier: SubscriptionTier) => tier !== 'base';

export const canSeeAnalytics = (
  role: UserRole,
  tier: SubscriptionTier
) => {
  if (role === 'artist') return true;

  return tier === 'gold';
};

export const canAccessEarlyRelease = (tier: SubscriptionTier) => tier === 'gold';

export const canManageWorks = (user: Pick<User, 'role' | 'verifiedArtist'>) => user.role === 'artist' && Boolean(user.verifiedArtist);

export const canUseAdminPricing = (role: UserRole) => role === 'admin';

export const canUseSupportDashboard = (role: UserRole) => role === 'support' || role === 'admin';

const navLabels: Record<UserPreferences['language'], Record<string, string>> = {
  en: {
    '/home': 'Home',
    '/library': 'Albums and Singles',
    '/early-access': 'Early Access',
    '/playlists': 'Playlists',
    '/notifications': 'Notifications',
    '/support': 'Support Chat',
    '/profile': 'User Profile',
    '/settings': 'Settings',
    '/artist/manage': 'Work Management',
    '/dashboard': 'Support/Admin Dashboard'
  },
  fa: {
    '/home': 'خانه',
    '/library': 'آلبوم‌ها و تک‌آهنگ‌ها',
    '/early-access': 'دسترسی زودهنگام',
    '/playlists': 'پلی‌لیست‌ها',
    '/notifications': 'اعلان‌ها',
    '/support': 'چت پشتیبانی',
    '/profile': 'پروفایل کاربر',
    '/settings': 'تنظیمات',
    '/artist/manage': 'مدیریت آثار',
    '/dashboard': 'داشبورد پشتیبانی/مدیر'
  }
};

export const navItemsForRole = (role: UserRole, language: UserPreferences['language'] = 'en') => {
  const label = navLabels[language] ?? navLabels.en;
  const base = [
    { href: '/home', label: label['/home'] },
    { href: '/library', label: label['/library'] },
    { href: '/early-access', label: label['/early-access'] },
    { href: '/playlists', label: label['/playlists'] },
    { href: '/notifications', label: label['/notifications'] },
    { href: '/profile', label: label['/profile'] },
    { href: '/settings', label: label['/settings'] }
  ];
  const supportChat = { href: '/support', label: label['/support'] };

  if (role === 'artist') return [...base, supportChat, { href: '/artist/manage', label: label['/artist/manage'] }];
  if (role === 'support' || role === 'admin') {
    const dashboardLabel = role === 'admin' ? 'admin' : 'support';
    return [...base, { href: '/dashboard', label: dashboardLabel }];
  }
  return [...base, supportChat];
};

export const displayRoleLabel = (role: UserRole, language: UserPreferences['language']) =>
  language === 'fa' ? roleLabelsFa[role] : roleLabels[role];

export const displaySubscriptionLabel = (tier: SubscriptionTier, language: UserPreferences['language']) =>
  language === 'fa' ? subscriptionLabelsFa[tier] : subscriptionLabels[tier];

export const calculateArtistReward = (uniqueListeners: number, streams: number) => {
  const listenerWeight = uniqueListeners * 4500;
  const streamWeight = streams * 900;
  return Math.round(listenerWeight + streamWeight);
};
