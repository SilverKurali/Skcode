import { z } from "zod";

/** 宠物包 id：目录名与 manifest.id 共用的 slug 规则。 */
export const PET_PACK_ID_PATTERN = /^[a-z0-9][a-z0-9_-]{0,63}$/;

/** 包内资产文件名白名单：不允许任何路径分隔符，杜绝目录逃逸。 */
export const PET_PACK_ASSET_NAME_PATTERN = /^[\w][\w.-]{0,127}$/;

/** v5 扩展情绪位：内置 SilverKorali 全情绪视频化，用户包可选跟随。 */
export const PET_MOOD_ASSET_KEYS = [
  "greet",
  "celebrate",
  "sad",
  "thinking",
  "asking",
  "puzzled",
  "sleepy",
] as const;
export type PetMoodAssetKey = (typeof PET_MOOD_ASSET_KEYS)[number];

/** 情绪位可选资产组：视频优先于静态图。 */
export const petMoodAssetsSchema = z
  .object({
    greet: z.string().regex(PET_PACK_ASSET_NAME_PATTERN).optional(),
    celebrate: z.string().regex(PET_PACK_ASSET_NAME_PATTERN).optional(),
    sad: z.string().regex(PET_PACK_ASSET_NAME_PATTERN).optional(),
    thinking: z.string().regex(PET_PACK_ASSET_NAME_PATTERN).optional(),
    asking: z.string().regex(PET_PACK_ASSET_NAME_PATTERN).optional(),
    puzzled: z.string().regex(PET_PACK_ASSET_NAME_PATTERN).optional(),
    sleepy: z.string().regex(PET_PACK_ASSET_NAME_PATTERN).optional(),
  })
  .optional();

/** 情绪气泡随机池：按情绪分组，缺省回退内置 i18n。 */
export const petMoodLinesSchema = z
  .object({
    working: z.array(z.string().max(120)).max(10).optional(),
    permission: z.array(z.string().max(120)).max(10).optional(),
    question: z.array(z.string().max(120)).max(10).optional(),
    error: z.array(z.string().max(120)).max(10).optional(),
    done: z.array(z.string().max(120)).max(10).optional(),
    thinking: z.array(z.string().max(120)).max(10).optional(),
  })
  .optional();

export const petPackManifestSchema = z.object({
  id: z.string().regex(PET_PACK_ID_PATTERN),
  name: z.string().min(1).max(64),
  author: z.string().max(64).optional(),
  description: z.string().max(200).optional(),
  version: z.string().max(32).optional(),
  /** 待机立绘（必填），透明底 PNG 效果最佳。 */
  idleImage: z.string().regex(PET_PACK_ASSET_NAME_PATTERN),
  workingImage: z.string().regex(PET_PACK_ASSET_NAME_PATTERN).optional(),
  /** 待机/工作动作视频（可选：动态 WebP 或带 alpha 的 WebM，优先于静态图播放）。 */
  idleVideo: z.string().regex(PET_PACK_ASSET_NAME_PATTERN).optional(),
  workingVideo: z.string().regex(PET_PACK_ASSET_NAME_PATTERN).optional(),
  /** v5 扩展情绪位资产（可选；缺失按 idle→working 链回退）。 */
  moodVideos: petMoodAssetsSchema,
  moodImages: petMoodAssetsSchema,
  /** 随机搭话文案（字面量，不走 i18n）。 */
  chatterLines: z.array(z.string().max(120)).max(20).optional(),
  /** 被点击时的反应语。 */
  petLines: z.array(z.string().max(120)).max(20).optional(),
  /** 连点过快的晕眩语。 */
  dizzyLine: z.string().max(120).optional(),
  /** 打招呼（挂载一次性）台词池。 */
  greetLines: z.array(z.string().max(120)).max(10).optional(),
  /** 各情绪气泡随机池。 */
  moodLines: petMoodLinesSchema,
});

export type PetPackManifest = z.infer<typeof petPackManifestSchema>;

/** PetReadAsset IPC 的请求体。 */
export const petPackAssetRequestSchema = z.object({
  packId: z.string().regex(PET_PACK_ID_PATTERN),
  file: z.string().regex(PET_PACK_ASSET_NAME_PATTERN),
});

/** 设置页选择器用的包摘要（含完整清单，不含资产内容）。 */
export interface PetPackSummary {
  id: string;
  name: string;
  author?: string;
  description?: string;
  version?: string;
  hasWorkingImage: boolean;
  hasIdleVideo: boolean;
  hasWorkingVideo: boolean;
  manifest: PetPackManifest;
}

/** PetListPacks 的响应：包根目录（用于 AI 脚手架提示词）+ 全部合法包。 */
export interface PetPackListResult {
  rootDir: string;
  packs: PetPackSummary[];
}

/** 内置宠物包 id：资产随包分发，永远可用。 */
export const BUILTIN_PET_PACK_ID = "silverkorali";
