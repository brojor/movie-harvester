import type { MovieSource } from 'packages/types/dist/index.js'
import type { CsfdMovieDetails } from './types.js'
import { URLSearchParams } from 'node:url'
import { getThrottledClient } from '@repo/shared'
import * as cheerio from 'cheerio'
import { getLastCsfdMovieProcessedDate, getUnprocessedMovies, saveCsfdMovieDetails, seedCsfdGenres } from './infra/database.js'
import { findCsfdIdByCzechTitle, findCsfdIdByOriginalTitle, getCzechTitle, getGenres, getOrigin, getOverview, getPosterPath, getVoteAverage, getVoteCount } from './utils/htmlParsing.js'

const httpClient = getThrottledClient('https://www.csfd.cz', {
  delayMs: [1000, 5000],
})

export async function populateCsfdMoviesData({ force = true }: { force?: boolean } = {}): Promise<void> {
  const lastRun = force ? new Date(0) : await getLastCsfdMovieProcessedDate()
  await seedCsfdGenres()
  const movies = await getUnprocessedMovies(lastRun)

  for (const movie of movies) {
    const movieId = await findCsfdSlug(movie)
    if (movieId) {
      const movieDetails = await getMovieDetails(movieId)
      await saveCsfdMovieDetails(movieDetails, movie.id)
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

async function findCsfdSlug(movie: MovieSource): Promise<string | null> {
  const { czechTitle, originalTitle, year } = movie

  let csfdSlug: string | null = null
  if (czechTitle) {
    const html = await searchCsfdMovie(czechTitle, year)
    csfdSlug = await findCsfdIdByCzechTitle(html, czechTitle, year)
  }
  if (!csfdSlug && originalTitle) {
    const html = await searchCsfdMovie(originalTitle, year)
    csfdSlug = await findCsfdIdByOriginalTitle(html, originalTitle, year)
  }

  if (!csfdSlug) {
    console.error(`Movie ${czechTitle} (${year}) not found`)
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
