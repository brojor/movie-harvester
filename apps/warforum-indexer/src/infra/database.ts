import type { MovieSource } from '@repo/types'
import type { MovieWithTopicId, TopicKey } from '../types/domain.js'
import { db, schema } from '@repo/database'
import { eq, isNull } from 'drizzle-orm'
import { TOPIC_META } from '../types/domain.js'

export async function upsertMovie(
  movie: MovieWithTopicId,
  topicType: TopicKey,
): Promise<void> {
  const isDub = TOPIC_META[topicType].isDub
  try {
    await db
      .insert(schema.moviesSource)
      .values({ ...movie, [topicType]: movie.topicNumber })
      .onConflictDoUpdate({
        target: isDub
          ? [schema.moviesSource.czechTitle, schema.moviesSource.year]
          : [schema.moviesSource.originalTitle, schema.moviesSource.year],
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
  const result = await db.select().from(schema.moviesSource).leftJoin(schema.csfdData, eq(schema.moviesSource.id, schema.csfdData.sourceId)).where(isNull(schema.csfdData.id))
  return result.map(m => m.movies_source)
}
