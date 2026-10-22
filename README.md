# petzo-frontend

App móvil de **Petzo**, adopción de perros y gatos en Gran Caracas. La especificación completa está en [`docs/SPEC.md`](docs/SPEC.md).

| Carpeta | Qué es |
| --- | --- |
| `apps/mobile` | App React Native + Expo (Android APK con EAS, iOS con Expo Go) |
| `docs/` | Spec, checklist, diseño y logs de skills/agentes |

Repos hermanos: **`petzo-backend`** (API Java 21 + Spring Boot, Flyway, flujos n8n y worker de Stagehand; D-22, D-23) y **`petzo-web`** (panel admin React + Vite).

## Correr

```bash
# 1) API: en petzo-backend → ./mvnw spring-boot:run (puerto 8090)
# 2) App móvil
cd apps/mobile && cp .env.example .env && npm install && npx expo start
```

Variables: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_API_URL`. Solo la clave pública de Supabase va en el cliente; la API es la única que escribe datos.
