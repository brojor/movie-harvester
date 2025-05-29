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
  return db.select().from(schema.moviesSource).where(isNull(schema.moviesSource.csfdId))
}

export async function updateCsfdId(movie: MovieSource, csfdId: string): Promise<void> {
  await db.update(schema.moviesSource).set({ csfdId }).where(eq(schema.moviesSource.id, movie.id))
}
