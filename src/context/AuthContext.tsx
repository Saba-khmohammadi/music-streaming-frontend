'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { defaultAvatar } from '@/data/mockData';
import { getCollection, getCurrentUserId, newId, setCollection, setCurrentUserId } from '@/lib/storage';
import type { Artist, SubscriptionTier, User, UserPreferences } from '@/types/domain';

interface RegisterListenerPayload {
  displayName: string;
  email: string;
  password: string;
  birthDate: string;
  gender: string;
  privacyAccepted: boolean;
}

interface RegisterArtistPayload {
  email: string;
  password: string;
  artistName: string;
  sampleWorks: string[];
}

interface AuthContextValue {
  currentUser: User | null;
  users: User[];
  artists: Artist[];
  isReady: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  registerListener: (payload: RegisterListenerPayload) => User;
  registerArtist: (payload: RegisterArtistPayload) => Artist;
  updateCurrentUser: (changes: Partial<User>) => void;
  updatePreferences: (changes: Partial<UserPreferences>) => void;
  changeSubscription: (tier: SubscriptionTier) => void;
  deleteCurrentAccount: () => void;
  refreshUsers: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const shouldUseEnglishDefault = (user: User) => user.role === 'artist' || user.role === 'support' || user.role === 'admin';

const normalizeUsers = (nextUsers: User[], nextArtists: Artist[]) => {
  let changed = false;
  const normalized = nextUsers.map((user) => {
    let normalizedUser = user;

    if (shouldUseEnglishDefault(normalizedUser) && normalizedUser.preferences.language !== 'en') {
      changed = true;
      normalizedUser = { ...normalizedUser, preferences: { ...normalizedUser.preferences, language: 'en' as const } };
    }

    if (normalizedUser.role === 'artist' && normalizedUser.artistId) {
      const linkedArtist = nextArtists.find((artist) => artist.id === normalizedUser.artistId);
      if (linkedArtist) {
        const nextFollowers = linkedArtist.followers;
        const nextVerifiedArtist = linkedArtist.verified;
        const nextAvatarUrl = normalizedUser.avatarUrl || linkedArtist.avatarUrl;

        if (
          normalizedUser.followers !== nextFollowers ||
          normalizedUser.verifiedArtist !== nextVerifiedArtist ||
          normalizedUser.avatarUrl !== nextAvatarUrl
        ) {
          changed = true;
          normalizedUser = {
            ...normalizedUser,
            followers: nextFollowers,
            verifiedArtist: nextVerifiedArtist,
            avatarUrl: nextAvatarUrl
          };
        }
      }
    }

    return normalizedUser;
  });

  if (changed) setCollection('users', normalized);
  return normalized;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [currentUserId, setCurrent] = useState<string | null>(null);
  const [isReady, setReady] = useState(false);

  const refreshUsers = useCallback(() => {
    const nextArtists = getCollection('artists');
    const nextUsers = normalizeUsers(getCollection('users'), nextArtists);
    setArtists(nextArtists);
    setUsers(nextUsers);
  }, []);

  useEffect(() => {
    refreshUsers();
    setCurrent(getCurrentUserId());
    setReady(true);
  }, [refreshUsers]);

  const persistUsers = useCallback((nextUsers: User[]) => {
    setUsers(nextUsers);
    setCollection('users', nextUsers);
  }, []);

  const persistArtists = useCallback((nextArtists: Artist[]) => {
    setArtists(nextArtists);
    setCollection('artists', nextArtists);
  }, []);

  useEffect(() => {
    const activeUser = users.find((item) => item.id === currentUserId);
    if (!activeUser || typeof document === 'undefined') return;
    document.documentElement.lang = activeUser.preferences.language;
    document.documentElement.dir = activeUser.preferences.language === 'fa' ? 'rtl' : 'ltr';
  }, [currentUserId, users]);

  const login = useCallback(
    (email: string, password: string) => {
      const user = users.find((item) => item.email.toLowerCase() === email.toLowerCase() && item.password === password);
      if (!user) return false;
      if (shouldUseEnglishDefault(user) && user.preferences.language !== 'en') {
        persistUsers(users.map((item) => item.id === user.id ? { ...item, preferences: { ...item.preferences, language: 'en' as const } } : item));
      }
      setCurrent(user.id);
      setCurrentUserId(user.id);
      return true;
    },
    [persistUsers, users]
  );

  const logout = useCallback(() => {
    setCurrent(null);
    setCurrentUserId(null);
  }, []);

  const registerListener = useCallback(
    (payload: RegisterListenerPayload) => {
      const user: User = {
        id: newId('user'),
        username: `user_${Math.floor(Math.random() * 9000 + 1000)}`,
        displayName: payload.displayName,
        email: payload.email,
        password: payload.password,
        role: 'listener',
        subscription: 'base',
        birthDate: payload.birthDate,
        gender: payload.gender,
        avatarUrl: defaultAvatar,
        followers: 0,
        following: 0,
        dailyStreams: 0,
        preferences: {
          notificationLimit: 20,
          systemSound: 'soft',
          language: 'en',
          privacyAccepted: payload.privacyAccepted
        }
      };
      persistUsers([...users, user]);
      setCurrent(user.id);
      setCurrentUserId(user.id);
      return user;
    },
    [persistUsers, users]
  );

  const registerArtist = useCallback(
    (payload: RegisterArtistPayload) => {
      const artist: Artist = {
        id: newId('artist'),
        name: payload.artistName,
        email: payload.email,
        bio: 'Artist account request is pending approval.',
        verified: false,
        status: 'pending',
        avatarUrl: defaultAvatar,
        followers: 0,
        monthlyListeners: 0,
        monthlyStreams: 0,
        sampleWorks: payload.sampleWorks
      };
      const user: User = {
        id: newId('user'),
        username: payload.artistName.replace(/\s+/g, '_').toLowerCase(),
        displayName: payload.artistName,
        email: payload.email,
        password: payload.password,
        role: 'artist',
        subscription: 'base',
        avatarUrl: defaultAvatar,
        followers: 0,
        following: 0,
        dailyStreams: 0,
        verifiedArtist: false,
        artistId: artist.id,
        preferences: { notificationLimit: 20, systemSound: 'soft', language: 'en', privacyAccepted: true }
      };
      persistArtists([...artists, artist]);
      persistUsers([...users, user]);
      setCurrent(user.id);
      setCurrentUserId(user.id);
      return artist;
    },
    [artists, persistArtists, persistUsers, users]
  );

  const updateCurrentUser = useCallback(
    (changes: Partial<User>) => {
      if (!currentUserId) return;
      const nextUsers = users.map((item) => (item.id === currentUserId ? { ...item, ...changes } : item));
      persistUsers(nextUsers);
    },
    [currentUserId, persistUsers, users]
  );

  const updatePreferences = useCallback(
    (changes: Partial<UserPreferences>) => {
      if (!currentUserId) return;
      const nextUsers = users.map((item) =>
        item.id === currentUserId ? { ...item, preferences: { ...item.preferences, ...changes } } : item
      );
      persistUsers(nextUsers);
    },
    [currentUserId, persistUsers, users]
  );

  const changeSubscription = useCallback(
    (tier: SubscriptionTier) => updateCurrentUser({ subscription: tier }),
    [updateCurrentUser]
  );

  const deleteCurrentAccount = useCallback(() => {
    if (!currentUserId) return;
    persistUsers(users.filter((item) => item.id !== currentUserId));
    logout();
  }, [currentUserId, logout, persistUsers, users]);

  const currentUser = useMemo(() => {
    const activeUser = users.find((item) => item.id === currentUserId) ?? null;
    if (!activeUser || activeUser.role !== 'artist' || !activeUser.artistId) return activeUser;

    const linkedArtist = artists.find((artist) => artist.id === activeUser.artistId);
    if (!linkedArtist) return activeUser;

    return {
      ...activeUser,
      followers: linkedArtist.followers,
      verifiedArtist: linkedArtist.verified,
      avatarUrl: activeUser.avatarUrl || linkedArtist.avatarUrl
    };
  }, [artists, currentUserId, users]);

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      users,
      artists,
      isReady,
      login,
      logout,
      registerListener,
      registerArtist,
      updateCurrentUser,
      updatePreferences,
      changeSubscription,
      deleteCurrentAccount,
      refreshUsers
    }),
    [artists, changeSubscription, currentUser, deleteCurrentAccount, isReady, login, logout, refreshUsers, registerArtist, registerListener, updateCurrentUser, updatePreferences, users]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
