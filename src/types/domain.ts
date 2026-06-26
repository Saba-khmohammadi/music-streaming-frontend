export type UserRole = 'listener' | 'artist' | 'support' | 'admin';
export type SubscriptionTier = 'base' | 'silver' | 'gold';
export type VerificationStatus = 'pending' | 'approved' | 'rejected';
export type RepeatMode = 'off' | 'all' | 'one';
export type TicketStatus = 'open' | 'answered' | 'closed';
export type NotificationRole = UserRole | 'all';

export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  password: string;
  role: UserRole;
  subscription: SubscriptionTier;
  birthDate?: string;
  gender?: string;
  avatarUrl?: string;
  followers: number;
  following: number;
  followedArtistIds?: string[];
  dailyStreams: number;
  verifiedArtist?: boolean;
  artistId?: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  notificationLimit: number;
  systemSound: 'soft' | 'classic' | 'off';
  language: 'fa' | 'en';
  privacyAccepted: boolean;
}

export interface Artist {
  id: string;
  name: string;
  email: string;
  bio: string;
  verified: boolean;
  status: VerificationStatus;
  avatarUrl: string;
  followers: number;
  monthlyListeners: number;
  monthlyStreams: number;
  sampleWorks: string[];
  rejectionReason?: string;
}

export interface Album {
  id: string;
  title: string;
  artistId: string;
  coverUrl: string;
  releaseDate: string;
  isEarlyAccess?: boolean;
  genre: string;
  trackIds: string[];
  type: 'album' | 'single';
}

export interface Track {
  id: string;
  title: string;
  artistId: string;
  albumId?: string;
  coverUrl: string;
  duration: number;
  releaseDate: string;
  listeners: number;
  streams: number;
  lyrics?: string;
  isEarlyAccess?: boolean;
  genre: string;
  collaborators?: string[];
  audioUrl?: string;
}

export interface Playlist {
  id: string;
  ownerId: string;
  title: string;
  coverUrl: string;
  trackIds: string[];
  updatedAt: string;
}

export interface AppNotification {
  id: string;
  role: NotificationRole;
  userId?: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface Ticket {
  id: string;
  userName: string;
  subject: string;
  status: TicketStatus;
  createdAt: string;
  messages: Array<{ from: 'user' | 'support'; body: string; createdAt: string }>;
}

export interface AuditRow {
  id: string;
  artistId: string;
  month: string;
  uniqueListeners: number;
  streams: number;
  reward: number;
  status: 'pending' | 'paid';
}

export interface SubscriptionPricing {
  silver: number;
  gold: number;
}

export interface PlayerState {
  currentTrackId?: string;
  queue: string[];
  isPlaying: boolean;
  volume: number;
  progress: number;
  repeatMode: RepeatMode;
  shuffle: boolean;
}
