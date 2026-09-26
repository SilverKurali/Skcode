import { z } from "zod";
import type { CommandAgentSource } from "./command-types.js";
import type { SkcodeProvider } from "./skcode-task-types-core.js";

export const SKCODE_AGENT_PROVIDER = "glm" satisfies SkcodeProvider;
export const SKCODE_AGENT_PROVIDER_LABEL = "Skcode Agent";
export const SKCODE_COMMAND_AGENT_SOURCE = "skcodeAgent" satisfies CommandAgentSource;

export const skcodeAgentProviderSchema = z.literal(SKCODE_AGENT_PROVIDER);

export const SKCODE_COMMAND_AGENT_SOURCES = [
  SKCODE_COMMAND_AGENT_SOURCE,
] as const satisfies readonly CommandAgentSource[];

export function normalizeAgentProviderToSkcodeAgent(
  _provider?: SkcodeProvider | null,
): SkcodeProvider {
  return SKCODE_AGENT_PROVIDER;
}

export function isSkcodeAgentProvider(
  provider: SkcodeProvider | null | undefined,
): provider is typeof SKCODE_AGENT_PROVIDER {
  return provider === SKCODE_AGENT_PROVIDER;
}
