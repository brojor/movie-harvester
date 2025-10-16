export function formatBytes(bytes: number, decimals = 2, showUnit = true): string {
  if (bytes === 0)
    return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Number.parseFloat((bytes / k ** i).toFixed(decimals))} ${showUnit ? sizes[i] : ''}`
}

export function formatSpeed(speed: number, decimals = 2): string {
  return `${formatBytes(speed, decimals, true)}/s`
}

export function formatSeconds(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}
