export type AiProvider = "gemini" | "nvidia-nim";

export interface AiCompletionRequest {
  systemPrompt: string;
  userPrompt: string;
  provider: AiProvider;
}

export interface AiCompletionResult {
  text: string;
  provider: AiProvider;
  model: string;
}

export function isAiConfigured(provider: AiProvider): boolean {
  if (provider === "gemini") {
    return Boolean(process.env.GEMINI_API_KEY);
  }
  return Boolean(process.env.NVIDIA_NIM_API_KEY);
}

export function getConfiguredProviders(): AiProvider[] {
  const providers: AiProvider[] = [];
  if (isAiConfigured("gemini")) {
    providers.push("gemini");
  }
  if (isAiConfigured("nvidia-nim")) {
    providers.push("nvidia-nim");
  }
  return providers;
}
