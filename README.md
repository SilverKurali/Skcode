# Skcode

<div align="center">
  <img src="public/logo/icons/1024x1024.png" alt="Skcode" width="128" height="128" />

**开源 AI 编程工作台：桌面应用、浏览器界面、终端 Agent，开箱即用。**

简体中文 | [English](README.en.md)

</div>

---

Skcode 是一个 AI 编程工作台：你可以在桌面应用、浏览器或终端里与 Agent 协作完成编程任务。**不需要注册任何账号**——接上你自己的模型 API Key（BYOK）即可开工，代码和数据都在你自己手里。

## 为什么选 Skcode

- **多端形态**：Electron 桌面应用、浏览器 Web 界面、终端 TUI 与命令行 Agent，共享同一套服务与协议。
- **自带模型（BYOK）**：无需登录任何平台账号，在设置中填入自己的模型 API Key 即可使用；支持自定义 OpenAI 兼容供应商。
- **2D 宠物系统**：会话区有一只随 Agent 状态做出反应的 2D 宠物（内置 SilverKorali）；支持自定义宠物包，也可以让 AI 帮你从零创建属于你自己的宠物。
- **完整的 Agent 工具箱**：文件、Git、终端、内嵌浏览器（Browser Use）、Web 搜索与抓取、Node REPL、MCP、技能、Hooks、子代理与动态工作流。
- **远程与移动**：通过 SSH／WSL 远程执行环境运行任务；手机可远控桌面已有会话。
- **插件市场**：安装社区插件扩展能力；任务快照、Git 检查点、定时与闲时任务一应俱全。

## 快速开始

准备 Git、Node.js **24.14.0** 与 pnpm **10.33.2**（版本以 [mise.toml](mise.toml) 为准），然后：

```bash
git clone <repo-url> && cd skcode
pnpm bootstrap      # 安装依赖并构建
pnpm dev:desktop    # 启动桌面应用
```

启动后在「设置 → 模型」中添加一个模型供应商（填 API Key），即可开始对话。

<details>
<summary><b>更多开发命令</b></summary>

| 命令                           | 用途                                        |
| ------------------------------ | ------------------------------------------- |
| `pnpm dev:desktop`             | 桌面开发（生产服务配置）                    |
| `pnpm dev:desktop:test`        | 桌面开发（测试服务配置）                    |
| `pnpm dev:web`                 | Web 前后端联调开发（默认 `localhost:5173`） |
| `pnpm bundle:desktop`          | 打包桌面应用（支持 `--os win/mac/linux`）   |
| `pnpm build:skcode`            | 构建命令行发行包（TUI / Web / Agent）       |
| `pnpm typecheck` / `pnpm lint` | 类型检查 / 代码检查                         |
| `pnpm verify:pre-push`         | 提交前检查（Lint 与架构检查）               |

命令行发行包以 `skcode` 启动：无参数进入 TUI，`skcode --web` 启动 Web 界面；各项参数以 `--help` 为准。

</details>

## 2D 宠物系统

会话区右下角的 2D 宠物会随 Agent 状态做出反应（工作、需要权限、等待回答、出错、完成），支持点击互动与随机搭话。所有形象与台词可自定义：

- **内置**：SilverKorali（立绘 + 呼吸/动作视频循环）。
- **自定义宠物包**：在 `~/.skcode/v2/pets/<包名>/` 放置立绘与 `pet.json` 清单；设置 → 通用 → 宠物系统 一键选用。
- **AI 创建**：设置里点「用 AI 创建宠物」，Agent 会按模板为你生成完整宠物包（形象、台词、动作）。

宠物包格式与验收场景见 [specs/pet-system.md](specs/pet-system.md)。

## 仓库结构

| 目录                                                  | 职责                                    |
| ----------------------------------------------------- | --------------------------------------- |
| `packages/desktop`                                    | Electron 主进程、Host、渲染层与桌面打包 |
| `packages/web`、`packages/server`                     | Web 客户端与 HTTP / WebSocket 服务      |
| `packages/ui`、`packages/services`、`packages/shared` | 共享 React 组件、业务服务、协议与类型   |
| `apps/skcode-cli`                                     | Agent CLI、TUI、运行时与工具            |
| `scripts`、`config`、`third-party`                    | 构建脚本、内置配置与第三方声明材料      |

## 配置

根目录 [.env.example](.env.example) 提供配置示例，复制为 `.env` 后按需修改（本地覆盖放 `.env.local`）：

| 变量                      | 用途                                    |
| ------------------------- | --------------------------------------- |
| `SKCODE_DATA_BASE_DIR`    | 应用数据基目录（默认写入 `~/.skcode/`） |
| `SKCODE_SERVER_WORKSPACE` | Web 后端的工作区路径                    |
| `SKCODE_DIST_BASE_URL`    | 命令行安装脚本使用的下载根地址          |

## 开发规范

行为规则维护在 [specs/](specs/)，改动前先更新对应 spec；代码遵循 [AGENTS.md](AGENTS.md)，UI 遵循 [DESIGN.md](DESIGN.md)。提交前运行 `pnpm verify:pre-push`。

## 许可

本仓库第一方代码采用 [Apache License 2.0](LICENSE)。第三方软件、字体、图标与素材适用各自的独立条款，详见 [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md) 与 [third-party/](third-party/)。

使用 AI 生成内容与自动化执行存在风险，使用前请阅读 [NOTICE.md](NOTICE.md) 项目声明。
