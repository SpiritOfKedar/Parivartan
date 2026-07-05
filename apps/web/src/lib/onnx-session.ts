import type * as OrtNamespace from "onnxruntime-web";

const ORT_VERSION = "1.21.0";
const ORT_WASM_CDN = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VERSION}/dist/`;

let ortModule: typeof OrtNamespace | null = null;
let ortConfigured = false;
const sessionCache = new Map<string, OrtNamespace.InferenceSession>();

async function getOrt(): Promise<typeof OrtNamespace> {
  if (!ortModule) {
    ortModule = await import("onnxruntime-web");
  }

  if (!ortConfigured) {
    ortModule.env.wasm.wasmPaths = ORT_WASM_CDN;
    ortConfigured = true;
  }

  return ortModule;
}

export async function getOnnxSession(
  modelUrl: string,
): Promise<OrtNamespace.InferenceSession> {
  const cached = sessionCache.get(modelUrl);
  if (cached) {
    return cached;
  }

  const ort = await getOrt();
  const session = await ort.InferenceSession.create(modelUrl, {
    executionProviders: ["wasm"],
  });
  sessionCache.set(modelUrl, session);
  return session;
}
