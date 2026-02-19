# ProSignal Analytics (MVP)

ProSignal Analytics is a Next.js + Supabase web app for publishing daily “Daily Transformation Trigger Summary” reports.

## What’s included
- Admin workflow: **paste → preview → publish**
- Robust report parser for the provided format
- Public report viewer + archive links
- Public search endpoint
- Admin follow-up tracking (status + action log timeline)
- Supabase schema + RLS policies
- PDF endpoint and public email-to-self endpoint with rate limiting

## 1) Create a Supabase project
1. Go to Supabase and create a new project.
2. Copy your **Project URL** and **Anon key** from Project Settings → API.
3. Copy your **Service role key** (server-only secret).

## 2) Run SQL migration
1. Open Supabase SQL Editor.
2. Paste contents of `supabase/migrations/0001_init.sql` and run it.
3. This creates all required tables, enums, and RLS policies.

## 3) Set up Auth
Use Email OTP magic links in Supabase Authentication.
- Enable email provider.
- Set your site URL (local and production).

## 4) Create admin allowlist
Insert your admin email in `admin_users` table.
```sql
insert into admin_users (email) values ('you@firm.com');
```
Only allowlisted emails can access `/admin` and admin APIs.

## 5) Environment variables
Copy `.env.example` to `.env.local` and fill:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `BASE_URL` (e.g. `http://localhost:3000`)
- `RATE_LIMIT_SECRET`

## 6) Run locally
```bash
npm install
npm run dev
```

## 7) Deploy to Vercel
1. Push this repo to GitHub.
2. Import into Vercel.
3. Add all environment variables in Vercel Project Settings.
4. Deploy.

## 8) Daily workflow for non-developers
1. Visit `/login` and request a magic link.
2. Open `/admin`.
3. Paste full daily report into textarea.
4. Click **Preview parse** and confirm date/signals.
5. Click **Save** with publish toggle on.
6. Public users view report at `/reports/YYYY-MM-DD`.

## Core routes
- Public:
  - `/`
  - `/reports/latest`
  - `/reports/[date]`
  - `GET /api/search?q=...`
  - `GET /api/reports/[date]/pdf`
  - `POST /api/reports/[date]/email`
- Admin:
  - `/admin`
  - `/admin/reports/[date]`
  - `/admin/follow-ups`
  - `POST /api/admin/reports`

## Notes
- The PDF endpoint currently returns printable HTML and is structured to swap to Playwright rendering for production-grade PDFs on Vercel.
- Public email endpoint is rate-limited to 3 requests/hour per IP in-memory.
- Parser tests use the provided sample fixture in `tests/sample-report.fixture.txt`.
