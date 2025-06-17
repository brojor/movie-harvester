import type { MediaMetaWithSource, MovieMetaWithSource, MovieTopicId, TvShowMetaWithSource, TvShowTopicId } from '../types/domain.js'
import { fetchHtml } from '../infra/httpClient.js'
import { buildTopicUrl, getMediaType, getTopicType } from '../utils/topicHelpers.js'
import { parseTopicPage } from './parseTopicPage.js'

export async function indexMediaFromTopic<T extends MovieTopicId | TvShowTopicId>(
  topicId: T,
  cutoffDate: Date,
): Promise<MediaMetaWithSource<T>[]> {
  const items: (MovieMetaWithSource | TvShowMetaWithSource)[] = []
  const mediaType = getMediaType(topicId)
  const topicType = getTopicType(topicId)

  let page = 0
  let reachedCutoff = false

  while (!reachedCutoff) {
    const url = buildTopicUrl(topicId, page)
    const html = await fetchHtml(url)

    const result = mediaType === 'movie'
      ? parseTopicPage(html, topicType, 'movie', cutoffDate)
      : parseTopicPage(html, topicType, 'tvShow', cutoffDate)

    items.push(...result.mediaItems)
    reachedCutoff = result.reachedCutoff

    page++
  }

  return items as MediaMetaWithSource<T>[]
}
