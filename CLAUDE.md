# Petzo frontend

Mobile app of Petzo (dog/cat adoption, Gran Caracas). This repo is `petzo-frontend` (D-23): `apps/mobile`. Sibling repos: `petzo-backend` (Java 21 + Spring Boot API, D-22) and `petzo-web` (React + Vite admin portal) — never add their code here. Source of truth: `../SPEC.md` (workspace root, outside the repo; read only the section you need: §5 RF, §7 HU, §15 RLS, §16 sprints).

## Stack
- `apps/mobile`: React Native + Expo SDK 58 (TS), Expo Router in `src/app`. Delivered as EAS APK + Expo Go. Check the versioned Expo docs for the SDK in `package.json`; add packages with `npx expo install`. `android/` is generated (CNG): configure in `app.json`, never edit it by hand.
- Auth: only through the API (`/api/auth/register`, `login`, `refresh`, `logout`); session tokens live in `expo-secure-store` and `api()` refreshes once on 401. Google: the app opens `/api/auth/google/start` (flow + PKCE-style challenge) with `expo-web-browser`, the backend handles the callback and redirects back without tokens, then the app claims the session with `POST /api/auth/google/claim`. Every data call sends `Authorization: Bearer <access token>`.
- Design: `docs/design/Petzo.dc.html` (tokens + screens).

## Commands
- Mobile: `cd apps/mobile && npx expo start` · `npx tsc --noEmit` · `npx expo-doctor` · APK: `npx eas-cli@latest build -p android --profile preview`
- API for local dev: run `petzo-backend` (`./mvnw spring-boot:run`, port 8090). Swagger at `/swagger-ui.html`.

## Rules
- The app never talks to Supabase (no SDK, DB, Storage or Auth): only the backend does. No Supabase keys ship in the app.
- Contract = the API's Swagger (D-27): camelCase JSON, ProblemDetail errors with `code`, paginated catalog `{items, page, pageSize, total}`.
- WhatsApp is shown only through `GET /api/requests/{id}/contact` after approval (RNF-04).
- Publish (D-28): `POST /api/pets` creates a draft → per new photo: compress (≤ ~500 KB, RNF-06), multipart `POST /api/pets/{id}/photos/upload` (field `file`) → `{path}` → `PUT /api/pets/{id}/photos {paths}` with the whole gallery in order (first = cover) → `PATCH /api/pets/{id}/status {"status":"pending_review"}`.
- UI text in Spanish; code, names and commits in English. Secrets only in `.env` (each app has `.env.example`).

## Workflow
- Sprints per SPEC §16: F1 mobile and F3 delivery here (backend B0–B4 in `petzo-backend`, admin F2 in `petzo-web`). On "Arranca Fx" do only that sprint: short plan (≤10 lines), wait for OK.
- Track tasks in `docs/CHECKLIST.md`; tick items when done and tested.
- Commit each finished piece with a short Conventional Commit subject (no body) and push to `origin main`. Scan for secrets before pushing.
- Log skills in `docs/SKILLS_LOG.md` and subagents in `docs/AGENTS_LOG.md` (real uses only).
