import { CacheStorageStrategy } from './storage-strategy/storage-strategy.interface';
import { S3Strategy } from './storage-strategy/s3';
import { FileSystemStrategy } from './storage-strategy/file-system';

export function createCacheStorage(env: typeof Bun.env): CacheStorageStrategy {
  const kind = (env.STORAGE_STRATEGY ?? 'filesystem').toLowerCase();
  if (kind === 's3') {
    const region = env.S3_REGION;
    const bucket = env.S3_BUCKET;
    const accessKeyId = env.S3_ACCESS_KEY_ID;
    const secretAccessKey = env.S3_SECRET_ACCESS_KEY;
    const endpoint = env.S3_ENDPOINT;

    if (!region || !bucket || !accessKeyId || !secretAccessKey) {
      throw new Error(
        'S3 configuration missing one of: S3_REGION, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY',
      );
    }

    return new S3Strategy({ region, bucket, accessKeyId, secretAccessKey, endpoint });
  }

  const cacheDir = env.CACHE_DIR ?? './cache';
  return new FileSystemStrategy(cacheDir);
}
