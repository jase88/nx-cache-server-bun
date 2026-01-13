export function maskToken(token: string, keepStart: number, keepEnd: number): string {
  if (!token) return '';
  if (token.length <= keepStart + keepEnd) return '*'.repeat(token.length);

  const start = token.slice(0, keepStart);
  const end = keepEnd > 0 ? token.slice(-keepEnd) : '';
  const middle = '*'.repeat(token.length - keepStart - keepEnd);
  return `${start}${middle}${end}`;
}
