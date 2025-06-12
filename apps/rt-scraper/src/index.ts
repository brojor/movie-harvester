import type { MovieSource, TvShowSource } from 'packages/types/dist/index.js'
import type { RtDetails } from './types.js'
import { URLSearchParams } from 'node:url'
import { getThrottledClient, normalizeTitle } from '@repo/shared'
import * as cheerio from 'cheerio'
import { getLastRtMovieProcessedDate, getLastRtTvShowProcessedDate, getUnprocessedMovies, getUnprocessedTvShows, saveRtMovieDetails, saveRtTvShowDetails } from './infra/database.js'

const httpClient = getThrottledClient('https://www.rottentomatoes.com', {
  delayMs: [1000, 5000],
})

export async function populateRtMoviesData({ force = true }: { force?: boolean } = {}): Promise<void> {
  const lastRun = force ? new Date(0) : await getLastRtMovieProcessedDate()
  const movies = await getUnprocessedMovies(lastRun)

  for (const movie of movies) {
    const movieId = await findRtMovieSlug(movie)
    if (movieId) {
      const movieDetails = await getMovieDetails(movieId)
      await saveRtMovieDetails(movieDetails, movie.id)
    }
  }
}

export async function populateRtTvShowsData({ force = true }: { force?: boolean } = {}): Promise<void> {
  const lastRun = force ? new Date(0) : await getLastRtTvShowProcessedDate()
  const movies = await getUnprocessedTvShows(lastRun)

  for (const movie of movies) {
    const movieId = await findRtTvShowSlug(movie)
    if (movieId) {
      const tvShowDetails = await getTvShowDetails(movieId)
      await saveRtTvShowDetails(tvShowDetails, movie.id)
    }
  }
}

function parseNullableInt(value: string): number | null {
  const parsed = Number.parseInt(value)
  return Number.isNaN(parsed) ? null : parsed
}

async function findRtMovieSlug(movie: MovieSource): Promise<string | null> {
  const { year } = movie
  const originalTitle = normalizeTitle(movie.originalTitle)

  if (!originalTitle) {
    return null
  }

  const queryString = new URLSearchParams({ search: originalTitle }).toString()
  const html = await httpClient.get(`/search?${queryString}`)

  const $ = cheerio.load(html)
  const url = $('search-page-result[type="movie"] search-page-media-row').filter(function () {
    const parsedTitle = $(this).find('a[data-qa="info-name"]').text().trim()
    const parsedYear = $(this).attr('releaseyear')?.toString().trim()

    return parsedTitle === originalTitle && parsedYear === year.toString()
  }).find('a[data-qa="info-name"]').attr('href')

  const id = url?.split('/').filter(Boolean).pop()

  return id ?? null
}

async function findRtTvShowSlug(tvShow: TvShowSource): Promise<string | null> {
  const originalTitle = normalizeTitle(tvShow.originalTitle)

  if (!originalTitle) {
    return null
  }

  const queryString = new URLSearchParams({ search: originalTitle }).toString()
  const html = await httpClient.get(`/search?${queryString}`)

  const $ = cheerio.load(html)
  const url = $('search-page-result[type="tvSeries"] search-page-media-row').filter(function () {
    const parsedTitle = $(this).find('a[data-qa="info-name"]').text().trim()

    return parsedTitle === originalTitle
  }).find('a[data-qa="info-name"]').attr('href')

  const id = url?.split('/').filter(Boolean).pop()

  return id ?? null
}

async function getMovieDetails(rtSlug: string): Promise<RtDetails> {
  const html = await httpClient.get(`/m/${rtSlug}`)
  const $ = cheerio.load(html)

  const criticsScore = $('media-scorecard rt-text[slot="criticsScore"]').text().trim()
  const audienceScore = $('media-scorecard rt-text[slot="audienceScore"]').text().trim()
  const criticsReviews = $('media-scorecard rt-link[slot="criticsReviews"]').text().trim().replace(/\D/g, '')
  const audienceReviews = $('media-scorecard rt-link[slot="audienceReviews"]').text().trim().replace(/\D/g, '')

  return {
    criticsScore: parseNullableInt(criticsScore),
    audienceScore: parseNullableInt(audienceScore),
    criticsReviews: parseNullableInt(criticsReviews),
    audienceReviews: parseNullableInt(audienceReviews),
    rtId: rtSlug,
  }
}

async function getTvShowDetails(rtSlug: string): Promise<RtDetails> {
  const html = await httpClient.get(`/tv/${rtSlug}`)
  const $ = cheerio.load(html)

  const criticsScore = $('media-scorecard rt-text[slot="criticsScore"]').text().trim()
  const audienceScore = $('media-scorecard rt-text[slot="audienceScore"]').text().trim()
  const criticsReviews = $('media-scorecard rt-link[slot="criticsReviews"]').text().trim().replace(/\D/g, '')
  const audienceReviews = $('media-scorecard rt-link[slot="audienceReviews"]').text().trim().replace(/\D/g, '')

  return {
    criticsScore: parseNullableInt(criticsScore),
    audienceScore: parseNullableInt(audienceScore),
    criticsReviews: parseNullableInt(criticsReviews),
    audienceReviews: parseNullableInt(audienceReviews),
    rtId: rtSlug,
  }
}
