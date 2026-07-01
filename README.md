# Convert Hub

Multi-format file conversion platform (PDF, images, audio, video) — monorepo.

## Structure

```
apps/
  web/          Next.js frontend (tool pages, upload UI, client WASM)
  api/          Express API (jobs, presigned URLs, auth)
packages/
  shared/       Shared TypeScript types (Job, Tool, etc.)
  conversion-rules/  Client vs server routing per tool
workers/
  document-worker/   PDF/Office conversions (BullMQ consumer)
  media-worker/      FFmpeg jobs (BullMQ consumer)
infra/
  docker-compose.yml  Reserved for later (not used in local dev)
```

## Default ports

| Service | Port | Override |
|---------|------|----------|
| Web | **5174** | `apps/web/package.json` dev script |
| API | **8788** | `PORT` in `apps/api/.env` |

(Avoids 3000/3001 which are often taken on dev machines.)

## Prerequisites

- Node.js 20+
- [Neon](https://neon.tech) Postgres project (free tier)
- [Upstash](https://upstash.com) Redis database (free tier)
- [Backblaze B2](https://www.backblaze.com/b2/cloud-storage.html) bucket (10 GB free tier)

No Docker required for local dev.

## Getting started

```bash
npm install

# Build shared packages (required before API/web can import them)
npm run build --workspace=@convert-hub/shared
npm run build --workspace=@convert-hub/conversion-rules

cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# Add Neon, Upstash, and B2 credentials to apps/api/.env, then:
npm run db:migrate --workspace=@convert-hub/api
npm run dev
```

- Web: http://localhost:5174
- API: http://localhost:8788/health

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start web + API in parallel (via Turborepo) |
| `npm run dev:worker` | Start the document conversion worker |
| `npm run build` | Build all packages and apps |
| `npm run typecheck` | Type-check all workspaces |
| `npm run db:migrate --workspace=@convert-hub/api` | Apply pending SQL migrations to Neon |

## Database (Neon Postgres)

Raw SQL only — no ORM. Migrations live in `apps/api/db/migrations/` and are tracked in a `schema_migrations` table.

```bash
# Apply pending migrations (also runs automatically on API startup)
npm run db:migrate --workspace=@convert-hub/api
```

Add new migrations as numbered files, e.g. `002_users.sql`. Each file runs once inside a transaction.

Set `DATABASE_URL` to your Neon **pooled** connection string in `apps/api/.env`.

## Queue (Upstash Redis)

Server-side jobs are pushed to `queue:server-jobs` via `ioredis` using the `rediss://` URL from the Upstash console. Set `UPSTASH_REDIS_URL` in `apps/api/.env` — the same URL works for BullMQ workers later.

## Storage (Backblaze B2)

Files upload **directly to B2** via presigned URLs — the API never buffers file bytes.

1. Create a B2 bucket (note the **region**, e.g. `us-west-004`)
2. Create an **Application Key** scoped to that bucket (read, write, delete)
3. Set `B2_KEY_ID`, `B2_APPLICATION_KEY`, `B2_BUCKET`, `B2_REGION` in `apps/api/.env`
4. In the B2 console, add **lifecycle rules** to auto-delete `incoming/` and `outputs/` after 24h (privacy)

**Presign upload**

```bash
curl -X POST http://localhost:8788/api/uploads/presign \
  -H "Content-Type: application/json" \
  -d '{"fileName":"doc.pdf","mimeType":"application/pdf","sizeBytes":1024}'
```

Returns `uploadUrl` — `PUT` the file to that URL with the `Content-Type` header.

## Next steps

1. Install LibreOffice and OCR tools on the machine running `document-worker`:
   - LibreOffice: `sudo dnf install libreoffice` (Fedora) or `sudo apt install libreoffice` (Debian/Ubuntu)
   - OCR (for scanned PDFs): `sudo dnf install ocrmypdf tesseract tesseract-langpack-eng`
2. Run `npm run dev` and `npm run dev:worker` in a second terminal
3. Set `NEXT_PUBLIC_API_URL` in `apps/web/.env.local` (see `apps/web/.env.example`)
4. Connect upload UI (Uppy) to the presign endpoint for additional server tools
