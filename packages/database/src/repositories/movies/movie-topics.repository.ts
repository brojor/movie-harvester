import type { TopicType } from '@repo/types'
import type { Database } from '../../connection.js'
import type { MovieTopicsRepository } from './types.js'
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
}
