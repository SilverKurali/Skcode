import type { TuiReadClipboardImage, TuiWriteClipboardText } from "@skcode/tui";
import type { UiLocale } from "@skcode/i18n";
import type { Logger } from "@skcode/contracts";
import type {
  createManagedCdpBrowserRuntime,
  ManagedCdpBrowserRuntimeOptions,
} from "@skcode/adapters/browser";
import type {
  createModelAdapter,
  createSkcodeApp,
  CreateModelAdapterOptions,
  configureCodingPlanApiKey,
  ConfigureCodingPlanApiKeyOptions,
  inspectSkcodeSkill,
  inspectWorkspaceHookTrust,
  grantWorkspaceHookTrust,
  revokeWorkspaceHookTrustCli,
  inspectSkcodeCustomCommand,
  InspectSkcodeCustomCommandOptions,
  InspectSkcodeSkillOptions,
  loginSkcodeCli,
  loginBigmodelCodingPlan,
  LoginBigmodelCodingPlanOptions,
  LoginSkcodeCliOptions,
  listSkcodeCustomCommands,
  ListSkcodeCustomCommandsOptions,
  loadSkcodeCustomCommand,
  listSkcodeSessions,
  listSkcodeSkills,
  ListSkcodeSessionsOptions,
  ListSkcodeSkillsOptions,
  logoutSkcodeCli,
  LogoutSkcodeCliOptions,
  resolveLatestSession,
  ResolveLatestSessionOptions,
  RunSkcodeProtocolAgentOptions,
  prepareSkcodeTelemetryEnv,
  startProcessProviderRegistryRuntime,
  shutdownSkcodeTelemetry,
  SkcodeAppOptions,
} from "@skcode/bootstrap";
import type { CliEnv, DotenvLoadResult, LoadCliDotenvOptions } from "./env.js";
import type { PluginsCommandOverrides } from "./plugins-command.js";
import type { CliShutdownProcess } from "./shutdown.js";
import type { resolveWorkspaceGitBranch } from "./tui-workspace-git.js";

export type BootstrapModule = typeof import("@skcode/bootstrap");

export interface RunDependencies extends PluginsCommandOverrides {
  protocolLifecycle?: RunSkcodeProtocolAgentOptions["lifecycle"];
  protocolInput?: NodeJS.ReadableStream;
  createManagedCdpBrowserRuntime?: (
    options?: ManagedCdpBrowserRuntimeOptions,
  ) => ReturnType<typeof createManagedCdpBrowserRuntime>;
  createModelAdapter?: (
    options?: CreateModelAdapterOptions,
  ) => ReturnType<typeof createModelAdapter>;
  createSkcodeApp?: (
    options?: SkcodeAppOptions,
  ) => Awaited<ReturnType<typeof createSkcodeApp>> | ReturnType<typeof createSkcodeApp>;
  /**
   * Session-event shaper for --output-format stream-json. Defaults to the
   * bootstrap module's, which is also what the protocol server uses; injectable
   * so a caller that supplies its own `createSkcodeApp` (tests, embedders) can
   * still stream, since the bootstrap module is not loaded on that path.
   */
  mapSessionEvent?: BootstrapModule["mapSessionEvent"];
  cwd?: () => string;
  env?: CliEnv;
  inspectSkill?: (options: InspectSkcodeSkillOptions) => ReturnType<typeof inspectSkcodeSkill>;
  inspectWorkspaceHookTrust?: typeof inspectWorkspaceHookTrust;
  grantWorkspaceHookTrust?: typeof grantWorkspaceHookTrust;
  revokeWorkspaceHookTrustCli?: typeof revokeWorkspaceHookTrustCli;
  inspectCustomCommand?: (
    options: InspectSkcodeCustomCommandOptions,
  ) => ReturnType<typeof inspectSkcodeCustomCommand>;
  loginSkcodeCli?: (options?: LoginSkcodeCliOptions) => ReturnType<typeof loginSkcodeCli>;
  loginBigmodelCodingPlan?: (
    options?: LoginBigmodelCodingPlanOptions,
  ) => ReturnType<typeof loginBigmodelCodingPlan>;
  configureCodingPlanApiKey?: (
    options: ConfigureCodingPlanApiKeyOptions,
  ) => ReturnType<typeof configureCodingPlanApiKey>;
  loadDotenv?: (options?: LoadCliDotenvOptions) => DotenvLoadResult;
  prepareSkcodeTelemetryEnv?: typeof prepareSkcodeTelemetryEnv;
  projectConfigPath?: string;
  listSessions?: (options: ListSkcodeSessionsOptions) => ReturnType<typeof listSkcodeSessions>;
  listCustomCommands?: (
    options: ListSkcodeCustomCommandsOptions,
  ) => ReturnType<typeof listSkcodeCustomCommands>;
  loadCustomCommand?: (
    options: InspectSkcodeCustomCommandOptions,
  ) => ReturnType<typeof loadSkcodeCustomCommand>;
  // headless slash 路由要和 app facade 的保留名 gate 用同一个判据；默认取 bootstrap 的，
  // 注入点只为让单测不必拉起整个 bootstrap 模块。见 prompt-command.ts。
  isReservedSlashCommandName?: BootstrapModule["isReservedSkcodeSlashCommandName"];
  listSkills?: (options: ListSkcodeSkillsOptions) => ReturnType<typeof listSkcodeSkills>;
  logger?: Logger;
  readClipboardImage?: TuiReadClipboardImage;
  writeClipboardText?: TuiWriteClipboardText;
  resolveLatestSession?: (
    options: ResolveLatestSessionOptions,
  ) => ReturnType<typeof resolveLatestSession>;
  resolveWorkspaceGitBranch?: typeof resolveWorkspaceGitBranch;
  logoutSkcodeCli?: (options?: LogoutSkcodeCliOptions) => ReturnType<typeof logoutSkcodeCli>;
  runSkcodeProtocolAgent?: (options?: RunSkcodeProtocolAgentOptions) => Promise<void>;
  runTui?: typeof import("@skcode/tui").runTui;
  skipUserConfig?: boolean;
  userConfigPath?: string;
  exitProcess?: (code: number) => void;
  shutdownCleanupTimeoutMs?: number;
  shutdownProcess?: CliShutdownProcess;
  startProcessProviderRegistryRuntime?: typeof startProcessProviderRegistryRuntime;
  shutdownSkcodeTelemetry?: typeof shutdownSkcodeTelemetry;
}

export type CliPermissionMode = "build" | "plan" | "edit" | "yolo";
export type CliRuntimeMode = CliPermissionMode | "auto";

export interface CliModeState {
  current?: CliRuntimeMode;
  override?: CliPermissionMode;
}

export interface CliTargetRequest {
  objective: string;
  replaceExisting: boolean;
}

export type ModeCapableApp = Awaited<ReturnType<typeof createSkcodeApp>> & {
  getMode?: () => CliRuntimeMode;
  setLocale?: (locale: UiLocale) => Promise<{ locale: "en-US" | "zh-CN" }>;
  setMode?: (mode: CliRuntimeMode) => Promise<{ mode: CliRuntimeMode }>;
};

export interface CliResumeRequest {
  continueSession: boolean;
  resumeSessionId?: string;
}
