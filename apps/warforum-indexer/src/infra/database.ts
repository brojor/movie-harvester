import type { MovieSource } from '@repo/types'
import type { MovieWithTopicId, TopicKey } from '../types/domain.js'
import { db, moviesSchema } from '@repo/database'
import { eq, isNull } from 'drizzle-orm'
import { TOPIC_META } from '../types/domain.js'

export async function upsertMovie(
  movie: MovieWithTopicId,
  topicType: TopicKey,
): Promise<void> {
  const isDub = TOPIC_META[topicType].isDub
  try {
    await db
      .insert(moviesSchema.moviesSource)
      .values({ ...movie, [topicType]: movie.topicNumber })
      .onConflictDoUpdate({
        target: isDub
          ? [moviesSchema.moviesSource.czechTitle, moviesSchema.moviesSource.year]
          : [moviesSchema.moviesSource.originalTitle, moviesSchema.moviesSource.year],
        set: {
          [topicType]: movie.topicNumber,
          updatedAt: new Date(),
        },
      })
  }
  catch (err) {
    console.error(
      `Error upserting movie \"${movie.czechTitle}\" / \"${movie.originalTitle}\" (${movie.year})`,
      err,
    )
  }
}

export async function getMoviesMissingCsfdId(): Promise<MovieSource[]> {
  const result = await db.select().from(moviesSchema.moviesSource).leftJoin(moviesSchema.csfdData, eq(moviesSchema.moviesSource.id, moviesSchema.csfdData.sourceId)).where(isNull(moviesSchema.csfdData.id))
  return result.map(m => m.movies_source)
}
