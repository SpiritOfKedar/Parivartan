import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { isDatabaseConfigured } from "./config/db.js";
import { isRedisConfigured } from "./config/redis.js";
import { isStorageConfigured } from "./config/storage.js";
import { runMigrations } from "./db/migrate.js";
import { jobsRouter } from "./routes/jobs.js";
import { aiRouter } from "./routes/ai.js";
import { healthRouter } from "./routes/health.js";
import { uploadsRouter } from "./routes/uploads.js";

const app = express();
const port = Number(process.env.PORT ?? 8788);

app.use(helmet());
app.use(cors({ origin: process.env.WEB_ORIGIN ?? "http://localhost:5174" }));
app.use(express.json({ limit: "1mb" }));

app.use("/health", healthRouter);
app.use("/api/uploads", uploadsRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/ai", aiRouter);

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  },
);

async function start() {
  if (isDatabaseConfigured()) {
    await runMigrations();
  }

  app.listen(port, () => {
    const storage = isStorageConfigured() ? "Backblaze B2" : "not configured";
    const database = isDatabaseConfigured() ? "Neon Postgres" : "not configured";
    const redis = isRedisConfigured() ? "Upstash Redis" : "not configured";
    console.log(
      `API listening on http://localhost:${port} (storage: ${storage}, db: ${database}, redis: ${redis})`,
    );
  });
}

start().catch((error) => {
  console.error("Failed to start API:", error);
  process.exit(1);
});
