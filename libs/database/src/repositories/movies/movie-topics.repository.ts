import type { TopicType } from '@repo/shared'
import type { Database, Transaction } from '../../connection.js'
import type { MovieTopicsRepository } from './types.js'
import { eq } from 'drizzle-orm'
import { movieTopics } from '../../schemas/movies.js'

export class MovieTopicsRepo implements MovieTopicsRepository {
  constructor(private readonly db: Database | Transaction) {}

  async setMovieTopicSource(movieId: number, topicId: number, topicType: TopicType): Promise<void> {
    await this.db
      .insert(movieTopics)
      .values({
        movieId,
        topicId,
        topicType,
      })
      .onConflictDoUpdate({
        target: [movieTopics.movieId, movieTopics.topicType],
        set: {
          topicId,
          updatedAt: new Date(),
        },
      })
  }

  async getTopicId(movieId: number): Promise<number> {
    const topics = await this.db.select().from(movieTopics).where(eq(movieTopics.movieId, movieId))
    if (!topics.length)
      throw new Error(`Movie ${movieId} has no topics`)

    return topics[0].topicId
  }
}
