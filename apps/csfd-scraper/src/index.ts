import type { MovieSource, TvShowSource } from 'packages/types/dist/index.js'
import type { CsfdMovieDetails } from './types.js'
import { URLSearchParams } from 'node:url'
import { getThrottledClient, normalizeTitle } from '@repo/shared'
import { getCsfdMovieIdFromTopic, getCsfdTvShowIdFromTopic } from '@repo/warforum-indexer'
import * as cheerio from 'cheerio'
import { getCsfdTvShowDetails, getLastCsfdMovieProcessedDate, getLastCsfdTvShowProcessedDate, getUnprocessedMovies, getUnprocessedTvShows, saveCsfdMovieDetails, saveCsfdTvShowDetails, seedCsfdGenres } from './infra/database.js'
import { findCsfdMovieSlugByCzechTitle, findCsfdMovieSlugByOriginalTitle, findCsfdTvShowSlugByCzechTitle, findCsfdTvShowSlugByOriginalTitle, getCzechTitle, getGenres, getOrigin, getOverview, getPosterPath, getVoteAverage, getVoteCount } from './utils/htmlParsing.js'

const httpClient = getThrottledClient('https://www.csfd.cz', {
  delayMs: [1000, 5000],
})

export async function populateCsfdMoviesData({ force = true }: { force?: boolean } = {}): Promise<void> {
  const lastRun = force ? new Date(0) : await getLastCsfdMovieProcessedDate()
  await seedCsfdGenres()
  const movies = await getUnprocessedMovies(lastRun)

  for (const movie of movies) {
    const movieId = await findCsfdMovieSlug(movie)
    if (movieId) {
      const movieDetails = await getMovieDetails(movieId)
      await saveCsfdMovieDetails(movieDetails, movie.id)
    }
  }
}

export async function populateCsfdTvShowsData({ force = true }: { force?: boolean } = {}): Promise<void> {
  const lastRun = force ? new Date(0) : await getLastCsfdTvShowProcessedDate()
  await seedCsfdGenres()
  const tvShows = await getUnprocessedTvShows(lastRun)

  for (const tvShow of tvShows) {
    const csfdSlug = await findCsfdTvShowSlug(tvShow)

    if (csfdSlug) {
      const tvShowDetailsFromDb = await getCsfdTvShowDetails(csfdSlug)
      if (tvShowDetailsFromDb) {
        console.error(`Tv show ${tvShow.czechTitle} (${tvShow.originalTitle}) already exists in database`)
        // continue
      }

      const tvShowDetails = await getTvShowDetails(csfdSlug)
      await saveCsfdTvShowDetails(tvShowDetails, tvShow.id)
    }
  }
}

async function searchCsfdMovie(title: string, year: number): Promise<string> {
  const params = {
    q: `${title} ${year}`,
    series: '0',
    creators: '0',
    users: '0',
  }
  const queryString = new URLSearchParams(params).toString()
  const html = await httpClient.get(`/hledat/?${queryString}`)
  return html
}

async function searchCsfdTvShow(title: string): Promise<string> {
  const params = {
    q: title,
    films: '0',
    creators: '0',
    users: '0',
  }
  const queryString = new URLSearchParams(params).toString()
  const html = await httpClient.get(`/hledat/?${queryString}`)
  return html
}

async function findCsfdMovieSlug(movie: MovieSource): Promise<string | null> {
  const { czechTitle, year } = movie
  const originalTitle = normalizeTitle(movie.originalTitle)

  let csfdSlug: string | null = null
  if (czechTitle) {
    const html = await searchCsfdMovie(czechTitle, year)
    csfdSlug = await findCsfdMovieSlugByCzechTitle(html, czechTitle, year)
  }
  if (!csfdSlug && originalTitle) {
    const html = await searchCsfdMovie(originalTitle, year)
    csfdSlug = await findCsfdMovieSlugByOriginalTitle(html, originalTitle, year)
  }

  if (!csfdSlug) {
    csfdSlug = await getCsfdMovieIdFromTopic(movie)
  }

  if (!csfdSlug) {
    console.error(`Movie ${czechTitle} (${year}) not found`)
  }

  return csfdSlug || null
}

async function findCsfdTvShowSlug(tvShow: TvShowSource): Promise<string | null> {
  const { czechTitle } = tvShow
  const originalTitle = normalizeTitle(tvShow.originalTitle)

  let csfdSlug: string | null
  csfdSlug = await getCsfdTvShowIdFromTopic(tvShow)

  if (!csfdSlug && czechTitle) {
    const html = await searchCsfdTvShow(czechTitle)
    csfdSlug = await findCsfdTvShowSlugByCzechTitle(html, czechTitle)
  }
  if (!csfdSlug && originalTitle) {
    const html = await searchCsfdTvShow(originalTitle)
    csfdSlug = await findCsfdTvShowSlugByOriginalTitle(html, originalTitle)
  }

  if (!csfdSlug) {
    console.error(`Tv show ${czechTitle} not found`)
  }

  return csfdSlug || null
}

async function getMovieDetails(csfdSlug: string): Promise<CsfdMovieDetails> {
  const html = await httpClient.get(`/film/${csfdSlug}/prehled/`)
  const $ = cheerio.load(html)

  return {
    ...getOrigin($),
    title: getCzechTitle($),
    voteAverage: getVoteAverage($),
    voteCount: getVoteCount($),
    posterPath: getPosterPath($),
    overview: getOverview($),
    genres: getGenres($),
    csfdId: csfdSlug,
  }
}

async function getTvShowDetails(csfdSlug: string): Promise<Omit<CsfdMovieDetails, 'runtime' | 'originalTitle' | 'releaseYear'>> {
  const html = await httpClient.get(`/film/${csfdSlug}/prehled/`)
  const $ = cheerio.load(html)

  return {
    title: getCzechTitle($),
    voteAverage: getVoteAverage($),
    voteCount: getVoteCount($),
    posterPath: getPosterPath($),
    overview: getOverview($),
    genres: getGenres($),
    csfdId: csfdSlug,
  }
}
