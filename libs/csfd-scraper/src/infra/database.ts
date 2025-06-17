import type { CsfdTvShowData, MovieSource, TvShowSource } from 'packages/types/dist/index.js'
import type { CsfdMovieDetails, CsfdTvShowDetails } from '../types.js'
import { commonSchema, db, moviesSchema, tvShowsSchema } from '@repo/database'
import { and, desc, eq, gt, inArray, isNull } from 'drizzle-orm'
import genres from '../genres.json' with { type: 'json' }

export async function getLastCsfdMovieProcessedDate(): Promise<Date> {
  const lastRecord = await db
    .select()
    .from(moviesSchema.csfdMovieData)
    .orderBy(desc(moviesSchema.csfdMovieData.createdAt))
    .limit(1)

  return lastRecord?.[0]?.createdAt || new Date(0)
}

export async function getLastCsfdTvShowProcessedDate(): Promise<Date> {
  const lastRecord = await db
    .select()
    .from(tvShowsSchema.csfdTvShowData)
    .orderBy(desc(tvShowsSchema.csfdTvShowData.createdAt))
    .limit(1)

  return lastRecord?.[0]?.createdAt || new Date(0)
}

export async function seedCsfdGenres(): Promise<void> {
  await db.insert(commonSchema.csfdGenres).values(genres).onConflictDoNothing()
}

export async function getUnprocessedMovies(cutoffDate: Date): Promise<MovieSource[]> {
  const res = await db
    .select()
    .from(moviesSchema.movieSources)
    .leftJoin(
      moviesSchema.csfdMovieData,
      eq(moviesSchema.movieSources.id, moviesSchema.csfdMovieData.sourceId),
    )
    .where(
      and(
        isNull(moviesSchema.csfdMovieData.id),
        gt(moviesSchema.movieSources.createdAt, cutoffDate),
      ),
    )

  return res.map(m => m.movie_sources)
}

export async function getUnprocessedTvShows(cutoffDate: Date): Promise<TvShowSource[]> {
  const res = await db
    .select()
    .from(tvShowsSchema.tvShowSources)
    .leftJoin(
      tvShowsSchema.csfdTvShowData,
      eq(tvShowsSchema.tvShowSources.id, tvShowsSchema.csfdTvShowData.sourceId),
    )
    .where(
      and(
        isNull(tvShowsSchema.csfdTvShowData.id),
        gt(tvShowsSchema.tvShowSources.createdAt, cutoffDate),
      ),
    )

  return res.map(m => m.tv_show_sources)
}

export async function saveCsfdMovieDetails(movieDetails: CsfdMovieDetails, sourceId: number): Promise<void> {
  const csfdDataId = await db.insert(moviesSchema.csfdMovieData).values({
    sourceId,
    ...movieDetails,
  }).returning({ id: moviesSchema.csfdMovieData.id })

  const genreIds = await db
    .select({ id: commonSchema.csfdGenres.id })
    .from(commonSchema.csfdGenres)
    .where(inArray(commonSchema.csfdGenres.name, movieDetails.genres))

  await db.insert(moviesSchema.csfdMoviesToGenres).values(
    genreIds.map(genre => ({
      csfdId: csfdDataId[0].id,
      genreId: genre.id,
    })),
  )
}

export async function saveCsfdTvShowDetails(tvShowDetails: CsfdTvShowDetails, sourceId: number): Promise<void> {
  const csfdDataId = await db.insert(tvShowsSchema.csfdTvShowData).values({
    sourceId,
    ...tvShowDetails,
  }).returning({ id: tvShowsSchema.csfdTvShowData.id }).onConflictDoNothing()

  if (!csfdDataId.length) {
    return
  }

  const genreIds = await db
    .select({ id: commonSchema.csfdGenres.id })
    .from(commonSchema.csfdGenres)
    .where(inArray(commonSchema.csfdGenres.name, tvShowDetails.genres))

  await db.insert(tvShowsSchema.csfdTvShowsToGenres).values(
    genreIds.map(genre => ({
      csfdId: csfdDataId[0].id,
      genreId: genre.id,
    })),
  )
}

export async function getCsfdTvShowDetails(csfdSlug: string): Promise<CsfdTvShowData | null> {
  const res = await db
    .select()
    .from(tvShowsSchema.csfdTvShowData)
    .where(eq(tvShowsSchema.csfdTvShowData.csfdId, csfdSlug))
    .limit(1)

  return res[0] || null
}
