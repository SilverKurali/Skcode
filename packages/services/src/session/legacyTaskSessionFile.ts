import type { SkcodeSessionFile, SkcodeTaskMeta } from "@skcode/shared";
import {
  skcodeSessionFileSchema,
  skcodeTaskMetaSchema,
  skcodeTaskModeSchema,
} from "@skcode/shared";

export type LegacyTaskSessionFile = Omit<SkcodeSessionFile, "meta"> & {
  meta: Omit<SkcodeTaskMeta, "mode"> & { mode?: SkcodeTaskMeta["mode"] };
};

const legacyTaskSessionFileSchema = skcodeSessionFileSchema.extend({
  // Claude 原生迁移会按清洗路径删除 meta.mode。
  // legacy snapshot 读取/写入仍要校验其它必需字段，但不能再强制把被过滤字段补回文件。
  meta: skcodeTaskMetaSchema.extend({
    mode: skcodeTaskModeSchema.optional(),
  }),
});

export function parseLegacyTaskSessionFile(input: unknown): LegacyTaskSessionFile {
  return legacyTaskSessionFileSchema.parse(input);
}

export function safeParseLegacyTaskSessionFile(input: unknown) {
  return legacyTaskSessionFileSchema.safeParse(input);
}
