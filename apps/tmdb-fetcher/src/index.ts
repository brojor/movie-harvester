import type { MovieSource } from '@repo/types'
import type { MovieDetailsResponse, SearchResult } from './types.js'
import { db, moviesSchema } from '@repo/database'
import { env, getThrottledClient } from '@repo/shared'

import { and, desc, eq, gt, isNull } from 'drizzle-orm'
import genres from './genres.json' with { type: 'json' }

// Rate limit is 50 requests per second range
const httpClient = getThrottledClient(env.TMDB_BASE_URL, {
  maxSockets: 20,
  throttleConcurrency: 40,
  delayMs: 100,
  headers: {
    Authorization: `Bearer ${env.TMDB_API_KEY}`,
  },
})

export async function populateTmdbData(): Promise<void> {
  await seedTmdbGenres()
  const latestTmdbData = await db.select().from(moviesSchema.tmdbData).orderBy(desc(moviesSchema.tmdbData.createdAt)).limit(1)
  const res = await db.select().from(moviesSchema.moviesSource).leftJoin(moviesSchema.tmdbData, eq(moviesSchema.moviesSource.id, moviesSchema.tmdbData.sourceId)).where(and(isNull(moviesSchema.tmdbData.id), gt(moviesSchema.moviesSource.createdAt, latestTmdbData[0].createdAt)))
  const movies = res.map(m => m.movies_source)
  for (const movie of movies) {
    const movieId = await findMovieIdForMovie(movie)
    if (!movieId) {
      continue
    }

    const movieDetails = await getMovieDetails(movieId)
    await db.insert(moviesSchema.tmdbData).values({
      id: movieDetails.id,
      sourceId: movie.id,
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

    await db.insert(moviesSchema.tmdbToGenres).values(movieDetails.genres.map(genre => ({
      movieId: movieDetails.id,
      genreId: genre.id,
    }))).onConflictDoNothing()
  }
}

async function searchMovies(title: string, year: number): Promise<SearchResult[]> {
  const url = '/search/movie'
  const query = new URLSearchParams({
    query: normalizeTitle(title),
    year: year.toString(),
    language: 'cs',
  })

  const response = await httpClient.get(`${url}?${query}`)
  return response.results
}

async function getMovieDetails(id: number): Promise<MovieDetailsResponse> {
  const url = `/movie/${id}`
  const query = new URLSearchParams({
    language: 'cs',
  })
  return httpClient.get(`${url}?${query}`)
}

async function seedTmdbGenres(): Promise<void> {
  await db.insert(moviesSchema.tmdbGenres).values(genres).onConflictDoNothing()
}

function normalizeTitle(input: string): string {
  if (input.endsWith(', The')) {
    return `The ${input.slice(0, -5)}`
  }
  return input
}

function getMovieId(searchResults: SearchResult[], title: string, year: number): number | null {
  const normalizedTitle = normalizeTitle(title)
  const acceptableYears = [year, year - 1, year + 1]

  return searchResults.find((result) => {
    const titleMatch = result.original_title.toLowerCase() === normalizedTitle.toLowerCase() || result.title.toLowerCase() === normalizedTitle.toLowerCase()
    const yearMatch = acceptableYears.includes(Number(result.release_date.split('-')[0]))

    return titleMatch && yearMatch
  })?.id ?? null
}

async function findMovieIdForMovie(movie: MovieSource): Promise<number | null> {
  const idFromOriginal = await trySearchByTitle(movie.originalTitle, movie.year)
  if (idFromOriginal) {
    return idFromOriginal
  }

  const idFromCzech = await trySearchByTitle(movie.czechTitle, movie.year)
  if (idFromCzech) {
    return idFromCzech
  }

  const csfdRow = (
    await db
      .select()
      .from(moviesSchema.csfdData)
      .where(eq(moviesSchema.csfdData.sourceId, movie.id))
      .limit(1)
  )[0]

  if (!csfdRow) {
    return null
  }

  if (csfdRow.originalTitle) {
    const idFromCsfdOriginal = await trySearchByTitle(csfdRow.originalTitle, movie.year)
    if (idFromCsfdOriginal) {
      return idFromCsfdOriginal
    }
  }

  if (csfdRow.title) {
    const idFromCsfdTitle = await trySearchByTitle(csfdRow.title, movie.year)
    if (idFromCsfdTitle) {
      return idFromCsfdTitle
    }
  }

  return null
}

async function trySearchByTitle(title: string, year: number): Promise<number | null> {
  const searchResults = await searchMovies(title, year)
  const foundId = getMovieId(searchResults, title, year)
  return foundId
}
