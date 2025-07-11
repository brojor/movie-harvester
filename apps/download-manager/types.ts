export interface ProgressData {
  id: string
  transferred: number
  percentage: number
  length: number
  remaining: number
  eta: number
  runtime: number
  delta: number
  speed: number
}

export interface Threads {
  [key: string]: ProgressData
}

export interface BulkJobPayload {
  urls: string[]
}
