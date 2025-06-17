import type { MovieSource, TvShowSource } from 'packages/types/dist/index.js'
import type { RtDetails } from '../types.js'
import { db, moviesSchema, tvShowsSchema } from '@repo/database'
import { and, desc, eq, gt, isNull } from 'drizzle-orm'

export async function getLastRtMovieProcessedDate(): Promise<Date> {
  const lastRecord = await db
    .select()
    .from(moviesSchema.rtMovieData)
    .orderBy(desc(moviesSchema.rtMovieData.createdAt))
    .limit(1)

  return lastRecord?.[0]?.createdAt || new Date(0)
}

export async function getLastRtTvShowProcessedDate(): Promise<Date> {
  const lastRecord = await db
    .select()
    .from(tvShowsSchema.rtTvShowData)
    .orderBy(desc(tvShowsSchema.rtTvShowData.createdAt))
    .limit(1)

  return lastRecord?.[0]?.createdAt || new Date(0)
}

export async function getUnprocessedMovies(cutoffDate: Date): Promise<MovieSource[]> {
  const res = await db
    .select()
    .from(moviesSchema.movieSources)
    .leftJoin(
      moviesSchema.rtMovieData,
      eq(moviesSchema.movieSources.id, moviesSchema.rtMovieData.sourceId),
    )
    .where(
      and(
        isNull(moviesSchema.rtMovieData.id),
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
      tvShowsSchema.rtTvShowData,
      eq(tvShowsSchema.tvShowSources.id, tvShowsSchema.rtTvShowData.sourceId),
    )
    .where(
      and(
        isNull(tvShowsSchema.rtTvShowData.id),
        gt(tvShowsSchema.tvShowSources.createdAt, cutoffDate),
      ),
    )

  return res.map(m => m.tv_show_sources)
}

export async function saveRtMovieDetails(movieDetails: RtDetails, sourceId: number): Promise<void> {
  await db.insert(moviesSchema.rtMovieData).values({
    sourceId,
    ...movieDetails,
  }).onConflictDoNothing()
}

export async function saveRtTvShowDetails(tvShowDetails: RtDetails, sourceId: number): Promise<void> {
  await db.insert(tvShowsSchema.rtTvShowData).values({
    sourceId,
    ...tvShowDetails,
  }).onConflictDoNothing()
}
