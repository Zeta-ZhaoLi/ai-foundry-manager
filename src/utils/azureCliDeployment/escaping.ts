export function shellDoubleQuote(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\$/g, '\\$')
    .replace(/`/g, '\\`');
}

export function powershellSingleQuote(value: string): string {
  return value.replace(/'/g, "''");
}
