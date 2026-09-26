import { buildRuntimeSkcodeApiUrl, resolveZaiBusinessBaseUrl } from "@skcode/shared";

export const SKCODE_CLIENT_SCENES_URL = buildRuntimeSkcodeApiUrl(
  process.env,
  "/api/v1/client/scenes",
);

export const ZAI_API_HOST = resolveZaiBusinessBaseUrl(process.env);
