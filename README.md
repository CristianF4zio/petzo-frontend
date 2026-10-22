# petzo-frontend

App móvil y panel admin de **Petzo**, adopción de perros y gatos en Gran Caracas. La especificación completa está en [`docs/SPEC.md`](docs/SPEC.md).

| Carpeta | Qué es |
| --- | --- |
| `apps/mobile` | App React Native + Expo (Android APK con EAS, iOS con Expo Go) |
| `apps/admin` | Panel web React + Vite para administradores |
| `docs/` | Spec, checklist, diseño y logs de skills/agentes |

El backend (API Java 21 + Spring Boot, migraciones Flyway, flujos n8n y worker de Stagehand) vive en el repo **`petzo-backend`** (D-22, D-23).

## Correr

```bash
# 1) API: en petzo-backend → ./mvnw spring-boot:run (puerto 8090)
# 2) App móvil
cd apps/mobile && cp .env.example .env && npm install && npx expo start
# 3) Panel admin
cd apps/admin && cp .env.example .env && npm install && npm run dev
```

Variables: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_API_URL` (móvil) y `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL` (panel). Solo la clave pública de Supabase va en el cliente; la API es la única que escribe datos.
