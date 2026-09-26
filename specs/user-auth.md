# 用户认证 Spec：移除账号登录，BYOK 自配模型

## 背景与决策

原 ZCode 产品带账号体系：首次启动强制进入 WelcomeScreen（原厂编码计划 OAuth 登录或 API Key 二选一），登录前阻断工作区会话恢复。Skcode 定位为独立软件，**不要求登录任何原厂账号**。

决策：

- 移除 UI 层全部登录入口与登录门禁；应用启动直达工作区。
- 模型接入走 BYOK：用户在设置 → 模型提供方自行填写 API Key（既有能力，保持不变）。
- 服务层 OAuth/凭据存储（`packages/services/src/oauth/`）与 CLI 认证适配器**保留但休眠**：BYOK 的凭据加解密与存储仍在该层，删除会破坏 API Key 配置；且 CLI 独立运行时仍需自己的认证栈。仅删除纯登录 UI。

## 状态所有者变更

| 原状态                                                                   | 处理                                                                                                |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `welcomeScreenOpenReason`（Root 局部 state，5 种登录来源）               | 删除。登录入口 UI 不复存在，无来源可写。                                                            |
| `isResolvingStartupAuthState`（= OAuth 会话恢复中）                      | 删除。启动门禁不再包含认证项；OAuth 会话恢复 effect 一并移除。                                      |
| `useProviderAvailabilityLoginEntryGuard`（无可用 Provider 时自动弹登录） | 删除。无 Provider 时不再弹任何东西，用户自行去设置页配置。                                          |
| `loginEntryRequest`（store 内登录入口请求队列）                          | 从 store 删除；调用方仅 Root 与 WelcomeScreen，均已移除。                                           |
| `user: UserInfo \| null`                                                 | 保留（恒为 null），下游展示组件已按空值处理，避免大范围类型改动。                                   |
| 启动门禁 `shouldBlockRootRender`                                         | 仅保留非认证项：tab 恢复、初始 workspace 引导、模型选择 hydration（`providerStartupSyncPending`）。 |

## 事件顺序（变更后）

```
启动 → Root 挂载 → (可选短暂) 模型选择 hydration → 工作区恢复/兜底创建 → 主界面
                                                    └─ 无任何登录分支
模型不可用时：聊天不可发起，用户自行到 设置→模型提供方 配置 API Key
```

## 保留与删除清单

- 删除文件：`WelcomeScreen.tsx`、`login/LoginApiKeyForm*.ts(x)`、`root/useProviderAvailabilityLoginEntryGuard.ts`、`hooks/useOAuth.ts`（仅 WelcomeScreen 使用）。
- 修改：`Root.tsx`（门禁与渲染）、`lib/rootStartupGate.ts`（去认证字段）、`store/index.ts`（去 loginEntryRequest）、`WorkspaceSidebarFooter.tsx` 等（不再传登录回调，按钮自然消失）。
- 保留休眠：`services/oauth/`、`skcode://` OAuth 深链处理、CLI `auth/` 适配器、设置页编码计划状态区（无登录按钮，仅显示未连接状态）。

## 验收场景

1. 全新启动（无 `~/.skcode`）：直达工作区，全程无登录/欢迎登录屏。
2. 全仓库 UI 无"登录原厂账号"入口；侧栏与设置页不再出现登录按钮。
3. 设置 → 模型提供方可正常配置 API Key 并发起对话（BYOK 主路径不回归）。
4. `pnpm typecheck`、`pnpm lint` 通过。
5. 认证相关 UI 状态（session-expired、logout-provider-required 等）不再存在于代码路径中。

## 补充（v3）：移除个人菜单的常驻"升级"入口

BYOK 未登录形态下，左下角个人菜单曾保留原厂"产品要求始终显示"的升级菜单项
（`WorkspaceSidebarFooterUsageSummaryContent`，RocketIcon，点击打开原厂套餐购买对话框
`CodingPlanUpgradeDialog`）。该入口无条件渲染、且 entry gate 会探测原厂 API，
与「不引导用户购买原厂套餐」的边界冲突，整体移除：

- 删除 `WorkspaceSidebarFooterUsageSummaryContent` 的升级菜单项与 `onUpgradeClick`
  prop 链（`WorkspaceSidebarFooter` → `WorkspaceSidebar` 的 `handleOpenCodingPlanUpgrade`）。
- 删除 state hook 中的 `upgradeTargetProviderId` 与 fallback 解析。
- 「使用统计」菜单项保留：指向本地会话/用量统计，非套餐购买面。
- 保留休眠：`CodingPlanUpgradeDialog` 组件与 Provider、quota banner 的升级动作
  （仅在有编码计划 provider 时可达，BYOK 下不可达）。
- 自动化设置中的限时任务套餐 toast 同理：条件触发、BYOK 不可达，不动。

### 验收补充

6. 左下角个人菜单只有「使用统计」，无任何"升级/续费"字样；点击不出现套餐购买页。

## 补充（v4）：侧栏 footer 去账号化，改为快速导航

BYOK 无账号形态下，footer 仍展示"用户头像 + 本地使用"并弹出偏好菜单，
继续暗示账号体系的存在。改造为**快速导航**入口：

- 触发器：Compass 图标 + 「快速导航」，移除头像、用户名、套餐徽标等身份展示。
- 菜单内容改为导航项：新建任务 / 自动化 / 插件市场 / 设置 / 使用统计
  （有对应回调才显示，Settings 页复用时自动收窄）。
- 原菜单中的语言/主题/界面模式/界面缩放子菜单撤出（设置 → 通用/外观仍可改），
  footer 菜单不再承担偏好设置面板职责。
- `user` prop 与 PlanBadge 从 footer 移除；桌面通知/登录态等其余账号基础设施保持休眠。

### 验收补充

7. footer 显示「快速导航」，点击菜单为导航项集合，无任何头像/用户名/登录暗示。
8. Settings 页复用的 footer 同步生效；各导航项跳转正确。

## 补充（v5）：footer 菜单回归偏好形态

快速导航 v4 版的导航项（新建任务/自动化/插件市场/设置）与左侧边栏顶部入口重复。
菜单内容回归偏好形态：界面语言、界面主题、界面模式、界面缩放（桌面端）、使用统计；
触发器保留 Compass + 「快速导航」。设置入口保留在 footer 右侧齿轮按钮，不进菜单。
