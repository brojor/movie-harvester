import type { MovieSource } from '@repo/types'
import type { MovieDetailsResponse, MovieSearchResult, SearchCandidate } from './types.js'
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

function isValidSearchCandidate(candidate: { title: string | null, year: number }): candidate is SearchCandidate {
  return !!candidate.title
}

export async function populateTmdbMoviesData(): Promise<void> {
  await seedTmdbGenres()
  const movies = await getUnprocessedMovies()

  for (const movie of movies) {
    const movieId = await findTmdbMovieId(movie)
    if (movieId) {
      const movieDetails = await getMovieDetails(movieId)
      await saveTmdbMovieData(movieDetails, movie.id)
    }
  }
}

async function findTmdbMovieId(movie: MovieSource): Promise<number | null> {
  const basicCandidates: SearchCandidate[] = [
    { title: movie.originalTitle, year: movie.year },
    { title: movie.czechTitle, year: movie.year },
  ].filter(isValidSearchCandidate)

  for (const candidate of basicCandidates) {
    const movieId = await searchAndMatchMovie(candidate)
    if (movieId)
      return movieId
  }

  const csfdData = await getCsfdMovieData(movie.id)
  if (!csfdData)
    return null

  const csfdCandidates: SearchCandidate[] = [
    { title: csfdData.originalTitle, year: movie.year },
    { title: csfdData.title, year: movie.year },
  ].filter(isValidSearchCandidate)

  for (const candidate of csfdCandidates) {
    const movieId = await searchAndMatchMovie(candidate)
    if (movieId)
      return movieId
  }

  return null
}

async function searchAndMatchMovie({ title, year }: SearchCandidate): Promise<number | null> {
  const searchResults = await searchMovies(title, year)
  return findBestMatch(searchResults, title, year)
}

async function searchMovies(title: string, year: number): Promise<MovieSearchResult[]> {
  const normalizedTitle = normalizeTitle(title)
  const query = new URLSearchParams({
    query: normalizedTitle,
    year: year.toString(),
    language: 'cs',
  })

  const response = await httpClient.get(`/search/movie?${query}`)
  return response.results
}

function findBestMatch(searchResults: MovieSearchResult[], title: string, year: number): number | null {
  const normalizedTitle = normalizeTitle(title).toLowerCase()
  const acceptableYears = [year - 1, year, year + 1]

  const match = searchResults.find((result) => {
    const resultTitles = [result.original_title, result.title].map(t => t.toLowerCase())
    const titleMatch = resultTitles.includes(normalizedTitle)
    const yearMatch = acceptableYears.includes(Number(result.release_date.split('-')[0]))

    return titleMatch && yearMatch
  })

  return match?.id ?? null
}

async function getMovieDetails(id: number): Promise<MovieDetailsResponse> {
  const query = new URLSearchParams({ language: 'cs' })
  return httpClient.get(`/movie/${id}?${query}`)
}

function normalizeTitle(input: string): string {
  if (input.endsWith(', The')) {
    return `The ${input.slice(0, -5)}`
  }
  return input
}
