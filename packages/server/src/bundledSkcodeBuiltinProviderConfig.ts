import { materializeSkcodeBuiltinProviderConfig } from "@skcode/services/node";

declare const __SKCODE_BUILTIN_PROVIDER_CONFIG_JSON__: string | undefined;

interface MaterializeBundledSkcodeBuiltinProviderConfigOptions {
  readonly environmentConfigRoot: string;
  readonly content: string;
}

/** 返回构建时嵌入远端 Server 的 Skcode Built-in Provider Config。 */
export function readBundledSkcodeBuiltinProviderConfig(): string {
  if (typeof __SKCODE_BUILTIN_PROVIDER_CONFIG_JSON__ !== "string") {
    throw new Error("当前构建未嵌入 Skcode Built-in Provider Config");
  }
  return __SKCODE_BUILTIN_PROVIDER_CONFIG_JSON__;
}

/**
 * 将 Skcode Built-in Config 原子物化到所属环境的固定资源副本。
 * 升级前退出旧进程；不保留按内容 hash 增长的历史文件。
 */
export async function materializeBundledSkcodeBuiltinProviderConfig(
  options: MaterializeBundledSkcodeBuiltinProviderConfigOptions,
): Promise<string> {
  return materializeSkcodeBuiltinProviderConfig(options);
}
