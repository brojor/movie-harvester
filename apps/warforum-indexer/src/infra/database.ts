import type { MovieSource } from '@repo/types'
import type { CoreMetaWithSourceTopic, TopicType } from '../types/domain.js'
import { db, moviesSchema } from '@repo/database'
import { eq, isNull } from 'drizzle-orm'

export async function upsertMovie(
  movie: CoreMetaWithSourceTopic,
  topicType: TopicType,
): Promise<void> {
  const isDub = ['hdDub', 'uhdDub'].includes(topicType)
  const { czechTitle, originalTitle, year } = movie.coreMeta
  try {
    await db
      .insert(moviesSchema.movieSources)
      .values({ czechTitle, originalTitle, year, [topicType]: movie.sourceTopic })
      .onConflictDoUpdate({
        target: isDub
          ? [moviesSchema.movieSources.czechTitle, moviesSchema.movieSources.year]
          : [moviesSchema.movieSources.originalTitle, moviesSchema.movieSources.year],
        set: {
          [topicType]: movie.sourceTopic,
          updatedAt: new Date(),
        },
      })
  }
  catch (err) {
    console.error(
      `Error upserting movie "${czechTitle}" / "${originalTitle}" (${year})`,
      err,
    )
  }
}

export async function getMoviesMissingCsfdId(): Promise<MovieSource[]> {
  const result = await db.select().from(moviesSchema.movieSources).leftJoin(moviesSchema.csfdMovieData, eq(moviesSchema.movieSources.id, moviesSchema.csfdMovieData.sourceId)).where(isNull(moviesSchema.csfdMovieData.id))
  return result.map(m => m.movie_sources)
}
