import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import {
  PET_PACK_ASSET_NAME_PATTERN,
  PET_PACK_ID_PATTERN,
  petPackManifestSchema,
  type PetPackManifest,
  type PetPackListResult,
  type PetPackSummary,
} from "@skcode/shared";
import { getDataBaseDir } from "@skcode/services/node";
import { logger } from "./logger.js";

/** 用户自定义宠物包根目录：~/.skcode/v2/pets/<packId>/ */
export function resolvePetPacksRoot(): string {
  return join(getDataBaseDir(), "v2", "pets");
}

function resolvePackDir(packId: string): string {
  if (!PET_PACK_ID_PATTERN.test(packId)) {
    return "";
  }
  const packDir = resolve(join(resolvePetPacksRoot(), packId));
  const root = resolve(resolvePetPacksRoot());
  // 双保险：slug 白名单已排除分隔符，这里再确认解析结果没有逃出根目录。
  if (packDir !== root && !packDir.startsWith(root + sep)) {
    return "";
  }
  return packDir;
}

function parsePackManifest(packDir: string): PetPackManifest | null {
  const manifestPath = join(packDir, "petMood.json");
  if (!existsSync(manifestPath)) {
    return null;
  }
  try {
    const parsed = petPackManifestSchema.safeParse(JSON.parse(readFileSync(manifestPath, "utf-8")));
    if (!parsed.success) {
      logger.warn("[pet-packs] manifest 校验失败，跳过", {
        manifestPath,
        issues: parsed.error.issues.slice(0, 3),
      });
      return null;
    }
    const manifest = parsed.data;
    // 清单引用的必备资产必须真实存在，否则运行期只会得到裂图。
    if (!existsSync(join(packDir, manifest.idleImage))) {
      logger.warn("[pet-packs] idleImage 不存在，跳过", { manifestPath });
      return null;
    }
    return manifest;
  } catch (error) {
    logger.warn("[pet-packs] manifest 读取失败，跳过", { manifestPath, error });
    return null;
  }
}

export function listPetPacks(): PetPackListResult {
  const root = resolvePetPacksRoot();
  if (!existsSync(root)) {
    return { rootDir: root, packs: [] };
  }
  const summaries: PetPackSummary[] = [];
  let entries: string[] = [];
  try {
    entries = readdirSync(root, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
  } catch (error) {
    logger.warn("[pet-packs] 扫描失败", { root, error });
    return { rootDir: root, packs: [] };
  }
  for (const packId of entries) {
    if (!PET_PACK_ID_PATTERN.test(packId)) {
      continue;
    }
    const manifest = parsePackManifest(join(root, packId));
    if (!manifest) {
      continue;
    }
    summaries.push({
      id: manifest.id,
      name: manifest.name,
      author: manifest.author,
      description: manifest.description,
      version: manifest.version,
      hasWorkingImage: Boolean(manifest.workingImage),
      hasIdleVideo: Boolean(manifest.idleVideo),
      hasWorkingVideo: Boolean(manifest.workingVideo),
      manifest,
    });
  }
  return { rootDir: root, packs: summaries };
}

export function readPetAsset(packId: string, file: string): { dataUrl: string } | null {
  const packDir = resolvePackDir(packId);
  if (!packDir || !PET_PACK_ASSET_NAME_PATTERN.test(file)) {
    return null;
  }
  const assetPath = resolve(join(packDir, file));
  if (!assetPath.startsWith(packDir + sep)) {
    return null;
  }
  if (!existsSync(assetPath)) {
    return null;
  }
  const ext = file.split(".").pop()?.toLowerCase() ?? "";
  const mime =
    ext === "png"
      ? "image/png"
      : ext === "jpg" || ext === "jpeg"
        ? "image/jpeg"
        : ext === "webp"
          ? "image/webp"
          : ext === "gif"
            ? "image/gif"
            : ext === "webm"
              ? "video/webm"
              : ext === "mp4"
                ? "video/mp4"
                : null;
  if (!mime) {
    return null;
  }
  try {
    return { dataUrl: `data:${mime};base64,${readFileSync(assetPath).toString("base64")}` };
  } catch (error) {
    logger.warn("[pet-packs] 资产读取失败", { assetPath, error });
    return null;
  }
}
