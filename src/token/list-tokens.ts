import { accessForbidden, okResponse } from '../responses';
import { TokenStorage } from './token-storage';

export function listTokens(
  hasAdminRights: boolean,
  tokenStorage: Pick<TokenStorage, 'listTokens'>,
): Response {
  if (!hasAdminRights) {
    return accessForbidden();
  }

  const tokens = tokenStorage.listTokens();
  const message = JSON.stringify({ tokens });
  return okResponse({ message, contentType: 'application/json; charset=utf-8' });
}
