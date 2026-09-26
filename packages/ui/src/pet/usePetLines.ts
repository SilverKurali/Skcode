/**
 * Skcode 宠物的台词池解析：随机搭话/被摸反应/晕眩/情绪气泡。
 * 用户包自定义文案优先，否则回退内置 i18n 池。见 specs/pet-system.md v5。
 */
import { useEffect, useMemo, useState } from "react";
import type { LoadedPetPack } from "@/pet/useUserPetPack.js";
import {
  BUILTIN_CHATTER_LINE_IDS,
  BUILTIN_DIZZY_LINE_IDS,
  BUILTIN_MOOD_VISUALS,
  BUILTIN_PET_LINE_IDS,
} from "@/pet/builtinPet.js";
import type { PetMood } from "@/pet/petMood.js";
import { pickAction } from "@/pet/petActions.js";
import { useSkcodeIntl } from "@/i18n/IntlProvider.js";

function formatIds(ids: readonly string[], format: (id: string) => string): string[] {
  return ids.map((id) => format(id));
}

export function usePetLines(
  usingPack: LoadedPetPack | null,
  displayMood: PetMood,
): {
  /** 随机搭话池。 */
  chatterLinePool: string[];
  /** 被摸反应语池。 */
  petLinePool: string[];
  /** 连点晕眩语池。 */
  dizzyLinePool: string[];
  /** 当前情绪的气泡台词（进入情绪时随机抽取；null=该情绪无气泡）。 */
  moodLine: string | null;
} {
  const { intl } = useSkcodeIntl();
  const format = useMemo(() => (id: string) => intl.formatMessage({ id }), [intl]);

  const chatterLinePool = useMemo(() => {
    if (usingPack && usingPack.chatterLines.length > 0) {
      return usingPack.chatterLines;
    }
    return formatIds(BUILTIN_CHATTER_LINE_IDS, format);
  }, [usingPack, format]);

  const petLinePool = useMemo(() => {
    if (usingPack && usingPack.petLines.length > 0) {
      return usingPack.petLines;
    }
    return formatIds(BUILTIN_PET_LINE_IDS, format);
  }, [usingPack, format]);

  const dizzyLinePool = useMemo(() => {
    if (usingPack?.dizzyLine) {
      return [usingPack.dizzyLine];
    }
    return formatIds(BUILTIN_DIZZY_LINE_IDS, format);
  }, [usingPack, format]);

  // 情绪台词池：用户包自定义优先，否则内置 i18n 池；随 displayMood 切换重抽。
  const moodLinePool = useMemo(() => {
    if (usingPack) {
      if (displayMood === "greet") {
        if (usingPack.greetLines.length > 0) {
          return usingPack.greetLines;
        }
      } else {
        const packPool = usingPack.moodLines[displayMood];
        if (packPool && packPool.length > 0) {
          return packPool;
        }
      }
    }
    const ids = BUILTIN_MOOD_VISUALS[displayMood].bubbleLineIds;
    return ids ? formatIds(ids, format) : [];
  }, [usingPack, displayMood, format]);

  const [moodLine, setMoodLine] = useState<string | null>(null);
  useEffect(() => {
    setMoodLine(moodLinePool.length > 0 ? pickAction(moodLinePool) : null);
  }, [moodLinePool]);

  return { chatterLinePool, petLinePool, dizzyLinePool, moodLine };
}
