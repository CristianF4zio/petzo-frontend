# Petzo

Dog and cat adoption app for Gran Caracas. Source of truth: `docs/SPEC.md` — read only the section you need (§14 data model, §15 RLS, §16 sprints, §10 decisions).

## Stack
- `apps/mobile`: React Native + Expo (TS). Delivered as EAS APK + Expo Go. See `apps/mobile/AGENTS.md` (Expo changes fast: check versioned docs, use `npx expo install`).
- `apps/api`: Node + Express (TS), REST + Swagger. Only component that touches Supabase with `service_role`.
- `apps/admin`: React + Vite (TS).
- `supabase/`: Postgres + Auth (email/password, Google) + Storage. Migrations in `supabase/migrations`.
- AI: Claude Haiku 5.5 (`claude-haiku-5-5`) via `@anthropic-ai/sdk`. n8n: flow 1 moderation, flow 2 notifications. Stagehand: Instagram import worker.

## Commands
- API: `cd apps/api && npm run dev` (tsx watch, loads `.env`; Swagger at `/docs`) · `npm run typecheck` · `npm run smoke` (E2E against local Supabase, must be running)
- Mobile: `cd apps/mobile && npx expo start` · `npx tsc --noEmit`
- Admin: `cd apps/admin && npm run dev` · `npm run build`
- DB local: `npx supabase start` · `npx supabase db reset` (reapplies migrations). Ports are 553xx (543xx taken by another local project).
- DB cloud: `. ./.env && npx supabase db push --db-url "postgresql://postgres.zcaiksgwvadoumcntrzx:$SUPABASE_DB_PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres"` (session pooler; direct host is IPv6-only)

Apps are independent npm projects (no workspaces): Expo and Vite pin different React versions.

## Architecture rules
- Supabase only authenticates. The API validates the JWT and authorizes everything; `/admin/*` checks `profiles.role = 'admin'`.
- All writes go through the API (`service_role`). RLS is on for every table with SELECT-only policies (§15). Never add write policies.
- No Supabase Edge Functions.
- Schema changes = new migration file; never edit an applied one.
- Plan limits (free 3 / pro 30 active pets) are enforced in the API, counting `pending_review` + `approved`.
- WhatsApp is only returned when an approved request links both users.
- Uploads: API issues signed upload URLs for bucket `pet-photos`; deletes photos when a pet is rejected.

## AI rules
- Never send `temperature`, `top_p` or assistant prefill (Haiku 5.5 rejects them). Ask for short JSON, validate with zod.
- Log every AI call in `ai_logs` (task, model, tokens, result).
- Daily token cap from env `AI_DAILY_TOKEN_CAP`; over it, AI is skipped and items stay `pending_review`.
- If AI or n8n fail, nothing is lost: the pet stays `pending_review`.
- n8n calls back `/internal/*` with header `x-internal-secret`.

## Conventions
- Code, names and commits in English (Conventional Commits). UI text in Spanish.
- Secrets only in `.env` (gitignored); each app has `.env.example`. Never hardcode keys.

## Workflow
- Sprints per SPEC §16; on "Arranca Sx" do only that sprint. Short plan (≤10 lines) and wait for OK.
- Track tasks in `docs/CHECKLIST.md`: tick items as they are done and tested; add new tasks there before starting them.
- Close each sprint: run what can be tested, commit, report (≤15 lines).
- Log skills in `docs/SKILLS_LOG.md` and subagents in `docs/AGENTS_LOG.md` (only real uses).
