# Petzo admin

Panel web (React + Vite + TypeScript) para administradores de Petzo (SPEC §4, HU-12 a HU-15). Se construye en el sprint **F2**.

Funciones: cola de moderación con motivo y riesgo de la IA (aprobar/rechazar con motivo), verificación de fundaciones y plan Gratis/Pro, usuarios (suspender), reportes, importaciones de Instagram y métricas. Habla solo con la API de `petzo-backend` (`/api/admin/**`, requiere `profiles.role = 'admin'`).

```bash
cp .env.example .env   # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_URL
npm install && npm run dev
```
