import * as SecureStore from 'expo-secure-store';
import { Linking } from 'react-native';

export type Species = 'dog' | 'cat';
export type Sex = 'male' | 'female';
export type Size = 'small' | 'medium' | 'large';
export type PetStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'paused' | 'adopted';

export type Publisher = {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  municipalityId: number | null;
  foundation: boolean;
  verified: boolean;
  petsCount: number | null;
};

export type Photo = { id: string; url: string; path: string };

export type Pet = {
  id: string;
  species: Species;
  name: string;
  ageMonths: number;
  sex: Sex;
  size: Size;
  municipalityId: number;
  vaccinated: boolean;
  sterilized: boolean;
  dewormed: boolean;
  description: string | null;
  status: PetStatus;
  version: number;
  photos: Photo[];
  publisher: Publisher;
  moderationReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Profile = {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
  whatsapp: string | null;
  municipalityId: number | null;
  plan: 'free' | 'pro';
  accountType: 'person' | 'foundation';
  foundationName: string | null;
  verificationStatus: 'none' | 'pending' | 'verified' | 'rejected';
  complete: boolean;
};

export type Municipality = { id: number; name: string };

export type Page<T> = { items: T[]; page: number; pageSize: number; total: number };

// What /auth/* returns; stored with an absolute expiry
export type Tokens = { accessToken: string; refreshToken: string; expiresIn: number };
export type Session = { accessToken: string; refreshToken: string; expiresAt: number };

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields?: Record<string, string>,
  ) {
    super(message);
  }
}

if (!process.env.EXPO_PUBLIC_API_URL) throw Error('Falta EXPO_PUBLIC_API_URL en apps/mobile/.env');
export const BASE = process.env.EXPO_PUBLIC_API_URL + '/api';

const KEY = 'session';
let session: Session | null = null;
let onChange: (s: Session | null) => void = () => {};
let refreshing: Promise<Session | null> | null = null;

// Restores the stored session, then reports every change (sign in, refresh, sign out)
export async function watchSession(listener: (s: Session | null) => void) {
  onChange = listener;
  try {
    session = JSON.parse((await SecureStore.getItemAsync(KEY)) ?? 'null');
  } catch {
    session = null;
  }
  listener(session);
}

export async function saveSession(t: Tokens | null) {
  session = t && { accessToken: t.accessToken, refreshToken: t.refreshToken, expiresAt: Date.now() + t.expiresIn * 1000 };
  onChange(session);
  if (session) await SecureStore.setItemAsync(KEY, JSON.stringify(session));
  else await SecureStore.deleteItemAsync(KEY);
}

// One refresh at a time: parallel 401s share it. Only a rejected refresh token signs out; offline keeps the session.
function refresh() {
  refreshing ??= (async () => {
    const sent = session!.refreshToken;
    try {
      const t = await send<Tokens>('/auth/refresh', { method: 'POST', body: { refreshToken: sent } });
      // Signed out (or in again) while refreshing: don't bring the old session back
      if (session?.refreshToken === sent) await saveSession(t);
    } catch (e) {
      if (e instanceof ApiError && e.status >= 400 && e.status < 500 && session?.refreshToken === sent) await saveSession(null);
    } finally {
      refreshing = null;
    }
    return session;
  })();
  return refreshing;
}

export async function api<T = unknown>(path: string, init: Init = {}): Promise<T> {
  if (session && session.expiresAt - Date.now() < 60000) await refresh();
  const token = session?.accessToken;
  try {
    return await send<T>(path, init, token);
  } catch (e) {
    if (!(e instanceof ApiError) || e.status !== 401 || !token) throw e;
    // Another call may have refreshed already
    const s = session?.accessToken !== token ? session : await refresh();
    if (!s) throw e;
    return send<T>(path, init, s.accessToken);
  }
}

// Multipart upload of a local JPEG; only the API talks to Storage
export function upload<T>(path: string, uri: string) {
  const body = new FormData();
  body.append('file', { uri, name: 'photo.jpg', type: 'image/jpeg' } as unknown as Blob);
  return api<T>(path, { method: 'POST', body });
}

export async function signOut() {
  const token = session?.accessToken;
  await saveSession(null);
  // Best effort: the local session is gone even if the API can't be reached
  if (token) send('/auth/logout', { method: 'POST' }, token).catch(() => {});
}

type Init = { method?: string; body?: unknown };

async function send<T>(path: string, init: Init, token?: string): Promise<T> {
  const form = init.body instanceof FormData;
  let res: Response;
  let text: string;
  // A stalled request would otherwise hang forever; the abort surfaces as OFFLINE
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 20000);
  try {
    res = await fetch(BASE + path, {
      method: init.method ?? 'GET',
      // FormData: fetch sets the multipart boundary itself
      headers: { ...(form ? {} : { 'Content-Type': 'application/json' }), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: init.body === undefined ? undefined : form ? (init.body as FormData) : JSON.stringify(init.body),
      signal: c.signal,
    });
    text = await res.text();
  } catch {
    throw new ApiError(0, 'OFFLINE', 'Sin conexión. Revisa tus datos o el wifi.');
  } finally {
    clearTimeout(t);
  }
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // non-JSON body (proxy error page, cold start); fall through to the generic error
  }
  if (!res.ok) {
    // Spring ProblemDetail: { code, detail, fields? }
    throw new ApiError(res.status, json?.code ?? 'INTERNAL', json?.detail ?? 'Algo falló. Intenta de nuevo.', json?.fields);
  }
  return json as T;
}

export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn';

// GET /me/requests (adopter side)
export type MyRequest = { id: string; status: RequestStatus; petId: string; petName: string; petPhoto: string | null; createdAt: string; decidedAt: string | null };

// GET /pets/{id}/requests (publisher side); aiSummary/aiScore stay null if the AI failed (HU-08)
export type AdoptionRequest = {
  id: string;
  petId: string;
  status: RequestStatus;
  adopter: { id: string; name: string | null; avatarUrl: string | null; municipalityId: number | null };
  answers: Record<string, unknown> | null;
  motivation: string;
  aiSummary: string | null;
  aiScore: number | null;
  createdAt: string;
  decidedAt: string | null;
};

export type Lifestyle = { housing: 'casa' | 'apartamento' | 'otro'; timeAtHome: 'poco' | 'medio' | 'mucho'; kids: boolean; otherPets: boolean; experience: 'ninguna' | 'algo' | 'mucha' };

// RNF-04: the other side's WhatsApp only comes back for an approved request; opens wa.me with a prefilled message
export async function openContact(requestId: string, petName: string, approved: 'aprobaron mi solicitud' | 'aprobé tu solicitud') {
  const c = await api<{ name: string | null; whatsapp: string | null }>(`/requests/${requestId}/contact`);
  if (!c.whatsapp) throw new ApiError(0, 'NO_WHATSAPP', 'Esta persona aún no registró su WhatsApp.');
  const message = `Hola${c.name ? ` ${c.name}` : ''}, ${approved} en Petzo para adoptar a ${petName}.`;
  await Linking.openURL(`https://wa.me/${c.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`);
}
