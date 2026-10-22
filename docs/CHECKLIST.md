# Checklist

Estado de implementación por sprint (SPEC §16). `[x]` hecho y probado · `[ ]` pendiente · `[~]` parcial o depende de Cris.

## S0 Setup
- [x] Apps `apps/mobile` (Expo, scheme `petzo`), `apps/admin` (Vite), `apps/api` (Express + `/health`)
- [x] Migración: 13 enums + 10 tablas (§14)
- [x] Migración: RLS en 10 tablas, solo SELECT (§15)
- [x] Bucket público `pet-photos` + seed de 11 municipios
- [x] Migraciones probadas en local y aplicadas en la nube
- [x] `.env.example` por app, `CLAUDE.md`, logs de skills y agentes
- [x] Google OAuth configurado y probado en Supabase (usuario Google creado en `auth.users`)

## S1 API core (HU-02, 03, 05, 10)
- [x] Middleware JWT + middleware admin
- [x] Perfil: ver/editar (zona, WhatsApp), alta del perfil
- [x] CRUD de mascotas (crear, editar, pausar, adoptada)
- [x] URLs firmadas de subida de fotos (1 a 5)
- [x] Catálogo con filtros y paginación (20)
- [x] Límite de plan (free 3 / pro 30)
- [x] Swagger
- [x] Endpoints probados con requests reales (`npm run smoke`, Supabase local)
- [x] Verificar `SUPABASE_SERVICE_ROLE_KEY` en `apps/api/.env` contra la nube (catálogo y municipios responden)
- [ ] Supabase nube: desactivar "Confirm email" o configurar SMTP propio (el SMTP por defecto solo manda unos pocos correos por hora) (Cris)

## S2 App base (HU-01, 02, 03, 05, 10)
- [ ] Login correo + Google
- [ ] Perfil
- [ ] Catálogo y detalle
- [ ] Publicar con fotos (compresión ~500 KB)
- [ ] Mis publicaciones
- [ ] Flujo completo en Expo Go contra la API local

## S3 Solicitudes + IA (HU-06, 07, 08, 09)
- [ ] Cliente Haiku 5.5 + `ai_logs` + tope diario
- [ ] Enviar solicitud (una activa por mascota)
- [ ] Pre-evaluación IA (resumen + puntaje)
- [ ] Aprobar/rechazar + liberar WhatsApp
- [ ] Cuestionario de estilo de vida + match

## S4 n8n (HU-04)
- [ ] Endpoints `/internal/*` con `x-internal-secret`
- [ ] Flujo 1: moderación
- [ ] Flujo 2: notificaciones por correo
- [ ] Fallback: si n8n o IA fallan, queda `pending_review`
- [ ] Callbacks de moderación solo aplican si `status = pending_review` y `updated_at` coincide con lo evaluado

## S5 Panel (HU-12, 13)
- [ ] Login admin
- [ ] Cola de moderación con motivo y riesgo
- [ ] Verificar fundaciones y asignar plan
- [ ] Usuarios (suspender) y reportes

## S6 Stagehand (HU-14)
- [ ] Worker de importación con Haiku 5.5
- [ ] `import_jobs` + botón en el panel
- [ ] Un perfil público genera borradores

## S7 Entrega
- [ ] Deploy API (Render) y panel (Vercel)
- [ ] APK con EAS contra la API pública
- [ ] Prueba de punta a punta
- [ ] README y evidencias

## Recortables (en este orden, si hay atraso)
- [ ] HU-15 dashboard
- [ ] HU-16 favoritos
- [ ] HU-11 reportes
