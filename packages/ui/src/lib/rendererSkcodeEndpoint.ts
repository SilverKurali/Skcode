import {
  buildRuntimeSkcodeEndpointUrls,
  SKCODE_ENV,
  type RuntimeSkcodeEndpointEnv,
} from "@skcode/shared";

interface RendererImportMetaEnv {
  VITE_SKCODE_BASE_URL?: string;
  VITE_SKCODE_ENDPOINT_ORIGIN?: string;
}

function readRendererImportMetaEnv(): RendererImportMetaEnv {
  return ((import.meta as ImportMeta & { env?: RendererImportMetaEnv }).env ??
    {}) as RendererImportMetaEnv;
}

function createRendererSkcodeEndpointEnv(
  env: RendererImportMetaEnv = readRendererImportMetaEnv(),
): RuntimeSkcodeEndpointEnv {
  return {
    SKCODE_ENV,
    // UI 侧的 zcode-plan 占位 provider 以前只看 SKCODE_ENV，
    // 没有消费 Vite 注入的 base url，导致自定义测试域名时 renderer 和 host/service 可能不一致。
    SKCODE_BASE_URL: env.VITE_SKCODE_BASE_URL,
    SKCODE_ENDPOINT_ORIGIN: env.VITE_SKCODE_ENDPOINT_ORIGIN,
  };
}

export const RENDERER_SKCODE_ENDPOINT_URLS = buildRuntimeSkcodeEndpointUrls(
  createRendererSkcodeEndpointEnv(),
);
