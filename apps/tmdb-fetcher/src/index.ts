import type { MovieSource } from '@repo/types'
import type { MovieDetailsResponse, MovieSearchResult } from './types.js'
import { env, getThrottledClient } from '@repo/shared'
import { getCsfdMovieData, getUnprocessedMovies, saveTmdbMovieData, seedTmdbGenres } from './infra/database.js'

// Rate limit is 50 requests per second range
const httpClient = getThrottledClient(env.TMDB_BASE_URL, {
  maxSockets: 20,
  throttleConcurrency: 40,
  delayMs: 100,
  headers: {
    Authorization: `Bearer ${env.TMDB_API_KEY}`,
  },
})

export async function populateTmdbMoviesData(): Promise<void> {
  await seedTmdbGenres()
  const movies = await getUnprocessedMovies()
  await processMovies(movies)
}

async function processMovies(movies: MovieSource[]): Promise<void> {
  for (const movie of movies) {
    await processMovie(movie)
  }
}

async function processMovie(movie: MovieSource): Promise<void> {
  const movieId = await findMovieIdForMovie(movie)
  if (!movieId) {
    return
  }

  const movieDetails = await getMovieDetails(movieId)
  await saveTmdbMovieData(movieDetails, movie.id)
}

async function searchMovies(title: string, year: number): Promise<MovieSearchResult[]> {
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

function normalizeTitle(input: string): string {
  if (input.endsWith(', The')) {
    return `The ${input.slice(0, -5)}`
  }
  return input
}

function getMovieId(searchResults: MovieSearchResult[], title: string, year: number): number | null {
  const normalizedTitle = normalizeTitle(title).toLowerCase()
  const acceptableYears = [year - 1, year, year + 1]

  return searchResults.find((result) => {
    const resultTitles = [result.original_title, result.title].map(t => t.toLowerCase())
    const titleMatch = resultTitles.includes(normalizedTitle)
    const yearMatch = acceptableYears.includes(Number(result.release_date.split('-')[0]))

    return titleMatch && yearMatch
  })?.id ?? null
}

async function findMovieIdForMovie(movie: MovieSource): Promise<number | null> {
  const titlesToSearch = [
    { title: movie.originalTitle, year: movie.year },
    { title: movie.czechTitle, year: movie.year },
  ]

  for (const { title, year } of titlesToSearch) {
    const id = await trySearchByTitle(title, year)
    if (id) {
      return id
    }
  }

  const csfdRow = await getCsfdMovieData(movie.id)
  if (!csfdRow) {
    return null
  }

  const csfdTitlesToSearch = [
    { title: csfdRow.originalTitle, year: movie.year },
    { title: csfdRow.title, year: movie.year },
  ]

  for (const { title, year } of csfdTitlesToSearch) {
    const id = await trySearchByTitle(title, year)
    if (id) {
      return id
    }
  }

  return null
}

async function trySearchByTitle(title: string | null, year: number): Promise<number | null> {
  if (!title) {
    return null
  }

  const searchResults = await searchMovies(title, year)
  const foundId = getMovieId(searchResults, title, year)
  return foundId
}
