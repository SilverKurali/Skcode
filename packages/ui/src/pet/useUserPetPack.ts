import { useEffect, useState } from "react";
import { BUILTIN_PET_PACK_ID, type PetMoodAssetKey } from "@skcode/shared";
import { usePlatform } from "@/hooks/usePlatform.js";
import { logger } from "@/logger.js";

/** 单个情绪位的可用资产：视频优先于静态图（data URL）。 */
export interface PetAsset {
  image: string;
  video?: string;
}

/** 情绪气泡台词池 key → 文案数组。 */
export type PackMoodLines = Partial<Record<string, string[]>>;

/** 已加载的用户宠物包资产与文案。 */
export interface LoadedPetPack {
  name: string;
  idle: PetAsset;
  working: PetAsset;
  /** v5 扩展情绪位资产（缺失的 key 由渲染层回退 idle/working）。 */
  moodAssets: Partial<Record<PetMoodAssetKey, PetAsset>>;
  chatterLines: string[];
  petLines: string[];
  dizzyLine?: string;
  greetLines: string[];
  moodLines: PackMoodLines;
}

const userPackCache = new Map<string, LoadedPetPack>();

export function isBuiltinPetPack(packId: string): boolean {
  return packId === BUILTIN_PET_PACK_ID;
}

/** 加载用户自定义宠物包；undefined=加载中，null=失败/非用户包，其余为已就绪资产。 */
export function useUserPetPack(enabled: boolean, packId: string): LoadedPetPack | null | undefined {
  const platform = usePlatform();
  const [loaded, setLoaded] = useState<LoadedPetPack | null | undefined>(() =>
    userPackCache.get(packId),
  );

  useEffect(() => {
    if (!enabled || isBuiltinPetPack(packId)) {
      setLoaded(null);
      return;
    }
    const cached = userPackCache.get(packId);
    if (cached) {
      setLoaded(cached);
      return;
    }
    let cancelled = false;
    setLoaded(undefined);
    void (async () => {
      try {
        const { packs } = (await platform.listPetPacks?.()) ?? { packs: [] };
        const summary = packs.find((pack) => pack.id === packId);
        if (!summary) {
          throw new Error(`pet pack not found: ${packId}`);
        }
        const manifest = summary.manifest;
        const readAsset = async (file?: string): Promise<string | undefined> => {
          if (!file) return undefined;
          const result = await platform.readPetAsset?.(packId, file);
          return result?.dataUrl;
        };
        const [idleImage, workingImage, idleVideo, workingVideo] = await Promise.all([
          readAsset(manifest.idleImage),
          readAsset(manifest.workingImage),
          readAsset(manifest.idleVideo),
          readAsset(manifest.workingVideo),
        ]);
        if (!idleImage) {
          throw new Error(`pet pack idle asset missing: ${packId}`);
        }
        // v5 情绪位：video 与 image 并行加载，成对组合，缺 video 只用静态图。
        const moodAssets: LoadedPetPack["moodAssets"] = {};
        const moodKeys = new Set([
          ...Object.keys(manifest.moodVideos ?? {}),
          ...Object.keys(manifest.moodImages ?? {}),
        ]) as Set<PetMoodAssetKey>;
        await Promise.all(
          [...moodKeys].map(async (key) => {
            const [image, video] = await Promise.all([
              readAsset(manifest.moodImages?.[key]),
              readAsset(manifest.moodVideos?.[key]),
            ]);
            // 静态图是兜底底线：只给视频不给图的情绪位不收（渲染层走 idle/working 回退链）。
            if (image) {
              moodAssets[key] = { image, video };
            }
          }),
        );
        const pack: LoadedPetPack = {
          name: manifest.name,
          idle: { image: idleImage, video: idleVideo },
          working: {
            image: workingImage ?? idleImage,
            video: workingVideo ?? idleVideo,
          },
          moodAssets,
          chatterLines: manifest.chatterLines ?? [],
          petLines: manifest.petLines ?? [],
          dizzyLine: manifest.dizzyLine,
          greetLines: manifest.greetLines ?? [],
          moodLines: (manifest.moodLines as PackMoodLines | undefined) ?? {},
        };
        userPackCache.set(packId, pack);
        if (!cancelled) {
          setLoaded(pack);
        }
      } catch (error) {
        logger.warn("[pet] 用户宠物包加载失败，回退内置 SilverKorali", { packId, error });
        if (!cancelled) {
          setLoaded(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, packId, platform]);

  return loaded;
}
