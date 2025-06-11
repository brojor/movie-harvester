import type { MovieSource } from 'packages/types/dist/index.js'
import type { CsfdMovieDetails } from '../types.js'
import { db, moviesSchema } from '@repo/database'
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

export async function seedCsfdGenres(): Promise<void> {
  await db.insert(moviesSchema.csfdGenres).values(genres).onConflictDoNothing()
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

export async function saveCsfdMovieDetails(movieDetails: CsfdMovieDetails, sourceId: number): Promise<void> {
  const csfdDataId = await db.insert(moviesSchema.csfdMovieData).values({
    sourceId,
    ...movieDetails,
  }).returning({ id: moviesSchema.csfdMovieData.id })

  const genreIds = await db
    .select({ id: moviesSchema.csfdGenres.id })
    .from(moviesSchema.csfdGenres)
    .where(inArray(moviesSchema.csfdGenres.name, movieDetails.genres))

  await db.insert(moviesSchema.csfdMoviesToGenres).values(
    genreIds.map(genre => ({
      csfdId: csfdDataId[0].id,
      genreId: genre.id,
    })),
  )
}
