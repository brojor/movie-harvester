import type { MovieRecord, TvShowRecord } from '@repo/database'

export type TopicType = 'hd' | 'uhd' | 'hdDub' | 'uhdDub'
export type MediaType = 'movie' | 'tvShow'

export interface NonDubbedMovie {
  readonly originalTitle: string
  readonly czechTitle?: string
  readonly year: number
}

export interface DubbedMovie {
  readonly czechTitle: string
  readonly originalTitle?: string
  readonly year: number
}

export type Movie = NonDubbedMovie | DubbedMovie

export interface TvShow {
  readonly czechTitle?: string
  readonly originalTitle: string
  readonly languages: string[]
}

export type WorkerAction = 'find-id' | 'get-meta'

export interface Identifiable {
  id: number | string
}

export type WorkerInputData = MovieRecord | TvShowRecord | Identifiable

export type WorkerResult = Identifiable
