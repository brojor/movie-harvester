export interface MovieTopicMeta {
  readonly id: number
  readonly isDub: boolean
}

export type TopicType = 'hd' | 'uhd' | 'hdDub' | 'uhdDub'

export const movieTopicIdMap = {
  322: 'hd',
  323: 'hdDub',
  374: 'uhd',
  373: 'uhdDub',
} as const

export type MovieTopicId = keyof typeof movieTopicIdMap

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

export interface CoreMetaWithSourceTopic {
  coreMeta: NonDubbedMovieCoreMeta | DubbedMovieCoreMeta
  sourceTopic: number
}

export interface ParseTopicResult {
  mediaItems: CoreMetaWithSourceTopic[]
  reachedCutoff: boolean
}
