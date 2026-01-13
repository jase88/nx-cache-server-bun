import {
  accessForbidden,
  badRequest,
  internalServerError,
  noContentResponse,
  notFoundError,
} from '../responses';
import { TokenStorage } from './token-storage';

export async function deleteToken(
  hasAdminRights: boolean,
  tokenStorage: Pick<TokenStorage, 'removeToken'>,
  tokenToDelete: string,
) {
  if (!hasAdminRights) {
    return accessForbidden();
  }

  if (!tokenToDelete) {
    return badRequest('token is required');
  }
  const { result, error } = tokenStorage.removeToken(tokenToDelete);

  if (error) {
    return internalServerError('An error occurred while deleting the token');
  }

  if (!result) {
    return notFoundError('Token not found');
  }
  return noContentResponse();
}
