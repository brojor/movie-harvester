import type { MovieTopicId, TvShowTopicId } from '@repo/shared'
import type { MediaTopic, MovieTopic, TvShowTopic } from '@repo/types'
import type { HttpClient } from '../infra/httpClient.js'
import { fetchHtml } from '../infra/httpClient.js'
import { buildTopicUrl, getMediaType, getTopicType } from '../utils/topicHelpers.js'
import { parseTopicPage } from './parseTopicPage.js'

export async function indexMediaFromTopic<T extends MovieTopicId | TvShowTopicId>(
  httpClient: HttpClient,
  topicId: T,
  cutoffDate: Date,
  deprecatedDate: string,
): Promise<MediaTopic<T>[]> {
  const items: (MovieTopic | TvShowTopic)[] = []
  const mediaType = getMediaType(topicId)
  const topicType = getTopicType(topicId)

  let page = 0
  let reachedCutoff = false

  while (!reachedCutoff) {
    const url = buildTopicUrl(topicId, page)
    const html = await fetchHtml(httpClient, url)

    const result = mediaType === 'movie'
      ? parseTopicPage(html, topicType, 'movie', cutoffDate, deprecatedDate)
      : parseTopicPage(html, topicType, 'tvShow', cutoffDate, deprecatedDate)

    items.push(...result.mediaItems)
    reachedCutoff = result.reachedCutoff

    page++
  }

  return items as MediaTopic<T>[]
}
