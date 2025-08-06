export interface ProgressData {
  transferred: number
  percentage: number
  length: number
  remaining: number
  eta: number
  runtime: number
  delta: number
  speed: number
  status: 'active' | 'paused'
}

export interface ProgressEvent {
  jobId: string
  data: ProgressData
}

export interface CompletedJob {
  jobId: string
  returnvalue: any
}

export interface FailedJob {
  jobId: string
  failedReason: string
}

export interface BulkJobPayload {
  urls: string[]
}
