import type { MovieSource, TvShowSource } from '@repo/types'
import type { MovieDetailsResponse, MovieSearchResponse, MovieSearchResult, SearchMovieCandidate, SearchTvShowCandidate, TvShowDetailsResponse, TvShowSearchResponse, TvShowSearchResult } from './types.js'
import { env, getThrottledClient, normalizeTitle } from '@repo/shared'
import { getCsfdMovieData, getLastTmdbMovieProcessedDate, getLastTmdbTvShowProcessedDate, getUnprocessedMovies, getUnprocessedTvShows, saveTmdbMovieData, saveTmdbTvShowData, seedTmdbMovieGenres, seedTmdbTvShowGenres } from './infra/database.js'

// Rate limit is 50 requests per second range
const httpClient = getThrottledClient(env.TMDB_BASE_URL, {
  maxSockets: 20,
  throttleConcurrency: 40,
  delayMs: 100,
  headers: {
    Authorization: `Bearer ${env.TMDB_API_KEY}`,
  },
})

function isValidMovieSearchCandidate(candidate: { title: string | null, year: number }): candidate is SearchMovieCandidate {
  return !!candidate.title
}

function isValidTvShowSearchCandidate(candidate: { title: string | null }): candidate is SearchTvShowCandidate {
  return !!candidate.title
}

export async function populateTmdbMoviesData({ force = false }: { force?: boolean } = {}): Promise<void> {
  const lastRun = force ? new Date(0) : await getLastTmdbMovieProcessedDate()
  await seedTmdbMovieGenres()
  const movies = await getUnprocessedMovies(lastRun)

  for (const movie of movies) {
    const movieId = await findTmdbMovieId(movie)
    if (movieId) {
      const movieDetails = await getMovieDetails(movieId)
      await saveTmdbMovieData(movieDetails, movie.id)
    }
  }
}

export async function populateTmdbTvShowsData({ force = false }: { force?: boolean } = {}): Promise<void> {
  const lastRun = force ? new Date(0) : await getLastTmdbTvShowProcessedDate()
  await seedTmdbTvShowGenres()
  const tvShows = await getUnprocessedTvShows(lastRun)

  for (const tvShow of tvShows) {
    const tvShowId = await findTmdbTvShowId(tvShow)
    if (tvShowId) {
      const tvShowDetails = await getTvShowDetails(tvShowId)
      await saveTmdbTvShowData(tvShowDetails, tvShow.id)
    }
  }
}

async function findTmdbMovieId(movie: MovieSource): Promise<number | null> {
  const basicCandidates: SearchMovieCandidate[] = [
    { title: normalizeTitle(movie.originalTitle), year: movie.year },
    { title: movie.czechTitle, year: movie.year },
  ].filter(isValidMovieSearchCandidate)

  for (const candidate of basicCandidates) {
    const movieId = await searchAndMatchMovie(candidate)
    if (movieId)
      return movieId
  }

  const csfdData = await getCsfdMovieData(movie.id)
  if (!csfdData)
    return null

  const csfdCandidates: SearchMovieCandidate[] = [
    { title: csfdData.originalTitle, year: movie.year },
    { title: csfdData.title, year: movie.year },
  ].filter(isValidMovieSearchCandidate)

  for (const candidate of csfdCandidates) {
    const movieId = await searchAndMatchMovie(candidate)
    if (movieId)
      return movieId
  }

  return null
}

async function findTmdbTvShowId(tvShow: TvShowSource): Promise<number | null> {
  const basicCandidates: SearchTvShowCandidate[] = [
    { title: tvShow.originalTitle },
    { title: tvShow.czechTitle },
  ].filter(isValidTvShowSearchCandidate)

  for (const candidate of basicCandidates) {
    const tvShowId = await searchAndMatchTvShow(candidate)
    if (tvShowId)
      return tvShowId
  }

  return null
}

async function searchAndMatchMovie({ title, year }: SearchMovieCandidate): Promise<number | null> {
  const searchResults = await searchMovies(title, year)
  return findBestMovieMatch(searchResults, title, year)
}

async function searchAndMatchTvShow({ title }: SearchTvShowCandidate): Promise<number | null> {
  const searchResults = await searchTvShows(title)
  return findBestTvShowMatch(searchResults, title)
}

async function searchMovies(title: string, year: number): Promise<MovieSearchResult[]> {
  const query = new URLSearchParams({
    query: title,
    year: year.toString(),
    language: 'cs',
  })

  const response = await httpClient.get(`/search/movie?${query}`) as MovieSearchResponse
  return response.results
}

async function searchTvShows(title: string): Promise<TvShowSearchResult[]> {
  const query = new URLSearchParams({
    query: title,
    language: 'cs',
  })

  const response = await httpClient.get(`/search/tv?${query}`) as TvShowSearchResponse
  return response.results
}

function findBestMovieMatch(searchResults: MovieSearchResult[], title: string, year: number): number | null {
  const normalizedTitle = title.toLowerCase()
  const acceptableYears = [year - 1, year, year + 1]

  const match = searchResults.find((result) => {
    const resultTitles = [result.original_title, result.title].map(t => t.toLowerCase())
    const titleMatch = resultTitles.includes(normalizedTitle)
    const yearMatch = acceptableYears.includes(Number(result.release_date.split('-')[0]))

    return titleMatch && yearMatch
  })

  return match?.id ?? null
}

function findBestTvShowMatch(searchResults: TvShowSearchResult[], title: string): number | null {
  const normalizedTitle = title.toLowerCase()
  const match = searchResults.find((result) => {
    const resultTitles = [result.original_name, result.name].map(t => t.toLowerCase())
    return resultTitles.includes(normalizedTitle)
  })

  return match?.id ?? null
}

async function getMovieDetails(id: number): Promise<MovieDetailsResponse> {
  const query = new URLSearchParams({ language: 'cs' })
  return httpClient.get(`/movie/${id}?${query}`)
}

async function getTvShowDetails(id: number): Promise<TvShowDetailsResponse> {
  const query = new URLSearchParams({ language: 'cs' })
  return httpClient.get(`/tv/${id}?${query}`)
}
