import type { TopicType } from '@repo/types'
import type { Database } from '../../connection.js'
import type { MovieTopicsRepository } from './types.js'
import { eq } from 'drizzle-orm'
import { movieTopics } from '../../schemas/movies.js'

export class MovieTopicsRepo implements MovieTopicsRepository {
  constructor(private readonly db: Database) {}

  async setMovieTopicSource(movieId: number, topicId: number, sourceType: TopicType): Promise<void> {
    await this.db
      .insert(movieTopics)
      .values({
        movieId,
        topicId,
        sourceType,
      })
      .onConflictDoUpdate({
        target: [movieTopics.movieId, movieTopics.sourceType],
        set: {
          topicId,
          updatedAt: new Date(),
        },
      })
  }

  async getTopicsIds(movieId: number): Promise<number[]> {
    const topics = await this.db.select().from(movieTopics).where(eq(movieTopics.movieId, movieId))
    return topics.map(topic => topic.topicId)
  }
}
