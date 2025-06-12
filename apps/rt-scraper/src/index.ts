import type { MovieSource } from 'packages/types/dist/index.js'
import type { RtMovieDetails } from './types.js'
import { URLSearchParams } from 'node:url'
import { getThrottledClient, normalizeTitle } from '@repo/shared'
import * as cheerio from 'cheerio'
import { getLastRtMovieProcessedDate, getUnprocessedMovies, saveRtMovieDetails } from './infra/database.js'

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

async function getMovieDetails(rtSlug: string): Promise<RtMovieDetails> {
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
