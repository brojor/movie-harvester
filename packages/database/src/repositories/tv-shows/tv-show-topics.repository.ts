import type { TopicType } from '@repo/types'
import type { Database } from '../../connection.js'
import type { TvShowTopicsRepository } from './types.js'
import { tvShowTopics } from '../../schemas/tv-shows.js'

export class TvShowTopicsRepo implements TvShowTopicsRepository {
  constructor(private readonly db: Database) {}

  async setTvShowTopicSource(tvShowId: number, languages: string[], topicId: number, sourceType: TopicType): Promise<void> {
    await this.db
      .insert(tvShowTopics)
      .values({
        tvShowId,
        topicId,
        sourceType,
        languages: JSON.stringify(languages.sort()),
      })
      .onConflictDoUpdate({
        target: [tvShowTopics.tvShowId, tvShowTopics.sourceType, tvShowTopics.languages],
        set: {
          topicId,
          updatedAt: new Date(),
        },
      })
  }
}
