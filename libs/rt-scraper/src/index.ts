import type { MovieRecord, TvShowRecord } from '@repo/database'
import type { RtDetails } from './types.js'
import { URLSearchParams } from 'node:url'
import { makeHttpClient, normalizeTitle } from '@repo/shared'
import * as cheerio from 'cheerio'

const httpClient = makeHttpClient('https://www.rottentomatoes.com')

function parseNullableInt(value: string): number | null {
  const parsed = Number.parseInt(value)
  return Number.isNaN(parsed) ? null : parsed
}

export async function findRtMovieId(movie: MovieRecord): Promise<string | null> {
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

export async function findRtTvShowId(tvShow: TvShowRecord): Promise<string | null> {
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

export async function getMovieDetails(rtId: string): Promise<RtDetails> {
  const html = await httpClient.get(`/m/${rtId}`)
  const $ = cheerio.load(html)

  const criticsScore = $('media-scorecard rt-text[slot="criticsScore"]').text().trim()
  const audienceScore = $('media-scorecard rt-text[slot="audienceScore"]').text().trim()
  const criticsReviews = $('media-scorecard rt-link[slot="criticsReviews"]').text().trim().replace(/\D/g, '')
  const audienceReviews = $('media-scorecard rt-link[slot="audienceReviews"]').text().trim().replace(/\D/g, '')

  return {
    id: rtId,
    criticsScore: parseNullableInt(criticsScore),
    audienceScore: parseNullableInt(audienceScore),
    criticsReviews: parseNullableInt(criticsReviews),
    audienceReviews: parseNullableInt(audienceReviews),
  }
}

export async function getTvShowDetails(rtId: string): Promise<RtDetails> {
  const html = await httpClient.get(`/tv/${rtId}`)
  const $ = cheerio.load(html)

  const criticsScore = $('media-scorecard rt-text[slot="criticsScore"]').text().trim()
  const audienceScore = $('media-scorecard rt-text[slot="audienceScore"]').text().trim()
  const criticsReviews = $('media-scorecard rt-link[slot="criticsReviews"]').text().trim().replace(/\D/g, '')
  const audienceReviews = $('media-scorecard rt-link[slot="audienceReviews"]').text().trim().replace(/\D/g, '')

  return {
    id: rtId,
    criticsScore: parseNullableInt(criticsScore),
    audienceScore: parseNullableInt(audienceScore),
    criticsReviews: parseNullableInt(criticsReviews),
    audienceReviews: parseNullableInt(audienceReviews),
  }
}

export * from './types.js'
