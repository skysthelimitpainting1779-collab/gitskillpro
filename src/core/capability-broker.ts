import type { CapabilityId, OperationIntent } from "./types.js";

export interface CapabilityAdapter {
  id: string;
  priority: number;
  capabilities: ReadonlySet<CapabilityId>;
}

export class NoCapableAdapterError extends Error {
  readonly intent: OperationIntent;
  readonly requiredCapabilities: CapabilityId[];

  constructor(intent: OperationIntent, requiredCapabilities: CapabilityId[]) {
    super(`No adapter can satisfy intent ${JSON.stringify(intent)} with required capabilities: ${requiredCapabilities.join(", ") || "none"}`);
    this.name = "NoCapableAdapterError";
    this.intent = intent;
    this.requiredCapabilities = [...requiredCapabilities];
  }
}

export class CapabilityBroker {
  readonly adapters: CapabilityAdapter[];

  constructor(adapters: Iterable<CapabilityAdapter>) {
    this.adapters = [...adapters].sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));
  }

  select(intent: OperationIntent, requiredCapabilities: CapabilityId[]): CapabilityAdapter {
    const adapter = this.adapters.find((candidate) =>
      requiredCapabilities.every((capability) => candidate.capabilities.has(capability)),
    );

    if (!adapter) throw new NoCapableAdapterError(intent, requiredCapabilities);
    return adapter;
  }
}
