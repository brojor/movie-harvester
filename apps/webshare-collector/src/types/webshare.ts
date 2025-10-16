export interface WebshareResponse {
  status: string
  total: number
  file: WebshareFile[]
}

export interface WebshareFile {
  ident: string
  name: string
  type: string
  img: string
  stripe: string
  stripe_count: number
  size: number
  queued: number
  positive_votes: number
  negative_votes: number
  password: number
}

export interface WebshareFileInfoResponse {
  status: string
  name: string
  description: string
  size: number
  type: string
  adult: number
  queued: number
  positive_votes: number
  negative_votes: number
  available: number
  password: number
  removed: number
  removed_at: string
  removal_reason: string
  copyrighted: number
  yours: number
  app_version: number
  stripe_count?: number
  stripe?: string
  length?: number
  bitrate?: number
  format?: string
  width?: number
  height?: number
  fps?: number
  video?: Video
  audio?: Audio
}

export interface Video {
  stream: VideoStream | VideoStream[]
}

export interface VideoStream {
  format: string
  width: number
  height: number
  bitrate: number
  fps: number
}

export interface Audio {
  stream: AudioStream | AudioStream[]
}

export interface AudioStream {
  format: string
  channels: number
  bitrate: number
  language: string
}
