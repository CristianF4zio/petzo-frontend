# Checklist

Estado por sprint según SPEC §16 (D-21, D-27), con cada ítem atado a su historia de usuario (SPEC §7) y requerimiento (§5).
`[x]` hecho y probado (`tsc` + bundle de Metro + endpoint con test en verde en el backend) · `[~]` parcial o depende de Cris · `[ ]` pendiente · `[-]` fuera de alcance, con su causa.
La prueba manual en el teléfono (Expo Go contra la API local) va aparte, al final de F1.
Repos (exactamente dos, como pide el reto): `petzo-backend` (API, n8n, Stagehand; estado del reto en su `docs/CHECKLIST.md`) y `petzo-frontend` (este: app en `apps/mobile`, panel en `apps/admin`).

## Backend (resumen; detalle en petzo-backend)
- [x] B0 Supabase + modelo: Flyway V1 (baseline) + V2 (trigger de perfiles); un registro nuevo crea su perfil
- [x] B1 API core: JWT, perfiles, mascotas, fotos, catálogo, límite de plan, admin, Swagger (tests en verde)
- [x] B2 Solicitudes + IA: IA real por OpenRouter (`gpt-4.1-mini`); match verificado en vivo el 25-oct
- [~] B3 Automatizaciones: flujos n8n importados y activos en staging; moderación (ejecución 417) e importación con Stagehand corridas en vivo. Falta el correo del flujo 2: la credencial SMTP necesita contraseña (Cris)
- [x] B4 API lista: 27/27 tests, Dockerfile y colección `.http`; corre en local (`:8090`) y pasó el recorrido completo por la API el 26-oct. El deploy en Render queda fuera de alcance (demo local)

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
- [x] Flujo completo contra la API local: en el iPhone (25-oct: login, publicar, catálogo) y por la API de punta a punta (26-oct, 20 pasos: registro → perfil → publicar → moderación → aprobar → solicitar → aprobar → WhatsApp; `petzo-backend/docs/evidencia/e2e/`)
- [~] Revisar en el iPhone el rediseño con la paleta nueva (Cris; la lógica y las llamadas a la API no cambiaron, comparadas antes/después)

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
- [-] HU-15 Métricas: retirada del panel el 26-oct a pedido de Cris (el endpoint `/api/admin/stats` sigue en la API)
- [x] `npm run build` y `npm run lint` OK
- [x] Login en vivo por la API y guardia de rol: un usuario normal ve "Tu cuenta no tiene permisos de administrador" (`docs/evidencia/panel-no-admin.png`)
- [x] Probar las vistas con un admin real: el admin entra con Google, modera y lanza importaciones (25-oct)

## F3 Entrega
- [-] APK con EAS: fuera de alcance; el reto acepta Expo Go en dispositivo (DECISIONS §2)
- [x] Prueba de punta a punta (25-oct: iPhone, emulador Android y panel contra Supabase real)
- [x] READMEs y evidencias (`docs/evidencia/`)
- [x] Auditoría final (26-oct): ningún cliente toca Supabase y Google coincide con la API; 4 arreglos (pantalla en blanco sin API, refresh vs. cierre de sesión, error claro sin URL de la API, "Retirar" en reportes repetidos); `tsc`, build, lint y `expo export` en verde
- [ ] Video de 3–5 min (Cris)

## Pendientes de Cris
- [x] Repos `petzo-backend` y `petzo-frontend` en GitHub
- [x] `petzo-web` archivado en GitHub (confirmado por la API de GitHub el 26-oct)
- [x] `petzo-backend` y `petzo-frontend` públicos (verificado con la API de GitHub sin sesión, 26-oct)
- [x] Repo renombrado en GitHub a `petzo-frontend`
- [x] IA: ya no hace falta `ANTHROPIC_API_KEY`; todo va por la clave de OpenRouter (DECISIONS §9)
- [~] Flujos de n8n importados y activos en staging con sus URLs en `.env`; el flujo 1 ya corrió. Falta la contraseña en la credencial **Petzo SMTP** para el flujo 2, y levantar el túnel cada vez que cambia la red
- [ ] Site URL de Supabase = `http://192.168.0.159:8090` (la IP de la PC cambió el 26-oct; sin esto falla el login con Google)
- [-] Servicio Docker en Render: fuera de alcance (demo local)
- [-] Sesión del CLI de Expo para EAS: solo hacía falta para el APK; Expo Go usa `EXPO_TOKEN` en el proceso

## Recortables
- [x] Nada se recortó de las historias: favoritos (HU-16), reportes (HU-11) y match (HU-06) están hechos; solo el panel de métricas (HU-15) se retiró a pedido

- [x] Rediseño (26-oct): app con splash animado, onboarding, inicio con categorías y grilla, detalle con chips; panel con barra lateral, buscador, tarjetas y splash. Lógica y llamadas a la API sin cambios (comparadas); tsc, export, build y lint en verde
