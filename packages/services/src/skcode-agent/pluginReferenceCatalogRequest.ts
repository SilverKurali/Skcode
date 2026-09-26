import {
  skcodeProtocolMethods,
  skcodePluginsReferenceCatalogResultSchema,
  type SkcodePluginsReferenceCatalogParams,
} from "@skcode/shared";
import type { SkcodeProtocolClient } from "#src/skcode-agent/skcodeProtocolClient.js";

/** 旧协议严格校验响应；新展示字段走独立入口，只有 -32601 能证明旧 Agent 不支持。 */
export async function requestPluginReferenceCatalog(
  client: Pick<SkcodeProtocolClient, "request">,
  params: SkcodePluginsReferenceCatalogParams,
) {
  try {
    return await client.request(
      skcodeProtocolMethods.pluginsReferenceCatalogWithCategory,
      params,
      skcodePluginsReferenceCatalogResultSchema,
    );
  } catch (error) {
    if (!(typeof error === "object" && error !== null && "code" in error && error.code === -32601))
      throw error;
    return client.request(
      skcodeProtocolMethods.pluginsReferenceCatalog,
      params,
      skcodePluginsReferenceCatalogResultSchema,
    );
  }
}
