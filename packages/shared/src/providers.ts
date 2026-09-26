import { z } from "zod";

/**
 * Skcode agent 提供方的单一真源。
 *
 * 类型 SkcodeProvider、运行时 schema skcodeProviderSchema 都从这里派生,
 * 避免各处内联 z.enum([...]) 副本随新增/删除 provider 漂移。
 * 本模块只依赖 zod(叶子),可被 validation / skcode-protocol 等无环引用。
 */
const SKCODE_PROVIDERS = ["glm"] as const;

export const skcodeProviderSchema = z.enum(SKCODE_PROVIDERS);

export type SkcodeProvider = (typeof SKCODE_PROVIDERS)[number];
