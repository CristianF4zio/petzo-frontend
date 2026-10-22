# Petzo frontend

Frontend of Petzo (dog/cat adoption, Gran Caracas). This repo is `petzo-frontend` (D-23): `apps/mobile` + `apps/admin`. The API lives in the `petzo-backend` repo (Java 21 + Spring Boot, D-22) — never add backend code here. Source of truth: `docs/SPEC.md` (read only the section you need: §5 RF, §7 HU, §15 RLS, §16 sprints).

## Stack
- `apps/mobile`: React Native + Expo SDK 58 (TS), Expo Router in `src/app`. Delivered as EAS APK + Expo Go. See `apps/mobile/AGENTS.md` (check versioned Expo docs, use `npx expo install`).
- `apps/admin`: React + Vite (TS): moderation, foundations, users, imports.
- Auth: Supabase Auth SDK only (email/password + Google). Every data call goes to the REST API with `Authorization: Bearer <access token>`.
- Design: `docs/design/Petzo.dc.html` (tokens + screens) and `docs/DESIGN_PROMPT.md`.

## Commands
- Mobile: `cd apps/mobile && npx expo start` · `npx tsc --noEmit` · `npx expo-doctor` · APK: `npx eas-cli@latest build -p android --profile preview`
- Admin: `cd apps/admin && npm run dev` · `npm run build`
- API for local dev: run `petzo-backend` (`./mvnw spring-boot:run`, port 8090). Swagger at `/swagger-ui.html`.

## Rules
- The app never reads or writes tables directly: RLS is SELECT-only and the API is the only writer (D-19). Only the anon/publishable key ships in the app.
- Contract = the API's Swagger (D-27): camelCase JSON, ProblemDetail errors with `code`, paginated catalog `{items, page, pageSize, total}`.
- WhatsApp is shown only through `GET /api/requests/{id}/contact` after approval (RNF-04).
- Photos: compress (≤ ~500 KB, RNF-06) → `POST /api/pets/{id}/photos/upload-url` → upload to the signed URL → `POST /api/pets/{id}/photos`.
- UI text in Spanish; code, names and commits in English. Secrets only in `.env` (each app has `.env.example`).
- Legacy: `apps/api` (Node) and `supabase/` belong to the plan before D-22/D-25; the schema now lives in Flyway in `petzo-backend`. Do not modify them; they are removed in F1.

## Workflow
- Sprints per SPEC §16: F1 mobile, F2 admin, F3 delivery (backend B0–B4 runs in `petzo-backend`). On "Arranca Fx" do only that sprint: short plan (≤10 lines), wait for OK.
- Track tasks in `docs/CHECKLIST.md`; tick items when done and tested.
- Commit each finished piece with a short Conventional Commit subject (no body) and push to `origin main`. Scan for secrets before pushing.
- Log skills in `docs/SKILLS_LOG.md` and subagents in `docs/AGENTS_LOG.md` (real uses only).
