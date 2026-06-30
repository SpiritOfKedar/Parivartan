import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { isStorageConfigured } from "./config/storage.js";
import { jobsRouter } from "./routes/jobs.js";
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

app.listen(port, () => {
  const storage = isStorageConfigured() ? "Backblaze B2" : "not configured";
  console.log(`API listening on http://localhost:${port} (storage: ${storage})`);
});
