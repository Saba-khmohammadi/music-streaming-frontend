import type { Album, AppNotification, Artist, AuditRow, Playlist, SubscriptionPricing, Ticket, Track, User } from '@/types/domain';

const svg = (label: string, a: string, b: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="600" height="600" rx="80" fill="url(#g)"/><circle cx="440" cy="130" r="70" fill="white" opacity=".16"/><circle cx="145" cy="455" r="110" fill="white" opacity=".12"/><path d="M250 205v180a54 54 0 1 1-28-48V170l170-34v175a54 54 0 1 1-28-48V188z" fill="white" opacity=".86"/><text x="300" y="535" text-anchor="middle" font-family="Arial" font-size="44" fill="white" font-weight="700">${label}</text></svg>`)}`;

export const defaultAvatar = svg('USER', '#475569', '#0f172a');

export const users: User[] = [
  {
    id: 'u-listener',
    username: 'listener_1405',
    displayName: 'Listener Base',
    email: 'listener@example.com',
    password: 'listener123',
    role: 'listener',
    subscription: 'base',
    birthDate: '2002-01-18',
    gender: 'Prefer not to say',
    avatarUrl: defaultAvatar,
    followers: 12,
    following: 24,
    dailyStreams: 18,
    preferences: { notificationLimit: 20, systemSound: 'soft', language: 'fa', privacyAccepted: true }
  },
  {
    id: 'u-silver',
    username: 'silver_wave',
    displayName: 'User Silver',
    email: 'silver@example.com',
    password: 'silver123',
    role: 'listener',
    subscription: 'silver',
    birthDate: '2001-06-04',
    gender: 'Female',
    avatarUrl: svg('SILVER', '#64748b', '#22d3ee'),
    followers: 41,
    following: 30,
    dailyStreams: 90,
    preferences: { notificationLimit: 30, systemSound: 'classic', language: 'fa', privacyAccepted: true }
  },
  {
    id: 'u-gold',
    username: 'gold_member',
    displayName: 'User Gold',
    email: 'gold@example.com',
    password: 'gold123',
    role: 'listener',
    subscription: 'gold',
    birthDate: '1999-10-08',
    gender: 'Male',
    avatarUrl: svg('GOLD', '#f59e0b', '#7c2d12'),
    followers: 86,
    following: 55,
    dailyStreams: 140,
    preferences: { notificationLimit: 50, systemSound: 'soft', language: 'fa', privacyAccepted: true }
  },
  {
    id: 'u-artist',
    username: 'arash_band',
    displayName: 'Arash Band',
    email: 'artist@example.com',
    password: 'artist123',
    role: 'artist',
    subscription: 'gold',
    avatarUrl: svg('ARTIST', '#7c3aed', '#db2777'),
    followers: 1200,
    following: 18,
    dailyStreams: 0,
    verifiedArtist: true,
    artistId: 'artist-1',
    preferences: { notificationLimit: 25, systemSound: 'soft', language: 'fa', privacyAccepted: true }
  },
  {
    id: 'u-support',
    username: 'support_1',
    displayName: 'System Support',
    email: 'support@example.com',
    password: 'support123',
    role: 'support',
    subscription: 'gold',
    avatarUrl: svg('SUP', '#2563eb', '#14b8a6'),
    followers: 0,
    following: 0,
    dailyStreams: 0,
    preferences: { notificationLimit: 100, systemSound: 'classic', language: 'fa', privacyAccepted: true }
  },
  {
    id: 'u-admin',
    username: 'admin',
    displayName: 'System Admin',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin',
    subscription: 'gold',
    avatarUrl: svg('ADMIN', '#111827', '#7c3aed'),
    followers: 0,
    following: 0,
    dailyStreams: 0,
    preferences: { notificationLimit: 100, systemSound: 'classic', language: 'fa', privacyAccepted: true }
  }
];

export const artists: Artist[] = [
  {
    id: 'artist-1',
    name: 'Arash Band',
    email: 'artist@example.com',
    bio: 'Independent group focused on electronic and Persian pop music. This artist’s works are displayed as mock data in Phase 1.',
    verified: true,
    status: 'approved',
    avatarUrl: svg('Arash', '#7c3aed', '#db2777'),
    followers: 1200,
    monthlyListeners: 8420,
    monthlyStreams: 21100,
    sampleWorks: ['sample-arash-1.mp3', 'sample-arash-2.mp3']
  },
  {
    id: 'artist-2',
    name: 'Nila Wave',
    email: 'nila@example.com',
    bio: 'Young singer-songwriter with calm and minimal albums.',
    verified: true,
    status: 'approved',
    avatarUrl: svg('Nila', '#06b6d4', '#1d4ed8'),
    followers: 860,
    monthlyListeners: 4900,
    monthlyStreams: 13200,
    sampleWorks: ['nila-live.mp3']
  },
  {
    id: 'artist-3',
    name: 'Sepehr Off',
    email: 'sepehr@example.com',
    bio: 'Verification request is pending support review.',
    verified: false,
    status: 'pending',
    avatarUrl: svg('Sepehr', '#334155', '#64748b'),
    followers: 44,
    monthlyListeners: 300,
    monthlyStreams: 900,
    sampleWorks: ['demo-sepehr.mp3']
  }
];

export const tracks: Track[] = [
  {
    id: 'track-1',
    title: 'Tehran Morning',
    artistId: 'artist-1',
    albumId: 'album-1',
    coverUrl: svg('Morning', '#8b5cf6', '#06b6d4'),
    duration: 214,
    releaseDate: '2026-03-20',
    listeners: 5100,
    streams: 12800,
    lyrics: 'Soft light reaches the waking city\nFootsteps on the street create a fresh rhythm',
    genre: 'Pop',
    collaborators: ['Nila Wave']
  },
  {
    id: 'track-2',
    title: 'Artificial Rain',
    artistId: 'artist-1',
    albumId: 'album-1',
    coverUrl: svg('Rain', '#4f46e5', '#0f172a'),
    duration: 188,
    releaseDate: '2026-04-06',
    listeners: 3900,
    streams: 7600,
    lyrics: 'Blue rain falls on the windows\nThe city breathes in its own silence',
    genre: 'Electronic'
  },
  {
    id: 'track-3',
    title: 'Early Access',
    artistId: 'artist-2',
    albumId: 'album-2',
    coverUrl: svg('Early', '#f97316', '#be123c'),
    duration: 201,
    releaseDate: '2026-06-01',
    listeners: 1200,
    streams: 2100,
    lyrics: 'This track is shown earlier to Gold users.',
    isEarlyAccess: true,
    genre: 'Indie'
  },
  {
    id: 'track-4',
    title: 'Quiet Midnight',
    artistId: 'artist-2',
    albumId: 'album-3',
    coverUrl: svg('Night', '#0f172a', '#155e75'),
    duration: 246,
    releaseDate: '2025-12-15',
    listeners: 7200,
    streams: 19400,
    lyrics: 'Your voice remains in the calm city sky',
    genre: 'Ambient'
  },
  {
    id: 'track-5',
    title: 'White Line',
    artistId: 'artist-1',
    coverUrl: svg('Line', '#ec4899', '#7c3aed'),
    duration: 175,
    releaseDate: '2026-02-10',
    listeners: 8500,
    streams: 24000,
    lyrics: 'There was no destination on the white road line',
    genre: 'Pop'
  },
  {
    id: 'track-6',
    title: 'Cafe Rain',
    artistId: 'artist-2',
    coverUrl: svg('Cafe', '#14b8a6', '#0f766e'),
    duration: 193,
    releaseDate: '2026-01-05',
    listeners: 3100,
    streams: 6500,
    lyrics: 'In the cafe corner, the sound of rain became a melody',
    genre: 'Jazz Pop'
  }
];

export const albums: Album[] = [
  {
    id: 'album-1',
    title: 'Electric City',
    artistId: 'artist-1',
    coverUrl: svg('City', '#8b5cf6', '#06b6d4'),
    releaseDate: '2026-04-06',
    genre: 'Electronic Pop',
    trackIds: ['track-1', 'track-2'],
    type: 'album'
  },
  {
    id: 'album-2',
    title: 'Gold Preview',
    artistId: 'artist-2',
    coverUrl: svg('Gold', '#f97316', '#be123c'),
    releaseDate: '2026-06-01',
    isEarlyAccess: true,
    genre: 'Indie',
    trackIds: ['track-3'],
    type: 'single'
  },
  {
    id: 'album-3',
    title: 'Quiet Nights',
    artistId: 'artist-2',
    coverUrl: svg('Nights', '#0f172a', '#155e75'),
    releaseDate: '2025-12-15',
    genre: 'Ambient',
    trackIds: ['track-4'],
    type: 'album'
  }
];

export const playlists: Playlist[] = [
  {
    id: 'playlist-1',
    ownerId: 'u-listener',
    title: 'Campus Route',
    coverUrl: svg('Campus', '#2563eb', '#7c3aed'),
    trackIds: ['track-1', 'track-5'],
    updatedAt: '2026-05-22T10:30:00.000Z'
  },
  {
    id: 'playlist-2',
    ownerId: 'u-gold',
    title: 'Favorite Tracks',
    coverUrl: svg('Favorite', '#f59e0b', '#db2777'),
    trackIds: ['track-4', 'track-6', 'track-2'],
    updatedAt: '2026-05-24T09:10:00.000Z'
  }
];

export const notifications: AppNotification[] = [
  { id: 'n-1', role: 'listener', title: 'New release published', message: 'Arash Band published Tehran Morning.', link: '/albums/album-1', isRead: false, createdAt: '2026-05-20T10:00:00Z' },
  { id: 'n-2', role: 'listener', title: 'Subscription renewal', message: 'Your subscription is close to expiring.', link: '/settings', isRead: false, createdAt: '2026-05-22T12:00:00Z' },
  { id: 'n-3', role: 'artist', title: 'Artist account approved', message: 'You can now publish your works.', link: '/artist/manage', isRead: false, createdAt: '2026-05-18T08:00:00Z' },
  { id: 'n-4', role: 'artist', title: 'Monthly financial report', message: 'This month’s reward calculations are ready to view.', link: '/artist/manage', isRead: true, createdAt: '2026-05-19T08:00:00Z' },
  { id: 'n-5', role: 'support', title: 'New ticket', message: 'A new support ticket has been submitted.', link: '/dashboard', isRead: false, createdAt: '2026-05-21T14:00:00Z' },
  { id: 'n-6', role: 'admin', title: 'Verification request', message: 'Silent Sepehr is waiting for verification review.', link: '/dashboard', isRead: false, createdAt: '2026-05-21T16:00:00Z' }
];

export const tickets: Ticket[] = [
  {
    id: 'TCK-1001',
    userName: 'User Silver',
    subject: 'Track download issue',
    status: 'open',
    createdAt: '2026-05-21T09:20:00Z',
    messages: [
      { from: 'user', body: 'The download button is not active for me despite my Silver subscription.', createdAt: '2026-05-21T09:20:00Z' },
      { from: 'support', body: 'The issue was checked. Please log out and log in again.', createdAt: '2026-05-21T09:40:00Z' }
    ]
  },
  {
    id: 'TCK-1002',
    userName: 'Listener Base',
    subject: 'Forgot password',
    status: 'answered',
    createdAt: '2026-05-18T11:10:00Z',
    messages: [{ from: 'user', body: 'I have not received the recovery link.', createdAt: '2026-05-18T11:10:00Z' }]
  }
];

export const auditRows: AuditRow[] = [
  { id: 'audit-1', artistId: 'artist-1', month: 'May 2026', uniqueListeners: 8420, streams: 21100, reward: 74200000, status: 'pending' },
  { id: 'audit-2', artistId: 'artist-2', month: 'May 2026', uniqueListeners: 4900, streams: 13200, reward: 45300000, status: 'paid' }
];

export const subscriptionPricing: SubscriptionPricing = {
  silver: 129000,
  gold: 249000
};
