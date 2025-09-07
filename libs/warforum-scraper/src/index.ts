import type { WarforumAgentOpts } from '@repo/shared'
import he from 'he'
import { createWarforumClient, fetchHtml } from './infra/httpClient.js'
import { indexMediaFromTopic } from './scraper/indexMediaFromTopic.js'

export interface WarforumScraper {
  findCsfdIdInTopic: (topicId: number) => Promise<number | null>
  indexMediaFromTopic: (topicId: any, cutoffDate: Date) => Promise<any>
}

export function createWarforumScraper(config: WarforumAgentOpts, deprecatedDate: string): WarforumScraper {
  const httpClient = createWarforumClient(config)

  return {
    findCsfdIdInTopic: async (topicId: number): Promise<number | null> => {
      const html = await fetchHtml(httpClient, `viewtopic.php?t=${topicId}`)
      const decodedHtml = he.decode(html)
      const match = decodedHtml.match(/(?:www\.)?csfd\.cz\/film\/(\d+)/)
      if (match) {
        return Number.parseInt(match[1])
      }

      return null
    },
    indexMediaFromTopic: async (topicId: any, cutoffDate: Date) => {
      return indexMediaFromTopic(httpClient, topicId, cutoffDate, deprecatedDate)
    },
  }
}

export { indexMediaFromTopic }
