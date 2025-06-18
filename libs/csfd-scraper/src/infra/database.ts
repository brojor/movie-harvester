import type { CsfdTvShowData, MovieSource, TvShowSource } from '@repo/database'
import type { CsfdMovieDetails, CsfdTvShowDetails } from '../types.js'
import { commonSchema, db, getLastProcessedDate, getUnprocessedSources, moviesSchema, tvShowsSchema } from '@repo/database'
import { eq, inArray } from 'drizzle-orm'
import genres from '../genres.json' with { type: 'json' }

export async function getLastCsfdMovieProcessedDate(): Promise<Date> {
  return getLastProcessedDate(moviesSchema.csfdMovieData)
}

export async function getLastCsfdTvShowProcessedDate(): Promise<Date> {
  return getLastProcessedDate(tvShowsSchema.csfdTvShowData)
}

export async function seedCsfdGenres(): Promise<void> {
  await db.insert(commonSchema.csfdGenres).values(genres).onConflictDoNothing()
}

export async function getUnprocessedMovies(cutoffDate: Date): Promise<MovieSource[]> {
  const res = await getUnprocessedSources(moviesSchema.csfdMovieData, cutoffDate)

  return res.map(m => m.movie_sources)
}

export async function getUnprocessedTvShows(cutoffDate: Date): Promise<TvShowSource[]> {
  const res = await getUnprocessedSources(tvShowsSchema.csfdTvShowData, cutoffDate)

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
