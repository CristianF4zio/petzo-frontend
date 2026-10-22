import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { type Profile, auth, optionalAuth, requireAdmin, requireCompleteProfile } from '../auth.js';
import { HttpError, check, notFound, parse } from '../http.js';
import { PHOTO_BUCKET, db, photoUrl } from '../supabase.js';

const PAGE_SIZE = 20;
const MAX_PHOTOS = 5;
export const PLAN_LIMITS = { free: 3, pro: 30 } as const;

const MAX_STORED_FILES = MAX_PHOTOS * 2;

export const PUBLIC_PET_COLUMNS =
  'id, owner_id, species, name, age_months, sex, size, municipality_id, vaccinated, sterilized, dewormed, description, status, source, created_at, updated_at';
// Owner/admin only: moderation signals must not reach the public catalog
const PET_COLUMNS = `${PUBLIC_PET_COLUMNS}, moderation_reason, risk_score, source_url`;
// Public slice of the publisher: never whatsapp (RNF-04). !inner lets us hide suspended publishers.
const PUBLISHER_FIELDS = 'id, full_name, avatar_url, municipality_id, account_type, foundation_name, verification_status';
export const PUBLISHER = `publisher:profiles!owner_id!inner(${PUBLISHER_FIELDS})`;
export const PHOTOS = 'pet_photos(storage_path, position)';

const PetFields = z.object({
  species: z.enum(['dog', 'cat']),
  name: z.string().trim().min(1).max(60),
  age_months: z.number().int().min(0).max(360),
  sex: z.enum(['male', 'female']),
  size: z.enum(['small', 'medium', 'large']),
  municipality_id: z.number().int().positive(),
  vaccinated: z.boolean(),
  sterilized: z.boolean(),
  dewormed: z.boolean(),
  description: z.string().trim().max(1000),
});
export const CreatePet = PetFields.partial({ vaccinated: true, sterilized: true, dewormed: true, description: true }).strict();
export const UpdatePet = PetFields.partial()
  .strict()
  .refine((body) => Object.keys(body).length > 0, 'Sin cambios');

export const CatalogQuery = z.object({
  species: z.enum(['dog', 'cat']).optional(),
  // size=small or size=small,medium
  size: z
    .string()
    .transform((v) => v.split(','))
    .pipe(z.array(z.enum(['small', 'medium', 'large'])).max(3))
    .optional(),
  sex: z.enum(['male', 'female']).optional(),
  municipality_id: z.coerce.number().int().positive().optional(),
  min_age_months: z.coerce.number().int().min(0).optional(),
  max_age_months: z.coerce.number().int().min(0).optional(),
  page: z.coerce.number().int().min(1).default(1),
});

export const UploadUrlsBody = z.object({ count: z.number().int().min(1).max(MAX_PHOTOS) }).strict();
export const SetPhotosBody = z.object({ paths: z.array(z.string()).min(1).max(MAX_PHOTOS) }).strict();
export const StatusBody = z.object({ status: z.enum(['pending_review', 'paused', 'approved', 'adopted']) }).strict();

// Owner-driven transitions; moderation (approve/reject) belongs to n8n and admins.
// Only drafts are submitted: a rejected pet must be edited (→ draft) before it can spend AI again.
const TRANSITIONS: Record<string, string[]> = {
  pending_review: ['draft'], // submit
  paused: ['approved'],
  approved: ['paused'], // resume: paused content is unchanged, see statusAfterEdit
  adopted: ['approved', 'paused', 'pending_review'],
};
const COUNTS_FOR_LIMIT = ['pending_review', 'approved'];

// Any content change must be moderated again; a paused or rejected pet goes back to draft
// so the owner resubmits it through the plan limit and moderation.
// S4: moderation callbacks must only apply if pets.updated_at still matches what was evaluated.
function statusAfterEdit(status: string) {
  if (status === 'approved') return 'pending_review';
  if (status === 'paused' || status === 'rejected') return 'draft';
  return status;
}

type PetRow = Record<string, unknown> & { pet_photos?: { storage_path: string; position: number }[] };

export const withPhotos = ({ pet_photos = [], ...pet }: PetRow) => ({
  ...pet,
  photos: [...pet_photos].sort((a, b) => a.position - b.position).map((p) => photoUrl(p.storage_path)),
});

async function ownPet(id: string, user: Profile) {
  const pet = check(await db.from('pets').select(PET_COLUMNS).eq('id', id).maybeSingle());
  if (!pet || pet.owner_id !== user.id) throw notFound();
  return pet;
}

// shortcut: count-then-update can let two concurrent submits pass the limit; move into a DB function if abused
async function assertPlanLimit(user: Profile, exceptPetId: string) {
  const { count, error } = await db
    .from('pets')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', user.id)
    .in('status', COUNTS_FOR_LIMIT)
    .neq('id', exceptPetId);
  if (error) throw error;
  const limit = PLAN_LIMITS[user.plan];
  if ((count ?? 0) >= limit) {
    throw new HttpError(409, 'PLAN_LIMIT', `Tu plan permite ${limit} publicaciones activas`, { limit });
  }
}

export const router = Router();

router.get('/pets', async (req, res) => {
  const q = parse(CatalogQuery, req.query);
  let query = db
    .from('pets')
    .select(`${PUBLIC_PET_COLUMNS}, ${PHOTOS}, ${PUBLISHER}`, { count: 'exact' })
    .eq('status', 'approved')
    .eq('publisher.is_suspended', false);
  if (q.species) query = query.eq('species', q.species);
  if (q.size) query = query.in('size', q.size);
  if (q.sex) query = query.eq('sex', q.sex);
  if (q.municipality_id) query = query.eq('municipality_id', q.municipality_id);
  if (q.min_age_months !== undefined) query = query.gte('age_months', q.min_age_months);
  if (q.max_age_months !== undefined) query = query.lte('age_months', q.max_age_months);

  const from = (q.page - 1) * PAGE_SIZE;
  const { data, count, error } = await query.order('created_at', { ascending: false }).range(from, from + PAGE_SIZE - 1);
  // PostgREST answers 416 when the page is past the end
  if (error?.code === 'PGRST103') {
    res.json({ data: [], pagination: { page: q.page, page_size: PAGE_SIZE, total: count ?? 0 } });
    return;
  }
  if (error) throw error;
  res.json({ data: data.map(withPhotos), pagination: { page: q.page, page_size: PAGE_SIZE, total: count ?? 0 } });
});

router.get('/pets/:id', optionalAuth, async (req, res) => {
  const id = parse(z.uuid(), req.params.id);
  const pet = check(
    await db
      .from('pets')
      .select(`${PUBLIC_PET_COLUMNS}, ${PHOTOS}, publisher:profiles!owner_id!inner(is_suspended, ${PUBLISHER_FIELDS})`)
      .eq('id', id)
      .maybeSingle(),
  );
  if (!pet) throw notFound();
  // Many-to-one embed is an object at runtime; without generated DB types it is typed as an array
  const { is_suspended, ...publisher } = pet.publisher as unknown as { is_suspended: boolean };
  if (pet.owner_id !== req.user?.id && (pet.status !== 'approved' || is_suspended)) throw notFound();
  const { count } = await db
    .from('pets')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', pet.owner_id)
    .eq('status', 'approved');
  res.json(withPhotos({ ...pet, publisher: { ...publisher, pets_count: count ?? 0 } }));
});

// Only drafts can be deleted; anything that was public keeps its history (pause or adopt instead)
router.delete('/pets/:id', auth, async (req, res) => {
  const pet = await ownPet(parse(z.uuid(), req.params.id), req.user!);
  if (pet.status !== 'draft') throw new HttpError(409, 'INVALID_STATUS', 'Solo se pueden eliminar borradores');
  const bucket = db.storage.from(PHOTO_BUCKET);
  const files = check(await bucket.list(`pets/${pet.id}`, { limit: 100 })).map((f) => `pets/${pet.id}/${f.name}`);
  check(await db.from('pets').delete().eq('id', pet.id));
  if (files.length) await bucket.remove(files);
  res.status(204).end();
});

export const ReportBody = z.object({ reason: z.string().trim().min(3).max(500) }).strict();

router.post('/pets/:id/reports', auth, async (req, res) => {
  const id = parse(z.uuid(), req.params.id);
  const { reason } = parse(ReportBody, req.body);
  const pet = check(await db.from('pets').select('id, status').eq('id', id).maybeSingle());
  if (!pet || pet.status !== 'approved') throw notFound();
  check(await db.from('reports').insert({ pet_id: id, reporter_id: req.user!.id, reason }));
  res.status(201).json({ ok: true });
});

router.get('/me/pets', auth, async (req, res) => {
  const pets = check(
    await db.from('pets').select(`${PET_COLUMNS}, ${PHOTOS}`).eq('owner_id', req.user!.id).order('created_at', { ascending: false }),
  );
  res.json(pets.map(withPhotos));
});

router.post('/pets', auth, async (req, res) => {
  requireCompleteProfile(req.user!);
  const body = parse(CreatePet, req.body);
  const pet = check(
    await db.from('pets').insert({ ...body, owner_id: req.user!.id, status: 'draft', source: 'app' }).select(PET_COLUMNS).single(),
  );
  res.status(201).json({ ...pet, photos: [] });
});

router.patch('/pets/:id', auth, async (req, res) => {
  const pet = await ownPet(parse(z.uuid(), req.params.id), req.user!);
  const body = parse(UpdatePet, req.body);
  if (pet.status === 'adopted') throw new HttpError(409, 'INVALID_STATUS', 'La mascota ya fue adoptada');
  const updated = check(
    await db
      .from('pets')
      .update({ ...body, status: statusAfterEdit(pet.status), moderation_reason: null, risk_score: null })
      .eq('id', pet.id)
      .select(PET_COLUMNS)
      .single(),
  );
  res.json(updated);
});

router.post('/pets/:id/photos/upload-urls', auth, async (req, res) => {
  const pet = await ownPet(parse(z.uuid(), req.params.id), req.user!);
  const { count } = parse(UploadUrlsBody, req.body);
  const bucket = db.storage.from(PHOTO_BUCKET);
  // Over the cap, drop uploads never saved with PUT /photos (abandoned or superseded), keeping the saved set.
  // shortcut: only uploaded files are counted, so many URLs requested before uploading slip through; use fixed slot names if abused
  const folder = `pets/${pet.id}`;
  const stored = check(await bucket.list(folder, { limit: 100 })).map((f) => `${folder}/${f.name}`);
  if (stored.length + count > MAX_STORED_FILES) {
    const saved = check(await db.from('pet_photos').select('storage_path').eq('pet_id', pet.id)).map((p) => p.storage_path);
    const orphans = stored.filter((p) => !saved.includes(p));
    if (orphans.length) check(await bucket.remove(orphans));
  }
  const uploads = await Promise.all(
    Array.from({ length: count }, async () => {
      const u = check(await bucket.createSignedUploadUrl(`pets/${pet.id}/${randomUUID()}.jpg`));
      return { path: u.path, signed_url: u.signedUrl, token: u.token };
    }),
  );
  res.json(uploads);
});

// Replaces the photo set; order of `paths` is display order
router.put('/pets/:id/photos', auth, async (req, res) => {
  const pet = await ownPet(parse(z.uuid(), req.params.id), req.user!);
  const { paths } = parse(SetPhotosBody, req.body);
  if (pet.status === 'adopted') throw new HttpError(409, 'INVALID_STATUS', 'La mascota ya fue adoptada');

  const folder = `pets/${pet.id}`;
  const stored = check(await db.storage.from(PHOTO_BUCKET).list(folder, { limit: 100 })).map((f) => `${folder}/${f.name}`);
  if (new Set(paths).size !== paths.length || paths.some((p) => !stored.includes(p))) {
    throw new HttpError(422, 'INVALID_PHOTOS', 'Fotos inválidas o no subidas');
  }

  // Insert the new set before deleting the old one, so a failure never leaves the pet without photos
  const inserted = check(
    await db
      .from('pet_photos')
      .insert(paths.map((storage_path, position) => ({ pet_id: pet.id, storage_path, position })))
      .select('id'),
  );
  check(await db.from('pet_photos').delete().eq('pet_id', pet.id).not('id', 'in', `(${inserted.map((p) => p.id).join(',')})`));
  const orphans = stored.filter((p) => !paths.includes(p));
  if (orphans.length) await db.storage.from(PHOTO_BUCKET).remove(orphans);
  check(
    await db
      .from('pets')
      .update({ status: statusAfterEdit(pet.status), moderation_reason: null, risk_score: null })
      .eq('id', pet.id),
  );

  res.json({ photos: paths.map(photoUrl) });
});

router.patch('/pets/:id/status', auth, async (req, res) => {
  const pet = await ownPet(parse(z.uuid(), req.params.id), req.user!);
  const { status } = parse(StatusBody, req.body);
  if (!TRANSITIONS[status]?.includes(pet.status)) {
    throw new HttpError(409, 'INVALID_STATUS', `No se puede pasar de ${pet.status} a ${status}`);
  }

  if (status === 'pending_review') {
    requireCompleteProfile(req.user!);
    const { count, error } = await db.from('pet_photos').select('id', { count: 'exact', head: true }).eq('pet_id', pet.id);
    if (error) throw error;
    if (!count) throw new HttpError(409, 'PHOTOS_REQUIRED', 'Agrega entre 1 y 5 fotos');
  }
  if (COUNTS_FOR_LIMIT.includes(status)) await assertPlanLimit(req.user!, pet.id);

  const patch = status === 'pending_review' ? { status, moderation_reason: null, risk_score: null } : { status };
  const updated = check(await db.from('pets').update(patch).eq('id', pet.id).select(PET_COLUMNS).single());
  // S4: on pending_review, notify n8n moderation webhook here
  res.json(updated);
});

router.get('/admin/pets', auth, requireAdmin, async (req, res) => {
  const status = parse(z.enum(['draft', 'pending_review', 'approved', 'rejected', 'paused', 'adopted']).default('pending_review'), req.query.status);
  const pets = check(
    await db.from('pets').select(`${PET_COLUMNS}, ${PHOTOS}, ${PUBLISHER}`).eq('status', status).order('created_at').limit(100),
  );
  res.json(pets.map(withPhotos));
});
