-- Public bucket; uploads only through signed URLs issued by the API (SPEC §15, D-20)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('pet-photos', 'pet-photos', true, 1048576, array['image/jpeg', 'image/png', 'image/webp']);

-- Gran Caracas catalog (SPEC §14, D-18). In a migration so `db push` ships it.
insert into municipalities (name, state) values
  ('Libertador', 'Distrito Capital'),
  ('Chacao', 'Miranda'),
  ('Baruta', 'Miranda'),
  ('Sucre', 'Miranda'),
  ('El Hatillo', 'Miranda'),
  ('Vargas', 'La Guaira'),
  ('Los Salias', 'Miranda'),
  ('Carrizal', 'Miranda'),
  ('Guaicaipuro', 'Miranda'),
  ('Plaza', 'Miranda'),
  ('Zamora', 'Miranda');
