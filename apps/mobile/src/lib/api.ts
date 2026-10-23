import { Linking } from 'react-native';
import { supabase } from './supabase';

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

export type UploadUrl = { path: string; signedUrl: string; token: string };

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

const BASE = process.env.EXPO_PUBLIC_API_URL! + '/api';

export async function api<T = unknown>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  let res: Response;
  try {
    res = await fetch(BASE + path, {
      method: init.method ?? 'GET',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch {
    throw new ApiError(0, 'OFFLINE', 'Sin conexión. Revisa tus datos o el wifi.');
  }
  const text = await res.text();
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

// Signed upload: the API issues the URL, the file goes straight to Storage
export async function uploadSigned(path: string, token: string, base64: string) {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const { error } = await supabase.storage.from('pet-photos').uploadToSignedUrl(path, token, bytes, { contentType: 'image/jpeg' });
  if (error) throw new ApiError(0, 'UPLOAD_FAILED', 'No se subió la foto');
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
export async function openContact(requestId: string, message: (name: string | null) => string) {
  const c = await api<{ name: string | null; whatsapp: string | null }>(`/requests/${requestId}/contact`);
  if (!c.whatsapp) throw new ApiError(0, 'NO_WHATSAPP', 'Esta persona aún no registró su WhatsApp.');
  await Linking.openURL(`https://wa.me/${c.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message(c.name))}`);
}
