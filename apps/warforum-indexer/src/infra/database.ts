import type { MovieSource } from '@repo/types'
import type { MovieMetaWithSource, TopicType, TvShowMetaWithSource } from '../types/domain.js'
import { db, moviesSchema, tvShowsSchema } from '@repo/database'
import { and, eq, isNull } from 'drizzle-orm'

export async function upsertMovie(
  movie: MovieMetaWithSource,
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

export async function upsertTvShow(tvShow: TvShowMetaWithSource, topicType: TopicType): Promise<void> {
  const { czechTitle, originalTitle, languages } = tvShow.coreMeta
  const show = await db.query.tvShowSources.findFirst({
    where: eq(tvShowsSchema.tvShowSources.originalTitle, originalTitle),
  })

  let showId: number
  if (!show) {
    const inserted = await db.insert(tvShowsSchema.tvShowSources)
      .values({
        originalTitle,
        czechTitle: czechTitle ?? null,
      })
      .returning()

    showId = inserted[0].id
  }
  else {
    showId = show.id
  }

  const normalizedLangs = JSON.stringify([...languages].sort())

  const existingTopic = await db.query.tvShowTopics.findFirst({
    where: and(
      eq(tvShowsSchema.tvShowTopics.tvShowId, showId),
      eq(tvShowsSchema.tvShowTopics.topicType, topicType),
      eq(tvShowsSchema.tvShowTopics.languages, normalizedLangs),
    ),
  })

  if (!existingTopic) {
    await db.insert(tvShowsSchema.tvShowTopics).values({
      tvShowId: showId,
      topicId: tvShow.sourceTopic,
      topicType,
      languages: normalizedLangs,
    })
  }
}

export async function getMoviesMissingCsfdId(): Promise<MovieSource[]> {
  const result = await db.select().from(moviesSchema.movieSources).leftJoin(moviesSchema.csfdMovieData, eq(moviesSchema.movieSources.id, moviesSchema.csfdMovieData.sourceId)).where(isNull(moviesSchema.csfdMovieData.id))
  return result.map(m => m.movie_sources)
}
