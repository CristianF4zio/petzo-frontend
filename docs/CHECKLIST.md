# Checklist

Estado por sprint según SPEC §16 (D-21, D-27), con cada ítem atado a su historia de usuario (SPEC §7) y requerimiento (§5).
`[x]` hecho y probado (`tsc` + bundle de Metro + endpoint con test en verde en el backend) · `[~]` parcial o depende de Cris · `[ ]` pendiente.
La prueba manual en el teléfono (Expo Go contra la API local) va aparte, al final de F1.
Repos (exactamente dos, como pide el reto): `petzo-backend` (API, n8n, Stagehand; estado del reto en su `docs/CHECKLIST.md`) y `petzo-frontend` (este: app en `apps/mobile`, panel en `apps/admin`).

## Backend (resumen; detalle en petzo-backend)
- [x] B0 Supabase + modelo: Flyway V1 (baseline) + V2 (trigger de perfiles); un registro nuevo crea su perfil
- [x] B1 API core: JWT, perfiles, mascotas, fotos, catálogo, límite de plan, admin, Swagger (tests en verde)
- [~] B2 Solicitudes + IA: implementado y probado con IA simulada; falta `ANTHROPIC_API_KEY` para probar con IA real
- [~] B3 Automatizaciones: `/internal/*`, flujos n8n y worker Stagehand listos; faltan las URLs de n8n en `.env` (sin ellas las publicaciones quedan en revisión para el admin, RNF-08)
- [~] B4 API lista: tests (24/24), Dockerfile y colección `.http` listos; corre en local (`:8090`); el deploy en Render es opcional mientras la demo sea local

## F1 App móvil (Expo)
Base
- [x] Expo Router, tokens del diseño (DM Sans, Lucide); sesión por la API guardada en `expo-secure-store` (sin SDK de Supabase)
- [x] Cliente alineado al contrato de la API Java (`/api/...`, camelCase, ProblemDetail, galería con `PUT /photos`, D-28)
- [x] Quitar `apps/api` y `supabase/` (legado previo a D-22/D-25)
- [x] Auditoría ponytail corregida: timeout de 20 s en la API, teclado en iOS, zona al publicar, carreras del catálogo, reintento de perfil, confirmación al adoptar o borrar, galería estable al enviar, compresión secuencial, cancelar edición; `tsc` + bundle OK

Historias Must
- [x] HU-01 Registro e inicio de sesión con correo o Google; la sesión persiste (RF-01, RF-02)
- [x] HU-02 Completar perfil con zona y WhatsApp; sin eso no se publica ni se solicita (RF-04)
- [x] HU-03 Publicar con 1 a 5 fotos comprimidas, queda en revisión y respeta el límite del plan (RF-06, RF-07, RNF-06)
- [x] HU-04 Estado y motivo de rechazo en "Mis publicaciones" (RF-08; el correo lo envía n8n, RF-18)
- [x] HU-05 Catálogo de aprobadas con filtros combinables y paginado de 20 (RF-10, RF-11)
- [x] HU-07 Enviar solicitud (formulario + motivación), una activa por mascota; estado en "Mis solicitudes" (RF-15)
- [x] HU-09 Aprobar o rechazar solicitudes; al aprobar, ambos ven el botón de WhatsApp (RF-17, RNF-04)
- [x] HU-10 Marcar como adoptada: sale del catálogo y libera cupo (RF-09)

Historias Should / Could
- [x] HU-06 Cuestionario de estilo de vida y hasta 10 recomendados con % y razón; se puede repetir (RF-12, RF-13)
- [x] HU-08 Resumen IA y puntaje 0-100 en cada solicitud; sin IA se ve la solicitud sin resumen (RF-16)
- [x] HU-11 Reportar una publicación (RF-23)
- [x] HU-12 Solicitar cuenta de fundación verificada; badge al verificarse (RF-05)
- [x] HU-16 Favoritos: agregar, quitar y lista en el perfil (RF-14)

Prueba en el teléfono
- [ ] Flujo completo en Expo Go contra la API local: registro → perfil → publicar → aprobar (panel o n8n) → solicitar → aprobar → WhatsApp

Fuera de la app (otros repos o v2)
- HU-13, HU-14, HU-15 están en el panel admin (`apps/admin`, F2)
- Visitante sin cuenta viendo el catálogo (§4): hoy la app pide sesión para todo; pendiente de decidir si entra en el MVP

## F2 Panel admin (`apps/admin`)
- [x] Mudado desde `petzo-web`; login por la API (correo y Google con `flow` + `secret`), sesión en memoria y `sessionStorage`
- [x] Guardia por rol: si `/api/me` no es admin muestra el aviso; el backend responde 403 en `/api/admin/**`
- [x] HU-13 Cola de moderación con motivo y riesgo; aprobar (con `version`) o rechazar con motivo
- [x] HU-12 / RF-21 Fundaciones: verificar o rechazar; plan Gratis o Pro
- [x] RF-22 Usuarios (suspender o reactivar) y reportes (descartar o retirar la publicación)
- [x] HU-14 Importaciones: lanzar y ver el progreso (se refresca cada 5 s)
- [x] HU-15 Métricas
- [x] `npm run build` y `npm run lint` OK
- [x] Login en vivo por la API y guardia de rol: un usuario normal ve "Tu cuenta no tiene permisos de administrador" (`docs/evidencia/panel-no-admin.png`)
- [ ] Probar las vistas con un admin real (Cris crea el admin con el SQL del README)

## F3 Entrega
- [ ] APK con EAS (opcional mientras la demo sea local)
- [ ] Prueba de punta a punta
- [ ] READMEs y evidencias

## Pendientes de Cris
- [x] Repos `petzo-backend` y `petzo-frontend` en GitHub
- [ ] Archivar `petzo-web` en GitHub (el panel ya vive en `apps/admin`)
- [x] Repo renombrado en GitHub a `petzo-frontend`
- [ ] `ANTHROPIC_API_KEY` en `petzo-backend/.env` (pre-evaluación y match)
- [ ] Importar los 2 flujos de n8n y poner sus URLs en `petzo-backend/.env` (moderación automática y correos)
- [ ] Servicio Docker en Render (solo si la demo deja de ser local)
- [ ] Sesión del CLI de Expo (`npx expo login` o `EXPO_TOKEN`) para EAS (solo para el APK)

## Recortables (en este orden, si hay atraso)
- [ ] HU-15 dashboard → HU-16 favoritos → HU-11 reportes → HU-06 match
