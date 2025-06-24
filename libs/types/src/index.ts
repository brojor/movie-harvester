import type { MovieRecord, TvShowRecord } from '@repo/database'

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
