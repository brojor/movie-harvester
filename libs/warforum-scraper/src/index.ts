import he from 'he'
import { createWarforumClient, fetchHtml } from './infra/httpClient.js'
import { indexMediaFromTopic } from './scraper/indexMediaFromTopic.js'

export interface WarforumConfig {
  baseUrl: string
  userAgent: string
  sid: string
  userId: number
  autoLoginId: string
  indexerDeprecatedDate: string
  delayMin?: number
  delayMax?: number
}

export function createWarforumScraper(config: WarforumConfig): {
  findCsfdIdInTopic: (topicId: number) => Promise<number | null>
  indexMediaFromTopic: (topicId: any, cutoffDate: Date) => Promise<any>
} {
  createWarforumClient(config)
  return {
    findCsfdIdInTopic: async (topicId: number): Promise<number | null> => {
      const html = await fetchHtml(`viewtopic.php?t=${topicId}`)
      const decodedHtml = he.decode(html)
      const match = decodedHtml.match(/(?:www\.)?csfd\.cz\/film\/(\d+)/)
      if (match) {
        return Number.parseInt(match[1])
      }

      return null
    },
    indexMediaFromTopic: async (topicId: any, cutoffDate: Date) => {
      return indexMediaFromTopic(topicId, cutoffDate, config.indexerDeprecatedDate)
    },
  }
}

export { indexMediaFromTopic }
