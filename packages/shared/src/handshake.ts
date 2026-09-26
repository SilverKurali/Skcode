export interface HelloMessage {
  type: "skcode-hello";
  version: string;
  platform: string;
  arch: string;
  pid: number;
}

export interface HelloAckMessage {
  type: "skcode-hello-ack";
  version: string;
  clientId: string;
}
