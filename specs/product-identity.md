# 产品身份 Spec：Skcode

## 目标

将本仓库从 ZCode 品牌完整更名为 Skcode，使其成为独立的自有项目。运行时行为除产品身份标识外保持不变。

## 命名映射

| 原名     | 新名     | 说明                                                                                                                                                                                                                                           |
| -------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `zcode`  | `skcode` | 小写：包名 scope（`@zcode/*` → `@skcode/*`）、目录（`apps/zcode-cli` → `apps/skcode-cli`）、协议目录（`zcode-protocol`）、CLI 二进制名、运行时全局（`window.zcode` → `window.skcode`）、用户数据目录（`~/.zcode` → `~/.skcode`）、环境变量前缀 |
| `ZCode`  | `Skcode` | 产品展示名（窗口标题、关于页、README、文档）                                                                                                                                                                                                   |
| `ZCODE`  | `SKCODE` | 大写常量 / 环境变量                                                                                                                                                                                                                            |
| `zCode`  | `skCode` | 驼峰标识符（保留驼峰语义）                                                                                                                                                                                                                     |
| `z-code` | `skcode` | 连字符写法（仅出现在技能说明文本）                                                                                                                                                                                                             |

## 范围

- 所有 tracked 文本文件内容（含 `pnpm-lock.yaml`，改后由 `pnpm install` 校验一致）。
- 所有路径中含 `zcode` 的目录与文件名（二进制资产仅随目录移动，不改内容）。
- 不改动：第三方上游归档内容（`apps/*/dependencies/native-search/` 内的 bfs/ripgrep 等原始包）、第三方许可证正文（除"本产品名"字样外）、`SHA256SUMS` 中哈希值（仅路径文本随改名同步）。

## 状态所有者与边界

- 产品名唯一事实来源：根 `package.json` 的 `name` 与各包 `package.json`；其余引用全部由其派生。
- 改名是一次性机械替换，不引入新的运行时分支；新旧名称不并存、不做兼容别名（自有项目，无需兼容旧安装）。

## 行为影响（已确认）

- 用户数据目录从 `~/.zcode` 变为 `~/.skcode`：改名后的首次启动为全新状态（历史会话、登录凭据不迁移）。
- 应用 ID（如 `com.zcode.*`）同步更名，桌面端视为新应用。
- 仓库 README 中的仓库链接指向更名后的仓库名，需用户在自己的远端仓库中保持一致。

## 验收场景

1. `git ls-files` 中不存在任何路径含 `zcode`（不区分大小写）的条目。
2. tracked 文本文件中不存在任何大小写变体的 `zcode`/`z-code` 残留。验收必须用字节级扫描而非 `grep -I`：仓库存在合法内嵌 NUL 字节（`\x00` 作 cache key 分隔符）的源文件，`grep -I` 会将其按二进制跳过造成漏改。
3. `pnpm install` 成功且 lockfile 与 workspace 一致。
4. `pnpm typecheck`、`pnpm lint` 通过；`pnpm architecture:check --changed` 无新增违规。
5. 二进制资产（图标、tar 包）内容不变，仅路径更新；栅格图标中的视觉品牌替换记为后续任务。

## 附录：品牌视觉资产替换（已完成）

- 全部 31 处品牌位图已替换：`packages/desktop/build/`（icon.png/ico/icns、icon_installer.\*、icon_windows.png、icons/9 档、dmg_background(@2x)）、`public/logo/icons/` 全套、`public/icon_512@2x.png`、`packages/web/public/favicon.ico`。
- 应用图标来源：SenseNova `sensenova-u1.5-fast`，2048×2048、`watermark:false`，经徽章裁剪 + 圆角透明管线生成 master（1024），再降采样出全尺寸集；ICO 含 16–256 七档，ICNS 含 Retina 变体。
- DMG 安装背景为程序化渐变绘制（与图标同色系），非 AI 生成。
- 第三方资产（渠道图标、支付图标、模型提供方图标、material-icons 等）保持原样，不属于本项目品牌。

## 运行版本（dev 模式修复）

- 原 ZCode 的 `packages/desktop/package.json` 无 `version` 字段：dev 模式下 Electron 直接加载该包，`app.getVersion()` 回退为 "0.0"，electron-updater 在 import `autoUpdater` 时做 semver 校验直接抛错（`App version is not a valid semver version: "0.0"`）。上游仅走过打包流程（打包时 `build-skcode.mjs --version` 显式注入），未暴露此问题。
- 修复：为 `packages/desktop/package.json` 补 `"version": "3.14.3"`（与根包一致）。打包链路不受影响（打包时仍显式覆盖）。
- 矢量品牌标（启动徽章 `RootStartupLoading`、关于页 `SkcodeAboutLogo`、两个启动壳 `index.html`、关于窗口 `aboutWindow.ts`）原为内嵌 Z 字矢量路径，已统一替换为白描 S 字标 SVG（stroke 34 / round cap，viewBox 200×220）；无引用的旧文字标 `SkcodeWordmarkLogo` 已删除。

## 帮助菜单与更新策略（v4）

右上角帮助菜单与命令面板中的原厂入口全部清退，独立产品不再指向 `zcode.z.ai`：

- **产品文档 / 用户社群**：Skcode 尚无自有文档站与社群，菜单项与命令面板命令整体移除
  （`productDocs.ts`、`helpMenuActions.ts`、`exportLogsAction.ts` 随之成为孤儿代码，删除）。
- **检查更新**：原更新 feed 默认端点即原厂 `zcode.z.ai`（打包版无法用环境变量改道），
  且 force-update 守卫会按原厂远端配置阻止启动——等于原厂可远程 kill 独立构建。
  策略改为**显式 opt-in**：仅当启动参数/环境变量配置了自有更新源时初始化 autoUpdater
  （该 override 仅未打包构建生效，用于联调）；打包版整体关闭，force-update 守卫随之不再触发。
  更新菜单项在主进程报告 `enabled:false` 时隐藏。
- **关于 Skcode**：窗口 logo 从线稿 S 换成 App 图标（读取打包资源/构建目录图标，缺失时
  回退内联 SVG）；名称、版本、版权文案已是 Skcode，不变。
- **资源管理器**：本地桌面功能，正常可用，保留。

### 验收场景

1. 帮助菜单只剩：资源管理器（桌面端）、关于 Skcode（检查更新仅在显式配置自有更新源时出现）。
2. 命令面板无「产品文档」「用户社群」命令。
3. 打包版启动不再向 `zcode.z.ai` 发更新/强制更新请求；网络断开时启动与使用不受影响。
4. 设置页的两个更新开关（预览渠道 / 自动下载安装）一并移除：updater 已停用，
   开关只是无作用的悬空 UI，且描述会误导用户以为存在可用更新源。
5. 关于窗口显示 App 图标 + Skcode 名称/版本/版权。
