import type { BackgroundBashOutputResult, SessionDebugSnapshot } from "@skcode/shared";
/* eslint-disable max-lines -- Skcode agent service 接口集中声明 protocol/session/workspace 方法，拆分会增加 service descriptor 迁移成本。 */
import type { Event, IDisposable } from "@skcode/rpc";
import { ServiceChannels } from "@skcode/shared";
import type { AppUsageRange, AppUsageSnapshot, SkcodeTaskTokenUsageResult } from "@skcode/shared";
import type { SkcodeAutomation, SkcodeAutomationRun } from "@skcode/shared";
import type {
  SkcodeStorageStartupState,
  SkcodeDeliveryKind,
  SkcodeAgentMcpServer,
  SkcodeBackgroundTurnAttribution,
  TraceId,
  SkcodeSessionCompactResult,
  SkcodeSessionGoalAction,
  SkcodeSessionGoalResult,
  SkcodeMessageWithParts,
  ModelSelection,
  SkcodeSessionImportHistory,
  SkcodePermissionRequestParams,
  AgentLaneResourceSample,
  SkcodeMcpTelemetryEvent,
  SkcodeMcpResourceSample,
  SkcodeToolExecResource,
  SkcodeProcessChildProcess,
  SkcodeMcpListResult,
  SkcodePluginsListResult,
  SkcodePluginsOverviewResult,
  SkcodePluginsMarketplaceMutationResult,
  SkcodePluginsInstallResult,
  SkcodePluginsReferenceCatalogResult,
  SkcodeSkillsReferenceCatalogResult,
  SkcodeWorkflowsDeleteResult,
  SkcodeWorkflowsGetResult,
  SkcodeWorkflowsListResult,
  SkcodeWorkflowsMoveResult,
  SkcodeWorkflowsRunsResult,
  SkcodeWorkflowsUpdateMetaResult,
  SkcodePluginsUninstallResult,
  SkcodePluginsRestoreBuiltinResult,
  SkcodePluginsConfigureResult,
  SkcodePluginsDescribeResult,
  SkcodePluginsValidateResult,
  SkcodePluginsSetEnabledResult,
  SkcodePluginsCancelOperationResult,
  SkcodePluginOperationProgressNotification,
  SkcodeProviderTestModelConnectivityParams,
  SkcodeProviderTestModelConnectivityResult,
  SkcodeUserInputRequestParams,
  SkcodeUserInputResponse,
  SkcodeSessionEvent,
  SkcodeSessionInfo,
  SkcodeSessionMode,
  SkcodeSessionPersistence,
  SkcodeSessionSendResult,
  SkcodeSessionRequestRuntimePreferencesParams,
  SkcodeSessionRuntimePreferencesResult,
  SkcodeSessionStateSnapshot,
  SkcodeSessionSubagentsResult,
  SkcodeStateUpdatedNotification,
  SkcodeTaskClientMode,
  SkcodeBrowserAmbientContext,
  SkcodeWorkspacePresentation,
  SkcodeWorkspaceGenerateTextResult,
  SkcodeWorkspaceGenerateTextParams,
  SkcodeWorkspaceHookTrustGrantResult,
  SkcodeAutomationBotDeliveryTarget,
} from "@skcode/shared";
import type {
  ClientHello,
  CommandAck,
  CommandEnvelope,
  CommandKey,
  CommandsQueryResult,
  ConversationTopicWireCandidate,
  ConversationTelemetryFact,
  CuaPermissionObservation,
  ConversationRowTarget,
  HelloMessage,
  SessionsIndexTopicWireCandidate,
  V4AttachmentBeginResult,
  V4AttachmentChunkResult,
  V4AttachmentCommitResult,
  V4AttachmentPreviewSourceResult,
  V4AttachmentReadResult,
  V4ConversationAttachmentReadResult,
  V4ConversationAttachmentStatResult,
  V4ConnectionFlowState,
  V4ConversationFileChangesResult,
  V4ConversationFileRewindPreviewResult,
  V4ConversationPlansResult,
  V4ConversationWorkflowRunEventsResult,
  V4ConversationWorkflowRunArtifactDataResult,
  V4ConversationWorkflowRunArtifactReadResult,
  V4ConversationWorkflowRunArtifactsResult,
  V4ConversationWorkflowRunNodeResultResult,
  V4ConversationWorkflowRunWorkspaceResult,
  V4ConversationWorkflowRunsResult,
  V4ConversationRowsRangeResult,
  V4ConversationResyncResult,
  V4ConversationSubscribeResult,
  V4SessionsIndexSubscribeResult,
  V4WorkspaceConfigSubscribeResult,
  WorkspaceConfigTopicWireCandidate,
} from "@skcode/shared/skcode-protocol-v4";
import { createServiceDescriptor } from "../descriptors.js";

export * from "./skcodeAgentPluginParams.js";
export * from "./skcodeAgentWorkflowParams.js";
import type {
  SkcodeAgentAddPluginMarketplaceParams,
  SkcodeAgentAutomationIdParams,
  SkcodeAgentCancelPluginOperationParams,
  SkcodeAgentConfigurePluginParams,
  SkcodeAgentResetPluginConfigParams,
  SkcodeAgentCreateAutomationParams,
  SkcodeAgentDeleteAutomationRunParams,
  SkcodeAgentDescribePluginParams,
  SkcodeAgentInstallPluginParams,
  SkcodeAgentListMcpServerStatusesParams,
  SkcodeAgentPluginViewParams,
  SkcodeAgentPluginReferenceCatalogParams,
  SkcodeAgentSkillReferenceCatalogParams,
  SkcodeAgentResolveSuggestedPluginReferenceParams,
  SkcodeAgentRemovePluginMarketplaceParams,
  SkcodeAgentRestoreBuiltinPluginParams,
  SkcodeAgentSetPluginEnabledParams,
  SkcodeAgentSetAutomationEnabledParams,
  SkcodeAgentUninstallPluginParams,
  SkcodeAgentUpdatePluginMarketplaceParams,
  SkcodeAgentUpdatePluginParams,
  SkcodeAgentUpdateAutomationParams,
  SkcodeAgentValidatePluginParams,
  SkcodeAgentWorkspaceTarget,
} from "./skcodeAgentPluginParams.js";
import type {
  SkcodeAgentDeleteSavedWorkflowParams,
  SkcodeAgentGetSavedWorkflowParams,
  SkcodeAgentListSavedWorkflowRunsParams,
  SkcodeAgentListSavedWorkflowsParams,
  SkcodeAgentMoveSavedWorkflowParams,
  SkcodeAgentUpdateSavedWorkflowMetaParams,
} from "./skcodeAgentWorkflowParams.js";

export interface SkcodeAgentSessionTarget extends SkcodeAgentWorkspaceTarget {
  sessionId: string;
}

export interface SkcodeAgentResumeSessionParams extends SkcodeAgentSessionTarget {
  model?: ModelSelection;
  thoughtLevel?: string;
  mcpServers?: SkcodeAgentMcpServer[];
  // 冷恢复会重建 runtime，工具面隔离必须和 create 保持同一安全边界（CUA 只放行 skcode-cua 工具、
  // 禁 Bash 等）。否则 resume 后模型可见工具面/执行权限会比创建时更宽。
  toolAllowlist?: string[];
  toolDenylist?: string[];
}

export interface SkcodeAgentInitializeResult {
  available: boolean;
  workspaceKey: string;
  protocolName?: string;
  protocolVersion?: number;
  transportKind?: "stdio" | "websocket";
  reason?: string;
  reasonCode?: "provider_not_ready";
}

export interface SkcodeAgentRunAutomationNowResult {
  status: "queued" | "duplicate";
}

export interface SkcodeAgentWorkspaceRuntimeIdentity {
  generation: number;
  identity: string;
  processId?: number;
  workspaceKey: string;
}

export const SKCODE_AGENT_RUNTIME_UNAVAILABLE_CODE = "SKCODE_AGENT_RUNTIME_UNAVAILABLE";

export type SkcodeAgentRuntimePolicy = "start-if-needed" | "existing-only";

export interface SkcodeAgentRuntimeLifecycleEvent extends SkcodeAgentWorkspaceTarget {
  workspaceKey: string;
  runtimeIdentity: SkcodeAgentWorkspaceRuntimeIdentity;
  state: "available" | "unavailable";
}

export type SkcodeAgentCuaPermissionObservation = CuaPermissionObservation &
  SkcodeAgentWorkspaceTarget;

export interface SkcodeAgentCreateSessionParams extends SkcodeAgentWorkspaceTarget {
  sessionId?: string;
  sessionTraceId?: TraceId;
  parentSessionId?: string;
  mode?: SkcodeSessionMode;
  model?: ModelSelection;
  persistence?: SkcodeSessionPersistence;
  thoughtLevel?: string;
  /** automation 执行会话关闭模型二次命名，保持首条用户 query 作为稳定标题。 */
  titleGenerationEnabled?: boolean;
  mcpServers?: SkcodeAgentMcpServer[];
  toolAllowlist?: string[];
  toolDenylist?: string[];
  importedHistory?: SkcodeSessionImportHistory;
}

export interface SkcodeAgentListSessionsParams extends SkcodeAgentWorkspaceTarget {
  sessionIds?: string[];
  runtimePolicy?: SkcodeAgentRuntimePolicy;
  includeArchived?: boolean;
  limit?: number;
}

export interface SkcodeAgentListSessionSubagentsParams extends SkcodeAgentSessionTarget {
  endedCursor?: string;
  endedLimit?: number;
  /** 远程 workspace 的宿主连接身份；只用于选择现有 Host，不进入 CLI wire query。 */
  remoteSessionId?: string;
}

export interface SkcodeAgentAppUsageParams {
  range: AppUsageRange;
  timeZone?: string;
}

export interface SkcodeAgentTaskTokenUsageParams extends SkcodeAgentSessionTarget {}

export interface SkcodeAgentReadSessionParams extends SkcodeAgentSessionTarget {
  deliveryKind?: SkcodeDeliveryKind;
  messageLimit?: number;
  afterSeq?: number;
  /** 被动索引/观察者只能读取现有 runtime，禁止为了读快照拉起 session。 */
  runtimePolicy?: SkcodeAgentRuntimePolicy;
}

export interface SkcodeAgentReadSessionMessagesParams extends SkcodeAgentSessionTarget {
  afterMessageId?: string;
  limit?: number;
}

export interface SkcodeAgentReadSessionEventsParams extends SkcodeAgentSessionTarget {
  afterSeq?: number;
  limit?: number;
}

export type SkcodeAgentReadWorkspacePresentationParams = SkcodeAgentWorkspaceTarget;

export interface SkcodeAgentGrantWorkspaceHookTrustParams extends SkcodeAgentWorkspaceTarget {
  bundleDigest: string;
  hookDeclarationDigest: string;
}

export interface SkcodeAgentSendPromptParamsBase extends SkcodeAgentSessionTarget {
  modelSelection?: ModelSelection;
  modelExecution?: import("@skcode/shared/skcode-protocol-v4").CommandPayloadMap["sendText"]["modelExecution"];
  inputId?: string;
  queryId?: string;
  messageId?: string;
  sessionTraceId?: TraceId;
  content: string;
  attachments?: Record<string, unknown>[];
  /** provider-only 的当前 IAB 状态；UI/session persistence 仍使用 content 原文。 */
  browserAmbientContext?: SkcodeBrowserAmbientContext;
  clientMode?: SkcodeTaskClientMode;
  expectedRevision?: number;
  expectedProviderRevision?: string;
  runtimeProviderHeaders?: Record<string, string>;
  toolDenylist?: string[];
  /** Bot 来源 turn 的稳定回推地址；只在当前 turn 内供 CronCreate 读取。 */
  botDeliveryTarget?: SkcodeAutomationBotDeliveryTarget;
}

export type SkcodeAgentSendPromptParams = SkcodeAgentSendPromptParamsBase &
  SkcodeBackgroundTurnAttribution;

export interface SkcodeAgentCompactParams extends SkcodeAgentSessionTarget {
  inputId?: string;
  instructions?: string;
  expectedRevision?: number;
}

export interface SkcodeAgentGoalParams extends SkcodeAgentSessionTarget {
  inputId?: string;
  action: SkcodeSessionGoalAction;
  objective?: string;
  expectedRevision?: number;
}

export interface SkcodeAgentSetModelParams extends SkcodeAgentSessionTarget {
  model: ModelSelection;
  expectedRevision?: number;
  persistAsWorkspaceLastUsed?: boolean;
}

export interface SkcodeAgentSetThoughtLevelParams extends SkcodeAgentSessionTarget {
  thoughtLevel?: string;
  expectedRevision?: number;
  persistAsWorkspaceLastUsed?: boolean;
}

export interface SkcodeAgentSetModeParams extends SkcodeAgentSessionTarget {
  mode: SkcodeSessionMode;
  expectedRevision?: number;
}

export interface SkcodeAgentGenerateWorkspaceTextParams extends SkcodeAgentWorkspaceTarget {
  selection: SkcodeWorkspaceGenerateTextParams["selection"];
  prompt?: string;
  messages?: SkcodeWorkspaceGenerateTextParams["messages"];
  tools?: SkcodeWorkspaceGenerateTextParams["tools"];
  querySource: string;
  maxOutputTokens?: number;
  signal?: AbortSignal;
  /**
   * 协议层 RPC 超时。thinking 模型的长请求会超过协议 client 默认的
   * 3 分钟；调用方必须把自身 deadline 透传到这里，否则默认超时先触发、
   * 还会被 onRequestTimeout 误判 stale 杀进程。
   */
  requestTimeoutMs?: number;
}

export interface SkcodeAgentTestModelConnectivityParams extends SkcodeAgentWorkspaceTarget {
  selection: SkcodeProviderTestModelConnectivityParams["selection"];
  signal?: AbortSignal;
}

export interface SkcodeAgentSessionRuntimePreferencesRequest extends SkcodeSessionRequestRuntimePreferencesParams {
  requestId: string;
}

export interface SkcodeAgentRespondSessionRuntimePreferencesParams {
  requestId: string;
  resolution:
    | { status: "resolved"; preferences: SkcodeSessionRuntimePreferencesResult }
    | { status: "failed"; message: string };
}

export interface SkcodeAgentSessionSubscribeParams extends SkcodeAgentSessionTarget {
  deliveryKind: SkcodeDeliveryKind;
  afterSeq?: number;
  includeSnapshot?: boolean;
  eventCoalescing?: {
    mode: "background-summary";
    intervalMs?: number;
  };
}

// ── v4 conversation 通道（竖切）──
// host 只做转发：subscribe/unsubscribe/command 透传给 CLI v4 gateway，
// v4/conversation/frame 通知按 workspace fan-out 给 renderer。

export interface SkcodeAgentConversationSubscribeParams extends SkcodeAgentSessionTarget {
  /** 水位不变量：仅当客户端真持有该时刻一致状态才允许带。 */
  base?: { logEpoch: string; seq: number };
  visibility?: "foreground" | "background";
}

export interface SkcodeAgentConversationUnsubscribeParams extends SkcodeAgentWorkspaceTarget {
  subscriptionId: string;
  runtimePolicy?: SkcodeAgentRuntimePolicy;
}

export interface SkcodeAgentConversationResyncParams extends SkcodeAgentWorkspaceTarget {
  subscriptionId: string;
  base: { logEpoch: string; seq: number } | null;
  forceSnapshot?: boolean;
  runtimePolicy?: SkcodeAgentRuntimePolicy;
}

/** 行分页 query（rows/range）：按游标向上取一窗历史行。 */
export interface SkcodeAgentConversationRowsRangeParams extends SkcodeAgentSessionTarget {
  /** 取 rowId < beforeRowId 的行；缺省 = 从当前尾部向前。 */
  beforeRowId?: number;
  /** 1..rowsRangeMaxLimit（200）。 */
  limit: number;
}

/** 当前有效分支里的终态 ExitPlanMode 目录。 */
export type SkcodeAgentConversationPlansParams = SkcodeAgentSessionTarget;

/** workflow run 的事件日志分页（详情页审计面）；cursor = journal sequence。 */
export interface SkcodeAgentConversationWorkflowRunEventsParams extends SkcodeAgentSessionTarget {
  runId: string;
  afterSequence?: number;
  limit?: number;
}

/** dwf run 的枚举（重启后的发现查询）。 */
export interface SkcodeAgentConversationWorkflowRunsParams extends SkcodeAgentSessionTarget {
  limit?: number;
}

// ── dwf 用户面产物──
// ⚠ 术语：artifact = 脚本经 `artifact.*` 发布给**用户**看的产出（文件 / markdown / 预置看板），
// 不是 run 的顶层返回值（引擎内部对后者的同名叫法）。

/** 产物清单；UI 冷恢复与中枢详情的 durable 读法。 */
export interface SkcodeAgentConversationWorkflowRunArtifactsParams extends SkcodeAgentSessionTarget {
  runId: string;
}

/** 预置看板的取数面；cursor = journal sequence（严格大于）。 */
export interface SkcodeAgentConversationWorkflowRunArtifactDataParams extends SkcodeAgentSessionTarget {
  runId: string;
  artifactId: string;
  afterSequence?: number;
  limit?: number;
}

/** 内容产物的字节，一次一块（≤ 512 KiB，形状逐字照 attachmentRead）。 */
export interface SkcodeAgentConversationWorkflowRunArtifactReadParams extends SkcodeAgentSessionTarget {
  runId: string;
  artifactId: string;
  version: number;
  offset: number;
  limit: number;
}

// ── dwf 工作区 transcript──
/** 轻行清单：一个 run 的 files.* / git.* / world.run 行，不带正文。 */
export interface SkcodeAgentConversationWorkflowRunWorkspaceParams extends SkcodeAgentSessionTarget {
  runId: string;
}

/** 一个工作区节点的正文，按 maxBytes 保形有界化（缺省与上限在 CLI 网关侧）。 */
export interface SkcodeAgentConversationWorkflowRunNodeResultParams extends SkcodeAgentSessionTarget {
  runId: string;
  siteId: string;
  ordinal: number;
  maxBytes?: number;
}

export interface SkcodeAgentBackgroundBashOutputParams extends SkcodeAgentSessionTarget {
  workId: string;
}

export interface SkcodeAgentConversationFileChangesParams extends SkcodeAgentSessionTarget {
  target: ConversationRowTarget;
  baseRevision: number;
  baseLogEpoch: string;
}

export interface SkcodeAgentConversationFileRewindPreviewParams extends SkcodeAgentSessionTarget {
  target: ConversationRowTarget;
  baseRevision: number;
  baseLogEpoch: string;
}

export interface SkcodeAgentConversationCommandParams extends SkcodeAgentWorkspaceTarget {
  envelope: CommandEnvelope;
  /** 仅 host 内部用于 Browser Use runtime 边界，不进入 v4 wire envelope。 */
  clientMode?: SkcodeTaskClientMode;
}

export interface SkcodeAgentCommandsQueryParams extends SkcodeAgentWorkspaceTarget {
  clock?: true;
  commands: CommandKey[];
}

/** UI 不携带 connectionId；connection scope 以 trusted carrier 注入 wire identity。 */
export interface SkcodeAgentAttachmentBeginParams extends SkcodeAgentSessionTarget {
  uploadId: string;
  fileName: string;
  mime: string;
  totalBytes: number;
  totalChunks: number;
  checksum: string;
}

export interface SkcodeAgentAttachmentChunkParams extends SkcodeAgentSessionTarget {
  uploadId: string;
  chunkIndex: number;
  dataBase64: string;
}

export interface SkcodeAgentAttachmentTerminalParams extends SkcodeAgentSessionTarget {
  uploadId: string;
}

export interface SkcodeAgentAttachmentReadParams extends SkcodeAgentSessionTarget {
  ref: string;
  target?: ConversationRowTarget;
  attachmentIndex?: number;
  offset: number;
  limit: number;
}

export interface SkcodeAgentConversationAttachmentReadParams extends SkcodeAgentSessionTarget {
  ref: string;
  target: ConversationRowTarget;
  attachmentIndex: number;
  offset: number;
  limit: number;
}

export interface SkcodeAgentConversationAttachmentStatParams extends SkcodeAgentSessionTarget {
  ref: string;
  target: ConversationRowTarget;
  attachmentIndex: number;
}

export interface SkcodeAgentAttachmentPreviewSourceParams extends SkcodeAgentSessionTarget {
  ref: string;
  target?: ConversationRowTarget;
  attachmentIndex?: number;
}

/** host scope 内部 transport 控制面；connectionId 只能经 trusted carrier 注入。 */
export interface SkcodeAgentConnectionFlowParams extends SkcodeAgentWorkspaceTarget {
  state: V4ConnectionFlowState;
}

/** sessions-index：workspace 级列表订阅（无 sessionId 维度）。 */
export interface SkcodeAgentSessionsIndexSubscribeParams extends SkcodeAgentWorkspaceTarget {
  base?: { logEpoch: string; seq: number };
  visibility?: "foreground" | "background";
  /**
   * 订阅者作用域后缀：CLI 侧重订阅替换按 (connectionId, topic) 判定，
   * host 进程内多个独立消费者（renderer 侧栏 / task-index syncer）订阅同一 topic 时
   * 必须用不同 connectionId，否则互相替换对方的订阅代际。缺省共享 host 连接 id。
   */
  subscriberScope?: string;
  /**
   * task-list 等被动观察者必须使用 existing-only；runtime 不存在时返回稳定 unavailable，
   * 禁止为了建立列表订阅而启动 Agent。缺省保持显式会话入口的旧行为。
   */
  runtimePolicy?: SkcodeAgentRuntimePolicy;
}

/** workspace-config：workspace 级配置目录订阅（config options + slash 目录）。 */
export interface SkcodeAgentWorkspaceConfigSubscribeParams extends SkcodeAgentWorkspaceTarget {
  base?: { logEpoch: string; seq: number };
  visibility?: "foreground" | "background";
  subscriberScope?: string;
  runtimePolicy?: SkcodeAgentRuntimePolicy;
}

export type SkcodeAgentServiceEvent =
  | { type: "session.event"; event: SkcodeSessionEvent }
  | { type: "state.updated"; notification: SkcodeStateUpdatedNotification }
  | { type: "permission.request"; request: SkcodePermissionRequestParams }
  | { type: "userInput.request"; request: SkcodeUserInputRequestParams }
  | {
      type: "userInput.response";
      requestId: string;
      response: SkcodeUserInputResponse;
    }
  | { type: "snapshot"; snapshot: SkcodeSessionStateSnapshot };

export interface SkcodeAgentAppRuntimePreferences {
  askUserQuestionAutoResolutionEnabled: boolean;
  modelIoFullRetentionEnabled?: boolean;
}

export interface SkcodeAgentLocalRuntimeChildProcesses {
  pid: number;
  provider: string;
  workspacePath: string;
  lane?: string;
  children: SkcodeProcessChildProcess[];
}

export interface SkcodeAgentStorageStartupSnapshot {
  generation: number;
  state: SkcodeStorageStartupState | null;
}

export interface ISkcodeAgentService {
  /** 控制面不需要账号或模型，且不发送普通协议请求。 */
  prepareStorage(params: SkcodeAgentWorkspaceTarget): Promise<void>;
  getStorageStartupState(
    params: SkcodeAgentWorkspaceTarget,
  ): Promise<SkcodeAgentStorageStartupSnapshot | null>;
  onDynamicStorageStartupState(
    params: SkcodeAgentWorkspaceTarget,
  ): Event<SkcodeAgentStorageStartupSnapshot>;
  initialize(params: SkcodeAgentWorkspaceTarget): Promise<SkcodeAgentInitializeResult>;
  /**
   * 同步 App 全局运行时偏好到所有已活动 workspace；不得为此启动空闲 Agent。
   */
  syncAppRuntimePreferences(preferences: SkcodeAgentAppRuntimePreferences): Promise<void>;
  getWorkspaceRuntimeIdentity(
    params: SkcodeAgentWorkspaceTarget,
  ): Promise<SkcodeAgentWorkspaceRuntimeIdentity>;
  createSession(params: SkcodeAgentCreateSessionParams): Promise<SkcodeSessionStateSnapshot>;
  resumeSession(params: SkcodeAgentResumeSessionParams): Promise<SkcodeSessionStateSnapshot>;
  listSessions(params: SkcodeAgentListSessionsParams): Promise<SkcodeSessionInfo[]>;
  listSessionSubagents(
    params: SkcodeAgentListSessionSubagentsParams,
  ): Promise<SkcodeSessionSubagentsResult>;
  getAppUsageStats(params: SkcodeAgentAppUsageParams): Promise<AppUsageSnapshot>;
  getTaskTokenUsage(params: SkcodeAgentTaskTokenUsageParams): Promise<SkcodeTaskTokenUsageResult>;
  readSession(params: SkcodeAgentReadSessionParams): Promise<SkcodeSessionStateSnapshot>;
  readSessionMessages(
    params: SkcodeAgentReadSessionMessagesParams,
  ): Promise<SkcodeMessageWithParts[]>;
  readSessionDebug(params: SkcodeAgentSessionTarget): Promise<SessionDebugSnapshot>;
  readSessionEvents(params: SkcodeAgentReadSessionEventsParams): Promise<SkcodeSessionEvent[]>;
  readWorkspacePresentation(
    params: SkcodeAgentReadWorkspacePresentationParams,
  ): Promise<SkcodeWorkspacePresentation>;
  /** 无 task/session 的 Settings 预信任；Agent 会重新发现并校验 canonical snapshot。 */
  grantWorkspaceHookTrust(
    params: SkcodeAgentGrantWorkspaceHookTrustParams,
  ): Promise<SkcodeWorkspaceHookTrustGrantResult>;
  listMcpServerStatuses(
    params: SkcodeAgentListMcpServerStatusesParams,
  ): Promise<SkcodeMcpListResult>;
  listPlugins(params: SkcodeAgentPluginViewParams): Promise<SkcodePluginsListResult>;
  /**
   * Plugin 对话引用 catalog：session-scoped 只读投影。
   * 走 workspace 级 agent client（session 记录只存在于该进程），不走独立插件管理进程。
   */
  getPluginReferenceCatalog(
    params: SkcodeAgentPluginReferenceCatalogParams,
  ): Promise<SkcodePluginsReferenceCatalogResult>;
  /** Composer Skill 引用 catalog；带 sessionId 时读取该 runtime 的冻结快照。 */
  getSkillReferenceCatalog(
    params: SkcodeAgentSkillReferenceCatalogParams,
  ): Promise<SkcodeSkillsReferenceCatalogResult>;
  // 已保存工作流的 GUI 中枢：workspace 级、无会话，每次调用现扫 `<cwd>/.skcode/workflows/`。
  // 全局档传 `scope: "global"`：带 workspace 就用它当载体，不带则由 services 层自选本机载体运行时。
  listSavedWorkflows(
    params: SkcodeAgentListSavedWorkflowsParams,
  ): Promise<SkcodeWorkflowsListResult>;
  getSavedWorkflow(params: SkcodeAgentGetSavedWorkflowParams): Promise<SkcodeWorkflowsGetResult>;
  updateSavedWorkflowMeta(
    params: SkcodeAgentUpdateSavedWorkflowMetaParams,
  ): Promise<SkcodeWorkflowsUpdateMetaResult>;
  deleteSavedWorkflow(
    params: SkcodeAgentDeleteSavedWorkflowParams,
  ): Promise<SkcodeWorkflowsDeleteResult>;
  listSavedWorkflowRuns(
    params: SkcodeAgentListSavedWorkflowRunsParams,
  ): Promise<SkcodeWorkflowsRunsResult>;
  // 在项目档 / 全局档之间移动同名文件：
  // `workspace` 是载体（移到项目传目标项目、移到全局传源项目），`to` 是落点档；不覆盖已存在的目标。
  moveSavedWorkflow(params: SkcodeAgentMoveSavedWorkflowParams): Promise<SkcodeWorkflowsMoveResult>;
  resolveSuggestedPluginReference(
    params: SkcodeAgentResolveSuggestedPluginReferenceParams,
  ): Promise<import("@skcode/shared").SkcodePluginsResolveSuggestedReferenceResult>;
  /** 推荐项 Plugin 首次本地检查缺失后的 operation-scoped 刷新进度。 */
  onDynamicPluginOperationProgress(
    operationId: string,
  ): Event<SkcodePluginOperationProgressNotification>;
  getPluginsOverview(params: SkcodeAgentPluginViewParams): Promise<SkcodePluginsOverviewResult>;
  /**
   * 资源管理器：枚举本 Host 内全部本地 Agent 进程（含 plugin / mcp-status 泳道），
   * 并向每个存活 runtime 请求 `process/childProcesses`；单个 runtime 失败只让它的 children 为空。
   */
  collectLocalRuntimeChildProcesses(
    signal?: AbortSignal,
  ): Promise<SkcodeAgentLocalRuntimeChildProcesses[]>;
  addPluginMarketplace(
    params: SkcodeAgentAddPluginMarketplaceParams,
  ): Promise<SkcodePluginsMarketplaceMutationResult>;
  removePluginMarketplace(
    params: SkcodeAgentRemovePluginMarketplaceParams,
  ): Promise<SkcodePluginsMarketplaceMutationResult>;
  updatePluginMarketplace(
    params: SkcodeAgentUpdatePluginMarketplaceParams,
  ): Promise<SkcodePluginsMarketplaceMutationResult>;
  installPlugin(params: SkcodeAgentInstallPluginParams): Promise<SkcodePluginsInstallResult>;
  cancelPluginOperation(
    params: SkcodeAgentCancelPluginOperationParams,
  ): Promise<SkcodePluginsCancelOperationResult>;
  uninstallPlugin(params: SkcodeAgentUninstallPluginParams): Promise<SkcodePluginsUninstallResult>;
  updatePlugin(params: SkcodeAgentUpdatePluginParams): Promise<SkcodePluginsInstallResult>;
  restoreBuiltinPlugin(
    params: SkcodeAgentRestoreBuiltinPluginParams,
  ): Promise<SkcodePluginsRestoreBuiltinResult>;
  configurePlugin(params: SkcodeAgentConfigurePluginParams): Promise<SkcodePluginsConfigureResult>;
  resetPluginConfig(
    params: SkcodeAgentResetPluginConfigParams,
  ): Promise<SkcodePluginsConfigureResult>;
  validatePlugin(params: SkcodeAgentValidatePluginParams): Promise<SkcodePluginsValidateResult>;
  describePlugin(params: SkcodeAgentDescribePluginParams): Promise<SkcodePluginsDescribeResult>;
  setPluginEnabled(
    params: SkcodeAgentSetPluginEnabledParams,
  ): Promise<SkcodePluginsSetEnabledResult>;
  // ---- 定时任务(automation)管理 ----
  listAutomations(params: SkcodeAgentWorkspaceTarget): Promise<SkcodeAutomation[]>;
  listAllAutomations(): Promise<SkcodeAutomation[]>;
  createAutomation(params: SkcodeAgentCreateAutomationParams): Promise<SkcodeAutomation>;
  updateAutomation(params: SkcodeAgentUpdateAutomationParams): Promise<SkcodeAutomation | null>;
  deleteAutomation(params: SkcodeAgentAutomationIdParams): Promise<void>;
  setAutomationEnabled(params: SkcodeAgentSetAutomationEnabledParams): Promise<void>;
  restartAutomation(params: SkcodeAgentAutomationIdParams): Promise<void>;
  runAutomationNow(
    params: SkcodeAgentAutomationIdParams,
  ): Promise<SkcodeAgentRunAutomationNowResult>;
  listAutomationRuns(params: SkcodeAgentAutomationIdParams): Promise<SkcodeAutomationRun[]>;
  deleteAutomationRun(params: SkcodeAgentDeleteAutomationRunParams): Promise<void>;
  generateWorkspaceText(
    params: SkcodeAgentGenerateWorkspaceTextParams,
  ): Promise<SkcodeWorkspaceGenerateTextResult>;
  testModelConnectivity(
    params: SkcodeAgentTestModelConnectivityParams,
  ): Promise<SkcodeProviderTestModelConnectivityResult>;
  /**
   * @deprecated：send 主路径已收敛 v4 sendText 命令。仅剩两个消费点——
   * adapter 带附件输入回退（待附件命令面落地后移除）与 skcodeSessionService
   * pass-through；新代码禁止回用。
   */
  sendPrompt(params: SkcodeAgentSendPromptParams): Promise<SkcodeSessionSendResult>;
  compactSession(params: SkcodeAgentCompactParams): Promise<SkcodeSessionCompactResult>;
  goalSession(params: SkcodeAgentGoalParams): Promise<SkcodeSessionGoalResult>;
  closeSession(
    params: SkcodeAgentSessionTarget & { expectedPersistence?: "deferred" | "immediate" },
  ): Promise<boolean>;
  setModel(params: SkcodeAgentSetModelParams): Promise<SkcodeSessionStateSnapshot>;
  setThoughtLevel(params: SkcodeAgentSetThoughtLevelParams): Promise<SkcodeSessionStateSnapshot>;
  setMode(params: SkcodeAgentSetModeParams): Promise<SkcodeSessionStateSnapshot>;
  respondSessionRuntimePreferences(
    params: SkcodeAgentRespondSessionRuntimePreferencesParams,
  ): Promise<void>;
  onDynamicSessionRuntimePreferencesRequest(): Event<SkcodeAgentSessionRuntimePreferencesRequest>;
  /**
   * CLI 进程级资源样本，带 services 打的 lane 标签（CLI 自己不知道 lane）。
   * 使用 dynamic event 避免 RPC 服务在无人订阅时缓冲周期事件；
   * 该事件不属于 session/conversation continuous 或 replayable 状态。
   */
  onDynamicProcessResourceSample(): Event<AgentLaneResourceSample>;
  /** MCP 进程生命周期与低频内存事件，仅供可信 Host relay 上报 ARMS。 */
  onDynamicMcpTelemetry(): Event<SkcodeMcpTelemetryEvent>;
  /** MCP 进程树资源事实，只供可信 Host 汇总上报。 */
  onDynamicMcpResourceSamples(): Event<SkcodeMcpResourceSample[]>;
  /** Bash 完成事实，仅可信 Host 资源旁路订阅。 */
  onDynamicToolExecResource(): Event<SkcodeToolExecResource>;
  /**
   * @deprecated 旧协议订阅面（session/subscribe + session/event + state.updated）。
   * task-index syncer 已迁 v4 sessions-index/workspace-config 帧；
   * 仅剩 skcodeTaskServiceAdapter.onDynamicTaskEvent（replayable 读路径）消费。
   * 写路径已收敛 v4 命令面；本订阅是读路径投影源。
   */
  onDynamicSessionEvent(params: SkcodeAgentSessionSubscribeParams): Event<SkcodeAgentServiceEvent>;
  // ── v4 conversation 通道（竖切）──
  /** RPC attachment 建立后先读取 host 可信 hello。 */
  helloConversationV4(): Promise<HelloMessage>;
  /** hello 校验后回送 clientHello；metadata 不能覆盖 connection mode/profile。 */
  initializeConversationV4(clientHello: ClientHello): Promise<void>;
  /** 仅供 trusted host relay/facade；terminal RPC caller 必须被 connection scope 拒绝。 */
  setConnectionFlowStateV4(params: SkcodeAgentConnectionFlowParams): Promise<void>;
  subscribeConversationV4(
    params: SkcodeAgentConversationSubscribeParams,
  ): Promise<V4ConversationSubscribeResult>;
  resyncConversationV4(
    params: SkcodeAgentConversationResyncParams,
  ): Promise<V4ConversationResyncResult>;
  unsubscribeConversationV4(params: SkcodeAgentConversationUnsubscribeParams): Promise<void>;
  /** rows/range 行分页 query（loadOlder 游标向上补历史）。 */
  conversationRowsRangeV4(
    params: SkcodeAgentConversationRowsRangeParams,
  ): Promise<V4ConversationRowsRangeResult>;
  conversationPlansV4(
    params: SkcodeAgentConversationPlansParams,
  ): Promise<V4ConversationPlansResult>;
  /** workflow run 事件日志分页；与 plans 同族（只读、无状态、超时重发安全）。 */
  conversationWorkflowRunEventsV4(
    params: SkcodeAgentConversationWorkflowRunEventsParams,
  ): Promise<V4ConversationWorkflowRunEventsResult>;
  /** workflow run 枚举；journal-backed 的重启后发现面。 */
  conversationWorkflowRunsV4(
    params: SkcodeAgentConversationWorkflowRunsParams,
  ): Promise<V4ConversationWorkflowRunsResult>;
  /** workflow run 的用户面产物清单；与 plans 同族（只读、无状态、超时重发安全）。 */
  conversationWorkflowRunArtifactsV4(
    params: SkcodeAgentConversationWorkflowRunArtifactsParams,
  ): Promise<V4ConversationWorkflowRunArtifactsResult>;
  /** 预置看板的条目分页；hook 以 itemCount 变化为信号增量拉取。 */
  conversationWorkflowRunArtifactDataV4(
    params: SkcodeAgentConversationWorkflowRunArtifactDataParams,
  ): Promise<V4ConversationWorkflowRunArtifactDataResult>;
  /** 内容产物的字节，一次一块；授权在 CLI 侧（journal 行才是取字节的依据）。 */
  conversationWorkflowRunArtifactReadV4(
    params: SkcodeAgentConversationWorkflowRunArtifactReadParams,
  ): Promise<V4ConversationWorkflowRunArtifactReadResult>;
  /** dwf 工作区 transcript 的清单。 */
  conversationWorkflowRunWorkspaceV4(
    params: SkcodeAgentConversationWorkflowRunWorkspaceParams,
  ): Promise<V4ConversationWorkflowRunWorkspaceResult>;
  /** 一个工作区节点的有界正文。 */
  conversationWorkflowRunNodeResultV4(
    params: SkcodeAgentConversationWorkflowRunNodeResultParams,
  ): Promise<V4ConversationWorkflowRunNodeResultResult>;
  backgroundBashOutputV4(
    params: SkcodeAgentBackgroundBashOutputParams,
  ): Promise<BackgroundBashOutputResult>;
  conversationFileChangesV4(
    params: SkcodeAgentConversationFileChangesParams,
  ): Promise<V4ConversationFileChangesResult>;
  conversationFileRewindPreviewV4(
    params: SkcodeAgentConversationFileRewindPreviewParams,
  ): Promise<V4ConversationFileRewindPreviewResult>;
  sendConversationCommandV4(params: SkcodeAgentConversationCommandParams): Promise<CommandAck>;
  queryConversationCommandsV4(params: SkcodeAgentCommandsQueryParams): Promise<CommandsQueryResult>;
  attachmentBeginV4(params: SkcodeAgentAttachmentBeginParams): Promise<V4AttachmentBeginResult>;
  attachmentChunkV4(params: SkcodeAgentAttachmentChunkParams): Promise<V4AttachmentChunkResult>;
  attachmentCommitV4(
    params: SkcodeAgentAttachmentTerminalParams,
  ): Promise<V4AttachmentCommitResult>;
  attachmentAbortV4(params: SkcodeAgentAttachmentTerminalParams): Promise<void>;
  /** Desktop local 已发送视频 source query；远端与 Web 返回 chunked。 */
  attachmentPreviewSourceV4(
    params: SkcodeAgentAttachmentPreviewSourceParams,
  ): Promise<V4AttachmentPreviewSourceResult>;
  /** 已发送 image/video 只读分块查询；connection scope 注入可信 workspace 连接。 */
  attachmentReadV4(params: SkcodeAgentAttachmentReadParams): Promise<V4AttachmentReadResult>;
  /** Share 读取 userInput 附件，允许 text/plain 等非媒体类型。 */
  conversationAttachmentReadV4(
    params: SkcodeAgentConversationAttachmentReadParams,
  ): Promise<V4ConversationAttachmentReadResult>;
  /** Share 选择阶段只读 userInput 附件元数据，不读取完整内容。 */
  conversationAttachmentStatV4(
    params: SkcodeAgentConversationAttachmentStatParams,
  ): Promise<V4ConversationAttachmentStatResult>;
  /** workspace 级下行帧流（v4/conversation/frame），renderer 侧按 topic 自行路由。 */
  onDynamicConversationFrame(
    params: SkcodeAgentWorkspaceTarget,
  ): Event<ConversationTopicWireCandidate>;
  /** workspace 级 live telemetry 事实；connection facade 仅向可信 desktop-continuous 下游暴露。 */
  onDynamicLocalTtftFacts(
    params: SkcodeAgentWorkspaceTarget,
  ): Event<import("@skcode/shared").LocalTtftFacts>;
  onDynamicConversationTelemetryFact(
    params: SkcodeAgentWorkspaceTarget,
  ): Event<ConversationTelemetryFact>;
  /** 当前窗口全部本地 live task 的 CUA 权限观察；历史、远程与 replayable 不在此事件面。 */
  onDynamicCuaPermissionObservation(): Event<SkcodeAgentCuaPermissionObservation>;
  // ── sessions-index 通道（列表活性）──
  subscribeSessionsIndexV4(
    params: SkcodeAgentSessionsIndexSubscribeParams,
  ): Promise<V4SessionsIndexSubscribeResult>;
  resyncSessionsIndexV4(
    params: SkcodeAgentConversationResyncParams,
  ): Promise<V4ConversationResyncResult>;
  unsubscribeSessionsIndexV4(params: SkcodeAgentConversationUnsubscribeParams): Promise<void>;
  /** workspace 级 sessions-index 下行帧流（与 conversation 同一通知，按 topic 前缀分流）。 */
  onDynamicSessionsIndexFrame(
    params: SkcodeAgentWorkspaceTarget,
  ): Event<SessionsIndexTopicWireCandidate>;
  // ── workspace-config 通道（配置目录活性；task-index syncer 消费）──
  subscribeWorkspaceConfigV4(
    params: SkcodeAgentWorkspaceConfigSubscribeParams,
  ): Promise<V4WorkspaceConfigSubscribeResult>;
  resyncWorkspaceConfigV4(
    params: SkcodeAgentConversationResyncParams,
  ): Promise<V4ConversationResyncResult>;
  unsubscribeWorkspaceConfigV4(params: SkcodeAgentConversationUnsubscribeParams): Promise<void>;
  /** workspace 级 workspace-config 下行帧流（与 conversation 同一通知，按 topic 前缀分流）。 */
  onDynamicWorkspaceConfigFrame(
    params: SkcodeAgentWorkspaceTarget,
  ): Event<WorkspaceConfigTopicWireCandidate>;
  /**
   * （CLI 重连重订）：agent 进程换代通知（超时回收/崩溃后重新拉起）。
   * v4 订阅活在 CLI 进程内存，进程换代即失效；订阅方（task-index syncer 等）
   * 收到后必须对该 workspaceKey 重发 subscribe，否则帧流静默中断。
   */
  onAgentRuntimeRestarted(listener: (event: { workspaceKey: string }) => void): IDisposable;
  /**
   * Agent client 在 service 内完成登记后发布 available，当前 client 关闭后发布 unavailable。
   * 这是被动 observer attach/detach 的唯一生命周期信号，不表达用户使用租约。
   */
  onAgentRuntimeLifecycle?: (
    listener: (event: SkcodeAgentRuntimeLifecycleEvent) => void,
  ) => IDisposable;
  /** 当前 desktop-local CUA turn 是否仍在执行，用于 Helper recovery 避免中途回收 Agent。 */
  hasActiveCuaOperationTurn(): boolean;
  disposeWorkspace(params: SkcodeAgentWorkspaceTarget): Promise<void>;
  disposeAll(): void;
}

export const ISkcodeAgentService = createServiceDescriptor<ISkcodeAgentService>(
  ServiceChannels.SkcodeAgent,
);
