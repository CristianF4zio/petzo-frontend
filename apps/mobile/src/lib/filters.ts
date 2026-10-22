import type { Sex, Size, Species } from './api';

export type Filters = { species: Species | ''; sex: Sex | ''; sizes: Size[]; minAge: number; maxAge: number; zone: number | null };

export const NO_MAX = 999;
export const DEFAULT_FILTERS: Filters = { species: '', sex: '', sizes: [], minAge: 0, maxAge: NO_MAX, zone: null };

// Age stops from the design (months)
export const AGES = [
  { value: 0, label: '0 meses' },
  { value: 6, label: '6 meses' },
  { value: 12, label: '1 año' },
  { value: 24, label: '2 años' },
  { value: 60, label: '5 años' },
  { value: NO_MAX, label: '10+ años' },
];
export const ageLabel = (v: number) => AGES.find((a) => a.value === v)?.label ?? '';

export function toQuery(f: Filters, page: number) {
  const q = new URLSearchParams({ page: String(page) });
  if (f.species) q.set('species', f.species);
  if (f.sex) q.set('sex', f.sex);
  if (f.sizes.length) q.set('size', f.sizes.join(','));
  if (f.minAge) q.set('min_age_months', String(f.minAge));
  if (f.maxAge !== NO_MAX) q.set('max_age_months', String(f.maxAge));
  if (f.zone) q.set('municipality_id', String(f.zone));
  return `/pets?${q}`;
}

export const activeCount = (f: Filters) =>
  Number(!!f.species) + Number(!!f.sex) + Number(f.sizes.length > 0) + Number(f.minAge !== 0 || f.maxAge !== NO_MAX) + Number(!!f.zone);
