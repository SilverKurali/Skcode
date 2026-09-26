import type {
  SkcodeAgentMcpServer,
  SkcodeAutomationScheduleRule,
  SkcodeMcpListMode,
  ModelSelection,
} from "@skcode/shared";

export interface SkcodeAgentWorkspaceTarget {
  workspacePath: string;
  workspaceIdentity?: string;
  /** 远程 workspace 的运行时会话身份；只用于隔离/路由，不能替代 workspacePath。 */
  remoteSessionId?: string;
}

export interface SkcodeAgentPluginViewParams extends SkcodeAgentWorkspaceTarget {
  configScope?: "user" | "workspace";
}

export interface SkcodeAgentListMcpServerStatusesParams extends SkcodeAgentWorkspaceTarget {
  mcpServers?: SkcodeAgentMcpServer[];
  mode?: SkcodeMcpListMode;
}

export interface SkcodeAgentAddPluginMarketplaceParams extends SkcodeAgentWorkspaceTarget {
  dryRun?: boolean;
  operationId?: string;
  source: string;
}

export interface SkcodeAgentRemovePluginMarketplaceParams extends SkcodeAgentWorkspaceTarget {
  marketplace: string;
}

export interface SkcodeAgentUpdatePluginMarketplaceParams extends SkcodeAgentWorkspaceTarget {
  marketplace?: string;
  operationId?: string;
}

export interface SkcodeAgentInstallPluginParams extends SkcodeAgentWorkspaceTarget {
  dryRun?: boolean;
  marketplace: string;
  operationId?: string;
  pluginName: string;
  scope?: "user" | "workspace";
}

export interface SkcodeAgentCancelPluginOperationParams {
  operationId: string;
}

export interface SkcodeAgentUninstallPluginParams extends SkcodeAgentWorkspaceTarget {
  marketplace?: string;
  pluginId?: string;
  pluginName?: string;
  removeCache?: boolean;
}

export interface SkcodeAgentUpdatePluginParams extends SkcodeAgentWorkspaceTarget {
  pluginId?: string;
  marketplace?: string;
}

export interface SkcodeAgentRestoreBuiltinPluginParams extends SkcodeAgentWorkspaceTarget {
  pluginId: string;
}

export interface SkcodeAgentConfigurePluginParams extends SkcodeAgentWorkspaceTarget {
  clearOptionKeys?: string[];
  dryRun?: boolean;
  options: Record<string, unknown>;
  pluginId: string;
  scope?: "user" | "workspace";
}

export interface SkcodeAgentResetPluginConfigParams extends SkcodeAgentWorkspaceTarget {
  pluginId: string;
  scope?: "user" | "workspace";
}

export interface SkcodeAgentValidatePluginParams extends SkcodeAgentWorkspaceTarget {
  marketplace?: string;
  pluginName?: string;
  source?: string;
}

export interface SkcodeAgentDescribePluginParams extends SkcodeAgentWorkspaceTarget {
  marketplace: string;
  pluginName: string;
}

export interface SkcodeAgentSetPluginEnabledParams extends SkcodeAgentWorkspaceTarget {
  enabled: boolean;
  operationId?: string;
  pluginId: string;
  scope?: "user" | "workspace";
}

// Plugin 对话引用 catalog：
// 带 sessionId → session-owned 冻结 catalog（必须路由到持有该 session 的 workspace client）；
// 不带 → workspace 当前 catalog（新建草稿 Picker）。
export interface SkcodeAgentPluginReferenceCatalogParams extends SkcodeAgentWorkspaceTarget {
  sessionId?: string;
}

// Composer Skill catalog：与 Plugin 引用相同，以 sessionId 区分 workspace 当前目录和
// resident Session runtime 快照；不参与 Settings 管理目录。
export interface SkcodeAgentSkillReferenceCatalogParams extends SkcodeAgentWorkspaceTarget {
  sessionId?: string;
}
export interface SkcodeAgentResolveSuggestedPluginReferenceParams extends SkcodeAgentWorkspaceTarget {
  stableId: string;
  operationId: string;
  clientMode: "desktop-continuous" | "web-remote-replayable";
  deliveryKind: "desktop-continuous" | "web-remote-replayable";
}

// ---- 定时任务(automation)管理参数 ----

export interface SkcodeAgentCreateAutomationParams extends SkcodeAgentWorkspaceTarget {
  title: string;
  cronExpr: string;
  relativeDelayMinutes?: number;
  prompt: string;
  modelSelection?: ModelSelection;
  mode?: string;
  recurring?: boolean;
  maxRuns?: number;
  endAt?: number;
  scheduleRule?: SkcodeAutomationScheduleRule;
}

export interface SkcodeAgentUpdateAutomationParams extends SkcodeAgentWorkspaceTarget {
  automationId: string;
  title?: string;
  cronExpr?: string;
  prompt?: string;
  modelSelection?: ModelSelection | null;
  mode?: string | null;
  recurring?: boolean;
  maxRuns?: number | null;
  endAt?: number | null;
  scheduleRule?: SkcodeAutomationScheduleRule | null;
  scheduleEditedByUser?: boolean;
}

export interface SkcodeAgentAutomationIdParams extends SkcodeAgentWorkspaceTarget {
  automationId: string;
}

export interface SkcodeAgentSetAutomationEnabledParams extends SkcodeAgentWorkspaceTarget {
  automationId: string;
  enabled: boolean;
}

export interface SkcodeAgentDeleteAutomationRunParams extends SkcodeAgentWorkspaceTarget {
  runId: string;
}
