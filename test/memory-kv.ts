import type { Env, KV } from "../src/app";

/** In-memory stand-in for a Workers KV namespace. */
export class MemoryKV implements KV {
  store = new Map<string, { value: string | Uint8Array; metadata: unknown; ttl?: number }>();

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    return typeof entry.value === "string" ? entry.value : new TextDecoder().decode(entry.value);
  }

  async getWithMetadata<M>(key: string): Promise<{ value: ArrayBuffer | null; metadata: M | null }> {
    const entry = this.store.get(key);
    if (!entry) return { value: null, metadata: null };
    const bytes =
      typeof entry.value === "string" ? new TextEncoder().encode(entry.value) : entry.value;
    return { value: bytes.slice().buffer, metadata: (entry.metadata as M) ?? null };
  }

  async put(
    key: string,
    value: string | ArrayBuffer | ArrayBufferView,
    options?: { expirationTtl?: number; metadata?: unknown },
  ): Promise<void> {
    const stored =
      typeof value === "string"
        ? value
        : value instanceof ArrayBuffer
          ? new Uint8Array(value.slice(0))
          : new Uint8Array(value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength));
    this.store.set(key, { value: stored, metadata: options?.metadata, ttl: options?.expirationTtl });
  }
}

export function makeEnv(): Env & { GALLERIES: MemoryKV } {
  return { GALLERIES: new MemoryKV() };
}
