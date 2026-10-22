import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const env = z
  .object({
    SUPABASE_URL: z.url(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  })
  .parse(process.env);

// service_role bypasses RLS: the API is the only writer (SPEC §15)
export const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export const PHOTO_BUCKET = 'pet-photos';

export const photoUrl = (path: string) => db.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
