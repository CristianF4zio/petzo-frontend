import type { PetStatus, Sex, Size, Species } from './api';

export const SPECIES: Record<Species, string> = { dog: 'Perro', cat: 'Gato' };
export const SEX: Record<Sex, string> = { male: 'Macho', female: 'Hembra' };
export const SIZE: Record<Size, string> = { small: 'Pequeño', medium: 'Mediano', large: 'Grande' };

// [label, text color, background]
export const STATUS: Record<PetStatus, [string, string, string]> = {
  draft: ['Borrador', '#6A6A6A', '#F2F2F2'],
  pending_review: ['En revisión', '#B45309', '#FEF3C7'],
  approved: ['Publicada', '#15803D', '#DCFCE7'],
  rejected: ['Rechazada', '#B91C1C', '#FEE2E2'],
  paused: ['Pausada', '#3F3F3F', '#EBEBEB'],
  adopted: ['Adoptada', '#9A3412', '#FFEDD5'],
};

export function ageText(m: number) {
  if (m < 12) return `${m} ${m === 1 ? 'mes' : 'meses'}`;
  const y = Math.floor(m / 12);
  const r = m % 12;
  return `${y} ${y === 1 ? 'año' : 'años'}${r ? ` y ${r} ${r === 1 ? 'mes' : 'meses'}` : ''}`;
}

// "Vacunad" + o/a
export const gendered = (base: string, sex?: Sex | '') => base + (sex === 'female' ? 'a' : 'o');

export const initials = (name?: string | null) =>
  (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

// 04121234567 → "0412 123 4567"
export function formatWhatsapp(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  return d.slice(0, 4) + (d.length > 4 ? ' ' + d.slice(4, 7) : '') + (d.length > 7 ? ' ' + d.slice(7) : '');
}

// API stores +584121234567; the form shows 0412 123 4567
export const localWhatsapp = (e164?: string | null) => (e164 ? formatWhatsapp('0' + e164.replace(/^\+58/, '')) : '');

export function timeAgo(iso: string) {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return 'hace un momento';
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} ${h === 1 ? 'hora' : 'horas'}`;
  const d = Math.round(h / 24);
  return `hace ${d} ${d === 1 ? 'día' : 'días'}`;
}
