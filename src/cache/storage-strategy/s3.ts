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

  async write(hash: string, data: Uint8Array): Promise<void> {
    await this.#client.write(hash, data);
  }
}
