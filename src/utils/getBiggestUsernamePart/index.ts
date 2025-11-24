export function getBiggestUsernamePart(email: string): string {
  if (!email.includes('@')) return '';

  const beforeAt = email.split('@')[0];
  const parts = beforeAt.split(/[.\-_]/g);

  return parts.reduce((biggest, current) =>
    current.length > biggest.length ? current : biggest,
  ''
  );
}
