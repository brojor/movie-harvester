export const movieTopicIdMap = {
  322: 'hd',
  323: 'hdDub',
  374: 'uhd',
  373: 'uhdDub',
} as const

export type MovieTopicId = keyof typeof movieTopicIdMap
export type MovieTopicType = typeof movieTopicIdMap[MovieTopicId]

export const tvShowTopicIdMap = {
  324: 'hd',
  384: 'uhd',
} as const

export type TvShowTopicId = keyof typeof tvShowTopicIdMap
export type TvShowTopicType = typeof tvShowTopicIdMap[TvShowTopicId]

export type TopicType = MovieTopicType | TvShowTopicType
