# Petzo · Design system (MASTER)

Single source of truth for the mobile app (`apps/mobile`) and the admin panel (`apps/admin`). Page overrides, if any, live in `pages/`.

Source: ui-ux-pro-max data → product "Pet Tech App" (colors.csv #23, products.csv #23): *Playful orange + trust blue*, style *Claymorphism + Vibrant & Block-based* with *Flat Design* as secondary. Adapted to the onboarding reference (flat illustrations on a blue hero, white surfaces, black pill CTAs) and checked for WCAG AA.

## Palette

| Token | Hex | Use | Contrast note |
| --- | --- | --- | --- |
| `ink` | `#1C1917` | Primary CTA fill (pill), titles, active text | white on ink 17:1 |
| `inkPressed` | `#44403C` | Pressed CTA | |
| `body` | `#44403C` | Body text | 9.9:1 on white |
| `muted` | `#57534E` | Secondary text, captions | 7.5:1 on white |
| `brand` | `#EA580C` | Logo, active tab/nav, hearts, focus ring, big accents (fills/icons) | not for small text on white (3.6:1) |
| `brandText` | `#C2410C` | Orange text/links on white | 5.2:1 |
| `brandSoft` | `#FFEDD5` | Orange-tinted surfaces, selected chips bg | |
| `trust` | `#2563EB` | Info, links, "verified/trust" accents | 5.2:1 |
| `hero` | `#5B8DEF` | Onboarding/splash hero background, illustration base | white bold ≥24px only |
| `heroDeep` | `#3B6FD8` | Hero shapes/shadows | |
| `canvas` | `#FFFFFF` | Screens, cards | |
| `cream` | `#FFF7ED` | App background tint, soft sections (replaces gray "soft") | |
| `sand` | `#F5EFE8` | Panel sidebar, input fill on white, table header | |
| `hairline` | `#EADFD3` | Borders, dividers | |
| `peach` `#FFEDD5` · `sky` `#DBEAFE` · `mint` `#DCFCE7` · `butter` `#FEF3C7` · `lilac` `#EDE9FE` | | Category circles, status badges, illustration fills | text on them = ink/dark variant |
| `success` | `#15803D` | Approved, toggle on | 5.0:1 |
| `warning` | `#B45309` | In review text | 5.0:1 |
| `danger` | `#B91C1C` | Reject/delete text & icons | 6.5:1 on white, 5.5:1 on dangerSoft |
| `dangerSoft` | `#FEE2E2` | Danger badge bg | |

Status badges (always text + color): En revisión = butter/`#92400E` · Aprobada/Activa = mint/`#166534` · Rechazada = dangerSoft/`#991B1B` · Borrador = sand/ink · Pausada = sky/`#1E40AF` · Adoptada = peach/`#9A3412` · Verificada = mint + BadgeCheck · Pro = brandSoft/`#9A3412`.

## Type
DM Sans everywhere (400/500/600/700). Display 36/42 bold · H1 26/32 bold · H2 20/26 semibold · Title 16/21 semibold · Body 16/24 · Label 14/20 medium · Small 14/20 · Caption 13/18 · Badge 12/16 semibold. Never below 12px.

## Shape, depth, motion
- Radius: 10 (inputs/small) · 16 (cards, photos) · 24 (sections, sheets) · 32 (hero cards) · full (pills, avatars, category circles).
- Claymorphism-lite: cards white on cream with a soft warm shadow `0 8px 24px rgba(28,25,23,0.06)`; no heavy borders; 1px hairline only where separation is needed.
- Buttons: primary = ink pill (h 52 mobile / 44 web), secondary = white pill + hairline, danger = white pill + danger text/icon, ghost = text in brandText.
- Icons: Lucide, 20/24, stroke 2; filled only for active heart. No emojis.
- Motion: 150–250 ms ease-out for state, spring for splash/logo; press = scale 0.97 + opacity; always honor reduced motion.

## Illustrations
Flat vector style (react-native-svg in the app, inline SVG in the panel): rounded shapes, no outlines, 3–4 flat tones per figure, simple faces (dot eyes, small smile, pink cheeks), pastel flower/paw patterns, characters hugging dogs/cats, on `hero` blue backgrounds.

## Layout
- App: 20px gutters, 8pt rhythm, section gaps 24, safe areas respected, sticky CTA bars with bottom inset.
- Panel: full-viewport; sand sidebar 260px with search + icon nav (active = white pill + brand icon); content on cream background with white cards; 48px gutters desktop, 16px mobile.
