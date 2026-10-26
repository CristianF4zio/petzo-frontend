import type { PetStatus, RequestStatus, Sex, Size, Species } from './api';
import { color } from './theme';

export const SPECIES: Record<Species, string> = { dog: 'Perro', cat: 'Gato' };
export const SEX: Record<Sex, string> = { male: 'Macho', female: 'Hembra' };
export const SIZE: Record<Size, string> = { small: 'Pequeño', medium: 'Mediano', large: 'Grande' };

// Badge table in design-system/petzo/MASTER.md: dark text on a pastel, always with a label
const TONE = {
  review: ['#92400E', color.butter],
  ok: ['#166534', color.mint],
  bad: ['#991B1B', color.errorBg],
  idle: [color.ink, color.sand],
} as const;

// [label, text color, background]
export const STATUS: Record<PetStatus, [string, string, string]> = {
  draft: ['Borrador', ...TONE.idle],
  pending_review: ['En revisión', ...TONE.review],
  approved: ['Publicada', ...TONE.ok],
  rejected: ['Rechazada', ...TONE.bad],
  paused: ['Pausada', '#1E40AF', color.sky],
  adopted: ['Adoptada', '#9A3412', color.peach],
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

// Mirrors the API rule (RF-07): pending_review + approved count toward the plan
export const PLAN_LIMITS = { free: 3, pro: 30 } as const;
export const isActive = (s: PetStatus) => s === 'pending_review' || s === 'approved';

// [label, text color, background]
export const REQUEST_STATUS: Record<RequestStatus, [string, string, string]> = {
  pending: ['Pendiente', ...TONE.review],
  approved: ['Aprobada', ...TONE.ok],
  rejected: ['Rechazada', ...TONE.bad],
  withdrawn: ['Retirada', ...TONE.idle],
};

export const HOUSING = [
  { value: 'casa', label: 'Casa' },
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'otro', label: 'Otro' },
] as const;
export const YES_NO = [
  { value: 'si', label: 'Sí' },
  { value: 'no', label: 'No' },
] as const;

// AI score 0-100 → [text, background]: green from 70, amber from 40
export const scoreColors = (s: number): [string, string] => [...(s >= 70 ? TONE.ok : s >= 40 ? TONE.review : TONE.bad)];
