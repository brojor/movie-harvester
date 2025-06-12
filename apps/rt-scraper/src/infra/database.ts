import type { MovieSource } from 'packages/types/dist/index.js'
import type { RtMovieDetails } from '../types.js'
import { db, moviesSchema } from '@repo/database'
import { and, desc, eq, gt, isNull } from 'drizzle-orm'

export async function getLastRtMovieProcessedDate(): Promise<Date> {
  const lastRecord = await db
    .select()
    .from(moviesSchema.rtMovieData)
    .orderBy(desc(moviesSchema.rtMovieData.createdAt))
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

export async function saveRtMovieDetails(movieDetails: RtMovieDetails, sourceId: number): Promise<void> {
  await db.insert(moviesSchema.rtMovieData).values({
    sourceId,
    ...movieDetails,
  }).onConflictDoNothing()
}
