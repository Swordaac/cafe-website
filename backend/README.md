## Stripe Connect Backend

### Environment variables

Add to your `.env` in `backend/`:

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_APP_FEE_BPS=1000
STRIPE_DEFAULT_CURRENCY=usd
```

### Models

- Tenant: extended with `stripe.accountId`, `chargesEnabled`, `payoutsEnabled`, `detailsSubmitted`, `onboardingCompletedAt`.
- PlatformConfig: singleton (`_id: platform`) storing `applicationFeeBps`, `defaultCurrency`.
- Transaction: records PaymentIntent lifecycle per tenant.
- StripeEvent: stores webhook events with idempotent processing.

### Endpoints

- POST `/v1/tenants/:tenantId/stripe/account-link` → returns onboarding link
- GET `/v1/tenants/:tenantId/stripe/account` → returns connect status
- POST `/v1/payments/intent` with header `x-tenant-id` → creates PaymentIntent on connected account with platform application fee
- POST `/v1/webhooks/stripe` → Stripe webhook (raw body)

### Webhook registration

The webhook is mounted before JSON parsing to allow signature verification: see `src/app.ts`.

### Testing with Stripe CLI

1. Login: `stripe login`
2. Forward webhooks: `stripe listen --forward-to localhost:4000/v1/webhooks/stripe`
   - Copy the `webhook signing secret` into `STRIPE_WEBHOOK_SECRET`.
3. Create onboarding link:

```bash
curl -X POST http://localhost:4000/v1/tenants/<tenantId>/stripe/account-link \
  -H 'Authorization: Bearer <SUPABASE_JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"returnUrl":"http://localhost:3000/return","refreshUrl":"http://localhost:3000/refresh"}'
```

4. Create PaymentIntent (after onboarding):

```bash
curl -X POST http://localhost:4000/v1/payments/intent \
  -H 'x-tenant-id: <tenantId>' \
  -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: test-123' \
  -d '{"amount":1999,"currency":"usd","description":"Test order","metadata":{"orderId":"o_123"}}'
```

5. Trigger test events:

```bash
stripe trigger payment_intent.succeeded
```

### Scripts

- `pnpm run test:stripe` checks Stripe API reachability.

### Deployment notes

- Ensure the webhook endpoint is publicly reachable and `STRIPE_WEBHOOK_SECRET` is set per environment.
- Always mount webhook before any JSON body parser.
- For production, secure CORS and authentication accordingly.

# Cafe Backend (Express + TypeScript)

Multi-tenant backend for cafes/restaurants with shared MongoDB schema and row-based isolation.

## Features
- Express + TypeScript, Helmet, CORS, compression
- MongoDB Atlas via Mongoose
- Supabase JWT auth (verify with `SUPABASE_JWT_SECRET`)
- Tenant resolution via header/subdomain/path
- Row-based isolation using `tenantId` on documents

## Env
Create `.env` based on:

```
PORT=4000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/cafe_app?retryWrites=true&w=majority
SUPABASE_JWT_SECRET=your_supabase_jwt_secret
ALLOWED_ORIGINS=http://localhost:3000
TENANT_STRATEGY=header
TENANT_HEADER=x-tenant-id
BASE_DOMAIN=localhost
```

## Scripts
- `pnpm dev` – run dev server with ts-node-dev
- `pnpm build` – compile TypeScript to `dist/`
- `pnpm start` – run compiled server

## API
- `GET /v1/health`
- `GET /v1/menu-items` – requires `Authorization: Bearer <token>` and tenant resolution
- `POST /v1/menu-items` – create
- `PATCH /v1/menu-items/:id` – update
- `DELETE /v1/menu-items/:id` – delete

Tenant can be provided by:
- Header: `x-tenant-id: tenant_slug`
- Subdomain: `tenant_slug.localhost`
- Path: `/v1/:tenant/menu-items`

## Development
1. `cd backend`
2. `pnpm i`
3. Create `.env`
4. `pnpm dev`




