import type { CoreMetaWithSourceTopic, MovieTopicId } from '../types/domain.js'
import { fetchHtml } from '../infra/httpClient.js'
import { movieTopicIdMap } from '../types/domain.js'
import { parseTopicPage } from './parseTopicPage.js'

export async function indexMediaFromTopic(topicId: MovieTopicId, cutoffDate: Date): Promise<CoreMetaWithSourceTopic[]> {
  const coreMetaAcc: CoreMetaWithSourceTopic[] = []
  const topicRecordCount = 45
  const topicType = movieTopicIdMap[topicId]
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
    const { mediaItems, reachedCutoff } = parseTopicPage(html, topicType, cutoffDate)

    coreMetaAcc.push(...mediaItems)

    if (!reachedCutoff) {
      recursionDepth++
      await traverseTopic()
    }
  }

  await traverseTopic()
  return coreMetaAcc
}
