import type { ComputerUseRuntime } from "@skcode/skcode-cua";
import type { Logger } from "@skcode/contracts";
import type { NodeReplCuaBrokerConnection } from "./cua-bridge.js";
export interface NodeReplCuaBroker {
    connection: NodeReplCuaBrokerConnection;
    ready: Promise<void>;
    close(): Promise<void>;
}
export declare function createNodeReplCuaBroker(input: {
    runtime: ComputerUseRuntime;
    logger?: Logger;
    platform?: NodeJS.Platform | string;
}): NodeReplCuaBroker;
//# sourceMappingURL=cua-broker.d.ts.map