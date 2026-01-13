export type TokenPermission = 'readonly' | 'full';

export interface TokenRecord {
  id: string;
  value: string;
  permission: TokenPermission;
}
