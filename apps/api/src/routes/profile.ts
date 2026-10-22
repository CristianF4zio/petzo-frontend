import { Router } from 'express';
import { z } from 'zod';
import { PROFILE_COLUMNS, auth, fullName } from '../auth.js';
import { HttpError, check, parse } from '../http.js';
import { PHOTO_BUCKET, db, photoUrl } from '../supabase.js';

// Venezuelan mobile: 0412 123 4567 / +58 412-1234567 / +58 0412… → +584121234567
export const whatsapp = z
  .string()
  .transform((s) => s.replace(/[\s\-()]/g, '').replace(/^(\+?58)?0?/, ''))
  .pipe(z.string().regex(/^4\d{9}$/, 'Número venezolano inválido'))
  .transform((s) => `+58${s}`);

export const UpdateProfile = z
  .object({
    full_name: fullName,
    whatsapp,
    municipality_id: z.number().int().positive(),
  })
  .partial()
  .strict();

const avatarPath = (userId: string) => `avatars/${userId}.jpg`; // SPEC §15

export const router = Router();

router.get('/municipalities', async (_req, res) => {
  res.json(check(await db.from('municipalities').select('id, name, state').order('id')));
});

router.get('/me', auth, (req, res) => {
  res.json(req.user);
});

router.patch('/me', auth, async (req, res) => {
  const body = parse(UpdateProfile, req.body);
  const profile = check(await db.from('profiles').update(body).eq('id', req.user!.id).select(PROFILE_COLUMNS).single());
  res.json(profile);
});

// 1) get a signed URL and upload the image to it, 2) PUT /me/avatar to publish it
router.post('/me/avatar/upload-url', auth, async (req, res) => {
  const upload = check(await db.storage.from(PHOTO_BUCKET).createSignedUploadUrl(avatarPath(req.user!.id), { upsert: true }));
  res.json({ path: upload.path, signed_url: upload.signedUrl, token: upload.token });
});

router.put('/me/avatar', auth, async (req, res) => {
  const path = avatarPath(req.user!.id);
  const { data: uploaded } = await db.storage.from(PHOTO_BUCKET).exists(path);
  if (!uploaded) throw new HttpError(409, 'AVATAR_NOT_UPLOADED', 'Sube la imagen antes de guardarla');
  // Same path on every upload: the version param busts CDN and app caches
  const avatar_url = `${photoUrl(path)}?v=${Date.now()}`;
  const profile = check(await db.from('profiles').update({ avatar_url }).eq('id', req.user!.id).select(PROFILE_COLUMNS).single());
  res.json(profile);
});
