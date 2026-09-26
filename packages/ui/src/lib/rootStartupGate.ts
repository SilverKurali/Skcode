interface RootStartupGateState {
  isResolvingProviderStartupState: boolean;
  isRestoring: boolean;
  isBootstrappingInitialWorkspace: boolean;
}

interface RootStartupLoadingVisibilityState extends RootStartupGateState {
  isDesktop: boolean | undefined;
}

interface FallbackWorkspaceCreateState {
  isMounted: boolean;
  activeWorkspacePath: string | null;
}

interface ProviderStartupSyncState {
  providerFamilyDomainMigrationComplete: boolean;
  modelSelectionViewHydrated: boolean;
}

export function shouldBlockRootRender(state: RootStartupGateState): boolean {
  return (
    state.isResolvingProviderStartupState ||
    state.isRestoring ||
    state.isBootstrappingInitialWorkspace
  );
}

export function shouldShowRootStartupLoading(state: RootStartupLoadingVisibilityState): boolean {
  // 启动阻塞只是桌面窗口保护期（tab 恢复 / 模型选择 hydration / 初始 workspace 引导），
  // BYOK 模式下不存在登录门禁，任何非认证状态都不应把用户挡在启动 loading 之后。
  return Boolean(state.isDesktop) && shouldBlockRootRender(state);
}

export function shouldOpenFallbackWorkspaceAfterCreate(
  state: FallbackWorkspaceCreateState,
): boolean {
  return state.isMounted && !state.activeWorkspacePath;
}

export function isProviderStartupSyncPending(state: ProviderStartupSyncState): boolean {
  return !state.providerFamilyDomainMigrationComplete || !state.modelSelectionViewHydrated;
}
