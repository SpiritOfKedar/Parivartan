import { Router } from "express";
import { isDatabaseConfigured } from "../config/db.js";
import { isRedisConfigured } from "../config/redis.js";
import { isStorageConfigured } from "../config/storage.js";
import { checkDatabaseConnection } from "../db/pool.js";
import { checkRedisConnection } from "../lib/queue.js";

export const healthRouter = Router();

healthRouter.get("/", async (_req, res) => {
  const [database, redis] = await Promise.all([
    isDatabaseConfigured() ? checkDatabaseConnection() : Promise.resolve(null),
    isRedisConfigured() ? checkRedisConnection() : Promise.resolve(null),
  ]);

  const checks = {
    database,
    redis,
    storage: isStorageConfigured(),
  };

  const requiredDown =
    (isDatabaseConfigured() && database === false) ||
    (isRedisConfigured() && redis === false);

  res.status(requiredDown ? 503 : 200).json({
    status: requiredDown ? "degraded" : "ok",
    service: "api",
    checks,
  });
});
