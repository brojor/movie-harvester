import type {
  CsfdMovieTable,
  CsfdTvShowTable,
  MediaTable,
  RtMovieTable,
  RtTvShowTable,
  SourceTable,
  TmdbMovieTable,
  TmdbTvShowTable,
  UnprocessedCsfdMovies,
  UnprocessedCsfdTvShows,
  UnprocessedRtMovies,
  UnprocessedRtTvShows,
  UnprocessedSources,
  UnprocessedTmdbMovies,
  UnprocessedTmdbTvShows,
} from '@repo/types'
import { and, desc, eq, gt, isNull } from 'drizzle-orm'
import { db, moviesSchema } from './index.js'

/**
 * Get the last processed date from a given table
 * @param table - Drizzle table with a createdAt column
 * @returns The last processed date or new Date(0) if no records exist
 */
export async function getLastProcessedDate(table: MediaTable | SourceTable): Promise<Date> {
  const lastRecord = await db.select().from(table).orderBy(desc(table.createdAt)).limit(1)

  return lastRecord?.[0]?.createdAt || new Date(0)
}

export async function getUnprocessedSources(table: TmdbMovieTable, cutoffDate: Date): Promise<UnprocessedTmdbMovies>
export async function getUnprocessedSources(table: CsfdMovieTable, cutoffDate: Date): Promise<UnprocessedCsfdMovies>
export async function getUnprocessedSources(table: RtMovieTable, cutoffDate: Date): Promise<UnprocessedRtMovies>
export async function getUnprocessedSources(table: TmdbTvShowTable, cutoffDate: Date): Promise<UnprocessedTmdbTvShows>
export async function getUnprocessedSources(table: CsfdTvShowTable, cutoffDate: Date): Promise<UnprocessedCsfdTvShows>
export async function getUnprocessedSources(table: RtTvShowTable, cutoffDate: Date): Promise<UnprocessedRtTvShows>
export async function getUnprocessedSources(table: MediaTable, cutoffDate: Date): Promise<UnprocessedSources> {
  return db
    .select()
    .from(moviesSchema.movieSources)
    .leftJoin(table, eq(moviesSchema.movieSources.id, table.sourceId))
    .where(and(isNull(table.id), gt(moviesSchema.movieSources.createdAt, cutoffDate)))
}
