export function moveDefiniteArticleToFront(input: string): string {
  if (input.endsWith(', The')) {
    return `The ${input.slice(0, -5)}`
  }
  return input
}

export function moveDefiniteArticleToEnd(input: string): string {
  if (input.startsWith('The ')) {
    return `${input.slice(4)}, The`
  }
  return input
}
