# Nuhani

E-commerce storefront + admin for the Nuhani clothing brand (Bangladesh market).
Built from the `babys_moms_v1` template — rebranded, re-secured and redesigned. See `../docs/AUDIT-babys_moms_v1.md` and `../docs/NUHANI-BLUEPRINT.md`.

## Stack

Vite 5 · React 18 · TypeScript · Tailwind CSS 3 · react-router 6 · Supabase (Postgres + RLS + edge functions) · deployed as a SPA (Vercel).

## Local development

```bash
npm install
cp .env.example .env   # fill in your Supabase project URL + anon key
npm run dev            # http://localhost:5173
```

## Supabase setup

> **Status: already provisioned (2026-09-08).** The project database exists, all 16 migrations
> are applied, demo data is seeded, and an admin account exists. The steps below are only
> needed for a brand-new Supabase project.

1. Create a project at https://supabase.com (region: Singapore is closest to BD).
2. Apply every file in `supabase/migrations/` **in filename order** — via `supabase link` + `supabase db push`, or by pasting each file into the SQL Editor.
3. The seed migration creates demo categories/products/coupons (safe to delete via admin later).
4. Create your admin user: sign up through the app once, then in the SQL Editor run:
   ```sql
   update profiles set role = 'admin' where email = 'you@example.com';
   ```
5. Set the edge-function secrets (Project Settings → Edge Functions):
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (auto-provided in production)
   - `RESEND_API_KEY` (newsletter/contact email)
   - `PUBLIC_SITE_URL` (your deployed site origin, e.g. `https://nuhani.com` — **required in production** for payment redirect URLs)

Payment gateway, courier and Telegram credentials are configured per-environment in the admin panel (Admin → Settings) and are stored server-side only.

## Environment variables

See `.env.example` (client) — the app requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

## Deploy (Vercel)

Import the repo, framework preset **Vite**, build `npm run build`, output `dist`. Add the two `VITE_` env vars. The SPA rewrite is already configured in `vercel.json`.

## Brand touchpoints (update when going live)

- Domain: `nuhani.com` placeholders in `index.html`, `src/components/Seo.tsx`, `public/sitemap.xml`
- Logo: `public/logo.svg` (placeholder wordmark) + favicon set
- Hero/OG imagery: placeholder remote images — replace via Admin → Settings
- Order number prefix: `NU-`
