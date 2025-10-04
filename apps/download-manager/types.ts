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

export interface CompletedEvent {
  jobId: JobId
  returnvalue: any
  prev: string
}

export interface RemovedEvent {
  jobId: JobId
  prev: string
}

export interface FailedJob {
  jobId: JobId
  failedReason: string
}

export interface AddedEvent {
  jobId: JobId
  name: string
}

export interface ActiveEvent {
  jobId: JobId
  prev: string
}

export interface DelayedEvent {
  jobId: JobId
  prev: string
}

export interface BulkJobPayload {
  urls: string[]
  bundleName: string
}

export interface Bundle {
  id: string
  name: string
  partIds: Set<string>
}

export interface Part {
  id: string
  name: string
  progress: ProgressData
  state: 'active' | 'paused'
}
