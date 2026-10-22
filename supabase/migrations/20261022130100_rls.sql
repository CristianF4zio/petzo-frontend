-- RLS on every table, SELECT-only policies (SPEC §15). All writes go through the API with service_role.

alter table municipalities enable row level security;
alter table profiles enable row level security;
alter table lifestyle_profiles enable row level security;
alter table pets enable row level security;
alter table pet_photos enable row level security;
alter table adoption_requests enable row level security;
alter table favorites enable row level security;
alter table reports enable row level security;
alter table ai_logs enable row level security;
alter table import_jobs enable row level security;

create policy "municipalities are public" on municipalities
  for select to anon, authenticated using (true);

create policy "approved or own pets" on pets
  for select to anon, authenticated
  using (status = 'approved' or owner_id = (select auth.uid()));

create policy "photos of visible pets" on pet_photos
  for select to anon, authenticated
  using (exists (
    select 1 from pets p
    where p.id = pet_id
      and (p.status = 'approved' or p.owner_id = (select auth.uid()))
  ));

create policy "own profile" on profiles
  for select to authenticated using (id = (select auth.uid()));

create policy "own lifestyle profile" on lifestyle_profiles
  for select to authenticated using (user_id = (select auth.uid()));

create policy "own favorites" on favorites
  for select to authenticated using (user_id = (select auth.uid()));

create policy "own requests or requests for own pets" on adoption_requests
  for select to authenticated
  using (
    adopter_id = (select auth.uid())
    or exists (select 1 from pets p where p.id = pet_id and p.owner_id = (select auth.uid()))
  );

-- reports, ai_logs, import_jobs: RLS on, no policies (API only)
