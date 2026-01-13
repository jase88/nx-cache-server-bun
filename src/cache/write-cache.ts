import {
  accessForbidden,
  badRequest,
  conflictError,
  internalServerError,
  okResponse,
} from '../responses';
import { CacheFile } from './cache-file.interface';
import { TokenPermission } from '../token/token-interfaces';
import { logger } from '../logger';

const validateContentLength = (headerContentLength: string, actualLength: number) => {
  const contentLength = Number(headerContentLength);
  if (!Number.isFinite(contentLength) || contentLength <= 0) return false;
  return contentLength === actualLength;
};

export async function writeCache(
  cacheFile: Pick<CacheFile, 'exists' | 'write' | 'valid'>,
  tokenPermission: TokenPermission | null,
  arrayBuffer: () => Promise<ArrayBuffer>,
  headerContentLength: string,
) {
  const canWrite = tokenPermission === 'full';

  if (!canWrite) {
    return accessForbidden();
  }

  if (!cacheFile.valid()) {
    return badRequest('Invalid hash');
  }

  let body: ArrayBuffer;
  try {
    body = await arrayBuffer();
  } catch (error) {
    logger.error(error);
    return internalServerError('Failed to read request body');
  }

  try {
    if (await cacheFile.exists()) {
      return conflictError('Cannot override an existing record');
    }
  } catch (error) {
    logger.error(error);
    return internalServerError('Failed to check cache');
  }

  if (!validateContentLength(headerContentLength, body.byteLength)) {
    return badRequest('Invalid Content-Length header');
  }

  try {
    await cacheFile.write(new Uint8Array(body));
    return okResponse({ message: null });
  } catch (error) {
    logger.error(error);
    return internalServerError('Failed to write to cache');
  }
}
