import type { CsfdMovieData, MovieSource } from 'packages/types/dist/index.js'
import type { MovieDetailsResponse } from '../types.js'
import { commonSchema, db, moviesSchema } from '@repo/database'
import { and, desc, eq, gt, isNull } from 'drizzle-orm'
import genres from '../genres.json' with { type: 'json' }

async function getLastTmdbProcessedDate(): Promise<Date> {
  const lastRecord = await db
    .select()
    .from(moviesSchema.tmdbMovieData)
    .orderBy(desc(moviesSchema.tmdbMovieData.createdAt))
    .limit(1)

  return lastRecord?.[0]?.createdAt || new Date(0)
}

export async function getUnprocessedMovies(): Promise<MovieSource[]> {
  const lastRecordDate = await getLastTmdbProcessedDate()

  const res = await db
    .select()
    .from(moviesSchema.movieSources)
    .leftJoin(
      moviesSchema.tmdbMovieData,
      eq(moviesSchema.movieSources.id, moviesSchema.tmdbMovieData.sourceId),
    )
    .where(
      and(
        isNull(moviesSchema.tmdbMovieData.id),
        gt(moviesSchema.movieSources.createdAt, lastRecordDate),
      ),
    )

  return res.map(m => m.movie_sources)
}

export async function getCsfdMovieData(sourceId: number): Promise<CsfdMovieData | null> {
  const res = await db
    .select()
    .from(moviesSchema.csfdMovieData)
    .where(eq(moviesSchema.csfdMovieData.sourceId, sourceId))
    .limit(1)

  return res?.[0] ?? null
}

export async function saveTmdbMovieData(movieDetails: MovieDetailsResponse, sourceId: number): Promise<void> {
  await db.insert(moviesSchema.tmdbMovieData).values({
    id: movieDetails.id,
    sourceId,
    imdbId: movieDetails.imdb_id,
    title: movieDetails.title,
    originalTitle: movieDetails.original_title,
    originalLanguage: movieDetails.original_language,
    posterPath: movieDetails.poster_path,
    backdropPath: movieDetails.backdrop_path,
    releaseDate: movieDetails.release_date,
    runtime: movieDetails.runtime,
    voteAverage: movieDetails.vote_average,
    voteCount: movieDetails.vote_count,
    tagline: movieDetails.tagline,
    overview: movieDetails.overview,
  }).onConflictDoNothing()

  await db.insert(moviesSchema.tmdbMoviesToGenres).values(
    movieDetails.genres.map(genre => ({
      movieId: movieDetails.id,
      genreId: genre.id,
    })),
  ).onConflictDoNothing()
}

export async function seedTmdbGenres(): Promise<void> {
  await db.insert(commonSchema.tmdbGenres).values(genres).onConflictDoNothing()
}
