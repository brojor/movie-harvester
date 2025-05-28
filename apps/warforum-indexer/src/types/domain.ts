export enum TopicKey {
  Hd = 'hd',
  HdDub = 'hdDub',
  Uhd = 'uhd',
  UhdDub = 'uhdDub',
}

export interface TopicMeta {
  id: number
  isDub: boolean
}

export const TOPIC_META: Record<TopicKey, TopicMeta> = {
  [TopicKey.Hd]: { id: 322, isDub: false },
  [TopicKey.HdDub]: { id: 323, isDub: true },
  [TopicKey.Uhd]: { id: 374, isDub: false },
  [TopicKey.UhdDub]: { id: 373, isDub: true },
} as const

export interface Movie {
  czechTitle: string
  originalTitle: string
  year: number
}

export interface MovieWithTopicId extends Movie {
  topicNumber: number
}

export interface ParseResult {
  movies: MovieWithTopicId[]
  nextPage: string | null
}
