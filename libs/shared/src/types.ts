import type { InternalAxiosRequestConfig } from 'axios'

export interface RetryConfig extends InternalAxiosRequestConfig {
  retryCount?: number
}

export interface HttpClient {
  get: <T = any>(path: string) => Promise<T>
}

export interface HttpClientOpts {
  concurrency?: number
  delayBetween?: number | [number, number]
  retries?: number
  bearerToken?: string
  responseType?: 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream'
}
