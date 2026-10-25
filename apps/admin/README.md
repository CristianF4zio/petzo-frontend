# Petzo · Panel admin

React + Vite. Every call goes to the Petzo API (`VITE_API_URL` + `/api`); the panel never talks to Supabase.

```bash
cp .env.example .env   # VITE_API_URL=http://localhost:8090
npm ci
npm run dev            # http://localhost:5173
```

Needs the API running on `:8090` and a user with `profiles.role = 'admin'`.
For Google sign-in the API must allow `http://localhost:5173/auth-callback` as a redirect.

`npm run build` and `npm run lint` must pass before committing.
