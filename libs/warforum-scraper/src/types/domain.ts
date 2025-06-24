import type { Movie, MovieTopicId, TopicType, TvShow } from '@repo/types'

export interface MovieTopicMeta {
  readonly id: number
  readonly isDub: boolean
}

export type DubbedTopicType = Extract<TopicType, `${string}Dub`>
export type NonDubbedTopicType = Exclude<TopicType, DubbedTopicType>

export interface MovieMetaWithSource {
  coreMeta: Movie
  sourceTopic: number
}

export interface TvShowMetaWithSource {
  coreMeta: TvShow
  sourceTopic: number
}

export type MediaMetaWithSource<T> = T extends MovieTopicId ? MovieMetaWithSource : TvShowMetaWithSource

export interface ParseTopicResult<T> {
  mediaItems: T[]
  reachedCutoff: boolean
}
