import { Router } from 'express';
import { z } from 'zod';
import { auth } from '../auth.js';
import { check, notFound, parse } from '../http.js';
import { db } from '../supabase.js';
import { PHOTOS, PUBLIC_PET_COLUMNS, PUBLISHER, withPhotos } from './pets.js';

export const router = Router();

// Only pets still visible in the catalog are returned; adopted or hidden ones drop out silently
router.get('/me/favorites', auth, async (req, res) => {
  const ids = check(await db.from('favorites').select('pet_id').eq('user_id', req.user!.id)).map((f) => f.pet_id);
  if (!ids.length) {
    res.json([]);
    return;
  }
  const pets = check(
    await db
      .from('pets')
      .select(`${PUBLIC_PET_COLUMNS}, ${PHOTOS}, ${PUBLISHER}`)
      .in('id', ids)
      .eq('status', 'approved')
      .eq('publisher.is_suspended', false),
  );
  res.json(pets.map(withPhotos));
});

router.put('/me/favorites/:petId', auth, async (req, res) => {
  const petId = parse(z.uuid(), req.params.petId);
  const pet = check(await db.from('pets').select('id').eq('id', petId).eq('status', 'approved').maybeSingle());
  if (!pet) throw notFound();
  check(await db.from('favorites').upsert({ user_id: req.user!.id, pet_id: petId }, { ignoreDuplicates: true }));
  res.status(204).end();
});

router.delete('/me/favorites/:petId', auth, async (req, res) => {
  const petId = parse(z.uuid(), req.params.petId);
  check(await db.from('favorites').delete().eq('user_id', req.user!.id).eq('pet_id', petId));
  res.status(204).end();
});
