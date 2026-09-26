import {
  ChannelClient,
  MessagePortProtocol,
  ProxyChannel,
  type MessagePortLike,
  type MessagePortPayload,
} from "@skcode/rpc";
import {
  ISkcodeTaskService,
  type ISkcodeTaskService as ISkcodeTaskServiceShape,
} from "#src/session/skcodeTaskService.js";
import {
  ISkcodeAgentService,
  type ISkcodeAgentService as ISkcodeAgentServiceShape,
} from "#src/skcode-agent/skcodeAgent.js";
import {
  ISkcodeSessionService,
  type ISkcodeSessionService as ISkcodeSessionServiceShape,
} from "#src/skcode-session/skcodeSession.js";
import {
  IModelSelectionService,
  type IModelSelectionService as IModelSelectionServiceShape,
} from "#src/model-provider/providerFacadeServices.js";

interface PortLike {
  on?(event: "message", listener: (event: { data: MessagePortPayload }) => void): void;
  off?(event: "message", listener: (event: { data: MessagePortPayload }) => void): void;
  addEventListener?(
    event: "message",
    listener: (event: { data: MessagePortPayload }) => void,
  ): void;
  removeEventListener?(
    event: "message",
    listener: (event: { data: MessagePortPayload }) => void,
  ): void;
  postMessage(message: MessagePortPayload): void;
  start?(): void;
  close?(): void;
}

function toMessagePortLike(port: PortLike): MessagePortLike {
  return {
    addEventListener(type, listener) {
      if (port.addEventListener) {
        port.addEventListener(type, listener);
        return;
      }
      port.on?.(type, listener);
    },
    removeEventListener(type, listener) {
      if (port.removeEventListener) {
        port.removeEventListener(type, listener);
        return;
      }
      port.off?.(type, listener);
    },
    postMessage(data) {
      port.postMessage(data);
    },
    start() {
      port.start?.();
    },
    close() {
      port.close?.();
    },
  };
}

export interface RemoteBotWorkspaceRuntimeServices {
  skcodeAgentService: ISkcodeAgentServiceShape;
  skcodeTaskService: ISkcodeTaskServiceShape;
  skcodeSessionService: ISkcodeSessionServiceShape;
  modelSelectionService: IModelSelectionServiceShape;
}

export function createRemoteRuntimeServicesFromPort(
  port: unknown,
): RemoteBotWorkspaceRuntimeServices {
  const protocol = new MessagePortProtocol(toMessagePortLike(port as PortLike));
  const client = new ChannelClient(protocol);
  return {
    skcodeAgentService: ProxyChannel.toService<ISkcodeAgentServiceShape>(
      client.getChannel(ISkcodeAgentService.channelName),
    ),
    skcodeTaskService: ProxyChannel.toService<ISkcodeTaskServiceShape>(
      client.getChannel(ISkcodeTaskService.channelName),
    ),
    skcodeSessionService: ProxyChannel.toService<ISkcodeSessionServiceShape>(
      client.getChannel(ISkcodeSessionService.channelName),
    ),
    modelSelectionService: ProxyChannel.toService<IModelSelectionServiceShape>(
      client.getChannel(IModelSelectionService.channelName),
    ),
  };
}
