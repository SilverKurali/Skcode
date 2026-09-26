import type { Event, IDisposable } from "@skcode/rpc";
import type { SkcodeProtocolMessage } from "@skcode/shared";

export type SkcodeProtocolTransportKind = "stdio" | "websocket" | "memory";

export interface SkcodeProtocolTransportClosedEvent {
  code?: number | null;
  signal?: NodeJS.Signals | null;
  reason?: string;
}

export interface SkcodeProtocolTransport extends IDisposable {
  readonly kind: SkcodeProtocolTransportKind;
  readonly onMessage: Event<SkcodeProtocolMessage>;
  readonly onClose: Event<SkcodeProtocolTransportClosedEvent>;
  send(message: SkcodeProtocolMessage): Promise<void>;
  disposeAndWait?(): Promise<void>;
}
