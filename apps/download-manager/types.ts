export type JobId = string
export type BundleId = string

export interface ProgressData {
  transferred: number
  percentage: number
  length: number
  remaining: number
  eta: number
  runtime: number
  delta: number
  speed: number
}

export interface ProgressEvent {
  jobId: JobId
  data: ProgressData
}

export interface CompletedJob {
  jobId: JobId
  returnvalue: any
}

export interface FailedJob {
  jobId: JobId
  failedReason: string
}

export interface BulkJobPayload {
  urls: string[]
}
