import type { AiCompletionRequest, AiCompletionResult } from "./types.js";

interface NimChatResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: { message?: string };
}

export async function completeWithNvidiaNim(
  request: AiCompletionRequest,
): Promise<AiCompletionResult> {
  const apiKey = process.env.NVIDIA_NIM_API_KEY;
  if (!apiKey) {
    throw new Error(
      "NVIDIA NIM is not configured. Set NVIDIA_NIM_API_KEY in apps/api/.env",
    );
  }

  const baseUrl =
    process.env.NVIDIA_NIM_BASE_URL ?? "https://integrate.api.nvidia.com/v1";
  const model =
    process.env.NVIDIA_NIM_MODEL ?? "meta/llama-3.1-8b-instruct";

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: request.systemPrompt },
        { role: "user", content: request.userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 4096,
      stream: false,
    }),
  });

  const data = (await response.json()) as NimChatResponse;
  if (!response.ok) {
    throw new Error(data.error?.message ?? "NVIDIA NIM request failed.");
  }

  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error("NVIDIA NIM returned an empty response.");
  }

  return { text, provider: "nvidia-nim", model };
}
