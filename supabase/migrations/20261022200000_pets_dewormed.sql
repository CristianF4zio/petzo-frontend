-- Health flag shown in the app design (Desparasitado)
alter table pets add column dewormed boolean not null default false;
