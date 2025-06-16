export function wait(ms: number): Promise<void> {
  return new Promise(res => setTimeout(res, ms))
}

export function getDelayMs(delayBetween: number | [number, number]): number {
  return Array.isArray(delayBetween)
    ? Math.floor(Math.random() * (delayBetween[1] - delayBetween[0] + 1)) + delayBetween[0]
    : delayBetween
}

export function isRetryableStatus(status: number | undefined): boolean {
  return status === 429 || status === 503
}
