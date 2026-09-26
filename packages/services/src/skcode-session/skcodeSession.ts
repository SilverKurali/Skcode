import { ServiceChannels } from "@skcode/shared";
import type {
  TraceId,
  SkcodeAgentMcpServer,
  SkcodeDeliveryKind,
  SkcodeMessageWithParts,
  ModelSelection,
  SkcodePermissionRequestParams,
  SkcodeUserInputRequestParams,
  SkcodeUserInputResponse,
  SkcodeSessionInfo,
  SkcodeSessionImportHistory,
  SkcodeSessionEvent,
  SkcodeSessionMode,
  SkcodeSessionPersistence,
  SkcodeSessionStateSnapshot,
  SkcodeStateUpdatedNotification,
  SkcodeWorkspacePresentation,
} from "@skcode/shared";
import { createServiceDescriptor } from "#src/descriptors.js";

export interface SkcodeSessionWorkspaceTarget {
  workspacePath: string;
  workspaceIdentity?: string;
  remoteSessionId?: string;
}

export type SkcodeSessionReadWorkspacePresentationParams = SkcodeSessionWorkspaceTarget;

export interface SkcodeTaskTarget extends SkcodeSessionWorkspaceTarget {
  sessionId: string;
}

export interface SkcodeSessionCreateParams extends SkcodeSessionWorkspaceTarget {
  /** 仅导入事务使用的预分配 ID；普通新会话继续由 Agent 分配。 */
  sessionId?: string;
  sessionTraceId?: TraceId;
  parentSessionId?: string;
  mode?: SkcodeSessionMode;
  model?: ModelSelection;
  persistence?: SkcodeSessionPersistence;
  thoughtLevel?: string;
  mcpServers?: SkcodeAgentMcpServer[];
  importedHistory?: SkcodeSessionImportHistory;
}

export interface SkcodeSessionResumeParams extends SkcodeTaskTarget {
  model?: ModelSelection;
  thoughtLevel?: string;
  mcpServers?: SkcodeAgentMcpServer[];
  /**
   * 默认广播 resume 得到的历史快照，并让 shadow 订阅请求初始 snapshot。
   * 续聊发送前的 runtime 预恢复会关闭它，避免旧终态快照覆盖本地已开始的新输入运行态。
   */
  broadcastSnapshot?: boolean;
}

export interface SkcodeSessionListParams extends SkcodeSessionWorkspaceTarget {
  includeArchived?: boolean;
  limit?: number;
}

export interface SkcodeSessionReadParams extends SkcodeTaskTarget {
  deliveryKind?: SkcodeDeliveryKind;
  messageLimit?: number;
  afterSeq?: number;
}

export interface SkcodeSessionMessagesParams extends SkcodeTaskTarget {
  afterMessageId?: string;
  limit?: number;
}

export interface SkcodeSessionEventsParams extends SkcodeTaskTarget {
  afterSeq?: number;
  limit?: number;
}

export interface SkcodeSessionSetModelParams extends SkcodeTaskTarget {
  model: ModelSelection;
  expectedRevision?: number;
  persistAsWorkspaceLastUsed?: boolean;
}

export interface SkcodeSessionSetThoughtLevelParams extends SkcodeTaskTarget {
  thoughtLevel?: string;
  expectedRevision?: number;
  persistAsWorkspaceLastUsed?: boolean;
}

export interface SkcodeSessionSetModeParams extends SkcodeTaskTarget {
  mode: SkcodeSessionMode;
  expectedRevision?: number;
}

export interface SkcodeSessionSubscribeParams extends SkcodeTaskTarget {
  deliveryKind: SkcodeDeliveryKind;
  afterSeq?: number;
  includeSnapshot?: boolean;
  eventCoalescing?: {
    mode: "background-summary";
    intervalMs?: number;
  };
}

export type SkcodeSessionServiceEvent =
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

export interface SkcodeSessionInitializeResult {
  available: boolean;
  workspaceKey: string;
  protocolName?: string;
  protocolVersion?: number;
  transportKind?: "stdio" | "websocket";
  reason?: string;
  reasonCode?: "provider_not_ready";
}

export interface SkcodeSessionWorkspaceRuntimeIdentity {
  generation: number;
  identity: string;
  processId?: number;
  workspaceKey: string;
}

export interface ISkcodeSessionService {
  initializeWorkspace(params: SkcodeSessionWorkspaceTarget): Promise<SkcodeSessionInitializeResult>;
  getWorkspaceRuntimeIdentity(
    params: SkcodeSessionWorkspaceTarget,
  ): Promise<SkcodeSessionWorkspaceRuntimeIdentity>;
  readWorkspacePresentation(
    params: SkcodeSessionReadWorkspacePresentationParams,
  ): Promise<SkcodeWorkspacePresentation>;
  createSession(params: SkcodeSessionCreateParams): Promise<SkcodeSessionStateSnapshot>;
  resumeSession(params: SkcodeSessionResumeParams): Promise<SkcodeSessionStateSnapshot>;
  listSessions(params: SkcodeSessionListParams): Promise<SkcodeSessionInfo[]>;
  readSession(params: SkcodeSessionReadParams): Promise<SkcodeSessionStateSnapshot>;
  readSessionMessages(params: SkcodeSessionMessagesParams): Promise<SkcodeMessageWithParts[]>;
  readSessionEvents(params: SkcodeSessionEventsParams): Promise<SkcodeSessionEvent[]>;
  promoteDeferredDraftSession(params: SkcodeTaskTarget): Promise<void>;
  closeSession(params: SkcodeTaskTarget): Promise<void>;
  closeDeferredDraftSession(params: SkcodeTaskTarget): Promise<boolean>;
  setModel(params: SkcodeSessionSetModelParams): Promise<SkcodeSessionStateSnapshot>;
  setThoughtLevel(params: SkcodeSessionSetThoughtLevelParams): Promise<SkcodeSessionStateSnapshot>;
  setMode(params: SkcodeSessionSetModeParams): Promise<SkcodeSessionStateSnapshot>;
  // renderer 订阅面走 agentService 的 conversation/sessions-index 帧通道。
}

export const ISkcodeSessionService = createServiceDescriptor<ISkcodeSessionService>(
  ServiceChannels.SkcodeSession,
);
