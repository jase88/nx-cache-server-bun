import { Database, SQLiteError } from 'bun:sqlite';
import { TokenRecord } from './token-interfaces';
import { logger } from '../logger';
import { maskToken } from './mask-token';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export type DatabaseOperation<DatabaseError> =
  | { result: true; error: null }
  | { result: false; error: DatabaseError };

type UnknownError = 'unknownError';
type AddTokenError = 'tokenIdAlreadyExists' | 'tokenValueAlreadyExists' | UnknownError;

export class TokenStorage {
  readonly #db: Database;

  constructor(dbPath: string = './data/nx-cache-server-tokens.sqlite') {
    mkdirSync(dirname(dbPath), { recursive: true });

    this.#db = new Database(dbPath, { create: true, strict: true });

    this.#db.run(`
      CREATE TABLE IF NOT EXISTS tokens (
        id TEXT NOT NULL UNIQUE,
        value TEXT PRIMARY KEY,
        permission TEXT NOT NULL CHECK (permission IN ('readonly', 'full'))
      );
    `);
  }

  #getAddTokenError({ code, message }: SQLiteError): AddTokenError {
    let error: AddTokenError = 'unknownError';

    if (code === 'SQLITE_CONSTRAINT_UNIQUE') {
      if (message.includes('tokens.id')) {
        error = 'tokenIdAlreadyExists';
      }
      if (message.includes('tokens.value')) {
        error = 'tokenValueAlreadyExists';
      }
    }
    return error;
  }

  addToken({ id, value, permission }: TokenRecord): DatabaseOperation<AddTokenError> {
    const insertStatement = this.#db.query(
      'INSERT INTO tokens (id, value, permission) VALUES ($id, $value, $permission)',
    );

    try {
      insertStatement.run({ id, value, permission });
      return { result: true, error: null };
    } catch (exception: unknown) {
      logger.error(exception);
      return { result: false, error: this.#getAddTokenError(exception as SQLiteError) };
    }
  }

  removeToken(value: string): DatabaseOperation<UnknownError> {
    const deleteStatement = this.#db.query('DELETE FROM tokens WHERE value = $value');

    try {
      const deleted = deleteStatement.run({ value });
      return { result: deleted.changes > 0, error: null };
    } catch (error) {
      logger.error(error);
      return { result: false, error: 'unknownError' };
    }
  }

  listTokens(): TokenRecord[] {
    const selectStatement = this.#db.query<TokenRecord, Record<string, never>>(
      'SELECT id, value, permission FROM tokens ORDER BY id ASC',
    );

    try {
      const tokenRecords = selectStatement.all({}) ?? [];
      return tokenRecords.map(({ id, value, permission }) => ({
        id,
        permission,
        value: maskToken(value, 1, 1),
      }));
    } catch (error) {
      logger.error(error);
      return [];
    }
  }

  findToken(value: string): TokenRecord | null {
    const selectStatement = this.#db.query<TokenRecord, Pick<TokenRecord, 'value'>>(
      'SELECT id, value, permission FROM tokens WHERE value = $value LIMIT 1',
    );

    try {
      return selectStatement.get({ value }) ?? null;
    } catch (error) {
      logger.error(error);
      return null;
    }
  }
}
