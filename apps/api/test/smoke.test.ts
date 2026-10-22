// End-to-end smoke test against the local Supabase stack (`npx supabase start` from the repo root).
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import type { AddressInfo } from 'node:net';
import { after, before, test } from 'node:test';
import { createClient } from '@supabase/supabase-js';

const local = JSON.parse(execSync('npx supabase status -o json', { cwd: '../..', stdio: ['ignore', 'pipe', 'ignore'] }).toString());
process.env.SUPABASE_URL = local.API_URL;
process.env.SUPABASE_SERVICE_ROLE_KEY = local.SECRET_KEY;

const { app } = await import('../src/app.js');
const { db } = await import('../src/supabase.js');

let base = '';
const server = app.listen(0);
const users: string[] = [];
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);

async function api(method: string, path: string, token?: string, body?: unknown) {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text(); // 204 has no body
  return { status: res.status, body: (text ? JSON.parse(text) : null) as any };
}

async function signUp(name: string) {
  const email = `smoke-${name}-${Date.now()}@petzo.test`;
  const created = await db.auth.admin.createUser({ email, password: 'smoke-pass-123', email_confirm: true, user_metadata: { full_name: name } });
  assert.ifError(created.error);
  users.push(created.data.user!.id);
  const client = createClient(local.API_URL, local.PUBLISHABLE_KEY, { auth: { persistSession: false } });
  const session = await client.auth.signInWithPassword({ email, password: 'smoke-pass-123' });
  assert.ifError(session.error);
  return { id: created.data.user!.id, token: session.data.session!.access_token, client };
}

const PET = { species: 'dog', name: 'Toby', age_months: 14, sex: 'male', size: 'medium', municipality_id: 2, vaccinated: true };

async function withPhotos(user: Awaited<ReturnType<typeof signUp>>, petId: string, count = 1) {
  const urls = await api('POST', `/pets/${petId}/photos/upload-urls`, user.token, { count });
  assert.equal(urls.status, 200);
  for (const u of urls.body) {
    const up = await user.client.storage.from('pet-photos').uploadToSignedUrl(u.path, u.token, JPEG, { contentType: 'image/jpeg' });
    assert.ifError(up.error);
  }
  return urls.body.map((u: { path: string }) => u.path) as string[];
}

async function publish(user: Awaited<ReturnType<typeof signUp>>, name: string) {
  const pet = await api('POST', '/pets', user.token, { ...PET, name });
  assert.equal(pet.status, 201);
  const paths = await withPhotos(user, pet.body.id);
  assert.equal((await api('PUT', `/pets/${pet.body.id}/photos`, user.token, { paths })).status, 200);
  return { id: pet.body.id as string, submit: () => api('PATCH', `/pets/${pet.body.id}/status`, user.token, { status: 'pending_review' }) };
}

before(() => {
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(async () => {
  const bucket = db.storage.from('pet-photos');
  const files = users.map((id) => `avatars/${id}.jpg`);
  const { data: pets } = await db.from('pets').select('id').in('owner_id', users);
  for (const { id } of pets ?? []) {
    const { data } = await bucket.list(`pets/${id}`);
    files.push(...(data ?? []).map((f) => `pets/${id}/${f.name}`));
  }
  await bucket.remove(files);
  for (const id of users) await db.auth.admin.deleteUser(id);
  server.close();
});

test('API core flow (HU-02, 03, 05, 10)', async (t) => {
  const owner = await signUp('owner');
  const other = await signUp('other');

  await t.test('public endpoints', async () => {
    assert.deepEqual((await api('GET', '/health')).body, { ok: true });
    assert.equal((await api('GET', '/municipalities')).body.length, 11);
    assert.equal((await api('GET', '/nope')).body.error.code, 'NOT_FOUND');
    assert.equal((await api('PATCH', '/me', undefined, 'x'.repeat(200_000))).status, 413);
  });

  await t.test('auth and lazy profile creation', async () => {
    assert.equal((await api('GET', '/me')).status, 401);
    assert.equal((await api('GET', '/me', 'not-a-jwt')).status, 401);
    const me = await api('GET', '/me', owner.token);
    assert.equal(me.status, 200);
    assert.equal(me.body.full_name, 'owner');
    assert.equal(me.body.plan, 'free');
  });

  await t.test('HU-02: incomplete profile cannot publish; whatsapp is validated and normalized', async () => {
    assert.equal((await api('POST', '/pets', owner.token, PET)).body.error.code, 'PROFILE_INCOMPLETE');
    assert.equal((await api('PATCH', '/me', owner.token, { whatsapp: '12345' })).status, 422);
    assert.equal((await api('PATCH', '/me', owner.token, { role: 'admin' })).status, 422);
    assert.equal((await api('PATCH', '/me', owner.token, { avatar_url: 'https://evil.example/p.gif' })).status, 422);
    assert.equal((await api('PATCH', '/me', owner.token, { municipality_id: 999 })).body.error.code, 'INVALID_REFERENCE');
    const me = await api('PATCH', '/me', owner.token, { whatsapp: '0412-123 4567', municipality_id: 2 });
    assert.equal(me.status, 200);
    assert.equal(me.body.whatsapp, '+584121234567');
    const other58 = await api('PATCH', '/me', other.token, { whatsapp: '+58 0414 7654321', municipality_id: 3 });
    assert.equal(other58.body.whatsapp, '+584147654321');
  });

  await t.test('avatar goes to avatars/{user_id}.jpg and is set by the API', async () => {
    assert.equal((await api('PUT', '/me/avatar', owner.token)).body.error.code, 'AVATAR_NOT_UPLOADED');
    const url = await api('POST', '/me/avatar/upload-url', owner.token);
    assert.equal(url.body.path, `avatars/${owner.id}.jpg`);
    const up = await owner.client.storage.from('pet-photos').uploadToSignedUrl(url.body.path, url.body.token, JPEG, { contentType: 'image/jpeg' });
    assert.ifError(up.error);
    const me = await api('PUT', '/me/avatar', owner.token);
    assert.match(me.body.avatar_url, new RegExp(`/avatars/${owner.id}\\.jpg\\?v=\\d+$`));
  });

  let first = '';
  await t.test('HU-03: draft → photos → submit', async () => {
    assert.equal((await api('POST', '/pets', owner.token, { ...PET, species: 'cow' })).status, 422);
    assert.equal((await api('POST', '/pets', owner.token, { ...PET, municipality_id: 999 })).body.error.code, 'INVALID_REFERENCE');
    const pet = await api('POST', '/pets', owner.token, PET);
    assert.equal(pet.status, 201);
    assert.equal(pet.body.status, 'draft');
    first = pet.body.id;

    const submit = () => api('PATCH', `/pets/${first}/status`, owner.token, { status: 'pending_review' });
    assert.equal((await submit()).body.error.code, 'PHOTOS_REQUIRED');

    assert.equal((await api('POST', `/pets/${first}/photos/upload-urls`, owner.token, { count: 6 })).status, 422);
    const paths = await withPhotos(owner, first, 2);
    assert.equal((await api('PUT', `/pets/${first}/photos`, owner.token, { paths: [`pets/${first}/fake.jpg`] })).status, 422);
    assert.equal((await api('PUT', `/pets/${first}/photos`, other.token, { paths })).status, 404);
    const set = await api('PUT', `/pets/${first}/photos`, owner.token, { paths: paths.reverse() });
    assert.equal(set.body.photos.length, 2);

    assert.equal((await submit()).body.status, 'pending_review');
    assert.equal((await submit()).body.error.code, 'INVALID_STATUS');
  });

  await t.test('HU-05: catalog shows only approved, filters, hides whatsapp', async () => {
    assert.equal((await api('GET', `/pets/${first}`, other.token)).status, 404);
    assert.equal((await api('GET', `/pets/${first}`, owner.token)).status, 200);

    await db.from('pets').update({ status: 'approved' }).eq('id', first); // stands in for moderation (S4)
    const catalog = await api('GET', '/pets?species=dog&municipality_id=2&min_age_months=12');
    const listed = catalog.body.data.find((p: { id: string }) => p.id === first);
    assert.ok(listed);
    assert.equal(listed.photos.length, 2);
    assert.equal(listed.publisher.full_name, 'owner');
    assert.equal(listed.publisher.whatsapp, undefined);
    assert.ok(!('risk_score' in listed) && !('moderation_reason' in listed) && !('source_url' in listed));
    assert.ok(!('risk_score' in (await api('GET', `/pets/${first}`)).body));
    assert.equal(catalog.body.pagination.page_size, 20);
    assert.ok(!(await api('GET', '/pets?species=cat')).body.data.some((p: { id: string }) => p.id === first));
    assert.deepEqual((await api('GET', '/pets?page=999')).body.data, []);
    assert.equal((await api('GET', '/pets?size=huge')).status, 422);
  });

  await t.test('favorites, reports, publisher count and draft deletion', async () => {
    const detail = await api('GET', `/pets/${first}`);
    assert.equal(detail.body.dewormed, false);
    assert.equal(detail.body.publisher.pets_count, 1);

    assert.equal((await api('PUT', `/me/favorites/${first}`, other.token)).status, 204);
    assert.equal((await api('PUT', `/me/favorites/${first}`, other.token)).status, 204); // idempotent
    assert.deepEqual((await api('GET', '/me/favorites', other.token)).body.map((p: { id: string }) => p.id), [first]);
    assert.equal((await api('DELETE', `/me/favorites/${first}`, other.token)).status, 204);
    assert.deepEqual((await api('GET', '/me/favorites', other.token)).body, []);

    assert.equal((await api('POST', `/pets/${first}/reports`, other.token, { reason: 'x' })).status, 422);
    assert.equal((await api('POST', `/pets/${first}/reports`, other.token, { reason: 'Fotos de internet' })).status, 201);

    const draft = await api('POST', '/pets', owner.token, { ...PET, name: 'Borrador', dewormed: true });
    assert.equal(draft.body.dewormed, true);
    assert.equal((await api('PUT', `/me/favorites/${draft.body.id}`, other.token)).status, 404);
    assert.equal((await api('POST', `/pets/${draft.body.id}/reports`, other.token, { reason: 'Fotos de internet' })).status, 404);
    await withPhotos(owner, draft.body.id);
    assert.equal((await api('DELETE', `/pets/${draft.body.id}`, other.token)).status, 404);
    assert.equal((await api('DELETE', `/pets/${draft.body.id}`, owner.token)).status, 204);
    const { data: left } = await db.storage.from('pet-photos').list(`pets/${draft.body.id}`);
    assert.equal(left!.length, 0);
    assert.equal((await api('DELETE', `/pets/${first}`, owner.token)).body.error.code, 'INVALID_STATUS');
  });

  let second = { id: '', submit: async () => ({}) as Awaited<ReturnType<typeof api>> };
  await t.test('RF-07 plan limit and HU-10 adopted frees a slot', async () => {
    second = await publish(owner, 'Luna');
    const third = await publish(owner, 'Max');
    const fourth = await publish(owner, 'Kira');
    assert.equal((await second.submit()).status, 200);
    assert.equal((await third.submit()).status, 200);
    const blocked = await fourth.submit();
    assert.equal(blocked.status, 409);
    assert.equal(blocked.body.error.code, 'PLAN_LIMIT');

    assert.equal((await api('PATCH', `/pets/${first}/status`, owner.token, { status: 'adopted' })).body.status, 'adopted');
    assert.ok(!(await api('GET', '/pets')).body.data.some((p: { id: string }) => p.id === first));
    assert.equal((await fourth.submit()).status, 200);
    // adopted straight from review, freeing the slot without waiting for moderation
    assert.equal((await api('PATCH', `/pets/${fourth.id}/status`, owner.token, { status: 'adopted' })).body.status, 'adopted');
  });

  await t.test('rejected pets must be edited before resubmitting', async () => {
    await db.from('pets').update({ status: 'rejected', moderation_reason: 'foto genérica' }).eq('id', second.id);
    assert.equal((await second.submit()).body.error.code, 'INVALID_STATUS');
    const edited = await api('PATCH', `/pets/${second.id}`, owner.token, { description: 'Foto propia' });
    assert.equal(edited.body.status, 'draft');
    assert.equal(edited.body.moderation_reason, null);
    assert.equal((await second.submit()).body.status, 'pending_review');
  });

  await t.test('abandoned uploads are dropped over the cap, saved photos are kept', async () => {
    const pet = await api('POST', '/pets', owner.token, { ...PET, name: 'Cap' });
    const id = pet.body.id;
    const saved = (await withPhotos(owner, id, 5)).slice(0, 2);
    await api('PUT', `/pets/${id}/photos`, owner.token, { paths: saved }); // 3 unsaved removed here
    await withPhotos(owner, id, 5); // 2 saved + 5 abandoned
    const latest = await withPhotos(owner, id, 5); // 12 > 10: the 5 abandoned go
    const { data } = await db.storage.from('pet-photos').list(`pets/${id}`);
    assert.deepEqual(new Set(data!.map((f) => `pets/${id}/${f.name}`)), new Set([...saved, ...latest]));
    assert.equal((await api('GET', `/pets/${id}`, owner.token)).body.photos.length, 2);
  });

  await t.test('a deleted user with a still-valid token gets 401', async () => {
    const ghost = await signUp('ghost');
    await db.auth.admin.deleteUser(ghost.id);
    assert.equal((await api('GET', '/me', ghost.token)).status, 401);
  });

  await t.test('owner-only edits; editing an approved pet re-enters review', async () => {
    const pet = await publish(other, 'Nala');
    await pet.submit();
    await db.from('pets').update({ status: 'approved' }).eq('id', pet.id);
    assert.equal((await api('PATCH', `/pets/${pet.id}`, owner.token, { name: 'Hack' })).status, 404);
    assert.equal((await api('PATCH', `/pets/${pet.id}/status`, other.token, { status: 'paused' })).body.status, 'paused');
    assert.equal((await api('PATCH', `/pets/${pet.id}/status`, other.token, { status: 'approved' })).body.status, 'approved');
    const edited = await api('PATCH', `/pets/${pet.id}`, other.token, { name: 'Nala II' });
    assert.equal(edited.body.status, 'pending_review');
    assert.equal((await api('PATCH', `/pets/${pet.id}`, other.token, {})).status, 422);
    assert.equal((await api('GET', '/me/pets', other.token)).body.length, 1);
  });

  await t.test('pause → edit → resume cannot skip moderation', async () => {
    const pet = await publish(other, 'Simba');
    await pet.submit();
    await db.from('pets').update({ status: 'approved' }).eq('id', pet.id);
    await api('PATCH', `/pets/${pet.id}/status`, other.token, { status: 'paused' });
    assert.equal((await api('PATCH', `/pets/${pet.id}`, other.token, { description: 'Vendo cachorros' })).body.status, 'draft');
    assert.equal((await api('PATCH', `/pets/${pet.id}/status`, other.token, { status: 'approved' })).body.error.code, 'INVALID_STATUS');

    // same for a photo swap
    await pet.submit();
    await db.from('pets').update({ status: 'paused' }).eq('id', pet.id);
    const paths = await withPhotos(other, pet.id);
    await api('PUT', `/pets/${pet.id}/photos`, other.token, { paths });
    assert.equal((await api('GET', `/pets/${pet.id}`, other.token)).body.status, 'draft');
  });

  await t.test('admin routes require profiles.role = admin', async () => {
    assert.equal((await api('GET', '/admin/pets', other.token)).status, 403);
    await db.from('profiles').update({ role: 'admin' }).eq('id', other.id);
    const queue = await api('GET', '/admin/pets', other.token);
    assert.equal(queue.status, 200);
    assert.ok(queue.body.every((p: { status: string }) => p.status === 'pending_review'));
  });

  await t.test('suspended users are rejected and their pets leave the catalog', async () => {
    await db.from('pets').update({ status: 'approved' }).eq('id', second.id);
    assert.ok((await api('GET', '/pets')).body.data.some((p: { id: string }) => p.id === second.id));

    await db.from('profiles').update({ is_suspended: true }).eq('id', owner.id);
    assert.equal((await api('GET', '/me', owner.token)).body.error.code, 'SUSPENDED');
    assert.ok(!(await api('GET', '/pets')).body.data.some((p: { id: string }) => p.id === second.id));
    assert.equal((await api('GET', `/pets/${second.id}`)).status, 404);
  });
});
