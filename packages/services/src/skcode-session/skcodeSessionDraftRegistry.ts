import type { SkcodeSessionStateSnapshot } from "@skcode/shared";
import type {
  SkcodeSessionWorkspaceTarget,
  SkcodeTaskTarget,
} from "#src/skcode-session/skcodeSession.js";

function getWorkspaceKey(target: SkcodeSessionWorkspaceTarget): string {
  return target.workspaceIdentity?.trim() || target.workspacePath;
}

function getSessionScopedKey(target: SkcodeTaskTarget): string {
  return `${getWorkspaceKey(target)}\0${target.sessionId}`;
}

export function createSkcodeDeferredDraftRegistry() {
  const sessionKeys = new Set<string>();

  return {
    remember(params: SkcodeSessionWorkspaceTarget, snapshot: SkcodeSessionStateSnapshot): void {
      sessionKeys.add(
        getSessionScopedKey({
          workspacePath: snapshot.session.workspace.workspacePath,
          workspaceIdentity:
            snapshot.session.workspace.workspaceIdentity ?? params.workspaceIdentity,
          sessionId: snapshot.session.sessionId,
        }),
      );
    },

    has(target: SkcodeTaskTarget): boolean {
      return sessionKeys.has(getSessionScopedKey(target));
    },

    forget(target: SkcodeTaskTarget): void {
      sessionKeys.delete(getSessionScopedKey(target));
    },
  };
}
