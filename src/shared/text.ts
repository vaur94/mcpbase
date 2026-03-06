export function sanitizeMessage(input: string): string {
  let normalized = '';

  for (const character of input) {
    const codePoint = character.codePointAt(0) ?? 0;
    const isControlCharacter = codePoint <= 31 || codePoint === 127;
    normalized += isControlCharacter ? ' ' : character;
  }

  return normalized.replace(/\s+/g, ' ').trim();
}
