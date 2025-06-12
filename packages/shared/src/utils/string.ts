export function normalizeTitle(input: string | null): string | null {
  if (!input) {
    return null
  }

  if (input.endsWith(', The')) {
    return `The ${input.slice(0, -5)}`
  }
  return input
}
