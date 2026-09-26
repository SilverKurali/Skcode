import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { SkcodeStdioTapDevState } from "@skcode/shared";
import { getAppConfigDir } from "#src/paths.js";
import { isEffectiveDevelopmentNodeEnv } from "#src/runtime-tools/nodeEnv.js";

interface SkcodeStdioTapStateFile {
  enabled?: boolean;
}

function isSkcodeStdioTapDevVisible(): boolean {
  return isEffectiveDevelopmentNodeEnv();
}

function getSkcodeStdioTapDevDir(): string {
  return join(getAppConfigDir(), "dev");
}

export function getSkcodeStdioTapDevLogDir(): string {
  return join(getSkcodeStdioTapDevDir(), "stdio-traffic");
}

function getSkcodeStdioTapDevStatePath(): string {
  return join(getSkcodeStdioTapDevDir(), "skcode-stdio-tap.json");
}

function readStateFile(path: string): SkcodeStdioTapStateFile {
  if (!existsSync(path)) {
    return {};
  }

  try {
    const parsed = JSON.parse(readFileSync(path, "utf-8")) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as SkcodeStdioTapStateFile) : {};
  } catch {
    return {};
  }
}

export function readSkcodeStdioTapDevState(): SkcodeStdioTapDevState {
  const visible = isSkcodeStdioTapDevVisible();
  const statePath = getSkcodeStdioTapDevStatePath();
  const fileState = readStateFile(statePath);
  return {
    enabled: visible && fileState.enabled === true,
    visible,
    logDir: getSkcodeStdioTapDevLogDir(),
    statePath,
  };
}

export function setSkcodeStdioTapDevEnabled(enabled: boolean): SkcodeStdioTapDevState {
  const visible = isSkcodeStdioTapDevVisible();
  const statePath = getSkcodeStdioTapDevStatePath();
  mkdirSync(getSkcodeStdioTapDevDir(), { recursive: true });
  writeFileSync(
    statePath,
    `${JSON.stringify(
      {
        // 开发态 stdio 抓包是高频原始协议帧，只能通过显式开关写旁路文件，避免误进生产日志。
        enabled: visible && enabled,
        updatedAt: new Date().toISOString(),
      },
      null,
      2,
    )}\n`,
  );
  return readSkcodeStdioTapDevState();
}
