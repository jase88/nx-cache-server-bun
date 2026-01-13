import { describe, expect, it } from 'bun:test';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { TokenStorage } from './token-storage';

describe('TokenStorage dbPath', () => {
  it('creates and uses the sqlite db at the provided path', async () => {
    const dir = join(tmpdir(), `nx-cache-token-db-${randomUUID()}`);
    await fs.mkdir(dir, { recursive: true });

    const dbPath = join(dir, 'tokens.sqlite');

    const storage = new TokenStorage(dbPath);
    const token = { id: 't1', value: 'value-1', permission: 'readonly' as const };

    const addRes = storage.addToken(token);
    expect(addRes).toEqual({ result: true, error: null });

    const found = storage.findToken(token.value);
    expect(found).toEqual(token);

    const stat = await fs.stat(dbPath);
    expect(stat.isFile()).toBe(true);
  });
});
