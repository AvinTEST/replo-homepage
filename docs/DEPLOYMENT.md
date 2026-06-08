# Replo Live Deployment Guide

This guide prepares the Replo homepage MVP for `https://replo.kr`.

## Target

- Production domain: `https://replo.kr`
- Optional redirect domain: `https://www.replo.kr`
- Hosting recommendation: Vercel
- Database/Auth: Supabase

## Preflight

Run these locally before deploying:

```bash
npm install
npm run build
```

Expected production routes:

- `/`: redirects to `/replo-original/index.html`
- `/replo-original/index.html`: public homepage
- Homepage CTA modal: diagnosis request form
- `/api/diagnosis`: diagnosis request insert API
- `/dashboard`: protected customer dashboard
- `/demo/dashboard`: public demo dashboard

## Required Environment Variables

Set these in Vercel Project Settings.

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=https://replo.kr
```

Optional server-only diagnosis webhook variables:

```bash
SUPABASE_SERVICE_ROLE_KEY=
DIAGNOSIS_WEBHOOK_URL=
DIAGNOSIS_WEBHOOK_SECRET=
```

Set `DIAGNOSIS_WEBHOOK_URL` in Vercel Project Settings -> Environment Variables, then redeploy. Do not prefix it with `NEXT_PUBLIC_`; variables with that prefix can be bundled into browser code, while the webhook URL and optional secret must stay server-only.

The diagnosis API also applies a lightweight in-process IP rate limit before inserting into Supabase. For high-volume production abuse protection, add an edge/WAF rate limit or CAPTCHA in front of this endpoint.

Keep these unset until StepPay production documentation is confirmed:

```bash
STEPPAY_SECRET_TOKEN=
STEPPAY_API_BASE_URL=
STEPPAY_ALLOWED_REDIRECT_ORIGINS=
```

When StepPay is enabled, set `STEPPAY_ALLOWED_REDIRECT_ORIGINS` to the exact HTTPS origin(s) that StepPay may return, separated by commas. Unlisted external redirect URLs are replaced with `/dashboard`.

`SUPABASE_SERVICE_ROLE_KEY` is server-only and must never use the `NEXT_PUBLIC_` prefix. The diagnosis API uses it only for internal webhook delivery status updates; public lead data remains protected by RLS.

## Supabase Setup

Run `docs/supabase.sql` in the Supabase SQL Editor.

This creates:

- `public.diagnosis_responses`
- RLS enabled
- Public anon insert policy for the homepage diagnosis form
- Website URL column: `website_url`
- Webhook tracking columns: `webhook_status`, `webhook_sent_at`, `webhook_error`
- Customer and billing RLS policies for `customers`, `subscriptions`, `payment_methods`, and `billing_events`

After running the SQL, test one diagnosis form submission and confirm a row appears in `diagnosis_responses`. Check `webhook_status`: `skipped` means no webhook URL was configured, `sent` means delivery succeeded, and `failed` means the lead was saved but webhook delivery failed.

## Vercel Setup

1. Create a GitHub repository for this project.
2. Push the project to GitHub.
3. Create a Vercel project from that repository.
4. Use default Next.js settings:
   - Install command: `npm install`
   - Build command: `npm run build`
   - Output directory: Next.js default
5. Add the required environment variables.
6. Deploy once to the temporary Vercel preview URL.
7. Test the preview URL before connecting `replo.kr`.

## DNS Setup For replo.kr

In Vercel, add:

- `replo.kr`
- `www.replo.kr` if desired

Then update DNS where the domain is managed. Vercel will show the exact records. Common setup:

```text
replo.kr      A      76.76.21.21
www.replo.kr  CNAME  cname.vercel-dns.com
```

Use Vercel as the source of truth if it shows different values.

Recommended canonical behavior:

- Primary: `https://replo.kr`
- Redirect: `https://www.replo.kr` -> `https://replo.kr`

## Launch QA

Before announcing the site:

- Open `https://replo.kr`.
- Confirm the homepage renders the original Replo design.
- Confirm the brand strip is hidden.
- Confirm customer review cards are masked and auto-scroll right to left.
- Confirm no unmasked customer or brand names appear in public review/brand sections.
- Click `무료 운영 진단 받기`.
- Confirm the modal opens without page navigation.
- Confirm custom dropdowns match the modal design.
- Submit a test diagnosis request.
- Confirm Supabase stores the row.
- If `DIAGNOSIS_WEBHOOK_URL` is configured, confirm the webhook receiver gets a `diagnosis_response.created` POST.
- Confirm `diagnosis_responses.webhook_status` is `sent`, `failed`, or `skipped`.
- Confirm `/dashboard` still requires login.
- Confirm `/demo/dashboard` remains public.
- Confirm no card number, CVC, billing password, or raw payment data fields exist.

## Post-Launch

- Monitor Vercel build/runtime logs.
- Monitor Supabase inserts and API errors.
- Add notification automation for new diagnosis requests if needed.
- Implement StepPay only after the official API documentation and production credentials are available.
