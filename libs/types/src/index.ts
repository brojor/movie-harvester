import type { MovieRecord, TvShowRecord } from '@repo/database'

export type { MovieRecord, TvShowRecord }

export type MediaType = 'movie' | 'tvShow'

export const movieTopicIdMap = {
  322: 'hd',
  323: 'hdDub',
  374: 'uhd',
  373: 'uhdDub',
} as const

export type MovieTopicId = keyof typeof movieTopicIdMap

export type MovieTopicType = typeof movieTopicIdMap[keyof typeof movieTopicIdMap]

export interface TvShowTopicMeta {
  readonly id: number
}

export const tvShowTopicIdMap = {
  324: 'hd',
  384: 'uhd',
} as const

export type TvShowTopicType = typeof tvShowTopicIdMap[keyof typeof tvShowTopicIdMap]

export type TvShowTopicId = keyof typeof tvShowTopicIdMap

export type TopicType = MovieTopicType | TvShowTopicType

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

export type WorkerInputData = MovieRecord | TvShowRecord | Identifiable

export type WorkerResult = Identifiable

// CSFD types
export interface CsfdGenre {
  name: string
  id: number
}

export interface CsfdMovieDetails {
  id: number
  title: string
  originalTitle: string
  releaseYear: number
  runtime: number | null
  voteAverage: number | null
  voteCount: number | null
  posterPath: string | null
  overview: string | null
  genres: CsfdGenre[]
}

export type CsfdTvShowDetails = Omit<CsfdMovieDetails, 'runtime' | 'originalTitle' | 'releaseYear'>

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
