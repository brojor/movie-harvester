import type { TopicType } from '@repo/shared'
import type { Database, Transaction } from '../../connection.js'
import type { TvShowTopicsRepository } from './types.js'
import { eq } from 'drizzle-orm'
import { tvShowTopics } from '../../schemas/tv-shows.js'

export class TvShowTopicsRepo implements TvShowTopicsRepository {
  constructor(private readonly db: Database | Transaction) {}

  async setTvShowTopicSource(tvShowId: number, languages: string[], topicId: number, topicType: TopicType): Promise<void> {
    await this.db
      .insert(tvShowTopics)
      .values({ tvShowId, languages, topicId, topicType })
      .onConflictDoUpdate({
        target: [tvShowTopics.tvShowId, tvShowTopics.topicType, tvShowTopics.languages],
        set: {
          topicId,
          updatedAt: new Date(),
        },
      })
  }

  async getTopicId(tvShowId: number): Promise<number> {
    const topics = await this.db.select().from(tvShowTopics).where(eq(tvShowTopics.tvShowId, tvShowId))
    if (!topics.length)
      throw new Error(`TV show ${tvShowId} has no topics`)

    return topics[0].topicId
  }
}
