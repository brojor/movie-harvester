import type { MovieMetaWithSource, MovieTopicId, TvShowMetaWithSource, TvShowTopicId } from '../types/domain.js'
import { fetchHtml } from '../infra/httpClient.js'
import { movieTopicIdMap, tvShowTopicIdMap } from '../types/domain.js'
import { parseTopicPage } from './parseTopicPage.js'

export async function indexMediaFromTopic(topicId: MovieTopicId, cutoffDate: Date): Promise<MovieMetaWithSource[]>
export async function indexMediaFromTopic(topicId: TvShowTopicId, cutoffDate: Date): Promise<TvShowMetaWithSource[]>
export async function indexMediaFromTopic(topicId: MovieTopicId | TvShowTopicId, cutoffDate: Date): Promise<MovieMetaWithSource[] | TvShowMetaWithSource[]> {
  const movieAcc: MovieMetaWithSource[] = []
  const tvShowAcc: TvShowMetaWithSource[] = []
  const topicRecordCount = 45
  const topicType = topicId in movieTopicIdMap ? movieTopicIdMap[topicId as MovieTopicId] : tvShowTopicIdMap[topicId as TvShowTopicId]
  let recursionDepth = 0

  async function traverseTopic(): Promise<void> {
    const searchParams = new URLSearchParams()
    searchParams.set('f', topicId.toString())

    if (recursionDepth > 0) {
      searchParams.set('topicdays', '0')
      searchParams.set('start', (topicRecordCount * recursionDepth).toString())
    }

    const url = `viewforum.php?${searchParams.toString()}`
    const html = await fetchHtml(url)
    const mediaType = topicId in movieTopicIdMap ? 'movie' : 'tvShow'

    let reachedCutoff = false

    if (mediaType === 'movie') {
      const { mediaItems, reachedCutoff: reachedCutoffMovie } = parseTopicPage(html, topicType, 'movie', cutoffDate)
      reachedCutoff = reachedCutoffMovie
      movieAcc.push(...mediaItems)
    }
    else {
      const { mediaItems, reachedCutoff: reachedCutoffTvShow } = parseTopicPage(html, topicType, 'tvShow', cutoffDate)
      reachedCutoff = reachedCutoffTvShow
      tvShowAcc.push(...mediaItems)
    }

    if (!reachedCutoff) {
      recursionDepth++
      await traverseTopic()
    }
  }

  await traverseTopic()
  return topicId in movieTopicIdMap ? movieAcc : tvShowAcc
}
