import type { MovieSource, TvShowSource } from '@repo/database'
import type { RtDetails } from '../types.js'
import { db, getLastProcessedDate, getUnprocessedSources, moviesSchema, tvShowsSchema } from '@repo/database'

export async function getLastRtMovieProcessedDate(): Promise<Date> {
  return getLastProcessedDate(moviesSchema.rtMovieData)
}

export async function getLastRtTvShowProcessedDate(): Promise<Date> {
  return getLastProcessedDate(tvShowsSchema.rtTvShowData)
}

export async function getUnprocessedMovies(cutoffDate: Date): Promise<MovieSource[]> {
  const res = await getUnprocessedSources(moviesSchema.rtMovieData, cutoffDate)

  return res.map(m => m.movie_sources)
}

export async function getUnprocessedTvShows(cutoffDate: Date): Promise<TvShowSource[]> {
  const res = await getUnprocessedSources(tvShowsSchema.rtTvShowData, cutoffDate)

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
