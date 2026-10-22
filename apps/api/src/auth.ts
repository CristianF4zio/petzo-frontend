import type { RequestHandler } from 'express';
import { z } from 'zod';
import { HttpError, check } from './http.js';
import { db } from './supabase.js';

export const fullName = z.string().trim().min(2).max(80);
const metaName = fullName.nullable().catch(null);
const metaAvatar = z.url({ protocol: /^https$/ }).max(500).nullable().catch(null);

export const PROFILE_COLUMNS =
  'id, full_name, avatar_url, whatsapp, municipality_id, role, account_type, foundation_name, foundation_instagram, foundation_bio, verification_status, plan, is_suspended, created_at, updated_at';

export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  whatsapp: string | null;
  municipality_id: number | null;
  role: 'user' | 'admin';
  plan: 'free' | 'pro';
  is_suspended: boolean;
  [key: string]: unknown;
};

declare global {
  namespace Express {
    interface Request {
      user?: Profile;
    }
  }
}

async function resolveUser(header: string | undefined): Promise<Profile | undefined> {
  const token = header?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return undefined;

  // Verifies signature against the project JWKS (ES256) or the Auth server (HS256)
  const { data, error } = await db.auth.getClaims(token);
  const claims = data?.claims;
  if (error || !claims?.sub || claims.role !== 'authenticated' || claims.is_anonymous) {
    throw new HttpError(401, 'INVALID_TOKEN', 'Sesión inválida o expirada');
  }
  const { sub, user_metadata: meta = {} } = claims;

  const existing = check(await db.from('profiles').select(PROFILE_COLUMNS).eq('id', sub).maybeSingle());
  if (existing) return existing as Profile;

  // First request after sign-up: the API owns profile creation (writes only via API).
  // user_metadata is user-editable, so it gets the same checks as PATCH /me.
  const created = await db
    .from('profiles')
    .upsert(
      {
        id: sub,
        full_name: metaName.parse(meta.full_name ?? meta.name),
        avatar_url: metaAvatar.parse(meta.avatar_url ?? meta.picture),
      },
      { onConflict: 'id', ignoreDuplicates: true },
    )
    .select(PROFILE_COLUMNS)
    .maybeSingle();
  // FK to auth.users fails when the user was deleted but the token has not expired yet
  if (created.error?.code === '23503') throw new HttpError(401, 'INVALID_TOKEN', 'Sesión inválida o expirada');
  return (check(created) ?? check(await db.from('profiles').select(PROFILE_COLUMNS).eq('id', sub).single())) as Profile;
}

export const optionalAuth: RequestHandler = async (req, _res, next) => {
  req.user = await resolveUser(req.headers.authorization);
  next();
};

export const auth: RequestHandler = async (req, _res, next) => {
  const user = await resolveUser(req.headers.authorization);
  if (!user) throw new HttpError(401, 'UNAUTHENTICATED', 'Inicia sesión para continuar');
  if (user.is_suspended) throw new HttpError(403, 'SUSPENDED', 'Tu cuenta está suspendida');
  req.user = user;
  next();
};

export const requireAdmin: RequestHandler = (req, _res, next) => {
  if (req.user?.role !== 'admin') throw new HttpError(403, 'FORBIDDEN', 'Solo administradores');
  next();
};

export function requireCompleteProfile(user: Profile) {
  if (!user.whatsapp || !user.municipality_id) {
    throw new HttpError(409, 'PROFILE_INCOMPLETE', 'Completa tu zona y WhatsApp para continuar');
  }
}
