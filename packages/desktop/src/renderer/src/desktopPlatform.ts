import { recordArmsCustomEventForE2E } from "@skcode/ui";
import {
  DesktopCommandIds,
  buildLocalMediaPreviewUrl,
  type IPlatformService,
} from "@skcode/shared";

import { desktopBrowserPlatformBridge } from "./desktopBrowserPlatformBridge.js";

export function createDesktopPlatform(options: {
  isLocalDevelopmentRuntime: boolean;
}): IPlatformService {
  return {
    canSelectFilePath: true,
    createLocalMediaPreviewUrl: buildLocalMediaPreviewUrl,
    isLocalDevelopmentRuntime: options.isLocalDevelopmentRuntime,
    selectDirectory: () => window.skcode.selectDirectory(),
    selectFile: () => window.skcode.selectFile(),
    selectFiles: () => window.skcode.selectFiles?.() ?? Promise.resolve([]),
    createTempTextAttachment: (payload) => window.skcode.createTempTextAttachment(payload),
    onRemoteConnectionLog: (handler) => window.skcode.onRemoteConnectionLog(handler),
    onRemoteSessionClosed: (handler) => window.skcode.onRemoteSessionClosed(handler),
    onBotRemoteWorkspaceReconnected: (handler) =>
      window.skcode.onBotRemoteWorkspaceReconnected(handler),
    activateOrSetWorkspace: (path) =>
      window.skcode.activateOrSetWorkspace?.(path) ?? Promise.resolve({ activated: false }),
    connectRemote: (remoteOptions, requestId, context) =>
      window.skcode.connectRemote(remoteOptions, requestId, context),
    cancelPendingRemoteConnection: (requestId) =>
      window.skcode.cancelPendingRemoteConnection?.(requestId) ?? Promise.resolve(),
    bindRemoteWorkspaceSessionContext: (context) =>
      window.skcode.bindRemoteWorkspaceSessionContext?.(context) ?? Promise.resolve(),
    disposeRemoteSession: (sessionId) => window.skcode.disposeRemoteSession(sessionId),
    isDockerAvailable: () => window.skcode.isDockerAvailable(),
    listWSLDistros: () => window.skcode.listWSLDistros(),
    listDockerContainers: () => window.skcode.listDockerContainers(),
    listSSHConfigAliases: () => window.skcode.listSSHConfigAliases(),
    loadMcpFromUserDirectory: (payload) => window.skcode.loadMcpFromUserDirectory(payload),
    saveMcpToUserDirectory: (payload) => window.skcode.saveMcpToUserDirectory(payload),
    migrateLegacyCommonMcp: (payload) => window.skcode.migrateLegacyCommonMcp(payload),
    openExternal: (url) => window.skcode.openExternal(url),
    openFeedback: () => window.skcode.executeDesktopCommand(DesktopCommandIds.OpenFeedback),
    openCommunity: () => window.skcode.executeDesktopCommand(DesktopCommandIds.OpenCommunity),
    canOpenCommunity: (locale) => window.skcode.canOpenCommunity(locale),
    listPetPacks: () => window.skcode.listPetPacks(),
    readPetAsset: (packId, file) => window.skcode.readPetAsset(packId, file),
    asrTranscribe: (request) => window.skcode.asrTranscribe(request),
    providerListModels: (request) => window.skcode.providerListModels(request),
    openInFileManager: (path) => window.skcode.openInFileManager(path),
    openExternalFile: (path) => window.skcode.openExternalFile(path),
    openCuaPermissionOnboarding: window.skcode.openCuaPermissionOnboarding
      ? (permissionOptions) =>
          window.skcode.openCuaPermissionOnboarding?.(permissionOptions) ??
          Promise.resolve({ success: false, error: "not_supported" })
      : undefined,
    prepareCuaHelperPermissionDrag: window.skcode.prepareCuaHelperPermissionDrag
      ? () =>
          window.skcode.prepareCuaHelperPermissionDrag?.() ??
          Promise.resolve({ success: false, error: "not_supported" })
      : undefined,
    startCuaHelperPermissionDrag: window.skcode.startCuaHelperPermissionDrag
      ? () => window.skcode.startCuaHelperPermissionDrag?.()
      : undefined,
    registerOAuthState: (payload) => window.skcode.registerOAuthState(payload),
    onOAuthCallback: (callback) => window.skcode.onOAuthCallback(callback),
    onPaymentCallback: (callback) => window.skcode.onPaymentCallback(callback),
    onShareImport: (callback) => window.skcode.onShareImport?.(callback) ?? (() => {}),
    notifyRendererReady: () => window.skcode.notifyRendererReady(),
    reportTelemetryEvent: (payload) => window.skcode.reportTelemetryEvent(payload),
    reportArmsCustomEvent: (payload) => {
      recordArmsCustomEventForE2E(payload);
      return window.skcode.reportArmsCustomEvent(payload);
    },
    getRendererActionTraceConfig: window.skcode.getRendererActionTraceConfig
      ? () => window.skcode.getRendererActionTraceConfig!()
      : undefined,
    onRendererActionTraceConfigChanged: window.skcode.onRendererActionTraceConfigChanged
      ? (callback) => window.skcode.onRendererActionTraceConfigChanged!(callback)
      : undefined,
    reportLocalTtftBatch: (batch) => window.skcode.reportLocalTtftBatch(batch),
    reportRendererActionTraceBatch: window.skcode.reportRendererActionTraceBatch
      ? (batch) => window.skcode.reportRendererActionTraceBatch!(batch)
      : undefined,
    reportRendererHeapSample: window.skcode.reportRendererHeapSample
      ? (sample) => window.skcode.reportRendererHeapSample!(sample)
      : undefined,
    showTaskNotification: (payload) => window.skcode.showTaskNotification(payload),
    syncWindowTabs: (paths) => window.skcode.syncWindowTabs(paths),
    syncWindowUnreadCount: (count) => window.skcode.syncWindowUnreadCount(count),
    syncActiveTaskSession: (sessionId) => window.skcode.syncActiveTaskSession(sessionId),
    syncAppSettings: (patch) => window.skcode.syncAppSettings?.(patch),
    setShortcutRecordingActive: (active) => window.skcode.setShortcutRecordingActive?.(active),
    onFocusTab: (handler) => window.skcode.onFocusTab(handler),
    onNewTab: (handler) => window.skcode.onNewTab(handler),
    onCloseActiveContextRequest: (handler) =>
      window.skcode.onCloseActiveContextRequest?.(handler) ?? (() => {}),
    onOpenBrowserUrl: (handler) => window.skcode.onOpenBrowserUrl?.(handler) ?? (() => {}),
    onBrowserViewScreenshotSurfacePrepare: (handler) =>
      window.skcode.onBrowserViewScreenshotSurfacePrepare?.(handler) ?? (() => {}),
    onBrowserViewScreenshotSurfaceRelease: (handler) =>
      window.skcode.onBrowserViewScreenshotSurfaceRelease?.(handler) ?? (() => {}),
    browserViewScreenshotSurfaceReady: (payload) =>
      window.skcode.browserViewScreenshotSurfaceReady?.(payload),
    ...desktopBrowserPlatformBridge,
    onNewTask: (handler) => window.skcode.onNewTask(handler),
    onOpenWorkspace: (handler) => {
      // 开发态或升级后的旧窗口可能仍运行未暴露 onOpenWorkspace 的 preload，
      // renderer 直接调用会在启动时崩溃。这里和 activateOrSetWorkspace 一样做兼容兜底，
      // 缺少该 bridge 时只禁用原生菜单回调，不影响应用继续打开。
      return window.skcode.onOpenWorkspace?.(handler) ?? (() => {});
    },
    onOpenWorkspacePath: (handler) => window.skcode.onOpenWorkspacePath?.(handler) ?? (() => {}),
    onOpenFeedbackDialog: (handler) => window.skcode.onOpenFeedbackDialog?.(handler) ?? (() => {}),
    onOpenTicketsPanel: (handler) => window.skcode.onOpenTicketsPanel?.(handler) ?? (() => {}),
    onWindowFullscreenChanged: (handler) => window.skcode.onWindowFullscreenChanged(handler),
    getDesktopWindowChromeState: window.skcode.getDesktopWindowChromeState
      ? () => window.skcode.getDesktopWindowChromeState!()
      : undefined,
    onDesktopWindowChromeStateChanged: window.skcode.onDesktopWindowChromeStateChanged
      ? (handler) => window.skcode.onDesktopWindowChromeStateChanged!(handler)
      : undefined,
    getWindowControlsOverlayMetrics: () =>
      window.skcode.getWindowControlsOverlayMetrics?.() ?? null,
    onWindowControlsOverlayChanged: (handler) =>
      window.skcode.onWindowControlsOverlayChanged?.(handler) ?? (() => {}),
    getDesktopZoomLevel: () =>
      window.skcode.getDesktopZoomLevel?.() ?? Promise.resolve({ zoomLevel: 0 }),
    onDesktopZoomLevelChanged: (handler) =>
      window.skcode.onDesktopZoomLevelChanged?.(handler) ?? (() => {}),
    onTaskNotificationClick: (handler) => window.skcode.onTaskNotificationClick(handler),
    exportLogs: () => window.skcode.exportLogs(),
    captureWindowScreenshot: () =>
      window.skcode.captureWindowScreenshot?.() ?? Promise.resolve(null),
    onUpdateReady: (callback) => window.skcode.onUpdateReady(callback),
    onUpdateCheckResult: (callback) => window.skcode.onUpdateCheckResult(callback),
    onUpdateStateChanged: (callback) =>
      window.skcode.onUpdateStateChanged?.(callback) ?? (() => {}),
    getUpdateState: () =>
      window.skcode.getUpdateState?.() ?? Promise.resolve({ kind: "idle", enabled: true }),
    downloadUpdate: () => window.skcode.downloadUpdate?.() ?? Promise.resolve(),
    cancelUpdateDownload: () => window.skcode.cancelUpdateDownload?.() ?? Promise.resolve(),
    openUpdateStatusWindow: () => window.skcode.openUpdateStatusWindow?.() ?? Promise.resolve(),
    getAutoUpdatePreferences: () =>
      window.skcode.getAutoUpdatePreferences?.() ??
      Promise.resolve({ autoDownloadAndInstallUpdates: false }),
    setAutoDownloadAndInstallUpdates: (enabled) =>
      window.skcode.setAutoDownloadAndInstallUpdates?.(enabled) ?? Promise.resolve(),
    getDesktopSessionActivity: () =>
      window.skcode.getDesktopSessionActivity?.() ??
      Promise.resolve({ runningAgentSessionCount: 0 }),
    getSkcodeStdioTapDevState: () =>
      window.skcode.getSkcodeStdioTapDevState?.() ??
      Promise.resolve({ enabled: false, visible: false, logDir: "", statePath: "" }),
    onSettingsChanged: (callback) => window.skcode.onSettingsChanged?.(callback) ?? (() => {}),
    onApplicationLocaleChanged: (callback) =>
      window.skcode.onApplicationLocaleChanged?.(callback) ?? (() => {}),
    onPostUpdateReleaseNotes: (callback) => window.skcode.onPostUpdateReleaseNotes(callback),
    acknowledgePostUpdateReleaseNotes: (version) =>
      window.skcode.acknowledgePostUpdateReleaseNotes(version),
    skipUpdateVersion: (version) => window.skcode.skipUpdateVersion?.(version) ?? Promise.resolve(),
    quitAndInstallUpdate: () => window.skcode.quitAndInstallUpdate(),
    getInstalledEditors: () => window.skcode.getInstalledEditors(),
    getApplicationIcon: (bundleId) =>
      window.skcode.getApplicationIcon?.(bundleId) ?? Promise.resolve(null),
    openInEditor: (editorId, path, editorOptions) =>
      window.skcode.openInEditor(editorId, path, editorOptions),
    executeDesktopCommand: (command) => window.skcode.executeDesktopCommand(command),
    setApplicationLocale: (locale) => window.skcode.setApplicationLocale(locale),
    getSystemLocale: () =>
      window.skcode.getSystemLocale?.() ??
      Promise.resolve(navigator.language.toLowerCase().startsWith("zh") ? "zh-CN" : "en-US"),
    setTitleBarTheme: (theme) => window.skcode.setTitleBarTheme(theme),
    getDeviceId: () =>
      (window as Window & { __SKCODE_DEVICE_ID__?: string }).__SKCODE_DEVICE_ID__ ?? "",
  };
}
