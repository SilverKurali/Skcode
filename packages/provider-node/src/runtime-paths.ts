export const SKCODE_BUILTIN_PROVIDER_CONFIG_FILE_ENV = "SKCODE_BUILTIN_PROVIDER_CONFIG_FILE";
export const SKCODE_BUILTIN_PROVIDER_BUNDLED_CONFIG_FILE_ENV =
  "SKCODE_BUILTIN_PROVIDER_BUNDLED_CONFIG_FILE";
export const SKCODE_PERSONAL_PROVIDER_CONFIG_FILE_ENV = "SKCODE_PERSONAL_PROVIDER_CONFIG_FILE";
export const PERSONAL_PROVIDER_CONFIG_FILE_NAME = "provider_config.json";

export interface NodeProviderRuntimePaths {
  readonly skcodeBuiltinFilePath: string;
  readonly personalFilePath: string;
}

export function createNodeProviderRuntimePathEnv(
  paths: NodeProviderRuntimePaths,
): Record<string, string> {
  return {
    [SKCODE_BUILTIN_PROVIDER_CONFIG_FILE_ENV]: paths.skcodeBuiltinFilePath,
    [SKCODE_PERSONAL_PROVIDER_CONFIG_FILE_ENV]: paths.personalFilePath,
  };
}

export function resolveNodeProviderRuntimePaths(
  env: Readonly<Record<string, string | undefined>>,
): NodeProviderRuntimePaths | null {
  const skcodeBuiltinFilePath = env[SKCODE_BUILTIN_PROVIDER_CONFIG_FILE_ENV]?.trim();
  const personalFilePath = env[SKCODE_PERSONAL_PROVIDER_CONFIG_FILE_ENV]?.trim();
  if (!skcodeBuiltinFilePath && !personalFilePath) return null;
  if (!skcodeBuiltinFilePath || !personalFilePath) {
    throw new Error("Skcode Built-in 与 Personal Provider Config 路径必须同时提供");
  }
  return Object.freeze({ skcodeBuiltinFilePath, personalFilePath });
}
