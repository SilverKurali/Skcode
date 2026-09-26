import type { WorkspacePurpose, SkcodeTaskMeta } from "@skcode/shared";

export type SkcodeTaskListKind = "pinned" | "archived" | "timeline" | "active";
export type SkcodeTaskListSortBy = "created" | "updated";

export interface SkcodeTaskListWorkspaceScope {
  workspacePath: string;
  workspaceIdentity?: string;
  workspacePurpose?: WorkspacePurpose;
}

export interface SkcodeTaskListQuery {
  kind: SkcodeTaskListKind;
  workspaceScopes: SkcodeTaskListWorkspaceScope[];
  sortBy: SkcodeTaskListSortBy;
  search?: string;
  limit?: number;
}

export type SkcodeTaskListItem = SkcodeTaskMeta & {
  searchSnippet?: string;
  searchSnippets?: string[];
};

export interface SkcodeTaskListResult {
  items: SkcodeTaskListItem[];
  total: number;
  hasMore: boolean;
}

export type SkcodeTaskGroupColor =
  | "gray"
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "blue"
  | "purple";

export interface SkcodeTaskGroup {
  id: string;
  title: string;
  color: SkcodeTaskGroupColor;
  createdAt: number;
  updatedAt: number;
}

export interface SkcodeGroupedTaskRef {
  workspacePath: string;
  workspaceIdentity?: string;
  taskId: string;
}

export type SkcodeGroupedTaskViewTopLevelNodeRef =
  | { type: "group"; groupId: string }
  | { type: "task"; task: SkcodeGroupedTaskRef };

export type SkcodeGroupedTaskViewNode =
  | {
      type: "group";
      group: SkcodeTaskGroup;
      tasks: SkcodeTaskListItem[];
      sortOrder?: number;
    }
  | {
      type: "task";
      task: SkcodeTaskListItem;
      sortOrder?: number;
    };

export interface SkcodeGroupedTaskView {
  nodes: SkcodeGroupedTaskViewNode[];
}

export interface SkcodeGroupedTaskViewQuery {
  workspaceScopes: SkcodeTaskListWorkspaceScope[];
  includeAllWorkspaces?: boolean;
}

// ── grouped 原始结构（不 join tasks 表）──
// grouped 视图的任务数据源迁到 sessions-index 后，服务端只提供分组结构
// （task_groups / task_group_members / task_group_view_node_orders），
// 由客户端与 sessions-index 会话做 join。

/** 组成员引用（不含任务 meta；task 内容由 sessions-index 提供）。 */
export interface SkcodeGroupedTaskViewStructureMember {
  groupId: string;
  /** 服务端口径 workspaceKey（resolveWorkspaceKey：identity ?? path），join 匹配键。 */
  workspaceKey: string;
  workspacePath: string;
  workspaceIdentity?: string;
  taskId: string;
  /** null = 尚未落 sort_order（新加入组）；客户端按 addedAt 降序补内存序。 */
  sortOrder: number | null;
  addedAt: number;
}

/** 顶层节点排序（task_group_view_node_orders，node_key 已解析为结构化引用）。 */
export type SkcodeGroupedTaskViewStructureTopOrder =
  | { type: "group"; groupId: string; sortOrder: number }
  | { type: "task"; workspaceKey: string; taskId: string; sortOrder: number };

export interface SkcodeGroupedTaskViewStructure {
  /** 已按 workspaceScopes 可见性过滤的 group（bootstrap workspace group 只在其 workspace 可见）。 */
  groups: SkcodeTaskGroup[];
  /** 全量组成员（含不可见 group 的成员——顶层排除规则需要全量判断）。 */
  members: SkcodeGroupedTaskViewStructureMember[];
  topLevelOrders: SkcodeGroupedTaskViewStructureTopOrder[];
}

export interface SkcodeGroupedTaskViewOrderInput {
  workspaceScopes: SkcodeTaskListWorkspaceScope[];
  topLevelNodes: SkcodeGroupedTaskViewTopLevelNodeRef[];
  groups: Array<{
    groupId: string;
    taskRefs: SkcodeGroupedTaskRef[];
  }>;
}

export interface SkcodeWorkspaceEventSubscriptionParams {
  workspacePath: string;
  workspaceIdentity?: string;
}
