import type { MovieSource } from '@repo/types'
import type { MovieDetailsResponse, SearchResult } from './types.js'
import { db, schema } from '@repo/database'
import { env, getThrottledClient } from '@repo/shared'
import { eq, isNull } from 'drizzle-orm'
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

export async function getMoviesMissingCsfdId(): Promise<MovieSource[]> {
  return db.select().from(schema.moviesSource).where(isNull(schema.moviesSource.tmdbId))
}

async function main(): Promise<void> {
  await seedTmdbGenres()
  const movies = await getMoviesMissingCsfdId()
  for (const movie of movies) {
    const searchResults = await searchMovies(movie.originalTitle, movie.year)
    if (searchResults.length === 0) {
      console.error(`No search results for ${movie.originalTitle} in ${movie.year}`)
      continue
    }
    const movieDetails = await getMovieDetails(searchResults[0].id)
    await db.insert(schema.tmdbData).values({
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

    await db.insert(schema.tmdbToGenres).values(movieDetails.genres.map(genre => ({
      movieId: movieDetails.id,
      genreId: genre.id,
    }))).onConflictDoNothing()

    await db.update(schema.moviesSource).set({
      tmdbId: movieDetails.id,
    }).where(eq(schema.moviesSource.id, movie.id))
  }
}

async function searchMovies(originalTitle: string, year: number): Promise<SearchResult[]> {
  const url = '/search/movie'
  const query = new URLSearchParams({
    query: normalizeTitle(originalTitle),
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
  await db.insert(schema.tmdbGenres).values(genres).onConflictDoNothing()
}

function normalizeTitle(input: string): string {
  if (input.endsWith(', The')) {
    return `The ${input.slice(0, -5)}`
  }
  return input
}

main()
