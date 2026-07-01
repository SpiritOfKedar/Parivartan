import { Router } from "express";
import { z } from "zod";
import {
  getConfiguredProviders,
  isAiConfigured,
  runAiCompletion,
  type AiProvider,
} from "../lib/ai/index.js";

export const aiRouter = Router();

const providerSchema = z.enum(["gemini", "nvidia-nim"]);

const summarizeSchema = z.object({
  text: z.string().min(40).max(120_000),
  provider: providerSchema,
});

const translateSchema = z.object({
  text: z.string().min(40).max(120_000),
  targetLanguage: z.string().min(2).max(80),
  provider: providerSchema,
});

aiRouter.get("/providers", (_req, res) => {
  res.json({ providers: getConfiguredProviders() });
});

aiRouter.post("/summarize", async (req, res, next) => {
  try {
    const parsed = summarizeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const { text, provider } = parsed.data;
    if (!isAiConfigured(provider)) {
      res.status(503).json({
        error: `${provider} is not configured on the server.`,
      });
      return;
    }

    const result = await runAiCompletion({
      provider,
      systemPrompt:
        "You are a helpful assistant that summarizes documents clearly and accurately. Use concise paragraphs and bullet points when helpful.",
      userPrompt: `Summarize the following PDF text:\n\n${text}`,
    });

    res.json({ result });
  } catch (error) {
    next(error);
  }
});

aiRouter.post("/translate", async (req, res, next) => {
  try {
    const parsed = translateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const { text, targetLanguage, provider } = parsed.data;
    if (!isAiConfigured(provider)) {
      res.status(503).json({
        error: `${provider} is not configured on the server.`,
      });
      return;
    }

    const result = await runAiCompletion({
      provider,
      systemPrompt:
        "You are a professional translator. Preserve meaning, structure, and paragraph breaks. Return only the translated text.",
      userPrompt: `Translate the following text to ${targetLanguage}:\n\n${text}`,
    });

    res.json({ result });
  } catch (error) {
    next(error);
  }
});

export type { AiProvider };
