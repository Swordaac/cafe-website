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
