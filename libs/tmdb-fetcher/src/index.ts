import type { MovieRecord, TvShowRecord } from '@repo/database'
import type { MovieDetailsResponse, MovieSearchResponse, MovieSearchResult, SearchMovieCandidate, SearchTvShowCandidate, TmdbMovieDetails, TmdbTvShowDetails, TvShowDetailsResponse, TvShowSearchResponse, TvShowSearchResult } from './types.js'
import { env, makeHttpClient, normalizeTitle } from '@repo/shared'

// Rate limit is ~50 requests per second
const httpClient = makeHttpClient(env.TMDB_BASE_URL, {
  delayBetween: 1000 / 40, // 40 requests per second
  bearerToken: env.TMDB_API_KEY,
})

function isValidMovieSearchCandidate(candidate: { title: string | null, year: number }): candidate is SearchMovieCandidate {
  return candidate.title != null && candidate.year > 0
}

function isValidTvShowSearchCandidate(candidate: { title: string | null }): candidate is SearchTvShowCandidate {
  return !!candidate.title
}

export async function findTmdbMovieId(movie: MovieRecord): Promise<number> {
  const basicCandidates: SearchMovieCandidate[] = [
    { title: normalizeTitle(movie.originalTitle), year: movie.year },
    { title: movie.czechTitle, year: movie.year },
  ].filter(isValidMovieSearchCandidate)

  for (const candidate of basicCandidates) {
    const movieId = await searchAndMatchMovie(candidate)
    if (movieId)
      return movieId
  }

  throw new Error(`TMDB ID for movie ${movie.id} not found`)
}

export async function findTmdbTvShowId(tvShow: TvShowRecord): Promise<number> {
  const basicCandidates: SearchTvShowCandidate[] = [
    { title: tvShow.originalTitle },
    { title: tvShow.czechTitle },
  ].filter(isValidTvShowSearchCandidate)

  for (const candidate of basicCandidates) {
    const tvShowId = await searchAndMatchTvShow(candidate)
    if (tvShowId)
      return tvShowId
  }

  throw new Error(`TMDB ID for tv show ${tvShow.id} not found`)
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

export async function getMovieDetails(id: number): Promise<TmdbMovieDetails> {
  const query = new URLSearchParams({ language: 'cs' })

  const movieDetails = await httpClient.get(`/movie/${id}?${query}`) as MovieDetailsResponse

  return {
    id,
    imdbId: movieDetails.imdb_id,
    title: movieDetails.title,
    originalTitle: movieDetails.original_title,
    originalLanguage: movieDetails.original_language,
    originCountry: movieDetails.origin_country,
    posterPath: movieDetails.poster_path,
    backdropPath: movieDetails.backdrop_path,
    releaseDate: movieDetails.release_date,
    runtime: movieDetails.runtime,
    voteAverage: movieDetails.vote_average,
    voteCount: movieDetails.vote_count,
    tagline: movieDetails.tagline,
    overview: movieDetails.overview,
    genres: movieDetails.genres,
  }
}

export async function getTvShowDetails(id: number): Promise<TmdbTvShowDetails> {
  const query = new URLSearchParams({ language: 'cs' })
  const tvShowDetails = await httpClient.get(`/tv/${id}?${query}`) as TvShowDetailsResponse
  return {
    id,
    name: tvShowDetails.name,
    originalName: tvShowDetails.original_name,
    originalLanguage: tvShowDetails.original_language,
    overview: tvShowDetails.overview,
    posterPath: tvShowDetails.poster_path,
    backdropPath: tvShowDetails.backdrop_path,
    firstAirDate: tvShowDetails.first_air_date,
    episodeRunTime: tvShowDetails.episode_run_time,
    numberOfEpisodes: tvShowDetails.number_of_episodes,
    numberOfSeasons: tvShowDetails.number_of_seasons,
    originCountry: tvShowDetails.origin_country,
    languages: tvShowDetails.languages,
    type: tvShowDetails.type,
    popularity: tvShowDetails.popularity,
    voteAverage: tvShowDetails.vote_average,
    voteCount: tvShowDetails.vote_count,
    genres: tvShowDetails.genres,
  }
}

export * from './types.js'
