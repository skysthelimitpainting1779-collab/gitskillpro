import type { DatabaseSnapshot, ProviderCapability, ProviderKind } from "../providers/types.js";

export interface DatabaseHostAdapter {
  id: string;
  provider: ProviderKind;
  capabilities: ReadonlySet<ProviderCapability>;
  inspect(input: unknown): Promise<DatabaseSnapshot> | DatabaseSnapshot;
}

export function supportsDatabaseWrite(adapter: Pick<DatabaseHostAdapter, "capabilities">): boolean {
  return adapter.capabilities.has("database.write");
}

export function requireDatabaseObservation(snapshot: DatabaseSnapshot): DatabaseSnapshot {
  if (snapshot.evidenceStatus === "unavailable") {
    throw new Error(`Database evidence is unavailable from provider ${snapshot.provider}`);
  }
  return snapshot;
}
