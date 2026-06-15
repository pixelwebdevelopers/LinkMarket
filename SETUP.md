# Rankistic — setup & go-live checklist

This covers the manual steps needed to finish wiring the features. All secrets
live in `.env` (gitignored). See `.env.example` for the full list.

## 1. Database
The password-reset feature added a `PasswordResetToken` table. It has already
been pushed to the database with `npx prisma db push`. If you point at a fresh
database, run:

```bash
npx prisma db push
npx prisma generate
npm run db:seed   # seeds default settings + initial admin
```

## 2. Payments (Stripe) — live
1. **Rotate the secret key.** The `sk_live_…` key shared earlier is exposed —
   roll it at https://dashboard.stripe.com/apikeys and paste the NEW value into
   `STRIPE_SECRET_KEY` in `.env`. The publishable key (`pk_live_…`) is already set.
2. **Create a webhook** at https://dashboard.stripe.com/webhooks:
   - Endpoint URL: `https://app.rankistic.com/api/stripe/webhook`
   - Events: `checkout.session.completed`, `payment_intent.succeeded`,
     `payment_intent.payment_failed`, `charge.refunded`
   - Copy the **Signing secret** (`whsec_…`) into `STRIPE_WEBHOOK_SECRET`.
3. Set `NEXT_PUBLIC_APP_URL=https://app.rankistic.com` (used for redirect URLs).

Local testing: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
and use the `whsec_…` it prints.

### The webhook is now OPTIONAL (verify-on-return)
You do **not** have to set up the webhook for payments to settle. The app
reconciles payments by asking Stripe directly:

- When a customer returns to their order page after paying, the order is
  verified against Stripe and marked PAID immediately.
- Every time an orders list is opened, any still-pending orders in scope are
  re-checked against Stripe (the admin "Orders" view sees *all* pending orders,
  so it acts as a catch-all sweep for customers who paid but never returned).

Both paths funnel through the same atomic, idempotent settle logic the webhook
uses (`lib/payments.ts → settleOrderPaid`), so an order can never be double-
charged in the ledger or left stuck unpaid, whether or not the webhook exists.

You only need `STRIPE_SECRET_KEY`, the publishable key, and `NEXT_PUBLIC_APP_URL`
for this to work. The webhook (`STRIPE_WEBHOOK_SECRET`) remains supported and is
still recommended as an extra backstop, but is no longer required.

## 3. Email (SMTP)
Email is sent via SMTP. Fill these in `.env` with any provider (free options:
Gmail app password, Brevo, Mailgun, Mailtrap):

```
SMTP_HOST="smtp.yourprovider.com"
SMTP_PORT="587"          # or 465 with SMTP_SECURE="true"
SMTP_USER="..."
SMTP_PASS="..."
EMAIL_FROM="Rankistic <notifications@rankistic.com>"
```

If `SMTP_HOST` is empty the app falls back to Resend (`RESEND_API_KEY`); if
neither is set, emails are logged and skipped (the app keeps working).

Emails fire for: order paid, payment failed, refunds, password reset, and
support requests. The "from"/support addresses use `@rankistic.com` — make sure
your SMTP provider is allowed to send as that domain (SPF/DKIM) for inbox
delivery.

## 3b. Email verification on signup
New accounts must confirm their email — but this is **only enforced when an
email transport is configured** (`SMTP_*` or `RESEND_API_KEY`). Behaviour:

- **Email configured:** signup creates an unverified account, sends a "Confirm
  your email" link (24h, single-use), and the user must verify before they can
  log in. Unverified login is blocked; the login page offers "Resend link".
- **Email NOT configured (current state):** accounts are **auto-verified** at
  signup so the app keeps working. The moment you add SMTP, verification turns
  on automatically for new signups.

Existing accounts were grandfathered (marked verified), so enabling SMTP later
won't lock anyone out. The seeded admin is pre-verified.

## 4. Features added
- **Forgot password** — `/forgot-password` + `/reset-password` (1h single-use token).
- **Support** — `/support` page (FAQ + contact form) → emails the support inbox
  and notifies admins in-app. Linked from the footer and user menu.
- **Bulk CSV import** — reseller: `/reseller/bulk`, admin: `/admin/sites/bulk`.
  Download the template from the page. Matches sites by URL (create + update),
  sets metrics and Guest Post / Niche Edit prices.
- **Marketplace gate** — visiting `/marketplace` requires an account; logged-out
  users are redirected to login and returned afterwards.
