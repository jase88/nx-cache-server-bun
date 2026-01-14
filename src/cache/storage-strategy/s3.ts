import { S3Options } from 'bun';
import { CacheStorageStrategy } from './storage-strategy.interface';

export class S3Strategy implements CacheStorageStrategy {
  readonly #client: Bun.S3Client;

  constructor(options: S3Options) {
    this.#client = new Bun.S3Client(options);
  }

  async exists(hash: string): Promise<boolean> {
    return this.#client.exists(hash);
  }

  async getStream(hash: string): Promise<ReadableStream> {
    const ref = this.#client.file(hash);
    return ref.stream();
  }

  async getSize(hash: string): Promise<number> {
    return this.#client.size(hash);
  }

  async writeStream(hash: string, stream: ReadableStream<Uint8Array>): Promise<void> {
    const file = this.#client.file(hash);
    const writer = file.writer({ retry: 3, queueSize: 10, partSize: 5 * 1024 * 1024 });

    try {
      for await (const chunk of stream) {
        writer.write(chunk);
        await writer.flush();
      }
      await writer.end();
    } catch (error) {
      try {
        await writer.end();
      } catch {}
      throw error;
    }
  }
}
