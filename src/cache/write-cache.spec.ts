import { describe, expect, it, mock } from 'bun:test';
import { writeCache } from './write-cache';
import { CacheFile } from './cache-file.interface';

const logger = { error: mock() };
mock.module('../logger', () => ({ logger }));

describe('writeCache', () => {
  const makeCacheFile = () => ({
    valid: mock<CacheFile['valid']>().mockReturnValue(true),
    exists: mock<CacheFile['exists']>(),
    write: mock<CacheFile['write']>(),
  });

  const createMockedBuffer = (value: string) =>
    mock().mockResolvedValue(new TextEncoder().encode(value).buffer);

  it('returns 403 when token lacks write permission', async () => {
    const cacheFile = makeCacheFile();
    const mockedBuffer = createMockedBuffer('data');
    const response = await writeCache(cacheFile, 'readonly', mockedBuffer, '4');

    expect(response.status).toBe(403);
    expect(await response.text()).toBe('Access forbidden');
    expect(cacheFile.valid).not.toHaveBeenCalled();
    expect(cacheFile.exists).not.toHaveBeenCalled();
    expect(cacheFile.write).not.toHaveBeenCalled();
  });

  it('returns 400 when hash is invalid and does not read body or touch storage', async () => {
    const cacheFile = makeCacheFile();
    cacheFile.valid.mockReturnValue(false);
    const mockedBuffer = createMockedBuffer('data');

    const response = await writeCache(cacheFile, 'full', mockedBuffer, '4');

    expect(response.status).toBe(400);
    expect(await response.text()).toBe('Invalid hash');
    expect(cacheFile.valid).toHaveBeenCalled();
    expect(mockedBuffer).not.toHaveBeenCalled();
    expect(cacheFile.exists).not.toHaveBeenCalled();
    expect(cacheFile.write).not.toHaveBeenCalled();
  });

  it('returns 500 when reading request body fails', async () => {
    const bodyError = new Error('body read failed');
    const cacheFile = makeCacheFile();

    const mockedBuffer = mock().mockRejectedValue(bodyError);
    const response = await writeCache(cacheFile, 'full', mockedBuffer, '4');

    expect(response.status).toBe(500);
    expect(await response.text()).toBe('Failed to read request body');
    expect(cacheFile.exists).not.toHaveBeenCalled();
    expect(cacheFile.write).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(bodyError);
  });

  it('returns 500 when exists check fails', async () => {
    const existsError = new Error('stat failed');
    const cacheFile = makeCacheFile();
    cacheFile.exists.mockRejectedValue(existsError);

    const mockedBuffer = createMockedBuffer('data');
    const response = await writeCache(cacheFile, 'full', mockedBuffer, '4');

    expect(response.status).toBe(500);
    expect(await response.text()).toBe('Failed to check cache');
    expect(cacheFile.write).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(existsError);
  });

  it('returns 409 when file already exists', async () => {
    const cacheFile = makeCacheFile();
    cacheFile.exists.mockResolvedValue(true);

    const mockedBuffer = createMockedBuffer('data');
    const response = await writeCache(cacheFile, 'full', mockedBuffer, '4');

    expect(response.status).toBe(409);
    expect(await response.text()).toBe('Cannot override an existing record');
    expect(cacheFile.exists).toHaveBeenCalled();
    expect(cacheFile.write).not.toHaveBeenCalled();
  });

  it('returns 400 when content length header is invalid', async () => {
    const cacheFile = makeCacheFile();
    cacheFile.exists.mockResolvedValue(false);

    const mockedBuffer = createMockedBuffer('data');
    const response = await writeCache(cacheFile, 'full', mockedBuffer, 'not-a-number');

    expect(response.status).toBe(400);
    expect(await response.text()).toBe('Invalid Content-Length header');
    expect(cacheFile.write).not.toHaveBeenCalled();
  });

  it('returns 400 when content length does not match body length', async () => {
    const cacheFile = makeCacheFile();
    cacheFile.exists.mockResolvedValue(false);

    const mockedBuffer = createMockedBuffer('data');
    const response = await writeCache(cacheFile, 'full', mockedBuffer, '3');

    expect(response.status).toBe(400);
    expect(await response.text()).toBe('Invalid Content-Length header');
    expect(cacheFile.write).not.toHaveBeenCalled();
  });

  it('writes and returns 200 with null body when all validations pass', async () => {
    const cacheFile = makeCacheFile();
    cacheFile.exists.mockResolvedValue(false);
    cacheFile.write.mockResolvedValue(undefined);

    const body = 'some-data';
    const mockedBuffer = createMockedBuffer(body);
    const response = await writeCache(cacheFile, 'full', mockedBuffer, `${body.length}`);

    expect(cacheFile.exists).toHaveBeenCalled();
    expect(cacheFile.write).toHaveBeenCalledWith(new TextEncoder().encode(body));
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('');
  });

  it('returns 500 when write fails', async () => {
    const diskFullError = new Error('disk full');
    const cacheFile = makeCacheFile();
    cacheFile.exists.mockResolvedValue(false);
    cacheFile.write.mockRejectedValue(diskFullError);

    const body = 'payload';
    const mockedBuffer = createMockedBuffer(body);
    const response = await writeCache(cacheFile, 'full', mockedBuffer, `${body.length}`);

    expect(cacheFile.exists).toHaveBeenCalled();
    expect(cacheFile.write).toHaveBeenCalledWith(new TextEncoder().encode(body));
    expect(response.status).toBe(500);
    expect(await response.text()).toBe('Failed to write to cache');
    expect(logger.error).toHaveBeenCalledWith(diskFullError);
  });
});
