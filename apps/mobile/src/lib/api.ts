import { supabase } from './supabase';

export type Species = 'dog' | 'cat';
export type Sex = 'male' | 'female';
export type Size = 'small' | 'medium' | 'large';
export type PetStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'paused' | 'adopted';

export type Publisher = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  municipality_id: number | null;
  account_type: 'person' | 'foundation';
  foundation_name: string | null;
  verification_status: string;
  pets_count?: number;
};

export type Pet = {
  id: string;
  owner_id: string;
  species: Species;
  name: string;
  age_months: number;
  sex: Sex;
  size: Size;
  municipality_id: number;
  vaccinated: boolean;
  sterilized: boolean;
  dewormed: boolean;
  description: string | null;
  status: PetStatus;
  moderation_reason?: string | null;
  updated_at: string;
  photos: string[];
  publisher?: Publisher;
};

export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  whatsapp: string | null;
  municipality_id: number | null;
  plan: 'free' | 'pro';
  account_type: 'person' | 'foundation';
  foundation_name: string | null;
};

export type Municipality = { id: number; name: string };

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: { fieldErrors?: Record<string, string[]> },
  ) {
    super(message);
  }
}

const BASE = process.env.EXPO_PUBLIC_API_URL!;

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
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const e = json?.error ?? {};
    throw new ApiError(res.status, e.code ?? 'INTERNAL', e.message ?? 'Algo falló. Intenta de nuevo.', e.details);
  }
  return json as T;
}

// Signed upload: the API issues the URL, the file goes straight to Storage
export async function uploadSigned(path: string, token: string, base64: string) {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const { error } = await supabase.storage.from('pet-photos').uploadToSignedUrl(path, token, bytes, { contentType: 'image/jpeg' });
  if (error) throw new ApiError(0, 'UPLOAD_FAILED', 'No se subió la foto');
}

// Public URL → storage path (pets/{id}/{file}.jpg), needed to re-save existing photos
export const storagePath = (url: string) => decodeURIComponent(url.split('/object/public/pet-photos/')[1]?.split('?')[0] ?? '');
