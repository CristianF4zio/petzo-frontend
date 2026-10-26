import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, saveSession, signOut, watchSession, type Municipality, type Pet, type Profile, type Session, type Tokens } from './api';
import { googleTokens } from './google';

type Ctx = {
  ready: boolean;
  session: Session | null;
  profile: Profile | null;
  municipalities: Municipality[];
  zoneName: (id?: number | null) => string;
  isComplete: boolean;
  refreshProfile: () => Promise<void>;
  favIds: Set<string>;
  toggleFav: (petId: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  // false when the user closed the browser
  signInWithGoogle: () => Promise<boolean>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<Ctx | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [favIds, setFavIds] = useState<Set<string>>(new Set());

  const refreshProfile = useCallback(async () => {
    const [me, favs] = await Promise.all([api<Profile>('/me'), api<Pet[]>('/me/favorites')]);
    setProfile(me);
    setFavIds(new Set(favs.map((p) => p.id)));
  }, []);

  useEffect(() => {
    api<Municipality[]>('/municipalities').then(setMunicipalities, () => {});
    watchSession((s) => {
      setSession(s);
      if (!s) setReady(true);
    });
  }, []);

  const signedIn = !!session;
  useEffect(() => {
    if (!signedIn) {
      setProfile(null);
      setFavIds(new Set());
      return;
    }
    // A failed /me (offline) still lets the app open; screens retry on their own
    refreshProfile()
      .catch(() => {})
      .finally(() => setReady(true));
  }, [signedIn, refreshProfile]);

  const toggleFav = useCallback(
    async (petId: string) => {
      const on = favIds.has(petId);
      setFavIds((s) => {
        const n = new Set(s);
        if (on) n.delete(petId);
        else n.add(petId);
        return n;
      });
      try {
        await api(`/favorites/${petId}`, { method: on ? 'DELETE' : 'POST' });
      } catch (e) {
        setFavIds((s) => {
          const n = new Set(s);
          if (on) n.add(petId);
          else n.delete(petId);
          return n;
        });
        throw e;
      }
    },
    [favIds],
  );

  const value = useMemo<Ctx>(
    () => ({
      ready,
      session,
      profile,
      municipalities,
      zoneName: (id) => municipalities.find((m) => m.id === id)?.name ?? '',
      isComplete: !!profile?.complete,
      // Also retries the zone list if it failed at startup
      refreshProfile: async () => {
        if (!municipalities.length) api<Municipality[]>('/municipalities').then(setMunicipalities, () => {});
        await refreshProfile();
      },
      favIds,
      toggleFav,
      signIn: async (email, password) => saveSession(await api<Tokens>('/auth/login', { method: 'POST', body: { email, password } })),
      register: async (fullName, email, password) => saveSession(await api<Tokens>('/auth/register', { method: 'POST', body: { email, password, fullName } })),
      signInWithGoogle: async () => {
        const t = await googleTokens();
        if (t) await saveSession(t);
        return !!t;
      },
      signOut,
    }),
    [ready, session, profile, municipalities, refreshProfile, favIds, toggleFav],
  );

  return <SessionContext value={value}>{children}</SessionContext>;
}

export function useSession() {
  const ctx = use(SessionContext);
  if (!ctx) throw new Error('useSession outside SessionProvider');
  return ctx;
}
