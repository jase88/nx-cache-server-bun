import { describe, expect, it, mock } from 'bun:test';
import { deleteToken } from './delete-token';
import { TokenStorage } from './token-storage';

const makeStorage = ({ result, error }: ReturnType<TokenStorage['removeToken']>) => ({
  removeToken: mock().mockReturnValue({ result, error }),
});

describe('deleteToken', () => {
  it('returns 403 when caller lacks admin rights and does not call storage', async () => {
    const storage = makeStorage({ result: true, error: null });
    const response = await deleteToken(false, storage, 'abc');

    expect(response.status).toBe(403);
    expect(response.headers.get('Content-Type')).toBe('text/plain');
    expect(await response.text()).toBe('Access forbidden');
    expect(storage.removeToken).not.toHaveBeenCalled();
  });

  it('returns 400 when token is missing and does not call storage', async () => {
    const storage = makeStorage({ result: true, error: null });
    const response = await deleteToken(true, storage, '');

    expect(response.status).toBe(400);
    expect(await response.text()).toBe('token is required');
    expect(storage.removeToken).not.toHaveBeenCalled();
  });

  it('returns 500 when storage returns error', async () => {
    const storage = makeStorage({ result: false, error: 'unknownError' });
    const response = await deleteToken(true, storage, 'abc');

    expect(response.status).toBe(500);
    expect(await response.text()).toBe('An error occurred while deleting the token');
    expect(storage.removeToken).toHaveBeenCalledWith('abc');
  });

  it('returns 404 when token not found', async () => {
    const storage = makeStorage({ result: false, error: null });
    const response = await deleteToken(true, storage, 'abc');

    expect(response.status).toBe(404);
    expect(await response.text()).toBe('Token not found');
    expect(storage.removeToken).toHaveBeenCalledWith('abc');
  });

  it('returns 204 when deletion succeeds', async () => {
    const storage = makeStorage({ result: true, error: null });
    const response = await deleteToken(true, storage, 'abc');

    expect(response.status).toBe(204);
    expect(response.headers.get('Content-Type')).toBeNull();
    expect(await response.text()).toBe('');
    expect(storage.removeToken).toHaveBeenCalledWith('abc');
  });
});
