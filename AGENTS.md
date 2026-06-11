# Agent Instructions

Before changing the public homepage, diagnosis form, dashboard, payment page, or any UI component, read `docs/DESIGN_GUIDE.md` and follow it.

The original Claude-designed homepage at `public/replo-original/index.html` is the visual source of truth for the public homepage. Do not redesign, rebuild, or reinterpret it unless explicitly instructed.

The current diagnosis form direction is single-page dropdown-based, not multi-step. Do not use large radio option cards for the current version.

Do not expose login as the main public CTA unless explicitly instructed. Public homepage CTAs should route users toward `/contact`.

Preserve these routes unless a task explicitly changes them:

- `/`
- `/replo-original/index.html`
- `/contact`
- `/diagnosis` (redirects to `/contact`)
- `/login`
- `/auth/callback`
- `/mypage`
- `/dashboard`
- `/billing/payment-method`
- `/api/billing/change-payment-method`

Never commit `.env`, `.env.local`, `.env.*.local`, Supabase service role keys, StepPay secret tokens, or real customer payment data. Do not collect raw card data in public forms.
