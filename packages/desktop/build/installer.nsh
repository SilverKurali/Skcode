!include nsDialogs.nsh
!include FileFunc.nsh

!ifndef SKCODE_INSTALLER_DEFAULT_LOG_PATH
  !define SKCODE_INSTALLER_DEFAULT_LOG_PATH "$TEMP\Skcode-installer.log"
!endif
!ifndef SKCODE_INSTALLER_ELEVATED_LOG_PATH
  !define SKCODE_INSTALLER_ELEVATED_LOG_PATH "$WINDIR\Logs\Skcode-installer.log"
!endif
!ifndef SKCODE_INSTALLER_IS_ELEVATED_INNER
  ; 来源只在测试夹具模拟内层，正式默认恒假会让提权进程继续使用调用方 /LOG。
  ; 使用 electron-builder 同一 UAC 判据；隔离夹具仍可显式替换，不改变真正的提权流程。
  !include UAC.nsh
  !define SKCODE_INSTALLER_IS_ELEVATED_INNER `${UAC_IsInnerInstance}`
!endif

!ifndef SKCODE_INSTALL_MANIFEST_NAME
  !define SKCODE_INSTALL_MANIFEST_NAME ".skcode-install-manifest"
!endif

!ifndef SKCODE_UNINSTALLER_LOG_PATH
  !define SKCODE_UNINSTALLER_LOG_PATH "$TEMP\Skcode-uninstaller.log"
!endif
!ifndef SKCODE_UNINSTALLER_FUNCTION_PREFIX
  !define SKCODE_UNINSTALLER_FUNCTION_PREFIX "un."
!endif

!ifdef BUILD_UNINSTALLER
  Var SkcodeUninstallerLogUnavailable

  ; 卸载器只在更新时删除旧文件；单独记录清理阶段，避免外层把权限/空间错误误报成应用仍在运行。
  !macro SkcodeReportUninstallerStage MESSAGE
    DetailPrint "Skcode: ${MESSAGE}"
    Push "${MESSAGE}"
    Call ${SKCODE_UNINSTALLER_FUNCTION_PREFIX}SkcodeWriteUninstallerLog
  !macroend

  Function ${SKCODE_UNINSTALLER_FUNCTION_PREFIX}SkcodeWriteUninstallerLog
    Exch $R9
    Push $R0
    Push $R1
    Push $R2

    StrCmp $SkcodeUninstallerLogUnavailable "1" skcodeUninstallerLogDone
    ClearErrors
    FileOpen $R1 "${SKCODE_UNINSTALLER_LOG_PATH}" a
    IfErrors skcodeUninstallerLogFailed skcodeUninstallerLogWrite
    skcodeUninstallerLogWrite:
      System::Call "kernel32::GetCurrentProcessId() i.R0"
      FileSeek $R1 0 END
      FileWrite $R1 "[pid=$R0] $R9$\r$\n"
      FileClose $R1
      Goto skcodeUninstallerLogDone
    skcodeUninstallerLogFailed:
      ; 日志不可写不应改变卸载结果，保留原始清理错误供外层处理。
      StrCpy $SkcodeUninstallerLogUnavailable "1"
      ClearErrors
    skcodeUninstallerLogDone:
      Pop $R2
      Pop $R1
      Pop $R0
      Pop $R9
  FunctionEnd

  !macro customRemoveFilesDiagnosticsStart
    !insertmacro SkcodeReportUninstallerStage "cleanup-started"
  !macroend

  !macro customRemoveFilesDiagnosticsComplete
    !insertmacro SkcodeReportUninstallerStage "cleanup-completed"
  !macroend
!endif

!macro customRemoveFiles
  ; electron-builder 默认在更新时递归删除整个 $INSTDIR，用户放入的无关文件也会被清掉。
  ; 只按上一版本随包生成的所有权清单删除，清单缺失时迁移旧版本采用 fail-open 保留策略。
  ${if} ${isUpdated}
    !ifdef BUILD_UNINSTALLER
      !insertmacro customRemoveFilesDiagnosticsStart
    !endif
    ClearErrors
    FileOpen $R0 "$INSTDIR\${SKCODE_INSTALL_MANIFEST_NAME}" r
    IfErrors skcodeManifestMissing

    skcodeManifestRead:
      ClearErrors
      FileRead $R0 $R1
      IfErrors skcodeManifestClose
      ; NSIS FileRead 保留行尾 CRLF；打包清单统一使用换行结尾，先去掉两个行尾字符。
      StrCpy $R1 $R1 -2
      StrCmp $R1 "" skcodeManifestRead

      ; 拒绝绝对路径和 .. 前缀，避免损坏或篡改清单越界删除。
      StrCpy $R2 $R1 1
      StrCmp $R2 "\\" skcodeManifestRead
      StrCmp $R2 "/" skcodeManifestRead
      StrCpy $R2 $R1 2
      StrCmp $R2 ".." skcodeManifestRead
      StrCmp $R1 "${UNINSTALL_FILENAME}" skcodeManifestRead
      GetFullPathName $R2 "$INSTDIR\$R1"
      StrCmp $R2 "$INSTDIR\$R1" 0 skcodeManifestRead

      ; 当前版本卸载器与外层安装器是两个进程；逐项记录到卸载器日志，便于核对真正尝试删除的文件。
      !ifdef BUILD_UNINSTALLER
        !insertmacro SkcodeReportUninstallerStage "cleanup-file path=$R1"
      !endif
      ClearErrors
      Delete "$INSTDIR\$R1"
      IfErrors skcodeManifestDeleteFailed
      Goto skcodeManifestRead

    skcodeManifestDeleteFailed:
      FileClose $R0
      !ifdef BUILD_UNINSTALLER
        !insertmacro SkcodeReportUninstallerStage "cleanup-failed reason=permission-or-disk-space"
      !endif
      Abort "无法删除旧版本文件：$INSTDIR\$R1"

    skcodeManifestClose:
      FileClose $R0
      Goto skcodeManifestDone

    skcodeManifestMissing:
      ; 首次从旧版本升级时没有清单，不能猜测所有权并删除用户文件。
      !ifdef BUILD_UNINSTALLER
        !insertmacro SkcodeReportUninstallerStage "cleanup-skipped reason=manifest-missing action=preserve"
      !endif
      ClearErrors

    skcodeManifestDone:
      !ifdef BUILD_UNINSTALLER
        !insertmacro customRemoveFilesDiagnosticsComplete
      !endif
  ${else}
    ; 普通卸载仍保持 electron-builder 的全量删除语义；ownership 清单只约束覆盖更新。
    SetOutPath $TEMP
    RMDir /r $INSTDIR
  ${endIf}
!macroend

!ifndef BUILD_UNINSTALLER
  Var SkcodeInstallerLogPath
  Var SkcodeInstallerLogUnavailable
  Var SkcodeInstallerProcessRole
  Var SkcodeUninstallerDetailsUnavailable
  Var SkcodePreviousUninstallerSupportsManifest

  ; 详情面板和文件日志共用同一条阶段事件，避免静默安装丢失关键上下文。
  !macro SkcodeReportInstallerStage MESSAGE
    SetDetailsPrint listonly
    DetailPrint "Skcode: ${MESSAGE}"
    Push "${MESSAGE}"
    Call SkcodeWriteInstallerLog
  !macroend

  Function SkcodeWriteInstallerLog
    Exch $R9
    Push $R0
    Push $R1
    Push $R2

    StrCmp $SkcodeInstallerLogPath "" skcodeInstallerLogDone
    StrCmp $SkcodeInstallerLogUnavailable "1" skcodeInstallerLogDone
    StrCpy $R2 0
    skcodeInstallerLogOpen:
      ClearErrors
      FileOpen $R1 $SkcodeInstallerLogPath a
      IfErrors skcodeInstallerLogRetry skcodeInstallerLogWrite
    skcodeInstallerLogRetry:
      IntOp $R2 $R2 + 1
      IntCmp $R2 3 skcodeInstallerLogFailed skcodeInstallerLogWait skcodeInstallerLogFailed
    skcodeInstallerLogWait:
      Sleep 50
      Goto skcodeInstallerLogOpen
    skcodeInstallerLogWrite:
      System::Call "kernel32::GetCurrentProcessId() i.R0"
      FileSeek $R1 0 END
      FileWrite $R1 "[pid=$R0] $R9$\r$\n"
      FileClose $R1
      Goto skcodeInstallerLogDone
    skcodeInstallerLogFailed:
      StrCpy $SkcodeInstallerLogUnavailable "1"
      ClearErrors
    skcodeInstallerLogDone:
      Pop $R2
      Pop $R1
      Pop $R0
      Pop $R9
  FunctionEnd

  Function SkcodeResetUninstallerLog
    StrCpy $SkcodeUninstallerDetailsUnavailable ""
    ClearErrors
    FileOpen $R0 "${SKCODE_UNINSTALLER_LOG_PATH}" w
    IfErrors skcodeUninstallerDetailsResetFailed skcodeUninstallerDetailsResetSucceeded
    skcodeUninstallerDetailsResetSucceeded:
      FileClose $R0
      Goto skcodeUninstallerDetailsResetDone
    skcodeUninstallerDetailsResetFailed:
      ; 外层详情不能读取旧卸载器日志时仍继续安装，文件日志和退出码仍是最终依据。
      StrCpy $SkcodeUninstallerDetailsUnavailable "1"
      ClearErrors
    skcodeUninstallerDetailsResetDone:
  FunctionEnd

  Function SkcodeShowUninstallerCleanupDetails
    Push $R0
    Push $R1
    Push $R2

    StrCmp $SkcodeUninstallerDetailsUnavailable "1" skcodeShowUninstallerDetailsDone
    ClearErrors
    FileOpen $R0 "${SKCODE_UNINSTALLER_LOG_PATH}" r
    IfErrors skcodeShowUninstallerDetailsDone
    skcodeShowUninstallerDetailsRead:
      ClearErrors
      FileRead $R0 $R1
      IfErrors skcodeShowUninstallerDetailsClose
      StrCmp $R1 "" skcodeShowUninstallerDetailsRead
      SetDetailsPrint listonly
      DetailPrint "Skcode: cleanup-log $R1"
      Goto skcodeShowUninstallerDetailsRead
    skcodeShowUninstallerDetailsClose:
      FileClose $R0
    skcodeShowUninstallerDetailsDone:
      Pop $R2
      Pop $R1
      Pop $R0
  FunctionEnd

  !macro preInit
    Call SkcodeInitializeInstallerLog
  !macroend

  !macro customInit
    IfSilent skcodeInstallerInitSilent skcodeInstallerInitInteractive
    skcodeInstallerInitSilent:
      !insertmacro SkcodeReportInstallerStage "installer-initialized mode=silent"
      Goto skcodeInstallerInitDone
    skcodeInstallerInitInteractive:
      !insertmacro SkcodeReportInstallerStage "installer-initialized mode=interactive"
    skcodeInstallerInitDone:
  !macroend

  ; 这些宏由打包时的 electron-builder installSection.nsh 补丁按安装顺序调用。
  ; 只有阶段 marker 写入详情和日志，解压文件明细由 NSIS 的 File 命令在 listonly 模式输出。
  !macro customInstallSectionStarted
    !insertmacro SkcodeReportInstallerStage "install-started"
  !macroend

  !macro customInstallCleanupStarted
    Call SkcodeResetUninstallerLog
    !insertmacro SkcodeReportInstallerStage "cleanup-started"
  !macroend

  !macro customInstallCleanupCompleted
    !insertmacro SkcodeReportInstallerStage "cleanup-completed"
    Call SkcodeShowUninstallerCleanupDetails
  !macroend

  !macro customInstallExtractStarted
    !insertmacro SkcodeReportInstallerStage "extract-started"
  !macroend

  !macro customInstallExtractCompleted
    !insertmacro SkcodeReportInstallerStage "extract-completed"
  !macroend

  !macro customInstallShortcutsStarted
    !insertmacro SkcodeReportInstallerStage "shortcuts-started"
  !macroend

  !macro customInstallShortcutsCompleted
    !insertmacro SkcodeReportInstallerStage "shortcuts-completed"
  !macroend

  Function SkcodeDetectPreviousUninstallerCapabilities
    StrCpy $SkcodePreviousUninstallerSupportsManifest "0"
    ; manifest 是卸载器能力标记：存在即表示旧卸载器会按清单选择性删除。
    IfFileExists "$INSTDIR\${SKCODE_INSTALL_MANIFEST_NAME}" 0 skcodePreviousUninstallerCapabilityCheckNested
      StrCpy $SkcodePreviousUninstallerSupportsManifest "1"
      Return

    skcodePreviousUninstallerCapabilityCheckNested:
      ; assisted installer 的目录页会在后续 instfilesPre 才补上 APP_FILENAME 子目录，提前兼容两种形态。
      IfFileExists "$INSTDIR\${APP_FILENAME}\${SKCODE_INSTALL_MANIFEST_NAME}" 0 skcodePreviousUninstallerCapabilityDone
        StrCpy $SkcodePreviousUninstallerSupportsManifest "1"

    skcodePreviousUninstallerCapabilityDone:
  FunctionEnd

  !macro customUnInstallCheck
    ; handleUninstallResult 会把旧卸载器的退出码放在 $R0；失败时显示清理诊断，
    ; 不再复用 appCannotBeClosed（该文案只适用于进程占用）。
    ${if} $R0 != 0
      ; 静默自动更新无人值守，未设置 /SD 的模态框会一直等待用户点击，
      ; 使明确的退出码无法返回 electron-updater。静默时自动采用 IDOK，交互时仍显示提示。
      SetDetailsPrint listonly
      DetailPrint "Skcode: cleanup-failed exit-code=$R0"
      Call SkcodeShowUninstallerCleanupDetails
      MessageBox MB_OK|MB_ICONSTOP "旧版本清理失败（错误码 $R0）。可能是文件被占用、权限不足或磁盘空间不足。详细日志：${SKCODE_UNINSTALLER_LOG_PATH}" /SD IDOK
      SetErrorLevel 2
      Quit
    ${endif}
  !macroend

  !macro customUnInstallCheckCurrentUser
    ; per-machine 安装切换到 HKCU 旧版本时，electron-builder 会走另一条 hook；
    ; 复用同一诊断，避免同一个清理失败因注册表根键不同又退回默认文案。
    !insertmacro customUnInstallCheck
  !macroend
!endif

!define SKCODE_INSTALL_DIR_BACK_BUTTON_WIDTH 180

!macro customHeader
  !ifndef BUILD_UNINSTALLER
    ; 异步生成的 header 可能先 include 本文件，再注册 UAC 插件目录。
    ; 在 customHeader 展开函数，确保插件已注册；preInit 仍调用同一函数和真实 UAC 判据。
    Function SkcodeInitializeInstallerLog
      Push $R0
      Push $R1
      Push $R2
      StrCpy $SkcodeInstallerLogUnavailable ""
      ${If} ${SKCODE_INSTALLER_IS_ELEVATED_INNER}
        StrCpy $SkcodeInstallerProcessRole "elevated-inner"
        StrCpy $SkcodeInstallerLogPath "${SKCODE_INSTALLER_ELEVATED_LOG_PATH}"
      ${Else}
        StrCpy $SkcodeInstallerProcessRole "outer"
        StrCpy $R0 $CMDLINE
        ClearErrors
        ${GetOptions} $R0 "/LOG=" $R1
        IfErrors skcodeInstallerLogUseDefault
        StrCmp $R1 "" skcodeInstallerLogUseDefault
        StrCpy $SkcodeInstallerLogPath $R1
        Goto skcodeInstallerLogPathReady
        skcodeInstallerLogUseDefault:
          StrCpy $SkcodeInstallerLogPath "${SKCODE_INSTALLER_DEFAULT_LOG_PATH}"
        skcodeInstallerLogPathReady:
          ${GetParent} $SkcodeInstallerLogPath $R2
          StrCmp $R2 "" skcodeInstallerLogInitialized
          CreateDirectory "$R2"
      ${EndIf}
      skcodeInstallerLogInitialized:
        !insertmacro SkcodeReportInstallerStage "installer-process-started role=$SkcodeInstallerProcessRole"
      Pop $R2
      Pop $R1
      Pop $R0
    FunctionEnd

    ; electron-builder 的 common.nsh 先设置 ShowInstDetails nevershow；
    ; hide 在该模板组合下仍可能留下空白列表且没有可展开入口，因此直接常显阶段详情。
    ShowInstDetails show
    !ifdef allowToChangeInstallationDirectory
      ; electron-builder 已在 assistedInstaller.nsh 中用该开关生成安装目录页面，
      ; 但 installUtil.nsh 随后还会用它禁止无 --updated 的手动覆盖保留快捷方式，导致旧卸载器
      ; 调用 UninstShortcut 注销开始菜单固定项。页面生成后撤掉开关，让自动更新和手动覆盖
      ; 在同一安装目录覆盖时都通过 KeepShortcuts 保留同一个 .lnk。
      !undef allowToChangeInstallationDirectory
    !endif
  !endif
!macroend

!ifndef BUILD_UNINSTALLER
  ; electron-builder 会先编译卸载器，但快捷方式目标读取只在安装更新流程中调用。
  ; 若把函数带入卸载器，NSIS 会产生 6010 未引用告警，并在 /WX 下直接中断 Windows CI。
  Function SkcodeReadShortcutTarget
    Exch $R9
    Push $R1
    Push $R2

    StrCpy $R2 ""
    System::Call 'Kernel32::SetEnvironmentVariableW(w "SKCODE_SHORTCUT_PATH", w "$R9") i.R1'
    StrCmp $R1 "0" skcodeReadShortcutTargetDone 0

    nsExec::ExecToStack /TIMEOUT=5000 `"$SYSDIR\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -NonInteractive -Command "[Console]::Out.Write(([Activator]::CreateInstance([type]::GetTypeFromProgID('WScript.Shell'))).CreateShortcut([Environment]::GetEnvironmentVariable('SKCODE_SHORTCUT_PATH')).TargetPath)"`
    Pop $R1
    Pop $R2
    StrCmp $R1 "0" skcodeReadShortcutTargetDone 0
    StrCpy $R2 ""

    skcodeReadShortcutTargetDone:
      System::Call 'Kernel32::SetEnvironmentVariableW(w "SKCODE_SHORTCUT_PATH", p 0) i.R1'
      StrCpy $R9 "$R2"
      Pop $R2
      Pop $R1
      Exch $R9
  FunctionEnd
!endif

!macro SkcodeRepairShortcutIfNeeded SHORTCUT_PATH LABEL_PREFIX
  ${if} ${FileExists} "${SHORTCUT_PATH}"
    Push "${SHORTCUT_PATH}"
    Call SkcodeReadShortcutTarget
    Pop $R0
    StrCmp $R0 "$appExe" ${LABEL_PREFIX}Done 0

    ; 历史版本可能留下指向已移动 exe 的 .lnk，但无条件覆盖正确快捷方式会让
    ; 部分 Windows 11 丢失“所有应用”索引或用户固定关系，因此只修复目标不一致的项。
    ClearErrors
    CreateShortCut "${SHORTCUT_PATH}" "$appExe" "" "$appExe" 0 "" "" "${APP_DESCRIPTION}"
    IfErrors ${LABEL_PREFIX}Failed ${LABEL_PREFIX}Succeeded
    ${LABEL_PREFIX}Failed:
      DetailPrint "Unable to repair shortcut: ${SHORTCUT_PATH}"
      ClearErrors
      Goto ${LABEL_PREFIX}Done
    ${LABEL_PREFIX}Succeeded:
      WinShell::SetLnkAUMI "${SHORTCUT_PATH}" "${APP_ID}"
      ; 重写后的 .lnk 必须在最后一次写入后通知 Shell，避免开始菜单继续使用旧索引。
      System::Call 'Shell32::SHChangeNotify(i 0x00002000, i 0x0005, w "${SHORTCUT_PATH}", p 0)'
    ${LABEL_PREFIX}Done:
  ${endIf}
!macroend

!macro customInstall
  !ifndef BUILD_UNINSTALLER
    !insertmacro SkcodeReportInstallerStage "install-finalization-started"
  !endif
  ${if} ${isUpdated}
  ${orIf} $keepShortcuts == "true"
    !ifndef DO_NOT_CREATE_START_MENU_SHORTCUT
      !insertmacro SkcodeRepairShortcutIfNeeded "$newStartMenuLink" skcodeStartMenuShortcutRepair
    !endif

    !ifndef DO_NOT_CREATE_DESKTOP_SHORTCUT
      !insertmacro SkcodeRepairShortcutIfNeeded "$newDesktopLink" skcodeDesktopShortcutRepair
    !endif
  ${endIf}

  ; 手动覆盖没有 --updated，继承旧快捷方式时仍需检查目标；首次安装没有旧项，
  ; 不应额外启动 PowerShell。用户已删除的快捷方式也不会重建。
  ; assisted installer 完成页始终直接运行本次安装落盘的 exe。
  StrCpy $launchLink "$appExe"
  !ifndef BUILD_UNINSTALLER
    !insertmacro SkcodeReportInstallerStage "install-completed"
  !endif
!macroend

!macro customPageAfterChangeDir
  Function SkcodeResizeInstallDirBackButton
    GetDlgItem $1 $HWNDPARENT 3
    StrCmp $1 0 skcodeResizeInstallDirBackButtonDone 0

    System::Call "*(i 0, i 0, i 0, i 0) p.r2"
    StrCmp $2 0 skcodeResizeInstallDirBackButtonDone 0
    System::Call "user32::GetWindowRect(p r1, p r2)"
    System::Call "user32::MapWindowPoints(p 0, p $HWNDPARENT, p r2, i 2)"
    System::Call "*$2(i.r3,i.r4,i.r5,i.r6)"
    System::Free $2

    IntOp $7 $5 - $3
    IntOp $8 $6 - $4
    IntCmp $7 ${SKCODE_INSTALL_DIR_BACK_BUTTON_WIDTH} skcodeResizeInstallDirBackButtonDone skcodeResizeInstallDirBackButtonResize skcodeResizeInstallDirBackButtonDone

    skcodeResizeInstallDirBackButtonResize:
      ; 阻断页把“上一步”改成中文动作文案，NSIS 默认按钮宽度可能裁掉文字。
      ; 保持右边缘不动向左扩宽，避免和右侧“安装/取消”按钮重叠。
      IntOp $3 $5 - ${SKCODE_INSTALL_DIR_BACK_BUTTON_WIDTH}
      System::Call "user32::MoveWindow(p r1, i r3, i r4, i ${SKCODE_INSTALL_DIR_BACK_BUTTON_WIDTH}, i r8, i 1)"

    skcodeResizeInstallDirBackButtonDone:
  FunctionEnd

  Function SkcodeFindNestedDataDir
    Exch $R9
    Push $0
    Push $1

    StrCpy $R2 ""

    IfFileExists "$R9\.skcode\*.*" 0 +2
      StrCpy $R2 "$R9\.skcode"
    StrCmp $R2 "" 0 skcodeFindNestedDataDirDone
    IfFileExists "$R9\.skcode" 0 skcodeFindNestedDataDirListChildren
      StrCpy $R2 "$R9\.skcode"
    StrCmp $R2 "" 0 skcodeFindNestedDataDirDone

    skcodeFindNestedDataDirListChildren:
      FindFirst $0 $1 "$R9\*"
      IfErrors skcodeFindNestedDataDirDone

    skcodeFindNestedDataDirNext:
      StrCmp $1 "" skcodeFindNestedDataDirClose
      StrCmp $1 "." skcodeFindNestedDataDirContinue
      StrCmp $1 ".." skcodeFindNestedDataDirContinue
      IfFileExists "$R9\$1\*.*" 0 skcodeFindNestedDataDirContinue
        Push "$R9\$1"
        Call SkcodeFindNestedDataDir
        StrCmp $R2 "" skcodeFindNestedDataDirContinue skcodeFindNestedDataDirClose

    skcodeFindNestedDataDirContinue:
      FindNext $0 $1
      IfErrors skcodeFindNestedDataDirClose
      Goto skcodeFindNestedDataDirNext

    skcodeFindNestedDataDirClose:
      FindClose $0

    skcodeFindNestedDataDirDone:
      Pop $1
      Pop $0
      Pop $R9
  FunctionEnd

  Function SkcodeBlockInstallDirContainsData
    Call SkcodeDetectPreviousUninstallerCapabilities
    StrCmp $SkcodePreviousUninstallerSupportsManifest "1" skcodeInstallDirDataBlockSkip

    ;  用户可能把数据存储目录放进安装目录，Windows 更新覆盖安装目录时会清掉 .skcode。
    ; assisted installer 会把不含应用名的选择目录补成 "$INSTDIR\${APP_FILENAME}"，所以这里按相同规则计算最终安装目录。
    ${StrContains} $R1 "${APP_FILENAME}" "$INSTDIR"
    StrCmp $R1 "" 0 skcodeInstallDirDataBlockUseSelectedDir
    StrCpy $R0 "$INSTDIR\${APP_FILENAME}"
    Goto skcodeInstallDirDataBlockCheckDir

    skcodeInstallDirDataBlockUseSelectedDir:
      StrCpy $R0 "$INSTDIR"

    skcodeInstallDirDataBlockCheckDir:
      ; 旧阻断只检查最终安装目录直属的 .skcode，漏掉 data\.skcode 等子目录数据。
      ; 安装器覆盖安装时会管理整个安装目录树，递归命中任意 .skcode 都必须阻断。
      Push "$R0"
      Call SkcodeFindNestedDataDir
      StrCmp $R2 "" skcodeInstallDirDataBlockSkip skcodeInstallDirDataBlockFound

    skcodeInstallDirDataBlockFound:
      IfSilent skcodeInstallDirDataBlockSilent

      !insertmacro MUI_HEADER_TEXT "需要修改安装目录" "当前安装目录或其子目录包含 Skcode 数据目录"
      nsDialogs::Create 1018
      Pop $0
      StrCmp $0 error skcodeInstallDirDataBlockDialogFailed 0

      ${NSD_CreateLabel} 0u 0u 300u 44u "检测到该安装目录或其子目录中存在 .skcode 数据目录：$\r$\n$R2"
      Pop $1
      ${NSD_CreateLabel} 0u 54u 300u 70u "为避免历史会话和配置被安装器清理，请返回上一步选择其他安装目录。$\r$\n$\r$\n当前目录不能继续安装。"
      Pop $1

      GetDlgItem $1 $HWNDPARENT 1
      EnableWindow $1 0
      GetDlgItem $1 $HWNDPARENT 3
      EnableWindow $1 1
      SendMessage $1 ${WM_SETTEXT} 0 "STR:重选目录"
      Call SkcodeResizeInstallDirBackButton

      nsDialogs::Show
      Return

    skcodeInstallDirDataBlockDialogFailed:
      MessageBox MB_OK|MB_ICONSTOP "检测到安装目录或其子目录中存在 .skcode 数据目录，安装已停止。请重新运行安装器并选择其他安装目录。"
      SetErrorLevel 1
      Quit

    skcodeInstallDirDataBlockSilent:
      SetErrorLevel 1
      Quit

    skcodeInstallDirDataBlockSkip:
      Abort
  FunctionEnd

  Function SkcodeBlockInstallDirContainsDataLeave
    ; 阻断页的下一步按钮已禁用，但自动化或系统快捷键仍可能触发下一页。
    ; leave 回调只处理继续前进的路径，这里强制留在当前页，确保用户只能返回修改安装目录。
    Abort
  FunctionEnd

  Page custom SkcodeBlockInstallDirContainsData SkcodeBlockInstallDirContainsDataLeave
!macroend
