import { completeWithGemini } from "./gemini.js";
import { completeWithNvidiaNim } from "./nvidia-nim.js";
import type { AiCompletionRequest, AiCompletionResult } from "./types.js";

export async function runAiCompletion(
  request: AiCompletionRequest,
): Promise<AiCompletionResult> {
  if (request.provider === "gemini") {
    return completeWithGemini(request);
  }
  return completeWithNvidiaNim(request);
}

export { getConfiguredProviders, isAiConfigured } from "./types.js";
export type { AiProvider, AiCompletionResult } from "./types.js";
