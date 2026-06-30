# Infra (later)

Docker is **not** used during local development for now. When you're ready to dockerize, use `docker-compose.yml` as a starting point for Redis and PostgreSQL.

Until then, run services natively or skip them — the API works without Redis/Postgres for presigned uploads and basic job routing.
