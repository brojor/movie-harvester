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
      .insert(moviesSchema.movieSources)
      .values({ ...movie, [topicType]: movie.topicNumber })
      .onConflictDoUpdate({
        target: isDub
          ? [moviesSchema.movieSources.czechTitle, moviesSchema.movieSources.year]
          : [moviesSchema.movieSources.originalTitle, moviesSchema.movieSources.year],
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
  const result = await db.select().from(moviesSchema.movieSources).leftJoin(moviesSchema.csfdMovieData, eq(moviesSchema.movieSources.id, moviesSchema.csfdMovieData.sourceId)).where(isNull(moviesSchema.csfdMovieData.id))
  return result.map(m => m.movie_sources)
}
