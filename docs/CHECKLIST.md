# Checklist

Estado por sprint según SPEC §16 (D-21, D-27). `[x]` hecho y probado · `[~]` parcial o depende de Cris · `[ ]` pendiente.
Repos: `petzo-backend` (B0–B4, detalle en su `docs/CHECKLIST.md`), `petzo-frontend` (este: F1 y F3) y `petzo-web` (F2, panel admin).

## Backend (resumen; detalle en petzo-backend)
- [x] B0 Supabase + modelo: Flyway V1 (baseline) + V2 (trigger de perfiles); un registro nuevo crea su perfil
- [x] B1 API core: JWT, perfiles, mascotas, fotos, catálogo, límite de plan, admin, Swagger (tests en verde)
- [~] B2 Solicitudes + IA: implementado y probado con IA simulada; falta probar con `ANTHROPIC_API_KEY` real
- [~] B3 Automatizaciones: `/internal/*`, flujos n8n y worker Stagehand listos; falta importarlos en n8n y una corrida real
- [~] B4 API lista: tests (20/20), Dockerfile y colección `.http` listos; falta deploy en Render y correr la colección contra producción

## F1 App móvil (Expo)
- [x] Base: Expo Router, tokens del diseño (DM Sans, Lucide), cliente Supabase Auth
- [x] Pantallas construidas: login correo + Google, completar perfil, catálogo con filtros, detalle, publicar (4 pasos), mis publicaciones, perfil, favoritos
- [x] Adaptar el cliente al contrato de la API Java (`/api/...`, camelCase, ProblemDetail, galería con `PUT /photos`, D-28); `tsc` y bundle de Metro OK
- [ ] Solicitud de adopción + estado + botón de WhatsApp (contacto tras aprobar)
- [ ] Solicitudes recibidas (resumen IA y puntaje) + aprobar/rechazar
- [ ] Cuestionario de estilo de vida + recomendados (match)
- [ ] Reportar publicación y solicitar verificación de fundación
- [x] Quitar `apps/api` y `supabase/` (legado previo a D-22/D-25)
- [ ] Flujo completo en Expo Go contra producción

## F2 Panel admin (repo `petzo-web`)
- [ ] Detalle en `petzo-web/docs/CHECKLIST.md`

## F3 Entrega
- [ ] APK con EAS apuntando a la API pública
- [ ] Prueba de punta a punta
- [ ] READMEs y evidencias

## Pendientes de Cris
- [x] Repos `petzo-backend` y `petzo-web` en GitHub (código subido)
- [x] Repo renombrado en GitHub a `petzo-frontend`
- [ ] `ANTHROPIC_API_KEY` en `petzo-backend/.env`
- [ ] Servicio Docker en Render con las variables del `.env`
- [ ] Importar los 2 flujos de n8n y pasar sus URLs de producción
- [ ] Sesión del CLI de Expo (`npx expo login` o `EXPO_TOKEN`) para EAS

## Recortables (en este orden, si hay atraso)
- [ ] HU-15 dashboard → HU-16 favoritos → HU-11 reportes → HU-06 match
