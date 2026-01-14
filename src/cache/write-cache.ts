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

const validateContentLengthHeader = (headerContentLength: string) => {
  const contentLength = Number(headerContentLength);
  if (!Number.isFinite(contentLength) || contentLength <= 0) return null;
  return contentLength;
};

const toReadableStream = (
  body: ReadableStream<Uint8Array> | Blob | null,
): ReadableStream<Uint8Array<ArrayBufferLike>> => {
  if (body instanceof ReadableStream) return body;
  if (body instanceof Blob) return body.stream();
  return null;
};

class ContentLengthExceededError extends Error {}
class ContentLengthMismatchError extends Error {}

export async function writeCache(
  cacheFile: Pick<CacheFile, 'exists' | 'writeStream' | 'valid'>,
  tokenPermission: TokenPermission | null,
  body: ReadableStream<Uint8Array> | Blob | null,
  headerContentLength: string,
) {
  const canWrite = tokenPermission === 'full';

  if (!canWrite) {
    return accessForbidden();
  }

  if (!cacheFile.valid()) {
    return badRequest('Invalid hash');
  }

  try {
    if (await cacheFile.exists()) {
      return conflictError('Cannot override an existing record');
    }
  } catch (error) {
    logger.error(error);
    return internalServerError('Failed to check cache');
  }

  const expectedLength = validateContentLengthHeader(headerContentLength);
  const sourceStream = toReadableStream(body);
  if (!expectedLength || !sourceStream) {
    return badRequest('Invalid Content-Length header');
  }

  let total = 0;
  const reader = sourceStream.getReader();
  const countedStream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { value, done } = await reader.read();
      if (done) {
        if (total !== expectedLength) {
          controller.error(new ContentLengthMismatchError());
          return;
        }
        controller.close();
        return;
      }
      total += value.byteLength;
      if (total > expectedLength) {
        controller.error(new ContentLengthExceededError());
        return;
      }
      controller.enqueue(value);
    },
    async cancel() {
      try {
        await reader.cancel();
      } catch {}
    },
  });

  try {
    await cacheFile.writeStream(countedStream);
    return okResponse({ message: null });
  } catch (error) {
    if (
      error instanceof ContentLengthExceededError ||
      error instanceof ContentLengthMismatchError
    ) {
      return badRequest('Invalid Content-Length header');
    }
    logger.error(error);
    return internalServerError('Failed to write to cache');
  }
}
