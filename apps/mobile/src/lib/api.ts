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
