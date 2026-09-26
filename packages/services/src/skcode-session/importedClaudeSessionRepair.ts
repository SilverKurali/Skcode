import type { SkcodeSessionStateSnapshot } from "@skcode/shared";
import { createServiceLogger } from "#src/logger/serviceLogger.js";
import { repairImportedClaudeSessionSnapshot } from "#src/session/claude-native/importedClaudeHistoryRepair.js";
import type { ISkcodeAgentService } from "#src/skcode-agent/skcodeAgent.js";
import type {
  SkcodeSessionReadParams,
  SkcodeSessionResumeParams,
} from "#src/skcode-session/skcodeSession.js";

const logger = createServiceLogger("skcode-session-service");

export async function repairEmptyImportedClaudeSessionSnapshot(params: {
  agentService: ISkcodeAgentService;
  snapshot: SkcodeSessionStateSnapshot;
  target: SkcodeSessionResumeParams | SkcodeSessionReadParams;
}): Promise<SkcodeSessionStateSnapshot> {
  const repaired = await repairImportedClaudeSessionSnapshot({
    snapshot: params.snapshot,
    target: {
      workspacePath: params.target.workspacePath,
      workspaceIdentity: params.target.workspaceIdentity,
      taskId: params.target.sessionId,
      ...("mcpServers" in params.target && params.target.mcpServers
        ? { mcpServers: params.target.mcpServers }
        : {}),
    },
    createSession: (input) => params.agentService.createSession(input),
    onRepair: (history) => {
      logger.warn(
        undefined,
        `[skcode-session-service] Claude 导入 session 历史异常，按 ${history.source} 回填 taskId=${params.target.sessionId}`,
      );
    },
  });
  return repaired ?? params.snapshot;
}
