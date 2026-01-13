import { describe, expect, it } from 'bun:test';
import { maskToken } from './mask-token';

describe('maskToken', () => {
  it('returns empty string for empty input', () => {
    expect(maskToken('', 2, 2)).toBe('');
  });

  it('masks the whole token when keepStart + keepEnd >= token length', () => {
    expect(maskToken('abcd', 2, 2)).toBe('****');
    expect(maskToken('abcd', 10, 0)).toBe('****');
    expect(maskToken('abcd', 0, 10)).toBe('****');
  });

  it('keeps the requested start and end and masks the middle', () => {
    expect(maskToken('0123456789', 3, 2)).toBe('012*****89');
  });

  it('supports keeping only start', () => {
    expect(maskToken('secret-token', 3, 0)).toBe('sec*********');
  });

  it('supports keeping only end', () => {
    expect(maskToken('secret-token', 0, 4)).toBe('********oken');
  });

  it('returns the same number of characters as input (except empty input)', () => {
    const token = 'a-very-long-token-value';
    const masked = maskToken(token, 4, 4);
    expect(masked.length).toBe(token.length);
  });
});
