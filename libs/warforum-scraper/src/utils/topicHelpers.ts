import type { MediaType, MovieTopicId, TopicType, TvShowTopicId } from '@repo/types'
import { movieTopicIdMap, tvShowTopicIdMap } from '@repo/types'

export function getMediaType(topicId: MovieTopicId | TvShowTopicId): MediaType {
  return topicId in movieTopicIdMap ? 'movie' : 'tvShow'
}

export function getTopicType(topicId: MovieTopicId | TvShowTopicId): TopicType {
  return topicId in movieTopicIdMap
    ? movieTopicIdMap[topicId as MovieTopicId]
    : tvShowTopicIdMap[topicId as TvShowTopicId]
}

export function buildTopicUrl(topicId: MovieTopicId | TvShowTopicId, page: number): string {
  const params = new URLSearchParams({ f: topicId.toString() })

  if (page > 0) {
    params.set('topicdays', '0')
    params.set('start', (45 * page).toString())
  }

  return `viewforum.php?${params.toString()}`
}
