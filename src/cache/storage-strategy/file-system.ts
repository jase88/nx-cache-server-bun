import { join } from 'node:path';
import { CacheStorageStrategy } from './storage-strategy.interface';
import { mkdir, rename, rm } from 'node:fs/promises';

export class FileSystemStrategy implements CacheStorageStrategy {
  constructor(public readonly cacheDir: string) {}

  private getPath(hash: string) {
    return join(this.cacheDir, hash);
  }

  private getTempPath(hash: string) {
    return join(this.cacheDir, `${hash}.tmp`);
  }

  async exists(hash: string): Promise<boolean> {
    return Bun.file(this.getPath(hash)).exists();
  }

  async getStream(hash: string): Promise<ReadableStream> {
    const file = Bun.file(this.getPath(hash));
    return file.stream();
  }

  async getSize(hash: string): Promise<number> {
    const file = Bun.file(this.getPath(hash));
    if (!(await file.exists())) return 0;
    return file.size;
  }

  async writeStream(hash: string, stream: ReadableStream<Uint8Array>): Promise<void> {
    await mkdir(this.cacheDir, { recursive: true });

    const finalPath = this.getPath(hash);
    const tempPath = this.getTempPath(hash);

    const writer = Bun.file(tempPath).writer();
    try {
      for await (const chunk of stream) {
        writer.write(chunk);
      }
      await writer.end();
      await rename(tempPath, finalPath);
    } catch (error) {
      try {
        await writer.end();
      } catch {}
      try {
        await rm(tempPath, { force: true });
      } catch {}
      throw error;
    }
  }
}
