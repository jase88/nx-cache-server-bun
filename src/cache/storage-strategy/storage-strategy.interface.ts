export interface CacheStorageStrategy {
  exists(hash: string): Promise<boolean>;
  // assumes existence check has been done beforehand
  getStream(hash: string): Promise<ReadableStream>;
  getSize(hash: string): Promise<number>;
  writeStream(hash: string, stream: ReadableStream<Uint8Array>): Promise<void>;
}
