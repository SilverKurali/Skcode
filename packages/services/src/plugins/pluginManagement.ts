// 平台能力面收敛：设置页「插件管理」的薄服务接口。
//
// 背景：pluginManagementStore / usePluginUninstall 过去直接注入 ISkcodeAgentService，
// UI 层因此散布 13 个 plugins/* 旧协议词的消费点。收敛为独立薄 service 后，UI 只依赖
// 本接口；plugins/* 词表的 host 侧消费点收拢到 pluginManagementService 一处（插件的
// 事实源在 skcode-cli 进程，服务实现仍经 agent 协议往返——plugins 词表的收口归属
// 插件能力面自身的协议演进，不在会话 v4 词表范围内）。
// 注意与既有 IPluginsService（已 retired 的 marketplace pluginStore 通道）区分：
// 那套接口按 pluginName+marketplace 寻址且方法语义过时，不复用避免签名冲突。
import type { Event } from "@skcode/rpc";
import type {
  SkcodePluginOperationProgressNotification,
  SkcodePluginsConfigureResult,
  SkcodePluginsCancelOperationResult,
  SkcodePluginsDescribeResult,
  SkcodePluginsInstallResult,
  SkcodePluginsListResult,
  SkcodePluginsMarketplaceMutationResult,
  SkcodePluginsOverviewResult,
  SkcodePluginsReferenceCatalogResult,
  SkcodePluginsRestoreBuiltinResult,
  SkcodePluginsSetEnabledResult,
  SkcodePluginsUninstallResult,
  SkcodePluginsValidateResult,
} from "@skcode/shared";
import { ServiceChannels } from "@skcode/shared";
import { createServiceDescriptor } from "../descriptors.js";
import type {
  SkcodeAgentAddPluginMarketplaceParams,
  SkcodeAgentConfigurePluginParams,
  SkcodeAgentCancelPluginOperationParams,
  SkcodeAgentDescribePluginParams,
  SkcodeAgentInstallPluginParams,
  SkcodeAgentPluginReferenceCatalogParams,
  SkcodeAgentResolveSuggestedPluginReferenceParams,
  SkcodeAgentResetPluginConfigParams,
  SkcodeAgentPluginViewParams,
  SkcodeAgentRemovePluginMarketplaceParams,
  SkcodeAgentRestoreBuiltinPluginParams,
  SkcodeAgentSetPluginEnabledParams,
  SkcodeAgentUninstallPluginParams,
  SkcodeAgentUpdatePluginMarketplaceParams,
  SkcodeAgentUpdatePluginParams,
  SkcodeAgentValidatePluginParams,
} from "../skcode-agent/skcodeAgentPluginParams.js";

export interface IPluginManagementService {
  listPlugins(params: SkcodeAgentPluginViewParams): Promise<SkcodePluginsListResult>;
  /**
   * Plugin 对话引用 catalog：
   * 带 sessionId → session-owned 冻结 catalog；不带 → workspace 当前 catalog。
   * 实现路由到 workspace 级 agent client，不走插件管理独立进程。
   */
  getPluginReferenceCatalog(
    params: SkcodeAgentPluginReferenceCatalogParams,
  ): Promise<SkcodePluginsReferenceCatalogResult>;
  resolveSuggestedPluginReference(
    params: SkcodeAgentResolveSuggestedPluginReferenceParams,
  ): Promise<import("@skcode/shared").SkcodePluginsResolveSuggestedReferenceResult>;
  onDynamicPluginOperationProgress(
    operationId: string,
  ): Event<SkcodePluginOperationProgressNotification>;
  getPluginsOverview(params: SkcodeAgentPluginViewParams): Promise<SkcodePluginsOverviewResult>;
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
}

export const IPluginManagementService = createServiceDescriptor<IPluginManagementService>(
  ServiceChannels.PluginManagement,
);
