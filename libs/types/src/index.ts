import type { MovieTopicId, MovieTopicType, TvShowTopicType } from '@repo/shared'

export type MediaType = 'movie' | 'tvShow'
export * from './csfd.js'
export * from './rt.js'
export * from './tmdb.js'

// Topic types - these should match the ones in @repo/shared
export type {
  MovieTopicId,
  MovieTopicType,
  TopicType,
  TvShowTopicId,
  TvShowTopicType,
} from '@repo/shared'

// Database record types - these should match the ones in @repo/database
export interface MovieRecord {
  id: number
  czechTitle: string | null
  originalTitle: string | null
  year: number
  tmdbId: number | null
  csfdId: number | null
  rtId: string | null
  createdAt: Date
  updatedAt: Date
}

export interface TvShowRecord {
  id: number
  czechTitle: string | null
  originalTitle: string
  tmdbId: number | null
  csfdId: number | null
  rtId: string | null
  createdAt: Date
  updatedAt: Date
}

export interface TvShowTopicMeta {
  readonly id: number
}

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
  readonly czechTitle: string
  readonly originalTitle: string
}

export interface TvShowWithLanguages extends TvShow {
  readonly languages: string[]
}

export type WorkerAction = 'find-id' | 'get-meta' | 'find-tv-show' | 'find-movie'

export interface Identifiable {
  id: number | string
}

// Note: MovieRecord and TvShowRecord are now in @repo/database
export type WorkerInputData = Identifiable

export type WorkerResult = Identifiable

export interface TvShowCoreMeta {
  readonly titles: string[]
  readonly languages: string[]
}

export interface MovieCoreMeta {
  readonly titles: string[]
  readonly year: number
}

export interface TvShowTopic extends TvShowCoreMeta {
  readonly id: number
  readonly type: TvShowTopicType
}

export interface MovieTopic extends MovieCoreMeta {
  readonly id: number
  readonly type: MovieTopicType
}

export type MediaTopic<T> = T extends MovieTopicId ? MovieTopic : TvShowTopic

export interface ParseTopicResult<T> {
  mediaItems: T[]
  reachedCutoff: boolean
}
