export interface MovieTopicMeta {
  readonly id: number
  readonly isDub: boolean
}

export type TopicType = 'hd' | 'uhd' | 'hdDub' | 'uhdDub'
export type MediaType = 'movie' | 'tvShow'

export const movieTopicIdMap = {
  322: 'hd',
  323: 'hdDub',
  374: 'uhd',
  373: 'uhdDub',
} as const

export type MovieTopicId = keyof typeof movieTopicIdMap

export interface TvShowTopicMeta {
  readonly id: number
}

export const tvShowTopicIdMap = {
  324: 'hd',
  384: 'uhd',
} as const

export type TvShowTopicId = keyof typeof tvShowTopicIdMap

type TopicLabel = typeof movieTopicIdMap[keyof typeof movieTopicIdMap] | typeof tvShowTopicIdMap[keyof typeof tvShowTopicIdMap]
export type DubbedTopicType = Extract<TopicLabel, `${string}Dub`>
export type NonDubbedTopicType = Exclude<TopicLabel, DubbedTopicType>
export interface NonDubbedMovieCoreMeta {
  readonly originalTitle: string
  readonly czechTitle?: string
  readonly year: number
}

export interface DubbedMovieCoreMeta {
  readonly czechTitle: string
  readonly originalTitle?: string
  readonly year: number
}

export interface MovieMetaWithSource {
  coreMeta: NonDubbedMovieCoreMeta | DubbedMovieCoreMeta
  sourceTopic: number
}

export interface TvShowCoreMeta {
  readonly czechTitle?: string
  readonly originalTitle: string
  readonly languages: string[]
}

export interface TvShowMetaWithSource {
  coreMeta: TvShowCoreMeta
  sourceTopic: number
}

export type MediaMetaWithSource<T> = T extends MovieTopicId ? MovieMetaWithSource : TvShowMetaWithSource

export interface ParseMovieTopicResult {
  mediaItems: MovieMetaWithSource[]
  reachedCutoff: boolean
}

export interface ParseTvShowTopicResult {
  mediaItems: TvShowMetaWithSource[]
  reachedCutoff: boolean
}
