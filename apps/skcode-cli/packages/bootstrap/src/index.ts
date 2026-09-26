// Bootstrap public API surface.

export * from "./app/create-app.js";
export type {
  ListSkcodeSessionsOptions,
  PromptInput,
  ResolveLatestSessionOptions,
  ResumeOptions,
  RunSkcodeProtocolAgentOptions,
  SendInputOptions,
  SendInputResult,
  SetLocaleResult,
  SteerTurnOptions,
  SubmitPromptOptions,
  UserPromptInput,
  SkcodeApp,
  SkcodeAppOptions,
  SkcodeModelOption,
} from "./app/types.js";
export * from "./auth-login.js";
export {
  inspectSkcodeCustomCommand,
  listSkcodeCustomCommands,
  loadSkcodeCustomCommand,
} from "./custom-commands.js";
export type {
  InspectSkcodeCustomCommandOptions,
  ListSkcodeCustomCommandsOptions,
  SkcodeCustomCommandInspection,
} from "./custom-commands.js";
export { createModelAdapter } from "./model-factory.js";
export type { CreateModelAdapterOptions } from "./model-factory.js";
export { startProcessProviderRegistryRuntime } from "./app/process-provider-registry-runtime.js";
export type { ProcessProviderRegistryRuntimeOptions } from "./app/process-provider-registry-runtime.js";
export {
  addSkcodePluginMarketplace,
  getSkcodePluginsOverview,
  installSkcodeMarketplacePlugin,
  listSkcodePlugins,
  removeSkcodePluginMarketplace,
  resolveSkcodePlugins,
  setSkcodePluginEnabled,
  uninstallSkcodeMarketplacePlugin,
  updateSkcodeMarketplacePlugin,
  updateSkcodePluginMarketplace,
  validateSkcodePluginPath,
} from "./plugins.js";
export type {
  AddSkcodeMarketplaceOptions,
  InstallSkcodeMarketplacePluginOptions,
  ListSkcodePluginsOptions,
  RemoveSkcodeMarketplaceOptions,
  ResolveSkcodePluginsOptions,
  SetSkcodePluginEnabledOptions,
  SetSkcodePluginEnabledResult,
  UninstallSkcodeMarketplacePluginOptions,
  UpdateSkcodeMarketplaceOptions,
  UpdateSkcodeMarketplacePluginOptions,
  ValidateSkcodePluginPathOptions,
  SkcodeAvailablePluginData,
  SkcodeInstalledPluginData,
  SkcodeMarketplaceSummaryData,
  SkcodeMarketplaceUpdateData,
  SkcodePluginInstallData,
  SkcodePluginUpdateData,
  SkcodePluginsOverviewData,
} from "./plugins.js";
export { runSkcodeProtocolAgent } from "./skcode-protocol-entrypoint.js";
// Exposed for the CLI's --output-format stream-json: it needs the same event
// shape the protocol server emits, rather than inventing a second one.
export { mapSessionEvent } from "./skcode-protocol/session-mapper.js";
export { prepareSkcodeTelemetryEnv, shutdownSkcodeTelemetry } from "./telemetry-bootstrap.js";
export type { SessionTranscriptMessage, SessionTranscriptPart } from "./session-transcript.js";
export { listSkcodeSessions, resolveLatestSession } from "./sessions.js";
export { inspectSkcodeSkill, listSkcodeSkills } from "./skills.js";
export type {
  InspectSkcodeSkillOptions,
  ListSkcodeSkillsOptions,
  SkcodeSkillInspection,
} from "./skills.js";
// Exposed for the CLI's headless slash routing: it must decide "is this a real
// custom command?" with the *same* reserved-name gate the app facade's
// customCommandPromptResolver applies, or the two disagree and a reserved name
// reaches the model as literal prompt text. See prompt-command.ts.
export { isReservedSkcodeSlashCommandName } from "./slash-command-surface.js";
export {
  grantWorkspaceHookTrust,
  inspectWorkspaceHookTrust,
  revokeWorkspaceHookTrustCli,
} from "./workspace-hook-trust-cli.js";
export type {
  WorkspaceHookTrustCliItem,
  WorkspaceHookTrustCliStatus,
  WorkspaceHookTrustCliTarget,
} from "./workspace-hook-trust-cli.js";
